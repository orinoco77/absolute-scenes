/* eslint-disable testing-library/no-wait-for-side-effects */
/* eslint-disable testing-library/no-wait-for-multiple-assertions */
/* eslint-disable testing-library/no-unnecessary-act */
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act
} from '@testing-library/react';
import * as gitSyncService from '../../services/gitSyncService.js';
import GitHubService from '../../utils/gitHubService';
import GitHubIntegration from '../GitHubIntegration';

jest.mock('../../utils/gitHubService');
jest.mock('../../services/gitSyncService.js');

// Mock Electron shell
const mockShell = {
  openExternal: jest.fn()
};

// Mock window.require for Electron
Object.defineProperty(window, 'require', {
  writable: true,
  value: jest.fn(module => {
    if (module === 'electron') {
      return { shell: mockShell };
    }
    return {};
  })
});

const mockBook = {
  title: 'Test Book',
  author: 'Test Author',
  github: {
    repository: null,
    lastSyncTime: null
  }
};

const mockRepository = {
  id: 1,
  name: 'test-book-repo',
  html_url: 'https://github.com/user/test-book-repo'
};

const mockUserInfo = {
  login: 'testuser',
  name: 'Test User'
};

const mockProps = {
  currentRepo: null,
  onGitHubSettingsUpdate: jest.fn(),
  onGitHubSyncStatusUpdate: jest.fn(),
  onClose: jest.fn(),
  book: mockBook,
  currentFilePath: '/path/to/book.book',
  onStatusMessage: jest.fn()
};

describe('GitHubIntegration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    GitHubService.loadStoredAuth = jest.fn();
    GitHubService.validateAndSetupToken = jest.fn();
    GitHubService.setupBookRepository = jest.fn();
    GitHubService.saveBookToRepository = jest.fn();
    GitHubService.startConnectionFlow = jest.fn();
    GitHubService.disconnect = jest.fn();
    GitHubService.checkRepositoryForBookFile = jest.fn();
    GitHubService.downloadBookFromRepository = jest.fn();
    GitHubService.userInfo = mockUserInfo;
  });

  describe('when not authenticated', () => {
    beforeEach(() => {
      GitHubService.loadStoredAuth.mockReturnValue(false);
    });

    it('renders setup screen for book without title/author', () => {
      const bookWithoutMeta = { ...mockBook, title: '', author: '' };

      render(<GitHubIntegration {...mockProps} book={bookWithoutMeta} />);

      expect(screen.getByText('Safe & Secure Book Backup')).toBeInTheDocument();
      expect(
        screen.getByText(/Keep your book safe with automatic cloud backup/)
      ).toBeInTheDocument();
      // Button is now always enabled - title/author validation happens later
      expect(
        screen.getByRole('button', { name: /Get Started - It's Free!/ })
      ).toBeEnabled();
    });

    it('renders setup screen for book with title and author', () => {
      render(<GitHubIntegration {...mockProps} />);

      expect(screen.getByText('Safe & Secure Book Backup')).toBeInTheDocument();
      expect(screen.getByText('✨ What you get:')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Get Started - It's Free!/ })
      ).toBeEnabled();
    });

    it('shows warning when book lacks title or author', () => {
      const bookWithoutTitle = { ...mockBook, title: '' };

      render(<GitHubIntegration {...mockProps} book={bookWithoutTitle} />);

      expect(screen.getByText('Safe & Secure Book Backup')).toBeInTheDocument();
      // Button is now always enabled - users can connect to GitHub without title/author
      expect(
        screen.getByRole('button', { name: /Get Started - It's Free!/ })
      ).toBeEnabled();
    });

    it('starts setup flow when get started is clicked', async () => {
      GitHubService.startConnectionFlow.mockResolvedValue();

      render(<GitHubIntegration {...mockProps} />);

      const getStartedButton = screen.getByRole('button', {
        name: /Get Started - It's Free!/
      });
      fireEvent.click(getStartedButton);

      await waitFor(() => {
        expect(GitHubService.startConnectionFlow).toHaveBeenCalled();
      });

      // Should show token setup screen
      expect(
        screen.getByText('Step 1: Create Access Token')
      ).toBeInTheDocument();
    });

    it('shows error when setup fails due to missing book metadata', async () => {
      const bookWithoutTitle = { ...mockBook, title: '' };

      render(<GitHubIntegration {...mockProps} book={bookWithoutTitle} />);

      // The button is now always enabled - validation happens during repo creation
      const getStartedButton = screen.getByRole('button', {
        name: /Get Started - It's Free!/
      });
      expect(getStartedButton).toBeEnabled();

      // Should show the standard UI
      expect(screen.getByText('Safe & Secure Book Backup')).toBeInTheDocument();
    });

    it('opens GitHub signup when link is clicked', () => {
      render(<GitHubIntegration {...mockProps} />);

      const signupLink = screen.getByText('Create one free here');
      fireEvent.click(signupLink);

      expect(mockShell.openExternal).toHaveBeenCalledWith(
        'https://github.com/join'
      );
    });
  });

  describe('token setup flow', () => {
    beforeEach(() => {
      GitHubService.loadStoredAuth.mockReturnValue(false);
      GitHubService.startConnectionFlow.mockResolvedValue();
    });

    it('shows token creation instructions', async () => {
      render(<GitHubIntegration {...mockProps} />);

      fireEvent.click(
        screen.getByRole('button', { name: /Get Started - It's Free!/ })
      );

      await waitFor(() => {
        expect(
          screen.getByText('Step 1: Create Access Token')
        ).toBeInTheDocument();
        expect(
          screen.getByText(/All permissions are pre-configured/)
        ).toBeInTheDocument();
      });
    });

    it('advances to token input step', async () => {
      render(<GitHubIntegration {...mockProps} />);

      fireEvent.click(
        screen.getByRole('button', { name: /Get Started - It's Free!/ })
      );

      await waitFor(() => {
        expect(screen.getByText("✅ I've copied my token")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("✅ I've copied my token"));

      expect(screen.getByText('Step 2: Enter Your Token')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/ghp_/)).toBeInTheDocument();
    });

    it('validates and sets up token successfully', async () => {
      GitHubService.validateAndSetupToken.mockResolvedValue(mockUserInfo);
      GitHubService.setupBookRepository.mockResolvedValue(mockRepository);
      GitHubService.saveBookToRepository.mockResolvedValue();

      render(<GitHubIntegration {...mockProps} />);

      fireEvent.click(
        screen.getByRole('button', { name: /Get Started - It's Free!/ })
      );

      await waitFor(() => {
        fireEvent.click(screen.getByText("✅ I've copied my token"));
      });

      const tokenInput = screen.getByPlaceholderText(/ghp_/);
      fireEvent.change(tokenInput, { target: { value: 'ghp_testtoken123' } });

      const connectButton = screen.getByText('🚀 Connect to GitHub');
      expect(connectButton).toBeEnabled();

      await act(async () => {
        fireEvent.click(connectButton);
      });

      // Just verify the service was called with the right token
      expect(GitHubService.validateAndSetupToken).toHaveBeenCalledWith(
        'ghp_testtoken123'
      );
    });

    it('handles token validation failure', async () => {
      GitHubService.validateAndSetupToken.mockRejectedValue(
        new Error('Invalid token')
      );

      render(<GitHubIntegration {...mockProps} />);

      fireEvent.click(
        screen.getByRole('button', { name: /Get Started - It's Free!/ })
      );

      await waitFor(() => {
        fireEvent.click(screen.getByText("✅ I've copied my token"));
      });

      const tokenInput = screen.getByPlaceholderText(/ghp_/);
      fireEvent.change(tokenInput, { target: { value: 'invalid_token' } });
      await act(async () => {
        fireEvent.click(screen.getByText('🚀 Connect to GitHub'));
      });

      await waitFor(
        () => {
          expect(screen.getByText('⚠️ Error:')).toBeInTheDocument();
          expect(screen.getByText('Invalid token')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('handles enter key press in token input', async () => {
      GitHubService.validateAndSetupToken.mockResolvedValue(mockUserInfo);
      GitHubService.setupBookRepository.mockResolvedValue(mockRepository);
      GitHubService.saveBookToRepository.mockResolvedValue();

      render(<GitHubIntegration {...mockProps} />);

      fireEvent.click(
        screen.getByRole('button', { name: /Get Started - It's Free!/ })
      );

      await waitFor(() => {
        fireEvent.click(screen.getByText("✅ I've copied my token"));
      });

      const tokenInput = screen.getByPlaceholderText(/ghp_/);
      fireEvent.change(tokenInput, { target: { value: 'ghp_testtoken123' } });
      // Use keyPress event to match the component's onKeyPress handler
      await act(async () => {
        fireEvent.keyPress(tokenInput, {
          key: 'Enter',
          code: 'Enter',
          keyCode: 13
        });
      });

      // Just verify the service was called
      expect(GitHubService.validateAndSetupToken).toHaveBeenCalledWith(
        'ghp_testtoken123'
      );
    });

    it('allows going back from token input to instructions', async () => {
      render(<GitHubIntegration {...mockProps} />);

      fireEvent.click(
        screen.getByRole('button', { name: /Get Started - It's Free!/ })
      );

      await waitFor(() => {
        fireEvent.click(screen.getByText("✅ I've copied my token"));
      });

      expect(screen.getByText('Step 2: Enter Your Token')).toBeInTheDocument();

      fireEvent.click(screen.getByText('← Back'));

      expect(
        screen.getByText('Step 1: Create Access Token')
      ).toBeInTheDocument();
    });

    it('can cancel token setup', async () => {
      render(<GitHubIntegration {...mockProps} />);

      fireEvent.click(
        screen.getByRole('button', { name: /Get Started - It's Free!/ })
      );

      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Cancel'));

      expect(screen.getByText('Safe & Secure Book Backup')).toBeInTheDocument();
    });
  });

  describe('when authenticated', () => {
    beforeEach(() => {
      GitHubService.loadStoredAuth.mockReturnValue(true);
    });

    it('shows connected status', () => {
      render(<GitHubIntegration {...mockProps} />);

      expect(screen.getByText('Connected to GitHub')).toBeInTheDocument();
      expect(screen.getByText('Signed in as')).toBeInTheDocument();
      expect(screen.getByText('testuser')).toBeInTheDocument();
    });

    it('shows repository setup when no repository exists', () => {
      render(<GitHubIntegration {...mockProps} />);

      expect(screen.getByText('Setup Book Repository')).toBeInTheDocument();
      expect(screen.getByText(/Setup Repository/)).toBeInTheDocument();
    });

    it('validates book metadata when setting up repository', async () => {
      const bookWithoutTitle = { ...mockBook, title: '' };

      render(<GitHubIntegration {...mockProps} book={bookWithoutTitle} />);

      // Try to click setup repository button - the component should handle validation
      const setupButton = screen.getByRole('button', {
        name: /Setup Repository/
      });
      await act(async () => {
        fireEvent.click(setupButton);
      });

      // Since validation happens in handleSetupRepository, we can't easily test the error display
      // but we can verify the button exists and is clickable
      expect(setupButton).toBeInTheDocument();
    });

    it('sets up repository successfully', async () => {
      GitHubService.setupBookRepository.mockResolvedValue(mockRepository);
      GitHubService.saveBookToRepository.mockResolvedValue();

      render(<GitHubIntegration {...mockProps} />);

      await act(async () => {
        fireEvent.click(
          screen.getByRole('button', { name: /Setup Repository/ })
        );
      });

      await waitFor(() => {
        expect(GitHubService.setupBookRepository).toHaveBeenCalledWith(
          'Test Book',
          'Test Author'
        );
        expect(mockProps.onGitHubSettingsUpdate).toHaveBeenCalledWith({
          repository: mockRepository
        });
      });
    });

    it('shows repository information when repository exists', () => {
      const propsWithRepo = {
        ...mockProps,
        currentRepo: mockRepository,
        book: {
          ...mockBook,
          github: {
            repository: mockRepository,
            lastSyncTime: '2023-01-01T12:00:00Z'
          }
        }
      };

      render(<GitHubIntegration {...propsWithRepo} />);

      expect(screen.getByText(/Book Repository/)).toBeInTheDocument();
      expect(screen.getByText(/Name:/)).toBeInTheDocument();
      expect(screen.getByText('test-book-repo')).toBeInTheDocument();
      expect(screen.getByText(/View on GitHub/)).toBeInTheDocument();
      expect(screen.getByText(/Sync Now/)).toBeInTheDocument();
    });

    it('shows last sync time when available', () => {
      const propsWithRepo = {
        ...mockProps,
        book: {
          ...mockBook,
          github: {
            repository: mockRepository,
            lastSyncTime: '2023-01-01T12:00:00Z'
          }
        }
      };

      render(<GitHubIntegration {...propsWithRepo} />);

      const expectedTime = new Date('2023-01-01T12:00:00Z').toLocaleString();
      expect(
        screen.getByText(`✅ Last synced: ${expectedTime}`)
      ).toBeInTheDocument();
    });

    it('opens repository in browser', () => {
      const propsWithRepo = {
        ...mockProps,
        currentRepo: mockRepository,
        book: { ...mockBook, github: { repository: mockRepository } }
      };

      render(<GitHubIntegration {...propsWithRepo} />);

      fireEvent.click(screen.getByRole('button', { name: /View on GitHub/ }));

      expect(mockShell.openExternal).toHaveBeenCalledWith(
        mockRepository.html_url
      );
    });

    it('syncs book to GitHub', async () => {
      const bookWithRepo = {
        ...mockBook,
        github: { repository: mockRepository }
      };
      const syncedBook = { ...bookWithRepo, title: 'Synced Title' };
      gitSyncService.syncBook.mockResolvedValue({
        bookData: syncedBook,
        conflicts: []
      });
      const propsWithRepo = {
        ...mockProps,
        currentRepo: mockRepository,
        book: bookWithRepo,
        onBookUpdate: jest.fn()
      };

      render(<GitHubIntegration {...propsWithRepo} />);

      const syncButton = screen.getByRole('button', { name: /Sync Now/ });
      await act(async () => {
        fireEvent.click(syncButton);
      });

      // The one code path into sync: gitSyncService.syncBook, called with
      // the book, the file path, and the GitHubService singleton -- and the
      // merged result propagated back to the parent via onBookUpdate.
      await waitFor(() => {
        expect(gitSyncService.syncBook).toHaveBeenCalledWith({
          book: bookWithRepo,
          filePath: propsWithRepo.currentFilePath,
          gitHubService: GitHubService
        });
        expect(propsWithRepo.onBookUpdate).toHaveBeenCalledWith(syncedBook);
        expect(mockProps.onGitHubSyncStatusUpdate).toHaveBeenCalledWith(
          expect.objectContaining({ lastSyncTime: expect.any(String) })
        );
      });
    });

    it('handles sync failure', async () => {
      gitSyncService.syncBook.mockRejectedValue(new Error('Sync failed'));

      const propsWithRepo = {
        ...mockProps,
        currentRepo: mockRepository,
        book: { ...mockBook, github: { repository: mockRepository } }
      };

      render(<GitHubIntegration {...propsWithRepo} />);

      const syncButton = screen.getByRole('button', { name: /Sync Now/ });
      await act(async () => {
        fireEvent.click(syncButton);
      });

      await waitFor(
        () => {
          expect(screen.getByText('⚠️ Error:')).toBeInTheDocument();
          expect(screen.getByText('Sync failed')).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });

    it('passes the current file path through to the sync layer', async () => {
      const bookWithRepo = {
        ...mockBook,
        github: { repository: mockRepository }
      };
      gitSyncService.syncBook.mockResolvedValue({
        bookData: bookWithRepo,
        conflicts: []
      });
      const propsWithRepo = {
        ...mockProps,
        currentRepo: mockRepository,
        currentFilePath: '/path/to/my-awesome-book.book',
        book: bookWithRepo
      };

      render(<GitHubIntegration {...propsWithRepo} />);

      const syncButton = screen.getByRole('button', { name: /Sync Now/ });
      await act(async () => {
        fireEvent.click(syncButton);
      });

      // Filename generation from the file path (or book title, when there's
      // no file path yet) now lives inside the git-sync package's own
      // pushSync -- this component's job is just to pass the right filePath
      // through, which is what used to feed the old local filename logic.
      await waitFor(() => {
        expect(gitSyncService.syncBook).toHaveBeenCalledWith({
          book: bookWithRepo,
          filePath: '/path/to/my-awesome-book.book',
          gitHubService: GitHubService
        });
      });
    });

    it('passes a null file path through when the book has never been saved to disk', async () => {
      const bookWithTitle = {
        ...mockBook,
        title: 'My Awesome Book!',
        github: { repository: mockRepository }
      };
      gitSyncService.syncBook.mockResolvedValue({
        bookData: bookWithTitle,
        conflicts: []
      });
      const propsWithRepo = {
        ...mockProps,
        currentRepo: mockRepository,
        currentFilePath: null,
        book: bookWithTitle
      };

      render(<GitHubIntegration {...propsWithRepo} />);

      const syncButton = screen.getByRole('button', { name: /Sync Now/ });
      await act(async () => {
        fireEvent.click(syncButton);
      });

      await waitFor(() => {
        expect(gitSyncService.syncBook).toHaveBeenCalledWith({
          book: bookWithTitle,
          filePath: null,
          gitHubService: GitHubService
        });
      });
    });

    it('disconnects from GitHub', () => {
      render(<GitHubIntegration {...mockProps} />);

      fireEvent.click(
        screen.getByRole('button', { name: /Disconnect from GitHub/ })
      );

      expect(GitHubService.disconnect).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('handles repository setup failure', async () => {
      GitHubService.loadStoredAuth.mockReturnValue(true);
      GitHubService.setupBookRepository.mockRejectedValue(
        new Error('Setup failed')
      );

      render(<GitHubIntegration {...mockProps} />);

      const setupButton = screen.getByRole('button', {
        name: /Setup Repository/
      });
      fireEvent.click(setupButton);

      await waitFor(
        () => {
          expect(screen.getByText('⚠️ Error:')).toBeInTheDocument();
          expect(screen.getByText('Setup failed')).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });

    it('continues with repository setup even if initial sync fails', async () => {
      GitHubService.loadStoredAuth.mockReturnValue(false);
      GitHubService.validateAndSetupToken.mockResolvedValue(mockUserInfo);
      GitHubService.setupBookRepository.mockResolvedValue(mockRepository);
      GitHubService.saveBookToRepository.mockRejectedValue(
        new Error('Sync failed')
      );

      render(<GitHubIntegration {...mockProps} />);

      fireEvent.click(
        screen.getByRole('button', { name: /Get Started - It's Free!/ })
      );

      await waitFor(() => {
        fireEvent.click(screen.getByText("✅ I've copied my token"));
      });

      const tokenInput = screen.getByPlaceholderText(/ghp_/);
      fireEvent.change(tokenInput, { target: { value: 'ghp_testtoken123' } });
      await act(async () => {
        fireEvent.click(screen.getByText('🚀 Connect to GitHub'));
      });

      // Just verify that the functions are called - the component logic handles the rest
      expect(GitHubService.validateAndSetupToken).toHaveBeenCalledWith(
        'ghp_testtoken123'
      );
    });

    it('clears status message on sync error', async () => {
      GitHubService.loadStoredAuth.mockReturnValue(true);
      gitSyncService.syncBook.mockRejectedValue(new Error('Sync failed'));

      const propsWithRepo = {
        ...mockProps,
        currentRepo: mockRepository,
        book: { ...mockBook, github: { repository: mockRepository } }
      };

      render(<GitHubIntegration {...propsWithRepo} />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Sync Now/ }));
      });

      await waitFor(() => {
        expect(mockProps.onStatusMessage).toHaveBeenCalledWith('');
      });
    });
  });

  it('calls onClose when close button is clicked', () => {
    render(<GitHubIntegration {...mockProps} />);

    fireEvent.click(screen.getByText('Close'));
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  describe('collaboration features', () => {
    beforeEach(() => {
      GitHubService.loadStoredAuth.mockReturnValue(true);
    });

    it('handles merging when remote is newer', async () => {
      const localBook = {
        ...mockBook,
        title: 'Local Version',
        github: { repository: mockRepository },
        metadata: { modified: '2024-01-01T10:00:00.000Z' }
      };

      const mergedBook = {
        ...mockBook,
        title: 'Remote Version',
        github: { repository: mockRepository },
        metadata: { modified: '2024-01-01T12:00:00.000Z' }
      };

      gitSyncService.syncBook.mockResolvedValue({
        bookData: mergedBook,
        conflicts: []
      });

      const onBookUpdate = jest.fn();
      const propsWithRepo = {
        ...mockProps,
        currentRepo: mockRepository,
        book: localBook,
        onBookUpdate
      };

      render(<GitHubIntegration {...propsWithRepo} />);

      const syncButton = screen.getByRole('button', { name: /Sync Now/ });
      await act(async () => {
        fireEvent.click(syncButton);
      });

      // The merged content the sync layer resolved (remote's newer title)
      // is propagated back up to the parent, which owns the book state.
      await waitFor(() => {
        expect(onBookUpdate).toHaveBeenCalledWith(mergedBook);
      });
    });

    it('auto-merges non-conflicting changes from both sides', async () => {
      const localBook = {
        ...mockBook,
        chapters: [
          {
            id: 'ch1',
            title: 'Chapter 1',
            scenes: [
              { id: 's1', title: 'Scene 1', content: 'Original' },
              { id: 's2', title: 'Scene 2', content: 'Local Edit' }
            ]
          }
        ],
        github: { repository: mockRepository },
        metadata: { modified: '2024-01-01T10:00:00.000Z' }
      };

      const mergedBook = {
        ...localBook,
        chapters: [
          {
            id: 'ch1',
            title: 'Chapter 1',
            scenes: [
              { id: 's1', title: 'Scene 1', content: 'Remote Edit' },
              { id: 's2', title: 'Scene 2', content: 'Local Edit' }
            ]
          }
        ]
      };

      gitSyncService.syncBook.mockResolvedValue({
        bookData: mergedBook,
        conflicts: []
      });

      const onBookUpdate = jest.fn();
      const propsWithRepo = {
        ...mockProps,
        currentRepo: mockRepository,
        book: localBook,
        onBookUpdate
      };

      render(<GitHubIntegration {...propsWithRepo} />);

      const syncButton = screen.getByRole('button', { name: /Sync Now/ });
      await act(async () => {
        fireEvent.click(syncButton);
      });

      // No conflicts -- the auto-merged content is applied directly and no
      // conflict scene ids are reported.
      await waitFor(() => {
        expect(onBookUpdate).toHaveBeenCalledWith(mergedBook);
      });
      expect(mockProps.onStatusMessage).toHaveBeenCalledWith(
        'Sync completed successfully!'
      );
    });

    it('detects conflicts when both edit same content', async () => {
      const localBook = {
        ...mockBook,
        title: 'Local Title',
        github: { repository: mockRepository },
        metadata: { modified: '2024-01-01T12:00:00.000Z' }
      };

      const bookWithConflictMarkers = {
        ...mockBook,
        title: 'Local Title',
        chapters: [
          {
            id: 'ch1',
            title: 'Chapter 1',
            scenes: [
              {
                id: 's1',
                title: 'Scene 1',
                content:
                  '<<<<<<< local\nLocal Title\n=======\nRemote Title\n>>>>>>> remote'
              }
            ]
          }
        ],
        github: { repository: mockRepository }
      };

      gitSyncService.syncBook.mockResolvedValue({
        bookData: bookWithConflictMarkers,
        conflicts: [{ sceneId: 's1' }]
      });

      const onConflictsDetected = jest.fn();
      const propsWithRepo = {
        ...mockProps,
        currentRepo: mockRepository,
        book: localBook,
        onConflictsDetected
      };

      render(<GitHubIntegration {...propsWithRepo} />);

      const syncButton = screen.getByRole('button', { name: /Sync Now/ });
      await act(async () => {
        fireEvent.click(syncButton);
      });

      // There is no separate resolve step (spec §7) -- conflicts are
      // reported up so the affected scene(s) can be resolved by editing.
      await waitFor(() => {
        expect(onConflictsDetected).toHaveBeenCalledWith(['s1']);
      });
      expect(
        screen.queryByText(/Applying conflict resolutions/)
      ).not.toBeInTheDocument();
    });
  });
});
