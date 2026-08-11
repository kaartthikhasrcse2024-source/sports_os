CREATE TABLE IF NOT EXISTS athletic_profiles (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  height_cm INTEGER,
  weight_kg DECIMAL,
  dominant_foot_hand TEXT CHECK (dominant_foot_hand IN ('left', 'right', 'ambidextrous')),
  primary_position TEXT,
  secondary_positions TEXT[],
  sprint_10m_sec DECIMAL,
  vertical_jump_cm DECIMAL,
  stamina_rating INTEGER CHECK (stamina_rating >= 1 AND stamina_rating <= 100),
  overall_athletic_score DECIMAL,
  playing_status TEXT CHECK (playing_status IN ('free_agent', 'in_team', 'rehabilitating')),
  open_for_scouting BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE athletic_profiles ENABLE ROW LEVEL SECURITY;

-- Select policy: anyone can read
CREATE POLICY "Public profiles are viewable by everyone" ON athletic_profiles
  FOR SELECT USING (true);

-- Update policy: only owner can update their profile
CREATE POLICY "Users can insert their own profile" ON athletic_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON athletic_profiles
  FOR UPDATE USING (auth.uid() = id);
