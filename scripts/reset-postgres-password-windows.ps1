# Reset postgres password on Windows and run Olala DB setup.
# MUST run PowerShell as Administrator:
#   Right-click PowerShell -> Run as administrator
#   cd E:\olala
#   .\scripts\reset-postgres-password-windows.ps1
#
# Optional new postgres password:
#   .\scripts\reset-postgres-password-windows.ps1 -NewPostgresPassword "MyNewPass123"

param(
  [string]$NewPostgresPassword = "",
  [string]$DbUser = "olala",
  [string]$DbPass = "olala",
  [string]$DbName = "olala"
)

$ErrorActionPreference = "Stop"

function Test-IsAdmin {
  $id = [Security.Principal.WindowsIdentity]::GetCurrent()
  $p = New-Object Security.Principal.WindowsPrincipal($id)
  return $p.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-IsAdmin)) {
  Write-Error @"
Run this script as Administrator.
1. Start menu -> PowerShell -> Run as administrator
2. cd E:\olala
3. .\scripts\reset-postgres-password-windows.ps1
"@
}

$pgData = Get-ChildItem "C:\Program Files\PostgreSQL\*\data\pg_hba.conf" -ErrorAction SilentlyContinue |
  Sort-Object { [int]($_.Directory.Parent.Name -replace '\D', '') } -Descending |
  Select-Object -First 1

if (-not $pgData) {
  Write-Error "pg_hba.conf not found under C:\Program Files\PostgreSQL"
}

$pgHba = $pgData.FullName
$pgRoot = $pgData.Directory.Parent.FullName
$psql = Join-Path $pgRoot "bin\psql.exe"
$service = Get-Service postgresql* | Select-Object -First 1

if (-not $service) {
  Write-Error "postgresql service not found"
}

if (-not $NewPostgresPassword) {
  $secure = Read-Host "New password for postgres user" -AsSecureString
  $NewPostgresPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  )
  $secure2 = Read-Host "Confirm password" -AsSecureString
  $confirm = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure2)
  )
  if ($NewPostgresPassword -ne $confirm) {
    Write-Error "Passwords do not match"
  }
}

$backup = "$pgHba.olala-backup"
Copy-Item $pgHba $backup -Force
Write-Host "Backup: $backup"

$content = Get-Content $pgHba -Raw
$trust = $content -replace '127\.0\.0\.1/32\s+scram-sha-256', '127.0.0.1/32            trust'
$trust = $trust -replace '::1/128\s+scram-sha-256', '::1/128                 trust'
Set-Content -Path $pgHba -Value $trust -Encoding ASCII
Write-Host "Temporarily enabled trust auth for localhost"

Restart-Service $service.Name -Force
Start-Sleep -Seconds 2

try {
  Write-Host "== Set postgres password =="
  $escaped = $NewPostgresPassword -replace "'", "''"
  & $psql -U postgres -h 127.0.0.1 -d postgres -c "ALTER USER postgres WITH PASSWORD '$escaped';"
  if ($LASTEXITCODE -ne 0) { throw "ALTER USER postgres failed" }

  $Root = Split-Path $PSScriptRoot -Parent
  $Schema = Join-Path $Root "schema.sql"
  $env:PGPASSWORD = $NewPostgresPassword

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

  $env:PGPASSWORD = $DbPass
  & $psql -U $DbUser -h 127.0.0.1 -d $DbName -c "SELECT count(*) AS users FROM users;"
  if ($LASTEXITCODE -ne 0) { throw "olala user cannot access tables" }
}
finally {
  Write-Host "== Restore pg_hba.conf =="
  Copy-Item $backup $pgHba -Force
  Restart-Service $service.Name -Force
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "Done."
Write-Host "postgres password: (the one you just set)"
Write-Host "DATABASE_URL=postgresql://${DbUser}:${DbPass}@127.0.0.1:5432/${DbName}"
Write-Host "Next: npm run dev"
