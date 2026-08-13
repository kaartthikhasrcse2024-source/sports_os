-- Part 2: Unified Verification Shared Component Schema

-- We extend the verification state enum from the profiles
DO $$ BEGIN
    CREATE TYPE verification_state AS ENUM('PENDING', 'VERIFIED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE verification_document_type AS ENUM('BUSINESS_TAX_ID', 'GOVT_ID', 'OWNERSHIP_PROOF', 'ORGANIZER_CERTIFICATION');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Drop any previous exclusive implementations if present
-- DROP TABLE IF EXISTS turf_owner_documents;

CREATE TABLE IF NOT EXISTS verification_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    actor_role user_role NOT NULL,
    document_type verification_document_type NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    review_status verification_state DEFAULT 'PENDING',
    reviewer_notes TEXT NULL
);

-- Indexing for Admin quick sorting by status and role
CREATE INDEX IF NOT EXISTS verification_docs_status_idx ON verification_documents (review_status);
CREATE INDEX IF NOT EXISTS verification_docs_profile_idx ON verification_documents (profile_id);
