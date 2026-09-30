# Absolute Scenes

**A scene-based book writing application with drafts, print-ready PDF and ebook export, and GitHub
sync.**

**Version:** <!--VERSION-->1.4.107<!--/VERSION--> | **Tests:** <!--TESTS-->1193/1193<!--/TESTS--> ✅
| **Last Updated:** <!--DATE-->2026-09-30<!--/DATE-->

Absolute Scenes is a desktop app for authors who want a structured way to write books. Instead of one
long document, your book is organised into parts, chapters and scenes, with characters, locations and
background notes alongside. When you're ready, it exports print-ready PDFs, standard manuscripts,
EPUB ebooks and HTML.

## ✨ Key Features

### 📖 **Scene-Based Writing**

- Organise your book into **parts, chapters and scenes**, with automatic scene numbering (1.1, 1.2,
  2.1…)
- Drag and drop to reorder parts, chapters and scenes. Move a scene to another chapter with its ↗️
  button.
- Word counts per scene, chapter and part
- Private notes on every scene
- Simple formatting toolbar: bold, italic, headings, paragraph and forced line breaks (Markdown-style).
  Ctrl/Cmd+B and Ctrl/Cmd+I toggle bold and italic on the selection.
- Find & replace, with its own undo and redo
- **Distraction-free mode** (F11 or the 🎯 button) for full-screen writing
- Recycle bins for the manuscript, characters, locations and background documents, so you can
  restore anything deleted during your session

### 📝 **Drafts & Revisions**

- **Drafts**: keep several versions of the whole book in one file. Start a new draft as a copy of the
  current text, an outline only (chapter and scene titles, no text), or a blank slate. Switch,
  rename and delete drafts from the draft menu in the toolbar.
- **Revisions**: try alternative versions of a single scene. Each scene's revision menu lets you
  create, switch between, rename and delete revisions. Scenes with more than one revision show a
  badge in the scene list.
- Characters, locations, front and back matter, illustrations, background notes and template settings
  are shared by all drafts
- Choose which draft to export

### 📄 **Front Matter, Back Matter & Illustrations**

- **Front matter**: copyright, dedication, acknowledgments, foreword, prologue and map
- **Back matter**: epilogue, acknowledgments, appendix, glossary, bibliography, index and about the
  author
- Turn sections on or off and keep them in standard publishing order
- **Full-page illustrations** placed on a chosen page, with optional captions and alt text

### 👥 **Characters, Locations & Background**

- Character profiles with an avatar, role, description and notes
- Location profiles with an icon, description, geography, climate, key features, story significance
  and notes
- A **Background** workspace for world-building and research, organised into folders of documents
- **Character threads**: automatic detection of character names in your scenes and a visual map of
  who appears where, with a blacklist to exclude words that aren't names

### 🎨 **Professional Typography & Layout**

- Book fonts including Palatino Linotype, EB Garamond, Cormorant Garamond, Adobe Caslon Pro, Libre
  Baskerville, Minion Pro, Sabon, Bembo, Crimson Text, Source Serif 4, Georgia and Times New Roman
- Font recommendations by genre (literary, romance, thriller, fantasy, non-fiction, academic,
  young adult and more), with a live preview
- Page sizes: US Letter, A4, Digest (5.5×8.5), Trade Paperback (6×9), Mass Market, Hardcover and Large
  Print
- Mirror margins for binding, justified or left-aligned text, and indented or line-separated
  paragraphs
- Chapter headers (numbered, titled, both or a custom format), optionally starting each chapter on a
  new page or a right-hand page
- Running headers: author name on left pages, book title on right pages, optionally skipped on
  chapter opening pages
- **Verse mode** for poetry, which keeps your line breaks and indentation and can keep verses
  together across page breaks

### 🚀 **Export**

- **PDF (Print Ready)**: book-formatted PDF using your template settings
- **PDF (Manuscript)**: standard submission format with Times New Roman 12pt, double spacing, a title
  page, running headers and page numbers, on A4 or US Letter
- **EPUB**: reflowable ebook for e-readers
- **HTML**: web preview of your book
- Options to include scene titles and scene breaks

### ☁️ **GitHub Sync**

- Connect with a GitHub personal access token. Create a new book repository or join an existing one
  to collaborate.
- Your book is stored in the repository as `book.json` plus one Markdown file per scene. Edits made
  on different devices are merged three ways, scene by scene.
- Syncs automatically when you switch scenes, when the window loses focus, when you close the app,
  every 2 minutes while there are changes, when you save, and when you open a book. **Sync Now** is
  also available in the GitHub dialog.
- Scenes with conflicting edits are flagged with a conflict badge in the scene list
- **Open from Backup** restores a book from any of your GitHub book repositories
- **Share with the mobile app**: show a QR code that connects the Absolute Scenes mobile app to the
  same GitHub account
- Commits carry your chosen author name. Scenes can be assigned to co-authors when more than one
  author works on a book.

### 💾 **Saving, Importing & More**

- Books are saved as `.book` files (structured JSON)
- Once a book has been saved, it autosaves every 3 seconds while you work
- **Import from Scrivener** (`.scriv` projects)
- Spell check with a choice of language and a personal dictionary
- Light and dark themes (Ctrl/Cmd+Shift+T)

## 🖥️ **Installation**

Installers for every platform are published on the [Releases](../../releases) page.

### **System Requirements**

- **Windows**: Windows 10 or later, 64-bit
- **macOS**: macOS 12 (Monterey) or later, Intel or Apple silicon
- **Linux**: 64-bit distribution supporting `.deb`, `.rpm` or AppImage
- **Internet**: needed only for GitHub sync

### **Windows**

1. Download `Absolute Scenes Setup x.x.x.exe` from [Releases](../../releases). A portable `.zip` is
   also available.
2. Run the installer. It installs for all users, so it asks for administrator permission, and you
   can choose the installation folder.
3. The installer creates desktop and Start Menu shortcuts, associates `.book` files, and adds an
   `absolute-scenes` command to your PATH

### **macOS**

1. Download `Absolute Scenes x.x.x.dmg` from [Releases](../../releases)
2. Open the DMG and drag the app to Applications
3. **First launch**: the app isn't signed with an Apple Developer certificate, so macOS may say it's
   damaged or can't be opened
   - **Quick fix**: right-click the app → **Open** → **Open**
   - **Or in Terminal**: `xattr -cr "/Applications/Absolute Scenes.app"`
   - See [MACOS-INSTALL.md](MACOS-INSTALL.md) for details

> **Why the warning?** Absolute Scenes isn't code-signed with an Apple Developer certificate. This is
> common for free open-source software, and you can check the source code here on GitHub.

### **Linux**

**Ubuntu/Debian (.deb)**:

```bash
sudo dpkg -i absolute-scenes_x.x.x_amd64.deb
sudo apt-get install -f  # Fix any dependency issues
```

**RHEL/Fedora (.rpm)**:

```bash
sudo rpm -i absolute-scenes-x.x.x.x86_64.rpm
```

The `.deb` and `.rpm` packages install to `/opt/Absolute Scenes/`, add an `absolute-scenes` command
and register the `.book` file type.

**AppImage** (any distribution):

```bash
chmod +x Absolute-Scenes-x.x.x.AppImage
./Absolute-Scenes-x.x.x.AppImage
```

### **Command Line**

On Windows and on Linux (`.deb`/`.rpm`), you can start the app from a terminal:

```bash
# Launch the application
absolute-scenes

# Open a specific book
absolute-scenes /path/to/your/book.book
```

`.book` files are associated with Absolute Scenes, so you can also double-click them to open them.

## 📖 **Quick Start Guide**

### 1. **Create Your Book**

- Launch Absolute Scenes and enter your book title and author name in the header
- Add a scene to the first chapter with **📄+ Scene** and start writing
- Save with Ctrl/Cmd+S. From then on, the book autosaves as you work.

### 2. **Organise Your Story**

- Use **📁+ Chapter**, **📄+ Scene** and **📚+ Part** in the Manuscript section
- Drag and drop to reorder content
- Add front matter, back matter and illustrations from their sections in the sidebar

### 3. **Build Your World**

- Use the **Characters**, **Locations** and **Background** sections for profiles and research notes
- Open **Threads** to see which characters appear in which scenes

### 4. **Try Drafts and Revisions**

- Open the **📝 Draft** menu in the toolbar to create, switch, rename or delete whole-book drafts
- Use the **Revision** menu above a scene to try an alternative version of just that scene

### 5. **Set Up Formatting**

- Click **⚙️ Template Settings** to choose a genre, fonts, page size, margins, chapter headers and
  running headers

### 6. **Connect GitHub**

- Click **🔗 GitHub Integration** and follow the steps: create a personal access token, enter it,
  set your author name, then create or join a book repository
- From then on, your book syncs automatically

### 7. **Export**

- Click **📤 Export Book**, choose the draft and format (print-ready PDF, manuscript PDF, EPUB or
  HTML), and export

## ⌨️ **Keyboard Shortcuts**

| Action                   | Shortcut                      |
| ------------------------ | ----------------------------- |
| New Book                 | Ctrl/Cmd+N                    |
| Open Book                | Ctrl/Cmd+O                    |
| Import from Scrivener    | Ctrl/Cmd+Shift+I              |
| Save Book                | Ctrl/Cmd+S                    |
| Save As                  | Ctrl/Cmd+Shift+S              |
| Export Book              | Ctrl/Cmd+E                    |
| New Part                 | Ctrl/Cmd+Shift+P              |
| New Chapter              | Ctrl/Cmd+Shift+C              |
| New Scene                | Ctrl/Cmd+Shift+N              |
| Delete Scene             | Ctrl/Cmd+Delete               |
| Delete Chapter           | Ctrl/Cmd+Shift+Delete         |
| Delete Part              | Ctrl/Cmd+Shift+Alt+Delete     |
| Toggle Recycle Bin       | Ctrl/Cmd+Shift+R              |
| Toggle Theme             | Ctrl/Cmd+Shift+T              |
| Template Settings        | Ctrl/Cmd+T                    |
| GitHub Integration       | Ctrl/Cmd+G                    |
| Backup Recovery          | Ctrl/Cmd+Shift+B              |
| Bold / Italic (editor)   | Ctrl/Cmd+B / Ctrl/Cmd+I       |
| Find & Replace (editor)  | Ctrl/Cmd+F                    |
| Forced line break        | Shift+Enter                   |
| Distraction-free mode    | F11 (in the scene editor)     |
| Toggle Developer Tools   | F12                           |

## 🛠️ **Development**

**Code Quality:** <!--TESTS-->1193/1193<!--/TESTS--> tests passing ✅ | **Total Commits:**

<!--COMMITS-->252<!--/COMMITS--> | **Latest:** <!--COMMIT-->0268509 - feat: migrate remaining draftOperations/revisionOperations importers onto @absolute-scenes/book-model (4 minutes ago)<!--/COMMIT-->

### **Built With**

- **UI**: React 18 with hooks
- **Desktop**: Electron 44
- **Build tooling**: Vite
- **PDF**: jsPDF with embedded book fonts
- **EPUB**: generated with JSZip
- **Sync**: [@absolute-scenes/git-sync](https://github.com/orinoco77/absolute-scenes-git-sync) over
  the GitHub REST API
- **File format**: JSON-based `.book` files
- **Testing**: Jest with React Testing Library
- **Code quality**: ESLint and Prettier, run before every commit by a Husky pre-commit hook

### **Architecture**

```
public/
└── electron.js               # Electron main process: window, menus, file dialogs, Scrivener import
src/
├── App.jsx                   # Top-level state, sync triggers and layout
├── components/               # React UI (.jsx)
│   ├── BookStructure.jsx         # Sidebar sections (manuscript, matter, characters, ...)
│   ├── SceneList.jsx             # Parts, chapters and scenes tree with drag and drop
│   ├── SceneEditor.jsx           # Scene writing view
│   ├── DraftSwitcher.jsx         # Toolbar draft menu
│   ├── RevisionChip.jsx          # Per-scene revision menu
│   ├── CharacterThreadVisualization.jsx
│   ├── TemplateManager.jsx       # Typography and layout settings
│   ├── ExportDialog.jsx          # Export format and draft selection
│   ├── GitHubIntegration.jsx     # GitHub setup, sync and mobile sharing
│   ├── BackupRecovery.jsx        # Open a book from GitHub
│   └── ...                       # Editors and lists for characters, locations, matter, etc.
├── hooks/                    # useBookState, useUIState, useDrafts, useDragAndDrop, ...
├── services/                 # gitSyncService, SaveService, EventHandlerService, ThemeService
├── utils/                    # Exporters, font manager, draft/revision operations, file I/O, ...
└── styles/                   # CSS split by area (base, header, scenes, themes, ...)
```

### **File Format**

A `.book` file is JSON. A shortened example:

```json
{
  "title": "Your Book Title",
  "author": "Author Name",
  "parts": [{ "id": "part-id", "title": "Part One", "chapterIds": ["chapter-id"] }],
  "chapters": [
    {
      "id": "chapter-id",
      "title": "The Beginning",
      "scenes": [
        {
          "id": "scene-id",
          "title": "Opening Scene",
          "content": "Text of the active revision...",
          "notes": "Private notes about this scene",
          "activeRevision": { "id": "rev-id", "label": "Revision 1", "created": "..." },
          "revisions": [
            { "id": "rev-2", "label": "Darker take", "created": "...", "content": "..." }
          ],
          "created": "2026-01-01T00:00:00.000Z",
          "modified": "2026-01-01T12:00:00.000Z"
        }
      ]
    }
  ],
  "activeDraft": { "id": "draft-id", "name": "Draft 1", "created": "..." },
  "drafts": [
    { "id": "draft-2", "name": "Rewrite", "created": "...", "parts": [], "chapters": [] }
  ],
  "frontMatter": [{ "id": "...", "type": "dedication", "title": "Dedication", "content": "..." }],
  "backMatter": [{ "id": "...", "type": "epilogue", "title": "Epilogue", "content": "..." }],
  "illustrations": [{ "id": "...", "title": "...", "pageNumber": 12, "imageData": "data:..." }],
  "characters": [{ "id": "...", "name": "...", "role": "...", "avatar": "🧑", "description": "..." }],
  "locations": [{ "id": "...", "name": "...", "icon": "🏠", "description": "..." }],
  "backgroundFolders": [{ "id": "...", "title": "General Notes", "documents": [] }],
  "characterDetectionBlacklist": ["..."],
  "template": { "fontFamily": "Palatino Linotype", "pageSize": "trade", "...": "..." },
  "github": { "repository": { "full_name": "user/book-repo" }, "lastSyncCommitSha": "..." },
  "metadata": { "created": "...", "modified": "..." }
}
```

`chapters` and `parts` always hold the **active** draft, and a scene's `content` is always its
**active** revision. Inactive drafts and revisions are kept in `drafts` and `revisions`. Books
created before drafts and revisions existed have neither field, and open as a single "Draft 1".

### **Development Setup**

```bash
git clone https://github.com/orinoco77/absolute-scenes.git
cd absolute-scenes
npm install

# Start the Vite dev server (http://localhost:3000)
npm start

# In another terminal, run Electron against the dev server
npm run electron-dev

# Tests, linting and formatting
npm test
npm run lint
npm run lint:fix
npm run format
npm run format:check

# Production build of the web assets
npm run build

# Build installers for the current platform
npm run dist
```

`npm start` alone also runs the app in a browser, with limited functionality (no file dialogs or
Electron menus).

Every commit runs the linter and the full test suite, bumps the patch version, and refreshes the
version, test and commit details in this README (see `scripts/update-readme.js`).

### **Building Installers**

```bash
npm run dist -- --win    # Windows NSIS installer and .zip (x64)
npm run dist -- --mac    # macOS DMG (Intel and Apple silicon)
npm run dist -- --linux  # .deb, .rpm and AppImage (x64)
```

Pushing a `v*` tag runs the **Build and Release** GitHub Actions workflow, which builds all three
platforms and publishes the installers to a GitHub Release.

## 🤝 **Contributing**

Contributions are welcome:

1. **Fork** the repository and clone your fork
2. **Create** a branch: `git checkout -b feature/your-feature`
3. **Install** dependencies with `npm install` and start the app with `npm start`
4. **Make** your changes, with tests for new behaviour and bug fixes
5. **Commit**. The pre-commit hook runs lint and tests, and must pass.
6. **Push** your branch and open a Pull Request with a clear description

## 🐛 **Bug Reports & Feature Requests**

Please use [GitHub Issues](../../issues). For bugs, include steps to reproduce, your OS and app
version, and screenshots or a sample `.book` file if relevant.

## 📝 **License**

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 📞 **Support**

- **🐛 Bug Reports**: [GitHub Issues](../../issues)
- **📧 Email**: ajs@shiny.org.uk

## 🗺️ **Roadmap & Version History**

**Current Release: v<!--VERSION-->1.4.107<!--/VERSION-->**

Upcoming features and priorities are tracked in
**[GitHub Projects](https://github.com/orinoco77/absolute-scenes/projects)**. Want to influence the
roadmap? **[Open an issue](https://github.com/orinoco77/absolute-scenes/issues)**.

### **Version History**

<!--VERSION_HISTORY-->
- **v1.4.103**: fix: parse nested bold/italic properly in exports
- **v1.4.83**: update package-lock.json
- **v1.4.82**: bump git sync version
- **v1.4.79-fix**: chore: mothball the Chocolatey release workflow
- **v1.4.79**: fix: resolve remaining transitive dependency vulnerabilities via npm audit fix
<!--/VERSION_HISTORY-->

---

**Made with ❤️ for authors who care about beautiful books**

_Last updated <!--DATE-->2026-09-30<!--/DATE--> | Build <!--COMMIT-->0268509 - feat: migrate remaining draftOperations/revisionOperations importers onto @absolute-scenes/book-model (4 minutes ago)<!--/COMMIT-->_
