# Local testing script for Chocolatey package
param(
    [Parameter(Mandatory=$true)]
    [string]$Version,

    [Parameter(Mandatory=$true)]
    [string]$Checksum64,

    [Parameter(Mandatory=$true)]
    [string]$Checksum32
)

$ErrorActionPreference = 'Stop'

Write-Host "Testing Chocolatey package locally for Absolute Scenes v$Version" -ForegroundColor Green

# Ensure we're in the right directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$rootDir = Split-Path -Parent $scriptDir
$chocoDir = Join-Path $rootDir "chocolatey"

Set-Location $chocoDir

# Set environment variables
$env:ChocolateyPackageVersion = $Version
$env:ChocolateyPackageChecksum64 = $Checksum64
$env:ChocolateyPackageChecksum32 = $Checksum32

Write-Host "Building test package..." -ForegroundColor Yellow

# Build the package
choco pack absolute-scenes.nuspec --version $Version

$packageFile = "absolute-scenes.$Version.nupkg"

if (Test-Path $packageFile) {
    Write-Host "✓ Package built successfully: $packageFile" -ForegroundColor Green

    # Test the package
    Write-Host "Running package tests..." -ForegroundColor Yellow

    try {
        choco install $packageFile --source . --force --yes --debug

        Write-Host "✓ Test installation completed!" -ForegroundColor Green
        Write-Host ""
        Write-Host "To uninstall the test package, run:" -ForegroundColor Cyan
        Write-Host "  choco uninstall absolute-scenes --yes" -ForegroundColor White
        Write-Host ""
        Write-Host "Package file created: $packageFile" -ForegroundColor Cyan

    } catch {
        Write-Error "Test installation failed: $_"
    }

} else {
    Write-Error "Package build failed - file not found: $packageFile"
}

Write-Host "Local test completed!" -ForegroundColor Green