CREATE TYPE contribution_status AS ENUM ('pending', 'paid', 'expired');

CREATE TABLE IF NOT EXISTS booking_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  amount_owed numeric NOT NULL,
  amount_paid numeric DEFAULT 0,
  status contribution_status DEFAULT 'pending',
  created_at timestamp default now(),
  updated_at timestamp default now()
);
