-- Olala: локальная настройка через pgAdmin / psql (от имени postgres)
-- 1) Подключитесь к базе postgres
-- 2) Выполните блок «Роль и база»
-- 3) Переключитесь на базу olala и выполните schema.sql (или весь файл ниже)

-- ── Роль и база ──────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'olala') THEN
    CREATE ROLE olala WITH LOGIN PASSWORD 'olala';
  ELSE
    ALTER ROLE olala WITH LOGIN PASSWORD 'olala';
  END IF;
END
$$;

SELECT 'CREATE DATABASE olala OWNER olala'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'olala')\gexec

-- ── Далее подключитесь к базе olala и выполните schema.sql ──
-- Файл: e:\olala\schema.sql
