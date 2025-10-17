-- Create the magic_link_tokens table
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

CREATE POLICY "Allow all authenticated users to insert magic link tokens"
ON magic_link_tokens FOR INSERT TO authenticated WITH CHECK (TRUE);

CREATE POLICY "Allow all authenticated users to select their own magic link tokens"
ON magic_link_tokens FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Allow all authenticated users to delete their own magic link tokens"
ON magic_link_tokens FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Index for faster lookups
CREATE INDEX idx_magic_link_tokens_token ON magic_link_tokens (token);
CREATE INDEX idx_magic_link_tokens_email ON magic_link_tokens (email);
CREATE INDEX idx_magic_link_tokens_user_id ON magic_link_tokens (user_id);
