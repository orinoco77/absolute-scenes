#!/bin/bash
# Post-remove script for Absolute Scenes on Linux

# Remove symlink from /usr/local/bin
if [ -L "/usr/local/bin/absolute-scenes" ]; then
    rm -f "/usr/local/bin/absolute-scenes"
    echo "Removed command line symlink"
fi

# Remove MIME type definition
if [ -f "/usr/share/mime/packages/absolute-scenes.xml" ]; then
    rm -f "/usr/share/mime/packages/absolute-scenes.xml"
fi

# Update desktop database
if command -v update-desktop-database > /dev/null 2>&1; then
    update-desktop-database /usr/share/applications
fi

# Update MIME database
if command -v update-mime-database > /dev/null 2>&1; then
    update-mime-database /usr/share/mime
fi

echo "Absolute Scenes has been completely removed."
