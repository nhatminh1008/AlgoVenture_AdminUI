param(
    [string]$Manifest,
    [switch]$Experimental,
    [int]$Port = 8000
)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
if (-not $Manifest) { $Manifest = Join-Path $projectRoot '.runtime\ai-research\game-artifact\manifest.json' }
$manifestPath = (Resolve-Path -LiteralPath $Manifest).Path
$python = Join-Path $projectRoot 'ai-service\.venv\Scripts\python.exe'
if (-not (Test-Path -LiteralPath $python)) { throw 'Install ai-service dependencies in ai-service/.venv first.' }
if ($Port -lt 1 -or $Port -gt 65535) { throw 'Invalid AI service port.' }
$oldManifest = $env:AI_MODEL_MANIFEST
$oldExperimental = $env:AI_ALLOW_EXPERIMENTAL
try {
    $env:AI_MODEL_MANIFEST = $manifestPath
    $env:AI_ALLOW_EXPERIMENTAL = if ($Experimental) { 'true' } else { 'false' }
    Push-Location (Join-Path $projectRoot 'ai-service')
    try { & $python -m uvicorn app:app --host 127.0.0.1 --port $Port }
    finally { Pop-Location }
    if ($LASTEXITCODE -ne 0) { throw 'AI service stopped with an error.' }
} finally {
    $env:AI_MODEL_MANIFEST = $oldManifest
    $env:AI_ALLOW_EXPERIMENTAL = $oldExperimental
}
