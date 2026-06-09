-- Olala Flower Shop — PostgreSQL schema (VPS)

create table if not exists public.users (
  id             uuid primary key default gen_random_uuid(),
  email          text not null unique,
  name           text not null default '',
  phone          text not null default '',
  is_admin       boolean not null default false,
  created_at     timestamptz not null default now(),
  last_login_at  timestamptz
);

create table if not exists public.dates (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.users(id) on delete cascade,
  occasion           text not null default '',
  custom_name        text not null default '',
  date               date not null,
  recipient_name     text not null default '',
  recipient_phone    text not null default '',
  recipient_socials  text not null default '',
  address            text not null default '',
  budget             text not null check (budget in ('small','medium','large','vip')),
  budget_mode        text not null check (budget_mode in ('catalog','florist_choice')),
  selected_photo_url text not null default '',
  note               text not null default '',
  created_at         timestamptz not null default now()
);

create index if not exists dates_user_id_idx on public.dates(user_id);
create index if not exists dates_date_idx on public.dates(date);

grant all privileges on all tables in schema public to olala;
grant all privileges on all sequences in schema public to olala;
alter default privileges in schema public grant all on tables to olala;
alter default privileges in schema public grant all on sequences to olala;
