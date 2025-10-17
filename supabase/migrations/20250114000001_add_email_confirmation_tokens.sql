-- Create email confirmation tokens table
CREATE TABLE IF NOT EXISTS email_confirmation_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_confirmation_tokens_token ON email_confirmation_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_confirmation_tokens_user_id ON email_confirmation_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_confirmation_tokens_email ON email_confirmation_tokens(email);
CREATE INDEX IF NOT EXISTS idx_email_confirmation_tokens_expires_at ON email_confirmation_tokens(expires_at);

-- Add RLS policies
ALTER TABLE email_confirmation_tokens ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage tokens
CREATE POLICY "Service role can manage email confirmation tokens" ON email_confirmation_tokens
  FOR ALL USING (auth.role() = 'service_role');

-- Clean up expired tokens function
CREATE OR REPLACE FUNCTION cleanup_expired_email_confirmation_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM email_confirmation_tokens 
  WHERE expires_at < NOW() OR (used_at IS NOT NULL AND created_at < NOW() - INTERVAL '1 day');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a scheduled job to clean up expired tokens (if you have pg_cron enabled)
-- SELECT cron.schedule('cleanup-email-confirmation-tokens', '0 */6 * * *', 'SELECT cleanup_expired_email_confirmation_tokens();');
