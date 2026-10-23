# Copies the theme into the Obsidian vault. Run after every change:
#   powershell -ExecutionPolicy Bypass -File deploy.ps1
# Then reload Obsidian (Ctrl+R) to see it.

$vaultTheme = "C:\Users\MIG\Documents\obsidian\mig8128\.obsidian\themes\Goguryeo"

New-Item -ItemType Directory -Force $vaultTheme | Out-Null
Copy-Item -Force "$PSScriptRoot\theme.css", "$PSScriptRoot\manifest.json" $vaultTheme
Write-Output "Deployed to $vaultTheme"
