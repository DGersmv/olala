# Download olalaflower Highlights via HTTP proxy from .env.local
# Usage: .\scripts\download-instagram-highlights.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Read-EnvLocal {
    param([string]$Path)
    $vars = @{}
    if (-not (Test-Path $Path)) { return $vars }
    Get-Content $Path | ForEach-Object {
        $line = $_.Trim()
        if ($line -eq "" -or $line.StartsWith("#")) { return }
        if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') {
            $key = $matches[1]
            $val = $matches[2].Trim().Trim('"').Trim("'")
            $vars[$key] = $val
        }
    }
    return $vars
}

$envFile = Join-Path $root ".env.local"
$env = Read-EnvLocal $envFile

$proxyHost = $env["INSTAGRAM_PROXY_HOST"]
$proxyPort = $env["INSTAGRAM_PROXY_PORT"]
$proxyUser = $env["INSTAGRAM_PROXY_USER"]
$proxyPass = $env["INSTAGRAM_PROXY_PASS"]
$username = if ($env["INSTAGRAM_USERNAME"]) { $env["INSTAGRAM_USERNAME"] } else { "olalaflower" }

if (-not $proxyHost -or -not $proxyPort) {
    Write-Error "Set INSTAGRAM_PROXY_HOST and INSTAGRAM_PROXY_PORT in .env.local"
}

if ($proxyUser -and $proxyPass) {
    $proxyUrl = "http://${proxyUser}:${proxyPass}@${proxyHost}:${proxyPort}"
} else {
    $proxyUrl = "http://${proxyHost}:${proxyPort}"
}

$env:HTTP_PROXY = $proxyUrl
$env:HTTPS_PROXY = $proxyUrl

Write-Host "Proxy: ${proxyHost}:${proxyPort}"
Write-Host "Profile: $username"
Write-Host ""

python -m instaloader `
    --dirname-pattern="added/from_inst/_raw/{highlight}" `
    --title-pattern="{date_utc}_{shortcode}" `
    --highlights $username

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Download failed. If Connection aborted: try on VPS where site Instagram feed works."
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "Done. Run: npm run sort:from-inst"
