# companion/src -> companion/main.js 자동 빌드
npm --prefix companion run build
# Copies the theme and its companion plugin into the Obsidian vault.
# Run after every change:
#   powershell -ExecutionPolicy Bypass -File deploy.ps1
# Then reload Obsidian (Ctrl+R) to see it.




$obsidian = "C:\Users\MIG\Documents\obsidian\mig8128\.obsidian"
$vaultTheme = "$obsidian\themes\Goguryeo"
$vaultPlugin = "$obsidian\plugins\goguryeo-companion"

New-Item -ItemType Directory -Force $vaultTheme, $vaultPlugin | Out-Null
Copy-Item -Force "$PSScriptRoot\theme.css", "$PSScriptRoot\manifest.json" $vaultTheme
Copy-Item -Force "$PSScriptRoot\companion\main.js", "$PSScriptRoot\companion\manifest.json" $vaultPlugin
Write-Output "Deployed theme to $vaultTheme"
Write-Output "Deployed plugin to $vaultPlugin"
