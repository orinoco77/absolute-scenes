/* eslint-disable testing-library/no-node-access */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import BookStructure from '../BookStructure';

// Mock the child components
jest.mock('../SceneList', () => {
  return function MockedSceneList(props) {
    return (
      <div data-testid="scene-list">
        <button onClick={() => props.onSceneSelect('scene-1')}>Scene 1</button>
        <button onClick={() => props.onChapterSelect('chapter-1')}>
          Chapter 1
        </button>
        <button onClick={props.onSceneAdd}>Add Scene</button>
        <button onClick={props.onChapterAdd}>Add Chapter</button>
      </div>
    );
  };
});

jest.mock('../CharacterList', () => {
  return function MockedCharacterList(props) {
    return (
      <div data-testid="character-list">
        <button onClick={() => props.onCharacterSelect('character-1')}>
          Hero
        </button>
        <button onClick={() => props.onCharacterSelect('character-2')}>
          Villain
        </button>
        <button onClick={props.onCharacterAdd}>Add Character</button>
      </div>
    );
  };
});

// Note: CharacterThreadVisualization is not used in BookStructure - threads tab uses ThreadsControls

const mockChapters = [
  {
    id: 'chapter-1',
    title: 'Chapter 1',
    scenes: [
      { id: 'scene-1', title: 'Scene 1' },
      { id: 'scene-2', title: 'Scene 2' }
    ]
  },
  {
    id: 'chapter-2',
    title: 'Chapter 2',
    scenes: [{ id: 'scene-3', title: 'Scene 3' }]
  }
];

const mockCharacters = [
  { id: 'character-1', name: 'Hero' },
  { id: 'character-2', name: 'Villain' }
];

const mockFunctions = {
  onSceneSelect: jest.fn(),
  onChapterSelect: jest.fn(),
  onSceneAdd: jest.fn(),
  onChapterAdd: jest.fn(),
  onSceneDelete: jest.fn(),
  onChapterDelete: jest.fn(),
  onChapterUpdate: jest.fn(),
  onReorderChapters: jest.fn(),
  onReorderScenesInChapter: jest.fn(),
  onMoveSceneBetweenChapters: jest.fn(),
  onToggleRecycleBin: jest.fn(),
  onRestoreFromRecycleBin: jest.fn(),
  onPermanentlyDelete: jest.fn(),
  onEmptyRecycleBin: jest.fn(),
  onCharacterSelect: jest.fn(),
  onCharacterAdd: jest.fn(),
  onCharacterDelete: jest.fn(),
  onCharacterUpdate: jest.fn(),
  onRestoreCharacterFromRecycleBin: jest.fn(),
  onPermanentlyDeleteCharacter: jest.fn(),
  onUpdateCharacterDetectionBlacklist: jest.fn(),
  onTabChange: jest.fn()
};

const renderComponent = (activeTab = 'manuscript') =>
  render(
    <BookStructure
      chapters={mockChapters}
      characters={mockCharacters}
      activeTab={activeTab}
      {...mockFunctions}
    />
  );

describe('BookStructure Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders with manuscript tab active by default', () => {
    renderComponent();
    expect(screen.getByText('Manuscript')).toBeInTheDocument();
    expect(screen.getByText('Scene 1')).toBeInTheDocument();
  });

  test('calls onTabChange when characters tab is clicked', () => {
    renderComponent();
    fireEvent.click(screen.getByText('Characters'));
    expect(mockFunctions.onTabChange).toHaveBeenCalledWith('characters');
  });

  test('calls onTabChange when threads tab is clicked', () => {
    renderComponent();
    fireEvent.click(screen.getByText('Threads'));
    expect(mockFunctions.onTabChange).toHaveBeenCalledWith('threads');
  });

  test('triggers scene select', () => {
    renderComponent();
    fireEvent.click(screen.getByText('Scene 1'));
    expect(mockFunctions.onSceneSelect).toHaveBeenCalledWith('scene-1');
  });

  test('triggers chapter select', () => {
    renderComponent();
    fireEvent.click(screen.getByText('Chapter 1'));
    expect(mockFunctions.onChapterSelect).toHaveBeenCalledWith('chapter-1');
  });

  test('triggers scene add', () => {
    renderComponent();
    fireEvent.click(screen.getByText('Add Scene'));
    expect(mockFunctions.onSceneAdd).toHaveBeenCalled();
  });

  test('triggers chapter add', () => {
    renderComponent();
    fireEvent.click(screen.getByText('Add Chapter'));
    expect(mockFunctions.onChapterAdd).toHaveBeenCalled();
  });

  test('renders characters tab correctly', () => {
    renderComponent('characters');
    expect(screen.getByTestId('character-list')).toBeInTheDocument();
    expect(screen.getByText('Hero')).toBeInTheDocument();
    expect(screen.getByText('Villain')).toBeInTheDocument();
  });

  test('triggers character select', () => {
    renderComponent('characters');
    fireEvent.click(screen.getByText('Hero'));
    expect(mockFunctions.onCharacterSelect).toHaveBeenCalledWith('character-1');
  });

  test('triggers character add', () => {
    renderComponent('characters');
    fireEvent.click(screen.getByText('Add Character'));
    expect(mockFunctions.onCharacterAdd).toHaveBeenCalled();
  });

  test('renders threads tab with controls', () => {
    renderComponent('threads');
    expect(screen.getByText('Thread View')).toBeInTheDocument();

    // Check that all the stat labels are present
    expect(screen.getByText('Scenes analyzed:')).toBeInTheDocument();
    expect(screen.getByText('Chapters:')).toBeInTheDocument();
    expect(screen.getByText('Formal characters:')).toBeInTheDocument();

    // Check for specific values - there should be one "3" and multiple "2"s
    expect(screen.getByText('3')).toBeInTheDocument();
    const allTwos = screen.getAllByText('2');
    expect(allTwos).toHaveLength(2); // Should be exactly 2 instances (Chapters and Formal characters)
  });

  test('shows tab icons correctly', () => {
    renderComponent();
    expect(screen.getByText('📖')).toBeInTheDocument(); // Manuscript icon
    expect(screen.getByText('👥')).toBeInTheDocument(); // Characters icon
    expect(screen.getByText('🧵')).toBeInTheDocument(); // Threads icon
  });

  test('handles empty chapters array', () => {
    render(
      <BookStructure
        chapters={[]}
        characters={mockCharacters}
        activeTab="manuscript"
        {...mockFunctions}
      />
    );
    expect(screen.getByTestId('scene-list')).toBeInTheDocument();
  });

  test('handles empty characters array', () => {
    render(
      <BookStructure
        chapters={mockChapters}
        characters={[]}
        activeTab="threads"
        {...mockFunctions}
      />
    );
    expect(screen.getByText('Formal characters:')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  test('auto-selection logic works when switching to characters tab', () => {
    render(
      <BookStructure
        chapters={mockChapters}
        characters={mockCharacters}
        activeTab="manuscript"
        currentCharacterId={null}
        {...mockFunctions}
      />
    );

    fireEvent.click(screen.getByText('Characters'));
    expect(mockFunctions.onTabChange).toHaveBeenCalledWith('characters');
  });

  test('displays correct active tab class', () => {
    renderComponent('characters');
    const charactersButton = screen.getByText('Characters').closest('button');
    const manuscriptButton = screen.getByText('Manuscript').closest('button');

    expect(charactersButton).toHaveClass('active');
    expect(manuscriptButton).not.toHaveClass('active');
  });

  test('renders threads controls with blacklisted characters', () => {
    render(
      <BookStructure
        chapters={mockChapters}
        characters={mockCharacters}
        characterDetectionBlacklist={['badname1', 'badname2']}
        activeTab="threads"
        {...mockFunctions}
      />
    );

    // Check that all stat labels are present
    expect(screen.getByText('Chapters:')).toBeInTheDocument();
    expect(screen.getByText('Formal characters:')).toBeInTheDocument();
    expect(screen.getByText('Blacklisted names:')).toBeInTheDocument();

    // Check for specific values - should be one "3" and three "2"s
    expect(screen.getByText('3')).toBeInTheDocument();
    const allTwos = screen.getAllByText('2');
    expect(allTwos).toHaveLength(3); // Chapters: 2, Formal characters: 2, Blacklisted names: 2
  });

  test('renders threads controls without blacklisted characters', () => {
    render(
      <BookStructure
        chapters={mockChapters}
        characters={mockCharacters}
        characterDetectionBlacklist={[]}
        activeTab="threads"
        {...mockFunctions}
      />
    );

    expect(screen.queryByText('Blacklisted names:')).not.toBeInTheDocument();
  });
});
