import { useState, useCallback } from 'react';

/**
 * Custom hook for UI state management
 * Centralizes modal and dialog state management, selections, and file state
 */
export function useUIState() {
  // Modal states
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showGitHubIntegration, setShowGitHubIntegration] = useState(false);
  const [showBackupRecovery, setShowBackupRecovery] = useState(false);
  const [showSpellCheckSettings, setShowSpellCheckSettings] = useState(false);
  const [showFontSettings, setShowFontSettings] = useState(false);
  const [showFontPreview, setShowFontPreview] = useState(false);

  // Current selection states
  const [currentSceneId, setCurrentSceneId] = useState(null);
  const [currentChapterId, setCurrentChapterId] = useState('default');
  const [currentPartId, setCurrentPartId] = useState(null);
  const [currentCharacterId, setCurrentCharacterId] = useState(null);
  const [currentLocationId, setCurrentLocationId] = useState(null);
  const [currentDocumentId, setCurrentDocumentId] = useState(null);
  const [currentFolderId, setCurrentFolderId] = useState('default-bg');
  const [currentFrontMatterId, setCurrentFrontMatterId] = useState(null);
  const [currentBackMatterId, setCurrentBackMatterId] = useState(null);
  const [activeTab, setActiveTab] = useState('manuscript');

  // Recycle bin state
  const [recycleBin, setRecycleBin] = useState([]);
  const [showRecycleBin, setShowRecycleBin] = useState(false);
  const [characterRecycleBin, setCharacterRecycleBin] = useState([]);
  const [locationRecycleBin, setLocationRecycleBin] = useState([]);
  const [backgroundRecycleBin, setBackgroundRecycleBin] = useState([]);

  // File and save state
  const [currentFilePath, setCurrentFilePath] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentOperation, setCurrentOperation] = useState(null);

  // User interaction tracking
  const [userHasInteracted, setUserHasInteracted] = useState(false);

  // Modal toggle functions
  const toggleTemplateManager = useCallback(() => {
    setShowTemplateManager(prev => !prev);
  }, []);

  const toggleExportDialog = useCallback(() => {
    setShowExportDialog(prev => !prev);
  }, []);

  const toggleGitHubIntegration = useCallback(() => {
    setShowGitHubIntegration(prev => !prev);
  }, []);

  const toggleBackupRecovery = useCallback(() => {
    setShowBackupRecovery(prev => !prev);
  }, []);

  const toggleFontPreview = useCallback(() => {
    setShowFontPreview(prev => !prev);
  }, []);

  // Close all modals
  const closeAllModals = useCallback(() => {
    setShowTemplateManager(false);
    setShowExportDialog(false);
    setShowGitHubIntegration(false);
    setShowBackupRecovery(false);
    setShowFontSettings(false);
    setShowFontPreview(false);
  }, []);

  // Helper functions
  const markAsChanged = useCallback(() => {
    if (isSaving) {
      return; // Ignore changes during save operation
    }
    // Mark document as having unsaved changes
    setHasUnsavedChanges(true);
  }, [isSaving]);

  // Auto-selection logic
  const autoSelectFirstScene = useCallback(
    book => {
      if (activeTab === 'manuscript' && !currentSceneId && book?.chapters) {
        const firstChapterWithScenes = book.chapters.find(
          ch => ch.scenes && ch.scenes.length > 0
        );
        if (
          firstChapterWithScenes &&
          firstChapterWithScenes.scenes.length > 0
        ) {
          setCurrentChapterId(firstChapterWithScenes.id);
          setCurrentSceneId(firstChapterWithScenes.scenes[0].id);
        }
      }
    },
    [activeTab, currentSceneId]
  );

  const autoSelectFirstCharacter = useCallback(
    book => {
      if (
        activeTab === 'characters' &&
        !currentCharacterId &&
        book?.characters &&
        book.characters.length > 0
      ) {
        setCurrentCharacterId(book.characters[0].id);
      }
    },
    [activeTab, currentCharacterId]
  );

  const autoSelectFirstLocation = useCallback(
    book => {
      if (
        activeTab === 'locations' &&
        !currentLocationId &&
        book?.locations &&
        book.locations.length > 0
      ) {
        setCurrentLocationId(book.locations[0].id);
      }
    },
    [activeTab, currentLocationId]
  );

  const autoSelectFirstDocument = useCallback(
    book => {
      if (
        activeTab === 'background' &&
        !currentDocumentId &&
        book?.backgroundFolders &&
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
    },
    [activeTab, currentDocumentId]
  );

  const autoSelectFirstFrontMatter = useCallback(
    book => {
      if (
        activeTab === 'frontmatter' &&
        !currentFrontMatterId &&
        book?.frontMatter &&
        book.frontMatter.length > 0
      ) {
        setCurrentFrontMatterId(book.frontMatter[0].id);
      }
    },
    [activeTab, currentFrontMatterId]
  );

  const autoSelectFirstBackMatter = useCallback(
    book => {
      if (
        activeTab === 'backmatter' &&
        !currentBackMatterId &&
        book?.backMatter &&
        book.backMatter.length > 0
      ) {
        setCurrentBackMatterId(book.backMatter[0].id);
      }
    },
    [activeTab, currentBackMatterId]
  );

  // Reset UI state for new book
  const resetUIForNewBook = useCallback(() => {
    setCurrentSceneId(null);
    setCurrentChapterId('default');
    setCurrentPartId(null);
    setCurrentCharacterId(null);
    setCurrentLocationId(null);
    setCurrentDocumentId(null);
    setCurrentFolderId('default-bg');
    setCurrentFrontMatterId(null);
    setCurrentBackMatterId(null);
    setCurrentFilePath(null);
    setHasUnsavedChanges(false);
    setActiveTab('manuscript');
  }, []);

  // Load book state
  const loadBook = useCallback((bookData, filePath = null) => {
    if (!bookData || typeof bookData !== 'object') {
      return; // Gracefully handle invalid data
    }

    setCurrentChapterId(bookData.chapters?.[0]?.id || 'default');
    setCurrentSceneId(bookData.chapters?.[0]?.scenes?.[0]?.id || null);
    setCurrentPartId(bookData.parts?.length > 0 ? bookData.parts[0]?.id : null);
    setCurrentCharacterId(null);
    setCurrentLocationId(null);
    setCurrentDocumentId(null);
    setCurrentFolderId(bookData.backgroundFolders?.[0]?.id || 'default-bg');
    setCurrentFrontMatterId(null);
    setCurrentBackMatterId(null);
    setCurrentFilePath(filePath);
    setHasUnsavedChanges(false);
  }, []);

  return {
    // Modal states
    showTemplateManager,
    setShowTemplateManager,
    showExportDialog,
    setShowExportDialog,
    showGitHubIntegration,
    setShowGitHubIntegration,
    showBackupRecovery,
    setShowBackupRecovery,
    showSpellCheckSettings,
    setShowSpellCheckSettings,
    showFontSettings,
    setShowFontSettings,
    showFontPreview,
    setShowFontPreview,

    // Selection states
    currentSceneId,
    setCurrentSceneId,
    currentChapterId,
    setCurrentChapterId,
    currentPartId,
    setCurrentPartId,
    currentCharacterId,
    setCurrentCharacterId,
    currentLocationId,
    setCurrentLocationId,
    currentDocumentId,
    setCurrentDocumentId,
    currentFolderId,
    setCurrentFolderId,
    currentFrontMatterId,
    setCurrentFrontMatterId,
    currentBackMatterId,
    setCurrentBackMatterId,
    activeTab,
    setActiveTab,

    // Recycle bin state
    recycleBin,
    showRecycleBin,
    characterRecycleBin,
    locationRecycleBin,
    backgroundRecycleBin,
    setRecycleBin,
    setShowRecycleBin,
    setCharacterRecycleBin,
    setLocationRecycleBin,
    setBackgroundRecycleBin,

    // File and save state
    currentFilePath,
    hasUnsavedChanges,
    isSaving,
    currentOperation,
    setCurrentFilePath,
    setHasUnsavedChanges,
    setIsSaving,
    setCurrentOperation,

    // User interaction
    userHasInteracted,
    setUserHasInteracted,

    // Operations
    markAsChanged,

    // Auto-selection functions
    autoSelectFirstScene,
    autoSelectFirstCharacter,
    autoSelectFirstLocation,
    autoSelectFirstDocument,
    autoSelectFirstFrontMatter,
    autoSelectFirstBackMatter,

    // State management
    resetUIForNewBook,
    loadBook,

    // Modal toggle functions
    toggleTemplateManager,
    toggleExportDialog,
    toggleGitHubIntegration,
    toggleBackupRecovery,
    toggleFontPreview,
    closeAllModals
  };
}
