#!/bin/bash
# Generate self-signed certificate for Windows code signing
# Run this script to create windows-cert.p12

echo "Creating self-signed certificate for Windows code signing..."

# Generate private key
openssl genrsa -out windows-cert.key 2048

# Create certificate signing request
openssl req -new -key windows-cert.key -out windows-cert.csr -subj "/C=GB/ST=England/L=City/O=Adam Short/OU=Development/CN=Adam Short/emailAddress=ajs@shiny.org.uk"

# Generate self-signed certificate
openssl x509 -req -days 365 -in windows-cert.csr -signkey windows-cert.key -out windows-cert.crt

# Convert to PKCS#12 format (what electron-builder needs)
openssl pkcs12 -export -out windows-cert.p12 -inkey windows-cert.key -in windows-cert.crt -passout pass:

echo "Certificate created: windows-cert.p12"
echo "Note: This is self-signed and will still show warnings, but apps will be signed."
echo "For production, get a real code signing certificate from a CA."

# Clean up intermediate files
rm windows-cert.key windows-cert.csr windows-cert.crt