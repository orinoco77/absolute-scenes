import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import BackMatterEditor from '../BackMatterEditor';

// Mock date for consistent testing
const mockDate = '2023-12-01T10:00:00.000Z';
const mockDateNow = 1701424800000; // Corresponds to mockDate
const OriginalDate = Date;

beforeAll(() => {
  global.Date = class extends OriginalDate {
    constructor(...args) {
      if (args.length) {
        super(...args);
      } else {
        super(mockDateNow);
      }
    }

    toISOString() {
      return mockDate;
    }

    static now() {
      return mockDateNow;
    }
  };
});

afterAll(() => {
  global.Date = OriginalDate;
});

describe('BackMatterEditor', () => {
  const mockOnBackMatterUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when no back matter item is selected', () => {
    it('displays the no selection message', () => {
      render(
        <BackMatterEditor
          backMatterItem={null}
          onBackMatterUpdate={mockOnBackMatterUpdate}
        />
      );

      expect(
        screen.getByText('📑 No Back Matter Selected')
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Select a back matter section/)
      ).toBeInTheDocument();
    });

    it('displays available back matter types', () => {
      render(
        <BackMatterEditor
          backMatterItem={null}
          onBackMatterUpdate={mockOnBackMatterUpdate}
        />
      );

      expect(screen.getByText('Epilogue:')).toBeInTheDocument();
      expect(screen.getByText('Acknowledgments:')).toBeInTheDocument();
      expect(screen.getByText('Appendix:')).toBeInTheDocument();
      expect(screen.getByText('Glossary:')).toBeInTheDocument();
      expect(screen.getByText('Bibliography:')).toBeInTheDocument();
      expect(screen.getByText('Index:')).toBeInTheDocument();
      expect(screen.getByText('About the Author:')).toBeInTheDocument();
    });
  });

  describe('when a back matter item is selected', () => {
    const mockBackMatterItem = {
      id: 'epilogue-123',
      type: 'epilogue',
      title: 'Epilogue',
      content: 'This is the end of the story...',
      enabled: true,
      created: '2023-11-01T10:00:00.000Z',
      modified: '2023-11-01T10:00:00.000Z'
    };

    it('displays the back matter editor', () => {
      render(
        <BackMatterEditor
          backMatterItem={mockBackMatterItem}
          onBackMatterUpdate={mockOnBackMatterUpdate}
        />
      );

      expect(screen.getByDisplayValue('Epilogue')).toBeInTheDocument();
      expect(
        screen.getByDisplayValue('This is the end of the story...')
      ).toBeInTheDocument();
      expect(screen.getByText('🎬')).toBeInTheDocument(); // Epilogue icon
    });

    it('updates title when changed', () => {
      render(
        <BackMatterEditor
          backMatterItem={mockBackMatterItem}
          onBackMatterUpdate={mockOnBackMatterUpdate}
        />
      );

      const titleInput = screen.getByDisplayValue('Epilogue');
      fireEvent.change(titleInput, { target: { value: 'Final Thoughts' } });

      expect(mockOnBackMatterUpdate).toHaveBeenCalledWith('epilogue-123', {
        ...mockBackMatterItem,
        title: 'Final Thoughts',
        modified: mockDate
      });
    });

    it('updates content when changed', () => {
      render(
        <BackMatterEditor
          backMatterItem={mockBackMatterItem}
          onBackMatterUpdate={mockOnBackMatterUpdate}
        />
      );

      const contentTextarea = screen.getByDisplayValue(
        'This is the end of the story...'
      );
      fireEvent.change(contentTextarea, {
        target: { value: 'Updated epilogue content' }
      });

      expect(mockOnBackMatterUpdate).toHaveBeenCalledWith('epilogue-123', {
        ...mockBackMatterItem,
        content: 'Updated epilogue content',
        modified: mockDate
      });
    });

    it('displays word count', () => {
      render(
        <BackMatterEditor
          backMatterItem={mockBackMatterItem}
          onBackMatterUpdate={mockOnBackMatterUpdate}
        />
      );

      expect(screen.getByText('Words: 7')).toBeInTheDocument();
    });

    it('displays last modified date', () => {
      render(
        <BackMatterEditor
          backMatterItem={mockBackMatterItem}
          onBackMatterUpdate={mockOnBackMatterUpdate}
        />
      );

      expect(screen.getByText(/Modified:/)).toBeInTheDocument();
    });
  });

  describe('author name replacement', () => {
    const aboutAuthorItem = {
      id: 'about-author-123',
      type: 'about-author',
      title: 'About the Author',
      content: '[Author Name] is a writer who lives in the city.',
      enabled: true,
      created: '2023-11-01T10:00:00.000Z',
      modified: '2023-11-01T10:00:00.000Z'
    };

    it('shows replace author name button when applicable', () => {
      render(
        <BackMatterEditor
          backMatterItem={aboutAuthorItem}
          onBackMatterUpdate={mockOnBackMatterUpdate}
          authorName="John Doe"
        />
      );

      expect(screen.getByText('🔄 Replace Author Name')).toBeInTheDocument();
    });

    it('replaces author name when button is clicked', () => {
      render(
        <BackMatterEditor
          backMatterItem={aboutAuthorItem}
          onBackMatterUpdate={mockOnBackMatterUpdate}
          authorName="John Doe"
        />
      );

      const replaceButton = screen.getByText('🔄 Replace Author Name');
      fireEvent.click(replaceButton);

      expect(mockOnBackMatterUpdate).toHaveBeenCalledWith('about-author-123', {
        ...aboutAuthorItem,
        content: 'John Doe is a writer who lives in the city.',
        modified: mockDate
      });
    });

    it('does not show replace button when no author name placeholder exists', () => {
      const itemWithoutPlaceholder = {
        ...aboutAuthorItem,
        content: 'John Doe is a writer who lives in the city.'
      };

      render(
        <BackMatterEditor
          backMatterItem={itemWithoutPlaceholder}
          onBackMatterUpdate={mockOnBackMatterUpdate}
          authorName="John Doe"
        />
      );

      expect(
        screen.queryByText('🔄 Replace Author Name')
      ).not.toBeInTheDocument();
    });
  });

  describe('epilogue special functionality', () => {
    const epilogueItem = {
      id: 'epilogue-123',
      type: 'epilogue',
      title: 'Epilogue',
      content: 'Content here',
      enabled: true,
      created: '2023-11-01T10:00:00.000Z',
      modified: '2023-11-01T10:00:00.000Z'
    };

    it('shows epilogue help text', () => {
      render(
        <BackMatterEditor
          backMatterItem={epilogueItem}
          onBackMatterUpdate={mockOnBackMatterUpdate}
        />
      );

      expect(
        screen.getByText(/Shift\+Enter: forced line break/)
      ).toBeInTheDocument();
    });

    it('handles Shift+Enter for line breaks', () => {
      render(
        <BackMatterEditor
          backMatterItem={epilogueItem}
          onBackMatterUpdate={mockOnBackMatterUpdate}
        />
      );

      const textarea = screen.getByDisplayValue('Content here');

      // Simulate Shift+Enter key combination
      fireEvent.keyDown(textarea, {
        key: 'Enter',
        shiftKey: true,
        preventDefault: jest.fn()
      });

      // Should prevent default and add newline
      expect(mockOnBackMatterUpdate).toHaveBeenCalled();
    });
  });

  describe('different back matter types', () => {
    const testCases = [
      { type: 'epilogue', icon: '🎬', title: 'Epilogue' },
      { type: 'acknowledgments', icon: '🙏', title: 'Acknowledgments' },
      { type: 'appendix', icon: '📋', title: 'Appendix' },
      { type: 'glossary', icon: '📖', title: 'Glossary' },
      { type: 'bibliography', icon: '📚', title: 'Bibliography' },
      { type: 'index', icon: '🔍', title: 'Index' },
      { type: 'about-author', icon: '👤', title: 'About the Author' }
    ];

    testCases.forEach(({ type, icon, title }) => {
      it(`displays correct icon and title for ${type}`, () => {
        const backMatterItem = {
          id: `${type}-123`,
          type,
          title,
          content: 'Test content',
          enabled: true,
          created: '2023-11-01T10:00:00.000Z',
          modified: '2023-11-01T10:00:00.000Z'
        };

        render(
          <BackMatterEditor
            backMatterItem={backMatterItem}
            onBackMatterUpdate={mockOnBackMatterUpdate}
          />
        );

        expect(screen.getByText(icon)).toBeInTheDocument();
        expect(screen.getByDisplayValue(title)).toBeInTheDocument();
      });
    });
  });

  describe('edge cases', () => {
    it('handles empty content gracefully', () => {
      const emptyItem = {
        id: 'test-123',
        type: 'appendix',
        title: '',
        content: '',
        enabled: true,
        created: '2023-11-01T10:00:00.000Z',
        modified: '2023-11-01T10:00:00.000Z'
      };

      render(
        <BackMatterEditor
          backMatterItem={emptyItem}
          onBackMatterUpdate={mockOnBackMatterUpdate}
        />
      );

      expect(screen.getByText('Words: 0')).toBeInTheDocument();
    });

    it('handles unknown back matter type', () => {
      const unknownItem = {
        id: 'unknown-123',
        type: 'unknown-type',
        title: 'Unknown',
        content: 'Content',
        enabled: true,
        created: '2023-11-01T10:00:00.000Z',
        modified: '2023-11-01T10:00:00.000Z'
      };

      render(
        <BackMatterEditor
          backMatterItem={unknownItem}
          onBackMatterUpdate={mockOnBackMatterUpdate}
        />
      );

      // Should default to appendix configuration
      expect(screen.getByText('📋')).toBeInTheDocument();
    });
  });
});
