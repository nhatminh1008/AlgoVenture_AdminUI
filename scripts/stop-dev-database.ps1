$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$databaseDir = Join-Path $projectRoot '.runtime\postgres'
$postgresBin = if ($env:POSTGRES_BIN) { $env:POSTGRES_BIN } else { 'C:\Program Files\PostgreSQL\18\bin' }
if (-not $env:POSTGRES_BIN -and -not (Test-Path (Join-Path $postgresBin 'pg_ctl.exe'))) {
    $portable = Get-ChildItem -LiteralPath (Join-Path $env:LOCALAPPDATA 'AlgoVenture\tools') -Directory -ErrorAction SilentlyContinue |
        Where-Object { Test-Path (Join-Path $_.FullName 'bin\pg_ctl.exe') } |
        Sort-Object Name -Descending | Select-Object -First 1
    if ($portable) { $postgresBin = Join-Path $portable.FullName 'bin' }
}
if (-not (Test-Path (Join-Path $postgresBin 'pg_ctl.exe'))) { throw 'Set POSTGRES_BIN to the PostgreSQL bin directory.' }
& (Join-Path $postgresBin 'pg_ctl.exe') -D $databaseDir -m fast -w stop
if ($LASTEXITCODE -ne 0) { throw 'Failed to stop the development database.' }
