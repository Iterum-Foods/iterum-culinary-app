# Run Iterum Owner Bot - loads scripts/owner-bot/.env.owner-bot if present.
$ErrorActionPreference = "Stop"
$BotDir = $PSScriptRoot
$RepoRoot = Resolve-Path (Join-Path $BotDir "..\..")

Set-Location $RepoRoot

$envFile = Join-Path $BotDir ".env.owner-bot"
if (Test-Path $envFile) {
    Write-Host "Loading $envFile"
    Get-Content $envFile | ForEach-Object {
        $line = $_.Trim()
        if (-not $line -or $line.StartsWith("#")) { return }
        if ($line -match '^([A-Za-z_][A-Za-z0-9_]*)=(.*)$') {
            $name = $matches[1]
            $value = $matches[2].Trim().Trim('"').Trim("'")
            Set-Item -Path "env:$name" -Value $value
        }
    }
} else {
    Write-Host "No .env.owner-bot - run: npm run owner-bot:init"
    Write-Host "Or set ITERUM_TEST_EMAIL / ITERUM_TEST_PASSWORD manually."
}

$baseUrl = if ($env:ITERUM_BASE_URL) { $env:ITERUM_BASE_URL } else { "http://localhost:8080" }
Write-Host "Checking app at $baseUrl ..."
try {
    $null = Invoke-WebRequest -Uri $baseUrl -UseBasicParsing -TimeoutSec 5
} catch {
    Write-Host ""
    Write-Host "App not reachable. In another terminal run:"
    Write-Host "  npm run serve:test"
    Write-Host ""
    exit 1
}

Write-Host "Starting owner bot..."
$botScript = Join-Path $BotDir "owner-bot-iterum.js"
& node $botScript
exit $LASTEXITCODE
