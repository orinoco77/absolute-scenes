/* eslint-disable no-console */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useCallback, useMemo } from 'react';
import BackgroundEditor from './components/BackgroundEditor';
import BackMatterEditor from './components/BackMatterEditor';
import BackupRecovery from './components/BackupRecovery';
import BookStructure from './components/BookStructure';
import CharacterEditor from './components/CharacterEditor';
import CharacterThreadVisualization from './components/CharacterThreadVisualization';
import ExportDialog from './components/ExportDialog';
import FontSettings from './components/FontSettings';
import FrontMatterEditor from './components/FrontMatterEditor';
import GitHubIntegration from './components/GitHubIntegration';
import IllustrationEditor from './components/IllustrationEditor';
import LocationEditor from './components/LocationEditor';
import SceneEditor from './components/SceneEditor';
import SpellCheckSettings from './components/SpellCheckSettings';
import StatusBar from './components/StatusBar';
import TemplateManager from './components/TemplateManager';
import { useBookState } from './hooks/useBookState';
import { useUIState } from './hooks/useUIState';
import { EventHandlerService } from './services/EventHandlerService';
import { GitHubSyncService } from './services/GitHubSyncService';
import { SaveService } from './services/SaveService';
import { initializeFontSystem } from './utils/fontManager';
import { initializeFontSettings } from './utils/fontSettingsManager';
import './styles/App.css';
import './styles/back-matter.css';
import './styles/font-settings.css';

// Create service instances (following Dependency Inversion Principle)
const saveService = new SaveService();
const gitHubSyncService = new GitHubSyncService();
const eventHandlerService = new EventHandlerService();

function App() {
  // Use custom hooks for state management (following Single Responsibility Principle)
  const bookState = useBookState();
  const uiState = useUIState();

  const {
    book,
    setBook,
    // bookRef, // Not used in this refactored version
    updateBookMetadata,
    updateTemplate,
    updateGitHubSettings,
    updateGitHubSyncStatus,
    updateScene,
    addScene,
    deleteScene,
    moveSceneBetweenChapters,
    updateChapter,
    addChapter,
    deleteChapter,
    updateCharacter,
    addCharacter,
    deleteCharacter,
    updateLocation,
    addLocation,
    deleteLocation,
    addPart,
    updatePart,
    deletePart,
    moveChapterToPart,
    addChapterToPart,
    removeChapterFromPart,
    addDocument,
    updateDocument,
    deleteDocument,
    addBackgroundFolder,
    updateBackgroundFolder,
    deleteBackgroundFolder,
    addFrontMatter,
    updateFrontMatter,
    deleteFrontMatter,
    addBackMatter,
    updateBackMatter,
    deleteBackMatter,
    recoverBook,
    resetBook,
    getCurrentScene,
    getCurrentCharacter,
    getCurrentDocument,
    getCurrentLocation,
    getCurrentFrontMatter,
    getCurrentBackMatter,
    addIllustration,
    updateIllustration,
    deleteIllustration,
    getCurrentIllustration
  } = bookState;

  const {
    activeTab,
    currentSceneId,
    currentChapterId,
    currentPartId,
    currentCharacterId,
    currentLocationId,
    currentDocumentId,
    currentFolderId,
    currentFrontMatterId,
    currentBackMatterId,
    currentIllustrationId,
    setActiveTab,
    setCurrentSceneId,
    setCurrentChapterId,
    setCurrentPartId,
    setCurrentCharacterId,
    setCurrentLocationId,
    setCurrentDocumentId,
    setCurrentFolderId,
    setCurrentFrontMatterId,
    setCurrentBackMatterId,
    setCurrentIllustrationId,
    showTemplateManager,
    showExportDialog,
    showGitHubIntegration,
    showBackupRecovery,
    showSpellCheckSettings,
    showFontSettings,
    setShowTemplateManager,
    setShowExportDialog,
    setShowGitHubIntegration,
    setShowBackupRecovery,
    setShowSpellCheckSettings,
    setShowFontSettings,
    recycleBin,
    showRecycleBin,
    characterRecycleBin,
    locationRecycleBin,
    backgroundRecycleBin,
    setRecycleBin,
    setShowRecycleBin,
    // setCharacterRecycleBin, // Reserved for future use
    // setLocationRecycleBin, // Reserved for future use
    // setBackgroundRecycleBin, // Reserved for future use
    currentFilePath,
    hasUnsavedChanges,
    isSaving,
    currentOperation,
    setCurrentFilePath,
    setHasUnsavedChanges,
    setIsSaving,
    setCurrentOperation,
    userHasInteracted,
    // setUserHasInteracted, // Would be used for user interaction tracking
    markAsChanged,
    autoSelectFirstScene,
    autoSelectFirstCharacter,
    autoSelectFirstLocation,
    autoSelectFirstDocument,
    autoSelectFirstFrontMatter,
    autoSelectFirstBackMatter,
    resetUIForNewBook,
    loadBook
  } = uiState;

  // Initialize font system
  useEffect(() => {
    initializeFontSystem();
    initializeFontSettings();

    // Expose hasUnsavedChanges to Electron main process
    eventHandlerService.exposeToElectron(
      'hasUnsavedChanges',
      () => hasUnsavedChanges
    );
  }, []);

  // Update the exposed function when hasUnsavedChanges changes
  useEffect(() => {
    eventHandlerService.exposeToElectron(
      'hasUnsavedChanges',
      () => hasUnsavedChanges
    );
  }, [hasUnsavedChanges]);

  // Update window title when relevant state changes
  useEffect(() => {
    eventHandlerService.updateWindowTitle(
      currentFilePath,
      hasUnsavedChanges,
      book.title
    );
  }, [currentFilePath, hasUnsavedChanges, book.title]);

  // Auto-selection effects (following Open/Closed Principle)
  useEffect(() => {
    autoSelectFirstScene(book);
  }, [activeTab, currentSceneId, book.chapters]);

  useEffect(() => {
    autoSelectFirstCharacter(book);
  }, [activeTab, currentCharacterId, book.characters]);

  useEffect(() => {
    autoSelectFirstLocation(book);
  }, [activeTab, currentLocationId, book.locations]);

  useEffect(() => {
    autoSelectFirstDocument(book);
  }, [activeTab, currentDocumentId, book.backgroundFolders]);

  useEffect(() => {
    autoSelectFirstFrontMatter(book);
  }, [activeTab, currentFrontMatterId, book.frontMatter]);

  useEffect(() => {
    autoSelectFirstBackMatter(book);
  }, [activeTab, currentBackMatterId, book.backMatter]);

  // Save operation handlers (following Single Responsibility Principle)
  const handleSaveBook = useCallback(async () => {
    if (saveService.isSaveInProgress()) {
      return;
    }

    const result = await saveService.saveBookData({
      book,
      currentFilePath,
      onSaveStart: () => {
        setIsSaving(true);
      },
      onSaveEnd: () => {
        setIsSaving(false);
      },
      onSaveSuccess: filePath => {
        setCurrentFilePath(filePath);
        setHasUnsavedChanges(false);

        // Handle GitHub sync if configured
        if (gitHubSyncService.shouldSyncToGitHub(book)) {
          const saveTime = new Date().toISOString();
          handleGitHubSync(filePath, saveTime, book);
        }
      },
      onSaveError: error => {
        console.error('Save failed:', error);
        alert('Save failed: ' + error);
      },
      onOperationUpdate: operation => {
        setCurrentOperation(operation);
      }
    });

    return result;
  }, [book, currentFilePath]);

  const _handleSaveAsBook = useCallback(async () => {
    if (saveService.isSaveInProgress()) {
      return;
    }

    const result = await saveService.saveAsBookData({
      book,
      onSaveStart: () => {
        setIsSaving(true);
      },
      onSaveEnd: () => {
        setIsSaving(false);
      },
      onSaveSuccess: filePath => {
        setCurrentFilePath(filePath);
        setHasUnsavedChanges(false);

        // Handle GitHub sync if configured
        if (gitHubSyncService.shouldSyncToGitHub(book)) {
          const saveTime = new Date().toISOString();
          handleGitHubSync(filePath, saveTime, book);
        }
      },
      onSaveError: error => {
        console.error('Save As failed:', error);
        alert('Save As failed: ' + error);
      },
      onOperationUpdate: operation => {
        setCurrentOperation(operation);
      }
    });

    return result;
  }, [book]);

  // Utility functions
  const emptyRecycleBin = useCallback(() => {
    setRecycleBin([]);
    // TODO: Also empty other recycle bins when implemented
    // setCharacterRecycleBin([]);
    // setLocationRecycleBin([]);
    // setBackgroundRecycleBin([]);
  }, [setRecycleBin]);

  const handleExportBook = useCallback(() => {
    setShowExportDialog(true);
  }, [setShowExportDialog]);

  // GitHub sync handler (following Single Responsibility Principle)
  const handleGitHubSync = useCallback(
    async (filePath, saveTime, bookData = null) => {
      const dataToSync = bookData || book;

      await gitHubSyncService.syncWithGitHub({
        bookData: dataToSync,
        filePath,
        saveTime,
        onOperationUpdate: setCurrentOperation,
        onSyncSuccess: syncTime => {
          updateGitHubSyncStatus({ lastSyncTime: syncTime });
        },
        onSyncError: error => {
          alert(error);
        }
      });
    },
    [book, updateGitHubSyncStatus]
  );

  // Create debounced save function
  const debouncedSave = useMemo(
    () =>
      saveService.createDebouncedSave(() => {
        if (!saveService.isSaveInProgress()) {
          handleSaveBook();
        }
      }),
    [handleSaveBook]
  );

  // Event listeners setup (following Dependency Inversion Principle)
  useEffect(() => {
    const cleanup1 = eventHandlerService.setupBeforeUnloadHandler(
      () => hasUnsavedChanges,
      () => userHasInteracted
    );

    const cleanup2 = eventHandlerService.setupKeyboardShortcuts(
      debouncedSave,
      () => !saveService.isSaveInProgress()
    );

    // Setup IPC handlers for Electron menu actions
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

        // Import successful - clean and update the book state
        const importedBook = result.bookData;

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

        // Load UI state for the imported book
        loadBook(cleanedBook, null);
        setActiveTab('scenes'); // Switch to scenes tab to show imported content

        alert('Scrivener project imported successfully!');
      } catch (error) {
        console.error('Error handling Scrivener import:', error);
        alert(`Error importing Scrivener project: ${error.message}`);
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

      // Migrate old format - add missing arrays/objects
      if (!cleanBookData.frontMatter) {
        cleanBookData.frontMatter = [];
      }
      if (!cleanBookData.parts) {
        cleanBookData.parts = [];
      }
      if (!cleanBookData.github) {
        cleanBookData.github = {
          repository: null,
          lastSyncTime: null
        };
      }
      if (!cleanBookData.characters) {
        cleanBookData.characters = [];
      }
      if (!cleanBookData.characterDetectionBlacklist) {
        cleanBookData.characterDetectionBlacklist = [];
      }
      if (!cleanBookData.locations) {
        cleanBookData.locations = [];
      }
      if (!cleanBookData.backgroundFolders) {
        cleanBookData.backgroundFolders = [
          {
            id: 'default-bg',
            title: 'General Notes',
            documents: []
          }
        ];
      }

      // Load the book and update UI state
      setBook(cleanBookData);
      loadBook(cleanBookData, filePath);
      setCurrentFilePath(filePath);
      setHasUnsavedChanges(false);
    };

    const cleanup3 = eventHandlerService.setupIpcHandlers({
      'import-scrivener-result': handleImportScrivenerResult,
      'book-loaded': handleBookLoaded,
      'menu-save-book': () => {
        handleSaveBook();
      },
      'menu-save-as': () => {
        _handleSaveAsBook();
      },
      'menu-export-book': () => {
        handleExportBook();
      },
      'menu-delete': () => {
        // Handle delete based on current context
        if (activeTab === 'scenes' && currentSceneId) {
          deleteScene(currentSceneId);
          markAsChanged();
          setCurrentSceneId(null);
        } else if (activeTab === 'chapters' && currentChapterId) {
          deleteChapter(currentChapterId);
          markAsChanged();
          const firstChapter = book.chapters.find(
            ch => ch.id !== currentChapterId
          );
          setCurrentChapterId(firstChapter?.id || null);
          setCurrentSceneId(null);
        } else if (activeTab === 'parts' && currentPartId) {
          deletePart(currentPartId);
          markAsChanged();
          setCurrentPartId(null);
        }
      },
      'menu-new-chapter': () => {
        if (activeTab !== 'chapters') {
          setActiveTab('chapters');
        }
        const newChapterId = addChapter();
        setCurrentChapterId(newChapterId);
        markAsChanged();
      },
      'menu-delete-chapter': () => {
        if (currentChapterId) {
          deleteChapter(currentChapterId);
          markAsChanged();
          const firstChapter = book.chapters.find(
            ch => ch.id !== currentChapterId
          );
          setCurrentChapterId(firstChapter?.id || null);
          setCurrentSceneId(null);
        }
      },
      'menu-new-part': () => {
        if (activeTab !== 'parts') {
          setActiveTab('parts');
        }
        const newPartId = addPart();
        setCurrentPartId(newPartId);
        markAsChanged();
      },
      'menu-delete-part': () => {
        if (currentPartId) {
          deletePart(currentPartId);
          markAsChanged();
          setCurrentPartId(null);
        }
      },
      'menu-new-scene': () => {
        if (activeTab !== 'scenes') {
          setActiveTab('scenes');
        }
        const newSceneId = addScene(currentChapterId);
        setCurrentSceneId(newSceneId);
        markAsChanged();
      },
      'menu-delete-scene': () => {
        if (currentSceneId) {
          deleteScene(currentSceneId);
          markAsChanged();
          setCurrentSceneId(null);
        }
      },
      'menu-toggle-recycle-bin': () => {
        setShowRecycleBin(!showRecycleBin);
      },
      'menu-template-settings': () => {
        setActiveTab('settings');
        // Focus on template settings if there's a specific section
      },
      'menu-spell-check-settings': () => {
        setShowSpellCheckSettings(true);
      },
      'menu-font-settings': () => {
        setShowFontSettings(true);
      },
      'menu-github-integration': () => {
        setActiveTab('settings');
        // Could open a specific GitHub settings modal in the future
      },
      'menu-backup-recovery': () => {
        setActiveTab('settings');
        // Could open a specific backup recovery modal in the future
      },
      'menu-empty-recycle-bin': () => {
        // Empty the recycle bin
        if (
          window.confirm(
            'Are you sure you want to permanently delete all items in the recycle bin? This action cannot be undone.'
          )
        ) {
          emptyRecycleBin();
        }
      },
      'menu-new-book': () => {
        _handleNewBook();
      }
    });

    return () => {
      cleanup1?.();
      cleanup2?.();
      cleanup3?.();
    };
  }, [
    hasUnsavedChanges,
    userHasInteracted,
    debouncedSave,
    handleSaveBook,
    _handleSaveAsBook,
    handleExportBook,
    activeTab,
    currentSceneId,
    currentChapterId,
    currentPartId,
    showRecycleBin,
    emptyRecycleBin,
    addScene,
    updateScene,
    deleteScene,
    addChapter,
    updateChapter,
    deleteChapter,
    addPart,
    updatePart,
    deletePart,
    markAsChanged,
    setBook,
    loadBook,
    setCurrentFilePath,
    setHasUnsavedChanges,
    setActiveTab,
    setShowRecycleBin,
    setCurrentSceneId,
    setCurrentChapterId,
    setCurrentPartId
  ]);

  // Content handlers (following Interface Segregation Principle)
  const contentHandlers = useMemo(
    () => ({
      scene: {
        add: () => {
          const newSceneId = addScene(currentChapterId);
          setCurrentSceneId(newSceneId);
          markAsChanged();
        },
        update: (sceneId, updates) => {
          updateScene(sceneId, updates);
          markAsChanged();
        },
        delete: sceneId => {
          deleteScene(sceneId);
          markAsChanged();
          if (currentSceneId === sceneId) {
            setCurrentSceneId(null);
          }
        }
      },
      chapter: {
        add: () => {
          const newChapterId = addChapter();
          setCurrentChapterId(newChapterId);
          markAsChanged();
        },
        update: (chapterId, updates) => {
          updateChapter(chapterId, updates);
          markAsChanged();
        },
        delete: chapterId => {
          deleteChapter(chapterId);
          markAsChanged();
          if (currentChapterId === chapterId) {
            const firstChapter = book.chapters[0];
            setCurrentChapterId(firstChapter?.id || 'default');
            setCurrentSceneId(null);
          }
        }
      },
      character: {
        add: () => {
          const newCharacterId = addCharacter();
          setCurrentCharacterId(newCharacterId);
          markAsChanged();
        },
        update: (characterId, updates) => {
          updateCharacter(characterId, updates);
          markAsChanged();
        },
        delete: characterId => {
          deleteCharacter(characterId);
          markAsChanged();
          if (currentCharacterId === characterId) {
            setCurrentCharacterId(null);
          }
        }
      },
      location: {
        add: () => {
          const newLocationId = addLocation();
          setCurrentLocationId(newLocationId);
          markAsChanged();
        },
        update: (locationId, updates) => {
          updateLocation(locationId, updates);
          markAsChanged();
        },
        delete: locationId => {
          deleteLocation(locationId);
          markAsChanged();
          if (currentLocationId === locationId) {
            setCurrentLocationId(null);
          }
        }
      },
      part: {
        add: () => {
          const newPartId = addPart();
          setCurrentPartId(newPartId);
          markAsChanged();
        },
        update: (partId, updates) => {
          updatePart(partId, updates);
          markAsChanged();
        },
        delete: partId => {
          deletePart(partId);
          markAsChanged();
          if (currentPartId === partId) {
            setCurrentPartId(null);
          }
        }
      },
      document: {
        add: () => {
          const newDocumentId = addDocument(currentFolderId);
          setCurrentDocumentId(newDocumentId);
          markAsChanged();
        },
        update: (documentId, updates) => {
          updateDocument(documentId, updates);
          markAsChanged();
        },
        delete: documentId => {
          deleteDocument(documentId);
          markAsChanged();
          if (currentDocumentId === documentId) {
            setCurrentDocumentId(null);
          }
        }
      },
      frontMatter: {
        add: frontMatterItem => {
          addFrontMatter(frontMatterItem);
          setCurrentFrontMatterId(frontMatterItem.id);
          markAsChanged();
        },
        update: (frontMatterId, updates) => {
          updateFrontMatter(frontMatterId, updates);
          markAsChanged();
        },
        delete: frontMatterId => {
          deleteFrontMatter(frontMatterId);
          markAsChanged();
          if (currentFrontMatterId === frontMatterId) {
            setCurrentFrontMatterId(null);
          }
        }
      },
      backMatter: {
        add: backMatterItem => {
          addBackMatter(backMatterItem);
          setCurrentBackMatterId(backMatterItem.id);
          markAsChanged();
        },
        update: (backMatterId, updates) => {
          updateBackMatter(backMatterId, updates);
          markAsChanged();
        },
        delete: backMatterId => {
          deleteBackMatter(backMatterId);
          markAsChanged();
          if (currentBackMatterId === backMatterId) {
            setCurrentBackMatterId(null);
          }
        }
      },
      illustration: {
        add: illustration => {
          addIllustration(illustration);
          markAsChanged();
        },
        update: (illustrationId, updates) => {
          updateIllustration(illustrationId, updates);
          markAsChanged();
        },
        delete: illustrationId => {
          deleteIllustration(illustrationId);
          markAsChanged();
          if (currentIllustrationId === illustrationId) {
            setCurrentIllustrationId(null);
          }
        }
      }
    }),
    [
      currentChapterId,
      currentFolderId,
      currentSceneId,
      currentCharacterId,
      currentLocationId,
      currentDocumentId,
      currentFrontMatterId,
      currentBackMatterId,
      book,
      addScene,
      updateScene,
      deleteScene,
      addChapter,
      updateChapter,
      deleteChapter,
      addCharacter,
      updateCharacter,
      deleteCharacter,
      addLocation,
      updateLocation,
      deleteLocation,
      addPart,
      updatePart,
      deletePart,
      addDocument,
      updateDocument,
      deleteDocument,
      addFrontMatter,
      updateFrontMatter,
      deleteFrontMatter,
      addBackMatter,
      updateBackMatter,
      deleteBackMatter,
      addIllustration,
      updateIllustration,
      deleteIllustration,
      currentIllustrationId,
      setCurrentIllustrationId,
      markAsChanged
    ]
  );

  // Template and metadata handlers
  const handleTemplateUpdate = useCallback(
    templateUpdates => {
      updateTemplate(templateUpdates);
      markAsChanged();
    },
    [updateTemplate, markAsChanged]
  );

  const handleBookMetadataUpdate = useCallback(
    metadata => {
      updateBookMetadata(metadata);
      markAsChanged();
    },
    [updateBookMetadata, markAsChanged]
  );

  const handleGitHubSettingsUpdate = useCallback(
    settings => {
      updateGitHubSettings(settings);
      markAsChanged();
    },
    [updateGitHubSettings, markAsChanged]
  );

  // Book recovery handler
  const handleBookRecovered = useCallback(
    (filePath, bookData) => {
      recoverBook(bookData);
      loadBook(bookData, filePath);
    },
    [recoverBook, loadBook]
  );

  // New book handler
  const _handleNewBook = useCallback(() => {
    console.log('handleNewBook called, hasUnsavedChanges:', hasUnsavedChanges);
    if (
      hasUnsavedChanges &&
      !window.confirm(
        'You have unsaved changes. Are you sure you want to create a new book?'
      )
    ) {
      console.log('User cancelled new book creation');
      return;
    }
    console.log('Creating new book...');

    resetBook();
    resetUIForNewBook();
  }, [hasUnsavedChanges, resetBook, resetUIForNewBook]);

  // Get current content objects
  const currentScene = getCurrentScene(currentSceneId);
  const currentCharacter = getCurrentCharacter(currentCharacterId);
  const currentDocument = getCurrentDocument(currentDocumentId);
  const currentLocation = getCurrentLocation(currentLocationId);
  const currentFrontMatter = getCurrentFrontMatter(currentFrontMatterId);
  const currentBackMatter = getCurrentBackMatter(currentBackMatterId);
  const currentIllustration = getCurrentIllustration(currentIllustrationId);

  // Render main editor based on active tab (following Open/Closed Principle)
  const renderMainEditor = () => {
    switch (activeTab) {
      case 'manuscript':
        return currentScene ? (
          <SceneEditor
            scene={currentScene}
            template={book.template}
            onSceneUpdate={contentHandlers.scene.update}
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
        );

      case 'characters':
        return currentCharacter ? (
          <CharacterEditor
            character={currentCharacter}
            template={book.template}
            onCharacterUpdate={contentHandlers.character.update}
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
        );

      case 'threads':
        return (
          <CharacterThreadVisualization
            chapters={book.chapters}
            characters={book.characters}
            characterDetectionBlacklist={book.characterDetectionBlacklist}
            onUpdateCharacterDetectionBlacklist={blacklist => {
              // Update character detection blacklist
              setBook(prev => ({
                ...prev,
                characterDetectionBlacklist: blacklist,
                metadata: {
                  ...prev.metadata,
                  modified: new Date().toISOString()
                }
              }));
              markAsChanged();
            }}
          />
        );

      case 'locations':
        return currentLocation ? (
          <LocationEditor
            location={currentLocation}
            template={book.template}
            onLocationUpdate={contentHandlers.location.update}
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
        );

      case 'background':
        return currentDocument ? (
          <BackgroundEditor
            document={currentDocument}
            template={book.template}
            onDocumentUpdate={contentHandlers.document.update}
          />
        ) : (
          <div className="background-editor">
            <div className="no-scene">
              <h3>No Document Selected</h3>
              <p>
                Select a background document from the folders to start writing,
                or create a new document.
              </p>
            </div>
          </div>
        );

      case 'frontmatter':
        return (
          <FrontMatterEditor
            frontMatterItem={currentFrontMatter}
            onFrontMatterUpdate={contentHandlers.frontMatter.update}
            authorName={book.author}
          />
        );

      case 'backmatter':
        return (
          <BackMatterEditor
            backMatterItem={currentBackMatter}
            onBackMatterUpdate={contentHandlers.backMatter.update}
            authorName={book.author}
          />
        );

      case 'illustrations':
        return (
          <IllustrationEditor
            illustration={currentIllustration}
            onIllustrationUpdate={contentHandlers.illustration.update}
          />
        );

      default:
        return (
          <div className="scene-editor">
            <div className="no-scene">
              <h3>No Selection</h3>
              <p>Please select a tab to get started.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`app ${isSaving ? 'saving' : ''}`}>
      <header
        className={`app-header ${hasUnsavedChanges ? 'has-unsaved-changes' : ''}`}
      >
        <div className="book-info">
          <input
            type="text"
            value={book.title}
            onChange={e => handleBookMetadataUpdate({ title: e.target.value })}
            className="book-title"
            placeholder="Book Title"
            title={
              currentFilePath ? `File: ${currentFilePath}` : 'No file selected'
            }
          />
          <input
            type="text"
            value={book.author}
            onChange={e => handleBookMetadataUpdate({ author: e.target.value })}
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
          {!eventHandlerService.isElectron() && (
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
          onSceneAdd={contentHandlers.scene.add}
          onChapterAdd={contentHandlers.chapter.add}
          onPartAdd={contentHandlers.part.add}
          onSceneDelete={contentHandlers.scene.delete}
          onChapterDelete={contentHandlers.chapter.delete}
          onPartDelete={contentHandlers.part.delete}
          onSceneUpdate={contentHandlers.scene.update}
          onChapterUpdate={contentHandlers.chapter.update}
          onPartUpdate={contentHandlers.part.update}
          onReorderChapters={() => {}} // TODO: Implement reordering
          onReorderParts={() => {}} // TODO: Implement reordering
          onReorderChaptersInPart={() => {}} // TODO: Implement reordering
          onReorderScenesInChapter={() => {}} // TODO: Implement reordering
          onMoveSceneBetweenChapters={(sceneId, fromChapterId, toChapterId) => {
            moveSceneBetweenChapters(sceneId, fromChapterId, toChapterId);
            markAsChanged();
          }}
          onMoveChapterToPart={(chapterId, fromPartId, toPartId) => {
            moveChapterToPart(chapterId, fromPartId, toPartId);
            markAsChanged();
          }}
          onAddChapterToPart={(chapterId, toPartId) => {
            addChapterToPart(chapterId, toPartId);
            markAsChanged();
          }}
          onRemoveChapterFromPart={(chapterId, fromPartId) => {
            removeChapterFromPart(chapterId, fromPartId);
            markAsChanged();
          }}
          recycleBin={recycleBin}
          showRecycleBin={showRecycleBin}
          onToggleRecycleBin={() => setShowRecycleBin(!showRecycleBin)}
          onRestoreFromRecycleBin={() => {}} // TODO: Implement restore
          onPermanentlyDelete={() => {}} // TODO: Implement permanent delete
          onEmptyRecycleBin={() => setRecycleBin([])}
          characters={book.characters}
          currentCharacterId={currentCharacterId}
          onCharacterSelect={setCurrentCharacterId}
          onCharacterAdd={contentHandlers.character.add}
          onCharacterDelete={contentHandlers.character.delete}
          onCharacterUpdate={contentHandlers.character.update}
          characterRecycleBin={characterRecycleBin}
          onRestoreCharacterFromRecycleBin={() => {}} // TODO: Implement restore
          onPermanentlyDeleteCharacter={() => {}} // TODO: Implement permanent delete
          characterDetectionBlacklist={book.characterDetectionBlacklist}
          onUpdateCharacterDetectionBlacklist={blacklist => {
            setBook(prev => ({
              ...prev,
              characterDetectionBlacklist: blacklist,
              metadata: { ...prev.metadata, modified: new Date().toISOString() }
            }));
            markAsChanged();
          }}
          backgroundFolders={book.backgroundFolders}
          currentDocumentId={currentDocumentId}
          currentFolderId={currentFolderId}
          onDocumentSelect={setCurrentDocumentId}
          onFolderSelect={setCurrentFolderId}
          onDocumentAdd={contentHandlers.document.add}
          onFolderAdd={addBackgroundFolder}
          onDocumentDelete={contentHandlers.document.delete}
          onDocumentUpdate={contentHandlers.document.update}
          onFolderDelete={deleteBackgroundFolder}
          onFolderUpdate={updateBackgroundFolder}
          onReorderFolders={() => {}}
          onReorderDocumentsInFolder={() => {}}
          onMoveDocumentBetweenFolders={() => {}}
          backgroundRecycleBin={backgroundRecycleBin}
          onRestoreBackgroundFromRecycleBin={() => {}} // TODO: Implement restore
          onPermanentlyDeleteBackground={() => {}} // TODO: Implement permanent delete
          locations={book.locations}
          currentLocationId={currentLocationId}
          onLocationSelect={setCurrentLocationId}
          onLocationAdd={contentHandlers.location.add}
          onLocationDelete={contentHandlers.location.delete}
          onLocationUpdate={contentHandlers.location.update}
          locationRecycleBin={locationRecycleBin}
          onRestoreLocationFromRecycleBin={() => {}} // TODO: Implement restore
          onPermanentlyDeleteLocation={() => {}} // TODO: Implement permanent delete
          frontMatter={book.frontMatter}
          currentFrontMatterId={currentFrontMatterId}
          onFrontMatterSelect={setCurrentFrontMatterId}
          onFrontMatterAdd={contentHandlers.frontMatter.add}
          onFrontMatterDelete={contentHandlers.frontMatter.delete}
          onFrontMatterUpdate={contentHandlers.frontMatter.update}
          onFrontMatterToggle={() => {}} // TODO: Implement toggle
          onFrontMatterReorder={() => {}} // TODO: Implement reorder
          backMatter={book.backMatter || []}
          currentBackMatterId={currentBackMatterId}
          onBackMatterSelect={setCurrentBackMatterId}
          onBackMatterAdd={contentHandlers.backMatter.add}
          onBackMatterDelete={contentHandlers.backMatter.delete}
          onBackMatterUpdate={contentHandlers.backMatter.update}
          onBackMatterToggle={() => {}} // TODO: Implement toggle
          onBackMatterReorder={() => {}} // TODO: Implement reorder
          illustrations={book.illustrations || []}
          currentIllustrationId={currentIllustrationId}
          onIllustrationSelect={setCurrentIllustrationId}
          onIllustrationAdd={contentHandlers.illustration.add}
          onIllustrationDelete={contentHandlers.illustration.delete}
          onIllustrationUpdate={contentHandlers.illustration.update}
          authorName={book.author}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <div className="main-content-area">{renderMainEditor()}</div>
      </div>

      {showTemplateManager && (
        <TemplateManager
          template={book.template}
          onTemplateUpdate={handleTemplateUpdate}
          onClose={() => setShowTemplateManager(false)}
        />
      )}

      {showSpellCheckSettings && (
        <SpellCheckSettings onClose={() => setShowSpellCheckSettings(false)} />
      )}

      {showFontSettings && (
        <FontSettings onClose={() => setShowFontSettings(false)} />
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
          currentRepo={book.github?.repository || null}
          onGitHubSettingsUpdate={handleGitHubSettingsUpdate}
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
