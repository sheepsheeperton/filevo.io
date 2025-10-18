-- Migration: Add recipient and notification fields to requests table
-- Date: 2025-01-15
-- Description: Extends requests table with recipient contact info and notification preferences

-- Add new columns to requests table
ALTER TABLE requests 
ADD COLUMN recipient_name TEXT,
ADD COLUMN recipient_email TEXT,
ADD COLUMN recipient_phone TEXT,
ADD COLUMN notify_pref TEXT CHECK (notify_pref IN ('email', 'sms', 'both')),
ADD COLUMN notified_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for performance
CREATE INDEX idx_requests_recipient_email ON requests(recipient_email);
CREATE INDEX idx_requests_notified_at ON requests(notified_at);

-- Add comments for documentation
COMMENT ON COLUMN requests.recipient_name IS 'Name of the person who will receive the document request';
COMMENT ON COLUMN requests.recipient_email IS 'Email address for notifications';
COMMENT ON COLUMN requests.recipient_phone IS 'Phone number for SMS notifications';
COMMENT ON COLUMN requests.notify_pref IS 'Preferred notification channel: email, sms, or both';
COMMENT ON COLUMN requests.notified_at IS 'Timestamp when notification was successfully sent';
