param(
  [string]$ScriptPath = "",
  [string[]]$ScriptArgs = @(),
  [switch]$CheckOnly
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$preferredModuleRoots = @(
  "C:\Users\dgrab\Documents\Codex\2026-05-01\to-start-with-i-want-to\playwright-ui-check\node_modules",
  "C:\Users\dgrab\Documents\Codex\2026-04-28\this-chat-should-be-called-continuation\node_modules",
  "C:\Users\dgrab\Documents\Codex\2026-04-28\this-chat-should-be-called-recovery\node_modules"
)

$selectedNodeModules = $preferredModuleRoots | Where-Object {
  Test-Path -LiteralPath (Join-Path $_ "playwright")
} | Select-Object -First 1

if (-not $selectedNodeModules) {
  throw "Unable to locate a usable Playwright helper package. Checked: $($preferredModuleRoots -join '; ')"
}

$playwrightModulePath = Join-Path $selectedNodeModules "playwright"
$browserRuntimeRoot = "C:\Users\dgrab\AppData\Local\ms-playwright"

if (-not (Test-Path -LiteralPath $browserRuntimeRoot)) {
  throw "Playwright browser runtime directory was not found at $browserRuntimeRoot"
}

$existingNodePath = [Environment]::GetEnvironmentVariable("NODE_PATH", "Process")
if ([string]::IsNullOrWhiteSpace($existingNodePath)) {
  [Environment]::SetEnvironmentVariable("NODE_PATH", $selectedNodeModules, "Process")
} elseif (($existingNodePath -split ';') -notcontains $selectedNodeModules) {
  [Environment]::SetEnvironmentVariable("NODE_PATH", "$selectedNodeModules;$existingNodePath", "Process")
}
[Environment]::SetEnvironmentVariable("PLAYWRIGHT_BROWSERS_PATH", $browserRuntimeRoot, "Process")

if ($CheckOnly -or [string]::IsNullOrWhiteSpace($ScriptPath)) {
  & node -e "const resolved=require.resolve('playwright'); console.log('playwright=' + resolved); console.log('browsers=' + (process.env.PLAYWRIGHT_BROWSERS_PATH || ''));"
  exit $LASTEXITCODE
}

if (-not (Test-Path -LiteralPath $ScriptPath)) {
  throw "ScriptPath was not found: $ScriptPath"
}

& node $ScriptPath @ScriptArgs
exit $LASTEXITCODE
