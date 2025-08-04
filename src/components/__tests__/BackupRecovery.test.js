import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { saveRecoveredBook } from '../../utils/fileOperations';
import GitHubService from '../../utils/gitHubService';
import BackupRecovery from '../BackupRecovery';

jest.mock('../../utils/gitHubService');
jest.mock('../../utils/fileOperations');

const mockProps = {
  onClose: jest.fn(),
  onBookRecovered: jest.fn(),
  onStatusMessage: jest.fn()
};

const mockRepositories = [
  {
    id: 1,
    name: 'test-book',
    description: 'A test book repository',
    updated_at: '2023-01-01T12:00:00Z',
    bookFile: { name: 'test-book.book' }
  },
  {
    id: 2,
    name: 'another-book',
    description: null,
    updated_at: '2023-02-01T12:00:00Z',
    bookFile: { name: 'another-book.book' }
  }
];

const mockBookData = {
  bookData: { title: 'Test Book', author: 'Test Author' },
  filename: 'test-book.book'
};

describe('BackupRecovery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    GitHubService.loadStoredAuth = jest.fn();
    GitHubService.getUserRepositories = jest.fn();
    GitHubService.downloadBookFromRepository = jest.fn();
    saveRecoveredBook.mockImplementation(() => ({
      success: true,
      filePath: '/path/to/book.book'
    }));
  });

  describe('when not authenticated', () => {
    beforeEach(() => {
      GitHubService.loadStoredAuth.mockReturnValue(false);
    });

    it('renders authentication required message', () => {
      render(<BackupRecovery {...mockProps} />);

      expect(
        screen.getByText('GitHub Authentication Required')
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'You need to be connected to GitHub to access your book backups.'
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText('🔗 Connect to GitHub First')
      ).toBeInTheDocument();
    });

    it('calls onClose when cancel button is clicked', () => {
      render(<BackupRecovery {...mockProps} />);

      fireEvent.click(screen.getByText('Cancel'));
      expect(mockProps.onClose).toHaveBeenCalled();
    });

    it('calls onClose when close button is clicked', () => {
      render(<BackupRecovery {...mockProps} />);

      fireEvent.click(screen.getByText('×'));
      expect(mockProps.onClose).toHaveBeenCalled();
    });

    it('calls onClose when connect button is clicked', () => {
      render(<BackupRecovery {...mockProps} />);

      fireEvent.click(screen.getByText('🔗 Connect to GitHub First'));
      expect(mockProps.onClose).toHaveBeenCalled();
    });
  });

  describe('when authenticated', () => {
    beforeEach(() => {
      GitHubService.loadStoredAuth.mockReturnValue(true);
    });

    it('loads repositories on mount', async () => {
      GitHubService.getUserRepositories.mockResolvedValue(mockRepositories);

      render(<BackupRecovery {...mockProps} />);

      await waitFor(() => {
        expect(GitHubService.getUserRepositories).toHaveBeenCalled();
      });
    });

    it('displays loading message while fetching repositories', async () => {
      GitHubService.getUserRepositories.mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(() => resolve(mockRepositories), 100)
          )
      );

      render(<BackupRecovery {...mockProps} />);

      expect(
        screen.getByText('Loading your repositories...')
      ).toBeInTheDocument();
      expect(mockProps.onStatusMessage).toHaveBeenCalledWith(
        'Loading repositories...'
      );

      await waitFor(() => {
        expect(
          screen.queryByText('Loading your repositories...')
        ).not.toBeInTheDocument();
      });
    });

    it('displays repositories when loaded successfully', async () => {
      GitHubService.getUserRepositories.mockResolvedValue(mockRepositories);

      render(<BackupRecovery {...mockProps} />);

      await waitFor(() => {
        expect(screen.getAllByText(/test-book/).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/another-book/).length).toBeGreaterThan(0);
      });

      expect(screen.getAllByText('File:').length).toBeGreaterThan(0);
      expect(screen.getByText('test-book.book')).toBeInTheDocument();
      expect(screen.getByText('another-book.book')).toBeInTheDocument();
      expect(screen.getByText('A test book repository')).toBeInTheDocument();
    });

    it('displays no backups found message when no repositories', async () => {
      GitHubService.getUserRepositories.mockResolvedValue([]);

      render(<BackupRecovery {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('No Book Backups Found')).toBeInTheDocument();
        expect(
          screen.getByText(
            "We couldn't find any repositories containing .book files in your GitHub account."
          )
        ).toBeInTheDocument();
      });
    });

    it('displays error message when repository loading fails', async () => {
      const errorMessage = 'Network error';
      GitHubService.getUserRepositories.mockRejectedValue(
        new Error(errorMessage)
      );

      render(<BackupRecovery {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('⚠️ Error:')).toBeInTheDocument();
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('formats dates correctly', async () => {
      GitHubService.getUserRepositories.mockResolvedValue(mockRepositories);

      render(<BackupRecovery {...mockProps} />);

      await waitFor(() => {
        const expectedDate = new Date(
          '2023-01-01T12:00:00Z'
        ).toLocaleDateString();
        expect(
          screen.getByText(`Updated: ${expectedDate}`)
        ).toBeInTheDocument();
      });
    });

    describe('downloading books', () => {
      beforeEach(() => {
        GitHubService.getUserRepositories.mockResolvedValue(mockRepositories);
        GitHubService.downloadBookFromRepository.mockResolvedValue(
          mockBookData
        );
      });

      it('downloads book successfully', async () => {
        render(<BackupRecovery {...mockProps} />);

        await waitFor(() => {
          expect(screen.getByText('📖 test-book')).toBeInTheDocument();
        });

        const downloadButton = screen.getAllByText('📥 Download')[0];
        fireEvent.click(downloadButton);

        expect(mockProps.onStatusMessage).toHaveBeenCalledWith(
          'Downloading from GitHub...'
        );

        await waitFor(() => {
          expect(GitHubService.downloadBookFromRepository).toHaveBeenCalledWith(
            mockRepositories[0],
            mockRepositories[0].bookFile
          );
          expect(saveRecoveredBook).toHaveBeenCalledWith(
            mockBookData.bookData,
            mockBookData.filename
          );
          expect(mockProps.onBookRecovered).toHaveBeenCalledWith(
            '/path/to/book.book',
            mockBookData.bookData
          );
          expect(mockProps.onClose).toHaveBeenCalled();
        });
      });

      it('shows downloading state during download', async () => {
        GitHubService.downloadBookFromRepository.mockImplementation(
          () =>
            new Promise(resolve => setTimeout(() => resolve(mockBookData), 100))
        );

        render(<BackupRecovery {...mockProps} />);

        await waitFor(() => {
          expect(screen.getAllByText(/test-book/).length).toBeGreaterThan(0);
        });

        const downloadButton = screen.getAllByText(/Download/)[0];
        fireEvent.click(downloadButton);

        expect(screen.getAllByText('📥 Downloading...').length).toBeGreaterThan(
          0
        );

        await waitFor(() => {
          expect(
            screen.queryByText('📥 Downloading...')
          ).not.toBeInTheDocument();
        });
      });

      it('handles download failure', async () => {
        const errorMessage = 'Download failed';
        GitHubService.downloadBookFromRepository.mockRejectedValue(
          new Error(errorMessage)
        );

        render(<BackupRecovery {...mockProps} />);

        await waitFor(() => {
          expect(screen.getAllByText(/test-book/).length).toBeGreaterThan(0);
        });

        const downloadButton = screen.getAllByText(/Download/)[0];
        fireEvent.click(downloadButton);

        await waitFor(() => {
          expect(screen.getByText('⚠️ Error:')).toBeInTheDocument();
          expect(screen.getByText('Download failed')).toBeInTheDocument();
        });
      });

      it('handles save failure', async () => {
        saveRecoveredBook.mockResolvedValue({
          success: false,
          error: 'Save failed'
        });

        render(<BackupRecovery {...mockProps} />);

        await waitFor(() => {
          expect(screen.getAllByText(/test-book/).length).toBeGreaterThan(0);
        });

        const downloadButton = screen.getAllByText(/Download/)[0];
        fireEvent.click(downloadButton);

        await waitFor(() => {
          expect(screen.getByText('⚠️ Error:')).toBeInTheDocument();
          expect(screen.getByText('Save failed')).toBeInTheDocument();
        });
      });

      it('disables download buttons when downloading', async () => {
        GitHubService.downloadBookFromRepository.mockImplementation(
          () =>
            new Promise(resolve => setTimeout(() => resolve(mockBookData), 100))
        );

        render(<BackupRecovery {...mockProps} />);

        await waitFor(() => {
          expect(screen.getByText('📖 test-book')).toBeInTheDocument();
        });

        const downloadButtons = screen.getAllByText('📥 Download');
        fireEvent.click(downloadButtons[0]);

        downloadButtons.forEach(button => {
          expect(button).toBeDisabled();
        });
      });
    });

    describe('refresh functionality', () => {
      beforeEach(() => {
        GitHubService.getUserRepositories.mockResolvedValue(mockRepositories);
      });

      it('shows refresh button when repositories are loaded', async () => {
        render(<BackupRecovery {...mockProps} />);

        await waitFor(() => {
          expect(screen.getByText('🔄 Refresh')).toBeInTheDocument();
        });
      });

      it('reloads repositories when refresh is clicked', async () => {
        render(<BackupRecovery {...mockProps} />);

        await waitFor(() => {
          expect(screen.getByText('🔄 Refresh')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('🔄 Refresh'));

        expect(GitHubService.getUserRepositories).toHaveBeenCalledTimes(2);
      });

      it('disables refresh button while loading', async () => {
        GitHubService.getUserRepositories.mockImplementation(
          () =>
            new Promise(resolve =>
              setTimeout(() => resolve(mockRepositories), 100)
            )
        );

        render(<BackupRecovery {...mockProps} />);

        await waitFor(() => {
          expect(screen.getByText('🔄 Refresh')).toBeInTheDocument();
        });

        const refreshButton = screen.getByText('🔄 Refresh');
        fireEvent.click(refreshButton);

        expect(refreshButton).toBeDisabled();
      });
    });

    it('shows helpful tip when repositories are available', async () => {
      GitHubService.getUserRepositories.mockResolvedValue(mockRepositories);

      render(<BackupRecovery {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('💡 Tip:')).toBeInTheDocument();
        expect(
          screen.getByText(/Downloaded books will be saved to your computer/)
        ).toBeInTheDocument();
      });
    });

    it('calls onClose when close button is clicked', async () => {
      GitHubService.getUserRepositories.mockResolvedValue(mockRepositories);

      render(<BackupRecovery {...mockProps} />);

      fireEvent.click(screen.getByText('Close'));
      expect(mockProps.onClose).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      GitHubService.loadStoredAuth.mockReturnValue(true);
    });

    it('clears status message on error', async () => {
      GitHubService.getUserRepositories.mockRejectedValue(
        new Error('Test error')
      );

      render(<BackupRecovery {...mockProps} />);

      await waitFor(() => {
        expect(mockProps.onStatusMessage).toHaveBeenCalledWith('');
      });
    });

    it('clears status message on successful completion', async () => {
      GitHubService.getUserRepositories.mockResolvedValue(mockRepositories);
      GitHubService.downloadBookFromRepository.mockResolvedValue(mockBookData);

      render(<BackupRecovery {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('📖 test-book')).toBeInTheDocument();
      });

      const downloadButton = screen.getAllByText('📥 Download')[0];
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(mockProps.onStatusMessage).toHaveBeenCalledWith('');
      });
    });
  });
});
