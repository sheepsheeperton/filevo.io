-- Filevo Seed Data
-- NOTE: These are example placeholders. Replace UUIDs with actual values after user signup.
-- Run this AFTER you have created a user account via the Filevo sign-in flow.

-- Example: Insert test property (replace 'your-user-id' with actual auth.users.id)
/*
insert into properties (id, name, address, created_by) values
  ('11111111-1111-1111-1111-111111111111', '123 Main St Apartments', '123 Main St, Boston, MA', 'your-user-id'),
  ('22222222-2222-2222-2222-222222222222', 'Ocean View Condos', '456 Beach Blvd, Miami, FL', 'your-user-id');

-- Example: Insert test request
insert into requests (id, property_id, title, description, due_date, created_by) values
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Tenant Move-In Documents', 'Required documents for new tenant', '2025-02-01', 'your-user-id');

-- Example: Insert test request items with tokens
insert into request_items (id, request_id, tag, upload_token, status) values
  ('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'Drivers License', 'tok_abc123xyz', 'pending'),
  ('55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', 'Proof of Income', 'tok_def456uvw', 'pending'),
  ('66666666-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333', 'Bank Statements', 'tok_ghi789rst', 'pending');
*/

-- To use this seed data:
-- 1. Sign in to Filevo to create your user account
-- 2. Get your user ID from the profiles table: SELECT id FROM profiles LIMIT 1;
-- 3. Replace 'your-user-id' in the INSERT statements above with your actual ID
-- 4. Uncomment the statements and run them in the Supabase SQL Editor

