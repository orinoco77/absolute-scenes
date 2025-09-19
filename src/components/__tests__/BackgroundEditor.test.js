/* eslint-disable testing-library/no-wait-for-multiple-assertions */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import BackgroundEditor from '../BackgroundEditor';

const mockDocument = {
  id: 'doc-1',
  title: 'Character Backstory',
  content: 'This is detailed information about the main character.',
  created: '2024-01-01T00:00:00.000Z',
  modified: '2024-01-01T12:00:00.000Z'
};

const mockTemplate = {
  fontFamily: 'Georgia',
  fontSize: 14,
  lineHeight: 1.8
};

const mockFunctions = {
  onDocumentUpdate: jest.fn()
};

const renderComponent = (props = {}) =>
  render(
    <BackgroundEditor
      document={mockDocument}
      template={mockTemplate}
      {...mockFunctions}
      {...props}
    />
  );

describe('BackgroundEditor Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders with document title and content', () => {
    renderComponent();

    expect(screen.getByDisplayValue('Character Backstory')).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(
        'This is detailed information about the main character.'
      )
    ).toBeInTheDocument();
  });

  test('renders no document selected state when document is null', () => {
    renderComponent({ document: null });

    expect(screen.getByText('No Document Selected')).toBeInTheDocument();
    expect(
      screen.getByText(/Select a background document from the folders/)
    ).toBeInTheDocument();
  });

  test('updates title when user types', async () => {
    renderComponent();

    const titleInput = screen.getByDisplayValue('Character Backstory');
    fireEvent.change(titleInput, {
      target: { value: 'Updated Character Info' }
    });

    expect(titleInput.value).toBe('Updated Character Info');

    // Should call onDocumentUpdate after debounce delay
    await waitFor(
      () => {
        expect(mockFunctions.onDocumentUpdate).toHaveBeenCalledWith('doc-1', {
          title: 'Updated Character Info'
        });
      },
      { timeout: 1000 }
    );
  });

  test('updates content when user types', async () => {
    renderComponent();

    const contentTextarea = screen.getByDisplayValue(
      'This is detailed information about the main character.'
    );
    fireEvent.change(contentTextarea, {
      target: { value: 'Updated content with more details.' }
    });

    expect(contentTextarea.value).toBe('Updated content with more details.');

    // Should call onDocumentUpdate after debounce delay
    await waitFor(
      () => {
        expect(mockFunctions.onDocumentUpdate).toHaveBeenCalledWith('doc-1', {
          content: 'Updated content with more details.'
        });
      },
      { timeout: 1000 }
    );
  });

  test('renders formatting toolbar with buttons', () => {
    renderComponent();

    expect(screen.getByTitle('Bold (Ctrl+B)')).toBeInTheDocument();
    expect(screen.getByTitle('Italic (Ctrl+I)')).toBeInTheDocument();
    expect(screen.getByTitle('Section Heading')).toBeInTheDocument();
    expect(screen.getByTitle('Bullet Point')).toBeInTheDocument();
    expect(screen.getByTitle('Horizontal Rule')).toBeInTheDocument();
  });

  test('applies correct template font styling to title input', () => {
    renderComponent();

    const titleInput = screen.getByDisplayValue('Character Backstory');

    expect(titleInput).toHaveStyle({
      fontFamily: 'var(--font-family-primary)',
      fontSize: '18px' // fontSize + 4
    });
  });

  test('main textarea uses consistent CSS styling (no inline fonts)', () => {
    renderComponent();

    const textarea = screen.getByDisplayValue(
      'This is detailed information about the main character.'
    );

    // Should NOT have inline font styles (for consistency with other editors)
    expect(textarea).not.toHaveStyle({
      fontFamily: 'Georgia'
    });

    // Should use the CSS class instead
    expect(textarea).toHaveClass('background-content-textarea');
  });

  test('handles empty document content', () => {
    const emptyDocument = {
      ...mockDocument,
      content: ''
    };

    renderComponent({ document: emptyDocument });

    expect(screen.getByText(/Words: 0/)).toBeInTheDocument();
    expect(screen.getByText(/Characters: 0/)).toBeInTheDocument();
  });

  test('updates local state when document prop changes', () => {
    const { rerender } = renderComponent();

    const newDocument = {
      ...mockDocument,
      id: 'doc-2',
      title: 'New Document',
      content: 'New content here.'
    };

    rerender(
      <BackgroundEditor
        document={newDocument}
        template={mockTemplate}
        {...mockFunctions}
      />
    );

    expect(screen.getByDisplayValue('New Document')).toBeInTheDocument();
    expect(screen.getByDisplayValue('New content here.')).toBeInTheDocument();
  });

  test('clears content when document becomes null', () => {
    const { rerender } = renderComponent();

    rerender(
      <BackgroundEditor
        document={null}
        template={mockTemplate}
        {...mockFunctions}
      />
    );

    expect(screen.getByText('No Document Selected')).toBeInTheDocument();
  });

  test('debounces updates correctly', async () => {
    renderComponent();

    const titleInput = screen.getByDisplayValue('Character Backstory');

    // Type multiple times quickly
    fireEvent.change(titleInput, { target: { value: 'A' } });
    fireEvent.change(titleInput, { target: { value: 'AB' } });
    fireEvent.change(titleInput, { target: { value: 'ABC' } });

    // Should only call onDocumentUpdate once after debounce
    await waitFor(
      () => {
        expect(mockFunctions.onDocumentUpdate).toHaveBeenCalledTimes(1);
        expect(mockFunctions.onDocumentUpdate).toHaveBeenCalledWith('doc-1', {
          title: 'ABC'
        });
      },
      { timeout: 1000 }
    );
  });

  test('shows helpful placeholder text', () => {
    const emptyDocument = {
      ...mockDocument,
      content: ''
    };

    renderComponent({ document: emptyDocument });

    const textarea = screen.getByPlaceholderText(
      /Write your background information here/
    );
    expect(textarea).toBeInTheDocument();

    // Check that it includes helpful suggestions
    expect(textarea.placeholder).toContain('World-building details');
    expect(textarea.placeholder).toContain('Character backstories');
    expect(textarea.placeholder).toContain('Plot development notes');
  });
});
