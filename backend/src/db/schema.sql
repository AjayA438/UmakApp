-- ════════════════════════════════════════════════════════════════════
--  Campus OS – PostgreSQL schema (Supabase SQL Editor)
--  Run this once in:  Supabase Dashboard → SQL Editor → New query
-- ════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ── USERS ───────────────────────────────────────────────────────────
create table if not exists users (
  id                  uuid primary key default gen_random_uuid(),
  email               text not null unique,
  password_hash       text not null,
  full_name           text not null,
  student_id          text unique,
  school_name         text,
  avatar_url          text,
  language            text not null default 'en',
  reset_token_hash    text,
  reset_token_expires timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_users_email on users (lower(email));

-- ── COURSES ─────────────────────────────────────────────────────────
create table if not exists courses (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users (id) on delete cascade,
  name       text not null,
  code       text,
  instructor text,
  room       text,
  color      text not null default '#14532D',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_courses_user on courses (user_id);

-- ── SCHEDULES (weekly recurrence for a course) ──────────────────────
-- day_of_week: 0 = Sunday … 6 = Saturday (same convention as JS Date#getDay)
create table if not exists schedules (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references courses (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time  time not null,
  end_time    time not null,
  created_at  timestamptz not null default now(),
  constraint schedules_time_order check (end_time > start_time)
);

create index if not exists idx_schedules_course on schedules (course_id);

-- ── TASKS ───────────────────────────────────────────────────────────
create table if not exists tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users (id) on delete cascade,
  course_id   uuid references courses (id) on delete set null,
  title       text not null,
  description text,
  due_date    date,
  status      text not null default 'pending' check (status in ('pending', 'done')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_tasks_user on tasks (user_id);
create index if not exists idx_tasks_user_status on tasks (user_id, status);
create index if not exists idx_tasks_due on tasks (due_date);
