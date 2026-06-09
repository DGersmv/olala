#!/bin/bash
set -euo pipefail

DB_PASS="${1:-$(openssl rand -hex 16)}"

sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='olala'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE USER olala WITH PASSWORD '$DB_PASS';"

sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='olala'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE DATABASE olala OWNER olala;"

sudo -u postgres psql -d olala -f /var/www/olala/schema.sql
sudo -u postgres psql -d olala -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO olala; GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO olala;"

ENV_FILE="/var/www/olala/.env.local"
# Remove old Supabase vars
sed -i '/^NEXT_PUBLIC_SUPABASE_/d;/^SUPABASE_SERVICE_ROLE_KEY=/d' "$ENV_FILE"
# Update or append DATABASE_URL
if grep -q '^DATABASE_URL=' "$ENV_FILE"; then
  sed -i "s|^DATABASE_URL=.*|DATABASE_URL=postgresql://olala:${DB_PASS}@127.0.0.1:5432/olala|" "$ENV_FILE"
else
  printf '\nDATABASE_URL=postgresql://olala:%s@127.0.0.1:5432/olala\n' "$DB_PASS" >> "$ENV_FILE"
fi

echo "OK: PostgreSQL ready"
echo "DATABASE_URL=postgresql://olala:${DB_PASS}@127.0.0.1:5432/olala"
