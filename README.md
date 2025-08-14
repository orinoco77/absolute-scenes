# Absolute Scenes

**A professional, scene-based book writing application with print-ready PDF output and GitHub
integration.**

**Version:** <!--VERSION-->1.3.65<!--/VERSION--> | **Tests:** <!--TESTS-->427/427<!--/TESTS--> ✅ |
**Last Updated:** <!--DATE-->2025-08-16<!--/DATE-->

Absolute Scenes is designed specifically for authors who want a structured approach to writing books
with professional publishing features built-in. Unlike traditional word processors, it organizes
your work by scenes and chapters, making it easier to manage complex narratives.

## ✨ Key Features

### 📖 **Scene-Based Writing**

- Organize your book by chapters and scenes instead of one long document
- Drag-and-drop to reorder chapters and scenes
- Move scenes between chapters effortlessly
- Built-in recycle bin to recover deleted content

### 🎨 **Professional Typography**

- **Premium book fonts** including Palatino Linotype, Garamond, Baskerville, and more
- **Genre-based font recommendations** (Literary Fiction, Romance, Thriller, etc.)
- **Live font preview** with sample text
- Automatic font optimization for different book formats

### 📚 **Print-Ready Publishing**

- **Professional page layouts** with mirror margins for book binding
- **Multiple book formats**: Trade Paperback (6×9), Mass Market, Hardcover, Large Print
- **Running headers** with author name and book title
- **Proper chapter formatting** with customizable headers
- **Justified text** and traditional paragraph styling

### 👥 **Character & Location Management**

- Create detailed character profiles with avatars and descriptions
- Track character roles, development notes, and relationships
- Manage story locations with descriptions and notes
- Visual character thread tracking across scenes
- Organize characters and locations separately from your manuscript

### 📚 **Background Information Panel**

- Dedicated workspace for world-building and development notes
- Organize information in folders (General Notes, Characters, Locations, etc.)
- Editable document titles with double-click functionality
- Consistent typography with main writing areas
- Expandable folder structure for easy content organization
- Auto-save functionality with real-time updates

### 🗺️ **Story Visualization**

- **Character Thread Visualization**: See which characters appear in which scenes
- Track character development across your entire book
- Identify plot threads and story arcs visually
- Character detection blacklist for common words

### ☁️ **GitHub Integration**

- **Automatic cloud backup** of your manuscripts
- **Version history** to track changes over time
- **Access your work anywhere** through GitHub
- **Recovery tools** to restore books from backup
- **Automatic sync** on save (optional)

### 🚀 **Export Options**

- **PDF Export**: Print-ready PDFs with professional book formatting
- **HTML Export**: Clean web version for sharing or online publishing
- Customizable export settings (scene breaks, titles, formatting)

### 💻 **Professional Installation**

- **System-wide installation** to proper directories (Program Files, Applications, /opt)
- **Command line access** via `absolute-scenes` command
- **File associations** for `.book` files - double-click to open
- **Desktop and Start Menu shortcuts** automatically created

## 🖥️ **Installation**

### **System Requirements**

- **Windows**: Windows 10+ (installs to `C:\Program Files\Absolute Scenes\`)
- **macOS**: macOS 10.14+ (installs to `/Applications/Absolute Scenes.app`)
- **Linux**: Modern Linux with systemd (installs to `/opt/Absolute Scenes/`)
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 500MB free space
- **Internet**: Required for GitHub sync and font loading

### **Download & Install**

#### **Windows**

1. Download `Absolute Scenes Setup x.x.x.exe` from [Releases](../../releases)
2. **Run as Administrator** (required for system-wide installation)
3. Follow the installer wizard
4. ✅ App installed to Program Files with command line access

#### **macOS**

1. Download `Absolute Scenes x.x.x.dmg` from [Releases](../../releases)
2. Open the DMG and drag to Applications folder
3. First launch: Right-click → Open (to bypass Gatekeeper)
4. ✅ App installed to Applications with command line access

#### **Linux**

Choose your preferred package format:

**Ubuntu/Debian (.deb)**:

```bash
# Download the .deb file, then:
sudo dpkg -i absolute-scenes_x.x.x_amd64.deb
sudo apt-get install -f  # Fix any dependency issues
```

**RHEL/Fedora (.rpm)**:

```bash
# Download the .rpm file, then:
sudo rpm -i absolute-scenes-x.x.x.x86_64.rpm
```

**Universal (AppImage)**:

```bash
# Download the .AppImage file, then:
chmod +x Absolute-Scenes-x.x.x.AppImage
./Absolute-Scenes-x.x.x.AppImage
```

### **Command Line Usage**

After installation, you can use Absolute Scenes from any command prompt or terminal:

```bash
# Launch the application
absolute-scenes

# Open a specific book file
absolute-scenes /path/to/your/book.book

# Open the last book you were working on
absolute-scenes --last

# Show version information
absolute-scenes --version
```

### **File Associations**

The installer automatically sets up file associations for `.book` files:

- ✅ **Double-click** any `.book` file to open it in Absolute Scenes
- ✅ **Right-click context menu** shows "Open with Absolute Scenes"
- ✅ **File icons** display with Absolute Scenes branding

## 📖 **Quick Start Guide**

### 1. **Create Your First Book**

- Launch Absolute Scenes (from Start Menu, Applications, or `absolute-scenes` command)
- Enter your book title and author name
- Add a scene to the default first chapter
- Start writing!

### 2. **Organize Your Story**

- Add new chapters with the **"📁+ Chapter"** button
- Add scenes to chapters with **"📄+ Scene"**
- Drag and drop to reorder content
- Use the recycle bin to recover deleted content

### 3. **Manage Characters, Locations & Background**

- Switch to the **"Background"** tab to create world-building notes and development documents
- Switch to the **"Characters"** tab to create character profiles
- Switch to the **"Locations"** tab to define story settings
- Use the **"Threads"** tab to visualize character appearances across scenes
- Organize information in folders and edit document titles by double-clicking

### 4. **Set Up Professional Formatting**

- Click the **⚙️ Template Settings** button
- Choose your book's genre for font recommendations
- Select page size (Trade Paperback 6×9 is most popular)
- Configure margins, fonts, and chapter headers

### 5. **Connect GitHub for Backup**

- Click the **🔗 GitHub Integration** button
- Follow the setup wizard to connect your GitHub account
- Your book will automatically sync to the cloud on each save

### 6. **Export Your Book**

- Click the **📤 Export** button
- Choose PDF for print-ready output or HTML for web sharing
- Configure export options and generate your book

## 🎯 **Advanced Features**

### **Premium Typography System**

```
Available Font Categories:
├── Premium Book Fonts (Best Quality)
│   ├── Palatino Linotype - Elegant, professional
│   ├── EB Garamond - Timeless classic
│   ├── Libre Baskerville - Dramatic elegance
│   └── Adobe Caslon Pro - Traditional authority
├── High-Quality Alternatives
│   ├── Georgia - Screen-optimized serif
│   ├── Crimson Text - Modern versatile
│   └── Libre Caslon Text - Open-source elegance
└── Standard System Fonts
    └── Times New Roman - Reliable classic
```

### **Professional Book Formatting**

- **Mirror Margins**: Different margins for odd/even pages accounting for binding
- **Running Headers**: Author on left pages, title on right pages
- **Chapter Headers**: Multiple styles (numbered, titled, custom format)
- **Page Numbering**: Professional placement and formatting
- **Text Alignment**: Justified text like printed books
- **Line Height & Spacing**: Optimized for readability

### **Smart Content Organization**

- **Automatic Scene Numbering**: Format like 1.1, 1.2, 2.1, etc.
- **Word Count Tracking**: Real-time counts per scene, chapter, and total
- **Drag & Drop Interface**: Intuitive reordering of content
- **Multi-level Recycle Bin**: Separate bins for scenes, characters, and locations
- **Auto-save**: Never lose your work with automatic saving

### **Character Thread Visualization**

- **Visual Character Mapping**: See exactly which characters appear in which scenes
- **Character Detection**: Automatic detection of character names in scene text
- **Blacklist Management**: Exclude common words from character detection
- **Thread Analysis**: Identify major and minor character arcs
- **Scene Coverage**: Ensure balanced character development

## 🔧 **Configuration**

### **Template Settings**

Access via the ⚙️ Template Settings button:

- **Font Selection**: Choose from premium book fonts with live preview
- **Page Size**: Letter, A4, Trade Paperback (6×9), Mass Market, Hardcover, Large Print
- **Margins**: Fully configurable with mirror margin support for binding
- **Text Alignment**: Left-aligned or fully justified
- **Chapter Headers**: Multiple formatting styles and customization options
- **Running Headers**: Optional professional headers with author/title
- **Genre Presets**: Optimized settings for different book genres

### **GitHub Integration**

Access via the 🔗 GitHub Integration button:

- **Personal Access Token**: Secure authentication setup
- **Repository Management**: Automatic repository creation and management
- **Sync Settings**: Manual or automatic backup on save
- **Recovery Options**: Restore from any previous backup
- **Collaboration**: Share repositories with co-authors or editors

### **Keyboard Shortcuts**

- **Ctrl/Cmd + N**: New Book
- **Ctrl/Cmd + O**: Open Book
- **Ctrl/Cmd + S**: Save Book
- **Ctrl/Cmd + Shift + S**: Save As
- **Ctrl/Cmd + E**: Export Book
- **Ctrl/Cmd + Shift + C**: New Chapter
- **Ctrl/Cmd + Shift + N**: New Scene
- **Ctrl/Cmd + Delete**: Delete Current Scene
- **F12**: Toggle Developer Tools

## 🛠️ **Development**

**Code Quality:** <!--TESTS-->427/427<!--/TESTS--> tests passing ✅ | **Total Commits:**

<!--COMMITS-->81<!--/COMMITS--> | **Latest:** <!--COMMIT-->6ba337b - New collaboration feature. Real git integration and merging (3 minutes ago)<!--/COMMIT-->

### **Built With**

- **Frontend**: React 18 with modern hooks and context API
- **Desktop Framework**: Electron 25 with secure IPC communication
- **PDF Generation**: jsPDF with custom font loading and advanced layout
- **Styling**: Modern CSS with responsive design principles
- **Version Control**: GitHub API v4 (GraphQL) integration
- **File Format**: Structured JSON-based .book files
- **Testing**: Jest with React Testing Library

### **Architecture**

```
src/
├── components/              # React UI components
│   ├── BookStructure.js        # Main navigation and chapter/scene tree
│   ├── SceneEditor.js          # Rich text writing interface
│   ├── CharacterEditor.js      # Character profile management
│   ├── LocationEditor.js       # Location management
│   ├── CharacterThreadVisualization.js  # Visual character tracking
│   ├── TemplateManager.js      # Typography and formatting settings
│   ├── ExportDialog.js         # PDF/HTML export configuration
│   ├── GitHubIntegration.js    # Cloud sync and backup
│   ├── BackupRecovery.js       # Recovery from GitHub backups
│   └── StatusBar.js            # Save status and sync indicators
├── utils/                   # Core utilities and services
│   ├── fontManager.js          # Premium typography system
│   ├── exportManager.js        # PDF/HTML generation engine
│   ├── gitHubService.js        # GitHub API wrapper
│   ├── fileOperations.js       # Local file I/O operations
│   └── characterDetection.js   # Smart character name detection
├── styles/                  # CSS styling
│   └── App.css                 # Main application styles
└── __tests__/              # Test suites
    ├── components/             # Component tests
    └── utils/                  # Utility function tests
```

### **File Format Specification**

Absolute Scenes uses a structured JSON format (.book files):

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
          "content": "Your scene content with rich text formatting...",
          "notes": "Private author notes about this scene",
          "created": "2024-01-01T00:00:00.000Z",
          "modified": "2024-01-01T12:00:00.000Z"
        }
      ]
    }
  ],
  "characters": [
    {
      "id": "character-id",
      "name": "Character Name",
      "description": "Character description and background",
      "role": "Protagonist/Antagonist/Supporting",
      "avatar": "🧑",
      "notes": "Character development notes"
    }
  ],
  "locations": [
    {
      "id": "location-id",
      "name": "Location Name",
      "description": "Location description",
      "type": "Setting type",
      "icon": "🏠",
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
          "title": "Document Title",
          "content": "Background information and notes...",
          "created": "2024-01-01T00:00:00.000Z",
          "modified": "2024-01-01T12:00:00.000Z"
        }
      ]
    }
  ],
  "characterDetectionBlacklist": ["the", "and", "but", "..."],
  "template": {
    "fontFamily": "Palatino Linotype",
    "fontSize": 12,
    "lineHeight": 1.6,
    "paragraphStyle": "indented",
    "pageSize": "trade-paperbook",
    "genre": "literary-fiction",
    "pageMargins": { "top": 1, "bottom": 1, "inside": 1.25, "outside": 1 },
    "textAlign": "justified",
    "chapterHeader": {
      /* chapter formatting options */
    },
    "runningHeaders": {
      /* header configuration */
    }
  },
  "github": {
    "repository": "username/book-repository",
    "lastSyncTime": "2024-01-01T12:00:00.000Z"
  },
  "metadata": {
    "created": "2024-01-01T00:00:00.000Z",
    "modified": "2024-01-01T12:00:00.000Z",
    "version": "1.3.18"
  }
}
```

### **Development Setup**

```bash
# Clone the repository
git clone https://github.com/yourusername/absolute-scenes.git
cd absolute-scenes

# Install dependencies
npm install

# Start React development server
npm start

# In another terminal, start Electron in development mode
npm run electron-dev

# Run tests
npm test

# Lint code
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format

# Check code formatting
npm run format:check

# Build for production
npm run build

# Create distributable packages
npm run dist
```

### **Building Installers**

The project uses electron-builder with custom configuration for professional installation:

```bash
# Build all platforms (requires appropriate OS)
npm run dist

# Build for specific platforms
npm run dist -- --win    # Windows NSIS installer
npm run dist -- --mac    # macOS DMG
npm run dist -- --linux  # Linux DEB, RPM, and AppImage
```

**Generated Installers**:

- **Windows**: `dist/Absolute Scenes Setup x.x.x.exe` (NSIS installer with PATH setup)
- **macOS**: `dist/Absolute Scenes x.x.x.dmg` (DMG with Applications folder)
- **Linux**: `dist/absolute-scenes_x.x.x_amd64.deb`, `.rpm`, and `.AppImage`

## 🤝 **Contributing**

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### **Development Workflow**

1. **Fork** the repository on GitHub
2. **Clone** your fork locally
3. **Create** a feature branch: `git checkout -b feature/amazing-feature`
4. **Install** dependencies: `npm install`
5. **Start** development server: `npm start`
6. **Make** your changes and test thoroughly
7. **Run** tests: `npm test`
8. **Commit** changes: `git commit -m 'Add amazing feature'`
9. **Push** to your fork: `git push origin feature/amazing-feature`
10. **Open** a Pull Request with detailed description

### **Code Standards**

- **ESLint + Prettier**: Automated code quality and formatting (see [ESLINT.md](ESLINT.md) for
  details)
- **Code Quality**: ESLint enforces logic, imports, and React best practices
- **Code Formatting**: Prettier handles indentation, quotes, and visual consistency
- **React Best Practices**: Proper hooks usage and component structure
- **Testing**: Add tests for new features and bug fixes
- **Documentation**: Update README and code comments
- **Commits**: Use clear, descriptive commit messages

## 🐛 **Bug Reports & Feature Requests**

### **Reporting Bugs**

- **Search** existing issues first
- **Include** steps to reproduce
- **Attach** sample .book files if relevant
- **Specify** your OS and version
- **Add** screenshots if applicable

### **Feature Requests**

- **Describe** the feature and its benefits
- **Explain** how it fits with existing functionality
- **Consider** implementation complexity
- **Discuss** in GitHub Discussions first for major features

## 📝 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- **Typography**: Font recommendations based on professional publishing standards
- **Design**: Inspired by traditional book publishing workflows and modern writing tools
- **Community**: Thanks to all contributors and beta testers
- **Open Source**: Built with amazing open-source libraries and tools

## 📞 **Support & Community**

- **🐛 Bug Reports**: [GitHub Issues](../../issues)
- **💬 Discussions**: [GitHub Discussions](../../discussions)
- **📚 Documentation**: [Project Wiki](../../wiki)
- **📧 Email**: ajs@shiny.org.uk

## 🗺️ **Development & Roadmap**

**Current Release: v<!--VERSION-->1.3.65<!--/VERSION-->** - See [Version History](#version-history)
below for recent updates. **Current Release: v<!--VERSION-->1.3.65<!--/VERSION-->** - See
[Version History](#version-history) below for recent updates.

For upcoming features, development priorities, and detailed project planning, visit our
**[GitHub Projects](https://github.com/orinoco77/absolute-scenes/projects)** where we maintain an
active roadmap with:

- 🎯 **Current Sprint**: Features actively in development
- 📋 **Backlog**: Planned features with priority rankings
- 🐛 **Bug Tracking**: Known issues and their status
- 💡 **Feature Requests**: Community-suggested improvements

Want to influence the roadmap?
**[Open an issue](https://github.com/orinoco77/absolute-scenes/issues)** or join the discussion!

### **Version History**

<!--VERSION_HISTORY-->

- **v1.3.59**: More readme updates
- **v1.3.56**: fix some layout and character encoding issues
- **v1.3.55**: Collaboration first pass
- **v1.3.54**: Another go
- **v1.3.50**: Add cert stuff for deb and rpm
<!--/VERSION_HISTORY-->

---

**Made with ❤️ for authors who care about beautiful books**

_"Great stories deserve great tools. Absolute Scenes gives you the professional foundation to write,
organize, and publish books that look as good as they read."_

_Last updated <!--DATE-->2025-08-16<!--/DATE--> | Build <!--COMMIT-->6ba337b - New collaboration
feature. Real git integration and merging (3 minutes ago)<!--/COMMIT-->_
