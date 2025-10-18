-- Add public access policy for request_items via upload_token
-- This allows the public upload page to access request_items using upload tokens

-- REQUEST_ITEMS: Allow public read access via upload_token
create policy "request_items public read via token"
  on request_items for select
  using (upload_token is not null);
