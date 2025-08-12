#!/bin/bash
# Create self-signed certificate for macOS code signing
# Run this on macOS to create a self-signed certificate

echo "Creating self-signed certificate for macOS code signing..."

# Create the certificate in Keychain
security create-certificate \
  -n "Absolute Scenes Self-Signed" \
  -c "Adam Short" \
  -k ~/Library/Keychains/login.keychain \
  -A \
  -Z 3650 \
  -S "Developer ID Application" \
  -P "Absolute Scenes"

echo "Certificate created in Keychain!"
echo ""
echo "Now update your package.json with:"
echo '  "identity": "Absolute Scenes Self-Signed"'
echo ""
echo "To verify, run:"
echo "  security find-identity -v -p codesigning"
echo ""
echo "Note: This will still show warnings but the app will be signed."
echo "Users need to: Right-click → Open → Open (first time only)"