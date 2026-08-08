CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TYPE slot_status AS ENUM ('available', 'held', 'booked', 'expired');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed');

CREATE TABLE IF NOT EXISTS facilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users,
  name text,
  address text,
  location geography(Point,4326),
  amenities jsonb,
  created_at timestamp default now()
);

CREATE TABLE IF NOT EXISTS courts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid REFERENCES facilities(id),
  name text,
  sport_type text,
  base_price_per_hour numeric
);

CREATE TABLE IF NOT EXISTS slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id uuid REFERENCES courts(id),
  start_time timestamp,
  end_time timestamp,
  status slot_status,
  updated_at timestamp default now()
);

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id uuid REFERENCES slots(id),
  user_id uuid REFERENCES auth.users,
  status booking_status,
  total_amount numeric,
  created_at timestamp default now()
);

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id),
  amount numeric,
  status payment_status,
  created_at timestamp default now()
);
