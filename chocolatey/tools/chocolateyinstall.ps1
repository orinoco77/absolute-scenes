$ErrorActionPreference = 'Stop'

$packageName = 'absolute-scenes'
$toolsDir = "$(Split-Path -parent $MyInvocation.MyCommand.Definition)"
$version = $env:ChocolateyPackageVersion

# Use portable ZIP instead of installer to avoid certificate issues
$url64 = "https://github.com/orinoco77/absolute-scenes/releases/download/v$version/Absolute.Scenes-$version-win.zip"
$url32 = "https://github.com/orinoco77/absolute-scenes/releases/download/v$version/Absolute.Scenes-$version-ia32-win.zip"

$packageArgs = @{
  packageName    = $packageName
  unzipLocation  = $toolsDir
  url            = $url32
  url64bit       = $url64

  checksum       = $env:ChocolateyPackageChecksum32
  checksumType   = 'sha256'
  checksum64     = $env:ChocolateyPackageChecksum64
  checksumType64 = 'sha256'
}

Install-ChocolateyZipPackage @packageArgs

# Find the extracted executable
$extractedPaths = @(
    "$toolsDir\Absolute Scenes.exe",
    "$toolsDir\win-unpacked\Absolute Scenes.exe",
    "$toolsDir\Absolute.Scenes-$version-win\Absolute Scenes.exe",
    "$toolsDir\Absolute.Scenes-$version-ia32-win\Absolute Scenes.exe"
)

$exePath = $null
foreach ($path in $extractedPaths) {
    if (Test-Path $path) {
        $exePath = $path
        break
    }
}

if (-not $exePath) {
    # Try to find it recursively
    $found = Get-ChildItem -Path $toolsDir -Name "Absolute Scenes.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) {
        $exePath = Join-Path $toolsDir $found
    }
}

if ($exePath) {
    Write-Host "Absolute Scenes extracted to: $exePath" -ForegroundColor Green

    # Create a batch file in the tools directory for command line access
    $batchPath = Join-Path $toolsDir "absolute-scenes.bat"
    $batchContent = "@echo off`r`n`"$exePath`" %*"
    Set-Content -Path $batchPath -Value $batchContent -Encoding ASCII

    # Create start menu shortcut
    $startMenuPath = Join-Path $env:ProgramData "Microsoft\Windows\Start Menu\Programs"
    $shortcutPath = Join-Path $startMenuPath "Absolute Scenes.lnk"

    try {
        Install-ChocolateyShortcut -ShortcutFilePath $shortcutPath -TargetPath $exePath -Description "Absolute Scenes - Professional Book Writing Software"
        Write-Host "Created Start Menu shortcut" -ForegroundColor Green
    } catch {
        Write-Warning "Could not create Start Menu shortcut: $_"
    }

    # Create desktop shortcut (optional)
    $desktopPath = [Environment]::GetFolderPath("CommonDesktopDirectory")
    $desktopShortcut = Join-Path $desktopPath "Absolute Scenes.lnk"

    try {
        Install-ChocolateyShortcut -ShortcutFilePath $desktopShortcut -TargetPath $exePath -Description "Absolute Scenes - Professional Book Writing Software"
        Write-Host "Created Desktop shortcut" -ForegroundColor Green
    } catch {
        Write-Warning "Could not create Desktop shortcut: $_"
    }

    Write-Host "Installation completed successfully!" -ForegroundColor Green
    Write-Host "You can now run 'absolute-scenes' from any command prompt" -ForegroundColor Green
    Write-Host "Or find 'Absolute Scenes' in your Start Menu" -ForegroundColor Green

} else {
    Write-Error "Could not locate Absolute Scenes.exe after extraction. Installation may have failed."
}