# Absolute Scenes

**A professional, scene-based book writing application with print-ready PDF output and GitHub integration.**

Absolute Scenes is designed specifically for authors who want a structured approach to writing books with professional publishing features built-in. Unlike traditional word processors, it organizes your work by scenes and chapters, making it easier to manage complex narratives.

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

### 👥 **Character Management**
- Create detailed character profiles with avatars
- Track character descriptions, roles, and development notes
- Organize characters separately from your manuscript

### ☁️ **GitHub Integration**
- **Automatic cloud backup** of your manuscripts
- **Version history** to track changes over time
- **Access your work anywhere** through GitHub
- **Recovery tools** to restore books from backup

### 🚀 **Export Options**
- **PDF Export**: Print-ready PDFs with professional book formatting
- **HTML Export**: Clean web version for sharing or online publishing
- Customizable export settings (scene breaks, titles, formatting)

## 🖥️ **Screenshots**

*[Add screenshots here showing the main interface, character management, font selection, and PDF output]*

## 📋 **Requirements**

- **Desktop**: Windows 10+, macOS 10.14+, or Linux (Ubuntu 18.04+)
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 500MB free space
- **Internet**: Required for GitHub sync and font loading

## 🚀 **Installation**

### Option 1: Download Pre-built App
1. Go to [Releases](../../releases)
2. Download the installer for your platform:
   - **Windows**: `AbsoluteScenes-Setup-x.x.x.exe`
   - **macOS**: `AbsoluteScenes-x.x.x.dmg`
   - **Linux**: `AbsoluteScenes-x.x.x.AppImage`
3. Run the installer and follow the setup wizard

### Option 2: Build from Source
```bash
# Clone the repository
git clone https://github.com/yourusername/absolute-scenes.git
cd absolute-scenes

# Install dependencies
npm install

# Run in development mode
npm start

# Build for production
npm run build
npm run electron

# Create distributable packages
npm run dist
```

## 📖 **Quick Start Guide**

### 1. **Create Your First Book**
- Launch Absolute Scenes
- Enter your book title and author name
- Add a scene to the default first chapter
- Start writing

### 2. **Organize Your Story**
- Add new chapters with the **"📁+ Chapter"** button
- Add scenes to chapters with **"📄+ Scene"**
- Drag and drop to reorder content

### 3. **Manage Characters**
- Switch to the **"Characters"** tab
- Add character profiles with **"👤+ Character"**
- Track descriptions, roles, and development notes

### 4. **Set Up Professional Formatting**
- Click the **⚙️ Template Settings** button
- Choose your book's genre for font recommendations
- Select page size (Trade Paperback 6×9 is most popular)
- Configure margins, fonts, and chapter headers

### 5. **Connect GitHub for Backup**
- Click the **🔗 GitHub Integration** button
- Follow the setup wizard to connect your GitHub account
- Your book will automatically sync to the cloud

### 6. **Export Your Book**
- Click the **📤 Export** button
- Choose PDF for print-ready output
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
│   ├── Georgia - Screen-optimized
│   └── Crimson Text - Modern versatile
└── Standard System Fonts
    └── Times New Roman - Reliable classic
```

### **Professional Book Formatting**
- **Mirror Margins**: Different margins for odd/even pages accounting for binding
- **Running Headers**: Author on left pages, title on right pages
- **Chapter Headers**: Customizable formatting with multiple styles
- **Page Numbering**: Professional placement and formatting
- **Text Alignment**: Justified text like printed books

### **Smart Content Organization**
- **Scene Numbering**: Automatic numbering (1.1, 1.2, 2.1, etc.)
- **Word Count Tracking**: Per scene, chapter, and total
- **Drag & Drop**: Intuitive reordering of content
- **Recycle Bin**: Safety net for deleted content

## 🔧 **Configuration**

### **Template Settings**
Located in the Template Settings dialog (⚙️ button):

- **Font Selection**: Choose from premium book fonts
- **Page Size**: Letter, A4, Trade Paperback, Mass Market, etc.
- **Margins**: Configurable with mirror margin support
- **Text Alignment**: Left-aligned or justified
- **Chapter Headers**: Multiple formatting options
- **Running Headers**: Optional headers for professional look

### **GitHub Settings**
Located in GitHub Integration dialog (🔗 button):

- **Authentication**: Personal Access Token setup
- **Repository Management**: Automatic repository creation
- **Sync Settings**: Manual or automatic backup
- **Recovery Options**: Restore from any backup

## 🛠️ **Technical Details**

### **Built With**
- **Frontend**: React 18 with modern hooks
- **Desktop Framework**: Electron 25
- **PDF Generation**: jsPDF with custom font support
- **Styling**: Custom CSS with modern design
- **Version Control**: GitHub API integration
- **File Format**: JSON-based .book files

### **Architecture**
```
src/
├── components/          # React UI components
│   ├── BookStructure.js    # Main navigation
│   ├── SceneEditor.js      # Writing interface
│   ├── CharacterEditor.js  # Character management
│   ├── TemplateManager.js  # Formatting settings
│   └── ExportDialog.js     # Export functionality
├── utils/              # Core utilities
│   ├── fontManager.js      # Typography system
│   ├── exportManager.js    # PDF/HTML generation
│   ├── gitHubService.js    # Cloud sync
│   └── fileOperations.js   # File I/O
└── styles/             # CSS styling
    └── App.css             # Main styles
```

### **File Format**
Absolute Scenes uses a structured JSON format (.book files):
```json
{
  "title": "Your Book Title",
  "author": "Author Name",
  "chapters": [
    {
      "id": "unique-id",
      "title": "Chapter 1",
      "scenes": [
        {
          "id": "scene-id",
          "title": "Scene Title",
          "content": "Scene content with markdown support",
          "notes": "Private notes about this scene"
        }
      ]
    }
  ],
  "characters": [...],
  "template": {...},
  "github": {...}
}
```

## 🤝 **Contributing**

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### **Development Setup**
```bash
# Fork and clone the repository
git clone https://github.com/yourusername/absolute-scenes.git
cd absolute-scenes

# Install dependencies
npm install

# Start development server
npm start

# In another terminal, start Electron
npm run electron-dev
```

### **Pull Request Process**
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📝 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- **Typography**: Font recommendations based on professional publishing standards
- **Design**: Inspired by traditional book publishing workflows

## 📞 **Support**

- **Issues**: [GitHub Issues](../../issues)
- **Discussions**: [GitHub Discussions](../../discussions)
- **Documentation**: [Wiki](../../wiki)

## 🗺️ **Roadmap**

### **Upcoming Features**
- [ ] **Collaborative Editing**: Multiple authors working on the same book
- [ ] **Advanced Analytics**: Detailed writing statistics and progress tracking
- [ ] **Mobile Companion**: Read-only mobile app for reviewing on the go
- [ ] **Advanced Export**: EPUB, MOBI, and InDesign formats
- [ ] **AI Writing Assistant**: Grammar checking and style suggestions

### **Version History**
- **v1.0.0**: Initial release with core writing and export features
- **v1.1.0**: Added GitHub integration and cloud backup
- **v1.2.0**: Enhanced typography system with premium fonts
- **v1.3.0**: Character management and improved UI

---

**Made with ❤️ for authors who care about beautiful books**