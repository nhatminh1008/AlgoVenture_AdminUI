param(
    [string]$Manifest,
    [string]$Registry,
    [switch]$Experimental,
    [switch]$TestArtifacts,
    [switch]$Background,
    [int]$Port = 8000
)
$ErrorActionPreference = 'Stop'
$workspace = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$launcher = Join-Path $workspace 'AlgoVenture_AI/scripts/start-ai.ps1'
if (-not (Test-Path -LiteralPath $launcher -PathType Leaf)) {
    throw 'Place the standalone AlgoVenture_AI repository next to AlgoVenture_AdminUI.'
}
& $launcher @PSBoundParameters
