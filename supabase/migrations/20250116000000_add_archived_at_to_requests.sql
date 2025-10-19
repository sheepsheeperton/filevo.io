-- Add archived_at column to requests table
ALTER TABLE requests ADD COLUMN archived_at TIMESTAMPTZ NULL;

-- Add index for better query performance
CREATE INDEX idx_requests_archived_at ON requests(archived_at) WHERE archived_at IS NULL;
