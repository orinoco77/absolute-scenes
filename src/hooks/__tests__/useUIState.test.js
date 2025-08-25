/**
 * Tests for useUIState hook
 * Critical UI state management - comprehensive testing required
 */

import { renderHook, act } from '@testing-library/react';
import { useUIState } from '../useUIState';

describe('useUIState', () => {
  let result;

  const renderUseUIState = () => {
    return renderHook(() => useUIState());
  };

  beforeEach(() => {
    result = renderUseUIState().result;
  });

  describe('Initial State', () => {
    it('initializes modal states as closed', () => {
      expect(result.current.showTemplateManager).toBe(false);
      expect(result.current.showExportDialog).toBe(false);
      expect(result.current.showGitHubIntegration).toBe(false);
      expect(result.current.showBackupRecovery).toBe(false);
      expect(result.current.showFontPreview).toBe(false);
    });

    it('initializes selection states with defaults', () => {
      expect(result.current.currentSceneId).toBeNull();
      expect(result.current.currentChapterId).toBe('default');
      expect(result.current.currentPartId).toBeNull();
      expect(result.current.currentCharacterId).toBeNull();
      expect(result.current.currentLocationId).toBeNull();
      expect(result.current.currentDocumentId).toBeNull();
      expect(result.current.currentFolderId).toBe('default-bg');
      expect(result.current.currentFrontMatterId).toBeNull();
      expect(result.current.currentBackMatterId).toBeNull();
      expect(result.current.activeTab).toBe('manuscript');
    });

    it('initializes recycle bin states as empty', () => {
      expect(result.current.recycleBin).toEqual([]);
      expect(result.current.showRecycleBin).toBe(false);
      expect(result.current.characterRecycleBin).toEqual([]);
      expect(result.current.locationRecycleBin).toEqual([]);
      expect(result.current.backgroundRecycleBin).toEqual([]);
    });

    it('initializes file and save states', () => {
      expect(result.current.currentFilePath).toBeNull();
      expect(result.current.hasUnsavedChanges).toBe(false);
      expect(result.current.isSaving).toBe(false);
      expect(result.current.currentOperation).toBeNull();
      expect(result.current.userHasInteracted).toBe(false);
    });
  });

  describe('Modal Toggle Functions', () => {
    it('toggles template manager modal', () => {
      act(() => {
        result.current.toggleTemplateManager();
      });
      expect(result.current.showTemplateManager).toBe(true);

      act(() => {
        result.current.toggleTemplateManager();
      });
      expect(result.current.showTemplateManager).toBe(false);
    });

    it('toggles export dialog modal', () => {
      act(() => {
        result.current.toggleExportDialog();
      });
      expect(result.current.showExportDialog).toBe(true);

      act(() => {
        result.current.toggleExportDialog();
      });
      expect(result.current.showExportDialog).toBe(false);
    });

    it('toggles GitHub integration modal', () => {
      act(() => {
        result.current.toggleGitHubIntegration();
      });
      expect(result.current.showGitHubIntegration).toBe(true);

      act(() => {
        result.current.toggleGitHubIntegration();
      });
      expect(result.current.showGitHubIntegration).toBe(false);
    });

    it('toggles backup recovery modal', () => {
      act(() => {
        result.current.toggleBackupRecovery();
      });
      expect(result.current.showBackupRecovery).toBe(true);

      act(() => {
        result.current.toggleBackupRecovery();
      });
      expect(result.current.showBackupRecovery).toBe(false);
    });

    it('toggles font preview modal', () => {
      act(() => {
        result.current.toggleFontPreview();
      });
      expect(result.current.showFontPreview).toBe(true);

      act(() => {
        result.current.toggleFontPreview();
      });
      expect(result.current.showFontPreview).toBe(false);
    });

    it('closes all modals at once', () => {
      // Open all modals first
      act(() => {
        result.current.toggleTemplateManager();
        result.current.toggleExportDialog();
        result.current.toggleGitHubIntegration();
        result.current.toggleBackupRecovery();
        result.current.toggleFontPreview();
      });

      // Verify all are open
      expect(result.current.showTemplateManager).toBe(true);
      expect(result.current.showExportDialog).toBe(true);
      expect(result.current.showGitHubIntegration).toBe(true);
      expect(result.current.showBackupRecovery).toBe(true);
      expect(result.current.showFontPreview).toBe(true);

      // Close all
      act(() => {
        result.current.closeAllModals();
      });

      // Verify all are closed
      expect(result.current.showTemplateManager).toBe(false);
      expect(result.current.showExportDialog).toBe(false);
      expect(result.current.showGitHubIntegration).toBe(false);
      expect(result.current.showBackupRecovery).toBe(false);
      expect(result.current.showFontPreview).toBe(false);
    });
  });

  describe('State Setters', () => {
    it('updates selection states via setters', () => {
      act(() => {
        result.current.setCurrentSceneId('scene-123');
        result.current.setCurrentChapterId('chapter-456');
        result.current.setCurrentPartId('part-789');
        result.current.setActiveTab('characters');
      });

      expect(result.current.currentSceneId).toBe('scene-123');
      expect(result.current.currentChapterId).toBe('chapter-456');
      expect(result.current.currentPartId).toBe('part-789');
      expect(result.current.activeTab).toBe('characters');
    });

    it('updates file and save states via setters', () => {
      act(() => {
        result.current.setCurrentFilePath('/test/book.book');
        result.current.setHasUnsavedChanges(true);
        result.current.setIsSaving(true);
        result.current.setCurrentOperation('saving');
        result.current.setUserHasInteracted(true);
      });

      expect(result.current.currentFilePath).toBe('/test/book.book');
      expect(result.current.hasUnsavedChanges).toBe(true);
      expect(result.current.isSaving).toBe(true);
      expect(result.current.currentOperation).toBe('saving');
      expect(result.current.userHasInteracted).toBe(true);
    });

    it('updates recycle bin states via setters', () => {
      const mockRecycleBin = [{ id: 'deleted-scene', title: 'Deleted Scene' }];
      const mockCharacterBin = [{ id: 'deleted-char', name: 'Deleted Character' }];

      act(() => {
        result.current.setRecycleBin(mockRecycleBin);
        result.current.setShowRecycleBin(true);
        result.current.setCharacterRecycleBin(mockCharacterBin);
      });

      expect(result.current.recycleBin).toEqual(mockRecycleBin);
      expect(result.current.showRecycleBin).toBe(true);
      expect(result.current.characterRecycleBin).toEqual(mockCharacterBin);
    });
  });

  describe('markAsChanged Function', () => {
    it('marks document as changed when not saving', () => {
      act(() => {
        result.current.markAsChanged();
      });

      expect(result.current.hasUnsavedChanges).toBe(true);
    });

    it('ignores changes during save operation', () => {
      act(() => {
        result.current.setIsSaving(true);
        result.current.setHasUnsavedChanges(false);
      });

      act(() => {
        result.current.markAsChanged();
      });

      // Should remain false because isSaving is true
      expect(result.current.hasUnsavedChanges).toBe(false);
    });

    it('marks changes after save operation completes', () => {
      // Set saving state
      act(() => {
        result.current.setIsSaving(true);
        result.current.setHasUnsavedChanges(false);
      });

      // Try to mark as changed (should be ignored)
      act(() => {
        result.current.markAsChanged();
      });
      expect(result.current.hasUnsavedChanges).toBe(false);

      // Complete save operation
      act(() => {
        result.current.setIsSaving(false);
      });

      // Now changes should be tracked
      act(() => {
        result.current.markAsChanged();
      });
      expect(result.current.hasUnsavedChanges).toBe(true);
    });
  });

  describe('Auto-Selection Functions', () => {
    const mockBook = {
      chapters: [
        {
          id: 'ch1',
          title: 'Chapter 1',
          scenes: [
            { id: 'sc1', title: 'Scene 1' },
            { id: 'sc2', title: 'Scene 2' }
          ]
        },
        {
          id: 'ch2',
          title: 'Chapter 2',
          scenes: []
        }
      ],
      characters: [
        { id: 'char1', name: 'Character 1' },
        { id: 'char2', name: 'Character 2' }
      ],
      locations: [
        { id: 'loc1', name: 'Location 1' },
        { id: 'loc2', name: 'Location 2' }
      ],
      backgroundFolders: [
        {
          id: 'bg1',
          title: 'Research',
          documents: [
            { id: 'doc1', title: 'Document 1' }
          ]
        }
      ],
      frontMatter: [
        { id: 'fm1', title: 'Preface' }
      ],
      backMatter: [
        { id: 'bm1', title: 'Epilogue' }
      ]
    };

    describe('autoSelectFirstScene', () => {
      it('selects first scene when on manuscript tab with no selection', () => {
        act(() => {
          result.current.setActiveTab('manuscript');
          result.current.setCurrentSceneId(null);
        });

        act(() => {
          result.current.autoSelectFirstScene(mockBook);
        });

        expect(result.current.currentChapterId).toBe('ch1');
        expect(result.current.currentSceneId).toBe('sc1');
      });

      it('does not auto-select when scene is already selected', () => {
        act(() => {
          result.current.setActiveTab('manuscript');
          result.current.setCurrentSceneId('existing-scene');
          result.current.setCurrentChapterId('existing-chapter');
        });

        act(() => {
          result.current.autoSelectFirstScene(mockBook);
        });

        expect(result.current.currentChapterId).toBe('existing-chapter');
        expect(result.current.currentSceneId).toBe('existing-scene');
      });

      it('does not auto-select when not on manuscript tab', () => {
        act(() => {
          result.current.setActiveTab('characters');
          result.current.setCurrentSceneId(null);
        });

        act(() => {
          result.current.autoSelectFirstScene(mockBook);
        });

        expect(result.current.currentSceneId).toBeNull();
      });

      it('handles book with no scenes gracefully', () => {
        const emptyBook = { chapters: [{ id: 'ch1', scenes: [] }] };

        act(() => {
          result.current.setActiveTab('manuscript');
          result.current.setCurrentSceneId(null);
        });

        act(() => {
          result.current.autoSelectFirstScene(emptyBook);
        });

        expect(result.current.currentSceneId).toBeNull();
      });
    });

    describe('autoSelectFirstCharacter', () => {
      it('selects first character when on characters tab with no selection', () => {
        act(() => {
          result.current.setActiveTab('characters');
          result.current.setCurrentCharacterId(null);
        });

        act(() => {
          result.current.autoSelectFirstCharacter(mockBook);
        });

        expect(result.current.currentCharacterId).toBe('char1');
      });

      it('does not auto-select when character is already selected', () => {
        act(() => {
          result.current.setActiveTab('characters');
          result.current.setCurrentCharacterId('existing-char');
        });

        act(() => {
          result.current.autoSelectFirstCharacter(mockBook);
        });

        expect(result.current.currentCharacterId).toBe('existing-char');
      });

      it('does not auto-select when not on characters tab', () => {
        act(() => {
          result.current.setActiveTab('manuscript');
          result.current.setCurrentCharacterId(null);
        });

        act(() => {
          result.current.autoSelectFirstCharacter(mockBook);
        });

        expect(result.current.currentCharacterId).toBeNull();
      });
    });

    describe('autoSelectFirstLocation', () => {
      it('selects first location when on locations tab with no selection', () => {
        act(() => {
          result.current.setActiveTab('locations');
          result.current.setCurrentLocationId(null);
        });

        act(() => {
          result.current.autoSelectFirstLocation(mockBook);
        });

        expect(result.current.currentLocationId).toBe('loc1');
      });

      it('does not auto-select when not on locations tab', () => {
        act(() => {
          result.current.setActiveTab('manuscript');
          result.current.setCurrentLocationId(null);
        });

        act(() => {
          result.current.autoSelectFirstLocation(mockBook);
        });

        expect(result.current.currentLocationId).toBeNull();
      });
    });

    describe('autoSelectFirstDocument', () => {
      it('selects first document when on background tab with no selection', () => {
        act(() => {
          result.current.setActiveTab('background');
          result.current.setCurrentDocumentId(null);
        });

        act(() => {
          result.current.autoSelectFirstDocument(mockBook);
        });

        expect(result.current.currentFolderId).toBe('bg1');
        expect(result.current.currentDocumentId).toBe('doc1');
      });

      it('does not auto-select when not on background tab', () => {
        act(() => {
          result.current.setActiveTab('manuscript');
          result.current.setCurrentDocumentId(null);
        });

        act(() => {
          result.current.autoSelectFirstDocument(mockBook);
        });

        expect(result.current.currentDocumentId).toBeNull();
      });
    });

    describe('autoSelectFirstFrontMatter', () => {
      it('selects first front matter when on frontmatter tab with no selection', () => {
        act(() => {
          result.current.setActiveTab('frontmatter');
          result.current.setCurrentFrontMatterId(null);
        });

        act(() => {
          result.current.autoSelectFirstFrontMatter(mockBook);
        });

        expect(result.current.currentFrontMatterId).toBe('fm1');
      });

      it('does not auto-select when not on frontmatter tab', () => {
        act(() => {
          result.current.setActiveTab('manuscript');
          result.current.setCurrentFrontMatterId(null);
        });

        act(() => {
          result.current.autoSelectFirstFrontMatter(mockBook);
        });

        expect(result.current.currentFrontMatterId).toBeNull();
      });
    });

    describe('autoSelectFirstBackMatter', () => {
      it('selects first back matter when on backmatter tab with no selection', () => {
        act(() => {
          result.current.setActiveTab('backmatter');
          result.current.setCurrentBackMatterId(null);
        });

        act(() => {
          result.current.autoSelectFirstBackMatter(mockBook);
        });

        expect(result.current.currentBackMatterId).toBe('bm1');
      });

      it('does not auto-select when not on backmatter tab', () => {
        act(() => {
          result.current.setActiveTab('manuscript');
          result.current.setCurrentBackMatterId(null);
        });

        act(() => {
          result.current.autoSelectFirstBackMatter(mockBook);
        });

        expect(result.current.currentBackMatterId).toBeNull();
      });
    });
  });

  describe('State Management Functions', () => {
    describe('resetUIForNewBook', () => {
      it('resets all UI state to defaults', () => {
        // Set some non-default states first
        act(() => {
          result.current.setCurrentSceneId('some-scene');
          result.current.setCurrentChapterId('some-chapter');
          result.current.setCurrentCharacterId('some-character');
          result.current.setActiveTab('characters');
          result.current.setCurrentFilePath('/some/file.book');
          result.current.setHasUnsavedChanges(true);
        });

        // Reset for new book
        act(() => {
          result.current.resetUIForNewBook();
        });

        // Verify reset to defaults
        expect(result.current.currentSceneId).toBeNull();
        expect(result.current.currentChapterId).toBe('default');
        expect(result.current.currentPartId).toBeNull();
        expect(result.current.currentCharacterId).toBeNull();
        expect(result.current.currentLocationId).toBeNull();
        expect(result.current.currentDocumentId).toBeNull();
        expect(result.current.currentFolderId).toBe('default-bg');
        expect(result.current.currentFrontMatterId).toBeNull();
        expect(result.current.currentBackMatterId).toBeNull();
        expect(result.current.currentFilePath).toBeNull();
        expect(result.current.hasUnsavedChanges).toBe(false);
        expect(result.current.activeTab).toBe('manuscript');
      });

      it('maintains modal states after reset', () => {
        // Open some modals
        act(() => {
          result.current.toggleTemplateManager();
          result.current.toggleExportDialog();
        });

        // Reset for new book
        act(() => {
          result.current.resetUIForNewBook();
        });

        // Modals should remain open (user might want to keep them open)
        expect(result.current.showTemplateManager).toBe(true);
        expect(result.current.showExportDialog).toBe(true);
      });
    });

    describe('loadBook', () => {
      const mockLoadBook = {
        chapters: [
          {
            id: 'loaded-ch1',
            title: 'Loaded Chapter 1',
            scenes: [
              { id: 'loaded-sc1', title: 'Loaded Scene 1' }
            ]
          }
        ],
        parts: [
          { id: 'loaded-part1', title: 'Loaded Part 1' }
        ],
        backgroundFolders: [
          { id: 'loaded-bg1', title: 'Loaded Background' }
        ]
      };

      it('loads book state with file path', () => {
        const filePath = '/loaded/book.book';

        act(() => {
          result.current.loadBook(mockLoadBook, filePath);
        });

        expect(result.current.currentChapterId).toBe('loaded-ch1');
        expect(result.current.currentSceneId).toBe('loaded-sc1');
        expect(result.current.currentPartId).toBe('loaded-part1');
        expect(result.current.currentFolderId).toBe('loaded-bg1');
        expect(result.current.currentFilePath).toBe(filePath);
        expect(result.current.hasUnsavedChanges).toBe(false);

        // Selection IDs should be reset
        expect(result.current.currentCharacterId).toBeNull();
        expect(result.current.currentLocationId).toBeNull();
        expect(result.current.currentDocumentId).toBeNull();
        expect(result.current.currentFrontMatterId).toBeNull();
        expect(result.current.currentBackMatterId).toBeNull();
      });

      it('loads book state without file path', () => {
        act(() => {
          result.current.loadBook(mockLoadBook);
        });

        expect(result.current.currentChapterId).toBe('loaded-ch1');
        expect(result.current.currentSceneId).toBe('loaded-sc1');
        expect(result.current.currentFilePath).toBeNull();
      });

      it('handles book with no chapters', () => {
        const emptyBook = { chapters: [] };

        act(() => {
          result.current.loadBook(emptyBook);
        });

        expect(result.current.currentChapterId).toBe('default');
        expect(result.current.currentSceneId).toBeNull();
      });

      it('handles book with no parts', () => {
        const bookNoParts = { 
          chapters: [{ id: 'ch1', scenes: [] }]
          // no parts property
        };

        act(() => {
          result.current.loadBook(bookNoParts);
        });

        expect(result.current.currentPartId).toBeNull();
      });

      it('handles book with empty background folders', () => {
        const bookNoBackground = { 
          chapters: [{ id: 'ch1', scenes: [] }]
          // no backgroundFolders property
        };

        act(() => {
          result.current.loadBook(bookNoBackground);
        });

        expect(result.current.currentFolderId).toBe('default-bg');
      });
    });
  });

  describe('Hook Stability', () => {
    it('returns stable functions across re-renders', () => {
      const { result, rerender } = renderUseUIState();
      
      // Store references to functions from first render
      const firstRenderFunctions = {
        toggleTemplateManager: result.current.toggleTemplateManager,
        markAsChanged: result.current.markAsChanged,
        autoSelectFirstScene: result.current.autoSelectFirstScene,
        resetUIForNewBook: result.current.resetUIForNewBook,
        loadBook: result.current.loadBook,
        closeAllModals: result.current.closeAllModals
      };

      // Re-render the same hook instance
      rerender();

      // Functions should be stable (memoized with useCallback)
      expect(result.current.toggleTemplateManager).toBe(firstRenderFunctions.toggleTemplateManager);
      expect(result.current.markAsChanged).toBe(firstRenderFunctions.markAsChanged);
      expect(result.current.autoSelectFirstScene).toBe(firstRenderFunctions.autoSelectFirstScene);
      expect(result.current.resetUIForNewBook).toBe(firstRenderFunctions.resetUIForNewBook);
      expect(result.current.loadBook).toBe(firstRenderFunctions.loadBook);
      expect(result.current.closeAllModals).toBe(firstRenderFunctions.closeAllModals);
    });

    it('updates dependent functions when dependencies change', () => {
      // Test that useCallback dependencies work correctly
      act(() => {
        result.current.setActiveTab('characters');
        result.current.setCurrentSceneId('test-scene');
      });

      const mockBook = {
        chapters: [{ id: 'ch1', scenes: [{ id: 'sc1' }] }]
      };

      // Should not auto-select because currentSceneId is set
      act(() => {
        result.current.autoSelectFirstScene(mockBook);
      });

      expect(result.current.currentSceneId).toBe('test-scene');

      // Clear current scene
      act(() => {
        result.current.setCurrentSceneId(null);
        result.current.setActiveTab('manuscript');
      });

      // Now should auto-select
      act(() => {
        result.current.autoSelectFirstScene(mockBook);
      });

      expect(result.current.currentSceneId).toBe('sc1');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles null/undefined book data in auto-selection', () => {
      act(() => {
        result.current.setActiveTab('manuscript');
      });

      expect(() => {
        act(() => {
          result.current.autoSelectFirstScene(null);
          result.current.autoSelectFirstScene(undefined);
          result.current.autoSelectFirstScene({});
        });
      }).not.toThrow();
    });

    it('handles malformed book data', () => {
      const malformedBook = {
        chapters: null,
        characters: 'not-an-array',
        locations: undefined
      };

      expect(() => {
        act(() => {
          result.current.autoSelectFirstScene(malformedBook);
          result.current.autoSelectFirstCharacter(malformedBook);
          result.current.autoSelectFirstLocation(malformedBook);
          result.current.loadBook(malformedBook);
          result.current.loadBook(null);
          result.current.loadBook(undefined);
        });
      }).not.toThrow();
    });

    it('preserves state integrity during rapid updates', () => {
      // Simulate rapid state updates
      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.setCurrentSceneId(`scene-${i}`);
          result.current.toggleTemplateManager();
          result.current.markAsChanged();
        }
      });

      // Final state should be predictable
      expect(result.current.currentSceneId).toBe('scene-99');
      expect(result.current.hasUnsavedChanges).toBe(true);
    });
  });
});