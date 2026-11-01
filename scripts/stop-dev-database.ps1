$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$databaseDir = Join-Path $projectRoot '.runtime\postgres'
$postgresBin = if ($env:POSTGRES_BIN) { $env:POSTGRES_BIN } else { 'C:\Program Files\PostgreSQL\18\bin' }
& (Join-Path $postgresBin 'pg_ctl.exe') -D $databaseDir -m fast -w stop
