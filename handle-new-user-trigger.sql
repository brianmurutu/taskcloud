-- ============================================================
-- TaskCloud: Auto-create profile on user signup
-- Run this in Supabase SQL Editor
-- ============================================================

-- Drop old trigger/function if they exist
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Function: copies auth.users data into public.profiles
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    avatar_url,
    phone,
    country,
    created_at,
    updated_at
  )
  values (
    new.id,
    new.email,
    -- Google OAuth puts the name in raw_user_meta_data->>'full_name'
    -- Email signup puts it there too (we set it in signUp options.data)
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',   -- Google sometimes uses 'name'
      split_part(new.email, '@', 1)       -- fallback: use email prefix
    ),
    -- Google OAuth provides avatar_url / picture
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    ),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'country', 'Kenya'),
    now(),
    now()
  )
  on conflict (id) do update
    set
      email      = excluded.email,
      full_name  = coalesce(excluded.full_name, profiles.full_name),
      avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url),
      updated_at = now();

  return new;
end;
$$;

-- Trigger: fires after every new user insert in auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- RLS Policies for profiles table
-- ============================================================

alter table public.profiles enable row level security;

-- Users can read their own profile
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Users can update their own profile
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Allow public profile viewing (for task marketplace - other users can see basic info)
drop policy if exists "Public profiles are viewable" on public.profiles;
create policy "Public profiles are viewable"
  on public.profiles for select
  using (true);
