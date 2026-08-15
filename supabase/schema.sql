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
create table if not exists public.announcements (id uuid primary key default gen_random_uuid(), title text not null, body text not null, category text default 'Notice', created_by uuid references auth.users(id), created_at timestamptz default now());
create table if not exists public.events (id uuid primary key default gen_random_uuid(), title text not null, event_date date not null, location text, status text default 'Open', created_by uuid references auth.users(id), created_at timestamptz default now());
create table if not exists public.event_rsvps (id uuid primary key default gen_random_uuid(), event_id uuid references public.events(id) on delete cascade, member_id uuid references public.profiles(id) on delete cascade, response text default 'attending', created_at timestamptz default now(), unique(event_id, member_id));
