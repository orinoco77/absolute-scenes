#!/bin/bash
# Post-install script for Absolute Scenes on Linux

# Create symlink in /usr/local/bin for command line access
if [ -f "/opt/Absolute Scenes/absolute-scenes" ]; then
    ln -sf "/opt/Absolute Scenes/absolute-scenes" "/usr/local/bin/absolute-scenes"
    echo "Created symlink for command line access: absolute-scenes"
fi

# Update desktop database
if command -v update-desktop-database > /dev/null 2>&1; then
    update-desktop-database /usr/share/applications
fi

# Update MIME database for .book files
if command -v update-mime-database > /dev/null 2>&1; then
    update-mime-database /usr/share/mime
fi

# Install MIME type for .book files
cat > /usr/share/mime/packages/absolute-scenes.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<mime-info xmlns="http://www.freedesktop.org/standards/shared-mime-info">
  <mime-type type="application/x-absolute-scenes-book">
    <comment>Absolute Scenes Book File</comment>
    <icon name="application-x-absolute-scenes-book"/>
    <glob pattern="*.book"/>
  </mime-type>
</mime-info>
EOF

# Update MIME database again after adding our type
if command -v update-mime-database > /dev/null 2>&1; then
    update-mime-database /usr/share/mime
fi

echo "Absolute Scenes installation completed!"
echo "You can now run 'absolute-scenes' from the command line."
