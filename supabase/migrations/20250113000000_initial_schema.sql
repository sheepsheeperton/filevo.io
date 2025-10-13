-- Filevo Initial Schema Migration
-- Created: 2025-01-13
-- Description: Complete database schema with RLS policies

-- PROFILES (maps to auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text check (role in ('manager','external')) default 'manager',
  created_at timestamp with time zone default now()
);

-- PROPERTIES
create table if not exists properties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamp with time zone default now()
);

-- PROPERTY_USERS (M:N relationship)
create table if not exists property_users (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  unique(property_id, user_id)
);

-- REQUESTS
create table if not exists requests (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id) on delete cascade,
  title text not null,
  description text,
  due_date date,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamp with time zone default now()
);

-- REQUEST STATUS ENUM
create type request_status as enum ('pending','received','past_due');

-- REQUEST_ITEMS
create table if not exists request_items (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references requests(id) on delete cascade,
  tag text not null,
  upload_token text unique,
  status request_status default 'pending',
  last_reminder_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- FILES
create table if not exists files (
  id uuid primary key default gen_random_uuid(),
  request_item_id uuid references request_items(id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  uploaded_by uuid references profiles(id),
  uploaded_at timestamp with time zone default now()
);

-- ACTIVITY_LOGS
create table if not exists activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor uuid references profiles(id),
  action text not null,
  entity text not null,
  entity_id uuid,
  created_at timestamp with time zone default now()
);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

alter table profiles enable row level security;
alter table properties enable row level security;
alter table property_users enable row level security;
alter table requests enable row level security;
alter table request_items enable row level security;
alter table files enable row level security;
alter table activity_logs enable row level security;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- PROFILES: Users can read and update their own profile
create policy "profiles self read" 
  on profiles for select 
  using (auth.uid() = id);

create policy "profiles self update" 
  on profiles for update 
  using (auth.uid() = id);

-- PROPERTIES: Readable by creator or members
create policy "properties read by creator or member"
  on properties for select using (
    created_by = auth.uid() OR
    exists (
      select 1 from property_users pu 
      where pu.property_id = properties.id 
        and pu.user_id = auth.uid()
    )
  );

-- PROPERTY_USERS: Readable by property creator or members
create policy "property_users read by property access"
  on property_users for select using (
    exists (
      select 1 from properties p
      where p.id = property_users.property_id
        and (p.created_by = auth.uid() 
             or exists (
               select 1 from property_users pu2 
               where pu2.property_id = p.id 
                 and pu2.user_id = auth.uid()
             ))
    )
  );

-- REQUESTS: Readable via property access
create policy "requests read via property access"
  on requests for select using (
    exists (
      select 1 from properties p
      where p.id = requests.property_id
        and (p.created_by = auth.uid()
             or exists (
               select 1 from property_users pu 
               where pu.property_id = p.id 
                 and pu.user_id = auth.uid()
             ))
    )
  );

-- REQUEST_ITEMS: Readable via request access
create policy "request_items read via request access"
  on request_items for select using (
    exists (
      select 1 from requests r
      join properties p on p.id = r.property_id
      where r.id = request_items.request_id
        and (p.created_by = auth.uid()
             or exists (
               select 1 from property_users pu 
               where pu.property_id = p.id 
                 and pu.user_id = auth.uid()
             ))
    )
  );

-- FILES: Readable via item access
create policy "files read via item access"
  on files for select using (
    exists (
      select 1 from request_items ri
      join requests r on r.id = ri.request_id
      join properties p on p.id = r.property_id
      where files.request_item_id = ri.id
        and (p.created_by = auth.uid()
             or exists (
               select 1 from property_users pu 
               where pu.property_id = p.id 
                 and pu.user_id = auth.uid()
             ))
    )
  );

-- ACTIVITY_LOGS: Readable via property-related entities
create policy "activity_logs read via access"
  on activity_logs for select using (
    actor = auth.uid() or
    exists (
      select 1 from properties p
      where p.id = activity_logs.entity_id
        and p.created_by = auth.uid()
    )
  );

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

create index if not exists idx_properties_created_by on properties(created_by);
create index if not exists idx_property_users_property on property_users(property_id);
create index if not exists idx_property_users_user on property_users(user_id);
create index if not exists idx_requests_property on requests(property_id);
create index if not exists idx_request_items_request on request_items(request_id);
create index if not exists idx_request_items_token on request_items(upload_token);
create index if not exists idx_request_items_status on request_items(status);
create index if not exists idx_files_item on files(request_item_id);
create index if not exists idx_activity_logs_entity on activity_logs(entity, entity_id);
create index if not exists idx_activity_logs_created on activity_logs(created_at desc);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to automatically create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'manager');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on auth.users insert
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================================
-- COMMENTS
-- ============================================================================

comment on table profiles is 'User profiles (1:1 with auth.users)';
comment on table properties is 'Properties managed by users';
comment on table property_users is 'M:N relationship between properties and users';
comment on table requests is 'Document requests for properties';
comment on table request_items is 'Individual items within a request';
comment on table files is 'Uploaded file metadata (actual files in Storage)';
comment on table activity_logs is 'Audit trail of user actions';

