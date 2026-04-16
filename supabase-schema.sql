-- ============================================================
-- Olala Flower Shop — схема базы данных
-- Выполнить в Supabase → SQL Editor
-- ============================================================

-- Таблица пользователей
create table if not exists public.users (
  id             uuid primary key default gen_random_uuid(),
  email          text not null unique,
  name           text not null default '',
  phone          text not null default '',
  is_admin       boolean not null default false,
  created_at     timestamptz not null default now(),
  last_login_at  timestamptz
);

-- Таблица дат/праздников
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

-- Индекс для быстрой выборки дат пользователя
create index if not exists dates_user_id_idx on public.dates(user_id);
create index if not exists dates_date_idx on public.dates(date);

-- ── Row Level Security ────────────────────────────────────────

alter table public.users enable row level security;
alter table public.dates enable row level security;

-- Политики для users:
-- Пользователь видит только свою строку (по email в JWT)
-- Вставка и обновление — только через service_role (наш бэкенд)

create policy "users: select own" on public.users
  for select using (email = current_setting('request.jwt.claims', true)::json->>'email');

create policy "users: service_role full access" on public.users
  using (true)
  with check (true);

-- Политики для dates:
-- Пользователь читает только свои даты

create policy "dates: select own" on public.dates
  for select using (
    user_id = (
      select id from public.users
      where email = current_setting('request.jwt.claims', true)::json->>'email'
      limit 1
    )
  );

create policy "dates: service_role full access" on public.dates
  using (true)
  with check (true);

-- ── Администратор ─────────────────────────────────────────────
-- Вставить запись для admin (создастся автоматически при первом входе,
-- но is_admin нужно выставить вручную или через триггер)

-- После создания таблиц — вручную задать is_admin для admin@olala-flowers.ru:
-- update public.users set is_admin = true where email = 'admin@olala-flowers.ru';
