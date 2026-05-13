-- Run this in Supabase SQL editor.

create table if not exists public.university_messages (
  id bigint generated always as identity primary key,
  tracking_code text unique not null,
  university text not null,
  student_name text not null,
  student_email text not null,
  question text not null,
  status text not null default 'new',
  reply text,
  created_at timestamptz not null default now(),
  replied_at timestamptz
);

create table if not exists public.university_admins (
  id bigint generated always as identity primary key,
  email text unique not null,
  university text not null
);

alter table public.university_messages enable row level security;
alter table public.university_admins enable row level security;

-- Students can insert messages and check by code+email.
create policy if not exists "students_insert_messages"
on public.university_messages for insert
to anon, authenticated
with check (true);

create policy if not exists "students_check_own_message"
on public.university_messages for select
to anon, authenticated
using (true);

-- University admins list.
create policy if not exists "admins_read_admin_mapping"
on public.university_admins for select
to authenticated
using (true);

-- NOTE:
-- For stricter security, replace permissive select with RPCs or
-- add JWT claims per university and policy filters by claim.
