# Chocolatey Package for Absolute Scenes

This document explains how to build and publish Chocolatey packages for Absolute Scenes.

## Overview

Chocolatey allows users to install Absolute Scenes without SmartScreen warnings by using a portable ZIP package instead of a signed installer. This provides a professional installation experience without requiring expensive code signing certificates.

## Files Created

```
chocolatey/
├── absolute-scenes.nuspec          # Package metadata and description
└── tools/
    ├── chocolateyinstall.ps1       # Installation script
    └── chocolateyuninstall.ps1     # Uninstallation script

scripts/
├── build-chocolatey.ps1            # Manual build script
└── test-chocolatey-local.ps1       # Local testing script

.github/workflows/
└── chocolatey-release.yml          # Automated GitHub Actions workflow
```

## Setup Instructions

### 1. Get Chocolatey API Key

1. Go to [Chocolatey Community](https://community.chocolatey.org/)
2. Create an account or sign in
3. Go to your profile → API Keys
4. Generate a new API key
5. Add the API key to your GitHub repository secrets as `CHOCOLATEY_API_KEY`

### 2. Add GitHub Secret

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Add a new repository secret:
   - Name: `CHOCOLATEY_API_KEY`
   - Value: Your Chocolatey API key

## Usage

### Automatic Publishing (Recommended)

The Chocolatey package will be automatically built and published when you create a GitHub release:

1. Create a new release in GitHub (e.g., `v1.3.112`)
2. The GitHub Actions workflow will:
   - Download the Windows installer
   - Calculate the SHA256 checksum
   - Build the Chocolatey package
   - Publish it to the Chocolatey Community Repository
   - Add a comment to your release with installation instructions

### Manual Publishing

You can also trigger the workflow manually:

1. Go to Actions tab in your GitHub repository
2. Select "Build and Publish Chocolatey Package"
3. Click "Run workflow"
4. Enter the version number and choose whether to publish

### Local Testing

To test the package locally before publishing:

```powershell
# Get the SHA256 checksums of your ZIP packages
$checksum64 = (Get-FileHash "Absolute.Scenes-1.3.111-win32-x64.zip" -Algorithm SHA256).Hash
$checksum32 = (Get-FileHash "Absolute.Scenes-1.3.111-win32-ia32.zip" -Algorithm SHA256).Hash

# Test the package locally
.\scripts\test-chocolatey-local.ps1 -Version "1.3.111" -Checksum64 $checksum64 -Checksum32 $checksum32
```

## User Installation

Once published, users can install Absolute Scenes via Chocolatey:

```powershell
# Install latest version
choco install absolute-scenes

# Install specific version
choco install absolute-scenes --version 1.3.111

# Upgrade existing installation
choco upgrade absolute-scenes

# Uninstall
choco uninstall absolute-scenes
```

## Package Features

- **Portable Installation**: Uses ZIP extraction instead of signed installer
- **No Certificate Warnings**: Avoids SmartScreen issues completely
- **Desktop & Start Menu Shortcuts**: Automatically created during install
- **Command Line Access**: Creates `absolute-scenes` batch command
- **Clean Uninstall**: Removes shortcuts and extracted files
- **Automatic Updates**: Users can easily upgrade with `choco upgrade`
- **No Admin Required**: Portable approach doesn't need system-wide privileges

## Benefits for Users

1. **No SmartScreen Warnings**: Clean installation through trusted package manager
2. **Easy Updates**: Simple `choco upgrade absolute-scenes` command
3. **Professional Experience**: No certificate warnings or manual downloads
4. **Command Line Access**: Automatic PATH setup for CLI usage
5. **Trusted Source**: Chocolatey Community Repository verification

## Troubleshooting

### Package Build Fails

- Ensure the Windows installer exists at the expected GitHub release URL
- Verify the version format matches (e.g., `1.3.111` not `v1.3.111`)
- Check that the installer is publicly accessible

### Publishing Fails

- Verify your Chocolatey API key is correct
- Ensure the package version doesn't already exist
- Check Chocolatey Community guidelines for package requirements

### Installation Issues

- Ensure users have admin privileges (required for system-wide install)
- Check that the installer URL is accessible
- Verify SHA256 checksum matches the actual installer

## Next Steps

1. **Get your Chocolatey API key** from the community website
2. **Add the secret** to your GitHub repository
3. **Create a release** to test the automated workflow
4. **Monitor the package** on Chocolatey Community for user feedback

This setup provides a professional, certificate-free distribution method that gives users a clean installation experience!