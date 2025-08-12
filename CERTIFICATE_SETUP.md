# Certificate Setup for Code Signing

## 🚨 **IMPORTANT: Never Commit Certificates to Git!**

Certificate files contain private keys and should NEVER be committed to version control.

## **Setup Instructions**

### **1. Create Certificate Directory**
```bash
mkdir cert
```

### **2. Windows Certificate**
- Export your certificate from Windows Certificate Manager
- Save as: `cert/windows-cert.p12`
- **Password protect** the certificate

### **3. macOS Certificate** 
- Run: `bash cert/create-macos-cert.sh` (on macOS)
- Or create manually through Keychain Access

### **4. Environment Variables**
```bash
# Copy the example file
cp .env.signing.example .env.signing

# Edit with your actual passwords
nano .env.signing
```

Example `.env.signing`:
```
WINDOWS_CERT_PASSWORD=your_secure_password
APPLE_ID=your@email.com
APPLE_APP_SPECIFIC_PASSWORD=abcd-efgh-ijkl-mnop
```

## **Building with Code Signing**

### **Windows (PowerShell):**
```powershell
$env:WINDOWS_CERT_PASSWORD="your_password"
npm run dist
```

### **macOS (Terminal):**
```bash
export APPLE_ID="your@email.com"
export APPLE_APP_SPECIFIC_PASSWORD="your-app-password"
npm run dist
```

## **Security Checklist**

- ✅ `cert/` directory is in `.gitignore`
- ✅ `.env.signing` is in `.gitignore`  
- ✅ Certificates are password protected
- ✅ Only `.env.signing.example` is committed
- ❌ **NEVER** commit actual certificate files
- ❌ **NEVER** commit passwords in package.json

## **GitHub Actions / CI Setup**

For automated builds, store certificates and passwords as GitHub Secrets:

1. **Repository Settings** → Secrets and Variables → Actions
2. **Add secrets:**
   - `WINDOWS_CERT_FILE` (base64 encoded .p12 file)
   - `WINDOWS_CERT_PASSWORD`
   - `APPLE_ID`
   - `APPLE_APP_PASSWORD`

## **If Certificate is Compromised**

1. **Revoke** the certificate immediately
2. **Generate** new certificates
3. **Update** all build systems
4. **Notify** users if malicious use is suspected

---

**Remember: Certificate security is critical for maintaining trust with your users!**