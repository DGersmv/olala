# Local PostgreSQL setup for Olala (Windows)
#
# Interactive:
#   .\scripts\setup-postgres-windows.ps1
#
# With password:
#   $env:POSTGRES_PASSWORD = "your_postgres_password"
#   .\scripts\setup-postgres-windows.ps1

param(
  [string]$PostgresPassword = $env:POSTGRES_PASSWORD,
  [string]$DbUser = "olala",
  [string]$DbPass = "olala",
  [string]$DbName = "olala"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
$Schema = Join-Path $Root "schema.sql"

$psql = Get-ChildItem "C:\Program Files\PostgreSQL" -Recurse -Filter psql.exe -ErrorAction SilentlyContinue |
  Sort-Object { [int]($_.Directory.Parent.Name -replace '\D', '') } -Descending |
  Select-Object -First 1 -ExpandProperty FullName

if (-not $psql) {
  Write-Error "psql.exe not found. Install PostgreSQL from https://www.postgresql.org/download/windows/"
}

if (-not $PostgresPassword) {
  $secure = Read-Host "postgres user password (set during PostgreSQL install)" -AsSecureString
  $PostgresPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  )
}

$env:PGPASSWORD = $PostgresPassword

Write-Host "== Connect to PostgreSQL =="
& $psql -U postgres -h 127.0.0.1 -d postgres -c "SELECT version();" | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Error "Cannot login as postgres. Check password and postgresql-x64-* service."
}

Write-Host "== Role $DbUser =="
$roleExists = & $psql -U postgres -h 127.0.0.1 -d postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DbUser';"
if ($roleExists -ne "1") {
  & $psql -U postgres -h 127.0.0.1 -d postgres -c "CREATE ROLE $DbUser WITH LOGIN PASSWORD '$DbPass';"
} else {
  & $psql -U postgres -h 127.0.0.1 -d postgres -c "ALTER ROLE $DbUser WITH LOGIN PASSWORD '$DbPass';"
}

Write-Host "== Database $DbName =="
$dbExists = & $psql -U postgres -h 127.0.0.1 -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DbName';"
if ($dbExists -ne "1") {
  & $psql -U postgres -h 127.0.0.1 -d postgres -c "CREATE DATABASE $DbName OWNER $DbUser;"
}

Write-Host "== schema.sql =="
& $psql -U postgres -h 127.0.0.1 -d $DbName -f $Schema
if ($LASTEXITCODE -ne 0) { throw "schema.sql failed" }

Write-Host "== Verify $DbUser access =="
$env:PGPASSWORD = $DbPass
& $psql -U $DbUser -h 127.0.0.1 -d $DbName -c "SELECT count(*) AS users FROM users;"
if ($LASTEXITCODE -ne 0) { throw "User $DbUser cannot read tables" }

Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Done."
Write-Host "DATABASE_URL=postgresql://${DbUser}:${DbPass}@127.0.0.1:5432/${DbName}"
Write-Host "Restart dev server: npm run dev"
