import { useState, useCallback } from 'react';

/**
 * Custom hook for UI state management
 * Centralizes modal and dialog state management
 */
export function useUIState() {
  // Modal states
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showGitHubIntegration, setShowGitHubIntegration] = useState(false);
  const [showBackupRecovery, setShowBackupRecovery] = useState(false);
  const [showFontPreview, setShowFontPreview] = useState(false);

  // Current selection states
  const [currentSceneId, setCurrentSceneId] = useState(null);
  const [currentChapterId, setCurrentChapterId] = useState(null);
  const [currentPartId, setCurrentPartId] = useState(null);
  const [currentCharacterId, setCurrentCharacterId] = useState(null);
  const [currentLocationId, setCurrentLocationId] = useState(null);
  const [currentDocumentId, setCurrentDocumentId] = useState(null);
  const [currentFolderId, setCurrentFolderId] = useState('default-bg');
  const [currentFrontMatterId, setCurrentFrontMatterId] = useState(null);
  const [activeTab, setActiveTab] = useState('manuscript');

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
    setShowFontPreview(false);
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
    activeTab,
    setActiveTab,

    // Modal toggle functions
    toggleTemplateManager,
    toggleExportDialog,
    toggleGitHubIntegration,
    toggleBackupRecovery,
    toggleFontPreview,
    closeAllModals
  };
}
