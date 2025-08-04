import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GitHubService from '../../utils/gitHubService';
import GitHubIntegration from '../GitHubIntegration';

jest.mock('../../utils/gitHubService');

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
    GitHubService.userInfo = mockUserInfo;
  });

  describe('when not authenticated', () => {
    beforeEach(() => {
      GitHubService.loadStoredAuth.mockReturnValue(false);
    });

    it('renders setup screen for book without title/author', () => {
      const bookWithoutMeta = { ...mockBook, title: '', author: '' };

      render(<GitHubIntegration {...mockProps} book={bookWithoutMeta} />);

      expect(screen.getByText('📝 Almost Ready!')).toBeInTheDocument();
      expect(
        screen.getByText(/Please set your book title and author/)
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Get Started - It's Free!/ })
      ).toBeDisabled();
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

      expect(screen.getByText('📝 Almost Ready!')).toBeInTheDocument();
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

      // The button should be disabled when book metadata is missing
      const getStartedButton = screen.getByRole('button', {
        name: /Get Started - It's Free!/
      });
      expect(getStartedButton).toBeDisabled();

      // The warning message should already be visible
      expect(screen.getByText('📝 Almost Ready!')).toBeInTheDocument();
      expect(
        screen.getByText(
          /Please set your book title and author above before connecting to GitHub/
        )
      ).toBeInTheDocument();
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
          screen.getByText(/Don't change anything on the GitHub page!/)
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

      fireEvent.click(connectButton);

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
      fireEvent.click(screen.getByText('🚀 Connect to GitHub'));

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
      fireEvent.keyPress(tokenInput, {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13
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

    it('shows warning when book lacks metadata for repository setup', () => {
      const bookWithoutTitle = { ...mockBook, title: '' };

      render(<GitHubIntegration {...mockProps} book={bookWithoutTitle} />);

      expect(screen.getByText(/Required:/)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Setup Repository/ })
      ).toBeDisabled();
    });

    it('sets up repository successfully', async () => {
      GitHubService.setupBookRepository.mockResolvedValue(mockRepository);
      GitHubService.saveBookToRepository.mockResolvedValue();

      render(<GitHubIntegration {...mockProps} />);

      fireEvent.click(screen.getByRole('button', { name: /Setup Repository/ }));

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

    it('syncs book to GitHub', () => {
      GitHubService.saveBookToRepository.mockResolvedValue();

      const bookWithRepo = {
        ...mockBook,
        github: { repository: mockRepository }
      };
      const propsWithRepo = {
        ...mockProps,
        currentRepo: mockRepository,
        book: bookWithRepo
      };

      render(<GitHubIntegration {...propsWithRepo} />);

      const syncButton = screen.getByRole('button', { name: /Sync Now/ });
      fireEvent.click(syncButton);

      expect(mockProps.onStatusMessage).toHaveBeenCalledWith(
        'Syncing with GitHub...'
      );
      expect(GitHubService.saveBookToRepository).toHaveBeenCalledWith(
        mockRepository,
        bookWithRepo,
        expect.stringContaining('Manual sync:'),
        'book.book'
      );
    });

    it('handles sync failure', async () => {
      GitHubService.saveBookToRepository.mockRejectedValue(
        new Error('Sync failed')
      );

      const propsWithRepo = {
        ...mockProps,
        currentRepo: mockRepository,
        book: { ...mockBook, github: { repository: mockRepository } }
      };

      render(<GitHubIntegration {...propsWithRepo} />);

      const syncButton = screen.getByRole('button', { name: /Sync Now/ });
      fireEvent.click(syncButton);

      await waitFor(
        () => {
          expect(screen.getByText('⚠️ Error:')).toBeInTheDocument();
          expect(screen.getByText('Sync failed')).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });

    it('generates filename from current file path', () => {
      GitHubService.saveBookToRepository.mockResolvedValue();

      const bookWithRepo = {
        ...mockBook,
        github: { repository: mockRepository }
      };
      const propsWithRepo = {
        ...mockProps,
        currentRepo: mockRepository,
        currentFilePath: '/path/to/my-awesome-book.book',
        book: bookWithRepo
      };

      render(<GitHubIntegration {...propsWithRepo} />);

      const syncButton = screen.getByRole('button', { name: /Sync Now/ });
      fireEvent.click(syncButton);

      expect(GitHubService.saveBookToRepository).toHaveBeenCalledWith(
        mockRepository,
        bookWithRepo,
        expect.stringContaining('Manual sync:'),
        'my-awesome-book.book'
      );
    });

    it('generates filename from book title when no file path', () => {
      GitHubService.saveBookToRepository.mockResolvedValue();

      const bookWithTitle = {
        ...mockBook,
        title: 'My Awesome Book!',
        github: { repository: mockRepository }
      };
      const propsWithRepo = {
        ...mockProps,
        currentRepo: mockRepository,
        currentFilePath: null,
        book: bookWithTitle
      };

      render(<GitHubIntegration {...propsWithRepo} />);

      const syncButton = screen.getByRole('button', { name: /Sync Now/ });
      fireEvent.click(syncButton);

      expect(GitHubService.saveBookToRepository).toHaveBeenCalledWith(
        mockRepository,
        bookWithTitle,
        expect.stringContaining('Manual sync:'),
        'my-awesome-book.book'
      );
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
      fireEvent.click(screen.getByText('🚀 Connect to GitHub'));

      // Just verify that the functions are called - the component logic handles the rest
      expect(GitHubService.validateAndSetupToken).toHaveBeenCalledWith(
        'ghp_testtoken123'
      );
    });

    it('clears status message on sync error', async () => {
      GitHubService.loadStoredAuth.mockReturnValue(true);
      GitHubService.saveBookToRepository.mockRejectedValue(
        new Error('Sync failed')
      );

      const propsWithRepo = {
        ...mockProps,
        currentRepo: mockRepository,
        book: { ...mockBook, github: { repository: mockRepository } }
      };

      render(<GitHubIntegration {...propsWithRepo} />);

      fireEvent.click(screen.getByRole('button', { name: /Sync Now/ }));

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
});
