-- Drop existing table if it exists to start fresh
DROP TABLE IF EXISTS magic_link_tokens CASCADE;

-- Create the magic_link_tokens table with proper structure
CREATE TABLE magic_link_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_signup BOOLEAN DEFAULT FALSE
);

-- Add RLS policies
ALTER TABLE magic_link_tokens ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert tokens (for our API)
CREATE POLICY "Allow authenticated users to insert magic link tokens"
ON magic_link_tokens FOR INSERT TO authenticated WITH CHECK (TRUE);

-- Allow authenticated users to select their own tokens
CREATE POLICY "Allow authenticated users to select their own magic link tokens"
ON magic_link_tokens FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Allow authenticated users to delete their own tokens
CREATE POLICY "Allow authenticated users to delete their own magic link tokens"
ON magic_link_tokens FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX idx_magic_link_tokens_token ON magic_link_tokens (token);
CREATE INDEX idx_magic_link_tokens_email ON magic_link_tokens (email);
CREATE INDEX idx_magic_link_tokens_user_id ON magic_link_tokens (user_id);
CREATE INDEX idx_magic_link_tokens_expires_at ON magic_link_tokens (expires_at);

-- Create a function to clean up expired tokens (optional, for maintenance)
CREATE OR REPLACE FUNCTION cleanup_expired_magic_link_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM magic_link_tokens WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON magic_link_tokens TO authenticated;
