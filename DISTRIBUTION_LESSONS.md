# Distribution Package Lessons Learned

## Chocolatey Journey (v1.4.1 → v1.4.13)

**12 revisions** to get a simple package validation working. Here's what we learned the hard way:

### CPMR0073 - Checksum Validation Hell

**The Problem**: "Package automation scripts download a remote file without validating the checksum"

**What DIDN'T Work:**
1. Using `Install-ChocolateyZipPackage` with environment variable checksums
2. Adding validation checks AFTER calling Install-ChocolateyZipPackage
3. Making checksum validation conditional (`if ($checksum)`)
4. Using explicit variables instead of `$env:` directly

**What ACTUALLY Worked:**
- Use `Get-ChocolateyWebFile` with `-Checksum` and `-ChecksumType` parameters
- Let Chocolatey handle validation internally (don't use separate `Get-ChecksumValid`)
- Make validation MANDATORY (no conditional checks)
- Validate checksums EXIST before downloading anything

### Working Chocolatey Install Script Pattern:

```powershell
# 1. Get checksums from environment (set during build)
$checksum32 = $env:ChocolateyPackageChecksum32
$checksum64 = $env:ChocolateyPackageChecksum64

# 2. FAIL FAST if no checksums
if ([string]::IsNullOrWhiteSpace($checksum32)) {
    throw "32-bit checksum is required for validation."
}
if ([string]::IsNullOrWhiteSpace($checksum64)) {
    throw "64-bit checksum is required for validation."
}

# 3. Download files individually
Get-ChocolateyWebFile -PackageName $packageName -FileFullPath $file32 -Url $url32
Get-ChocolateyWebFile -PackageName $packageName -FileFullPath $file64 -Url $url64

# 4. Validate EVERY download (mandatory)
Get-ChecksumValid -File $file32 -Checksum $checksum32 -ChecksumType 'sha256'
Get-ChecksumValid -File $file64 -Checksum $checksum64 -ChecksumType 'sha256'

# 5. Extract appropriate architecture
if (Get-ProcessorBits -eq 64) {
    Get-ChocolateyUnzip -FileFullPath $file64 -Destination $toolsDir
} else {
    Get-ChocolateyUnzip -FileFullPath $file32 -Destination $toolsDir
}
```

### Other Issues Fixed:
- **Icon format**: Had to rename `icon.PNG` → `icon.png` (case sensitivity)
- **ProjectSourceUrl**: Removed redundant field when same as projectUrl
- **YAML syntax**: Heredoc in GitHub Actions broke workflow parsing

### GitHub Actions Workflow:
- Environment variables are set during build: `$env:ChocolateyPackageChecksum64 = $checksum64`
- Manual workflow trigger uses CURRENT code with OLD release version
- This is good - means fixes apply to resubmissions

## Next: Launchpad PPA

**Status**: Automated workflow ready, not tested yet
**Concerns**: If Chocolatey took 12 revisions, how many will PPA take?

## Next: Snap Store & Flatpak

**Status**: Configuration files ready, not submitted
**Strategy**: Learn from Chocolatey pain, test locally first

---

**Key Lesson**: Package managers have arcane, poorly documented validation rules. Always research the EXACT validation requirements before implementing, and test locally when possible.