# Security Warnings - Why Your OS Doesn't Trust This App

Absolute Scenes is safe software, but your operating system may show security warnings because the app uses **self-signed certificates** instead of expensive commercial certificates.

## 🚨 What You'll See

### **Windows:**
- "Windows protected your PC" 
- "Unrecognized app"
- SmartScreen warning

### **macOS:**
- "Cannot be opened because the developer cannot be verified"
- "Damaged and can't be opened" 
- Gatekeeper blocking the app

## ✅ How to Run the App Safely

### **Windows Users:**
1. **SmartScreen Warning:** Click "More info" → "Run anyway"
2. **First Install:** Windows may scan the file - this is normal
3. **Future Runs:** Windows will remember your choice

### **macOS Users:**
1. **Right-click the app** → Choose "Open" 
2. **Click "Open"** in the dialog that appears
3. **Future Runs:** macOS will remember your choice

### **Alternative macOS Method:**
```bash
# Remove quarantine flag
xattr -d com.apple.quarantine "/Applications/Absolute Scenes.app"
```

## 🔒 Why This Happens

### **Self-Signed vs. Commercial Certificates**

**Commercial Certificates ($200-400/year):**
- ✅ Trusted by operating systems
- ✅ No warnings for users
- ✅ Instant reputation

**Self-Signed Certificates (Free):**
- ⚠️ Shows security warnings
- ✅ App is still cryptographically signed
- ✅ Protects against tampering
- ✅ Same security, different trust model

## 🛡️ How to Verify This App is Safe

### **Check the Signature:**
**Windows:**
```cmd
# Verify the app is signed
signtool verify /v "Absolute Scenes Setup.exe"
```

**macOS:**
```bash
# Check code signature
codesign -v -v "/Applications/Absolute Scenes.app"
# Check for tampering
spctl -a -v "/Applications/Absolute Scenes.app"
```

### **Source Code Available:**
- 📁 **Full source:** https://github.com/yourusername/absolute-scenes
- 🔍 **Audit the code** yourself
- 🔨 **Build from source** if preferred

## 📋 What IT Departments Should Know

- **Code Signing:** App is cryptographically signed (self-signed certificate)
- **No Network Access:** App works offline, doesn't phone home
- **Local Storage:** All data stored locally on user's machine
- **Open Source:** Full source code available for audit
- **Electron Framework:** Built on Chromium + Node.js (industry standard)

## 🎯 For Businesses/Organizations

If you need apps without security warnings:

1. **Allowlist the app** in your security software
2. **Deploy via Group Policy** (Windows) or MDM (macOS)
3. **Contact us** about commercial licensing with proper certificates

---

**Bottom Line:** The warnings are about certificate trust, not app security. The app is safe to use - your OS is just being cautious about self-signed software.