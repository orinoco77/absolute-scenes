# GitHub Secrets Setup for Code Signing

Your GitHub Actions workflow is now configured for signed releases! You need to add these secrets to your GitHub repository.

## **Setting Up GitHub Secrets**

1. **Go to your repository** on GitHub
2. **Settings** → **Secrets and variables** → **Actions**
3. **Click "New repository secret"** for each secret below

## **Required Secrets**

### **Windows Code Signing**

#### `WINDOWS_CERT_FILE`
Your certificate file encoded as base64:

**Windows PowerShell:**
```powershell
# Navigate to your certificate
cd C:\Users\User\absolute-scenes\cert
# Convert to base64
$cert = Get-Content "windows-cert.p12" -AsByteStream
$base64 = [Convert]::ToBase64String($cert)
Write-Output $base64
```

**Or using OpenSSL:**
```bash
base64 -w 0 cert/windows-cert.p12
```

Copy the entire base64 string (it will be very long) into GitHub Secrets.

#### `WINDOWS_CERT_PASSWORD`
```
scenes
```
(Or whatever password you used for your certificate)

### **macOS Code Signing (Optional)**

#### `APPLE_ID`
```
your-apple-id@email.com
```

#### `APPLE_APP_SPECIFIC_PASSWORD`
```
abcd-efgh-ijkl-mnop
```
Generate at: https://appleid.apple.com → App-Specific Passwords

#### `MACOS_CERT_FILE` (Optional)
If you have an Apple Developer certificate, encode it the same way as Windows.

## **Security Notes**

### **✅ Secrets are Secure**
- Only accessible to GitHub Actions
- Not visible in logs or pull requests
- Encrypted at rest in GitHub

### **🔒 Best Practices**
- **Rotate certificates** annually
- **Use strong passwords** for certificates
- **Limit repository access** to trusted collaborators
- **Monitor** the Actions tab for failed builds

## **Testing the Setup**

### **1. Create a Test Tag**
```bash
git tag v1.3.42-test
git push origin v1.3.42-test
```

### **2. Check Actions**
- Go to **Actions** tab on GitHub
- Watch the "Build and Release" workflow
- Check for successful certificate decoding
- Verify builds are signed

### **3. Download and Test**
- Download the built installers
- Test on Windows: Should show "Adam Short" as publisher
- Test on macOS: Should install without warnings (if using real cert)

## **Expected Behavior**

### **With Secrets Configured:**
- ✅ Windows builds will be signed with your certificate
- ✅ macOS builds will use available signing (or unsigned if no cert)
- ✅ Release artifacts will be properly signed
- ✅ Users get fewer security warnings

### **Without Secrets:**
- ⚠️ Builds will be unsigned (still functional)
- ⚠️ Users see security warnings
- ✅ Build process still works normally

## **Troubleshooting**

### **"Certificate not found" Error**
- Check `WINDOWS_CERT_FILE` is properly base64 encoded
- Verify the certificate file isn't corrupted
- Ensure the base64 string has no line breaks

### **"Wrong password" Error**
- Check `WINDOWS_CERT_PASSWORD` matches certificate password
- Try rebuilding certificate with a simpler password

### **macOS Signing Issues**
- Apple Developer membership is required for notarization
- Self-signed certificates will still show warnings
- Check Apple ID and app-specific password are correct

## **GitHub Secrets Summary**

| Secret Name | Value | Required |
|-------------|--------|----------|
| `WINDOWS_CERT_FILE` | Base64 certificate | Yes |
| `WINDOWS_CERT_PASSWORD` | Certificate password | Yes |
| `APPLE_ID` | Apple ID email | Optional |
| `APPLE_APP_SPECIFIC_PASSWORD` | App password | Optional |

Once these are set up, every release tag will automatically build signed installers for all platforms! 🎉