-- 1. Modify user_role to strict uppercase ENUM and add TOURNAMENT_ORGANIZER.
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM('PLAYER', 'TURF_OWNER', 'TOURNAMENT_ORGANIZER', 'REFEREE', 'ADMIN', 'VENUE_OWNER', 'player', 'venue_owner', 'referee', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enforce casting on the profile table in case it was text or lowercase
ALTER TABLE profiles ALTER COLUMN role DROP DEFAULT;
ALTER TABLE profiles ALTER COLUMN role TYPE user_role USING UPPER(role::text)::user_role;
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'PLAYER'::user_role;

-- Create verification status ENUMs
DO $$ BEGIN
    CREATE TYPE verification_state AS ENUM('PENDING', 'VERIFIED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Add Role-Specific Verification Columns to Profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS otp_verified_at TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN IF NOT EXISTS business_tax_id TEXT NULL,
ADD COLUMN IF NOT EXISTS govt_verification_status verification_state DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS geo_location geography(Point, 4326) NULL,
ADD COLUMN IF NOT EXISTS organizer_cert_id TEXT NULL,
ADD COLUMN IF NOT EXISTS verification_status verification_state DEFAULT 'PENDING';

-- 3. GIST Index on Profiles (Geospatial Matching)
CREATE INDEX IF NOT EXISTS profiles_geo_location_idx ON profiles USING GIST (geo_location);

-- 4. Transactions Ledger Table
DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM('BOOKING', 'PAYOUT', 'TOURNAMENT_ENTRY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type transaction_type NOT NULL,
    actor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    actor_role user_role NOT NULL,
    gross_amount INT NOT NULL,     -- Integer Cents/Paise
    platform_fee INT NOT NULL,     -- Integer Cents/Paise
    net_amount INT NOT NULL,       -- Integer Cents/Paise
    related_booking_id UUID NULL,  
    related_tournament_id UUID NULL, 
    status TEXT NOT NULL DEFAULT 'COMPLETED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Force integer constraints mathematically just in case
ALTER TABLE transactions ADD CONSTRAINT chk_transactions_net_math CHECK (net_amount = gross_amount - platform_fee OR net_amount = gross_amount + platform_fee /* payout context */);

-- 5. Fix Supabase Handle New User Trigger Profile Schema
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'New User'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'PLAYER')::user_role
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
