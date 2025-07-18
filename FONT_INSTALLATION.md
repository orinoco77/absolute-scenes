# Font Setup Instructions for AbsoluteScenes

To get beautiful typography in your Electron app, you'll need to download the font files and place them in the `public/fonts` directory.

## Required Font Files

Download these files and place them in `public/fonts/`:

### EB Garamond (Google Fonts)
Download from: https://fonts.google.com/specimen/EB+Garamond
Files needed:
- `EBGaramond-Regular.woff2`
- `EBGaramond-Italic.woff2`  
- `EBGaramond-Bold.woff2`
- `EBGaramond-BoldItalic.woff2`

### Libre Baskerville (Google Fonts)
Download from: https://fonts.google.com/specimen/Libre+Baskerville
Files needed:
- `LibreBaskerville-Regular.woff2`
- `LibreBaskerville-Italic.woff2`
- `LibreBaskerville-Bold.woff2`

### Crimson Text (Google Fonts)
Download from: https://fonts.google.com/specimen/Crimson+Text
Files needed:
- `CrimsonText-Regular.woff2`
- `CrimsonText-Italic.woff2`
- `CrimsonText-SemiBold.woff2`
- `CrimsonText-SemiBoldItalic.woff2`

### Source Serif Pro (Adobe/Google)
Download from: https://fonts.google.com/specimen/Source+Serif+Pro
Files needed:
- `SourceSerifPro-Regular.woff2`
- `SourceSerifPro-Italic.woff2`
- `SourceSerifPro-Bold.woff2`

## Quick Download Method

1. Go to https://google-webfonts-helper.herokuapp.com/
2. Search for each font name
3. Select the styles you need (400, 400italic, 700, etc.)
4. Choose "Modern Browsers" (woff2)
5. Download the zip file
6. Extract the `.woff2` files to your `public/fonts` folder

## Alternative: Use System Fonts

If you prefer not to download fonts, the app will gracefully fall back to high-quality system fonts like:
- Georgia (excellent web serif)
- Times New Roman (classic serif)
- Helvetica/Arial (clean sans-serif)

## Verification

Once fonts are installed, restart your Electron app and check the console for:
```
Local fonts loaded successfully
```

The font dropdown in your template settings will show the beautiful fonts you've installed!
