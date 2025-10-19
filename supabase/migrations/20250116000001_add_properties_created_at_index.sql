-- Add index on properties.created_at for faster ordering
create index if not exists idx_properties_created_at on properties(created_at desc);
