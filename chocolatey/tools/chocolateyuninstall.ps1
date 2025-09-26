$ErrorActionPreference = 'Stop'

$packageName = 'absolute-scenes'
$toolsDir = "$(Split-Path -parent $MyInvocation.MyCommand.Definition)"

Write-Host "Uninstalling Absolute Scenes..." -ForegroundColor Yellow

# Remove shortcuts
$startMenuPath = Join-Path $env:ProgramData "Microsoft\Windows\Start Menu\Programs"
$startMenuShortcut = Join-Path $startMenuPath "Absolute Scenes.lnk"

$desktopPath = [Environment]::GetFolderPath("CommonDesktopDirectory")
$desktopShortcut = Join-Path $desktopPath "Absolute Scenes.lnk"

if (Test-Path $startMenuShortcut) {
    try {
        Remove-Item $startMenuShortcut -Force
        Write-Host "Removed Start Menu shortcut" -ForegroundColor Green
    } catch {
        Write-Warning "Could not remove Start Menu shortcut: $_"
    }
} else {
    Write-Host "Start Menu shortcut not found" -ForegroundColor Gray
}

if (Test-Path $desktopShortcut) {
    try {
        Remove-Item $desktopShortcut -Force
        Write-Host "Removed Desktop shortcut" -ForegroundColor Green
    } catch {
        Write-Warning "Could not remove Desktop shortcut: $_"
    }
} else {
    Write-Host "Desktop shortcut not found" -ForegroundColor Gray
}

# Remove batch file
$batchPath = Join-Path $toolsDir "absolute-scenes.bat"
if (Test-Path $batchPath) {
    try {
        Remove-Item $batchPath -Force
        Write-Host "Removed command line launcher" -ForegroundColor Green
    } catch {
        Write-Warning "Could not remove batch file: $_"
    }
}

# The chocolatey framework will automatically remove the tools directory
# and all extracted files when uninstalling

Write-Host "Absolute Scenes has been uninstalled" -ForegroundColor Green

# Note about user data
Write-Host ""
Write-Host "Note: Your book files and application settings have been preserved." -ForegroundColor Cyan
Write-Host "If you want to remove all user data, you can manually delete:" -ForegroundColor Cyan
Write-Host "- Book files (wherever you saved them)" -ForegroundColor Gray
Write-Host "- Application settings in your user profile" -ForegroundColor Gray