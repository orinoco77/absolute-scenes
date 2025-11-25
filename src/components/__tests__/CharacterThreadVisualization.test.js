import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CharacterAnalyzer from '../../utils/characterAnalyzer';
import CharacterThreadVisualization from '../CharacterThreadVisualization';

// Mock CharacterAnalyzer
jest.mock('../../utils/characterAnalyzer');

describe('CharacterThreadVisualization', () => {
  const mockChapters = [
    {
      id: 'chapter-1',
      title: 'Chapter 1',
      scenes: [
        {
          id: 'scene-1',
          title: 'Scene 1',
          content: 'Alice and Bob talked.'
        },
        {
          id: 'scene-2',
          title: 'Scene 2',
          content: 'Alice met Charlie.'
        }
      ]
    },
    {
      id: 'chapter-2',
      title: 'Chapter 2',
      scenes: [
        {
          id: 'scene-3',
          title: 'Scene 3',
          content: 'Bob and Charlie fought.'
        }
      ]
    }
  ];

  const mockCharacters = [
    { id: 'char-1', name: 'Alice' },
    { id: 'char-2', name: 'Bob' }
  ];

  const mockSuccessfulAnalysis = {
    characterPresence: new Map([
      [
        'Alice',
        {
          scenes: new Map([
            ['0-0', { strength: 5 }],
            ['0-1', { strength: 4 }]
          ]),
          isFromCharacterList: true
        }
      ],
      [
        'Bob',
        {
          scenes: new Map([
            ['0-0', { strength: 3 }],
            ['1-0', { strength: 6 }]
          ]),
          isFromCharacterList: true
        }
      ],
      [
        'Charlie',
        {
          scenes: new Map([
            ['0-1', { strength: 2 }],
            ['1-0', { strength: 5 }]
          ]),
          isFromCharacterList: false
        }
      ]
    ]),
    allDetectedCharacters: ['Alice', 'Bob', 'Charlie']
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024
    });
  });

  describe('Successful Analysis', () => {
    beforeEach(() => {
      CharacterAnalyzer.analyzeCharacterPresence.mockReturnValue(
        mockSuccessfulAnalysis
      );
    });

    test('renders character thread visualization when analysis succeeds', () => {
      render(
        <CharacterThreadVisualization
          chapters={mockChapters}
          characters={mockCharacters}
        />
      );

      // Should show the main title
      expect(screen.getByText('Character Thread Analysis')).toBeInTheDocument();

      // Should show character names with their appearance counts
      // Use getAllByText since character names appear in both labels and stats
      expect(screen.getAllByText(/Alice/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Bob/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Charlie/).length).toBeGreaterThan(0);
    });

    test('displays controls for character selection', () => {
      render(
        <CharacterThreadVisualization
          chapters={mockChapters}
          characters={mockCharacters}
        />
      );

      expect(screen.getByText('Show Selected Only')).toBeInTheDocument();
      expect(screen.getByText(/Filter mentions/)).toBeInTheDocument();
    });

    test('shows stats about characters and scenes', () => {
      render(
        <CharacterThreadVisualization
          chapters={mockChapters}
          characters={mockCharacters}
        />
      );

      // Should show stats
      expect(screen.getByText(/3 characters/)).toBeInTheDocument();
      expect(screen.getByText(/3 scenes/)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('displays error message when analysis fails', () => {
      const errorMessage = 'Failed to parse character data';
      CharacterAnalyzer.analyzeCharacterPresence.mockImplementation(() => {
        throw new Error(errorMessage);
      });

      render(
        <CharacterThreadVisualization
          chapters={mockChapters}
          characters={mockCharacters}
        />
      );

      // Should show error title
      expect(
        screen.getByText('❌ Character Analysis Failed')
      ).toBeInTheDocument();

      // Should show the actual error message
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    test('displays default error message when error has no message', () => {
      CharacterAnalyzer.analyzeCharacterPresence.mockImplementation(() => {
        // eslint-disable-next-line no-throw-literal
        throw { someProperty: 'value' }; // Error without message
      });

      render(
        <CharacterThreadVisualization
          chapters={mockChapters}
          characters={mockCharacters}
        />
      );

      expect(
        screen.getByText('❌ Character Analysis Failed')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Unknown error occurred during character analysis')
      ).toBeInTheDocument();
    });

    test('shows retry button when analysis fails', () => {
      CharacterAnalyzer.analyzeCharacterPresence.mockImplementation(() => {
        throw new Error('Analysis failed');
      });

      render(
        <CharacterThreadVisualization
          chapters={mockChapters}
          characters={mockCharacters}
        />
      );

      const retryButton = screen.getByText('🔄 Retry Analysis');
      expect(retryButton).toBeInTheDocument();
      expect(retryButton.tagName).toBe('BUTTON');
    });

    test('shows troubleshooting tips when analysis fails', () => {
      CharacterAnalyzer.analyzeCharacterPresence.mockImplementation(() => {
        throw new Error('Analysis failed');
      });

      render(
        <CharacterThreadVisualization
          chapters={mockChapters}
          characters={mockCharacters}
        />
      );

      expect(screen.getByText('Troubleshooting tips:')).toBeInTheDocument();
      expect(
        screen.getByText(
          /Click "🔄 Retry Analysis" above to try again with the current settings/
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /Check that your scenes contain text content \(not just empty placeholders\)/
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /If retry doesn't work, try adjusting the "Presence Threshold" slider/
        )
      ).toBeInTheDocument();
    });

    test('logs error to console when analysis fails', () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const error = new Error('Test error');
      CharacterAnalyzer.analyzeCharacterPresence.mockImplementation(() => {
        throw error;
      });

      render(
        <CharacterThreadVisualization
          chapters={mockChapters}
          characters={mockCharacters}
        />
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Character analysis failed:',
        error
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Retry Functionality', () => {
    test('retry button clears error and triggers re-analysis', () => {
      CharacterAnalyzer.analyzeCharacterPresence.mockImplementation(() => {
        throw new Error('Analysis failed');
      });

      render(
        <CharacterThreadVisualization
          chapters={mockChapters}
          characters={mockCharacters}
        />
      );

      // First render should show error
      expect(
        screen.getByText('❌ Character Analysis Failed')
      ).toBeInTheDocument();

      const initialCallCount =
        CharacterAnalyzer.analyzeCharacterPresence.mock.calls.length;

      // Click retry button
      const retryButton = screen.getByText('🔄 Retry Analysis');
      fireEvent.click(retryButton);

      // The retry triggers a re-analysis, so the analyzer should be called more times
      expect(
        CharacterAnalyzer.analyzeCharacterPresence.mock.calls.length
      ).toBeGreaterThan(initialCallCount);
    });
  });

  describe('Empty State', () => {
    test('shows "No Characters Detected" when analysis returns empty results', () => {
      CharacterAnalyzer.analyzeCharacterPresence.mockReturnValue({
        characterPresence: new Map(),
        allDetectedCharacters: []
      });

      render(
        <CharacterThreadVisualization
          chapters={mockChapters}
          characters={mockCharacters}
        />
      );

      expect(screen.getByText('No Characters Detected')).toBeInTheDocument();
      expect(
        screen.getByText(
          /Write scenes with characters or add characters to your character list/
        )
      ).toBeInTheDocument();
    });

    test('empty state is different from error state', () => {
      CharacterAnalyzer.analyzeCharacterPresence.mockReturnValue({
        characterPresence: new Map(),
        allDetectedCharacters: []
      });

      render(
        <CharacterThreadVisualization
          chapters={mockChapters}
          characters={mockCharacters}
        />
      );

      // Should show empty state, not error state
      expect(screen.getByText('No Characters Detected')).toBeInTheDocument();
      expect(
        screen.queryByText('❌ Character Analysis Failed')
      ).not.toBeInTheDocument();
      expect(screen.queryByText('🔄 Retry Analysis')).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    test('component initially sets isAnalyzing to false after render', () => {
      CharacterAnalyzer.analyzeCharacterPresence.mockReturnValue(
        mockSuccessfulAnalysis
      );

      render(
        <CharacterThreadVisualization
          chapters={mockChapters}
          characters={mockCharacters}
        />
      );

      // After rendering, the component should have completed analysis
      // The loading overlay only shows when isAnalyzing is true,
      // but analysis completes immediately in tests
      expect(CharacterAnalyzer.analyzeCharacterPresence).toHaveBeenCalled();
    });
  });

  describe('Character Blacklist', () => {
    test('passes characterDetectionBlacklist to analyzer', () => {
      CharacterAnalyzer.analyzeCharacterPresence.mockReturnValue(
        mockSuccessfulAnalysis
      );

      const blacklist = ['Narrator', 'Author'];
      render(
        <CharacterThreadVisualization
          chapters={mockChapters}
          characters={mockCharacters}
          characterDetectionBlacklist={blacklist}
        />
      );

      expect(CharacterAnalyzer.analyzeCharacterPresence).toHaveBeenCalledWith(
        mockChapters,
        mockCharacters,
        blacklist,
        true, // filterMentions default
        2.0 // presenceThreshold default
      );
    });

    test('updates blacklist when character is excluded', () => {
      CharacterAnalyzer.analyzeCharacterPresence.mockReturnValue(
        mockSuccessfulAnalysis
      );

      const onUpdateBlacklist = jest.fn();
      render(
        <CharacterThreadVisualization
          chapters={mockChapters}
          characters={mockCharacters}
          characterDetectionBlacklist={[]}
          onUpdateCharacterDetectionBlacklist={onUpdateBlacklist}
        />
      );

      // Find and click the exclude button for a character
      // The exclude button is the ✕ symbol
      const excludeButtons = screen.getAllByText('✕');
      fireEvent.click(excludeButtons[0]);

      // Should call the update function with the excluded character
      expect(onUpdateBlacklist).toHaveBeenCalled();
      const calledWith = onUpdateBlacklist.mock.calls[0][0];
      expect(Array.isArray(calledWith)).toBe(true);
      expect(calledWith.length).toBe(1);
    });
  });

  describe('Filter Controls', () => {
    test('toggles filter mentions checkbox', () => {
      CharacterAnalyzer.analyzeCharacterPresence.mockReturnValue(
        mockSuccessfulAnalysis
      );

      render(
        <CharacterThreadVisualization
          chapters={mockChapters}
          characters={mockCharacters}
        />
      );

      const filterCheckbox = screen.getByLabelText(/Filter mentions/);
      expect(filterCheckbox).toBeChecked(); // Default is true

      fireEvent.click(filterCheckbox);

      // Should be unchecked and have called analyzer with filterMentions=false
      expect(filterCheckbox).not.toBeChecked();
      const calls = CharacterAnalyzer.analyzeCharacterPresence.mock.calls;
      const hasCallWithFilterOff = calls.some(call => call[3] === false);
      expect(hasCallWithFilterOff).toBe(true);
    });

    test('adjusts presence threshold slider', () => {
      CharacterAnalyzer.analyzeCharacterPresence.mockReturnValue(
        mockSuccessfulAnalysis
      );

      render(
        <CharacterThreadVisualization
          chapters={mockChapters}
          characters={mockCharacters}
        />
      );

      const slider = screen.getByRole('slider');
      expect(slider).toHaveValue('2'); // Default value

      fireEvent.change(slider, { target: { value: '3.5' } });

      // Should show new value
      expect(screen.getByText('3.5')).toBeInTheDocument();

      // Should trigger re-analysis with new threshold (at least once with the new value)
      const calls = CharacterAnalyzer.analyzeCharacterPresence.mock.calls;
      const hasCallWith3_5 = calls.some(call => call[4] === 3.5);
      expect(hasCallWith3_5).toBe(true);
    });
  });
});
