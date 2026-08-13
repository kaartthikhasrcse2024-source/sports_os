-- RBAC Schema Adjustments

-- 1. Ensure `profiles` has a `home_turf_id` linking to `facilities`
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS home_turf_id UUID REFERENCES facilities(id);

-- 2. Enforce Row Level Security (RLS) on `profiles` to strictly segment reads
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing generic access policies safely if they exist
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON profiles;
DROP POLICY IF EXISTS "Players can read own profile" ON profiles;
DROP POLICY IF EXISTS "Owners can read players registered to their turf" ON profiles;

-- RECREATE POLICIES:
-- Users can insert and update their own profile
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);

-- Players can ALWAYS read their own profile
CREATE POLICY "Players can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);

-- Turf Owners can read profiles of players WHO are registered to a turf they own
-- We check if there exists a facility matching home_turf_id where the facility owner_id is the user
CREATE POLICY "Owners can read players registered to their turf" ON profiles FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM facilities f 
        WHERE f.id = profiles.home_turf_id 
        AND f.owner_id = auth.uid()
    )
);
