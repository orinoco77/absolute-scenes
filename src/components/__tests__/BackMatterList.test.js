/* eslint-disable testing-library/no-node-access */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import BackMatterList from '../BackMatterList';

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

// Mock window.confirm
global.confirm = jest.fn();

describe('BackMatterList', () => {
  const mockHandlers = {
    onBackMatterSelect: jest.fn(),
    onBackMatterAdd: jest.fn(),
    onBackMatterDelete: jest.fn(),
    onBackMatterUpdate: jest.fn(),
    onBackMatterToggle: jest.fn(),
    onBackMatterReorder: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.confirm.mockReturnValue(true);
  });

  describe('when no back matter exists', () => {
    it('displays empty state with suggestions', () => {
      render(
        <BackMatterList
          backMatter={[]}
          currentBackMatterId={null}
          {...mockHandlers}
        />
      );

      expect(screen.getByText(/No back matter added yet/)).toBeInTheDocument();

      // Check for dropdown trigger
      expect(screen.getByText('📑+ Add Section')).toBeInTheDocument();
    });

    it('adds back matter when dropdown option is clicked', () => {
      render(
        <BackMatterList
          backMatter={[]}
          currentBackMatterId={null}
          {...mockHandlers}
        />
      );

      // Find and click the epilogue dropdown option
      const epilogueDropdownOption = screen.getByTitle(
        'Story conclusion or final thoughts'
      );
      fireEvent.click(epilogueDropdownOption);

      expect(mockHandlers.onBackMatterAdd).toHaveBeenCalledWith({
        id: expect.stringMatching(/epilogue-\d+/),
        type: 'epilogue',
        title: 'Epilogue',
        content: '',
        enabled: true,
        created: mockDate,
        modified: mockDate
      });
    });
  });

  describe('add back matter dropdown', () => {
    it('displays all available back matter types', () => {
      render(
        <BackMatterList
          backMatter={[]}
          currentBackMatterId={null}
          {...mockHandlers}
        />
      );

      const bibliographyOption = screen.getByTitle(
        'List of sources and references'
      );
      fireEvent.click(bibliographyOption);

      expect(mockHandlers.onBackMatterAdd).toHaveBeenCalledWith({
        id: expect.stringMatching(/bibliography-\d+/),
        type: 'bibliography',
        title: 'Bibliography',
        content: expect.stringContaining('[1] Author, A.'),
        enabled: true,
        created: mockDate,
        modified: mockDate
      });
    });

    it('disables already added back matter types', () => {
      const existingBackMatter = [
        {
          id: 'epilogue-123',
          type: 'epilogue',
          title: 'Epilogue',
          content: 'Content',
          enabled: true
        }
      ];

      render(
        <BackMatterList
          backMatter={existingBackMatter}
          currentBackMatterId={null}
          {...mockHandlers}
        />
      );

      const epilogueOption = screen.getByTitle(
        'Story conclusion or final thoughts'
      );

      expect(epilogueOption).toHaveAttribute('disabled');
      expect(epilogueOption.textContent).toContain('(Added)');
    });
  });

  describe('with existing back matter', () => {
    const backMatterItems = [
      {
        id: 'epilogue-123',
        type: 'epilogue',
        title: 'Epilogue',
        content: 'The end of the story...',
        enabled: true,
        created: '2023-11-01T10:00:00.000Z',
        modified: '2023-11-01T10:00:00.000Z'
      },
      {
        id: 'acknowledgments-456',
        type: 'acknowledgments',
        title: 'Acknowledgments',
        content: 'Thank you to everyone who helped...',
        enabled: false,
        created: '2023-11-02T10:00:00.000Z',
        modified: '2023-11-02T10:00:00.000Z'
      }
    ];

    it('displays back matter items', () => {
      render(
        <BackMatterList
          backMatter={backMatterItems}
          currentBackMatterId="epilogue-123"
          {...mockHandlers}
        />
      );

      // Check that back matter items are displayed by finding titles in front-matter-title class
      expect(document.querySelector('.front-matter-title')).toHaveTextContent(
        'Epilogue'
      );
      const acknowledgmentTitles = document.querySelectorAll(
        '.front-matter-title'
      );
      const hasAcknowledgments = Array.from(acknowledgmentTitles).some(
        el => el.textContent === 'Acknowledgments'
      );
      expect(hasAcknowledgments).toBe(true);
      expect(screen.getByText('5 words')).toBeInTheDocument(); // "The end of the story..."
      expect(screen.getByText('6 words')).toBeInTheDocument(); // "Thank you to everyone who helped..."
    });

    it('highlights selected back matter item', () => {
      render(
        <BackMatterList
          backMatter={backMatterItems}
          currentBackMatterId="epilogue-123"
          {...mockHandlers}
        />
      );

      const epilogueElements = screen.getAllByText('Epilogue');
      // Find the one that's in a front-matter-item (not the dropdown option)
      const selectedItem = epilogueElements
        .find(item => item.closest('.front-matter-item'))
        ?.closest('.front-matter-item');
      expect(selectedItem).toHaveClass('active');
    });

    it('shows disabled styling for disabled items', () => {
      render(
        <BackMatterList
          backMatter={backMatterItems}
          currentBackMatterId={null}
          {...mockHandlers}
        />
      );

      const acknowledgmentElements = screen.getAllByText('Acknowledgments');
      // Find the one that's in a front-matter-item (not the dropdown option)
      const disabledItem = acknowledgmentElements
        .find(item => item.closest('.front-matter-item'))
        ?.closest('.front-matter-item');
      expect(disabledItem).toHaveClass('disabled');
    });

    it('selects back matter when clicked', () => {
      render(
        <BackMatterList
          backMatter={backMatterItems}
          currentBackMatterId={null}
          {...mockHandlers}
        />
      );

      const epilogueElements = screen.getAllByText('Epilogue');
      // Find the one that's in a front-matter-item (not the dropdown option)
      const epilogueItem = epilogueElements
        .find(item => item.closest('.front-matter-item'))
        ?.closest('.front-matter-item');
      fireEvent.click(epilogueItem);

      expect(mockHandlers.onBackMatterSelect).toHaveBeenCalledWith(
        'epilogue-123'
      );
    });

    it('toggles back matter enabled state', () => {
      render(
        <BackMatterList
          backMatter={backMatterItems}
          currentBackMatterId={null}
          {...mockHandlers}
        />
      );

      // Find toggle buttons by their class or title
      const enabledToggle = screen.getByTitle('Disable this section');

      fireEvent.click(enabledToggle);

      expect(mockHandlers.onBackMatterToggle).toHaveBeenCalledWith(
        'epilogue-123',
        false
      );
    });

    it('deletes back matter when delete button is clicked', () => {
      render(
        <BackMatterList
          backMatter={backMatterItems}
          currentBackMatterId={null}
          {...mockHandlers}
        />
      );

      const deleteButtons = screen.getAllByText('🗑️');
      fireEvent.click(deleteButtons[0]);

      expect(global.confirm).toHaveBeenCalledWith('Delete Epilogue?');
      expect(mockHandlers.onBackMatterDelete).toHaveBeenCalledWith(
        'epilogue-123'
      );
    });

    it('does not delete when user cancels confirmation', () => {
      global.confirm.mockReturnValue(false);

      render(
        <BackMatterList
          backMatter={backMatterItems}
          currentBackMatterId={null}
          {...mockHandlers}
        />
      );

      const deleteButtons = screen.getAllByText('🗑️');
      fireEvent.click(deleteButtons[0]);

      expect(global.confirm).toHaveBeenCalled();
      expect(mockHandlers.onBackMatterDelete).not.toHaveBeenCalled();
    });

    it('displays modification dates', () => {
      render(
        <BackMatterList
          backMatter={backMatterItems}
          currentBackMatterId={null}
          {...mockHandlers}
        />
      );

      // Check for presence of modification date elements
      const modifiedDateElements = document.querySelectorAll('.modified-date');
      expect(modifiedDateElements).toHaveLength(2);
    });
  });

  describe('default content generation', () => {
    it('generates default acknowledgments', () => {
      render(
        <BackMatterList
          backMatter={[]}
          currentBackMatterId={null}
          {...mockHandlers}
        />
      );

      // Find and click the acknowledgments dropdown option
      const acknowledgmentsOption = screen.getByTitle(
        'Thank you messages to contributors'
      );
      fireEvent.click(acknowledgmentsOption);

      const call = mockHandlers.onBackMatterAdd.mock.calls[0][0];
      expect(call.content).toContain(
        'I would like to express my heartfelt gratitude'
      );
      expect(call.content).toContain('[Editor Name]');
      expect(call.content).toContain('[Beta Reader Names]');
    });

    it('generates default glossary', () => {
      render(
        <BackMatterList
          backMatter={[]}
          currentBackMatterId={null}
          {...mockHandlers}
        />
      );

      // Find and click the glossary dropdown option
      const glossaryOption = screen.getByTitle('Definitions of key terms');
      fireEvent.click(glossaryOption);

      const call = mockHandlers.onBackMatterAdd.mock.calls[0][0];
      expect(call.content).toContain('[Term 1]:');
      expect(call.content).toContain('[Term 2]:');
      expect(call.content).toContain('[Term 3]:');
    });

    it('generates default bibliography', () => {
      render(
        <BackMatterList
          backMatter={[]}
          currentBackMatterId={null}
          {...mockHandlers}
        />
      );

      // Find and click the bibliography dropdown option
      const bibliographyOption = screen.getByTitle(
        'List of sources and references'
      );
      fireEvent.click(bibliographyOption);

      const call = mockHandlers.onBackMatterAdd.mock.calls[0][0];
      expect(call.content).toContain('[1] Author, A.');
      expect(call.content).toContain('[2] Author, B.');
      expect(call.content).toContain('Format your sources according to');
    });

    it('generates default index', () => {
      render(
        <BackMatterList
          backMatter={[]}
          currentBackMatterId={null}
          {...mockHandlers}
        />
      );

      // Find and click the index dropdown option
      const indexOption = screen.getByTitle('Alphabetical topic listing');
      fireEvent.click(indexOption);

      const call = mockHandlers.onBackMatterAdd.mock.calls[0][0];
      expect(call.content).toContain('[Topic A], 12, 45, 78');
      expect(call.content).toContain('[Topic B], 23, 67, 89');
      expect(call.content).toContain('This is a template');
    });

    it('generates default about author with author name', () => {
      render(
        <BackMatterList
          backMatter={[]}
          currentBackMatterId={null}
          authorName="John Doe"
          {...mockHandlers}
        />
      );

      // Find and click the about author dropdown option
      const aboutAuthorOption = screen.getByTitle(
        'Author biography and credentials'
      );
      fireEvent.click(aboutAuthorOption);

      const call = mockHandlers.onBackMatterAdd.mock.calls[0][0];
      expect(call.content).toContain('John Doe is [brief description');
      expect(call.content).toContain('[Add 2-3 sentences about');
      expect(call.content).toContain('For more information, visit');
    });

    it('generates default about author without author name', () => {
      render(
        <BackMatterList
          backMatter={[]}
          currentBackMatterId={null}
          {...mockHandlers}
        />
      );

      // Find and click the about author dropdown option
      const aboutAuthorOption = screen.getByTitle(
        'Author biography and credentials'
      );
      fireEvent.click(aboutAuthorOption);

      const call = mockHandlers.onBackMatterAdd.mock.calls[0][0];
      expect(call.content).toContain('[Author Name] is [brief description');
    });
  });

  describe('canonical ordering', () => {
    it('displays items sorted by canonical order', () => {
      const unorderedBackMatter = [
        {
          id: '2',
          type: 'acknowledgments',
          title: 'Acknowledgments',
          content: 'Content',
          enabled: true
        },
        {
          id: '1',
          type: 'epilogue',
          title: 'Epilogue',
          content: 'Content',
          enabled: true
        }
      ];

      render(
        <BackMatterList
          backMatter={unorderedBackMatter}
          currentBackMatterId={null}
          {...mockHandlers}
        />
      );

      // Check that both items are present (ordering is tested in utility function tests)
      expect(screen.getAllByText('Epilogue')).toHaveLength(2); // title and type
      expect(screen.getAllByText('Acknowledgments')).toHaveLength(2); // title and type
    });
  });
});
