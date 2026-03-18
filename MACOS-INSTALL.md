# Installing Absolute Scenes on macOS

When you first try to open Absolute Scenes on macOS, you may see an error message saying **"Absolute Scenes is damaged and can't be opened"**. This is a macOS security feature called Gatekeeper, not an actual problem with the app.

## Quick Fix (Recommended)

### Method 1: Right-Click to Open
1. Locate **Absolute Scenes.app** in your Applications folder (or wherever you installed it)
2. **Right-click** (or Control-click) on the app
3. Select **Open** from the menu
4. Click **Open** in the dialog that appears
5. The app will now open, and macOS will remember your choice

### Method 2: Remove Quarantine Flag (One-Time Terminal Command)

1. Open **Terminal** (found in Applications > Utilities)
2. Copy and paste this command:
   ```bash
   xattr -cr /Applications/Absolute\ Scenes.app
   ```
3. Press Enter
4. The app should now open normally

### Method 3: System Settings

1. Open **System Settings** (or System Preferences)
2. Go to **Privacy & Security**
3. Scroll down to find the message about Absolute Scenes being blocked
4. Click **Open Anyway**
5. Confirm by clicking **Open**

## Why Does This Happen?

Absolute Scenes is not code-signed with an Apple Developer certificate. This is a common situation for free and open-source software. The app is completely safe to use - you can verify the source code on GitHub.

## After First Launch

Once you've opened the app using any of the methods above, macOS will remember your choice and won't show the warning again.

## Need Help?

If you continue to have issues, please open an issue on GitHub: https://github.com/orinoco77/absolute-scenes/issues
