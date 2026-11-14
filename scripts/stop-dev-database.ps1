param(
    [string]$BackendPath,
    [string]$DatabaseRuntimeDirectory
)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$backendRoot = if ($BackendPath) {
    $BackendPath
} else {
    Join-Path (Split-Path -Parent $projectRoot) 'AlgoVenture_Backend'
}
$backendScript = Join-Path $backendRoot 'scripts\stop-dev-database.ps1'
if (-not (Test-Path -LiteralPath (Join-Path $backendRoot 'pom.xml') -PathType Leaf) -or
    -not (Test-Path -LiteralPath $backendScript -PathType Leaf)) {
    throw "Backend repository not found at '$backendRoot'. Clone AlgoVenture_Backend next to AlgoVenture_AdminUI, or pass -BackendPath."
}
$backendScript = (Resolve-Path -LiteralPath $backendScript).Path
$forward = @{}
foreach ($key in $PSBoundParameters.Keys) {
    if ($key -ne 'BackendPath') { $forward[$key] = $PSBoundParameters[$key] }
}
# Stop the same portable cluster managed by the Backend setup script.
& $backendScript @forward
