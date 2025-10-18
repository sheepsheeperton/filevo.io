-- Add missing RLS policy for profiles table
-- This allows users to create their own profile

-- PROFILES: Users can insert their own profile
create policy "profiles self insert" 
  on profiles for insert 
  with check (auth.uid() = id);
