# PowerShell script to build and optionally publish Chocolatey package
param(
    [Parameter(Mandatory=$true)]
    [string]$Version,

    [Parameter(Mandatory=$true)]
    [string]$Checksum,

    [string]$ApiKey = $null,

    [switch]$Publish = $false
)

$ErrorActionPreference = 'Stop'

Write-Host "Building Chocolatey package for Absolute Scenes v$Version" -ForegroundColor Green

# Ensure we're in the right directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$rootDir = Split-Path -Parent $scriptDir
$chocoDir = Join-Path $rootDir "chocolatey"

Set-Location $chocoDir

# Verify the installer URL exists
$installerUrl = "https://github.com/orinoco77/absolute-scenes/releases/download/v$Version/Absolute.Scenes.Setup.$Version.exe"
Write-Host "Verifying installer URL: $installerUrl"

try {
    $response = Invoke-WebRequest -Uri $installerUrl -Method Head -UseBasicParsing
    Write-Host "✓ Installer URL is accessible" -ForegroundColor Green
} catch {
    Write-Error "✗ Installer URL is not accessible: $installerUrl"
    exit 1
}

# Set environment variables for the package build
$env:ChocolateyPackageVersion = $Version
$env:ChocolateyPackageChecksum = $Checksum

Write-Host "Building package with version: $Version"
Write-Host "Using checksum: $Checksum"

# Build the package
try {
    & choco pack absolute-scenes.nuspec --version $Version

    if ($LASTEXITCODE -ne 0) {
        throw "Chocolatey pack failed with exit code $LASTEXITCODE"
    }

    $packageFile = "absolute-scenes.$Version.nupkg"

    if (Test-Path $packageFile) {
        Write-Host "✓ Package built successfully: $packageFile" -ForegroundColor Green
    } else {
        throw "Package file not found: $packageFile"
    }

} catch {
    Write-Error "Failed to build Chocolatey package: $_"
    exit 1
}

# Publish if requested
if ($Publish) {
    if (-not $ApiKey) {
        Write-Error "API Key is required for publishing. Use -ApiKey parameter or set CHOCOLATEY_API_KEY environment variable."
        exit 1
    }

    Write-Host "Publishing package to Chocolatey Community Repository..." -ForegroundColor Yellow

    try {
        & choco push $packageFile --api-key $ApiKey --source https://push.chocolatey.org/

        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Package published successfully!" -ForegroundColor Green
            Write-Host "Package will be available at: https://community.chocolatey.org/packages/absolute-scenes/$Version" -ForegroundColor Cyan
        } else {
            throw "Chocolatey push failed with exit code $LASTEXITCODE"
        }

    } catch {
        Write-Error "Failed to publish package: $_"
        exit 1
    }
} else {
    Write-Host "Package built but not published. Use -Publish switch to publish to Chocolatey." -ForegroundColor Yellow
    Write-Host "To publish manually: choco push $packageFile --api-key YOUR_API_KEY" -ForegroundColor Cyan
}

Write-Host "Chocolatey package process completed!" -ForegroundColor Green