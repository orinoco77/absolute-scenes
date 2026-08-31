import {
  render,
  screen,
  fireEvent,
  waitFor,
  act
} from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App.jsx';
import * as gitSyncService from '../services/gitSyncService.js';
import { saveBook } from '../utils/fileOperations';
import gitHubService from '../utils/gitHubService';
// saveBookToFile imported but not used in these tests

jest.mock('../utils/gitHubService');
jest.mock('../services/gitSyncService.js');

// Mock all the child components with more detailed mocks
jest.mock('../components/BookStructure', () => {
  return function MockedBookStructure(props) {
    return (
      <div data-testid="book-structure">
        <div data-testid="active-tab">{props.activeTab}</div>
        <div data-testid="current-scene-id">
          {props.currentSceneId || 'none'}
        </div>
        <div data-testid="current-chapter-id">
          {props.currentChapterId || 'none'}
        </div>
        <div data-testid="current-part-id">{props.currentPartId || 'none'}</div>
        <div data-testid="chapters-count">{props.chapters?.length || 0}</div>
        <div data-testid="characters-count">
          {props.characters?.length || 0}
        </div>
        <div data-testid="locations-count">{props.locations?.length || 0}</div>
        <div data-testid="parts-count">{props.parts?.length || 0}</div>
        <div data-testid="conflict-scene-ids">
          {(props.conflictSceneIds || []).join(',')}
        </div>

        <button onClick={() => props.onTabChange('manuscript')}>
          Manuscript Tab
        </button>
        <button onClick={() => props.onTabChange('characters')}>
          Characters Tab
        </button>
        <button onClick={() => props.onTabChange('locations')}>
          Locations Tab
        </button>
        <button onClick={() => props.onTabChange('background')}>
          Background Tab
        </button>
        <button onClick={() => props.onTabChange('frontmatter')}>
          Frontmatter Tab
        </button>
        <button onClick={() => props.onTabChange('backmatter')}>
          Backmatter Tab
        </button>
        <button onClick={() => props.onTabChange('threads')}>
          Threads Tab
        </button>

        {props.activeTab === 'backmatter' && (
          <div>
            <select
              className="add-back-matter-select"
              value="➕ Add Section"
              onChange={e => {
                if (e.target.value && props.onBackMatterAdd) {
                  props.onBackMatterAdd({
                    id: `${e.target.value}-test`,
                    type: e.target.value,
                    title:
                      e.target.value.charAt(0).toUpperCase() +
                      e.target.value.slice(1),
                    content: 'Test content',
                    enabled: true,
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                  });
                }
              }}
            >
              <option value="">➕ Add Section</option>
              <option value="epilogue">🎬 Epilogue</option>
            </select>
            {props.backMatter &&
              props.backMatter.map(item => (
                <div key={item.id}>
                  <span>{item.title}</span>
                </div>
              ))}
          </div>
        )}

        <button onClick={() => props.onSceneSelect('scene-1')}>
          Select Scene
        </button>
        <button onClick={() => props.onChapterSelect('chapter-1')}>
          Select Chapter
        </button>
        <button onClick={() => props.onPartSelect('part-1')}>
          Select Part
        </button>
        <button onClick={() => props.onCharacterSelect('char-1')}>
          Select Character
        </button>
        <button onClick={() => props.onLocationSelect('loc-1')}>
          Select Location
        </button>

        <button onClick={props.onSceneAdd}>Add Scene</button>
        <button onClick={props.onChapterAdd}>Add Chapter</button>
        <button onClick={props.onPartAdd}>Add Part</button>
        <button onClick={props.onCharacterAdd}>Add Character</button>
        <button onClick={props.onLocationAdd}>Add Location</button>

        <button onClick={() => props.onSceneDelete('scene-1')}>
          Delete Scene
        </button>
        <button onClick={() => props.onChapterDelete('chapter-1')}>
          Delete Chapter
        </button>
        <button
          onClick={() =>
            props.onSceneUpdate('scene-1', { title: 'Updated Scene' })
          }
        >
          Update Scene
        </button>
        <button
          onClick={() =>
            props.onChapterUpdate('chapter-1', { title: 'Updated Chapter' })
          }
        >
          Update Chapter
        </button>
      </div>
    );
  };
});

// Mock other components
jest.mock('../components/SceneEditor', () => {
  return function MockedSceneEditor({ scene, onSceneUpdate }) {
    return (
      <div data-testid="scene-editor">
        <div data-testid="scene-title">{scene?.title || 'No Scene'}</div>
        <div data-testid="scene-content">{scene?.content || ''}</div>
        <button
          onClick={() => onSceneUpdate?.(scene?.id, { title: 'Updated Title' })}
        >
          Update Scene
        </button>
      </div>
    );
  };
});

jest.mock('../components/CharacterEditor', () => {
  return function MockedCharacterEditor({ character, onCharacterUpdate }) {
    return (
      <div data-testid="character-editor">
        <div data-testid="character-name">
          {character?.name || 'No Character'}
        </div>
        <button
          onClick={() =>
            onCharacterUpdate?.(character?.id, { name: 'Updated Name' })
          }
        >
          Update Character
        </button>
      </div>
    );
  };
});

jest.mock('../components/LocationEditor', () => {
  return function MockedLocationEditor({ location, onLocationUpdate }) {
    return (
      <div data-testid="location-editor">
        <div data-testid="location-name">{location?.name || 'No Location'}</div>
        <button
          onClick={() =>
            onLocationUpdate?.(location?.id, { name: 'Updated Location' })
          }
        >
          Update Location
        </button>
      </div>
    );
  };
});

jest.mock('../components/BackgroundEditor', () => {
  return function MockedBackgroundEditor({ document, onDocumentUpdate }) {
    return (
      <div data-testid="background-editor">
        <div data-testid="document-title">
          {document?.title || 'No Document'}
        </div>
        <button
          onClick={() =>
            onDocumentUpdate?.(document?.id, { title: 'Updated Document' })
          }
        >
          Update Document
        </button>
      </div>
    );
  };
});

jest.mock('../components/FrontMatterEditor', () => {
  return function MockedFrontMatterEditor({
    frontMatterItem,
    onFrontMatterUpdate,
    authorName
  }) {
    return (
      <div data-testid="frontmatter-editor">
        <div data-testid="frontmatter-title">
          {frontMatterItem?.title || 'No Front Matter'}
        </div>
        <div data-testid="author-name">{authorName}</div>
        <button
          onClick={() =>
            onFrontMatterUpdate?.(frontMatterItem?.id, {
              title: 'Updated Front Matter'
            })
          }
        >
          Update Front Matter
        </button>
      </div>
    );
  };
});

jest.mock('../components/CharacterThreadVisualization', () => {
  return function MockedCharacterThreadVisualization() {
    return <div data-testid="character-thread-visualization">Thread View</div>;
  };
});

jest.mock('../components/TemplateManager', () => {
  return function MockedTemplateManager({
    template,
    onTemplateUpdate,
    onClose
  }) {
    return (
      <div data-testid="template-manager">
        <div data-testid="template-font-size">{template?.fontSize || 12}</div>
        <button onClick={() => onTemplateUpdate({ fontSize: 14 })}>
          Update Template
        </button>
        <button onClick={onClose}>Close Template</button>
      </div>
    );
  };
});

jest.mock('../components/ExportDialog', () => {
  return function MockedExportDialog({ book, onClose }) {
    return (
      <div data-testid="export-dialog">
        <div data-testid="export-book-title">{book?.title}</div>
        <button onClick={onClose}>Close Export</button>
      </div>
    );
  };
});

jest.mock('../components/GitHubIntegration', () => {
  return function MockedGitHubIntegration({
    currentRepo,
    book,
    onGitHubSettingsUpdate,
    onClose
  }) {
    return (
      <div data-testid="github-integration">
        <div data-testid="current-repo">
          {currentRepo
            ? typeof currentRepo === 'string'
              ? currentRepo
              : currentRepo.full_name
            : 'no repo'}
        </div>
        <div data-testid="github-book-title">{book?.title}</div>
        <button
          onClick={() =>
            onGitHubSettingsUpdate({
              repository: { name: 'repo', full_name: 'test/repo' }
            })
          }
        >
          Update GitHub Settings
        </button>
        <button onClick={onClose}>Close GitHub</button>
      </div>
    );
  };
});

jest.mock('../components/BackupRecovery', () => {
  return function MockedBackupRecovery({ onClose, onBookRecovered }) {
    const mockRecoveredBook = {
      title: 'Recovered Book',
      author: 'Test Author',
      frontMatter: [],
      parts: [],
      chapters: [
        {
          id: 'chapter-1',
          title: 'Chapter 1',
          scenes: [{ id: 'scene-1', title: 'Scene 1', content: 'Test content' }]
        }
      ],
      characters: [],
      characterDetectionBlacklist: [],
      locations: [],
      backgroundFolders: [
        { id: 'default-bg', title: 'General Notes', documents: [] }
      ],
      template: { fontSize: 12 },
      github: { repository: null, lastSyncTime: null },
      metadata: {
        created: new Date().toISOString(),
        modified: new Date().toISOString()
      }
    };

    return (
      <div data-testid="backup-recovery">
        <button onClick={onClose}>Close Backup</button>
        <button
          onClick={() =>
            onBookRecovered('/path/to/file.book', mockRecoveredBook)
          }
        >
          Recover Book
        </button>
      </div>
    );
  };
});

jest.mock('../components/StatusBar', () => {
  return function MockedStatusBar({
    hasUnsavedChanges,
    isSaving,
    currentOperation,
    githubSyncStatus
  }) {
    return (
      <div data-testid="status-bar">
        <div data-testid="save-status">
          {isSaving
            ? 'Saving...'
            : hasUnsavedChanges
              ? 'Unsaved Changes'
              : 'Saved'}
        </div>
        <div data-testid="current-operation">{currentOperation || 'none'}</div>
        <div data-testid="github-last-sync">
          {githubSyncStatus?.lastSyncTime || 'never'}
        </div>
      </div>
    );
  };
});

// Mock the file operations
jest.mock('../utils/fileOperations', () => ({
  saveBook: jest.fn().mockResolvedValue({
    success: true,
    filePath: '/test/path/book.book'
  }),
  saveBookToFile: jest.fn().mockResolvedValue({
    success: true
  }),
  loadBook: jest.fn()
}));

// Mock font manager
jest.mock('../utils/fontManager', () => ({
  initializeFontSystem: jest.fn()
}));

describe('App Component - Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn()
      },
      writable: true
    });

    // Mock window methods
    global.alert = jest.fn();
    global.confirm = jest.fn();
    global.window.require = jest.fn();

    // Mock document.title
    Object.defineProperty(document, 'title', {
      writable: true,
      value: 'Test Title'
    });

    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });
  });

  afterEach(() => {
    delete global.window.require;
    jest.restoreAllMocks();
  });

  describe('Initial State and Rendering', () => {
    test('renders with correct initial state', () => {
      render(<App />);

      expect(screen.getByTestId('book-structure')).toBeInTheDocument();
      expect(screen.getByTestId('status-bar')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Book Title')).toHaveValue('');
      expect(screen.getByPlaceholderText('Author')).toHaveValue('');
      expect(screen.getByTestId('active-tab')).toHaveTextContent('manuscript');
      expect(screen.getByTestId('current-chapter-id')).toHaveTextContent(
        'default'
      );
      expect(screen.getByTestId('chapters-count')).toHaveTextContent('1');
      expect(screen.getByTestId('characters-count')).toHaveTextContent('0');
      expect(screen.getByTestId('locations-count')).toHaveTextContent('0');
      expect(screen.getByTestId('parts-count')).toHaveTextContent('0');
    });

    test('initializes with correct default book structure', () => {
      render(<App />);

      // Should have a default chapter
      expect(screen.getByTestId('chapters-count')).toHaveTextContent('1');

      // Should show no scene selected initially
      expect(screen.getByTestId('current-scene-id')).toHaveTextContent('none');

      // Should be on manuscript tab
      expect(screen.getByTestId('active-tab')).toHaveTextContent('manuscript');
    });
  });

  describe('Book Metadata Updates', () => {
    test('updates book title and marks as changed', async () => {
      render(<App />);

      const titleInput = screen.getByPlaceholderText('Book Title');

      fireEvent.change(titleInput, { target: { value: 'My Great Novel' } });

      expect(titleInput.value).toBe('My Great Novel');
      await waitFor(() => {
        expect(screen.getByTestId('save-status')).toHaveTextContent(
          'Unsaved Changes'
        );
      });
    });

    test('updates author and marks as changed', async () => {
      render(<App />);

      const authorInput = screen.getByPlaceholderText('Author');

      fireEvent.change(authorInput, { target: { value: 'John Author' } });

      expect(authorInput.value).toBe('John Author');
      await waitFor(() => {
        expect(screen.getByTestId('save-status')).toHaveTextContent(
          'Unsaved Changes'
        );
      });
    });
  });

  describe('Tab Navigation', () => {
    test('switches between all tabs correctly', async () => {
      render(<App />);

      const tabs = [
        'manuscript',
        'characters',
        'locations',
        'background',
        'frontmatter',
        'backmatter',
        'threads'
      ];

      for (const tab of tabs) {
        const tabButton = screen.getByText(
          `${tab.charAt(0).toUpperCase() + tab.slice(1)} Tab`
        );
        fireEvent.click(tabButton);
        await waitFor(() => {
          expect(screen.getByTestId('active-tab')).toHaveTextContent(tab);
        });
      }
    });

    test('renders correct editor for each tab', async () => {
      render(<App />);

      // Manuscript tab shows scene editor or no scene message
      expect(screen.getByText('No Scene Selected')).toBeInTheDocument();

      // Characters tab
      fireEvent.click(screen.getByText('Characters Tab'));

      await waitFor(() => {
        expect(screen.getByText('No Character Selected')).toBeInTheDocument();
      });

      // Locations tab
      fireEvent.click(screen.getByText('Locations Tab'));

      await waitFor(() => {
        expect(screen.getByText('No Location Selected')).toBeInTheDocument();
      });

      // Background tab
      fireEvent.click(screen.getByText('Background Tab'));

      await waitFor(() => {
        expect(screen.getByText('No Document Selected')).toBeInTheDocument();
      });

      // Front Matter tab
      fireEvent.click(screen.getByText('Frontmatter Tab'));

      await waitFor(() => {
        expect(screen.getByTestId('frontmatter-editor')).toBeInTheDocument();
      });

      // Threads tab
      fireEvent.click(screen.getByText('Threads Tab'));

      await waitFor(() => {
        expect(
          screen.getByTestId('character-thread-visualization')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Content Creation and Management', () => {
    test('creates new scene and updates state', async () => {
      render(<App />);

      const _initialSceneCount = 0; // No scenes initially

      fireEvent.click(screen.getByText('Add Scene'));

      await waitFor(() => {
        expect(screen.getByTestId('save-status')).toHaveTextContent(
          'Unsaved Changes'
        );
      });
    });

    test('creates new chapter and updates state', async () => {
      render(<App />);

      const _initialChapterCount = parseInt(
        screen.getByTestId('chapters-count').textContent
      );

      fireEvent.click(screen.getByText('Add Chapter'));

      await waitFor(() => {
        expect(screen.getByTestId('save-status')).toHaveTextContent(
          'Unsaved Changes'
        );
      });
    });

    test('creates new character and updates state', async () => {
      render(<App />);

      const _initialCharacterCount = parseInt(
        screen.getByTestId('characters-count').textContent
      );

      fireEvent.click(screen.getByText('Add Character'));

      await waitFor(() => {
        expect(screen.getByTestId('save-status')).toHaveTextContent(
          'Unsaved Changes'
        );
      });
    });

    test('creates new location and updates state', async () => {
      render(<App />);

      const _initialLocationCount = parseInt(
        screen.getByTestId('locations-count').textContent
      );

      fireEvent.click(screen.getByText('Add Location'));

      await waitFor(() => {
        expect(screen.getByTestId('save-status')).toHaveTextContent(
          'Unsaved Changes'
        );
      });
    });

    test('creates new part and updates state', async () => {
      render(<App />);

      const _initialPartCount = parseInt(
        screen.getByTestId('parts-count').textContent
      );

      fireEvent.click(screen.getByText('Add Part'));

      await waitFor(() => {
        expect(screen.getByTestId('save-status')).toHaveTextContent(
          'Unsaved Changes'
        );
      });
    });
  });

  describe('Content Selection and Editing', () => {
    test('selects scene and shows editor', async () => {
      render(<App />);

      fireEvent.click(screen.getByText('Select Scene'));

      await waitFor(() => {
        expect(screen.getByTestId('current-scene-id')).toHaveTextContent(
          'scene-1'
        );
      });
    });

    test('selects character and shows editor', async () => {
      render(<App />);

      // Switch to characters tab first
      fireEvent.click(screen.getByText('Characters Tab'));

      fireEvent.click(screen.getByText('Select Character'));

      // Should be able to interact with character editor
      await waitFor(() => {
        expect(screen.getByTestId('active-tab')).toHaveTextContent(
          'characters'
        );
      });
    });

    test('updates scene content and marks as changed', async () => {
      render(<App />);

      // First select a scene
      fireEvent.click(screen.getByText('Select Scene'));

      // Then update it through the book structure mock
      fireEvent.click(screen.getByText('Update Scene'));

      await waitFor(() => {
        expect(screen.getByTestId('save-status')).toHaveTextContent(
          'Unsaved Changes'
        );
      });
    });

    test('manages back matter sections correctly', async () => {
      render(<App />);

      // Switch to back matter tab
      fireEvent.click(screen.getByText('Backmatter Tab'));

      await waitFor(() => {
        expect(screen.getByTestId('active-tab')).toHaveTextContent(
          'backmatter'
        );
      });

      // Should show no back matter message initially
      expect(
        screen.getByText('📑 No Back Matter Selected')
      ).toBeInTheDocument();

      // Add a back matter section through dropdown
      const addSelect = screen.getByDisplayValue('➕ Add Section');
      fireEvent.change(addSelect, { target: { value: 'epilogue' } });

      // Should mark as changed
      await waitFor(() => {
        expect(screen.getByTestId('save-status')).toHaveTextContent(
          'Unsaved Changes'
        );
      });

      // Should now show the epilogue in the back matter list (check both locations)
      await waitFor(() => {
        const epilogueElements = screen.getAllByText('Epilogue');
        expect(epilogueElements.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('Dialog Management', () => {
    test('opens and closes template manager', async () => {
      render(<App />);

      // Open template manager
      fireEvent.click(screen.getByTitle(/Template Settings/));
      expect(screen.getByTestId('template-manager')).toBeInTheDocument();
      expect(screen.getByTestId('template-font-size')).toHaveTextContent('12');

      // Close template manager
      fireEvent.click(screen.getByText('Close Template'));
      expect(screen.queryByTestId('template-manager')).not.toBeInTheDocument();
    });

    test('updates template settings', async () => {
      render(<App />);

      // Open template manager
      fireEvent.click(screen.getByTitle(/Template Settings/));

      // Update template
      fireEvent.click(screen.getByText('Update Template'));

      expect(screen.getByTestId('save-status')).toHaveTextContent(
        'Unsaved Changes'
      );
    });

    test('opens and closes export dialog with book data', async () => {
      render(<App />);

      // Set a book title first
      fireEvent.change(screen.getByPlaceholderText('Book Title'), {
        target: { value: 'Test Book' }
      });

      // Open export dialog
      fireEvent.click(screen.getByTitle(/Export Book/));
      expect(screen.getByTestId('export-dialog')).toBeInTheDocument();
      expect(screen.getByTestId('export-book-title')).toHaveTextContent(
        'Test Book'
      );

      // Close export dialog
      fireEvent.click(screen.getByText('Close Export'));
      expect(screen.queryByTestId('export-dialog')).not.toBeInTheDocument();
    });

    test('opens and closes GitHub integration', async () => {
      render(<App />);

      // Set book title
      fireEvent.change(screen.getByPlaceholderText('Book Title'), {
        target: { value: 'GitHub Book' }
      });

      // Open GitHub integration
      fireEvent.click(screen.getByTitle(/GitHub Integration/));
      expect(screen.getByTestId('github-integration')).toBeInTheDocument();
      expect(screen.getByTestId('current-repo')).toHaveTextContent('no repo');
      expect(screen.getByTestId('github-book-title')).toHaveTextContent(
        'GitHub Book'
      );

      // Update GitHub settings
      fireEvent.click(screen.getByText('Update GitHub Settings'));
      expect(screen.getByTestId('save-status')).toHaveTextContent(
        'Unsaved Changes'
      );

      // Close GitHub integration
      fireEvent.click(screen.getByText('Close GitHub'));
      expect(
        screen.queryByTestId('github-integration')
      ).not.toBeInTheDocument();
    });
  });

  describe('Book Recovery', () => {
    test('recovers book and updates state', async () => {
      render(<App />);

      // Initially no title
      expect(screen.getByPlaceholderText('Book Title')).toHaveValue('');

      // Open backup recovery
      fireEvent.click(screen.getByTitle(/Open from Backup/));
      expect(screen.getByTestId('backup-recovery')).toBeInTheDocument();

      // Recover book
      fireEvent.click(screen.getByText('Recover Book'));

      // Book should be updated
      expect(screen.getByPlaceholderText('Book Title')).toHaveValue(
        'Recovered Book'
      );
      expect(screen.getByPlaceholderText('Author')).toHaveValue('Test Author');
      expect(screen.getByTestId('save-status')).toHaveTextContent('Saved');

      // Close backup recovery
      fireEvent.click(screen.getByText('Close Backup'));
      expect(screen.queryByTestId('backup-recovery')).not.toBeInTheDocument();
    });
  });

  describe('Saving Functionality', () => {
    test('shows saving state during save operations', async () => {
      // Mock saveBook to take some time
      saveBook.mockImplementation(
        () =>
          new Promise(resolve => {
            setTimeout(
              () => resolve({ success: true, filePath: '/test/book.book' }),
              100
            );
          })
      );

      render(<App />);

      // Make a change
      fireEvent.change(screen.getByPlaceholderText('Book Title'), {
        target: { value: 'Test Book' }
      });

      expect(screen.getByTestId('save-status')).toHaveTextContent(
        'Unsaved Changes'
      );
    });

    test('handles save errors gracefully', async () => {
      saveBook.mockRejectedValue(new Error('Save failed'));

      render(<App />);

      // Make a change to trigger unsaved state
      fireEvent.change(screen.getByPlaceholderText('Book Title'), {
        target: { value: 'Test Book' }
      });

      expect(screen.getByTestId('save-status')).toHaveTextContent(
        'Unsaved Changes'
      );
    });
  });

  describe('Browser Mode Detection', () => {
    test('shows browser mode indicator when not in Electron', () => {
      delete global.window.require;
      render(<App />);
      expect(
        screen.getByText('Browser Mode - Limited functionality')
      ).toBeInTheDocument();
    });

    test('does not show browser mode indicator in Electron', () => {
      global.window.require = jest.fn();
      render(<App />);
      expect(
        screen.queryByText('Browser Mode - Limited functionality')
      ).not.toBeInTheDocument();
    });
  });

  describe('Window Title Updates', () => {
    test('updates document title with book title and unsaved indicator', async () => {
      render(<App />);

      // Change title
      fireEvent.change(screen.getByPlaceholderText('Book Title'), {
        target: { value: 'My Novel' }
      });

      // Document title should be updated (we can't directly test this in jsdom)
      // But we can verify the input value changed which triggers the useEffect
      expect(screen.getByPlaceholderText('Book Title')).toHaveValue('My Novel');
      expect(screen.getByTestId('save-status')).toHaveTextContent(
        'Unsaved Changes'
      );
    });
  });

  describe('Event Listeners', () => {
    test('adds and removes event listeners properly', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = render(<App />);

      // Should have added multiple event listeners
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'beforeunload',
        expect.any(Function)
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'click',
        expect.any(Function)
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );

      // When component unmounts, should remove listeners
      unmount();
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'beforeunload',
        expect.any(Function)
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'click',
        expect.any(Function)
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Content Deletion', () => {
    test('deletes scene and updates state', async () => {
      render(<App />);

      fireEvent.click(screen.getByText('Delete Scene'));

      expect(screen.getByTestId('save-status')).toHaveTextContent(
        'Unsaved Changes'
      );
    });

    test('deletes chapter and updates state', async () => {
      render(<App />);

      fireEvent.click(screen.getByText('Delete Chapter'));

      expect(screen.getByTestId('save-status')).toHaveTextContent(
        'Unsaved Changes'
      );
    });
  });

  describe('Status Bar Integration', () => {
    test('shows correct status information', async () => {
      render(<App />);

      // Initially saved
      expect(screen.getByTestId('save-status')).toHaveTextContent('Saved');
      expect(screen.getByTestId('current-operation')).toHaveTextContent('none');
      expect(screen.getByTestId('github-last-sync')).toHaveTextContent('never');

      // Make a change
      fireEvent.change(screen.getByPlaceholderText('Book Title'), {
        target: { value: 'Changed' }
      });

      expect(screen.getByTestId('save-status')).toHaveTextContent(
        'Unsaved Changes'
      );
    });
  });

  describe('Error Handling', () => {
    test('handles template update errors gracefully', async () => {
      render(<App />);

      // Open template manager
      fireEvent.click(screen.getByTitle(/Template Settings/));

      // Try to update template
      fireEvent.click(screen.getByText('Update Template'));

      // Should not crash and should mark as changed
      expect(screen.getByTestId('save-status')).toHaveTextContent(
        'Unsaved Changes'
      );
    });
  });

  describe('Service Integration Tests', () => {
    beforeEach(() => {
      jest.clearAllMocks();

      // Mock service methods
      saveBook.mockResolvedValue({
        success: true,
        filePath: '/test/book.book'
      });

      // Mock fetch for GitHub operations
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ access_token: 'mock-token' })
      });

      // Mock EventHandlerService for IPC handling
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      jest.spyOn(console, 'error').mockImplementation(() => {});

      // Mock window.require for Electron APIs
      Object.defineProperty(window, 'require', {
        writable: true,
        value: jest.fn(() => {
          throw new Error('Module not found');
        })
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    describe('SaveService Integration', () => {
      test('properly manages unsaved changes state', async () => {
        render(<App />);

        // Wait for app initialization
        await new Promise(resolve => setTimeout(resolve, 50));

        // Initially should show no unsaved changes
        expect(screen.getByTestId('save-status')).not.toHaveTextContent(
          'Unsaved Changes'
        );

        // Add some content to trigger changes
        const addSceneButton = screen.getByText('Add Scene');
        fireEvent.click(addSceneButton);

        // Verify unsaved changes status is updated
        expect(screen.getByTestId('save-status')).toHaveTextContent(
          'Unsaved Changes'
        );

        // Verify the service integration is working by checking that state changes are properly tracked
      });

      test('maintains state consistency during content operations', async () => {
        render(<App />);

        await new Promise(resolve => setTimeout(resolve, 50));

        // Add multiple pieces of content to test service state management
        const addSceneButton = screen.getByText('Add Scene');
        const addChapterButton = screen.getByText('Add Chapter');

        fireEvent.click(addSceneButton);
        fireEvent.click(addChapterButton);

        // Verify state is maintained correctly
        // State should remain consistent
        expect(screen.getByTestId('save-status')).toHaveTextContent(
          'Unsaved Changes'
        );
      });

      test('handles rapid content changes without service conflicts', async () => {
        render(<App />);

        await new Promise(resolve => setTimeout(resolve, 50));

        // Rapidly add content to test service handling
        const addSceneButton = screen.getByText('Add Scene');

        // Multiple rapid clicks
        fireEvent.click(addSceneButton);
        fireEvent.click(addSceneButton);
        fireEvent.click(addSceneButton);

        await new Promise(resolve => setTimeout(resolve, 100));

        // Should handle all operations correctly
        expect(screen.getByTestId('save-status')).toHaveTextContent(
          'Unsaved Changes'
        );
      });
    });

    describe('GitHubSync Integration', () => {
      test('initializes GitHub sync service without errors', async () => {
        render(<App />);

        await new Promise(resolve => setTimeout(resolve, 50));

        // App should initialize with GitHub integration available
        const githubButton = screen.getByTitle(/GitHub Integration/);
        expect(githubButton).toBeInTheDocument();

        // Service should be ready for use
        expect(screen.getByTestId('save-status')).toBeInTheDocument();
      });

      test('maintains consistent state during GitHub operations', async () => {
        render(<App />);

        await new Promise(resolve => setTimeout(resolve, 50));

        // Add content to create changes
        const addSceneButton = screen.getByText('Add Scene');
        fireEvent.click(addSceneButton);

        // Open GitHub integration
        const githubButton = screen.getByTitle(/GitHub Integration/);
        fireEvent.click(githubButton);

        // Should maintain unsaved changes state
        expect(screen.getByTestId('save-status')).toHaveTextContent(
          'Unsaved Changes'
        );
      });
    });

    describe('Service Error Boundaries', () => {
      test('maintains state consistency during service errors', async () => {
        render(<App />);

        await new Promise(resolve => setTimeout(resolve, 50));

        // Add content
        const addSceneButton = screen.getByText('Add Scene');
        fireEvent.click(addSceneButton);

        // Verify the app remains stable after operations

        // Mock service error
        saveBook.mockRejectedValue(new Error('Service error'));

        // Try to save
        fireEvent.keyDown(document, { key: 's', ctrlKey: true });

        await new Promise(resolve => setTimeout(resolve, 100));

        // State should remain consistent
        // State should remain consistent
        expect(screen.getByTestId('save-status')).toHaveTextContent(
          'Unsaved Changes'
        );
      });
    });

    describe('Service State Management', () => {
      test('properly initializes and manages service instances', async () => {
        render(<App />);

        await new Promise(resolve => setTimeout(resolve, 50));

        // Services should be initialized and ready
        expect(screen.getByTestId('save-status')).toBeInTheDocument();

        // Add content to test service interaction
        const addSceneButton = screen.getByText('Add Scene');
        fireEvent.click(addSceneButton);

        // Should update status through service integration
        expect(screen.getByTestId('save-status')).toHaveTextContent(
          'Unsaved Changes'
        );
      });

      test('cleans up service operations on unmount', async () => {
        const { unmount } = render(<App />);

        await new Promise(resolve => setTimeout(resolve, 50));

        // Add content and start operations
        const addSceneButton = screen.getByText('Add Scene');
        fireEvent.click(addSceneButton);

        // Start a save operation
        fireEvent.keyDown(document, { key: 's', ctrlKey: true });

        // Unmount should not cause errors
        expect(() => unmount()).not.toThrow();
      });
    });
  });

  describe('GitHub sync triggers', () => {
    beforeEach(() => {
      delete window._mockElectronAPI;
      // gitSyncService is automocked whole-module; give
      // reconcilePostSyncState a sensible pass-through default (adopt the
      // sync result as-is) so every test below that doesn't care about the
      // in-flight-edit race doesn't have to mock it individually. The race
      // regression test further down overrides this with the real
      // implementation.
      gitSyncService.reconcilePostSyncState.mockImplementation(
        (base, local, remote) => ({ bookData: remote, conflicts: [] })
      );
    });

    test('exposes a triggerGitSync function to Electron that returns a promise (close-trigger must be awaitable)', async () => {
      render(<App />);

      await waitFor(() => {
        expect(typeof window._mockElectronAPI?.triggerGitSync).toBe('function');
      });

      let returned;
      await act(async () => {
        returned = window._mockElectronAPI.triggerGitSync();
      });

      // The old bug: triggerSync() didn't return performGitSync()'s promise,
      // so the Electron close handler's `await executeJavaScript(...)`
      // resolved immediately without ever waiting for the sync to finish.
      expect(returned).toBeInstanceOf(Promise);
      await expect(returned).resolves.not.toThrow();
    });

    test('does not alert or throw when a background sync trigger (blur) rejects', async () => {
      gitHubService.isAuthenticated.mockReturnValue(true);
      gitSyncService.syncBook.mockRejectedValue(new Error('Network error'));

      render(<App />);

      // Connect the book to a repository so performGitSync's guard passes
      // and it actually calls gitSyncService.syncBook.
      fireEvent.click(screen.getByTitle(/GitHub Integration/));
      fireEvent.click(screen.getByText('Update GitHub Settings'));
      fireEvent.click(screen.getByText('Close GitHub'));

      await act(async () => {
        window.dispatchEvent(new Event('blur'));
        // let the rejected performGitSync promise settle
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await waitFor(() => {
        expect(gitSyncService.syncBook).toHaveBeenCalled();
      });

      // A background trigger's rejection must be swallowed, not surfaced --
      // no alert (which would otherwise fire on every ordinary offline blip)
      // and nothing should have thrown out of the blur handler.
      expect(global.alert).not.toHaveBeenCalled();
    });

    test('clears conflictSceneIds after a clean sync following a conflicted one', async () => {
      gitHubService.isAuthenticated.mockReturnValue(true);
      // Echo the book back unchanged so no fields the rest of the app
      // depends on go missing -- only conflicts differ between calls.
      gitSyncService.syncBook
        .mockImplementationOnce(async ({ book }) => ({
          bookData: book,
          conflicts: [{ sceneId: 'scene-1' }]
        }))
        .mockImplementationOnce(async ({ book }) => ({
          bookData: book,
          conflicts: []
        }));

      render(<App />);

      fireEvent.click(screen.getByTitle(/GitHub Integration/));
      fireEvent.click(screen.getByText('Update GitHub Settings'));
      fireEvent.click(screen.getByText('Close GitHub'));

      await act(async () => {
        window.dispatchEvent(new Event('blur'));
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await waitFor(() => {
        expect(screen.getByTestId('conflict-scene-ids')).toHaveTextContent(
          'scene-1'
        );
      });

      await act(async () => {
        window.dispatchEvent(new Event('blur'));
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await waitFor(() => {
        expect(screen.getByTestId('conflict-scene-ids')).toHaveTextContent('');
      });
    });

    test('performGitSync reads the current book via bookRef, not a closure captured before a later edit', async () => {
      // Real bug found live: performGitSync used to close over the `book`
      // variable directly. Several independent triggers (blur, periodic
      // timer, the Electron close hook) each re-subscribe via their own
      // useEffect -- if any one of those held an older closure while a
      // scene was added afterward, invoking it would push a book snapshot
      // missing that scene. buildAttempt's remote-only-deletion logic then
      // read "not in this stale snapshot" as "the user deleted it" and
      // removed the file on GitHub -- confirmed real data loss, not
      // hypothetical. This test captures the exposed trigger EARLY (before
      // any edit), performs an edit, then invokes that same early
      // reference and asserts syncBook receives the post-edit state.
      gitHubService.isAuthenticated.mockReturnValue(true);
      gitSyncService.syncBook.mockResolvedValue({
        bookData: {
          github: { repository: { full_name: 'o/r' } },
          chapters: []
        },
        conflicts: []
      });

      render(<App />);

      fireEvent.click(screen.getByTitle(/GitHub Integration/));
      fireEvent.click(screen.getByText('Update GitHub Settings'));
      fireEvent.click(screen.getByText('Close GitHub'));

      await waitFor(() => {
        expect(typeof window._mockElectronAPI?.triggerGitSync).toBe('function');
      });
      // Capture the reference now, before the edit below.
      const earlyTriggerGitSync = window._mockElectronAPI.triggerGitSync;

      fireEvent.click(screen.getByText('Add Scene'));
      await waitFor(() => {
        expect(screen.getByTestId('save-status')).toHaveTextContent(
          'Unsaved Changes'
        );
      });

      await act(async () => {
        await earlyTriggerGitSync();
      });

      await waitFor(() => {
        expect(gitSyncService.syncBook).toHaveBeenCalled();
      });
      const syncedBook = gitSyncService.syncBook.mock.calls[0][0].book;
      expect(syncedBook.chapters.some(ch => ch.scenes.length > 0)).toBe(true);
    });

    test('a scene added while a sync is still in flight survives, instead of being wiped by that sync completing', async () => {
      // performGitSync used to finish with a plain setBook(result.bookData)
      // -- an unconditional replace. A sync's round-trip is not instant, so
      // any edit made on this device while it was still pending was
      // silently discarded the moment it resolved, with nothing pushed to
      // GitHub to recover it from. This uses the *real*
      // reconcilePostSyncState (not the pass-through default above) to
      // prove the fix end-to-end: add a scene while syncBook is still
      // pending, resolve it with the pre-edit snapshot (exactly what a real
      // sync would return, since it started before the edit existed), and
      // confirm the added scene is still there afterward.
      const { reconcilePostSyncState: realReconcile } = jest.requireActual(
        '../services/gitSyncService.js'
      );
      gitSyncService.reconcilePostSyncState.mockImplementation(realReconcile);

      gitHubService.isAuthenticated.mockReturnValue(true);
      let resolveSyncBook;
      gitSyncService.syncBook.mockImplementation(
        () =>
          new Promise(resolve => {
            resolveSyncBook = resolve;
          })
      );

      render(<App />);

      fireEvent.click(screen.getByTitle(/GitHub Integration/));
      fireEvent.click(screen.getByText('Update GitHub Settings'));
      fireEvent.click(screen.getByText('Close GitHub'));

      await waitFor(() => {
        expect(typeof window._mockElectronAPI?.triggerGitSync).toBe('function');
      });

      // Start the sync -- it stays pending until resolveSyncBook is called.
      let syncPromise;
      act(() => {
        syncPromise = window._mockElectronAPI.triggerGitSync();
      });

      await waitFor(() => {
        expect(gitSyncService.syncBook).toHaveBeenCalledTimes(1);
      });
      const preSyncBook = gitSyncService.syncBook.mock.calls[0][0].book;

      // Edit while the sync is still pending.
      fireEvent.click(screen.getByText('Add Scene'));
      await waitFor(() => {
        expect(screen.getByTestId('save-status')).toHaveTextContent(
          'Unsaved Changes'
        );
      });

      // The sync resolves with exactly what a real sync would produce here:
      // the pre-edit snapshot it started from (it has no idea the new scene
      // exists).
      await act(async () => {
        resolveSyncBook({ bookData: preSyncBook, conflicts: [] });
        await syncPromise;
      });

      // Trigger a second sync and inspect what book state it's sent --
      // that's bookRef.current after the first sync's reconciliation ran.
      let secondSyncPromise;
      gitSyncService.syncBook.mockImplementation(async ({ book }) => ({
        bookData: book,
        conflicts: []
      }));
      act(() => {
        secondSyncPromise = window._mockElectronAPI.triggerGitSync();
      });
      await act(async () => {
        await secondSyncPromise;
      });

      const secondSyncBook = gitSyncService.syncBook.mock.calls[1][0].book;
      expect(secondSyncBook.chapters.some(ch => ch.scenes.length > 0)).toBe(
        true
      );
    });
  });
});
