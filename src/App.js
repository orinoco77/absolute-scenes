import React, { useState, useEffect, useCallback, useRef } from 'react';
import BookStructure from './components/BookStructure';
import SceneEditor from './components/SceneEditor';
import CharacterEditor from './components/CharacterEditor';
import TemplateManager from './components/TemplateManager';
import ExportDialog from './components/ExportDialog';
import GitHubIntegration from './components/GitHubIntegration';
import BackupRecovery from './components/BackupRecovery';
import StatusBar from './components/StatusBar';
import { saveBook, saveBookToFile, loadBook } from './utils/fileOperations';
import { initializeFontSystem } from './utils/fontManager';
import './styles/App.css';

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
  // Check if we're in Electron environment
  const isElectronApp = () => {
    return typeof window !== 'undefined' && typeof window.require === 'function';
  };

  const [book, setBook] = useState({
    title: '',
    author: '',
    chapters: [
      {
        id: 'default',
        title: 'Chapter 1',
        scenes: []
      }
    ],
    characters: [],
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
          inside: 1.25,  // Inner margin (towards spine)
          outside: 1     // Outer margin (towards edge)
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
  });

  const [currentSceneId, setCurrentSceneId] = useState(null);
  const [currentChapterId, setCurrentChapterId] = useState('default');
  const [currentCharacterId, setCurrentCharacterId] = useState(null);
  const [activeTab, setActiveTab] = useState('manuscript');
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showGitHubIntegration, setShowGitHubIntegration] = useState(false);
  const [showBackupRecovery, setShowBackupRecovery] = useState(false);
  // GitHub repo is now stored in book.github.repository, but we keep this for compatibility
  const gitHubRepo = book.github?.repository || null;
  const [recycleBin, setRecycleBin] = useState([]);
  const [showRecycleBin, setShowRecycleBin] = useState(false);
  const [characterRecycleBin, setCharacterRecycleBin] = useState([]);
  const [currentFilePath, setCurrentFilePath] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // Flag to prevent marking changes during save
  const [currentOperation, setCurrentOperation] = useState(null);
  
  // Add ref to track save operations more reliably
  const saveOperationRef = useRef(false);

  // Initialize font system for better web fonts
  // Update window title
  useEffect(() => {
    let fileName = 'Untitled';
    if (currentFilePath) {
      // Extract just the filename from the full path
      fileName = currentFilePath.split(/[\\/]/).pop().replace(/\.(book|json)$/, '');
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
      const firstChapterWithScenes = book.chapters.find(ch => ch.scenes && ch.scenes.length > 0);
      if (firstChapterWithScenes && firstChapterWithScenes.scenes.length > 0) {
        console.log('Auto-selecting first scene:', firstChapterWithScenes.scenes[0].id);
        setCurrentChapterId(firstChapterWithScenes.id);
        setCurrentSceneId(firstChapterWithScenes.scenes[0].id);
      }
    }
  }, [activeTab, currentSceneId, book.chapters]);

  // Auto-select first character if none selected but characters exist
  useEffect(() => {
    if (activeTab === 'characters' && !currentCharacterId && book.characters && book.characters.length > 0) {
      console.log('Auto-selecting first character:', book.characters[0].id);
      setCurrentCharacterId(book.characters[0].id);
    }
  }, [activeTab, currentCharacterId, book.characters]);

  const markAsChanged = () => {
    if (isSaving) {
      return; // Ignore changes during save operation
    }
    setHasUnsavedChanges(true);
  };

  const updateGitHubSettings = (settings) => {
    setBook(prev => ({
      ...prev,
      github: { ...prev.github, ...settings },
      metadata: { ...prev.metadata, modified: new Date().toISOString() }
    }));
    markAsChanged();
  };

  const updateGitHubSyncStatus = (settings) => {
    // Update GitHub settings without marking as changed (for sync metadata only)
    setBook(prev => ({
      ...prev,
      github: { ...prev.github, ...settings }
    }));
  };

  const handleSaveBook = useCallback(async () => {
    // Use ref for immediate check (doesn't wait for state update)
    if (saveOperationRef.current || isSaving) {
      console.log('Save already in progress, skipping...');
      return;
    }

    // Set both ref and state
    saveOperationRef.current = true;
    setIsSaving(true);
    setCurrentOperation('Saving book...');
    
    console.log('=== SAVE OPERATION STARTED ===');
    
    try {
      let saveResult;
      let savedFilePath = currentFilePath;
      
      // Ensure we have clean book data before saving
      const bookDataToSave = {
        ...book,
        metadata: {
          ...book.metadata,
          modified: new Date().toISOString()
        }
      };
      
      if (currentFilePath) {
        // Quick save to existing file
        console.log('Performing quick save to:', currentFilePath);
        setCurrentOperation('Saving to file...');
        saveResult = await saveBookToFile(bookDataToSave, currentFilePath);
      } else {
        // Save As dialog for new files  
        console.log('Performing Save As...');
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
        
        console.log('=== SAVE OPERATION COMPLETED ===');
        
        // Handle GitHub sync separately and non-blocking
        if (bookDataToSave.github?.repository) {
          setCurrentOperation('Syncing to GitHub...');
          console.log('🔄 GitHub auto-sync triggered:', {
            repository: bookDataToSave.github.repository,
            hasRepository: !!bookDataToSave.github.repository,
            filePath: savedFilePath
          });
          // Don't await this - let it run in background
          handleGitHubSync(savedFilePath, now, bookDataToSave);
        } else {
          console.log('❌ GitHub auto-sync skipped - no repository configured');
        }
      } else if (saveResult.canceled) {
        // User canceled - this is normal, don't show error
        console.log('Save canceled by user');
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
      console.log('=== SAVE OPERATION CLEANUP ===');
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
  const handleGitHubSync = useCallback(async (filePath, saveTime, bookData = null) => {
    const dataToSync = bookData || book; // Use passed data or fallback to current state
    
    console.log('🔄 Starting GitHub sync with data:', {
      repository: dataToSync.github?.repository,
      filePath,
      bookTitle: dataToSync.title
    });
    
    try {
      const GitHubService = (await import('./utils/gitHubService')).default;
      
      console.log('🔍 Checking GitHub authentication...');
      const isAuth = GitHubService.isAuthenticated();
      console.log('🔍 Auth check result:', {
        isAuthenticated: isAuth,
        hasToken: !!GitHubService.token,
        hasUserInfo: !!GitHubService.userInfo
      });
      
      if (isAuth) {
        console.log('✅ GitHub authenticated, proceeding with sync');
        const commitMessage = `Auto-save: ${new Date().toLocaleString()}`;
        
        // Generate filename
        let filename = 'manuscript.book';
        if (filePath) {
          filename = filePath.split(/[\\/]/).pop();
          if (!filename.endsWith('.book')) {
            filename = filename.replace(/\.(book|json)$/, '') + '.book';
          }
        } else if (dataToSync.title?.trim()) {
          filename = dataToSync.title.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '') + '.book';
        }
        
        console.log('📤 Syncing to GitHub:', {
          repository: dataToSync.github.repository,
          filename,
          commitMessage
        });
        
        await GitHubService.saveBookToRepository(dataToSync.github.repository, dataToSync, commitMessage, filename);
        updateGitHubSyncStatus({ lastSyncTime: saveTime });
        console.log('✅ Book automatically synced to GitHub successfully');
      } else {
        console.warn('❌ GitHub sync failed - not authenticated');
        alert('GitHub auto-sync failed: Not authenticated. Please check your GitHub connection in settings.');
      }
    } catch (error) {
      console.error('❌ GitHub sync failed with error:', error);
      console.warn('GitHub sync failed:', error.message);
      // Show user-friendly error for auto-sync failures
      alert(`GitHub auto-sync failed: ${error.message}. You can manually sync from the GitHub settings.`);
    } finally {
      // Clear operation when sync is complete (success or failure)
      setCurrentOperation(null);
    }
  }, [updateGitHubSyncStatus]); // Removed 'book' from dependencies since we pass it as parameter

  // Add keyboard shortcuts with debouncing
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 's') {
          console.log('Ctrl+S pressed, save state:', {
            isSaving,
            saveOperationRef: saveOperationRef.current,
            hasUnsavedChanges
          });
          
          e.preventDefault();
          e.stopPropagation();
          
          if (!saveOperationRef.current && !isSaving) {
            debouncedSave();
          } else {
            console.log('Ignoring Ctrl+S - save in progress');
          }
        }
      }
    };

    // Use capture phase to ensure we get the event first
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [debouncedSave, isSaving, hasUnsavedChanges]);

  // IPC event handlers (stable, don't change frequently)
  useEffect(() => {
    if (!ipcRenderer) {
      return;
    }

    console.log('Setting up IPC event listeners...');

    // Create stable handlers
    const handleMenuNewBook = () => {
      console.log('Menu: New Book');
      handleNewBook();
    };
    
    const handleMenuSaveBook = () => {
      console.log('Menu: Save Book triggered');
      if (!saveOperationRef.current && !isSaving) {
        handleSaveBook();
      } else {
        console.log('Ignoring menu save - save in progress');
      }
    };
    
    const handleMenuSaveAs = async () => {
      console.log('Menu: Save As triggered');
      if (saveOperationRef.current || isSaving) {
        console.log('Save already in progress, skipping Save As...');
        return;
      }

      // Set both ref and state
      saveOperationRef.current = true;
      setIsSaving(true);
      setCurrentOperation('Save As...');
      
      console.log('=== SAVE AS OPERATION STARTED ===');
      
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
        console.log('Performing Save As...');
        setCurrentOperation('Choose save location...');
        const saveResult = await saveBook(bookDataToSave);
        
        // Only update state after file operations are completely finished
        if (saveResult.success) {
          const now = new Date().toISOString();
          
          // Update state
          setCurrentFilePath(saveResult.filePath);
          setHasUnsavedChanges(false);
          
          console.log('=== SAVE AS OPERATION COMPLETED ===');
          
          // Handle GitHub sync separately and non-blocking
          if (bookDataToSave.github?.repository) {
            setCurrentOperation('Syncing to GitHub...');
            console.log('🔄 GitHub auto-sync triggered from Save As');
            handleGitHubSync(saveResult.filePath, now, bookDataToSave);
          }
        } else if (saveResult.canceled) {
          // User canceled - this is normal, don't show error
          console.log('Save As canceled by user');
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
        console.log('=== SAVE AS OPERATION CLEANUP ===');
      }
    };
    
    const handleMenuExportBook = () => {
      console.log('Menu: Export Book');
      setShowExportDialog(true);
    };
    
    const handleMenuNewScene = () => {
      console.log('Menu: New Scene');
      handleNewScene();
    };
    
    const handleMenuDeleteScene = () => {
      console.log('Menu: Delete Scene');
      handleDeleteScene();
    };
    
    const handleMenuNewChapter = () => {
      console.log('Menu: New Chapter');
      handleNewChapter();
    };
    
    const handleMenuDeleteChapter = () => {
      console.log('Menu: Delete Chapter');
      if (currentChapterId) {
        handleDeleteChapter(currentChapterId);
      } else {
        alert('Please select a chapter to delete');
      }
    };
    
    const handleMenuDelete = () => {
      console.log('Menu: Delete');
      // Context-sensitive delete: delete current scene or chapter
      if (currentSceneId) {
        handleDeleteScene();
      } else if (currentChapterId && book.chapters.length > 1) {
        handleDeleteChapter(currentChapterId);
      }
    };
    
    const handleMenuToggleRecycleBin = () => {
      console.log('Menu: Toggle Recycle Bin');
      setShowRecycleBin(!showRecycleBin);
    };
    
    const handleMenuTemplateSettings = () => {
      console.log('Menu: Template Settings');
      setShowTemplateManager(true);
    };
    
    const handleMenuGitHubIntegration = () => {
      console.log('Menu: GitHub Integration');
      setShowGitHubIntegration(true);
    };
    
    const handleMenuBackupRecovery = () => {
      console.log('Menu: Backup Recovery');
      setShowBackupRecovery(true);
    };
    
    const handleMenuEmptyRecycleBin = () => {
      console.log('Menu: Empty Recycle Bin');
      emptyRecycleBin();
    };
    
    const handleBookLoaded = (event, bookData) => {
      console.log('Menu: Book Loaded');
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
      
      // Set all states in batch
      // Set all states simply and directly
      setBook(cleanBookData);
      setCurrentChapterId(cleanBookData.chapters[0]?.id || 'default');
      setCurrentSceneId(cleanBookData.chapters[0]?.scenes[0]?.id || null);
      setCurrentCharacterId(null);
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
    ipcRenderer.on('menu-delete', handleMenuDelete);
    ipcRenderer.on('menu-toggle-recycle-bin', handleMenuToggleRecycleBin);
    ipcRenderer.on('menu-template-settings', handleMenuTemplateSettings);
    ipcRenderer.on('menu-github-integration', handleMenuGitHubIntegration);
    ipcRenderer.on('menu-backup-recovery', handleMenuBackupRecovery);
    ipcRenderer.on('menu-empty-recycle-bin', handleMenuEmptyRecycleBin);
    ipcRenderer.on('book-loaded', handleBookLoaded);

    console.log('IPC event listeners registered successfully');

    return () => {
      console.log('Cleaning up IPC event listeners...');
      ipcRenderer.removeAllListeners('menu-new-book');
      ipcRenderer.removeAllListeners('menu-save-book');
      ipcRenderer.removeAllListeners('menu-save-as');
      ipcRenderer.removeAllListeners('menu-export-book');
      ipcRenderer.removeAllListeners('menu-new-scene');
      ipcRenderer.removeAllListeners('menu-delete-scene');
      ipcRenderer.removeAllListeners('menu-new-chapter');
      ipcRenderer.removeAllListeners('menu-delete-chapter');
      ipcRenderer.removeAllListeners('menu-delete');
      ipcRenderer.removeAllListeners('menu-toggle-recycle-bin');
      ipcRenderer.removeAllListeners('menu-template-settings');
      ipcRenderer.removeAllListeners('menu-github-integration');
      ipcRenderer.removeAllListeners('menu-backup-recovery');
      ipcRenderer.removeAllListeners('menu-empty-recycle-bin');
      ipcRenderer.removeAllListeners('book-loaded');
    };
  }, []); // Empty dependency array - only set up once

  const handleNewBook = () => {
    if (hasUnsavedChanges && !window.confirm('You have unsaved changes. Are you sure you want to create a new book?')) {
      return;
    }
    
    const newBookData = {
      title: '',
      author: '',
      chapters: [
        {
          id: 'default',
          title: 'Chapter 1',
          scenes: []
        }
      ],
      characters: [],
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
            inside: 1.25,  // Inner margin (towards spine)
            outside: 1     // Outer margin (towards edge)
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
    setCurrentCharacterId(null);
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
      modified: new Date().toISOString()
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
      scenes: []
    };

    setBook(prev => ({
      ...prev,
      chapters: [...prev.chapters, newChapter],
      metadata: { ...prev.metadata, modified: new Date().toISOString() }
    }));
    setCurrentChapterId(newChapter.id);
    markAsChanged();
  };

  const handleDeleteScene = () => {
    if (currentSceneId && window.confirm('Delete current scene?')) {
      moveSceneToRecycleBin(currentSceneId);
      setCurrentSceneId(null);
    }
  };

  const moveSceneToRecycleBin = (sceneId) => {
    const scene = getCurrentScene();
    if (!scene) return;
    
    // Find which chapter the scene belongs to
    const chapter = book.chapters.find(ch => ch.scenes.some(s => s.id === sceneId));
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

  const restoreFromRecycleBin = (recycleBinItemId) => {
    const recycleBinItem = recycleBin.find(item => item.id === recycleBinItemId);
    if (!recycleBinItem) return;
    
    if (recycleBinItem.type === 'scene') {
      // Find the original chapter or use the first chapter if not found
      const targetChapter = book.chapters.find(ch => ch.id === recycleBinItem.originalChapterId) || book.chapters[0];
      
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

  const permanentlyDeleteFromRecycleBin = (recycleBinItemId) => {
    if (window.confirm('Permanently delete this item? This cannot be undone.')) {
      setRecycleBin(prev => prev.filter(item => item.id !== recycleBinItemId));
    }
  };

  const emptyRecycleBin = () => {
    if (window.confirm('Permanently delete all items in the recycle bin? This cannot be undone.')) {
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

  const moveSceneBetweenChapters = (sceneId, fromChapterId, toChapterId, toIndex = -1) => {
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

  const handleDeleteChapter = (chapterId) => {
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
    setBook(prev => ({
      ...prev,
      chapters: prev.chapters.map(chapter => ({
        ...chapter,
        scenes: chapter.scenes.map(scene =>
          scene.id === sceneId
            ? { ...scene, ...updates, modified: new Date().toISOString() }
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
        chapter.id === chapterId
          ? { ...chapter, ...updates }
          : chapter
      ),
      metadata: { ...prev.metadata, modified: new Date().toISOString() }
    }));
    markAsChanged();
  };

  const updateBookMetadata = (metadata) => {
    setBook(prev => ({
      ...prev,
      ...metadata,
      metadata: { ...prev.metadata, modified: new Date().toISOString() }
    }));
    markAsChanged();
  };

  const updateTemplate = (template) => {
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

  const moveCharacterToRecycleBin = (characterId) => {
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
      characters: prev.characters.filter(character => character.id !== characterId),
      metadata: { ...prev.metadata, modified: new Date().toISOString() }
    }));
    
    // Clear selection if this character was selected
    if (currentCharacterId === characterId) {
      setCurrentCharacterId(null);
    }
    
    markAsChanged();
  };

  const restoreCharacterFromRecycleBin = (recycleBinItemId) => {
    const recycleBinItem = characterRecycleBin.find(item => item.id === recycleBinItemId);
    if (!recycleBinItem) return;
    
    // Add back to characters
    setBook(prev => ({
      ...prev,
      characters: [...prev.characters, recycleBinItem.item],
      metadata: { ...prev.metadata, modified: new Date().toISOString() }
    }));
    
    // Remove from recycle bin
    setCharacterRecycleBin(prev => prev.filter(item => item.id !== recycleBinItemId));
    markAsChanged();
  };

  const permanentlyDeleteCharacter = (recycleBinItemId) => {
    if (window.confirm('Permanently delete this character? This cannot be undone.')) {
      setCharacterRecycleBin(prev => prev.filter(item => item.id !== recycleBinItemId));
    }
  };

  const handleBookRecovered = (filePath, bookData) => {
    // Load the recovered book
    // Set all states simply and directly
    setBook(bookData);
    setCurrentChapterId(bookData.chapters[0]?.id || 'default');
    setCurrentSceneId(bookData.chapters[0]?.scenes[0]?.id || null);
    setCurrentCharacterId(null);
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
    return book.characters.find(character => character.id === currentCharacterId) || null;
  };

  const currentScene = getCurrentScene();
  const currentCharacter = getCurrentCharacter();

  return (
    <div className={`app ${isSaving ? 'saving' : ''}`}>
      <header className={`app-header ${hasUnsavedChanges ? 'has-unsaved-changes' : ''}`}>
        <div className="book-info">
          <input
            type="text"
            value={book.title}
            onChange={(e) => updateBookMetadata({ title: e.target.value })}
            className="book-title"
            placeholder="Book Title"
            title={currentFilePath ? `File: ${currentFilePath}` : 'No file selected'}
          />
          <input
            type="text"
            value={book.author}
            onChange={(e) => updateBookMetadata({ author: e.target.value })}
            className="book-author"
            placeholder="Author"
            title={currentFilePath ? `File: ${currentFilePath}` : 'No file selected'}
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
          {!isElectronApp() && (
            <span className="browser-mode-indicator">
              Browser Mode - Limited functionality
            </span>
          )}
        </div>
      </header>

      <div className="app-content">
        <BookStructure
          // Scene/Chapter props
          chapters={book.chapters}
          currentSceneId={currentSceneId}
          currentChapterId={currentChapterId}
          onSceneSelect={setCurrentSceneId}
          onChapterSelect={setCurrentChapterId}
          onSceneAdd={handleNewScene}
          onChapterAdd={handleNewChapter}
          onSceneDelete={moveSceneToRecycleBin}
          onChapterDelete={handleDeleteChapter}
          onChapterUpdate={updateChapter}
          onReorderChapters={reorderChapters}
          onReorderScenesInChapter={reorderScenesInChapter}
          onMoveSceneBetweenChapters={moveSceneBetweenChapters}
          recycleBin={recycleBin}
          showRecycleBin={showRecycleBin}
          onToggleRecycleBin={() => setShowRecycleBin(!showRecycleBin)}
          onRestoreFromRecycleBin={restoreFromRecycleBin}
          onPermanentlyDelete={permanentlyDeleteFromRecycleBin}
          onEmptyRecycleBin={emptyRecycleBin}
          
          // Character props
          characters={book.characters}
          currentCharacterId={currentCharacterId}
          onCharacterSelect={setCurrentCharacterId}
          onCharacterAdd={handleNewCharacter}
          onCharacterDelete={moveCharacterToRecycleBin}
          onCharacterUpdate={updateCharacter}
          characterRecycleBin={characterRecycleBin}
          onRestoreCharacterFromRecycleBin={restoreCharacterFromRecycleBin}
          onPermanentlyDeleteCharacter={permanentlyDeleteCharacter}
          
          // Tab props
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        
        {activeTab === 'manuscript' ? (
          currentScene ? (
            <SceneEditor
              scene={currentScene}
              template={book.template}
              onSceneUpdate={updateScene}
            />
          ) : (
            <div className="scene-editor">
              <div className="no-scene">
                <h3>No Scene Selected</h3>
                <p>Select a scene from the chapters to start writing, or create a new scene.</p>
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
                <p>Select a character from the list to edit their information, or create a new character.</p>
              </div>
            </div>
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
          onExport={(format) => {
            // Export logic would trigger GitHub commit prompt if repo exists
            if (book.github?.repository) {
              const shouldCommit = window.confirm('Commit export to GitHub?');
              // Handle commit logic
            }
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