# Absolute Scenes Icons

This directory contains the application icons for Absolute Scenes.

## Icon Design

The icon represents the core features of Absolute Scenes:

- **📚 Book**: The main blue book represents the writing/publishing aspect
- **🎬 Scene Frames**: Green rectangular frames on the book pages represent the scene-based organization
- **✒️ Quill Pen**: Red quill pen represents the writing/authoring process
- **📄 Text Lines**: Gray lines represent the actual manuscript content

## Color Palette

- **Primary Blue**: #2563eb to #1d4ed8 (book cover)
- **Scene Green**: #059669 to #047857 (scene frames)  
- **Pen Red**: #dc2626 to #b91c1c (quill pen)
- **Neutral Gray**: #d1d5db (text lines)
- **Background**: #f8fafc with #e2e8f0 border

## Files

- `icon.svg` - Main application icon (512x512) used by Electron Builder
- `../public/icon.svg` - Same icon for web version
- `../public/favicon.svg` - Simplified 32x32 version for browser tabs
- `../public/favicon.ico` - Fallback ICO format for older browsers

## Usage

The icons are automatically used by:
- Electron Builder for app packaging (Windows .ico, macOS .icns, Linux .png)
- Web browsers for favicons and PWA icons
- Operating system file associations for .book files

## Customization

To modify the icon:
1. Edit the SVG files directly
2. Maintain the aspect ratio and core design elements
3. Test in different sizes (16px, 32px, 48px, 256px, 512px)
4. Ensure good contrast for both light and dark backgrounds