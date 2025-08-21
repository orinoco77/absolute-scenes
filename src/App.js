/* eslint-disable no-console */
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback, useRef } from 'react';
import BackgroundEditor from './components/BackgroundEditor';
import BackupRecovery from './components/BackupRecovery';
import BookStructure from './components/BookStructure';
import CharacterEditor from './components/CharacterEditor';
import CharacterThreadVisualization from './components/CharacterThreadVisualization';
import ExportDialog from './components/ExportDialog';
import FrontMatterEditor from './components/FrontMatterEditor';
import GitHubIntegration from './components/GitHubIntegration';
import LocationEditor from './components/LocationEditor';
import SceneEditor from './components/SceneEditor';
import StatusBar from './components/StatusBar';
import TemplateManager from './components/TemplateManager';
import { saveBook, saveBookToFile } from './utils/fileOperations';
import { initializeFontSystem } from './utils/fontManager';
import './styles/App.css';

// Utility function to normalize content for cross-platform consistency
const normalizeContent = content => {
  if (typeof content !== 'string') return content;
  // Normalize line endings to LF and ensure consistent encoding
  return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
};

// Check if we're in Electron environment
const isElectron = () => {
  // Check if window.require exists (only in Electron with nodeIntegration)
  return typeof window !== 'undefined' && typeof window.require === 'function';
};

let ipcRenderer = null;
if (isElectron()) {
  try {
    const electron = window.require('electron');
    ipcRenderer = electron.ipcRenderer;
  } catch (error) {
    console.warn('Failed to load Electron APIs:', error);
  }
}

function App() {
  const [book, setBookInternal] = useState({
    title: '',
    author: '',
    frontMatter: [], // Optional front matter sections
    parts: [], // Optional parts to organize chapters
    chapters: [
      {
        id: 'default',
        title: 'Chapter 1',
        scenes: []
      }
    ],
    characters: [],
    characterDetectionBlacklist: [],
    locations: [],
    backgroundFolders: [
      {
        id: 'default-bg',
        title: 'General Notes',
        documents: []
      }
    ],
    template: {
      fontFamily: 'Times New Roman',
      fontSize: 12,
      lineHeight: 1.6,
      paragraphStyle: 'indented',
      pageSize: 'letter',
      genre: 'general',
      pageMargins: {
        top: 1,
        bottom: 1,
        inside: 1.25, // Inner margin (towards spine)
        outside: 1 // Outer margin (towards edge)
      },
      mirrorMargins: false, // Use different margins for odd/even pages
      textAlign: 'justified', // 'left', 'justified'
      chapterHeader: {
        style: 'numbered',
        format: 'Chapter {number}',
        fontSize: 18,
        fontWeight: 'bold',
        alignment: 'center',
        pageBreak: true,
        spacing: 2,
        lineBreaksBefore: 3,
        startOnRightPage: false
      },
      runningHeaders: {
        enabled: false,
        alignment: 'outside', // 'outside' or 'center'
        fontSize: 10,
        skipChapterPages: true
      }
    },
    github: {
      repository: null,
      lastSyncTime: null
    },
    metadata: {
      created: new Date().toISOString(),
      modified: new Date().toISOString()
    },
    collaboration: {
      enabled: false, // Hidden until multiple authors are detected
      authors: [], // List of author names for assignment
      currentAuthor: null // Currently signed-in author
    }
  });

  const [currentSceneId, setCurrentSceneId] = useState(null);
  const [currentChapterId, setCurrentChapterId] = useState('default');
  const [currentPartId, setCurrentPartId] = useState(null);
  const [currentCharacterId, setCurrentCharacterId] = useState(null);
  const [currentLocationId, setCurrentLocationId] = useState(null);
  const [currentDocumentId, setCurrentDocumentId] = useState(null);
  const [currentFolderId, setCurrentFolderId] = useState('default-bg');
  const [currentFrontMatterId, setCurrentFrontMatterId] = useState(null);
  const [activeTab, setActiveTab] = useState('manuscript');

  // Keep bookRef in sync with book state
  useEffect(() => {
    bookRef.current = book;
  }, [book]);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showGitHubIntegration, setShowGitHubIntegration] = useState(false);

  // Wrapper for setBook
  const setBook = useCallback(newBookData => {
    setBookInternal(newBookData);
  }, []);
  const [showBackupRecovery, setShowBackupRecovery] = useState(false);
  // GitHub repo is now stored in book.github.repository, but we keep this for compatibility
  const gitHubRepo = book.github?.repository || null;
  const [recycleBin, setRecycleBin] = useState([]);
  const [showRecycleBin, setShowRecycleBin] = useState(false);
  const [characterRecycleBin, setCharacterRecycleBin] = useState([]);
  const [locationRecycleBin, setLocationRecycleBin] = useState([]);
  const [backgroundRecycleBin, setBackgroundRecycleBin] = useState([]);
  const [currentFilePath, setCurrentFilePath] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // Flag to prevent marking changes during save
  const [currentOperation, setCurrentOperation] = useState(null);

  // Add ref to track save operations more reliably
  const saveOperationRef = useRef(false);
  const bookRef = useRef(book);

  // Initialize font system for better web fonts
  // Update window title
  useEffect(() => {
    let fileName = 'Untitled';
    if (currentFilePath) {
      // Extract just the filename from the full path
      fileName = currentFilePath
        .split(/[\\/]/)
        .pop()
        .replace(/\.(book|json)$/, '');
    }
    const unsavedIndicator = hasUnsavedChanges ? ' *' : '';
    const newTitle = `${fileName}${unsavedIndicator} - AbsoluteScenes`;
    document.title = newTitle;
  }, [currentFilePath, hasUnsavedChanges]);

  useEffect(() => {
    initializeFontSystem();
  }, []);

  // Auto-select first scene if none selected but scenes exist
  useEffect(() => {
    if (activeTab === 'manuscript' && !currentSceneId && book.chapters) {
      // Find first chapter with scenes
      const firstChapterWithScenes = book.chapters.find(
        ch => ch.scenes && ch.scenes.length > 0
      );
      if (firstChapterWithScenes && firstChapterWithScenes.scenes.length > 0) {
        setCurrentChapterId(firstChapterWithScenes.id);
        setCurrentSceneId(firstChapterWithScenes.scenes[0].id);
      }
    }
  }, [activeTab, currentSceneId, book.chapters]);

  // Auto-select first character if none selected but characters exist
  useEffect(() => {
    if (
      activeTab === 'characters' &&
      !currentCharacterId &&
      book.characters &&
      book.characters.length > 0
    ) {
      setCurrentCharacterId(book.characters[0].id);
    }
  }, [activeTab, currentCharacterId, book.characters]);

  // Auto-select first location if none selected but locations exist
  useEffect(() => {
    if (
      activeTab === 'locations' &&
      !currentLocationId &&
      book.locations &&
      book.locations.length > 0
    ) {
      setCurrentLocationId(book.locations[0].id);
    }
  }, [activeTab, currentLocationId, book.locations]);

  // Auto-select first document if none selected but documents exist
  useEffect(() => {
    if (
      activeTab === 'background' &&
      !currentDocumentId &&
      book.backgroundFolders &&
      book.backgroundFolders.length > 0
    ) {
      const firstFolderWithDocs = book.backgroundFolders.find(
        folder => folder.documents && folder.documents.length > 0
      );
      if (firstFolderWithDocs) {
        setCurrentFolderId(firstFolderWithDocs.id);
        setCurrentDocumentId(firstFolderWithDocs.documents[0].id);
      }
    }
  }, [activeTab, currentDocumentId, book.backgroundFolders]);

  // Auto-select first front matter item when switching to front matter tab
  useEffect(() => {
    if (
      activeTab === 'frontmatter' &&
      !currentFrontMatterId &&
      book.frontMatter &&
      book.frontMatter.length > 0
    ) {
      setCurrentFrontMatterId(book.frontMatter[0].id);
    }
  }, [activeTab, currentFrontMatterId, book.frontMatter]);

  const markAsChanged = () => {
    if (isSaving) {
      return; // Ignore changes during save operation
    }
    setHasUnsavedChanges(true);
  };

  const updateGitHubSettings = settings => {
    setBook(prev => ({
      ...prev,
      github: { ...prev.github, ...settings },
      metadata: { ...prev.metadata, modified: new Date().toISOString() }
    }));
    markAsChanged();
  };

  const updateGitHubSyncStatus = settings => {
    // Update GitHub settings without marking as changed (for sync metadata only)
    setBook(prev => ({
      ...prev,
      github: { ...prev.github, ...settings }
    }));
  };

  const handleSaveBook = useCallback(async () => {
    // Use ref for immediate check (doesn't wait for state update)
    if (saveOperationRef.current || isSaving) {
      return;
    }

    // Set both ref and state
    saveOperationRef.current = true;
    setIsSaving(true);
    setCurrentOperation('Saving book...');

    try {
      let saveResult;
      let savedFilePath = currentFilePath;

      // Ensure we have clean book data before saving - use ref to avoid closure issues
      const currentBook = bookRef.current;

      const bookDataToSave = {
        ...currentBook,
        metadata: {
          ...currentBook.metadata,
          modified: new Date().toISOString()
        }
      };

      if (currentFilePath) {
        // Quick save to existing file
        setCurrentOperation('Saving to file...');
        saveResult = await saveBookToFile(bookDataToSave, currentFilePath);
      } else {
        // Save As dialog for new files
        setCurrentOperation('Choose save location...');
        saveResult = await saveBook(bookDataToSave);
        savedFilePath = saveResult.filePath;
      }

      // Only update state after file operations are completely finished
      if (saveResult.success) {
        const now = new Date().toISOString();

        // Update state
        setCurrentFilePath(savedFilePath);
        setHasUnsavedChanges(false);

        // Handle GitHub sync separately and non-blocking
        if (bookDataToSave.github?.repository) {
          setCurrentOperation('Syncing to GitHub...');
          // Don't await this - let it run in background
          handleGitHubSync(savedFilePath, now, bookDataToSave);
        } else {
        }
      } else if (saveResult.canceled) {
        // User canceled - this is normal, don't show error
      } else {
        // Actual error occurred
        console.error('Save failed:', saveResult.error);
        alert('Save failed: ' + (saveResult.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('=== SAVE OPERATION FAILED ===', error);
      alert('Save failed: ' + error.message);
    } finally {
      // Always clean up both ref and state
      saveOperationRef.current = false;
      setIsSaving(false);
      setCurrentOperation(null);
    }
  }, [book, currentFilePath, isSaving]);

  // Add debounced save function
  const debouncedSave = useCallback(
    (() => {
      let timeout;
      return () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          if (!saveOperationRef.current && !isSaving) {
            handleSaveBook();
          }
        }, 100); // 100ms debounce
      };
    })(),
    [handleSaveBook, isSaving]
  );

  // Separate GitHub sync function to avoid blocking UI
  const handleGitHubSync = useCallback(
    async (filePath, saveTime, bookData = null) => {
      const dataToSync = bookData || book; // Use passed data or fallback to current state

      try {
        const { BrowserEnhancedGitHubService } = await import(
          './utils/browserEnhancedGitHubService'
        );
        const enhancedService = new BrowserEnhancedGitHubService();

        const isAuth = enhancedService.gitHubService.isAuthenticated();

        if (isAuth) {
          const commitMessage = `Auto-save: ${new Date().toLocaleString()}`;

          const result = await enhancedService.safeSyncWithRepository(
            dataToSync.github.repository,
            dataToSync,
            commitMessage,
            filePath
          );

          if (result.conflicts && result.conflicts.length > 0) {
            // For auto-sync, don't show conflict UI - just warn user
            alert(
              'Auto-sync detected conflicts with remote changes. Please use the manual sync button in GitHub settings to resolve conflicts safely.'
            );
          } else if (result.success) {
            // Sync successful
            updateGitHubSyncStatus({ lastSyncTime: saveTime });
          } else if (result.error) {
            console.warn('Auto-sync failed:', result.error);
            alert(`Auto-sync failed: ${result.error}`);
          }
        } else {
          alert(
            'GitHub auto-sync failed: Not authenticated. Please check your GitHub connection in settings.'
          );
        }
      } catch (error) {
        console.warn('GitHub sync failed:', error.message);
        // Show user-friendly error for auto-sync failures
        alert(
          `GitHub auto-sync failed: ${error.message}. You can manually sync from the GitHub settings.`
        );
      } finally {
        // Clear operation when sync is complete (success or failure)
        setCurrentOperation(null);
      }
    },
    [updateGitHubSyncStatus]
  ); // Removed 'book' from dependencies since we pass it as parameter

  // Add keyboard shortcuts with debouncing
  useEffect(() => {
    const handleKeyDown = e => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 's') {
          e.preventDefault();
          e.stopPropagation();

          if (!saveOperationRef.current && !isSaving) {
            debouncedSave();
          } else {
          }
        }
      }
    };

    // Use capture phase to ensure we get the event first
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () =>
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [debouncedSave, isSaving, hasUnsavedChanges]);

  // IPC event handlers (stable, don't change frequently)
  useEffect(() => {
    if (!ipcRenderer) {
      return;
    }

    // Create stable handlers
    const handleMenuNewBook = () => {
      handleNewBook();
    };

    const handleMenuSaveBook = () => {
      if (!saveOperationRef.current && !isSaving) {
        handleSaveBook();
      } else {
      }
    };

    const handleMenuSaveAs = async () => {
      if (saveOperationRef.current || isSaving) {
        return;
      }

      // Set both ref and state
      saveOperationRef.current = true;
      setIsSaving(true);
      setCurrentOperation('Save As...');

      try {
        // Ensure we have clean book data before saving
        const bookDataToSave = {
          ...book,
          metadata: {
            ...book.metadata,
            modified: new Date().toISOString()
          }
        };

        // Always show save dialog for Save As
        setCurrentOperation('Choose save location...');
        const saveResult = await saveBook(bookDataToSave);

        // Only update state after file operations are completely finished
        if (saveResult.success) {
          const now = new Date().toISOString();

          // Update state
          setCurrentFilePath(saveResult.filePath);
          setHasUnsavedChanges(false);

          // Handle GitHub sync separately and non-blocking
          if (bookDataToSave.github?.repository) {
            setCurrentOperation('Syncing to GitHub...');
            handleGitHubSync(saveResult.filePath, now, bookDataToSave);
          }
        } else if (saveResult.canceled) {
          // User canceled - this is normal, don't show error
        } else {
          // Actual error occurred
          console.error('Save As failed:', saveResult.error);
          alert('Save As failed: ' + (saveResult.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('=== SAVE AS OPERATION FAILED ===', error);
        alert('Save As failed: ' + error.message);
      } finally {
        // Always clean up both ref and state
        saveOperationRef.current = false;
        setIsSaving(false);
        setCurrentOperation(null);
      }
    };

    const handleMenuExportBook = () => {
      setShowExportDialog(true);
    };

    const handleMenuNewScene = () => {
      handleNewScene();
    };

    const handleMenuDeleteScene = () => {
      handleDeleteScene();
    };

    const handleMenuNewChapter = () => {
      handleNewChapter();
    };

    const handleMenuDeleteChapter = () => {
      if (currentChapterId) {
        handleDeleteChapter(currentChapterId);
      } else {
        alert('Please select a chapter to delete');
      }
    };

    const handleMenuNewPart = () => {
      handleNewPart();
    };

    const handleMenuDeletePart = () => {
      if (currentPartId) {
        handleDeletePart(currentPartId);
      } else {
        alert('Please select a part to delete');
      }
    };

    const handleMenuDelete = () => {
      // Context-sensitive delete: delete current scene, chapter, or part
      if (currentSceneId) {
        handleDeleteScene();
      } else if (currentChapterId && book.chapters.length > 1) {
        handleDeleteChapter(currentChapterId);
      } else if (currentPartId && book.parts.length > 0) {
        handleDeletePart(currentPartId);
      }
    };

    const handleMenuToggleRecycleBin = () => {
      setShowRecycleBin(!showRecycleBin);
    };

    const handleMenuTemplateSettings = () => {
      setShowTemplateManager(true);
    };

    const handleMenuGitHubIntegration = () => {
      setShowGitHubIntegration(true);
    };

    const handleMenuBackupRecovery = () => {
      setShowBackupRecovery(true);
    };

    const handleMenuEmptyRecycleBin = () => {
      emptyRecycleBin();
    };

    const handleImportScrivenerResult = async (event, result) => {
      try {
        setCurrentOperation('');

        if (!result.success) {
          alert(`Failed to import Scrivener project: ${result.error}`);
          return;
        }

        if (
          hasUnsavedChanges &&
          !window.confirm(
            'You have unsaved changes. Importing will replace your current book. Continue?'
          )
        ) {
          return;
        }

        const importedBook = result.bookData;

        // Clean imported book data and set state

        // Clean the imported book data - remove Scrivener-specific fields
        const cleanedBook = {
          title: importedBook.title,
          author: importedBook.author,
          frontMatter: importedBook.frontMatter || [],
          parts: importedBook.parts || [],
          chapters: importedBook.chapters || [],
          characters: importedBook.characters || [],
          characterDetectionBlacklist:
            importedBook.characterDetectionBlacklist || [],
          locations: importedBook.locations || [],
          backgroundFolders: importedBook.backgroundFolders || [],
          template: importedBook.template,
          github: importedBook.github || {
            repository: null,
            lastSyncTime: null
          },
          metadata: importedBook.metadata,
          collaboration: importedBook.collaboration || {
            enabled: false,
            authors: [],
            currentAuthor: null
          }
        };

        // Set the imported book data
        setBook(cleanedBook);

        setCurrentFilePath(null); // No current file path since this is imported
        setHasUnsavedChanges(true); // Mark as changed so user can save

        // Switch to scenes tab to show imported content
        setActiveTab('scenes');

        // Calculate total scene count across all chapters
        const totalScenes = importedBook.chapters.reduce(
          (total, chapter) => total + (chapter.scenes?.length || 0),
          0
        );

        // Show success message
        alert(
          `Successfully imported "${importedBook.title}" from Scrivener!\n\n- ${importedBook.chapters.length} chapters\n- ${totalScenes} scenes\n- ${importedBook.characters.length} characters\n- ${importedBook.locations.length} locations`
        );
      } catch (error) {
        console.error('Error processing Scrivener import result:', error);
        alert(`Failed to process import result: ${error.message}`);
        setCurrentOperation('');
      }
    };

    const handleBookLoaded = (event, bookData) => {
      // Extract and remove filePath from book data (it's metadata, not content)
      const filePath = bookData.filePath || null;
      const cleanBookData = { ...bookData };
      delete cleanBookData.filePath;

      // Migrate old format to new chapter format if needed
      if (cleanBookData.scenes && !cleanBookData.chapters) {
        cleanBookData.chapters = [
          {
            id: 'default',
            title: 'Chapter 1',
            scenes: cleanBookData.scenes
          }
        ];
        delete cleanBookData.scenes;
      }

      // Migrate old format - add front matter array if missing
      if (!cleanBookData.frontMatter) {
        cleanBookData.frontMatter = [];
      }

      // Migrate old format - add parts array if missing
      if (!cleanBookData.parts) {
        cleanBookData.parts = [];
      }

      // Migrate old format - add GitHub settings if missing
      if (!cleanBookData.github) {
        cleanBookData.github = {
          repository: null,
          lastSyncTime: null
        };
      }

      // Migrate old format - add characters array if missing
      if (!cleanBookData.characters) {
        cleanBookData.characters = [];
      }

      // Migrate old format - add character detection blacklist if missing
      if (!cleanBookData.characterDetectionBlacklist) {
        cleanBookData.characterDetectionBlacklist = [];
      }

      // Migrate old format - add locations array if missing
      if (!cleanBookData.locations) {
        cleanBookData.locations = [];
      }

      // Migrate old format - add background folders if missing
      if (!cleanBookData.backgroundFolders) {
        cleanBookData.backgroundFolders = [
          {
            id: 'default-bg',
            title: 'General Notes',
            documents: []
          }
        ];
      }

      // Set all states simply and directly
      setBook(cleanBookData);
      setCurrentChapterId(cleanBookData.chapters[0]?.id || 'default');
      setCurrentSceneId(cleanBookData.chapters[0]?.scenes[0]?.id || null);
      setCurrentPartId(
        cleanBookData.parts.length > 0 ? cleanBookData.parts[0]?.id : null
      );
      setCurrentCharacterId(null);
      setCurrentLocationId(null);
      setCurrentDocumentId(null);
      setCurrentFolderId(
        cleanBookData.backgroundFolders[0]?.id || 'default-bg'
      );
      setCurrentFrontMatterId(null);
      setCurrentFilePath(filePath);
      setHasUnsavedChanges(false);
    };

    // Register all IPC event listeners
    ipcRenderer.on('menu-new-book', handleMenuNewBook);
    ipcRenderer.on('menu-save-book', handleMenuSaveBook);
    ipcRenderer.on('menu-save-as', handleMenuSaveAs);
    ipcRenderer.on('menu-export-book', handleMenuExportBook);
    ipcRenderer.on('menu-new-scene', handleMenuNewScene);
    ipcRenderer.on('menu-delete-scene', handleMenuDeleteScene);
    ipcRenderer.on('menu-new-chapter', handleMenuNewChapter);
    ipcRenderer.on('menu-delete-chapter', handleMenuDeleteChapter);
    ipcRenderer.on('menu-new-part', handleMenuNewPart);
    ipcRenderer.on('menu-delete-part', handleMenuDeletePart);
    ipcRenderer.on('menu-delete', handleMenuDelete);
    ipcRenderer.on('menu-toggle-recycle-bin', handleMenuToggleRecycleBin);
    ipcRenderer.on('menu-template-settings', handleMenuTemplateSettings);
    ipcRenderer.on('menu-github-integration', handleMenuGitHubIntegration);
    ipcRenderer.on('menu-backup-recovery', handleMenuBackupRecovery);
    ipcRenderer.on('menu-empty-recycle-bin', handleMenuEmptyRecycleBin);
    ipcRenderer.on('book-loaded', handleBookLoaded);
    ipcRenderer.on('import-scrivener-result', handleImportScrivenerResult);

    // Set IPC ready flag for file association handling
    window.ipcReady = true;

    return () => {
      ipcRenderer.removeAllListeners('menu-new-book');
      ipcRenderer.removeAllListeners('menu-save-book');
      ipcRenderer.removeAllListeners('menu-save-as');
      ipcRenderer.removeAllListeners('menu-export-book');
      ipcRenderer.removeAllListeners('menu-new-scene');
      ipcRenderer.removeAllListeners('menu-delete-scene');
      ipcRenderer.removeAllListeners('menu-new-chapter');
      ipcRenderer.removeAllListeners('menu-delete-chapter');
      ipcRenderer.removeAllListeners('menu-new-part');
      ipcRenderer.removeAllListeners('menu-delete-part');
      ipcRenderer.removeAllListeners('menu-delete');
      ipcRenderer.removeAllListeners('menu-toggle-recycle-bin');
      ipcRenderer.removeAllListeners('menu-template-settings');
      ipcRenderer.removeAllListeners('menu-github-integration');
      ipcRenderer.removeAllListeners('menu-backup-recovery');
      ipcRenderer.removeAllListeners('menu-empty-recycle-bin');
      ipcRenderer.removeAllListeners('book-loaded');
      ipcRenderer.removeAllListeners('import-scrivener-result');

      // Clear IPC ready flag
      window.ipcReady = false;
    };
  }, []); // Empty dependency array - only set up once

  const handleNewBook = () => {
    if (
      hasUnsavedChanges &&
      !window.confirm(
        'You have unsaved changes. Are you sure you want to create a new book?'
      )
    ) {
      return;
    }

    const newBookData = {
      title: '',
      author: '',
      frontMatter: [], // Optional front matter sections
      parts: [], // Optional parts to organize chapters
      chapters: [
        {
          id: 'default',
          title: 'Chapter 1',
          scenes: []
        }
      ],
      characters: [],
      characterDetectionBlacklist: [],
      locations: [],
      backgroundFolders: [
        {
          id: 'default-bg',
          title: 'General Notes',
          documents: []
        }
      ],
      template: {
        fontFamily: 'Times New Roman',
        fontSize: 12,
        lineHeight: 1.6,
        paragraphStyle: 'indented',
        pageSize: 'letter',
        genre: 'general',
        pageMargins: {
          top: 1,
          bottom: 1,
          inside: 1.25, // Inner margin (towards spine)
          outside: 1 // Outer margin (towards edge)
        },
        mirrorMargins: false, // Use different margins for odd/even pages
        textAlign: 'justified', // 'left', 'justified'
        chapterHeader: {
          style: 'numbered',
          format: 'Chapter {number}',
          fontSize: 18,
          fontWeight: 'bold',
          alignment: 'center',
          pageBreak: true,
          spacing: 2,
          lineBreaksBefore: 3,
          startOnRightPage: false
        },
        runningHeaders: {
          enabled: false,
          alignment: 'outside', // 'outside' or 'center'
          fontSize: 10,
          skipChapterPages: true
        }
      },
      github: {
        repository: null,
        lastSyncTime: null
      },
      metadata: {
        created: new Date().toISOString(),
        modified: new Date().toISOString()
      }
    };

    // Set all states in batch
    // Set all states simply and directly
    setBook(newBookData);
    setCurrentSceneId(null);
    setCurrentChapterId('default');
    setCurrentPartId(null);
    setCurrentCharacterId(null);
    setCurrentLocationId(null);
    setCurrentDocumentId(null);
    setCurrentFolderId('default-bg');
    setCurrentFrontMatterId(null);
    setCurrentFilePath(null);
    setHasUnsavedChanges(false);
  };

  const handleNewScene = () => {
    const currentChapter = book.chapters.find(ch => ch.id === currentChapterId);

    if (!currentChapter) {
      alert('Please select a chapter first');
      return;
    }

    const newScene = {
      id: Date.now().toString(),
      title: `Scene ${currentChapter.scenes.length + 1}`,
      content: '',
      notes: '',
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      assignedAuthor: null // Optional collaboration field - null for solo work
    };

    setBook(prev => ({
      ...prev,
      chapters: prev.chapters.map(chapter =>
        chapter.id === currentChapterId
          ? { ...chapter, scenes: [...chapter.scenes, newScene] }
          : chapter
      ),
      metadata: { ...prev.metadata, modified: new Date().toISOString() }
    }));
    setCurrentSceneId(newScene.id);
    markAsChanged();
  };

  const handleNewChapter = () => {
    const newChapter = {
      id: Date.now().toString(),
      title: `Chapter ${book.chapters.length + 1}`,
      scenes: [],
      assignedAuthor: null // Optional collaboration field - null for solo work
    };

    setBook(prev => ({
      ...prev,
      chapters: [...prev.chapters, newChapter],
      metadata: { ...prev.metadata, modified: new Date().toISOString() }
    }));
    setCurrentChapterId(newChapter.id);
    markAsChanged();
  };

  // Part management functions
  const handleNewPart = () => {
    const newPart = {
      id: Date.now().toString(),
      title: `Part ${book.parts.length + 1}`,
      chapterIds: [] // Array of chapter IDs in this part
    };

    setBook(prev => ({
      ...prev,
      parts: [...prev.parts, newPart],
      metadata: { ...prev.metadata, modified: new Date().toISOString() }
    }));
    setCurrentPartId(newPart.id);
    markAsChanged();
  };

  const updatePart = (partId, updates) => {
    setBook(prev => ({
      ...prev,
      parts: prev.parts.map(part =>
        part.id === partId ? { ...part, ...updates } : part
      ),
      metadata: { ...prev.metadata, modified: new Date().toISOString() }
    }));
    markAsChanged();
  };

  const handleDeletePart = partId => {
    const part = book.parts.find(p => p.id === partId);
    if (part && part.chapterIds.length > 0) {
      if (
        !window.confirm(
          `Delete "${part.title}"? Chapters will not be deleted, just removed from this part.`
        )
      ) {
        return;
      }
    }

    setBook(prev => ({
      ...prev,
      parts: prev.parts.filter(p => p.id !== partId),
      metadata: { ...prev.metadata, modified: new Date().toISOString() }
    }));
    markAsChanged();

    if (currentPartId === partId) {
      setCurrentPartId(book.parts.length > 1 ? book.parts[0].id : null);
    }
  };

  const moveChapterToPart = (chapterId, fromPartId, toPartId) => {
    setBook(prev => ({
      ...prev,
      parts: prev.parts.map(part => {
        if (part.id === fromPartId) {
          // Remove chapter from source part
          return {
            ...part,
            chapterIds: part.chapterIds.filter(id => id !== chapterId)
          };
        } else if (part.id === toPartId) {
          // Add chapter to target part
          return {
            ...part,
            chapterIds: [...part.chapterIds, chapterId]
          };
        }
        return part;
      }),
      metadata: { ...prev.metadata, modified: new Date().toISOString() }
    }));
    markAsChanged();
  };

  const addChapterToPart = (chapterId, partId) => {
    setBook(prev => ({
      ...prev,
      parts: prev.parts.map(part =>
        part.id === partId
          ? { ...part, chapterIds: [...part.chapterIds, chapterId] }
          : part
      ),
      metadata: { ...prev.metadata, modified: new Date().toISOString() }
    }));
    markAsChanged();
  };

  const removeChapterFromPart = (chapterId, partId) => {
    setBook(prev => ({
      ...prev,
      parts: prev.parts.map(part =>
        part.id === partId
          ? {
              ...part,
              chapterIds: part.chapterIds.filter(id => id !== chapterId)
            }
          : part
      ),
      metadata: { ...prev.metadata, modified: new Date().toISOString() }
    }));
    markAsChanged();
  };

  const reorderParts = (fromIndex, toIndex) => {
    const newParts = [...book.parts];
    const [movedPart] = newParts.splice(fromIndex, 1);
    newParts.splice(toIndex, 0, movedPart);

    setBook(prev => ({
      ...prev,
      parts: newParts,
      metadata: { ...prev.metadata, modified: new Date().toISOString() }
    }));
    markAsChanged();
  };

  // Front Matter Handler Functions
  const handleAddFrontMatter = frontMatterItem => {
    setBook(prev => ({
      ...prev,
      frontMatter: [...prev.frontMatter, frontMatterItem],
      metadata: { ...prev.metadata, modified: new Date().toISOString() }
    }));
    setCurrentFrontMatterId(frontMatterItem.id);
    markAsChanged();
  };

  const handleDeleteFrontMatter = frontMatterId => {
    setBook(prev => ({
      ...prev,
      frontMatter: prev.frontMatter.filter(fm => fm.id !== frontMatterId),
      metadata: { ...prev.metadata, modified: new Date().toISOString() }
    }));

    // Clear selection if deleted item was selected
    if (currentFrontMatterId === frontMatterId) {
      setCurrentFrontMatterId(null);
    }
    markAsChanged();
  };

  const updateFrontMatter = (frontMatterId, updatedFrontMatter) => {
    setBook(prev => ({
      ...prev,
      frontMatter: prev.frontMatter.map(fm =>
        fm.id === frontMatterId ? updatedFrontMatter : fm
      ),
      metadata: { ...prev.metadata, modified: new Date().toISOString() }
    }));
    markAsChanged();
  };

  const handleToggleFrontMatter = (frontMatterId, enabled) => {
    setBook(prev => ({
      ...prev,
      frontMatter: prev.frontMatter.map(fm =>
        fm.id === frontMatterId
          ? { ...fm, enabled, modified: new Date().toISOString() }
          : fm
      ),
      metadata: { ...prev.metadata, modified: new Date().toISOString() }
    }));
    markAsChanged();
  };

  const handleReorderFrontMatter = (fromIndex, toIndex) => {
    setBook(prev => {
      const newFrontMatter = [...prev.frontMatter];
      const [movedItem] = newFrontMatter.splice(fromIndex, 1);
      newFrontMatter.splice(toIndex, 0, movedItem);

      return {
        ...prev,
        frontMatter: newFrontMatter,
        metadata: { ...prev.metadata, modified: new Date().toISOString() }
      };
    });
    markAsChanged();
  };

  // Auto-select first front matter item when switching to front matter tab
  useEffect(() => {
    if (
      activeTab === 'frontmatter' &&
      !currentFrontMatterId &&
      book.frontMatter &&
      book.frontMatter.length > 0
    ) {
      setCurrentFrontMatterId(book.frontMatter[0].id);
    }
  }, [activeTab, currentFrontMatterId, book.frontMatter]);

  const reorderChaptersInPart = (partId, fromIndex, toIndex) => {
    setBook(prev => ({
      ...prev,
      parts: prev.parts.map(part => {
        if (part.id === partId) {
          const newChapterIds = [...part.chapterIds];
          const [movedChapterId] = newChapterIds.splice(fromIndex, 1);
          newChapterIds.splice(toIndex, 0, movedChapterId);
          return { ...part, chapterIds: newChapterIds };
        }
        return part;
      }),
      metadata: { ...prev.metadata, modified: new Date().toISOString() }
    }));
    markAsChanged();
  };

  const handleDeleteScene = () => {
    if (currentSceneId && window.confirm('Delete current scene?')) {
      moveSceneToRecycleBin(currentSceneId);
      setCurrentSceneId(null);
    }
  };

  const moveSceneToRecycleBin = sceneId => {
    const scene = getCurrentScene();
    if (!scene) return;

    // Find which chapter the scene belongs to
    const chapter = book.chapters.find(ch =>
      ch.scenes.some(s => s.id === sceneId)
    );
    if (!chapter) return;

    // Add to recycle bin with metadata
    const recycleBinItem = {
      id: Date.now().toString(),
      type: 'scene',
      item: scene,
      originalChapterId: chapter.id,
      originalChapterTitle: chapter.title,
      deletedAt: new Date().toISOString()
    };

    setRecycleBin(prev => [...prev, recycleBinItem]);

    // Remove from chapters
    setBook(prev => ({
      ...prev,
      chapters: prev.chapters.map(chapter => ({
        ...chapter,
        scenes: chapter.scenes.filter(scene => scene.id !== sceneId)
      })),
      metadata: { ...prev.metadata, modified: new Date().toISOString() }
    }));
    markAsChanged();
  };

  const restoreFromRecycleBin = recycleBinItemId => {
    const recycleBinItem = recycleBin.find(
      item => item.id === recycleBinItemId
    );
    if (!recycleBinItem) return;

    if (recycleBinItem.type === 'scene') {
      // Find the original chapter or use the first chapter if not found
      const targetChapter =
        book.chapters.find(ch => ch.id === recycleBinItem.originalChapterId) ||
        book.chapters[0];

      if (targetChapter) {
        setBook(prev => ({
          ...prev,
          chapters: prev.chapters.map(chapter =>
            chapter.id === targetChapter.id
              ? { ...chapter, scenes: [...chapter.scenes, recycleBinItem.item] }
              : chapter
          ),
          metadata: { ...prev.metadata, modified: new Date().toISOString() }
        }));
        markAsChanged();
      }
    }

    // Remove from recycle bin
    setRecycleBin(prev => prev.filter(item => item.id !== recycleBinItemId));
  };

  const permanentlyDeleteFromRecycleBin = recycleBinItemId => {
    if (
      window.confirm('Permanently delete this item? This cannot be undone.')
    ) {
      setRecycleBin(prev => prev.filter(item => item.id !== recycleBinItemId));
    }
  };

  const emptyRecycleBin = () => {
    if (
      window.confirm(
        'Permanently delete all items in the recycle bin? This cannot be undone.'
      )
    ) {
      setRecycleBin([]);
    }
  };

  const reorderChapters = (fromIndex, toIndex) => {
    const newChapters = [...book.chapters];
    const [movedChapter] = newChapters.splice(fromIndex, 1);
    newChapters.splice(toIndex, 0, movedChapter);

    setBook(prev => ({
      ...prev,
      chapters: newChapters,
      metadata: { ...prev.metadata, modified: new Date().toISOString() }
    }));
    markAsChanged();
  };

  const reorderScenesInChapter = (chapterId, fromIndex, toIndex) => {
    setBook(prev => ({
      ...prev,
      chapters: prev.chapters.map(chapter => {
        if (chapter.id === chapterId) {
          const newScenes = [...chapter.scenes];
          const [movedScene] = newScenes.splice(fromIndex, 1);
          newScenes.splice(toIndex, 0, movedScene);
          return { ...chapter, scenes: newScenes };
        }
        return chapter;
      }),
      metadata: { ...prev.metadata, modified: new Date().toISOString() }
    }));
    markAsChanged();
  };

  const moveSceneBetweenChapters = (
    sceneId,
    fromChapterId,
    toChapterId,
    toIndex = -1
  ) => {
    if (fromChapterId === toChapterId) return;

    const scene = book.chapters
      .find(ch => ch.id === fromChapterId)
      ?.scenes.find(s => s.id === sceneId);

    if (!scene) return;

    setBook(prev => ({
      ...prev,
      chapters: prev.chapters.map(chapter => {
        if (chapter.id === fromChapterId) {
          // Remove from source chapter
          return {
            ...chapter,
            scenes: chapter.scenes.filter(s => s.id !== sceneId)
          };
        } else if (chapter.id === toChapterId) {
          // Add to target chapter
          const newScenes = [...chapter.scenes];
          const insertIndex = toIndex === -1 ? newScenes.length : toIndex;
          newScenes.splice(insertIndex, 0, scene);
          return { ...chapter, scenes: newScenes };
        }
        return chapter;
      }),
      metadata: { ...prev.metadata, modified: new Date().toISOString() }
    }));
    markAsChanged();
  };

  const handleDeleteChapter = chapterId => {
    if (book.chapters.length <= 1) {
      alert('Cannot delete the last chapter');
      return;
    }

    const chapter = book.chapters.find(ch => ch.id === chapterId);
    if (chapter.scenes.length > 0) {
      if (!window.confirm(`Delete "${chapter.title}" and all its scenes?`)) {
        return;
      }
    }

    setBook(prev => ({
      ...prev,
      chapters: prev.chapters.filter(ch => ch.id !== chapterId),
      metadata: { ...prev.metadata, modified: new Date().toISOString() }
    }));
    markAsChanged();

    if (currentChapterId === chapterId) {
      setCurrentChapterId(book.chapters[0].id);
      setCurrentSceneId(null);
    }
  };

  const updateScene = (sceneId, updates) => {
    // Normalize content if it's being updated
    const normalizedUpdates = { ...updates };
    if (normalizedUpdates.content) {
      normalizedUpdates.content = normalizeContent(normalizedUpdates.content);
    }
    if (normalizedUpdates.notes) {
      normalizedUpdates.notes = normalizeContent(normalizedUpdates.notes);
    }

    setBook(prev => ({
      ...prev,
      chapters: prev.chapters.map(chapter => ({
        ...chapter,
        scenes: chapter.scenes.map(scene =>
          scene.id === sceneId
            ? {
                ...scene,
                ...normalizedUpdates,
                modified: new Date().toISOString()
              }
            : scene
        )
      })),
      metadata: { ...prev.metadata, modified: new Date().toISOString() }
    }));
    markAsChanged();
  };

  const updateChapter = (chapterId, updates) => {
    setBook(prev => ({
      ...prev,
      chapters: prev.chapters.map(chapter =>
        chapter.id === chapterId ? { ...chapter, ...updates } : chapter
      ),
      metadata: { ...prev.metadata, modified: new Date().toISOString() }
    }));
    markAsChanged();
  };

  const updateBookMetadata = metadata => {
    setBook(prev => ({
      ...prev,
      ...metadata,
      metadata: { ...prev.metadata, modified: new Date().toISOString() }
    }));
    markAsChanged();
  };

  const updateTemplate = template => {
    setBook(prev => ({
      ...prev,
      template: { ...prev.template, ...template },
      metadata: { ...prev.metadata, modified: new Date().toISOString() }
    }));
    markAsChanged();
  };

  // Character management functions
  const handleNewCharacter = () => {
    const newCharacter = {
      id: Date.now().toString(),
      name: `Character ${book.characters.length + 1}`,
      description: '',
      role: '',
      avatar: '👤',
      notes: '',
      created: new Date().toISOString(),
      modified: new Date().toISOString()
    };

    setBook(prev => ({
      ...prev,
      characters: [...prev.characters, newCharacter],
      metadata: { ...prev.metadata, modified: new Date().toISOString() }
    }));
    setCurrentCharacterId(newCharacter.id);
    markAsChanged();
  };

  const updateCharacter = (characterId, updates) => {
    setBook(prev => ({
      ...prev,
      characters: prev.characters.map(character =>
        character.id === characterId
          ? { ...character, ...updates, modified: new Date().toISOString() }
          : character
      ),
      metadata: { ...prev.metadata, modified: new Date().toISOString() }
    }));
    markAsChanged();
  };

  const moveCharacterToRecycleBin = characterId => {
    const character = book.characters.find(c => c.id === characterId);
    if (!character) return;

    // Add to recycle bin with metadata
    const recycleBinItem = {
      id: Date.now().toString(),
      type: 'character',
      item: character,
      deletedAt: new Date().toISOString()
    };

    setCharacterRecycleBin(prev => [...prev, recycleBinItem]);

    // Remove from characters
    setBook(prev => ({
      ...prev,
      characters: prev.characters.filter(
        character => character.id !== characterId
      ),
      metadata: { ...prev.metadata, modified: new Date().toISOString() }
    }));

    // Clear selection if this character was selected
    if (currentCharacterId === characterId) {
      setCurrentCharacterId(null);
    }

    markAsChanged();
  };

  const restoreCharacterFromRecycleBin = recycleBinItemId => {
    const recycleBinItem = characterRecycleBin.find(
      item => item.id === recycleBinItemId
    );
    if (!recycleBinItem) return;

    // Add back to characters
    setBook(prev => ({
      ...prev,
      characters: [...prev.characters, recycleBinItem.item],
      metadata: { ...prev.metadata, modified: new Date().toISOString() }
    }));

    // Remove from recycle bin
    setCharacterRecycleBin(prev =>
      prev.filter(item => item.id !== recycleBinItemId)
    );
    markAsChanged();
  };

  const permanentlyDeleteCharacter = recycleBinItemId => {
    if (
      window.confirm(
        'Permanently delete this character? This cannot be undone.'
      )
    ) {
      setCharacterRecycleBin(prev =>
        prev.filter(item => item.id !== recycleBinItemId)
      );
    }
  };

  const updateCharacterDetectionBlacklist = blacklist => {
    setBook(prev => ({
      ...prev,
      characterDetectionBlacklist: blacklist,
      metadata: { ...prev.metadata, modified: new Date().toISOString() }
    }));
    markAsChanged();
  };
  // Location management functions
  const handleNewLocation = () => {
    const newLocation = {
      id: Date.now().toString(),
      name: `Location ${book.locations.length + 1}`,
      description: '',
      type: 'General',
      icon: '📍',
      notes: '',
      created: new Date().toISOString(),
      modified: new Date().toISOString()
    };

    setBook(prev => ({
      ...prev,
      locations: [...prev.locations, newLocation],
      metadata: { ...prev.metadata, modified: new Date().toISOString() }
    }));
    setCurrentLocationId(newLocation.id);
    markAsChanged();
  };

  const updateLocation = (locationId, updates) => {
    setBook(prev => ({
      ...prev,
      locations: prev.locations.map(location =>
        location.id === locationId
          ? { ...location, ...updates, modified: new Date().toISOString() }
          : location
      ),
      metadata: { ...prev.metadata, modified: new Date().toISOString() }
    }));
    markAsChanged();
  };

  const moveLocationToRecycleBin = locationId => {
    const location = book.locations.find(l => l.id === locationId);
    if (!location) return;

    const recycleBinItem = {
      id: Date.now().toString(),
      type: 'location',
      item: location,
      deletedAt: new Date().toISOString()
    };

    setLocationRecycleBin(prev => [...prev, recycleBinItem]);

    setBook(prev => ({
      ...prev,
      locations: prev.locations.filter(location => location.id !== locationId),
      metadata: { ...prev.metadata, modified: new Date().toISOString() }
    }));

    if (currentLocationId === locationId) {
      setCurrentLocationId(null);
    }

    markAsChanged();
  };

  const restoreLocationFromRecycleBin = recycleBinItemId => {
    const recycleBinItem = locationRecycleBin.find(
      item => item.id === recycleBinItemId
    );
    if (!recycleBinItem) return;

    setBook(prev => ({
      ...prev,
      locations: [...prev.locations, recycleBinItem.item],
      metadata: { ...prev.metadata, modified: new Date().toISOString() }
    }));

    setLocationRecycleBin(prev =>
      prev.filter(item => item.id !== recycleBinItemId)
    );
    markAsChanged();
  };

  const permanentlyDeleteLocation = recycleBinItemId => {
    if (
      window.confirm('Permanently delete this location? This cannot be undone.')
    ) {
      setLocationRecycleBin(prev =>
        prev.filter(item => item.id !== recycleBinItemId)
      );
    }
  };

  // Background document management functions
  const handleNewFolder = () => {
    const newFolder = {
      id: Date.now().toString(),
      title: `Folder ${book.backgroundFolders.length + 1}`,
      documents: []
    };

    setBook(prev => ({
      ...prev,
      backgroundFolders: [...prev.backgroundFolders, newFolder],
      metadata: { ...prev.metadata, modified: new Date().toISOString() }
    }));
    setCurrentFolderId(newFolder.id);
    markAsChanged();
  };

  const handleNewDocument = () => {
    const currentFolder = book.backgroundFolders.find(
      f => f.id === currentFolderId
    );

    if (!currentFolder) {
      alert('Please select a folder first');
      return;
    }

    const newDocument = {
      id: Date.now().toString(),
      title: `Document ${currentFolder.documents.length + 1}`,
      content: '',
      created: new Date().toISOString(),
      modified: new Date().toISOString()
    };

    setBook(prev => ({
      ...prev,
      backgroundFolders: prev.backgroundFolders.map(folder =>
        folder.id === currentFolderId
          ? { ...folder, documents: [...folder.documents, newDocument] }
          : folder
      ),
      metadata: { ...prev.metadata, modified: new Date().toISOString() }
    }));
    setCurrentDocumentId(newDocument.id);
    markAsChanged();
  };

  const updateDocument = (documentId, updates) => {
    setBook(prev => ({
      ...prev,
      backgroundFolders: prev.backgroundFolders.map(folder => ({
        ...folder,
        documents: folder.documents.map(doc =>
          doc.id === documentId
            ? { ...doc, ...updates, modified: new Date().toISOString() }
            : doc
        )
      })),
      metadata: { ...prev.metadata, modified: new Date().toISOString() }
    }));
    markAsChanged();
  };

  const updateFolder = (folderId, updates) => {
    setBook(prev => ({
      ...prev,
      backgroundFolders: prev.backgroundFolders.map(folder =>
        folder.id === folderId ? { ...folder, ...updates } : folder
      ),
      metadata: { ...prev.metadata, modified: new Date().toISOString() }
    }));
    markAsChanged();
  };

  const moveDocumentToRecycleBin = documentId => {
    const document = getCurrentDocument();
    if (!document) return;

    // Find which folder the document belongs to
    const folder = book.backgroundFolders.find(f =>
      f.documents.some(d => d.id === documentId)
    );
    if (!folder) return;

    // Add to recycle bin with metadata
    const recycleBinItem = {
      id: Date.now().toString(),
      type: 'document',
      item: document,
      originalFolderId: folder.id,
      originalFolderTitle: folder.title,
      deletedAt: new Date().toISOString()
    };

    setBackgroundRecycleBin(prev => [...prev, recycleBinItem]);

    // Remove from folders
    setBook(prev => ({
      ...prev,
      backgroundFolders: prev.backgroundFolders.map(folder => ({
        ...folder,
        documents: folder.documents.filter(doc => doc.id !== documentId)
      })),
      metadata: { ...prev.metadata, modified: new Date().toISOString() }
    }));

    // Clear selection if this document was selected
    if (currentDocumentId === documentId) {
      setCurrentDocumentId(null);
    }

    markAsChanged();
  };

  const handleDeleteFolder = folderId => {
    if (book.backgroundFolders.length <= 1) {
      alert('Cannot delete the last folder');
      return;
    }

    const folder = book.backgroundFolders.find(f => f.id === folderId);
    if (folder.documents.length > 0) {
      if (!window.confirm(`Delete "${folder.title}" and all its documents?`)) {
        return;
      }
    }

    setBook(prev => ({
      ...prev,
      backgroundFolders: prev.backgroundFolders.filter(f => f.id !== folderId),
      metadata: { ...prev.metadata, modified: new Date().toISOString() }
    }));
    markAsChanged();

    if (currentFolderId === folderId) {
      setCurrentFolderId(book.backgroundFolders[0].id);
      setCurrentDocumentId(null);
    }
  };

  const restoreBackgroundFromRecycleBin = recycleBinItemId => {
    const recycleBinItem = backgroundRecycleBin.find(
      item => item.id === recycleBinItemId
    );
    if (!recycleBinItem) return;

    if (recycleBinItem.type === 'document') {
      // Find the original folder or use the first folder if not found
      const targetFolder =
        book.backgroundFolders.find(
          f => f.id === recycleBinItem.originalFolderId
        ) || book.backgroundFolders[0];

      if (targetFolder) {
        setBook(prev => ({
          ...prev,
          backgroundFolders: prev.backgroundFolders.map(folder =>
            folder.id === targetFolder.id
              ? {
                  ...folder,
                  documents: [...folder.documents, recycleBinItem.item]
                }
              : folder
          ),
          metadata: { ...prev.metadata, modified: new Date().toISOString() }
        }));
        markAsChanged();
      }
    }

    // Remove from recycle bin
    setBackgroundRecycleBin(prev =>
      prev.filter(item => item.id !== recycleBinItemId)
    );
  };

  const permanentlyDeleteBackground = recycleBinItemId => {
    if (
      window.confirm('Permanently delete this document? This cannot be undone.')
    ) {
      setBackgroundRecycleBin(prev =>
        prev.filter(item => item.id !== recycleBinItemId)
      );
    }
  };

  const handleBookRecovered = (filePath, bookData) => {
    // Add migration for front matter if missing
    if (!bookData.frontMatter) {
      bookData.frontMatter = [];
    }

    // Normalize all text content in the book for cross-platform consistency
    const normalizeBookContent = book => {
      return {
        ...book,
        chapters:
          book.chapters?.map(chapter => ({
            ...chapter,
            scenes:
              chapter.scenes?.map(scene => ({
                ...scene,
                content: normalizeContent(scene.content),
                notes: normalizeContent(scene.notes)
              })) || []
          })) || [],
        frontMatter:
          book.frontMatter?.map(item => ({
            ...item,
            content: normalizeContent(item.content)
          })) || [],
        characters:
          book.characters?.map(char => ({
            ...char,
            description: normalizeContent(char.description),
            notes: normalizeContent(char.notes)
          })) || [],
        locations:
          book.locations?.map(loc => ({
            ...loc,
            description: normalizeContent(loc.description)
          })) || []
      };
    };

    const normalizedBookData = normalizeBookContent(bookData);

    // Load the recovered book
    // Set all states simply and directly
    setBook(normalizedBookData);
    setCurrentChapterId(bookData.chapters[0]?.id || 'default');
    setCurrentSceneId(bookData.chapters[0]?.scenes[0]?.id || null);
    setCurrentPartId(bookData.parts?.length > 0 ? bookData.parts[0]?.id : null);
    setCurrentCharacterId(null);
    setCurrentLocationId(null);
    setCurrentFrontMatterId(null);
    setCurrentFilePath(filePath);
    setHasUnsavedChanges(false);
  };

  // Find current scene across all chapters
  const getCurrentScene = () => {
    for (const chapter of book.chapters) {
      const scene = chapter.scenes.find(scene => scene.id === currentSceneId);
      if (scene) return scene;
    }
    return null;
  };

  // Find current character
  const getCurrentCharacter = () => {
    return (
      book.characters.find(character => character.id === currentCharacterId) ||
      null
    );
  };

  // Find current document
  const getCurrentDocument = () => {
    for (const folder of book.backgroundFolders) {
      const document = folder.documents.find(
        doc => doc.id === currentDocumentId
      );
      if (document) return document;
    }
    return null;
  };

  const currentScene = getCurrentScene();
  const currentCharacter = getCurrentCharacter();
  const currentDocument = getCurrentDocument();

  return (
    <div className={`app ${isSaving ? 'saving' : ''}`}>
      <header
        className={`app-header ${hasUnsavedChanges ? 'has-unsaved-changes' : ''}`}
      >
        <div className="book-info">
          <input
            type="text"
            value={book.title}
            onChange={e => updateBookMetadata({ title: e.target.value })}
            className="book-title"
            placeholder="Book Title"
            title={
              currentFilePath ? `File: ${currentFilePath}` : 'No file selected'
            }
          />
          <input
            type="text"
            value={book.author}
            onChange={e => updateBookMetadata({ author: e.target.value })}
            className="book-author"
            placeholder="Author"
            title={
              currentFilePath ? `File: ${currentFilePath}` : 'No file selected'
            }
          />
        </div>
        <div className="toolbar">
          <button
            onClick={() => setShowTemplateManager(true)}
            className="icon-button"
            title="Template Settings - Customize fonts, layout, and formatting"
            aria-label="Template Settings"
          >
            ⚙️
          </button>
          <button
            onClick={() => setShowExportDialog(true)}
            className="icon-button"
            title="Export Book - Create PDF or HTML versions"
            aria-label="Export Book"
          >
            📤
          </button>
          <button
            onClick={() => setShowGitHubIntegration(true)}
            className="icon-button"
            title="GitHub Integration - Version control and backup"
            aria-label="GitHub Integration"
          >
            🔗
          </button>
          <button
            onClick={() => setShowBackupRecovery(true)}
            className="icon-button"
            title="Open from Backup - Recover books from GitHub"
            aria-label="Open from Backup"
          >
            📥
          </button>
          {!isElectron() && (
            <span className="browser-mode-indicator">
              Browser Mode - Limited functionality
            </span>
          )}
        </div>
      </header>

      <div className="app-content">
        <BookStructure
          parts={book.parts}
          chapters={book.chapters}
          currentSceneId={currentSceneId}
          currentChapterId={currentChapterId}
          currentPartId={currentPartId}
          onSceneSelect={setCurrentSceneId}
          onChapterSelect={setCurrentChapterId}
          onPartSelect={setCurrentPartId}
          collaboration={book.github?.collaboration || book.collaboration}
          onSceneAdd={handleNewScene}
          onChapterAdd={handleNewChapter}
          onPartAdd={handleNewPart}
          onSceneDelete={moveSceneToRecycleBin}
          onChapterDelete={handleDeleteChapter}
          onPartDelete={handleDeletePart}
          onChapterUpdate={updateChapter}
          onPartUpdate={updatePart}
          onReorderChapters={reorderChapters}
          onReorderParts={reorderParts}
          onReorderChaptersInPart={reorderChaptersInPart}
          onReorderScenesInChapter={reorderScenesInChapter}
          onMoveSceneBetweenChapters={moveSceneBetweenChapters}
          onMoveChapterToPart={moveChapterToPart}
          onAddChapterToPart={addChapterToPart}
          onRemoveChapterFromPart={removeChapterFromPart}
          recycleBin={recycleBin}
          showRecycleBin={showRecycleBin}
          onToggleRecycleBin={() => setShowRecycleBin(!showRecycleBin)}
          onRestoreFromRecycleBin={restoreFromRecycleBin}
          onPermanentlyDelete={permanentlyDeleteFromRecycleBin}
          onEmptyRecycleBin={emptyRecycleBin}
          characters={book.characters}
          currentCharacterId={currentCharacterId}
          onCharacterSelect={setCurrentCharacterId}
          onCharacterAdd={handleNewCharacter}
          onCharacterDelete={moveCharacterToRecycleBin}
          onCharacterUpdate={updateCharacter}
          characterRecycleBin={characterRecycleBin}
          onRestoreCharacterFromRecycleBin={restoreCharacterFromRecycleBin}
          onPermanentlyDeleteCharacter={permanentlyDeleteCharacter}
          characterDetectionBlacklist={book.characterDetectionBlacklist}
          onUpdateCharacterDetectionBlacklist={
            updateCharacterDetectionBlacklist
          }
          backgroundFolders={book.backgroundFolders}
          currentDocumentId={currentDocumentId}
          currentFolderId={currentFolderId}
          onDocumentSelect={setCurrentDocumentId}
          onFolderSelect={setCurrentFolderId}
          onDocumentAdd={handleNewDocument}
          onFolderAdd={handleNewFolder}
          onDocumentDelete={moveDocumentToRecycleBin}
          onDocumentUpdate={updateDocument}
          onFolderDelete={handleDeleteFolder}
          onFolderUpdate={updateFolder}
          onReorderFolders={() => {}}
          onReorderDocumentsInFolder={() => {}}
          onMoveDocumentBetweenFolders={() => {}}
          backgroundRecycleBin={backgroundRecycleBin}
          onRestoreBackgroundFromRecycleBin={restoreBackgroundFromRecycleBin}
          onPermanentlyDeleteBackground={permanentlyDeleteBackground}
          locations={book.locations}
          currentLocationId={currentLocationId}
          onLocationSelect={setCurrentLocationId}
          onLocationAdd={handleNewLocation}
          onLocationDelete={moveLocationToRecycleBin}
          onLocationUpdate={updateLocation}
          locationRecycleBin={locationRecycleBin}
          onRestoreLocationFromRecycleBin={restoreLocationFromRecycleBin}
          onPermanentlyDeleteLocation={permanentlyDeleteLocation}
          frontMatter={book.frontMatter}
          currentFrontMatterId={currentFrontMatterId}
          onFrontMatterSelect={setCurrentFrontMatterId}
          onFrontMatterAdd={handleAddFrontMatter}
          onFrontMatterDelete={handleDeleteFrontMatter}
          onFrontMatterUpdate={updateFrontMatter}
          onFrontMatterToggle={handleToggleFrontMatter}
          onFrontMatterReorder={handleReorderFrontMatter}
          authorName={book.author}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {activeTab === 'manuscript' ? (
          currentScene ? (
            <SceneEditor
              scene={currentScene}
              template={book.template}
              onSceneUpdate={updateScene}
              collaboration={book.github?.collaboration || book.collaboration}
            />
          ) : (
            <div className="scene-editor">
              <div className="no-scene">
                <h3>No Scene Selected</h3>
                <p>
                  Select a scene from the chapters to start writing, or create a
                  new scene.
                </p>
              </div>
            </div>
          )
        ) : activeTab === 'characters' ? (
          currentCharacter ? (
            <CharacterEditor
              character={currentCharacter}
              template={book.template}
              onCharacterUpdate={updateCharacter}
            />
          ) : (
            <div className="character-editor">
              <div className="no-character">
                <h3>No Character Selected</h3>
                <p>
                  Select a character from the list to edit their information, or
                  create a new character.
                </p>
              </div>
            </div>
          )
        ) : activeTab === 'threads' ? (
          <CharacterThreadVisualization
            chapters={book.chapters}
            characters={book.characters}
            characterDetectionBlacklist={book.characterDetectionBlacklist}
            onUpdateCharacterDetectionBlacklist={
              updateCharacterDetectionBlacklist
            }
          />
        ) : activeTab === 'locations' ? (
          book.locations.find(l => l.id === currentLocationId) ? (
            <LocationEditor
              location={book.locations.find(l => l.id === currentLocationId)}
              template={book.template}
              onLocationUpdate={updateLocation}
            />
          ) : (
            <div className="location-editor">
              <div className="no-location">
                <h3>No Location Selected</h3>
                <p>
                  Select a location from the list to edit its information, or
                  create a new location.
                </p>
              </div>
            </div>
          )
        ) : activeTab === 'background' ? (
          currentDocument ? (
            <BackgroundEditor
              document={currentDocument}
              template={book.template}
              onDocumentUpdate={updateDocument}
            />
          ) : (
            <div className="background-editor">
              <div className="no-scene">
                <h3>No Document Selected</h3>
                <p>
                  Select a background document from the folders to start
                  writing, or create a new document.
                </p>
              </div>
            </div>
          )
        ) : activeTab === 'frontmatter' ? (
          book.frontMatter.find(fm => fm.id === currentFrontMatterId) ? (
            <FrontMatterEditor
              frontMatterItem={book.frontMatter.find(
                fm => fm.id === currentFrontMatterId
              )}
              onFrontMatterUpdate={updateFrontMatter}
              authorName={book.author}
            />
          ) : (
            <FrontMatterEditor
              frontMatterItem={null}
              onFrontMatterUpdate={updateFrontMatter}
              authorName={book.author}
            />
          )
        ) : (
          <div className="scene-editor">
            <div className="no-scene">
              <h3>No Selection</h3>
              <p>Please select a tab to get started.</p>
            </div>
          </div>
        )}
      </div>

      {showTemplateManager && (
        <TemplateManager
          template={book.template}
          onTemplateUpdate={updateTemplate}
          onClose={() => setShowTemplateManager(false)}
        />
      )}

      {showExportDialog && (
        <ExportDialog
          book={book}
          onClose={() => setShowExportDialog(false)}
          onExport={() => {
            // Export is handled internally by ExportDialog
          }}
        />
      )}

      {showGitHubIntegration && (
        <GitHubIntegration
          currentRepo={gitHubRepo}
          onGitHubSettingsUpdate={updateGitHubSettings}
          onGitHubSyncStatusUpdate={updateGitHubSyncStatus}
          onClose={() => setShowGitHubIntegration(false)}
          book={book}
          currentFilePath={currentFilePath}
          onBookUpdate={setBook}
        />
      )}

      {showBackupRecovery && (
        <BackupRecovery
          onClose={() => setShowBackupRecovery(false)}
          onBookRecovered={handleBookRecovered}
        />
      )}

      <StatusBar
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving}
        currentOperation={currentOperation}
        githubSyncStatus={book.github}
        isOnline={navigator.onLine}
      />
    </div>
  );
}

export default App;
