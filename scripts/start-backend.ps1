param([switch]$SkipBuild,[switch]$ExperimentalAi)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$runtimeDir = Join-Path $projectRoot '.runtime'
New-Item -ItemType Directory -Force -Path $runtimeDir | Out-Null

# Tools are scoped to this project workflow; no system PATH changes.
$toolsDir = Join-Path $env:LOCALAPPDATA 'AlgoVenture\tools'
if (-not $env:JAVA_HOME -or -not (Test-Path (Join-Path $env:JAVA_HOME 'bin\java.exe'))) {
    $jdk = Get-ChildItem -LiteralPath $toolsDir -Directory -Filter 'jdk-*' -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $jdk) {
        $jdk = Get-ChildItem -LiteralPath (Join-Path $env:USERPROFILE '.jdks') -Directory -ErrorAction SilentlyContinue |
            Where-Object { Test-Path (Join-Path $_.FullName 'bin\javac.exe') } |
            Where-Object { (Get-Content -LiteralPath (Join-Path $_.FullName 'release') -ErrorAction SilentlyContinue) -match '^JAVA_VERSION="21\.' } |
            Sort-Object Name -Descending | Select-Object -First 1
    }
    if (-not $jdk) { throw 'Install JDK 21 and set JAVA_HOME, or place a Temurin JDK under %LOCALAPPDATA%\AlgoVenture\tools.' }
    $env:JAVA_HOME = $jdk.FullName
}
$postgresBin = if ($env:POSTGRES_BIN) { $env:POSTGRES_BIN } else { 'C:\Program Files\PostgreSQL\18\bin' }
if (-not $env:POSTGRES_BIN -and -not (Test-Path (Join-Path $postgresBin 'initdb.exe'))) {
    $portable = Get-ChildItem -LiteralPath $toolsDir -Directory -ErrorAction SilentlyContinue |
        Where-Object { Test-Path (Join-Path $_.FullName 'bin\initdb.exe') } |
        Sort-Object Name -Descending | Select-Object -First 1
    if ($portable) { $postgresBin = Join-Path $portable.FullName 'bin' }
}
if (-not (Test-Path (Join-Path $postgresBin 'initdb.exe'))) { throw 'Set POSTGRES_BIN to the PostgreSQL bin directory.' }
if (-not $SkipBuild) {
    Push-Location (Join-Path $projectRoot 'backend')
    try {
        & '.\mvnw.cmd' -B -ntp package
        if ($LASTEXITCODE -ne 0) { throw 'Backend build failed.' }
    } finally { Pop-Location }
}
$backendJar = Join-Path $projectRoot 'backend\target\algoventure-api-0.1.0.jar'
if (-not (Test-Path -LiteralPath $backendJar)) { throw 'Build the backend before using -SkipBuild.' }
$secretsFile = Join-Path $runtimeDir 'dev-secrets.json'
if (-not (Test-Path -LiteralPath $secretsFile)) {
    @{ databasePassword = ([guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N')) } | ConvertTo-Json | Set-Content -LiteralPath $secretsFile -Encoding utf8
}
$localSecrets = Get-Content -LiteralPath $secretsFile -Raw | ConvertFrom-Json
$databaseDir = Join-Path $runtimeDir 'postgres'
if (-not (Test-Path (Join-Path $databaseDir 'PG_VERSION'))) {
    $passwordFile = Join-Path $runtimeDir 'initdb-password.txt'
    $localSecrets.databasePassword | Set-Content -LiteralPath $passwordFile -Encoding ascii
    & (Join-Path $postgresBin 'initdb.exe') -D $databaseDir -U algoventure -A scram-sha-256 --encoding=UTF8 --locale=C "--pwfile=$passwordFile"
    if ($LASTEXITCODE -ne 0) { throw 'Failed to initialize the isolated development database.' }
    Remove-Item -LiteralPath $passwordFile
}
& (Join-Path $postgresBin 'pg_ctl.exe') status -D $databaseDir *> $null
if ($LASTEXITCODE -ne 0) {
    # pg_ctl launches a persistent server. Do not let that child inherit the
    # PowerShell pipeline: inherited handles can keep the native command blocked
    # after "server started", preventing the Java backend from ever launching.
    $pgStart = Start-Process -FilePath (Join-Path $postgresBin 'pg_ctl.exe') -WindowStyle Hidden -PassThru `
        -ArgumentList @('-D', ('"{0}"' -f $databaseDir), '-l', ('"{0}"' -f (Join-Path $runtimeDir 'postgres.log')), '-o', '"-h 127.0.0.1 -p 55432"', '-w', 'start') `
        -RedirectStandardOutput (Join-Path $runtimeDir 'pg-start.log') `
        -RedirectStandardError (Join-Path $runtimeDir 'pg-start-error.log')
    if (-not $pgStart.WaitForExit(30000)) { throw 'PostgreSQL startup timed out; see .runtime/postgres.log.' }
    if ($pgStart.ExitCode -ne 0) { throw 'Failed to start development PostgreSQL; see .runtime/pg-start-error.log.' }
}
$env:PGPASSWORD = $localSecrets.databasePassword
try {
  if (-not (Test-Path (Join-Path $postgresBin 'psql.exe')) -or -not (Test-Path (Join-Path $postgresBin 'createdb.exe'))) {
    # Minimal portable distributions still have a real PostgreSQL server. Use
    # the application's bundled JDBC driver for database creation in that case.
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $jar = [System.IO.Compression.ZipFile]::OpenRead($backendJar)
    try {
        $entry = $jar.Entries | Where-Object { $_.FullName -like 'BOOT-INF/lib/postgresql-*.jar' } | Select-Object -First 1
        if (-not $entry) { throw 'PostgreSQL JDBC driver is missing from the backend build.' }
        $driverJar = Join-Path $runtimeDir 'postgresql-driver.jar'
        [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $driverJar, $true)
    } finally { $jar.Dispose() }
    $env:DB_PASSWORD = $localSecrets.databasePassword
    & (Join-Path $env:JAVA_HOME 'bin\java.exe') -cp $driverJar (Join-Path $PSScriptRoot 'EnsureDevDatabase.java')
    if ($LASTEXITCODE -ne 0) { throw 'Cannot prepare the development database.' }
  } else {
    $databaseExists = & (Join-Path $postgresBin 'psql.exe') -h 127.0.0.1 -p 55432 -U algoventure -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='algoventure'"
    if ($LASTEXITCODE -ne 0) { throw 'Cannot connect to development PostgreSQL.' }
    if ($databaseExists -ne '1') {
        & (Join-Path $postgresBin 'createdb.exe') -h 127.0.0.1 -p 55432 -U algoventure algoventure
        if ($LASTEXITCODE -ne 0) { throw 'Failed to create development database.' }
    }
  }
} finally { Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue }
$env:DB_URL = 'jdbc:postgresql://127.0.0.1:55432/algoventure'
$env:DB_USER = 'algoventure'
$env:DB_PASSWORD = $localSecrets.databasePassword
$env:SEED_ENABLED = 'true'
if ($ExperimentalAi) { $env:AI_SERVICE_URL = 'http://127.0.0.1:8000' }
if (-not $env:SEED_ADMIN_PASSWORD) { $env:SEED_ADMIN_PASSWORD = 'Admin@12345' }
if (-not $env:SEED_INSTRUCTOR_PASSWORD) { $env:SEED_INSTRUCTOR_PASSWORD = 'Instructor@12345' }
Push-Location (Join-Path $projectRoot 'backend')
try {
    # This Windows host rejects AF_UNIX connect. A nonexistent socket directory
    # makes the JDK selector use its built-in TCP loopback fallback instead.
    $socketDir = Join-Path $toolsDir 'tcp-loopback-only\unavailable'
    & (Join-Path $env:JAVA_HOME 'bin\java.exe') "-Djdk.net.unixdomain.tmpdir=$socketDir" -jar 'target\algoventure-api-0.1.0.jar'
    if ($LASTEXITCODE -ne 0) { throw 'Backend process stopped with an error.' }
} finally { Pop-Location }
