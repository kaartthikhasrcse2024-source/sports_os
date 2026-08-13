CREATE TABLE IF NOT EXISTS venue_lease_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    organizer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    requested_slots JSONB NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Note: In PostgreSQL, if we want to modify an existing table robustly without dropping:
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS home_turf_id UUID REFERENCES facilities(id) ON DELETE SET NULL;
