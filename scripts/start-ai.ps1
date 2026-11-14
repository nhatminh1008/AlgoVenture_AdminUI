param(
    [string]$Manifest,
    [string]$Registry,
    [switch]$Experimental,
    [switch]$TestArtifacts,
    [int]$Port = 8000
)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
if ($Manifest -and $Registry) { throw 'Choose either -Manifest or -Registry.' }
if ($TestArtifacts -and -not $Experimental) { throw '-TestArtifacts requires -Experimental and is only for isolated tests.' }
if (-not $Manifest -and -not $Registry) { $Manifest = Join-Path $projectRoot '.runtime\ai-research\game-artifact\manifest.json' }
$manifestPath = if ($Manifest) { (Resolve-Path -LiteralPath $Manifest).Path } else { $null }
$registryPath = if ($Registry) { (Resolve-Path -LiteralPath $Registry).Path } else { $null }
$python = Join-Path $projectRoot 'ai-service\.venv\Scripts\python.exe'
if (-not (Test-Path -LiteralPath $python)) { throw 'Install ai-service dependencies in ai-service/.venv first.' }
if ($Port -lt 1 -or $Port -gt 65535) { throw 'Invalid AI service port.' }
$oldManifest = $env:AI_MODEL_MANIFEST
$oldExperimental = $env:AI_ALLOW_EXPERIMENTAL
$oldRegistry = $env:AI_MODEL_REGISTRY
$oldTestArtifacts = $env:AI_ALLOW_TEST_ARTIFACTS
try {
    $env:AI_MODEL_MANIFEST = $manifestPath
    $env:AI_MODEL_REGISTRY = $registryPath
    $env:AI_ALLOW_EXPERIMENTAL = if ($Experimental) { 'true' } else { 'false' }
    $env:AI_ALLOW_TEST_ARTIFACTS = if ($TestArtifacts) { 'true' } else { 'false' }
    Push-Location (Join-Path $projectRoot 'ai-service')
    try { & $python -m uvicorn app:app --host 127.0.0.1 --port $Port }
    finally { Pop-Location }
    if ($LASTEXITCODE -ne 0) { throw 'AI service stopped with an error.' }
} finally {
    $env:AI_MODEL_MANIFEST = $oldManifest
    $env:AI_ALLOW_EXPERIMENTAL = $oldExperimental
    $env:AI_MODEL_REGISTRY = $oldRegistry
    $env:AI_ALLOW_TEST_ARTIFACTS = $oldTestArtifacts
}
