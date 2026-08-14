-- Taprobana Sports Club premium launch schema
-- Run this in Supabase SQL Editor before going live.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  phone text,
  profession text,
  company text,
  membership_no text unique,
  role text default 'member' check (role in ('member','admin')),
  status text default 'active' check (status in ('active','pending','suspended')),
  founding_member boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  category text default 'Notice',
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_date date not null,
  location text,
  status text default 'Open',
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create table if not exists public.event_rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade,
  member_id uuid references public.profiles(id) on delete cascade,
  response text default 'attending',
  created_at timestamptz default now(),
  unique(event_id, member_id)
);

alter table public.profiles enable row level security;
alter table public.announcements enable row level security;
alter table public.events enable row level security;
alter table public.event_rsvps enable row level security;

create policy "members can read own profile" on public.profiles for select using (auth.uid() = id);
create policy "members can insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "members can update own profile" on public.profiles for update using (auth.uid() = id);

create policy "authenticated can read announcements" on public.announcements for select using (auth.role() = 'authenticated');
create policy "authenticated can read events" on public.events for select using (auth.role() = 'authenticated');
create policy "members can manage own rsvps" on public.event_rsvps for all using (auth.uid() = member_id) with check (auth.uid() = member_id);

-- Admin write policies use the profiles.role field.
create policy "admins can write announcements" on public.announcements for insert with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy "admins can write events" on public.events for insert with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

insert into public.announcements (title, body, category)
values
('Digital Platform Launch', 'Welcome to the official digital home of Taprobana Sports Club.', 'Launch'),
('Founding Digital Member Badge', 'Members joining during launch will carry the Founding Digital Member badge.', 'Membership')
on conflict do nothing;

insert into public.events (title, event_date, location, status)
values
('Annual Gathering & Appreciation Night', '2026-08-15', 'Dubai', 'Open'),
('Taprobana Cricket Challenge', '2026-09-01', 'UAE', 'Coming Soon')
on conflict do nothing;
