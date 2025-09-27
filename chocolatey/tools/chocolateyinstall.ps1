$ErrorActionPreference = 'Stop'

$packageName = 'absolute-scenes'
$toolsDir = "$(Split-Path -parent $MyInvocation.MyCommand.Definition)"
$version = $env:ChocolateyPackageVersion

# Use portable ZIP instead of installer to avoid certificate issues
$url64 = "https://github.com/orinoco77/absolute-scenes/releases/download/v$version/Absolute.Scenes-$version-win.zip"
$url32 = "https://github.com/orinoco77/absolute-scenes/releases/download/v$version/Absolute.Scenes-$version-ia32-win.zip"

# Checksums will be provided during automated build - using Get-ChecksumValid for validation
$checksum32 = $env:ChocolateyPackageChecksum32
$checksum64 = $env:ChocolateyPackageChecksum64

# Download and validate files explicitly with Get-ChecksumValid
$file32 = Join-Path $toolsDir "temp32.zip"
$file64 = Join-Path $toolsDir "temp64.zip"

# Validate checksums are provided before downloading
if ([string]::IsNullOrWhiteSpace($checksum32)) {
    throw "32-bit checksum is required for validation."
}
if ([string]::IsNullOrWhiteSpace($checksum64)) {
    throw "64-bit checksum is required for validation."
}

# Download and validate 32-bit file
Get-ChocolateyWebFile -PackageName $packageName -FileFullPath $file32 -Url $url32 -Checksum $checksum32 -ChecksumType 'sha256'
Write-Host "✓ 32-bit checksum validated" -ForegroundColor Green

# Download and validate 64-bit file
Get-ChocolateyWebFile -PackageName $packageName -FileFullPath $file64 -Url $url64 -Checksum64 $checksum64 -ChecksumType 'sha256'
Write-Host "✓ 64-bit checksum validated" -ForegroundColor Green

# Extract the appropriate file based on architecture
if (Get-ProcessorBits -eq 64) {
    Get-ChocolateyUnzip -FileFullPath $file64 -Destination $toolsDir
    Remove-Item $file64 -Force
} else {
    Get-ChocolateyUnzip -FileFullPath $file32 -Destination $toolsDir
    Remove-Item $file32 -Force
}

# Clean up temporary files
Remove-Item $file32 -Force -ErrorAction SilentlyContinue
Remove-Item $file64 -Force -ErrorAction SilentlyContinue

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