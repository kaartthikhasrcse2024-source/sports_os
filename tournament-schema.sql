DO $$ BEGIN
    CREATE TYPE tournament_format AS ENUM ('single_elim', 'double_elim', 'round_robin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid REFERENCES facilities(id),
  name text NOT NULL,
  format tournament_format NOT NULL,
  max_teams int NOT NULL,
  start_date timestamp NOT NULL,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tournament_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid REFERENCES tournaments(id) ON DELETE CASCADE,
  team_name text NOT NULL,
  captain_id uuid, -- Keeping decoupled from strict auth.users for mock generation tests safely
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bracket_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid REFERENCES tournaments(id) ON DELETE CASCADE,
  round int NOT NULL,
  match_index int NOT NULL,
  team_a_id uuid REFERENCES tournament_teams(id) ON DELETE CASCADE,
  team_b_id uuid REFERENCES tournament_teams(id) ON DELETE CASCADE,
  winner_id uuid REFERENCES tournament_teams(id) ON DELETE CASCADE,
  next_match_id uuid REFERENCES bracket_matches(id),
  court_slot_id uuid REFERENCES slots(id),
  created_at timestamp DEFAULT now()
);



            CREATE TABLE IF NOT EXISTS tournament_team_players (
                team_id uuid REFERENCES tournament_teams(id) ON DELETE CASCADE,
                player_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
                joined_at timestamp DEFAULT now(),
                status text DEFAULT 'ACTIVE',
                PRIMARY KEY (team_id, player_id)
            );
        