# Absolute Scenes Wiki

Welcome to the **Absolute Scenes** wiki! This comprehensive guide covers everything you need to know about using and developing this professional scene-based book writing application.

**Current Version:** 1.4.22 | **Author:** Adam Short | **License:** MIT

---

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Core Features](#core-features)
- [Writing & Organization](#writing--organization)
- [Publishing & Export](#publishing--export)
- [Cloud Backup & Collaboration](#cloud-backup--collaboration)
- [Advanced Features](#advanced-features)
- [File Format Reference](#file-format-reference)
- [Developer Guide](#developer-guide)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)
- [Contributing](#contributing)

---

## Overview

### What is Absolute Scenes?

Absolute Scenes is a professional desktop application designed specifically for authors who want a structured, scene-based approach to writing books. Unlike traditional word processors that treat your manuscript as one long document, Absolute Scenes organizes your work into chapters and scenes, making it easier to manage complex narratives, reorder content, and maintain focus on individual story elements.

### Why Scene-Based Writing?

**Scene-based writing offers several advantages:**

- **Better Organization**: Break your story into manageable chunks
- **Easier Revision**: Move scenes around without cutting and pasting
- **Visual Structure**: See your book's architecture at a glance
- **Focused Writing**: Work on one scene at a time without distraction
- **Character Tracking**: Visualize which characters appear in which scenes
- **Flexible Planning**: Rearrange scenes to experiment with story flow

### Key Capabilities

- ✍️ **Professional Writing Environment** with distraction-free mode
- 📚 **Print-Ready PDF Export** with professional typography
- 👥 **Character & Location Management** with visual thread tracking
- ☁️ **GitHub Cloud Backup** with version history
- 🎨 **Premium Typography** with genre-based font recommendations
- 📖 **Multiple Book Formats** (Trade Paperback, Hardcover, Mass Market, etc.)
- 🗺️ **Story Visualization** to track character arcs and plot threads

### Platform Support

- **Windows**: Windows 10+ (64-bit and 32-bit)
- **macOS**: macOS 10.14+ (Intel and Apple Silicon)
- **Linux**: Ubuntu, Debian, Fedora, RHEL (DEB, RPM, AppImage)

---

## Getting Started

### Installation

#### Windows Installation

1. **Download** the latest `Absolute Scenes Setup x.x.x.exe` from [GitHub Releases](https://github.com/orinoco77/absolute-scenes/releases)
2. **Run the installer as Administrator** (required for system-wide installation)
3. **Follow the installation wizard**:
   - Choose installation location (default: `C:\Program Files\Absolute Scenes\`)
   - Select whether to create desktop shortcut
   - Choose whether to add to Start Menu
4. **Launch the app** from Start Menu or desktop shortcut

**Post-Installation:**
- The `absolute-scenes` command is available in Command Prompt and PowerShell
- `.book` files are associated with Absolute Scenes (double-click to open)
- File icons show Absolute Scenes branding

#### macOS Installation

1. **Download** the latest `Absolute Scenes x.x.x.dmg` from [GitHub Releases](https://github.com/orinoco77/absolute-scenes/releases)
2. **Open the DMG file**
3. **Drag** the Absolute Scenes icon to the Applications folder
4. **First launch**: Right-click the app → "Open" (to bypass Gatekeeper warning)
5. **Subsequent launches**: Open normally from Applications or Spotlight

**Post-Installation:**
- The `absolute-scenes` command is available in Terminal
- `.book` files open with Absolute Scenes by default

#### Linux Installation

**Ubuntu/Debian (.deb):**

```bash
# Download the .deb package, then:
sudo dpkg -i absolute-scenes_x.x.x_amd64.deb
sudo apt-get install -f  # Install dependencies if needed
```

**RHEL/Fedora (.rpm):**

```bash
# Download the .rpm package, then:
sudo rpm -i absolute-scenes-x.x.x.x86_64.rpm
```

**Universal AppImage:**

```bash
# Download the AppImage, then:
chmod +x Absolute-Scenes-x.x.x.AppImage
./Absolute-Scenes-x.x.x.AppImage
```

**Post-Installation:**
- Launch from Applications menu or `absolute-scenes` command
- `.book` files are associated with the application

### Command Line Usage

Absolute Scenes includes full command-line support:

```bash
# Launch the application
absolute-scenes

# Open a specific book file
absolute-scenes /path/to/your/book.book

# Open the last book you were working on
absolute-scenes --last

# Show version information
absolute-scenes --version

# Show help
absolute-scenes --help
```

### Creating Your First Book

1. **Launch Absolute Scenes** from your applications menu or command line
2. **Click "New Book"** or press `Ctrl/Cmd + N`
3. **Enter book details**:
   - Book Title
   - Author Name
4. **Start writing** in the default first chapter and scene
5. **Save your book** with `Ctrl/Cmd + S`

### Understanding the Interface

The Absolute Scenes interface has several key areas:

**Main Panels:**
- **Book Structure** (left): Chapter and scene navigation tree
- **Editor** (center): Writing area for the current scene
- **Tabs** (top): Switch between Scenes, Characters, Locations, Background, Threads

**Toolbar Buttons:**
- 📁 **New Book**: Create a new book project
- 💾 **Save**: Save current work (auto-saves every few seconds)
- 📤 **Export**: Generate PDF or HTML versions
- ⚙️ **Template Settings**: Configure typography and formatting
- 🔗 **GitHub Integration**: Set up cloud backup and sync

**Status Bar** (bottom): Shows save status, word count, and sync status

---

## Core Features

### Scene-Based Organization

#### Creating Chapters

1. Click **"📁+ Chapter"** button in the Book Structure panel
2. Enter a chapter title (e.g., "Chapter 1: The Beginning")
3. The chapter appears in the structure tree

**Chapter Operations:**
- **Rename**: Double-click the chapter name to edit
- **Reorder**: Drag and drop chapters to rearrange
- **Delete**: Right-click → Delete (moves to recycle bin)

#### Creating Scenes

1. Select a chapter in the Book Structure
2. Click **"📄+ Scene"** button
3. Enter a scene title (optional)
4. Start writing in the editor

**Scene Operations:**
- **Rename**: Double-click the scene name
- **Move**: Drag scenes to different chapters
- **Reorder**: Drag scenes within a chapter
- **Delete**: Right-click → Delete (moves to recycle bin)

#### Scene Numbering

Scenes are automatically numbered in the format `chapter.scene`:
- Chapter 1, Scene 1 → `1.1`
- Chapter 1, Scene 2 → `1.2`
- Chapter 2, Scene 1 → `2.1`

This numbering updates automatically when you reorder content.

### Writing Tools

#### Rich Text Editor

The scene editor supports:
- **Bold**, *Italic*, and _Underline_ formatting
- Paragraph styles (normal, heading, quote)
- Automatic smart quotes and typography
- Undo/Redo support
- Copy, cut, and paste

**Keyboard Shortcuts:**
- `Ctrl/Cmd + B`: Bold
- `Ctrl/Cmd + I`: Italic
- `Ctrl/Cmd + U`: Underline
- `Ctrl/Cmd + Z`: Undo
- `Ctrl/Cmd + Shift + Z`: Redo

#### Scene Notes

Each scene has a private notes area (not included in exports):
1. Click the **"Notes"** section below the editor
2. Add planning notes, research, or reminders
3. Notes auto-save with the scene

#### Word Count Tracking

Real-time word counts are displayed for:
- **Current Scene**: Shows in editor header
- **Current Chapter**: Shows in chapter header
- **Entire Book**: Shows in status bar

### Character Management

#### Creating Characters

1. Switch to the **"Characters"** tab
2. Click **"➕ Add Character"**
3. Fill in character details:
   - **Name**: Character's name (required)
   - **Role**: Protagonist, Antagonist, Supporting, Minor
   - **Avatar**: Choose an emoji or icon
   - **Description**: Physical appearance, personality
   - **Notes**: Development notes, backstory, relationships

#### Character Profiles

Character profiles include:
- **Basic Information**: Name, role, avatar
- **Description**: Detailed character information
- **Development Notes**: Character arc, motivations
- **Thread Tracking**: Shows which scenes feature this character

#### Character Operations

- **Edit**: Click a character to edit details
- **Delete**: Move to character recycle bin
- **Search**: Filter characters by name
- **Sort**: By name, role, or creation date

### Location Management

#### Creating Locations

1. Switch to the **"Locations"** tab
2. Click **"➕ Add Location"**
3. Fill in location details:
   - **Name**: Location name (required)
   - **Type**: City, Building, Room, Outdoor, etc.
   - **Icon**: Choose an emoji or icon
   - **Description**: Physical details, atmosphere
   - **Notes**: Story significance, key events

#### Location Tracking

Use locations to:
- Maintain consistency in setting descriptions
- Track where scenes take place
- Organize world-building details
- Plan scene logistics

### Background Information

The Background tab provides a dedicated space for world-building and planning:

#### Background Folders

Organize your notes into folders:
- **General Notes**: Story overview, themes, concepts
- **Characters**: Extended character development
- **Locations**: Detailed setting information
- **Plot**: Story structure, timelines
- **Research**: Historical facts, technical details
- **Custom Folders**: Create your own categories

#### Background Documents

1. Select a folder in the Background tab
2. Click **"➕ Add Document"**
3. Enter a document title
4. Write your background information
5. Documents auto-save

**Document Operations:**
- **Rename**: Double-click the title to edit
- **Move**: Drag documents between folders
- **Delete**: Remove documents you no longer need

---

## Writing & Organization

### Drag and Drop

Absolute Scenes uses intuitive drag-and-drop for organization:

#### Reordering Scenes

1. Click and hold a scene in the Book Structure
2. Drag to new position within same chapter
3. Release to drop
4. Scene numbers update automatically

#### Moving Scenes Between Chapters

1. Drag a scene from one chapter
2. Drop it onto another chapter
3. Scene is moved to the end of the target chapter
4. You can then reorder within the chapter

#### Reordering Chapters

1. Click and hold a chapter name
2. Drag up or down
3. Release to drop in new position
4. All scene numbers update automatically

### Recycle Bins

Deleted content goes to recycle bins (not permanently deleted):

#### Scene Recycle Bin

- Access via **"🗑️ Scene Recycle Bin"** button
- View all deleted scenes with timestamps
- **Restore**: Click scene → "Restore"
- **Permanent Delete**: Click scene → "Delete Permanently"
- **Empty Bin**: Delete all permanently

#### Character Recycle Bin

- Access via Characters tab → **"Recycle Bin"**
- Restore or permanently delete characters

#### Location Recycle Bin

- Access via Locations tab → **"Recycle Bin"**
- Restore or permanently delete locations

### Auto-Save

Absolute Scenes automatically saves your work:
- **Every 3 seconds** (checks in background, doesn't interrupt typing)
- **On scene change**
- **On application close**
- **Manual save** anytime with `Ctrl/Cmd + S`

**How it works:**
- Typing updates are debounced (300ms) for smooth performance
- Auto-save runs on a timer independently of your typing
- Your work is protected without any lag or interruption

**Save Status** shown in status bar:
- ✅ "Saved" - All changes saved
- ⏳ "Saving..." - Save in progress
- ❌ "Error" - Save failed (check permissions)

### Keyboard Shortcuts

#### File Operations
- `Ctrl/Cmd + N`: New Book
- `Ctrl/Cmd + O`: Open Book
- `Ctrl/Cmd + S`: Save Book
- `Ctrl/Cmd + Shift + S`: Save As
- `Ctrl/Cmd + E`: Export Book

#### Content Creation
- `Ctrl/Cmd + Shift + C`: New Chapter
- `Ctrl/Cmd + Shift + N`: New Scene

#### Editing
- `Ctrl/Cmd + B`: Bold
- `Ctrl/Cmd + I`: Italic
- `Ctrl/Cmd + U`: Underline
- `Ctrl/Cmd + Z`: Undo
- `Ctrl/Cmd + Shift + Z`: Redo
- `Ctrl/Cmd + Delete`: Delete Current Scene

#### Development
- `F12`: Toggle Developer Tools (for debugging)

---

## Publishing & Export

### Template Settings

Configure professional book formatting via **⚙️ Template Settings**:

#### Font Selection

Choose from premium book fonts:

**Premium Fonts:**
- **Palatino Linotype**: Elegant, professional (excellent for literary fiction)
- **EB Garamond**: Timeless classic (traditional feel)
- **Libre Baskerville**: Dramatic elegance (great for romance)
- **Adobe Caslon Pro**: Traditional authority (history, non-fiction)

**High-Quality Alternatives:**
- **Georgia**: Screen-optimized serif (versatile)
- **Crimson Text**: Modern, versatile (contemporary fiction)
- **Libre Caslon Text**: Open-source elegance

**Standard Fonts:**
- **Times New Roman**: Reliable classic

**Font Preview:**
- Live preview with sample text
- Adjustable preview size
- See how fonts look in your book

#### Genre Recommendations

Select your genre for optimized font recommendations:
- Literary Fiction
- Romance
- Thriller/Mystery
- Science Fiction/Fantasy
- Historical Fiction
- Non-Fiction
- Young Adult
- Children's Books

#### Page Size

Choose from professional book formats:
- **Trade Paperback (6×9)**: Most popular format
- **Mass Market (4.25×6.87)**: Compact paperback
- **Hardcover (6×9)**: Premium format
- **Large Print (6×9)**: Accessibility
- **Letter (8.5×11)**: US standard
- **A4**: International standard

#### Margins

Professional mirror margins for book binding:
- **Inside Margin**: Extra space for binding (default: 1.25 inches)
- **Outside Margin**: Outer edge (default: 1 inch)
- **Top Margin**: Default: 1 inch
- **Bottom Margin**: Default: 1 inch

Mirror margins ensure text doesn't get lost in the binding.

#### Text Formatting

**Text Alignment:**
- **Justified**: Professional book standard (recommended)
- **Left-aligned**: More casual appearance

**Paragraph Style:**
- **Indented**: First line indent (traditional)
- **Block**: No indent with space between paragraphs

**Line Height:**
- Adjustable from 1.0 to 2.0
- Recommended: 1.5-1.6 for readability

#### Chapter Headers

Customize how chapters appear:

**Header Styles:**
- **Numbered**: "Chapter 1", "Chapter 2", etc.
- **Titled**: Use your chapter title
- **Both**: "Chapter 1: The Beginning"
- **Custom**: Define your own format

**Header Options:**
- Font size and weight
- Alignment (left, center, right)
- Spacing above and below
- Page break before chapter

#### Running Headers

Professional headers on each page:
- **Left Pages**: Author name
- **Right Pages**: Book title
- Font and size customization
- Toggle on/off

### PDF Export

Generate print-ready PDF files:

1. Click **📤 Export** button
2. Select **"PDF"** format
3. Configure export options:
   - Include scene titles
   - Include scene breaks
   - Include table of contents
   - Apply template settings
4. Click **"Generate PDF"**
5. Choose save location

**PDF Features:**
- Professional typography from template settings
- Mirror margins for printing
- Running headers (if enabled)
- Proper page breaks
- Embedded fonts
- Print-ready quality

**Uses for PDF:**
- Submission to publishers
- Self-publishing print files
- Sharing with beta readers
- Professional proofreading
- Archive copies

### HTML Export

Export to clean HTML for web or ebook conversion:

1. Click **📤 Export** button
2. Select **"HTML"** format
3. Configure options:
   - Include styling
   - Include scene titles
   - Include scene breaks
4. Click **"Generate HTML"**
5. Save HTML file

**HTML Features:**
- Clean semantic markup
- Responsive design
- Web-ready formatting
- Easy conversion to EPUB or MOBI
- Shareable links

### Export Tips

**For Print Publishing:**
- Use PDF export with Trade Paperback (6×9) size
- Enable justified text and mirror margins
- Use a premium font (Palatino, Garamond, Baskerville)
- Include running headers
- Set line height to 1.5-1.6

**For Ebooks:**
- Export to HTML first
- Use tools like Calibre to convert to EPUB/MOBI
- Keep formatting simple
- Test on multiple devices

**For Beta Readers:**
- PDF with readable font and larger text
- Include scene breaks for easy reference
- Add page numbers

---

## Cloud Backup & Collaboration

### GitHub Integration

Absolute Scenes integrates with GitHub for cloud backup and version control:

#### Setting Up GitHub Sync

1. Click **🔗 GitHub Integration** button
2. Click **"Set Up GitHub Sync"**
3. **Create a Personal Access Token** (opens GitHub in your browser):
   - ✅ The **"repo" permission is already checked** (pre-configured for you)
   - **Expiration:** Set to **"No expiration"** (recommended for long-term book writing)
   - Click "Generate token"
   - Copy the token (starts with `ghp_`)
4. **Paste token** into Absolute Scenes
5. **Choose or create repository**:
   - Select existing repository, or
   - Enter name for new repository
6. **Enable auto-sync** (optional)

**Why this works:**
- ✅ Permissions are **pre-configured** - you don't need to select anything
- ✅ **"No expiration"** means you never need to renew the token
- ✅ GitHub will only revoke tokens that are **unused for 1 year** (your active book writing keeps them valid)

#### How GitHub Sync Works

When syncing is enabled:
- **Every save** creates a backup on GitHub
- **Commit message** includes timestamp
- **Version history** preserved in GitHub
- **Access anywhere** via GitHub.com
- **Collaboration** by sharing repository

#### Manual Sync

If auto-sync is disabled:
1. Make changes to your book
2. Click **"Sync to GitHub"** button
3. Wait for upload confirmation

#### Viewing Version History

1. Visit your repository on GitHub.com
2. View commit history
3. See all changes with timestamps
4. Download previous versions if needed

### Backup & Recovery

#### Creating Backups

**Automatic GitHub Backup:**
- Enabled via GitHub Integration
- Creates backup on every save
- Unlimited version history

**Manual Backup:**
- Use **Save As** to create copies
- Copy `.book` files to external drive
- Export to PDF/HTML for archives

#### Recovering from Backup

**From GitHub:**
1. Click **🔗 GitHub Integration**
2. Click **"Recover from Backup"**
3. Select repository
4. Choose version to restore
5. Click **"Restore"**

**From Local Backup:**
1. Click **File → Open**
2. Navigate to backup `.book` file
3. Open the file
4. Use **Save As** to create new working copy

#### Best Practices

- **Enable GitHub sync** for automatic backup
- **Create manual backups** before major revisions
- **Test recovery** periodically
- **Keep local copies** on external drive
- **Version naming**: Use descriptive names for Save As copies

---

## Advanced Features

### Character Thread Visualization

Visualize which characters appear in which scenes:

1. Switch to **"Threads"** tab
2. View character appearance matrix:
   - **Rows**: Characters in your book
   - **Columns**: Scenes in your book
   - **Dots**: Character appears in scene
3. Click a scene to jump to it

**Uses:**
- **Balance character development**: Ensure main characters appear enough
- **Track subplots**: See when supporting characters appear
- **Identify gaps**: Find chapters missing key characters
- **Plan arcs**: Visualize character story arcs

#### Character Detection

Absolute Scenes automatically detects character names in scene text:
- Scans scene content for character names
- Marks scenes where characters appear
- Updates visualization in real-time

#### Blacklist Management

Prevent common words from being detected as characters:

1. Go to **Threads** tab
2. Click **"Manage Blacklist"**
3. Add words to exclude (e.g., "the", "and", "chapter")
4. Detection updates automatically

Common blacklist words:
- Articles: "the", "a", "an"
- Conjunctions: "and", "but", "or"
- Common verbs: "said", "went", "looked"
- Generic terms: "man", "woman", "person"

### Distraction-Free Mode

Focus on writing without UI clutter:

1. Press `F11` or click **"Distraction-Free Mode"**
2. Editor expands to full screen
3. Press `Esc` to exit

**Features:**
- Minimal interface
- Just your text and basic formatting
- Word count still visible
- Auto-save still active

### Front Matter & Back Matter

Add professional book sections:

#### Front Matter

Material before the main story:
- Title Page
- Copyright Page
- Dedication
- Acknowledgments
- Table of Contents
- Foreword/Preface

**Managing Front Matter:**
1. Switch to **"Front Matter"** tab
2. Add sections in order
3. Edit content for each section
4. Include in PDF export

#### Back Matter

Material after the main story:
- Epilogue
- Afterword
- Appendices
- Author Bio
- About the Author
- Bibliography

**Managing Back Matter:**
1. Switch to **"Back Matter"** tab
2. Add sections
3. Edit content
4. Include in export

### Illustrations

Add images to your book:

1. Switch to **"Illustrations"** tab
2. Click **"Add Illustration"**
3. Upload image file
4. Add caption and description
5. Assign to specific scene or chapter

**Illustration Management:**
- Organize by chapter
- Add captions
- Control placement
- Include in PDF export

### Custom Fonts

Load custom fonts beyond the built-in options:

1. Go to **Template Settings**
2. Click **"Custom Font"**
3. Upload font file (.ttf or .otf)
4. Select font for use

**Note:** Custom fonts must have appropriate licenses for commercial use.

---

## File Format Reference

### .book File Structure

Absolute Scenes uses JSON-based `.book` files with this structure:

```json
{
  "title": "Your Book Title",
  "author": "Author Name",
  "chapters": [
    {
      "id": "unique-chapter-id",
      "title": "Chapter 1: The Beginning",
      "scenes": [
        {
          "id": "unique-scene-id",
          "title": "Opening Scene",
          "content": "<p>Your scene content...</p>",
          "notes": "Private author notes",
          "wordCount": 1234,
          "created": "2024-01-01T00:00:00.000Z",
          "modified": "2024-01-01T12:00:00.000Z"
        }
      ],
      "wordCount": 1234
    }
  ],
  "characters": [
    {
      "id": "character-id",
      "name": "Character Name",
      "role": "Protagonist",
      "avatar": "🧑",
      "description": "Character description",
      "notes": "Development notes"
    }
  ],
  "locations": [
    {
      "id": "location-id",
      "name": "Location Name",
      "type": "City",
      "icon": "🏙️",
      "description": "Location description",
      "notes": "Location notes"
    }
  ],
  "backgroundFolders": [
    {
      "id": "folder-id",
      "title": "General Notes",
      "documents": [
        {
          "id": "document-id",
          "title": "World Building Notes",
          "content": "<p>Background information...</p>",
          "created": "2024-01-01T00:00:00.000Z",
          "modified": "2024-01-01T12:00:00.000Z"
        }
      ]
    }
  ],
  "template": {
    "fontFamily": "Palatino Linotype",
    "fontSize": 12,
    "lineHeight": 1.6,
    "pageSize": "trade-paperback",
    "genre": "literary-fiction",
    "textAlign": "justified",
    "paragraphStyle": "indented",
    "pageMargins": {
      "top": 1,
      "bottom": 1,
      "inside": 1.25,
      "outside": 1
    },
    "chapterHeader": {
      "style": "both",
      "fontSize": 18,
      "alignment": "center",
      "pageBreak": true
    },
    "runningHeaders": {
      "enabled": true,
      "fontSize": 10,
      "showAuthor": true,
      "showTitle": true
    }
  },
  "github": {
    "enabled": false,
    "repository": "",
    "autoSync": false,
    "lastSyncTime": null
  },
  "characterDetectionBlacklist": ["the", "and", "but"],
  "metadata": {
    "created": "2024-01-01T00:00:00.000Z",
    "modified": "2024-01-01T12:00:00.000Z",
    "version": "1.4.22",
    "wordCount": 12345
  }
}
```

### File Compatibility

**Opening .book Files:**
- Double-click `.book` file (if file association set up)
- File → Open in Absolute Scenes
- Command line: `absolute-scenes path/to/file.book`

**Sharing .book Files:**
- Email or cloud storage services
- GitHub for version control
- USB drives or network shares

**Import/Export:**
- Currently supports native `.book` format
- Export to PDF and HTML
- Future: Import from Word, Scrivener, etc.

---

## Developer Guide

### Technology Stack

**Frontend:**
- **React 18**: Modern component-based UI
- **React Hooks**: State management (useState, useEffect, useContext)
- **Context API**: Global state without Redux

**Desktop Framework:**
- **Electron 35**: Cross-platform desktop application
- **IPC**: Secure main/renderer process communication
- **electron-store**: Settings persistence

**Build Tools:**
- **Vite**: Fast development and building
- **electron-builder**: Multi-platform packaging
- **Babel**: JavaScript transpilation

**PDF/Export:**
- **jsPDF**: PDF generation
- **html2canvas**: Screenshot rendering
- **Custom font loading**: Premium typography support

**Testing:**
- **Jest**: Unit testing framework
- **React Testing Library**: Component testing
- **42 test suites**: Comprehensive coverage

**Version Control:**
- **GitHub API (GraphQL)**: Cloud sync
- **Octokit**: GitHub API client
- **simple-git**: Local Git operations

### Project Structure

```
absolute-scenes/
├── public/
│   ├── electron.js              # Electron main process
│   └── preload.js               # IPC bridge (secure)
├── src/
│   ├── components/              # React components
│   │   ├── App.jsx                  # Main application
│   │   ├── BookStructure.jsx        # Chapter/scene tree
│   │   ├── SceneEditor.jsx          # Writing interface
│   │   ├── SceneList.jsx            # Scene navigation
│   │   ├── CharacterEditor.jsx      # Character management
│   │   ├── CharacterList.jsx        # Character browser
│   │   ├── LocationEditor.jsx       # Location management
│   │   ├── LocationList.jsx         # Location browser
│   │   ├── BackgroundEditor.jsx     # Background info editor
│   │   ├── BackgroundList.jsx       # Background navigation
│   │   ├── CharacterThreadVisualization.jsx  # Thread view
│   │   ├── TemplateManager.jsx      # Format settings
│   │   ├── FontSettings.jsx         # Font configuration
│   │   ├── FontPreview.jsx          # Font preview
│   │   ├── ExportDialog.jsx         # Export configuration
│   │   ├── GitHubIntegration.jsx    # Cloud sync setup
│   │   ├── BackupRecovery.jsx       # Backup restoration
│   │   ├── StatusBar.jsx            # Status display
│   │   ├── DistractionFreeMode.jsx  # Focused writing
│   │   ├── FrontMatterEditor.jsx    # Front matter sections
│   │   ├── BackMatterEditor.jsx     # Back matter sections
│   │   └── SpellCheckSettings.jsx   # Spell check config
│   ├── hooks/                   # Custom React hooks
│   │   ├── useBookState.js          # Book data state
│   │   ├── useUIState.js            # UI state management
│   │   ├── useBookOperations.js     # Book CRUD operations
│   │   ├── useDragAndDrop.js        # Drag/drop functionality
│   │   ├── useExpandableList.js     # Collapsible lists
│   │   └── useInlineEdit.js         # Inline editing
│   ├── services/                # Business logic services
│   │   ├── SaveService.js           # Auto-save management
│   │   ├── GitHubSyncService.js     # GitHub sync logic
│   │   ├── EventHandlerService.js   # Event coordination
│   │   └── ThemeService.js          # Theme management
│   ├── utils/                   # Utility functions
│   │   ├── fontManager.js           # Font loading & management
│   │   ├── fontSettingsManager.js   # Font configuration
│   │   ├── customFontLoader.js      # Custom font loading
│   │   ├── fontPreview.js           # Font preview generation
│   │   ├── exportManager.js         # Export orchestration
│   │   ├── pdfExporter.js           # PDF generation
│   │   ├── htmlExporter.js          # HTML generation
│   │   ├── epubExporter.js          # EPUB generation
│   │   ├── characterAnalyzer.js     # Character detection
│   │   ├── gitHubService.js         # GitHub API wrapper
│   │   ├── browserEnhancedGitHubService.js  # Enhanced sync
│   │   ├── browserCollaborationService.js   # Collaboration
│   │   ├── fileOperations.js        # File I/O
│   │   ├── electronHelpers.js       # Electron utilities
│   │   ├── textProcessing.js        # Text manipulation
│   │   └── frontMatterUtils.js      # Front matter helpers
│   ├── __tests__/               # Integration tests
│   └── index.jsx                # React entry point
├── assets/                      # Build assets
│   ├── icon.png                 # Application icon
│   ├── installer.nsh            # Windows installer script
│   ├── linux-post-install.sh   # Linux post-install
│   └── entitlements.mac.plist   # macOS entitlements
├── package.json                 # Dependencies & scripts
├── vite.config.js               # Vite configuration
├── jest.config.js               # Jest configuration
└── electron-builder.yml         # Build configuration
```

### Development Setup

#### Prerequisites

- **Node.js**: v16 or higher
- **npm**: v8 or higher
- **Git**: For version control

#### Clone and Install

```bash
# Clone the repository
git clone https://github.com/orinoco77/absolute-scenes.git
cd absolute-scenes

# Install dependencies
npm install
```

#### Development Workflow

**Start Development:**

```bash
# Terminal 1: Start Vite dev server (React hot reload)
npm start

# Terminal 2: Start Electron in dev mode
npm run electron-dev
```

The app will launch with:
- React hot module replacement (instant updates)
- Developer tools enabled
- Debug logging active

**Keyboard Shortcuts in Dev Mode:**
- `F12`: Toggle DevTools
- `Ctrl/Cmd + R`: Reload app
- `Ctrl/Cmd + Q`: Quit

#### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

**Test Structure:**
- Unit tests: `src/**/__tests__/*.test.js`
- Integration tests: `src/__tests__/*.test.js`
- Coverage goal: >80% for critical paths

#### Code Quality

**Linting:**

```bash
# Check for linting errors
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Fail build on warnings (CI)
npm run lint:check
```

**Formatting:**

```bash
# Format code with Prettier
npm run format

# Check formatting without changes
npm run format:check
```

**Pre-commit Hooks:**
- Husky runs linting and tests before commits
- Prevents broken code from being committed

#### Building for Production

**Build React App:**

```bash
npm run build
```

This creates optimized production files in `build/`.

**Create Installers:**

```bash
# Build for all supported platforms
npm run dist

# Build for specific platform
npm run dist -- --win     # Windows only
npm run dist -- --mac     # macOS only
npm run dist -- --linux   # Linux only
```

**Output:**
- Windows: `dist/Absolute Scenes Setup x.x.x.exe`
- macOS: `dist/Absolute Scenes x.x.x.dmg`
- Linux: `dist/absolute-scenes_x.x.x_amd64.deb` (and .rpm, .AppImage)

### Architecture Patterns

#### Component Structure

Components follow this pattern:

```jsx
import React, { useState, useEffect } from 'react';

/**
 * Component description
 * @param {Object} props - Component props
 */
const MyComponent = ({ book, onUpdate }) => {
  // State
  const [localState, setLocalState] = useState(null);

  // Effects
  useEffect(() => {
    // Side effects
  }, [dependencies]);

  // Handlers
  const handleAction = () => {
    // Action logic
    onUpdate(newData);
  };

  // Render
  return (
    <div className="my-component">
      {/* Component JSX */}
    </div>
  );
};

export default MyComponent;
```

#### State Management

**Global State** (Context API):
- Book data (chapters, scenes, characters)
- UI state (active scene, sidebar visibility)
- Settings (template, GitHub config)

**Local State** (useState):
- Form inputs
- UI interactions
- Temporary data

#### IPC Communication

Electron IPC for secure main/renderer communication:

```javascript
// Renderer process (React)
window.electron.ipcRenderer.invoke('save-file', data);

// Main process (Electron)
ipcMain.handle('save-file', async (event, data) => {
  // File system operations
});
```

**Available IPC Channels:**
- `save-file`: Save .book file
- `open-file`: Open file picker
- `export-pdf`: Generate PDF
- `github-sync`: Sync to GitHub

### API Reference

#### Core Hooks

**useBookState:**
```javascript
const { book, setBook, chapters, characters } = useBookState();
```

**useBookOperations:**
```javascript
const {
  addChapter,
  deleteChapter,
  addScene,
  deleteScene,
  moveScene
} = useBookOperations(book, setBook);
```

**useUIState:**
```javascript
const {
  activeScene,
  setActiveScene,
  sidebarOpen,
  toggleSidebar
} = useUIState();
```

#### Utility Functions

**fontManager:**
```javascript
import { loadFont, getAvailableFonts } from './utils/fontManager';

const fonts = getAvailableFonts();
await loadFont('Palatino Linotype');
```

**exportManager:**
```javascript
import { exportToPDF, exportToHTML } from './utils/exportManager';

await exportToPDF(book, settings);
await exportToHTML(book, settings);
```

**gitHubService:**
```javascript
import { syncToGitHub, recoverFromGitHub } from './utils/gitHubService';

await syncToGitHub(token, repo, book);
const book = await recoverFromGitHub(token, repo, commitSha);
```

### Contributing Code

#### Workflow

1. **Fork** the repository on GitHub
2. **Clone** your fork: `git clone https://github.com/YOUR-USERNAME/absolute-scenes.git`
3. **Create branch**: `git checkout -b feature/my-feature`
4. **Install dependencies**: `npm install`
5. **Make changes** with tests
6. **Test**: `npm test`
7. **Lint**: `npm run lint:fix`
8. **Commit**: `git commit -m "Add my feature"`
9. **Push**: `git push origin feature/my-feature`
10. **Open Pull Request** on GitHub

#### Pull Request Guidelines

**PR Title Format:**
- `feat: Add character relationship tracking`
- `fix: Resolve PDF export margin issue`
- `docs: Update installation instructions`
- `test: Add tests for scene editor`

**PR Description Should Include:**
- What the PR does
- Why the change is needed
- How to test it
- Screenshots (if UI changes)
- Related issues

**Before Submitting:**
- ✅ Tests pass (`npm test`)
- ✅ Linting passes (`npm run lint`)
- ✅ Code is formatted (`npm run format`)
- ✅ No console errors in development
- ✅ Manually tested the feature

### Release Process

**Versioning:**
- Follow Semantic Versioning (SemVer)
- Format: `MAJOR.MINOR.PATCH` (e.g., 1.4.22)
- Increment:
  - MAJOR: Breaking changes
  - MINOR: New features (backward compatible)
  - PATCH: Bug fixes

**Release Steps:**
1. Update version in `package.json`
2. Update `CHANGELOG.md` (if exists)
3. Run tests: `npm test`
4. Build: `npm run dist`
5. Create Git tag: `git tag v1.4.22`
6. Push: `git push origin v1.4.22`
7. Create GitHub Release with binaries
8. Announce in community channels

---

## Troubleshooting

### Installation Issues

#### Windows: "Windows protected your PC"

**Cause:** SmartScreen filter for unsigned applications

**Solution:**
1. Click **"More info"**
2. Click **"Run anyway"**
3. Installer will proceed normally

**Note:** Signing certificates are expensive; this is normal for open-source software.

#### macOS: "App can't be opened because it is from an unidentified developer"

**Cause:** Gatekeeper security on unsigned apps

**Solution:**
1. Right-click the app icon
2. Select **"Open"**
3. Click **"Open"** in confirmation dialog
4. App will open and be remembered

**Alternative:**
```bash
xattr -cr "/Applications/Absolute Scenes.app"
```

#### Linux: "Permission denied"

**Cause:** AppImage needs execute permission

**Solution:**
```bash
chmod +x Absolute-Scenes-*.AppImage
./Absolute-Scenes-*.AppImage
```

### Application Errors

#### "Failed to save file"

**Possible Causes:**
- No write permission to file location
- Disk full
- File locked by another application

**Solutions:**
1. **Check permissions**: Save to Documents folder
2. **Check disk space**: Free up space
3. **Close other apps**: Close file explorers viewing the file
4. **Use Save As**: Save to different location

#### "Failed to load book"

**Possible Causes:**
- Corrupted `.book` file
- Incompatible version
- File permissions

**Solutions:**
1. **Check file integrity**: Open in text editor (should be valid JSON)
2. **Restore from backup**: Use GitHub recovery or local backup
3. **Update Absolute Scenes**: Ensure latest version
4. **Report issue**: File a bug report with the file

#### "Export failed"

**Possible Causes:**
- Font not loaded
- Insufficient memory
- Very large book (>1000 pages)

**Solutions:**
1. **Use system font**: Switch to Times New Roman temporarily
2. **Close other apps**: Free up memory
3. **Export in parts**: Export one chapter at a time
4. **Simplify formatting**: Reduce complex formatting

### GitHub Sync Issues

#### "Authentication failed" or "Token expired"

**Cause:** Invalid or expired Personal Access Token

**Solution:**
1. Click **🔗 GitHub Integration** → **"Set Up GitHub Sync"**
2. On the GitHub page that opens:
   - The **"repo" permission is already selected** (pre-configured)
   - Set **Expiration** to **"No expiration"**
   - Click **"Generate token"**
3. Copy the token (starts with `ghp_`)
4. Paste into Absolute Scenes

**Why this happens:**
- Tokens expire if you set an expiration date when creating them
- GitHub automatically revokes tokens unused for 1 year
- Using "No expiration" solves this for long-term book writing projects

#### "Repository not found"

**Possible Causes:**
- Repository deleted
- Token doesn't have access
- Typo in repository name

**Solutions:**
1. **Verify repository exists**: Visit GitHub.com
2. **Check token permissions**: Regenerate token
3. **Re-enter repository name**: Format: `username/repository`

#### "Sync taking too long"

**Cause:** Large book or slow internet connection

**Solutions:**
1. **Wait patiently**: First sync takes longer
2. **Check internet**: Test connection speed
3. **Disable auto-sync**: Sync manually when needed

### Performance Issues

#### "App is slow"

**Possible Causes:**
- Very large book (>500,000 words)
- Memory leak (rare)
- Background apps

**Solutions:**
1. **Split book**: Divide into multiple .book files (trilogy, etc.)
2. **Restart app**: Clear memory
3. **Close other apps**: Free up system resources
4. **Update OS**: Ensure latest system updates

#### "Export takes forever"

**Cause:** Large book with complex formatting

**Solutions:**
1. **Use simpler template**: Reduce font complexity
2. **Export to HTML first**: Faster than PDF
3. **Split book**: Export one part at a time

### Data Loss Prevention

#### "I lost my changes!"

**Prevention:**
- Auto-save runs every 3 seconds
- Enable GitHub sync for cloud backup
- Use Save As to create manual backups

**Recovery:**
1. **Check for auto-saved file**: Look in last save location
2. **Recover from GitHub**: Use Backup Recovery feature
3. **Check recycle bin**: Deleted scenes might be recoverable

#### Best Practices

1. **Enable GitHub Sync**: Automatic cloud backup
2. **Regular Manual Backups**: Save As to external drive weekly
3. **Version Naming**: Use dates in filenames (`mybook-2024-01-15.book`)
4. **Test Recovery**: Practice restoring from backup quarterly

---

## FAQ

### General Questions

**Q: Is Absolute Scenes free?**

A: Yes, Absolute Scenes is free and open-source under the MIT License. You can use it for personal or commercial projects at no cost.

**Q: What platforms does it support?**

A: Windows 10+, macOS 10.14+, and Linux (Ubuntu, Debian, Fedora, RHEL). Both 64-bit and 32-bit architectures on Windows.

**Q: Can I use it offline?**

A: Yes! Absolute Scenes works entirely offline. GitHub sync is optional and only requires internet when syncing.

**Q: What file format does it use?**

A: Absolute Scenes uses `.book` files, which are JSON-based text files. They're human-readable and can be opened in a text editor if needed.

**Q: Can I open my files on multiple computers?**

A: Yes! Use GitHub sync to access your books from multiple computers, or manually copy `.book` files via USB drive, email, or cloud storage.

### Writing & Editing

**Q: Can I format text (bold, italic, etc.)?**

A: Yes, the scene editor supports basic rich text formatting including bold, italic, underline, and paragraph styles.

**Q: Does it have spell check?**

A: Not currently built-in, but you can export to Word or use OS-level spell checking in your browser.

**Q: Can I add images to my book?**

A: Yes, use the Illustrations tab to add images and assign them to specific scenes or chapters.

**Q: How do I reorder scenes?**

A: Simply drag and drop scenes in the Book Structure panel. You can move them within chapters or between chapters.

**Q: Can I write out of order?**

A: Absolutely! Create scenes in any order and rearrange them later. This is one of the key advantages of scene-based writing.

### Export & Publishing

**Q: Can I export to Word?**

A: Not directly, but you can export to HTML and then open in Word. PDF export is the primary format for publishing.

**Q: Are the PDFs print-ready?**

A: Yes! PDFs use professional typography, mirror margins, running headers, and proper page breaks suitable for print-on-demand services like KDP, IngramSpark, or Lulu.

**Q: Can I create ebooks?**

A: Export to HTML and use tools like Calibre to convert to EPUB or MOBI formats for ebook platforms.

**Q: What about Amazon KDP?**

A: The PDF export works perfectly with Amazon KDP for paperback publishing. For Kindle ebooks, export HTML and convert to MOBI.

**Q: Can I include a table of contents?**

A: Yes, the PDF export option includes automatic table of contents generation based on your chapter structure.

### GitHub & Backup

**Q: Do I need to know Git to use GitHub sync?**

A: No! Absolute Scenes handles all Git operations automatically. You just need a GitHub account and a Personal Access Token.

**Q: Is my book private on GitHub?**

A: Yes, if you create a private repository (GitHub's default). Only you can access private repositories unless you explicitly share them.

**Q: How much does GitHub cost?**

A: GitHub is free for unlimited private repositories. You only need a free GitHub account.

**Q: Can I collaborate with co-authors?**

A: Yes! Share your GitHub repository with collaborators. They can clone the repository and work on the same book, though merge conflicts may occur if editing simultaneously.

**Q: What if GitHub is down?**

A: Your local `.book` file always remains on your computer. GitHub is only for backup and sync; you can continue working offline.

### Characters & Organization

**Q: How many characters can I add?**

A: No limit! Add as many characters, locations, and background documents as you need.

**Q: Does character thread visualization update automatically?**

A: Yes! As you write and mention character names in scenes, the visualization updates in real-time.

**Q: Can I add custom metadata to characters?**

A: You can add name, role, avatar, description, and notes. For more detailed tracking, use Background documents.

**Q: How do I organize research notes?**

A: Use the Background tab to create folders and documents for research, world-building, timelines, and development notes.

### Technical Questions

**Q: Does it autosave?**

A: Yes! Auto-save runs every 3 seconds after you stop typing, and also when changing scenes or closing the app.

**Q: Can I customize the interface?**

A: Currently, the interface is fixed, but theme customization is on the roadmap.

**Q: Does it support multiple languages?**

A: The UI is in English, but you can write in any language. Unicode is fully supported.

**Q: How do I report bugs?**

A: File an issue on [GitHub Issues](https://github.com/orinoco77/absolute-scenes/issues) with details about the problem and your system.

**Q: Can I request features?**

A: Yes! Open a feature request on GitHub Issues or discuss in GitHub Discussions.

### Comparison Questions

**Q: How is this different from Scrivener?**

A: Absolute Scenes is free, open-source, and focused specifically on scene-based organization with modern GitHub integration. Scrivener has more features but is commercial software.

**Q: How is this different from Word?**

A: Word is a general-purpose word processor. Absolute Scenes is designed specifically for book writing with chapter/scene organization, character tracking, and professional book formatting built-in.

**Q: How is this different from Google Docs?**

A: Google Docs requires internet and stores data in Google's cloud. Absolute Scenes is desktop-based, works offline, and you control where your data is stored.

---

## Resources

### Official Links

- **GitHub Repository**: https://github.com/orinoco77/absolute-scenes
- **Releases & Downloads**: https://github.com/orinoco77/absolute-scenes/releases
- **Issue Tracker**: https://github.com/orinoco77/absolute-scenes/issues
- **Discussions**: https://github.com/orinoco77/absolute-scenes/discussions
- **Documentation**: https://github.com/orinoco77/absolute-scenes/wiki

### Community

- **Email Support**: ajs@shiny.org.uk
- **Bug Reports**: GitHub Issues
- **Feature Requests**: GitHub Discussions
- **Questions**: GitHub Discussions Q&A

### Development

- **Source Code**: https://github.com/orinoco77/absolute-scenes
- **Contributing Guide**: See "Contributing" section above
- **Developer Setup**: See "Developer Guide" section
- **API Reference**: See "Developer Guide → API Reference"

### External Resources

**Writing Craft:**
- [Helping Writers Become Authors](https://www.helpingwritersbecomeauthors.com/) - Story structure
- [The Creative Penn](https://www.thecreativepenn.com/) - Self-publishing
- [Writers & Artists](https://www.writersandartists.co.uk/) - Publishing industry

**Self-Publishing:**
- [Amazon KDP](https://kdp.amazon.com/) - Kindle Direct Publishing
- [IngramSpark](https://www.ingramspark.com/) - Wide distribution
- [Draft2Digital](https://www.draft2digital.com/) - Ebook distribution
- [Reedsy](https://reedsy.com/) - Professional services

**Formatting & Typography:**
- [Practical Typography](https://practicaltypography.com/) - Typography guide
- [The Book Designer](https://www.thebookdesigner.com/) - Book design tutorials

**Tools:**
- [Calibre](https://calibre-ebook.com/) - Ebook conversion
- [Grammarly](https://www.grammarly.com/) - Grammar checking
- [ProWritingAid](https://prowritingaid.com/) - Writing improvement

---

## License & Credits

### License

Absolute Scenes is licensed under the **MIT License**:

```
MIT License

Copyright (c) 2025 Adam Short

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

**What this means:**
- ✅ Free to use for personal and commercial projects
- ✅ Free to modify and distribute
- ✅ No warranty or liability
- ✅ Must include license and copyright notice

### Credits

**Created By:**
- Adam Short (ajs@shiny.org.uk)

**Built With:**
- React - UI framework
- Electron - Desktop framework
- jsPDF - PDF generation
- Octokit - GitHub API
- And many other open-source libraries

**Special Thanks:**
- All contributors and beta testers
- The open-source community
- Authors who provided feedback and feature ideas

### Typography Acknowledgments

Premium fonts mentioned in this application:
- **Palatino Linotype** - Hermann Zapf
- **Garamond** - Claude Garamond (EB Garamond by Georg Duffner)
- **Baskerville** - John Baskerville (Libre Baskerville by Impallari Type)
- **Caslon** - William Caslon (Adobe Caslon Pro, Libre Caslon Text)
- **Georgia** - Matthew Carter (Microsoft)
- **Crimson Text** - Sebastian Kosch

Please ensure you have proper licenses for any fonts you use commercially.

---

## Changelog

### Version 1.4.22 (Current)

Recent updates include:
- Package management improvements
- Build pipeline fixes
- Distribution enhancements
- Documentation updates

For complete version history, see the [README Version History](https://github.com/orinoco77/absolute-scenes#version-history).

---

## Support

### Getting Help

**For General Questions:**
- Check this wiki
- Search [GitHub Discussions](https://github.com/orinoco77/absolute-scenes/discussions)
- Post in GitHub Discussions Q&A

**For Bug Reports:**
- Search existing [issues](https://github.com/orinoco77/absolute-scenes/issues)
- If not found, create new issue with:
  - Operating system and version
  - Steps to reproduce
  - Expected vs. actual behavior
  - Screenshots if relevant
  - Sample `.book` file if applicable

**For Feature Requests:**
- Check existing feature requests
- Open new discussion in Ideas category
- Describe use case and benefits
- Consider implementation complexity

**For Direct Contact:**
- Email: ajs@shiny.org.uk
- Include "Absolute Scenes" in subject line

---

**Last Updated:** 2025-10-02
**Wiki Version:** 1.0
**App Version:** 1.4.22

---

_Made with ❤️ for authors who care about beautiful books_

> "Great stories deserve great tools. Absolute Scenes gives you the professional foundation to write, organize, and publish books that look as good as they read."
