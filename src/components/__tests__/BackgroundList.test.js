/* eslint-disable testing-library/no-node-access */
/* eslint-disable testing-library/no-wait-for-side-effects */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import BackgroundList from '../BackgroundList';

// Mock folder/document data
const mockFolders = [
  {
    id: 'default-bg',
    title: 'General Notes',
    documents: [
      {
        id: 'doc-1',
        title: 'Character Backstory',
        content: 'This is about the main character.',
        created: '2024-01-01T00:00:00.000Z',
        modified: '2024-01-01T12:00:00.000Z'
      },
      {
        id: 'doc-2',
        title: 'World Building',
        content: 'Details about the fantasy world with magic systems.',
        created: '2024-01-02T00:00:00.000Z',
        modified: '2024-01-02T12:00:00.000Z'
      }
    ]
  },
  {
    id: 'folder-2',
    title: 'Research Notes',
    documents: [
      {
        id: 'doc-3',
        title: 'Historical Research',
        content: 'Medieval history notes for accuracy.',
        created: '2024-01-03T00:00:00.000Z',
        modified: '2024-01-03T12:00:00.000Z'
      }
    ]
  }
];

const mockEmptyFolder = [
  {
    id: 'empty-folder',
    title: 'Empty Folder',
    documents: []
  }
];

const mockFunctions = {
  onDocumentSelect: jest.fn(),
  onFolderSelect: jest.fn(),
  onDocumentAdd: jest.fn(),
  onFolderAdd: jest.fn(),
  onDocumentDelete: jest.fn(),
  onDocumentUpdate: jest.fn(),
  onFolderDelete: jest.fn(),
  onFolderUpdate: jest.fn(),
  onReorderFolders: jest.fn(),
  onReorderDocumentsInFolder: jest.fn(),
  onMoveDocumentBetweenFolders: jest.fn(),
  onToggleRecycleBin: jest.fn(),
  onRestoreFromRecycleBin: jest.fn(),
  onPermanentlyDelete: jest.fn(),
  onEmptyRecycleBin: jest.fn()
};

const defaultProps = {
  folders: mockFolders,
  currentFolderId: 'default-bg',
  documents: mockFolders[0].documents,
  showRecycleBin: false,
  recycleBin: [],
  ...mockFunctions
};

const renderComponent = (props = {}) =>
  render(<BackgroundList {...defaultProps} {...props} />);

describe('BackgroundList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders background list with folders and documents', () => {
    renderComponent();
    expect(screen.getByText('Background Info')).toBeInTheDocument();
    expect(screen.getAllByText('General Notes')).toHaveLength(2); // header & folder list
    expect(screen.getByText('Research Notes')).toBeInTheDocument();
    expect(screen.getByText('Character Backstory')).toBeInTheDocument();
    expect(screen.getByText('World Building')).toBeInTheDocument();
  });

  test('shows folder stats correctly', () => {
    renderComponent();
    expect(screen.getByText('2 docs')).toBeInTheDocument();
    expect(screen.getByText(/14 words/)).toBeInTheDocument(); // 6 + 8 words
  });

  test('expands folder by default for current folder', () => {
    renderComponent();
    expect(screen.getByText('Character Backstory')).toBeInTheDocument();
    expect(screen.getByText('World Building')).toBeInTheDocument();
  });

  test('calls onDocumentSelect when document is clicked', () => {
    renderComponent();
    fireEvent.click(screen.getByText('Character Backstory'));
    expect(mockFunctions.onDocumentSelect).toHaveBeenCalledWith('doc-1');
  });

  test('calls onFolderSelect when folder is clicked', () => {
    renderComponent();
    fireEvent.click(screen.getByText('Research Notes'));
    expect(mockFunctions.onFolderSelect).toHaveBeenCalledWith('folder-2');
  });

  test('calls onDocumentAdd when add document button is clicked', () => {
    renderComponent();
    fireEvent.click(screen.getByText('+ Document'));
    expect(mockFunctions.onDocumentAdd).toHaveBeenCalled();
  });

  test('calls onFolderAdd when add folder button is clicked', () => {
    renderComponent();
    fireEvent.click(screen.getByText('+ Folder'));
    expect(mockFunctions.onFolderAdd).toHaveBeenCalled();
  });

  test('disables add document button when no folder is selected', () => {
    renderComponent({ currentFolderId: null });
    expect(screen.getByText('+ Document')).toBeDisabled();
  });

  test('enables document title editing on double-click', async () => {
    renderComponent();
    fireEvent.doubleClick(screen.getByText('Character Backstory'));
    await waitFor(() => {
      expect(
        screen.getByDisplayValue('Character Backstory')
      ).toBeInTheDocument();
    });
  });

  test('calls onDocumentUpdate when document title is edited', async () => {
    renderComponent();
    fireEvent.doubleClick(screen.getByText('Character Backstory'));
    await waitFor(() => {
      const input = screen.getByDisplayValue('Character Backstory');
      fireEvent.change(input, { target: { value: 'Updated Backstory' } });
      fireEvent.blur(input);
    });
    expect(mockFunctions.onDocumentUpdate).toHaveBeenCalledWith('doc-1', {
      title: 'Updated Backstory'
    });
  });

  test('saves document title on Enter key', async () => {
    renderComponent();
    fireEvent.doubleClick(screen.getByText('Character Backstory'));
    await waitFor(() => {
      const input = screen.getByDisplayValue('Character Backstory');
      fireEvent.change(input, { target: { value: 'Updated via Enter' } });
      fireEvent.keyDown(input, { key: 'Enter' });
    });
    expect(mockFunctions.onDocumentUpdate).toHaveBeenCalledWith('doc-1', {
      title: 'Updated via Enter'
    });
  });

  test('cancels document title editing on Escape key', async () => {
    renderComponent();
    fireEvent.doubleClick(screen.getByText('Character Backstory'));
    await waitFor(() => {
      const input = screen.getByDisplayValue('Character Backstory');
      fireEvent.change(input, {
        target: { value: 'This should be cancelled' }
      });
      fireEvent.keyDown(input, { key: 'Escape' });
    });
    expect(mockFunctions.onDocumentUpdate).not.toHaveBeenCalled();
    expect(screen.getByText('Character Backstory')).toBeInTheDocument();
  });

  test('enables folder title editing on double-click', async () => {
    renderComponent();
    fireEvent.doubleClick(
      screen.getAllByTitle('Click to select folder, double-click to rename')[0]
    );
    await waitFor(() => {
      expect(screen.getByDisplayValue('General Notes')).toBeInTheDocument();
    });
  });

  test('calls onFolderUpdate when folder title is edited', async () => {
    renderComponent();
    fireEvent.doubleClick(
      screen.getAllByTitle('Click to select folder, double-click to rename')[0]
    );
    await waitFor(() => {
      const input = screen.getByDisplayValue('General Notes');
      fireEvent.change(input, { target: { value: 'Updated Folder Name' } });
      fireEvent.blur(input);
    });
    expect(mockFunctions.onFolderUpdate).toHaveBeenCalledWith('default-bg', {
      title: 'Updated Folder Name'
    });
  });

  test('shows empty folder message when folder has no documents', () => {
    renderComponent({
      folders: mockEmptyFolder,
      currentFolderId: 'empty-folder'
    });
    expect(
      screen.getAllByText(
        'No documents in this folder yet.Click "+ Document" to add one.'
      )[0]
    ).toBeInTheDocument();
  });

  test('shows empty state when no folders exist', () => {
    renderComponent({ folders: [] });
    expect(screen.getByText(/No background folders yet/)).toBeInTheDocument();
    expect(
      screen.getByText(/Create your first folder to start organizing/)
    ).toBeInTheDocument();
  });

  test('calls onDocumentDelete when delete document button is clicked', () => {
    renderComponent();
    const deleteButtons = screen.getAllByTitle('Delete document');
    fireEvent.click(deleteButtons[0]);
    expect(mockFunctions.onDocumentDelete).toHaveBeenCalledWith('doc-1');
  });

  test('toggles folder expansion when folder toggle is clicked', () => {
    renderComponent();
    const toggleButton = screen.getAllByTitle(
      /Collapse folder|Expand folder/
    )[0];
    fireEvent.click(toggleButton);
    expect(screen.queryByText('Character Backstory')).not.toBeInTheDocument();
  });

  test('shows recycle bin when showRecycleBin is true', () => {
    const recycleBin = [
      {
        id: 'recycled-1',
        type: 'document',
        item: { title: 'Deleted Document' },
        originalFolderTitle: 'General Notes',
        deletedAt: '2024-01-01T12:00:00.000Z'
      }
    ];
    renderComponent({ recycleBin, showRecycleBin: true });
    expect(screen.getByText('Recycle Bin')).toBeInTheDocument();
    expect(screen.getByText('📄 Deleted Document')).toBeInTheDocument();
  });

  test('calls onToggleRecycleBin when recycle bin button is clicked', () => {
    renderComponent();
    fireEvent.click(screen.getByTitle('Toggle recycle bin'));
    expect(mockFunctions.onToggleRecycleBin).toHaveBeenCalled();
  });

  test('highlights active folder', async () => {
    renderComponent();
    const activeFolder = screen
      .getAllByTitle('Click to select folder, double-click to rename')[0]
      .closest('.chapter-header');
    await expect(activeFolder).toHaveClass('active-chapter');
  });

  test('shows word count for individual documents', () => {
    renderComponent();
    expect(screen.getByText(/6\s+words/)).toBeInTheDocument();
    expect(screen.getByText(/8\s+words/)).toBeInTheDocument();
  });

  test('shows document modification dates', async () => {
    renderComponent();
    await expect(screen.getByText('01/01/2024')).toBeInTheDocument();
    await expect(screen.getByText('02/01/2024')).toBeInTheDocument();
  });

  test('handles document title input layout correctly', async () => {
    renderComponent();
    fireEvent.doubleClick(screen.getByText('Character Backstory'));
    await waitFor(() => {
      const input = screen.getByDisplayValue('Character Backstory');
      expect(input).toHaveStyle({
        width: '100%',
        maxWidth: 'calc(100% - 10px)',
        marginRight: '10px',
        boxSizing: 'border-box'
      });
    });
  });

  test('auto-expands current folder when it changes', () => {
    const { rerender } = renderComponent({ currentFolderId: 'folder-2' });
    expect(screen.getByText('Historical Research')).toBeInTheDocument();
    rerender(<BackgroundList {...defaultProps} />);
    expect(screen.getByText('Character Backstory')).toBeInTheDocument();
    expect(screen.getByText('World Building')).toBeInTheDocument();
  });
});
