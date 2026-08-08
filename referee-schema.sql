-- Use generic enums mapping profile availability correctly
DO $$ BEGIN
    CREATE TYPE availability_status AS ENUM ('open_to_play', 'looking_for_team', 'not_available');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY, -- Usually references auth.users(id), dynamically handled across our app bounds
  role text DEFAULT 'player',
  name text,
  availability_status availability_status DEFAULT 'not_available',
  sport_type text,
  position text,
  win_rate numeric DEFAULT 0,
  created_at timestamp DEFAULT now()
);

-- Ensure profiles is safely initialized by injecting missing structures natively if they already exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='availability_status') THEN
      ALTER TABLE profiles ADD COLUMN availability_status availability_status DEFAULT 'not_available';
      ALTER TABLE profiles ADD COLUMN sport_type text;
      ALTER TABLE profiles ADD COLUMN position text;
      ALTER TABLE profiles ADD COLUMN win_rate numeric DEFAULT 0;
  END IF;
END $$;

ALTER TABLE bracket_matches
ADD COLUMN IF NOT EXISTS referee_id uuid REFERENCES profiles(id);

CREATE TABLE IF NOT EXISTS match_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES bracket_matches(id) ON DELETE CASCADE,
  player_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  goals int DEFAULT 0,
  points int DEFAULT 0,
  fouls int DEFAULT 0,
  yellow_cards int DEFAULT 0,
  red_cards int DEFAULT 0,
  minutes_played int DEFAULT 0,
  created_at timestamp DEFAULT now()
);
