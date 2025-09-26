Name:           absolute-scenes
Version:        1.3.111
Release:        1%{?dist}
Summary:        Professional scene-based book writing application

License:        MIT
URL:            https://github.com/orinoco77/absolute-scenes
Source0:        https://github.com/orinoco77/absolute-scenes/releases/download/v%{version}/Absolute.Scenes-%{version}.AppImage

BuildArch:      x86_64
BuildRequires:  desktop-file-utils

# Runtime dependencies for AppImage
Requires:       gtk3
Requires:       nss
Requires:       libXScrnSaver
Requires:       alsa-lib
Requires:       libXrandr
Requires:       atk
Requires:       libdrm
Requires:       libXcomposite
Requires:       libXdamage
Requires:       libXfixes
Requires:       cups-libs

%description
Absolute Scenes is designed specifically for authors who want a structured
approach to writing books with professional publishing features built-in.
Unlike traditional word processors, it organizes your work by scenes and
chapters, making it easier to manage complex narratives.

Key features include:
- Scene-based writing organization
- Professional typography with premium fonts
- Print-ready PDF export with book formatting
- Character and location management
- GitHub integration for cloud backup
- Visual character thread tracking
- Export to PDF, HTML, and EPUB formats

%prep
# Copy the AppImage to build directory
cp %{SOURCE0} ./absolute-scenes.AppImage

%build
# Nothing to build - we're packaging a pre-built binary

%install
# Create directories
mkdir -p %{buildroot}/opt/absolute-scenes
mkdir -p %{buildroot}/usr/bin
mkdir -p %{buildroot}/usr/share/applications
mkdir -p %{buildroot}/usr/share/pixmaps

# Extract AppImage
chmod +x absolute-scenes.AppImage
./absolute-scenes.AppImage --appimage-extract

# Install application files
cp -r squashfs-root/* %{buildroot}/opt/absolute-scenes/

# Create desktop file
cat > %{buildroot}/usr/share/applications/absolute-scenes.desktop << 'EOF'
[Desktop Entry]
Name=Absolute Scenes
Comment=Professional scene-based book writing application
GenericName=Book Writing Software
Exec=absolute-scenes %F
Icon=absolute-scenes
Type=Application
StartupNotify=true
Categories=Office;WordProcessor;Literature;
MimeType=application/x-absolute-scenes-book;
Keywords=writing;book;novel;scenes;chapters;author;publishing;pdf;
EOF

# Install icon
cp squashfs-root/absolute-scenes.png %{buildroot}/usr/share/pixmaps/ || \
cp squashfs-root/usr/share/icons/hicolor/512x512/apps/absolute-scenes.png %{buildroot}/usr/share/pixmaps/absolute-scenes.png || \
echo "Warning: Could not find application icon"

# Create launcher script
cat > %{buildroot}/usr/bin/absolute-scenes << 'EOF'
#!/bin/bash
exec /opt/absolute-scenes/AppRun "$@"
EOF
chmod +x %{buildroot}/usr/bin/absolute-scenes

# Validate desktop file
desktop-file-validate %{buildroot}/usr/share/applications/absolute-scenes.desktop

%files
/opt/absolute-scenes/
/usr/bin/absolute-scenes
/usr/share/applications/absolute-scenes.desktop
/usr/share/pixmaps/absolute-scenes.png

%changelog
* Thu Sep 26 2024 Adam Short <ajs@shiny.org.uk> - 1.3.111-1
- Initial COPR release
- Professional scene-based book writing application
- Features include scene organization, professional typography, PDF export
- GitHub integration for cloud backup and version control
- Character and location management tools