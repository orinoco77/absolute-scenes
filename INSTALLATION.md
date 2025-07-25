# Installation and Command Line Usage

## Installation Locations

### Windows
- **Installation Path**: `C:\Program Files\Absolute Scenes\` (system-wide installation)
- **Command Line Access**: `absolute-scenes` command available system-wide
- **Requirements**: Administrator privileges for installation

### macOS  
- **Installation Path**: `/Applications/Absolute Scenes.app`
- **Command Line Access**: Symlink created in `/usr/local/bin/absolute-scenes`

### Linux
- **Installation Path**: `/opt/Absolute Scenes/` (for .deb/.rpm packages)
- **Command Line Access**: Symlink created in `/usr/local/bin/absolute-scenes`
- **Desktop Integration**: Automatic .desktop file and MIME type registration

## Command Line Usage

Once installed, you can use Absolute Scenes from the command line:

```bash
# Open the application
absolute-scenes

# Open a specific book file
absolute-scenes /path/to/your/book.book

# Open with a specific file (alternative syntax)
absolute-scenes --file=/path/to/your/book.book
```

## File Associations

The installer automatically registers `.book` files to open with Absolute Scenes:
- Double-clicking a `.book` file will open it in Absolute Scenes
- Right-click context menu will show "Open with Absolute Scenes"

## Installation Requirements

### Windows
- Windows 10 or later
- Administrator privileges (for system-wide installation)

### macOS
- macOS 10.14 (Mojave) or later
- May require allowing the app in System Preferences > Security & Privacy

### Linux
- Modern Linux distribution with systemd
- Support for .deb packages (Ubuntu/Debian) or .rpm packages (RHEL/Fedora)
- AppImage version available for other distributions

## Upgrading

To upgrade to a new version:
1. Download the new installer
2. Run the installer (it will automatically replace the old version)
3. Your settings and recent files will be preserved

## Uninstallation

### Windows
- Use "Add or Remove Programs" in Windows Settings
- Or run the uninstaller from the Start Menu

### macOS
- Drag the app from Applications to Trash
- Command line access will be automatically removed

### Linux
- Use your package manager: `sudo apt remove absolute-scenes` or `sudo rpm -e absolute-scenes`
- Post-removal scripts will clean up command line access and file associations
