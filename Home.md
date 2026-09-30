# Absolute Scenes Wiki

Welcome to the **Absolute Scenes** wiki: a guide to using, and developing, the scene-based book
writing app.

**Author:** Adam Short | **License:** MIT | For the current version, see the
[README](https://github.com/orinoco77/absolute-scenes#readme) or
[Releases](https://github.com/orinoco77/absolute-scenes/releases).

---

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Writing Your Book](#writing-your-book)
- [Drafts & Revisions](#drafts--revisions)
- [Characters, Locations & Background](#characters-locations--background)
- [Front Matter, Back Matter & Illustrations](#front-matter-back-matter--illustrations)
- [Saving & Recycle Bins](#saving--recycle-bins)
- [Formatting & Export](#formatting--export)
- [GitHub Sync](#github-sync)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [File Format Reference](#file-format-reference)
- [Developer Guide](#developer-guide)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)
- [Resources](#resources)
- [License & Credits](#license--credits)
- [Support](#support)

---

## Overview

### What is Absolute Scenes?

Absolute Scenes is a desktop app for writing books. Instead of treating your manuscript as one long
document, it organises your work into **parts, chapters and scenes**. You can reorder the story,
keep alternative drafts, track characters, and export print-ready and ebook versions, all from one
`.book` file.

### Why Scene-Based Writing?

- **Better organisation**: work on manageable pieces of the story
- **Easier revision**: move scenes and chapters around without cutting and pasting
- **Visible structure**: see the shape of your book at a glance
- **Room to experiment**: try a whole new draft, or an alternative version of one scene, without
  losing the original
- **Character tracking**: see which characters appear in which scenes

### Key Capabilities

- ✍️ Scene editor with simple Markdown formatting, find & replace and a distraction-free mode
- 📝 Whole-book **drafts** and per-scene **revisions**
- 📚 Print-ready PDF, standard manuscript PDF, EPUB and HTML export
- 👥 Characters, locations, background notes and character thread visualisation
- ☁️ GitHub sync that merges edits made on different devices, plus a companion mobile app
- 🎨 Book typography: fonts, genre recommendations, page sizes, mirror margins and running headers

### Platform Support

- **Windows**: Windows 10 or later, 64-bit
- **macOS**: macOS 12 (Monterey) or later, Intel and Apple silicon
- **Linux**: 64-bit, as `.deb`, `.rpm` or AppImage

---

## Getting Started

### Installation

Download installers from the [Releases](https://github.com/orinoco77/absolute-scenes/releases)
page.

#### Windows

1. Download `Absolute Scenes Setup x.x.x.exe`. A portable `.zip` is also available.
2. Run the installer. It installs for all users, so it asks for administrator permission.
3. Choose the installation folder (default: `C:\Program Files\Absolute Scenes\`)
4. Launch from the Start Menu or the desktop shortcut

The installer also:

- Associates `.book` files with Absolute Scenes (double-click to open)
- Adds an `absolute-scenes` command to your PATH

#### macOS

1. Download `Absolute Scenes x.x.x.dmg`
2. Open it and drag **Absolute Scenes** to Applications
3. **First launch**: the app isn't signed with an Apple Developer certificate, so macOS may say it
   is damaged or can't be opened. Right-click the app → **Open** → **Open**, or run:

   ```bash
   xattr -cr "/Applications/Absolute Scenes.app"
   ```

   See [MACOS-INSTALL.md](https://github.com/orinoco77/absolute-scenes/blob/main/MACOS-INSTALL.md)
   for details.

`.book` files open with Absolute Scenes. There is no `absolute-scenes` terminal command on macOS.

#### Linux

**Ubuntu/Debian (.deb):**

```bash
sudo dpkg -i absolute-scenes_x.x.x_amd64.deb
sudo apt-get install -f  # Fix any dependency issues
```

**RHEL/Fedora (.rpm):**

```bash
sudo rpm -i absolute-scenes-x.x.x.x86_64.rpm
```

The `.deb` and `.rpm` packages install to `/opt/Absolute Scenes/`, add an `absolute-scenes`
command, and register the `.book` file type.

**AppImage (any distribution):**

```bash
chmod +x Absolute-Scenes-x.x.x.AppImage
./Absolute-Scenes-x.x.x.AppImage
```

### Command Line Usage

On Windows, and on Linux with the `.deb` or `.rpm` package:

```bash
# Launch the application
absolute-scenes

# Open a specific book
absolute-scenes /path/to/your/book.book
```

There are no other command-line options.

### Creating Your First Book

1. Launch Absolute Scenes. A new, empty book opens with one chapter. Use **File → New Book** or
   `Ctrl/Cmd + N` to start another.
2. Type your **book title** and **author name** in the header
3. Click **📄+ Scene** to add a scene to Chapter 1, then start writing
4. Save with `Ctrl/Cmd + S` and choose where to keep the `.book` file. From then on it
   [autosaves](#autosave) as you work.

### Understanding the Interface

**Header (top):**

- Book title and author on the left
- Toolbar on the right: **📝 Draft** menu, **⚙️ Template Settings**, **📤 Export Book**,
  **🔗 GitHub Integration**, **📥 Open from Backup**

**Sidebar (left):** collapsible sections

- **Front Matter**, **Manuscript** (parts, chapters and scenes), **Back Matter**,
  **Illustrations**, **Background**, **Characters**, **Locations**, **Threads**

**Main area (centre):** the editor for whatever is selected: a scene, character, location,
document, front or back matter section, or illustration.

**Status bar (bottom):** the active draft's name and the save or sync status (see
[Status bar](#status-bar)), plus any operation in progress and an offline indicator.

---

## Writing Your Book

### Parts, Chapters & Scenes

The **Manuscript** section of the sidebar holds your book's structure.

- **📚+ Part**: parts group chapters into larger sections (optional)
- **📁+ Chapter**: adds a chapter
- **📄+ Scene**: adds a scene to the current chapter, shown as "Adding scenes to: …"

**Chapters:**

- **Rename**: double-click the chapter title
- **Reorder**: drag by the handle
- **Move to a part**: use the chapter's move-to-part button
- **Delete**: 🗑️ (goes to the recycle bin)

**Scenes:**

- **Rename**: edit the title at the top of the scene editor
- **Reorder**: drag within the same chapter
- **Move to another chapter**: click ↗️ and pick the chapter. Scenes can't be dragged between
  chapters.
- **Delete**: 🗑️ (goes to the recycle bin)

**Parts:** rename by double-clicking, reorder by dragging, and delete with 🗑️. Deleting a part keeps
its chapters.

#### Scene Numbering & Word Counts

Scenes are numbered `chapter.scene` (1.1, 1.2, 2.1…), and the numbers update when you reorder.
Word counts are shown for each scene, chapter and part, and in the scene editor.

### The Scene Editor

- **Title**: at the top of the editor
- **Revision menu**: next to the title (see [Revisions](#revisions))
- **Word count**
- **Formatting toolbar**:
  - **B** / **I**: bold and italic
  - **H**: heading
  - **¶**: paragraph break
  - **↵**: forced line break
  - **🎯**: distraction-free mode
- **Scene Notes**: private notes below the editor, not included in exports

#### Formatting

Text is formatted with Markdown: `**bold**`, `*italic*` and `## heading`.

- `Ctrl/Cmd + B` and `Ctrl/Cmd + I` toggle bold and italic on the selected text. Press both to get
  bold italic, and press again to remove the formatting.
- With nothing selected, they insert the markers with the cursor between them, ready to type
- `Shift + Enter` inserts a forced line break

#### Undo & Find

- `Ctrl/Cmd + Z` undoes, and `Ctrl/Cmd + Shift + Z` or `Ctrl/Cmd + Y` redoes, including formatting
  changes
- `Ctrl/Cmd + F` opens **Find & Replace**, with match-case and whole-word options

#### Spell Check

Spell checking is built in. Right-click a misspelt word for suggestions or **Add to dictionary**.
Choose the language under **Tools → Spell Check Settings**.

### Distraction-Free Mode

Press `F11` in the scene editor, or click 🎯, for a full-screen view with just your scene's title,
your text and a subtle word count. Formatting shortcuts and autosave keep working. Press `Esc` to
leave.

### Themes

Switch between **Light** and **Dark** themes with `Ctrl/Cmd + Shift + T` (**View → Toggle
Theme**).

---

## Drafts & Revisions

### Drafts

A **draft** is a whole version of your book: its parts, chapters and scenes. One book file can hold
several drafts, and you choose which one to work on.

Open the **📝 Draft** menu in the toolbar:

- **Switch**: click a draft's name. The active draft is ticked.
- **New draft…**: name it and choose how it starts:
  - **Copy current text**: a full copy of the active draft
  - **Outline only**: the same chapters and scene titles, with no text
  - **Blank slate**: a single empty chapter

  The new draft becomes active straight away.
- **Rename**: click ✎ next to any draft, type the new name, and press Enter (Esc cancels)
- **Delete**: click × next to an inactive draft. The active draft can't be deleted.

**Shared by all drafts:** characters, locations, background notes, front and back matter,
illustrations and template settings.

The status bar shows the active draft's name. When you export, you can choose which draft to
export.

### Revisions

A **revision** is an alternative version of a single scene, for when you want to try a scene
another way without losing the original.

Click the **Revision N of M** button next to the scene title:

- **Switch**: click a revision's name
- **New revision…**: give it a label, choose **Copy current text** or **Start blank**, and choose
  whether to switch to it now
- **Rename**: click **Rename "…"**, edit the name in place, and press Enter
- **Delete**: delete any revision except the active one

Scenes with more than one revision show a revision badge in the scene list. Exports use each
scene's active revision.

---

## Characters, Locations & Background

### Characters

Open **Characters** in the sidebar and click **Add Character**. Each character has:

- **Name**, **role** (e.g. protagonist, antagonist, supporting) and an **avatar** (emoji)
- **Description**
- **Quick notes & ideas**: arcs, relationships, anything else

Deleted characters go to the characters recycle bin.

### Locations

Open **Locations** and click **Add New Location**. Each location has:

- **Name** and an **icon** (emoji)
- **Description**
- **Geography & setting**, **climate & weather**, **key features**, **significance to story**
- **Additional notes**

Deleted locations go to the locations recycle bin.

### Background

The **Background** section is for world-building, research and planning notes, organised into
folders of documents. A new book starts with a **General Notes** folder.

- **New folder**: create folders for your own categories
- **New document**: adds a document to the current folder
- **Rename**: double-click a folder or document name
- **Reorder documents**: drag them
- **Delete**: documents go to the background recycle bin. Deleting a folder deletes its documents.

Documents have a formatting toolbar (bold, italic, section heading, bullet point, horizontal rule)
and support the same `Ctrl/Cmd + B` and `Ctrl/Cmd + I` shortcuts. The section header shows the total
number of documents and words.

### Character Threads

The **Threads** section finds character names in your scenes and draws a map of who appears where:
one column per scene, and one line per character.

- **Click a character's name** to highlight their thread. Use **Show Selected Only** to focus on
  the highlighted characters.
- **✕ next to a name** blacklists words that were wrongly detected as names. The blacklist is saved
  with your book. **Show Excluded** and **Restore All** bring them back.
- **✓** marks characters that are also in your Characters list
- **Filter mentions** and the **threshold** slider hide characters who are only mentioned in
  passing, rather than actually present

---

## Front Matter, Back Matter & Illustrations

### Front Matter

Sections that appear before the story: **copyright**, **dedication**, **acknowledgments**,
**foreword**, **map** and **prologue**. You can upload images, for example for a map.

### Back Matter

Sections that appear after the story: **epilogue**, **acknowledgments**, **appendix**,
**glossary**, **bibliography**, **index** and **about the author**. Images can be uploaded here
too.

Front and back matter sections can be turned on or off, and are kept in standard publishing order
in exports.

### Illustrations

**Full-page illustrations** are placed on a specific page of the exported book. Each illustration
has:

- A **title**
- A **page number**
- An **uploaded image**
- An optional **caption**
- **Alt text**, for accessibility

---

## Saving & Recycle Bins

### Saving

Books are saved as `.book` files. Use `Ctrl/Cmd + S` to save, and `Ctrl/Cmd + Shift + S` for Save
As.

#### Autosave

Once a book has been saved to a file, it **autosaves every 3 seconds** while there are unsaved
changes. A new book that has never been saved can't autosave, so the title and author fields show
an orange bar until you save it for the first time.

#### Status Bar

- **Unsaved changes**: edits not yet written to the file
- **Saving...**: a save is in progress
- **Saved locally**: everything is saved to the file
- **Synced to cloud** / **Synced Nm ago**: the time of the last GitHub sync
- **Offline**: no network connection, so GitHub sync can't run until you're back online

### Recycle Bins

Deleted items go to a recycle bin, where you can **restore** them, **permanently delete** them, or
**empty** the bin:

- **Manuscript**: scenes, chapters and parts. Open it with the 🗑️ button in the Manuscript section,
  or `Ctrl/Cmd + Shift + R`.
- **Characters**, **Locations** and **Background**: each has its own bin

Recycle bins last for your **current session only**. They are not saved in the book file. A deleted
scene whose chapter belongs to another draft stays in the bin until you switch back to that draft.

---

## Formatting & Export

### Template Settings

Open **⚙️ Template Settings** (`Ctrl/Cmd + T`).

#### Writing Type

- **Prose**: traditional books
- **Verse/Poetry**: keeps your line breaks and indentation. Optionally keep each verse together
  across page breaks.

#### Fonts

Pick a **genre** for recommendations: General Fiction, Literary Fiction, Romance,
Thriller/Mystery, Fantasy/Sci-Fi, Non-Fiction, Academic, Contemporary, Historical Fiction or
Young Adult.

Book fonts include:

- Palatino Linotype, EB Garamond, Cormorant Garamond
- Adobe Caslon Pro, Libre Baskerville, Minion Pro
- Sabon, Bembo, Crimson Text, Source Serif 4
- Georgia and Times New Roman

Some sans-serif and monospace fonts are also available. You can preview fonts before choosing.

#### Page Layout

- **Font size** and **line height**
- **Paragraph style**: indented (traditional) or line-separated (modern)
- **Page size**:
  - US Letter (8.5×11) or A4
  - Digest (5.5×8.5)
  - Trade Paperback (6×9)
  - Mass Market (4.25×6.87)
  - Hardcover (6.14×9.21)
  - Large Print (7×10)
- **Text alignment**: justified or left-aligned
- **Margins** in inches, with **mirror margins** (inside/outside) for printed books

#### Chapter Headers

- **Style**: "Chapter 1", chapter title only, "Chapter 1: Title", or a custom format
- **Font size**, **weight** (normal or bold) and **alignment**
- **Spacing** after the header, and line breaks before it
- **Page breaks**: start each chapter on a new page, and optionally always on a right-hand page

#### Running Headers

- Author name on left pages, book title on right pages
- Aligned to the outside edge or centred
- Optionally skipped on chapter opening pages

### Exporting

1. Click **📤 Export Book** (`Ctrl/Cmd + E`)
2. If the book has more than one draft, choose which **draft** to export
3. Choose the **format**:
   - **PDF (Print Ready)**: book formatting from your template settings, with mirror margins,
     running headers and your fonts
   - **PDF (Manuscript)**: standard submission format:
     - Times New Roman 12pt, double-spaced
     - left-aligned text with first-line indents
     - a title page with contact details
     - running headers and page numbers
     - on A4 or US Letter
   - **EPUB (Ebook)**: a reflowable ebook. Readers can change the font and size, and chapters are
     separated by spacing rather than page breaks.
   - **HTML (Web Preview)**
4. Choose whether to **include scene breaks** and **scene titles**
5. Click **Export** and choose where to save the file

### Export Tips

**Print publishing:**

- **PDF (Print Ready)**, sized to your printer's trim, such as Trade Paperback 6×9
- Justified text, mirror margins and running headers
- A book font such as Palatino, Garamond or Baskerville

**Agent or publisher submissions:** use **PDF (Manuscript)**.

**Ebooks:**

- Use **EPUB**
- For older Kindles that need MOBI, convert the EPUB with a tool such as
  [Calibre](https://calibre-ebook.com/)

---

## GitHub Sync

GitHub sync backs up your book, keeps its full history, and keeps several devices in step,
including the Absolute Scenes mobile app. You need a free GitHub account.

### Setting Up

Click **🔗 GitHub Integration** (`Ctrl/Cmd + G`) and follow the steps:

1. **Create an access token.** Absolute Scenes opens GitHub's token page with the **repo**
   permission already selected.
   - Set **Expiration** to **No expiration**, so you don't have to renew it
   - Click **Generate token**, and copy the token (it starts with `ghp_`)
2. **Enter your token** in Absolute Scenes
3. **Set your author name.** It is used on your commits and to tell co-authors apart.
4. **Set up the book repository**:
   - **Create New Repository** for this book, or
   - **Join Existing Repository** to collaborate on a book someone has shared with you
5. **Select the repository**

Once connected, the GitHub dialog also offers:

- **💾 Sync Now**
- A link to open the repository on GitHub
- **📱 Share Token with Mobile App**
- **🔓 Disconnect from GitHub**

### How Sync Works

Your book is stored in the repository as `book.json` (everything except the text) plus one Markdown
file per scene:

- `scenes/<sceneId>.md`: the text of each scene in the active draft
- `scenes/<sceneId>.rev-<revId>.md`: inactive revisions
- `scenes/drafts/<draftId>/…`: scenes in inactive drafts

Sync runs automatically:

- when you **switch scenes**
- when the app window **loses focus**
- when you **close the app**
- every **2 minutes** while there are changes
- when you **save**
- when you **open a book**

Each sync pulls changes from GitHub and pushes yours, and each sync that has changes becomes a
commit. When the same book has been edited on another device, edits are **merged scene by scene**.
Changes to different parts of a scene combine automatically.

If both devices changed the **same lines** of a scene, the scene gets a **conflict badge** in the
scene list. The scene's text contains both versions between conflict markers (`<<<<<<<`,
`=======`, `>>>>>>>`), ready for you to edit into the version you want.

**Switching drafts or revisions on two devices:** sync often, and switch drafts or revisions on one
device at a time. If you switch a draft or revision on one device while another device edits the
same material, the result can end up in the wrong draft or revision. Nothing is lost, because every
version stays in the repository's history.

### Collaboration

To write a book with a co-author:

1. Share the GitHub repository with them
2. They choose **Join Existing Repository**
3. With more than one author, each scene can be assigned to an author

### The Mobile App

In the GitHub dialog, click **📱 Share Token with Mobile App** to show a QR code. Scan it with the
Absolute Scenes mobile app to connect it to the same GitHub account, then open the book there.

The QR code contains your GitHub access token, so don't share it with anyone else.

### Opening a Book from GitHub

**📥 Open from Backup** (`Ctrl/Cmd + Shift + B`) lists your GitHub book repositories, with when each
was last updated, and opens the one you pick. Use it on a new computer, or to recover a book you no
longer have locally.

To see or recover an older version, browse the repository's commit history on GitHub.

---

## Keyboard Shortcuts

`Ctrl` on Windows and Linux, `Cmd` on macOS.

### File

| Action                | Shortcut               |
| --------------------- | ---------------------- |
| New Book              | `Ctrl/Cmd + N`         |
| Open Book             | `Ctrl/Cmd + O`         |
| Import from Scrivener | `Ctrl/Cmd + Shift + I` |
| Save Book             | `Ctrl/Cmd + S`         |
| Save As               | `Ctrl/Cmd + Shift + S` |
| Export Book           | `Ctrl/Cmd + E`         |

### Structure

| Action         | Shortcut                          |
| -------------- | --------------------------------- |
| New Part       | `Ctrl/Cmd + Shift + P`            |
| New Chapter    | `Ctrl/Cmd + Shift + C`            |
| New Scene      | `Ctrl/Cmd + Shift + N`            |
| Delete Scene   | `Ctrl/Cmd + Delete`               |
| Delete Chapter | `Ctrl/Cmd + Shift + Delete`       |
| Delete Part    | `Ctrl/Cmd + Shift + Alt + Delete` |

### Editing

| Action                | Shortcut                                                 |
| --------------------- | -------------------------------------------------------- |
| Bold / Italic         | `Ctrl/Cmd + B` / `Ctrl/Cmd + I`                          |
| Undo                  | `Ctrl/Cmd + Z`                                           |
| Redo                  | `Ctrl/Cmd + Shift + Z` or `Ctrl/Cmd + Y`                 |
| Find & Replace        | `Ctrl/Cmd + F`                                           |
| Forced line break     | `Shift + Enter`                                          |
| Distraction-free mode | `F11` (in the scene editor)                              |

### Tools & View

| Action                 | Shortcut                       |
| ---------------------- | ------------------------------ |
| Template Settings      | `Ctrl/Cmd + T`                 |
| GitHub Integration     | `Ctrl/Cmd + G`                 |
| Open from Backup       | `Ctrl/Cmd + Shift + B`         |
| Toggle Recycle Bin     | `Ctrl/Cmd + Shift + R`         |
| Toggle Theme           | `Ctrl/Cmd + Shift + T`         |
| Zoom In / Out / Reset  | `Ctrl/Cmd + +` / `-` / `0`     |
| Toggle Developer Tools | `F12`                          |

---

## File Format Reference

### .book File Structure

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
          "content": "Text of the active revision, in Markdown...",
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
  "frontMatter": [{ "id": "...", "type": "dedication", "title": "Dedication", "content": "...", "enabled": true }],
  "backMatter": [{ "id": "...", "type": "epilogue", "title": "Epilogue", "content": "...", "enabled": true }],
  "illustrations": [{ "id": "...", "title": "...", "pageNumber": 12, "caption": "...", "imageData": "data:..." }],
  "characters": [{ "id": "...", "name": "...", "role": "...", "avatar": "🧑", "description": "..." }],
  "locations": [{ "id": "...", "name": "...", "icon": "🏠", "description": "..." }],
  "backgroundFolders": [{ "id": "...", "title": "General Notes", "documents": [] }],
  "characterDetectionBlacklist": ["..."],
  "template": { "fontFamily": "Palatino Linotype", "pageSize": "trade", "...": "..." },
  "github": { "repository": { "full_name": "user/book-repo" }, "lastSyncCommitSha": "..." },
  "metadata": { "created": "...", "modified": "..." }
}
```

### Drafts and Revisions in the File

- `chapters` and `parts` always hold the **active** draft. `drafts` holds the inactive drafts,
  each with its own `chapters` and `parts`.
- A scene's `content` is always its **active** revision. `revisions` holds the inactive ones.
- Books created before drafts and revisions existed have neither field. They open as a single
  "Draft 1", with one revision per scene.

### Compatibility

- **Opening**: double-click a `.book` file, use **File → Open Book**, or run
  `absolute-scenes path/to/book.book`
- **Importing**: **File → Import from Scrivener** (`.scriv` projects)
- **Exporting**: PDF, EPUB and HTML. See [Exporting](#exporting).
- `.book` files are plain JSON, so they can be opened in a text editor if needed

---

## Developer Guide

### Technology Stack

- **UI**: React 18 with hooks. State lives in custom hooks (`useBookState`, `useUIState`,
  `useDrafts`, …), with no Redux or Context.
- **Desktop**: Electron 44. The main process is in `public/electron.js`, with `public/preload.js`
  as the bridge to the renderer.
- **Build tooling**: Vite (dev server and production build), electron-builder (installers)
- **Export**: jsPDF with embedded fonts for PDF, JSZip for EPUB, plus an HTML exporter
- **Sync**: [@absolute-scenes/git-sync](https://github.com/orinoco77/absolute-scenes-git-sync),
  using the GitHub REST API
- **Settings**: electron-store
- **Testing**: Jest with React Testing Library
- **Code quality**: ESLint and Prettier, run with the full test suite on every commit by a Husky
  pre-commit hook

### Project Structure

```
absolute-scenes/
├── public/
│   ├── electron.js          # Main process: window, menus, file dialogs, export saving, Scrivener import
│   ├── preload.js           # Renderer bridge
│   └── fonts/               # Bundled book fonts for PDF export
├── src/
│   ├── App.jsx              # Top-level state, sync triggers and layout
│   ├── index.jsx            # React entry point
│   ├── components/          # React UI (.jsx)
│   │   ├── BookStructure.jsx        # Sidebar sections
│   │   ├── SceneList.jsx            # Parts/chapters/scenes tree, drag and drop, recycle bin
│   │   ├── SceneEditor.jsx          # Scene writing view
│   │   ├── TextEditor.jsx           # Shared editor: undo, find & replace, formatting shortcuts
│   │   ├── DistractionFreeMode.jsx
│   │   ├── DraftSwitcher.jsx        # Toolbar draft menu
│   │   ├── NewDraftDialog.jsx
│   │   ├── RevisionChip.jsx         # Per-scene revision menu
│   │   ├── CharacterThreadVisualization.jsx
│   │   ├── TemplateManager.jsx      # Typography and layout settings
│   │   ├── ExportDialog.jsx
│   │   ├── GitHubIntegration.jsx    # GitHub setup, sync, mobile sharing
│   │   ├── BackupRecovery.jsx       # Open a book from GitHub
│   │   ├── StatusBar.jsx
│   │   └── ...                      # Lists and editors for characters, locations, matter, etc.
│   ├── hooks/               # useBookState, useUIState, useDrafts, useDragAndDrop, ...
│   ├── services/            # gitSyncService, SaveService, EventHandlerService, ThemeService
│   ├── utils/               # Exporters, font manager, file I/O, ...
│   ├── styles/              # CSS split by area
│   └── __tests__/           # App-level integration tests (unit tests sit next to their code)
├── assets/                  # Icons, installer.nsh (Windows PATH), Linux post-install scripts, macOS entitlements
├── scripts/update-readme.js # Refreshes version/test/commit info in the README on each commit
├── .github/workflows/       # Build and Release workflow
├── package.json             # Dependencies, scripts and electron-builder config ("build")
└── vite.config.js
```

### Development Setup

**Prerequisites:** Node.js 22 LTS (Vite 8 needs Node 20.19+ or 22.12+), npm, and Git.

```bash
git clone https://github.com/orinoco77/absolute-scenes.git
cd absolute-scenes
npm install

# Terminal 1: Vite dev server on http://localhost:3000
npm start

# Terminal 2: Electron, loading the dev server
npm run electron-dev
```

`npm start` on its own also runs the app in a browser, in **Browser Mode**. That has limited
functionality: there are no file dialogs or Electron menus, and saving downloads the file.

#### Tests & Code Quality

```bash
npm test               # Run all tests
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage report
npm run lint           # ESLint
npm run lint:fix       # ESLint with fixes
npm run format         # Prettier
npm run format:check   # Check formatting
```

The pre-commit hook:

1. Runs `lint:check` and the full test suite. The commit fails if either fails.
2. Bumps the patch version in `package.json`
3. Runs `scripts/update-readme.js`, which fills in the version, test count, date and latest
   commit in the README

#### Building

```bash
npm run build            # Production build of the web assets into build/
npm run dist -- --win    # Windows NSIS installer and .zip (x64)
npm run dist -- --mac    # macOS DMG (Intel and Apple silicon)
npm run dist -- --linux  # .deb, .rpm and AppImage (x64)
```

Installers are written to `dist/`.

### Architecture Notes

- **Book state**: `useBookState` holds the book, with a `bookRef` that is always up to date.
  Sync and other background work read `bookRef` rather than a possibly stale closure.
- **Book editing**: pure functions in the `@absolute-scenes/book-model` package (shared with
  the mobile app), wired into React by `hooks/useBookState.js` and `hooks/useDrafts.js`
- **Saving**: `SaveService` performs saves. `App.jsx` runs the 3-second autosave timer.
- **Sync**: `services/gitSyncService.js` calls git-sync's `syncRepo`. `App.jsx` owns the sync
  triggers and uses `reconcilePostSyncState` to fold in edits made while a sync was in progress.
- **Electron**: menu actions reach the React app as IPC messages (for example `menu-save-book`).
  File dialogs and export saving run in the main process.

### Contributing Code

1. **Fork** the repository and clone your fork
2. **Create a branch**: `git checkout -b feature/my-feature`
3. **Install**: `npm install`
4. **Make changes** with tests: new behaviour and bug fixes should come with a test
5. **Commit**: the pre-commit hook runs lint and tests, and must pass
6. **Push** your branch and open a Pull Request

**PR titles** follow conventional commits, for example `feat: …`, `fix: …`, `docs: …` or
`test: …`.

**Include:** what the change does and why, how to test it, and screenshots for UI changes.

### Release Process

1. Every commit bumps the patch version automatically (pre-commit hook)
2. Merge to `main` through a pull request
3. Tag the release, e.g. `git tag v1.5.0`, and push the tag
4. The **Build and Release** workflow builds Windows, macOS and Linux installers and publishes them
   to a GitHub Release

---

## Troubleshooting

### Installation

#### Windows: "Windows protected your PC"

The installer isn't signed with a trusted certificate. Click **More info** → **Run anyway**.

#### macOS: "damaged" or "can't be opened"

The app isn't signed with an Apple Developer certificate. Right-click → **Open** → **Open**, or run
`xattr -cr "/Applications/Absolute Scenes.app"`.

#### Linux: AppImage "Permission denied"

Make it executable: `chmod +x Absolute-Scenes-*.AppImage`.

### Saving & Loading

#### "Save failed"

- Check you can write to that folder, and that the disk isn't full
- Use **Save As** to save somewhere else, such as your Documents folder

#### A book won't open

- `.book` files are JSON. Open the file in a text editor to check it isn't empty or truncated.
- If the book syncs with GitHub, use **📥 Open from Backup** to get the latest copy from GitHub
- Report the problem, with the file if you can

#### The title and author have an orange bar

The book hasn't been saved to a file yet, so it can't autosave. Save it once with `Ctrl/Cmd + S`.

### Export

#### Export is slow or fails on a large book

- PDF export of a long book can take a while. Progress is shown while it runs.
- Try EPUB or HTML to check the content exports cleanly
- If a particular font causes problems, try Times New Roman to rule it out

### GitHub Sync

#### "Authentication failed" or "Token expired"

The access token has expired or been revoked. Open **🔗 GitHub Integration**, create a new token
(choose **No expiration**), and enter it. GitHub also revokes tokens that go unused for a year.

#### "Repository not found"

- Check the repository still exists on GitHub
- Check that your token's account has access to it
- For a shared book, make sure the owner has added you as a collaborator

#### A scene shows a conflict badge

The same lines were changed on two devices. Open the scene, find the text between `<<<<<<<` and
`>>>>>>>`, keep the version you want, and delete the markers.

#### Changes from another device haven't appeared

Sync runs when you switch scenes, when the window loses focus, every 2 minutes while there are
changes, and when you open the book. Use **💾 Sync Now** in the GitHub dialog to sync straight
away. If the status bar shows **Offline**, sync can't run until you're back online.

### Getting Work Back

- **Deleted a scene, chapter or part?** Check the recycle bin (`Ctrl/Cmd + Shift + R`) before
  closing the book. Recycle bins are cleared when the session ends.
- **Want an earlier version?** If you use GitHub sync, each sync with changes is a commit, so
  earlier versions are in the repository's history on GitHub
- **Trying something risky?** Make a new [draft](#drafts) or [revision](#revisions) first, so the
  original stays untouched

---

## FAQ

### General

**Is Absolute Scenes free?**
Yes. It's free and open source under the MIT License, for personal and commercial use.

**Does it work offline?**
Yes. Everything works offline, and GitHub sync catches up when you reconnect.

**What file format does it use?**
`.book` files, which are JSON text. See [File Format Reference](#file-format-reference).

**Can I work on more than one computer?**
Yes. Connect GitHub sync on each computer, or copy the `.book` file yourself. Books can also be
opened in the Absolute Scenes mobile app.

### Writing

**How do I format text?**
With Markdown: `**bold**`, `*italic*` and `## heading`. The toolbar and `Ctrl/Cmd + B` /
`Ctrl/Cmd + I` add the markers for you. There's no underline.

**Is there spell check?**
Yes. It's built in, with suggestions and a personal dictionary on right-click, and a language
choice under Tools → Spell Check Settings.

**Can I try a scene or the whole book a different way?**
Yes. Use [revisions](#revisions) for one scene, or [drafts](#drafts) for the whole book.

**How do I move a scene to another chapter?**
Click ↗️ on the scene and pick the chapter. Dragging only reorders scenes within their chapter.

**Can I add images?**
Yes. Add full-page [illustrations](#illustrations), or images in front and back matter such as a
map.

### Export & Publishing

**Are the PDFs print-ready?**
**PDF (Print Ready)** uses your template: trim size, mirror margins, running headers and book fonts.
It's designed for print-on-demand services. Always check the proof your printer provides.

**Can I make an ebook?**
Yes. Export **EPUB** directly.

**Can I export to Word?**
Not directly. Export HTML and open it in Word, or use the manuscript PDF for submissions.

**Is there a table of contents?**
EPUB exports include the ebook's navigation table of contents. The PDF exports don't add a table of
contents page.

### GitHub & Sync

**Do I need to know Git?**
No. Absolute Scenes does all the Git work. You just need a GitHub account and an access token.

**Is my book private?**
Yes, if the repository is private. Only people you add as collaborators can see it.

**Does GitHub cost anything?**
A free GitHub account is enough.

**Can I write with a co-author?**
Yes. Share the repository with them, and they choose **Join Existing Repository**. Edits are merged
scene by scene. See [Collaboration](#collaboration).

**What if GitHub is down?**
Your `.book` file is always on your computer. Keep writing, and sync catches up later.

### Other

**Can I import from Scrivener?**
Yes. Use **File → Import from Scrivener** and pick your `.scriv` project.

**Is there a dark mode?**
Yes. Press `Ctrl/Cmd + Shift + T`.

**Can I write in other languages?**
Yes. The app's interface is in English, but you can write in any language, and spell check supports
other languages.

**How do I report a bug or request a feature?**
Open an issue on [GitHub Issues](https://github.com/orinoco77/absolute-scenes/issues).

---

## Resources

### Project Links

- **Repository**: https://github.com/orinoco77/absolute-scenes
- **Releases & downloads**: https://github.com/orinoco77/absolute-scenes/releases
- **Issues**: https://github.com/orinoco77/absolute-scenes/issues
- **Roadmap**: https://github.com/orinoco77/absolute-scenes/projects
- **Sync library**: https://github.com/orinoco77/absolute-scenes-git-sync

### External Resources

**Writing craft:**

- [Helping Writers Become Authors](https://www.helpingwritersbecomeauthors.com/): story structure
- [The Creative Penn](https://www.thecreativepenn.com/): self-publishing
- [Writers & Artists](https://www.writersandartists.co.uk/): the publishing industry

**Self-publishing:**

- [Amazon KDP](https://kdp.amazon.com/)
- [IngramSpark](https://www.ingramspark.com/)
- [Draft2Digital](https://www.draft2digital.com/)
- [Reedsy](https://reedsy.com/)

**Typography & design:**

- [Practical Typography](https://practicaltypography.com/)
- [The Book Designer](https://www.thebookdesigner.com/)

**Tools:**

- [Calibre](https://calibre-ebook.com/): ebook conversion, such as EPUB to MOBI

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

### Credits

**Created by** Adam Short (ajs@shiny.org.uk)

**Built with** React, Electron, Vite, jsPDF, JSZip and many other open-source libraries.

**Thanks to** everyone who has tested the app, reported bugs and suggested features.

### Typography

Fonts offered in the app include designs by:

- **Hermann Zapf**: Palatino
- **Claude Garamond**: Garamond, including EB Garamond by Georg Duffner
- **John Baskerville**: Baskerville, including Libre Baskerville by Impallari Type
- **William Caslon**: Caslon
- **Matthew Carter**: Georgia
- **Sebastian Kosch**: Crimson Text

Check the licence of any font you use in a commercially published book.

---

## Support

- **Questions and bugs**: [GitHub Issues](https://github.com/orinoco77/absolute-scenes/issues).
  For bugs, please include:
  - your operating system and app version
  - steps to reproduce
  - what you expected and what happened
  - screenshots or a sample `.book` file if relevant
- **Email**: ajs@shiny.org.uk (put "Absolute Scenes" in the subject)

For release notes, see the [README's version history](https://github.com/orinoco77/absolute-scenes#version-history)
and [Releases](https://github.com/orinoco77/absolute-scenes/releases).

---

_Made with ❤️ for authors who care about beautiful books_
