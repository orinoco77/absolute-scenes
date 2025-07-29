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

jest.mock('../BackgroundList', () => {
  return function MockedBackgroundList(props) {
    return (
      <div data-testid="background-list">
        <button onClick={() => props.onDocumentSelect('doc-1')}>
          Character Notes
        </button>
        <button onClick={() => props.onFolderSelect('folder-1')}>
          General Notes
        </button>
        <button onClick={props.onDocumentAdd}>Add Document</button>
        <button onClick={props.onFolderAdd}>Add Folder</button>
      </div>
    );
  };
});

jest.mock('../LocationList', () => {
  return function MockedLocationList(props) {
    return (
      <div data-testid="location-list">
        <button onClick={() => props.onLocationSelect('location-1')}>
          Mystic Library
        </button>
        <button onClick={() => props.onLocationSelect('location-2')}>
          Dark Castle
        </button>
        <button onClick={props.onLocationAdd}>Add Location</button>
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

const mockBackgroundFolders = [
  {
    id: 'folder-1',
    title: 'General Notes',
    documents: [
      {
        id: 'doc-1',
        title: 'Character Notes',
        content: 'Notes about characters.'
      },
      { id: 'doc-2', title: 'Plot Ideas', content: 'Ideas for the plot.' }
    ]
  },
  {
    id: 'folder-2',
    title: 'Research',
    documents: [
      { id: 'doc-3', title: 'Historical Info', content: 'Research notes.' }
    ]
  }
];

const mockLocations = [
  {
    id: 'location-1',
    name: 'Mystic Library',
    description: 'A magical library.'
  },
  {
    id: 'location-2',
    name: 'Dark Castle',
    description: 'A forbidding fortress.'
  }
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
  onRestoreBackgroundFromRecycleBin: jest.fn(),
  onPermanentlyDeleteBackground: jest.fn(),
  onLocationSelect: jest.fn(),
  onLocationAdd: jest.fn(),
  onLocationDelete: jest.fn(),
  onLocationUpdate: jest.fn(),
  onRestoreLocationFromRecycleBin: jest.fn(),
  onPermanentlyDeleteLocation: jest.fn(),
  onTabChange: jest.fn()
};

const renderComponent = (activeTab = 'manuscript') =>
  render(
    <BookStructure
      chapters={mockChapters}
      characters={mockCharacters}
      backgroundFolders={mockBackgroundFolders}
      locations={mockLocations}
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

  test('calls onTabChange when background tab is clicked', () => {
    renderComponent();
    fireEvent.click(screen.getByText('Background'));
    expect(mockFunctions.onTabChange).toHaveBeenCalledWith('background');
  });

  test('calls onTabChange when characters tab is clicked', () => {
    renderComponent();
    fireEvent.click(screen.getByText('Characters'));
    expect(mockFunctions.onTabChange).toHaveBeenCalledWith('characters');
  });

  test('calls onTabChange when locations tab is clicked', () => {
    renderComponent();
    fireEvent.click(screen.getByText('Locations'));
    expect(mockFunctions.onTabChange).toHaveBeenCalledWith('locations');
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

  test('renders background tab correctly', () => {
    renderComponent('background');
    expect(screen.getByTestId('background-list')).toBeInTheDocument();
    expect(screen.getByText('Character Notes')).toBeInTheDocument();
    expect(screen.getByText('General Notes')).toBeInTheDocument();
  });

  test('triggers document select from background tab', () => {
    renderComponent('background');
    fireEvent.click(screen.getByText('Character Notes'));
    expect(mockFunctions.onDocumentSelect).toHaveBeenCalledWith('doc-1');
  });

  test('triggers folder select from background tab', () => {
    renderComponent('background');
    fireEvent.click(screen.getByText('General Notes'));
    expect(mockFunctions.onFolderSelect).toHaveBeenCalledWith('folder-1');
  });

  test('triggers document add from background tab', () => {
    renderComponent('background');
    fireEvent.click(screen.getByText('Add Document'));
    expect(mockFunctions.onDocumentAdd).toHaveBeenCalled();
  });

  test('triggers folder add from background tab', () => {
    renderComponent('background');
    fireEvent.click(screen.getByText('Add Folder'));
    expect(mockFunctions.onFolderAdd).toHaveBeenCalled();
  });

  test('renders characters tab correctly', () => {
    renderComponent('characters');
    expect(screen.getByTestId('character-list')).toBeInTheDocument();
    expect(screen.getByText('Hero')).toBeInTheDocument();
    expect(screen.getByText('Villain')).toBeInTheDocument();
  });

  test('renders locations tab correctly', () => {
    renderComponent('locations');
    expect(screen.getByTestId('location-list')).toBeInTheDocument();
    expect(screen.getByText('Mystic Library')).toBeInTheDocument();
    expect(screen.getByText('Dark Castle')).toBeInTheDocument();
  });

  test('triggers location select', () => {
    renderComponent('locations');
    fireEvent.click(screen.getByText('Mystic Library'));
    expect(mockFunctions.onLocationSelect).toHaveBeenCalledWith('location-1');
  });

  test('triggers location add', () => {
    renderComponent('locations');
    fireEvent.click(screen.getByText('Add Location'));
    expect(mockFunctions.onLocationAdd).toHaveBeenCalled();
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
    expect(screen.getByText('📋')).toBeInTheDocument(); // Background icon
    expect(screen.getByText('👥')).toBeInTheDocument(); // Characters icon
    expect(screen.getByText('🌍')).toBeInTheDocument(); // Locations icon
    expect(screen.getByText('🧵')).toBeInTheDocument(); // Threads icon
  });

  test('verifies correct tab order (Locations above Threads)', () => {
    renderComponent();

    const tabs = screen
      .getAllByRole('button')
      .filter(button =>
        [
          '📖Manuscript▼',
          '📋Background▶',
          '👥Characters▶',
          '🌍Locations▶',
          '🧵Threads▶'
        ].includes(button.textContent.trim())
      );
    console.log(screen.getAllByRole('button').map(b => b.textContent));

    // Verify the order: Manuscript, Background, Characters, Locations, Threads
    expect(tabs[0]).toHaveTextContent('📖Manuscript▼');
    expect(tabs[1]).toHaveTextContent('📋Background▶');
    expect(tabs[2]).toHaveTextContent('👥Characters▶');
    expect(tabs[3]).toHaveTextContent('🌍Locations▶');
    expect(tabs[4]).toHaveTextContent('🧵Threads▶');
  });

  test('handles empty chapters array', () => {
    render(
      <BookStructure
        chapters={[]}
        characters={mockCharacters}
        backgroundFolders={mockBackgroundFolders}
        locations={mockLocations}
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
        backgroundFolders={mockBackgroundFolders}
        locations={mockLocations}
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
        backgroundFolders={mockBackgroundFolders}
        locations={mockLocations}
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
        backgroundFolders={mockBackgroundFolders}
        locations={mockLocations}
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
        backgroundFolders={mockBackgroundFolders}
        locations={mockLocations}
        characterDetectionBlacklist={[]}
        activeTab="threads"
        {...mockFunctions}
      />
    );

    expect(screen.queryByText('Blacklisted names:')).not.toBeInTheDocument();
  });

  test('auto-selection logic works when switching to background tab', () => {
    render(
      <BookStructure
        chapters={mockChapters}
        characters={mockCharacters}
        backgroundFolders={mockBackgroundFolders}
        locations={mockLocations}
        activeTab="manuscript"
        currentDocumentId={null}
        {...mockFunctions}
      />
    );

    fireEvent.click(screen.getByText('Background'));
    expect(mockFunctions.onTabChange).toHaveBeenCalledWith('background');
  });

  test('auto-selection logic works when switching to locations tab', () => {
    render(
      <BookStructure
        chapters={mockChapters}
        characters={mockCharacters}
        backgroundFolders={mockBackgroundFolders}
        locations={mockLocations}
        activeTab="manuscript"
        currentLocationId={null}
        {...mockFunctions}
      />
    );

    fireEvent.click(screen.getByText('Locations'));
    expect(mockFunctions.onTabChange).toHaveBeenCalledWith('locations');
  });
});
