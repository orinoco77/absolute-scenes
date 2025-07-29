import BackgroundList from './BackgroundList';
import CharacterList from './CharacterList';
import LocationList from './LocationList';
import SceneList from './SceneList';

// Threads control component for the sidebar
function ThreadsControls({
  chapters,
  characters,
  characterDetectionBlacklist,
  onUpdateCharacterDetectionBlacklist: _onUpdateCharacterDetectionBlacklist
}) {
  // Get character count for display
  const allCharacters = new Set();
  characters.forEach(char => allCharacters.add(char.name));

  // Count scenes
  const totalScenes = chapters.reduce(
    (total, ch) => total + ch.scenes.length,
    0
  );

  return (
    <div className="tab-list">
      <div className="tab-list-header">
        <h3>Thread View</h3>
        <p className="tab-description">
          Visualize character appearances and story threads across your scenes.
          Track character continuity and narrative flow.
        </p>
      </div>

      <div className="tab-content-container">
        <div className="tab-info-section">
          <div className="tab-stats">
            <div className="tab-stat">
              <span className="stat-label">Scenes analyzed:</span>
              <span className="stat-value">{totalScenes}</span>
            </div>
            <div className="tab-stat">
              <span className="stat-label">Chapters:</span>
              <span className="stat-value">{chapters.length}</span>
            </div>
            <div className="tab-stat">
              <span className="stat-label">Formal characters:</span>
              <span className="stat-value">{characters.length}</span>
            </div>
            {characterDetectionBlacklist &&
              characterDetectionBlacklist.length > 0 && (
                <div className="tab-stat">
                  <span className="stat-label">Blacklisted names:</span>
                  <span className="stat-value" style={{ color: '#dc2626' }}>
                    {characterDetectionBlacklist.length}
                  </span>
                </div>
              )}
          </div>
        </div>

        <div className="tab-help-section">
          <h4>How to use:</h4>
          <ul>
            <li>Click character names to highlight their threads</li>
            <li>Use ✕ next to names to blacklist false positives</li>
            <li>✓ marks characters from your character list</li>
            <li>Connecting lines show character continuity between scenes</li>
          </ul>
        </div>

        <div className="tab-coming-soon">
          <strong>Coming soon:</strong> Filter controls, character grouping, and
          export options will be added here.
        </div>
      </div>
    </div>
  );
}

function BookStructure({
  // Scene/Chapter props
  chapters,
  currentSceneId,
  currentChapterId,
  onSceneSelect,
  onChapterSelect,
  onSceneAdd,
  onChapterAdd,
  onSceneDelete,
  onChapterDelete,
  onChapterUpdate,
  onReorderChapters,
  onReorderScenesInChapter,
  onMoveSceneBetweenChapters,
  recycleBin,
  showRecycleBin,
  onToggleRecycleBin,
  onRestoreFromRecycleBin,
  onPermanentlyDelete,
  onEmptyRecycleBin,

  // Character props
  characters,
  currentCharacterId,
  onCharacterSelect,
  onCharacterAdd,
  onCharacterDelete,
  onCharacterUpdate,
  characterRecycleBin,
  onRestoreCharacterFromRecycleBin,
  onPermanentlyDeleteCharacter,

  // Character detection props
  characterDetectionBlacklist,
  onUpdateCharacterDetectionBlacklist,

  // Background props
  backgroundFolders,
  currentDocumentId,
  currentFolderId,
  onDocumentSelect,
  onFolderSelect,
  onDocumentAdd,
  onFolderAdd,
  onDocumentDelete,
  onDocumentUpdate,
  onFolderDelete,
  onFolderUpdate,
  onReorderFolders,
  onReorderDocumentsInFolder,
  onMoveDocumentBetweenFolders,
  backgroundRecycleBin,
  onRestoreBackgroundFromRecycleBin,
  onPermanentlyDeleteBackground,

  // Location props
  locations,
  currentLocationId,
  onLocationSelect,
  onLocationAdd,
  onLocationDelete,
  onLocationUpdate,
  locationRecycleBin,
  onRestoreLocationFromRecycleBin,
  onPermanentlyDeleteLocation,

  // Tab props
  activeTab,
  onTabChange
}) {
  const handleTabChange = tabId => {
    onTabChange(tabId);

    // Auto-select first item when switching tabs if nothing is selected
    if (
      tabId === 'characters' &&
      !currentCharacterId &&
      characters.length > 0
    ) {
      onCharacterSelect(characters[0].id);
    } else if (
      tabId === 'manuscript' &&
      !currentSceneId &&
      chapters.length > 0
    ) {
      // Find first scene in first chapter
      const firstChapterWithScenes = chapters.find(ch => ch.scenes.length > 0);
      if (firstChapterWithScenes) {
        onChapterSelect(firstChapterWithScenes.id);
        onSceneSelect(firstChapterWithScenes.scenes[0].id);
      }
    } else if (
      tabId === 'background' &&
      !currentDocumentId &&
      backgroundFolders.length > 0
    ) {
      // Find first document in first folder
      const firstFolderWithDocs = backgroundFolders.find(
        folder => folder.documents.length > 0
      );
      if (firstFolderWithDocs) {
        onFolderSelect(firstFolderWithDocs.id);
        onDocumentSelect(firstFolderWithDocs.documents[0].id);
      } else {
        // Just select the first folder even if empty
        onFolderSelect(backgroundFolders[0].id);
      }
    } else if (
      tabId === 'locations' &&
      !currentLocationId &&
      locations.length > 0
    ) {
      onLocationSelect(locations[0].id);
    }
  };

  const tabs = [
    {
      id: 'manuscript',
      label: 'Manuscript',
      icon: '📖',
      component: (
        <SceneList
          chapters={chapters}
          currentSceneId={currentSceneId}
          currentChapterId={currentChapterId}
          onSceneSelect={onSceneSelect}
          onChapterSelect={onChapterSelect}
          onSceneAdd={onSceneAdd}
          onChapterAdd={onChapterAdd}
          onSceneDelete={onSceneDelete}
          onChapterDelete={onChapterDelete}
          onChapterUpdate={onChapterUpdate}
          onReorderChapters={onReorderChapters}
          onReorderScenesInChapter={onReorderScenesInChapter}
          onMoveSceneBetweenChapters={onMoveSceneBetweenChapters}
          recycleBin={recycleBin}
          showRecycleBin={showRecycleBin}
          onToggleRecycleBin={onToggleRecycleBin}
          onRestoreFromRecycleBin={onRestoreFromRecycleBin}
          onPermanentlyDelete={onPermanentlyDelete}
          onEmptyRecycleBin={onEmptyRecycleBin}
        />
      )
    },
    {
      id: 'background',
      label: 'Background',
      icon: '📋',
      component: (
        <BackgroundList
          folders={backgroundFolders}
          currentDocumentId={currentDocumentId}
          currentFolderId={currentFolderId}
          onDocumentSelect={onDocumentSelect}
          onFolderSelect={onFolderSelect}
          onDocumentAdd={onDocumentAdd}
          onFolderAdd={onFolderAdd}
          onDocumentDelete={onDocumentDelete}
          onDocumentUpdate={onDocumentUpdate}
          onFolderDelete={onFolderDelete}
          onFolderUpdate={onFolderUpdate}
          onReorderFolders={onReorderFolders}
          onReorderDocumentsInFolder={onReorderDocumentsInFolder}
          onMoveDocumentBetweenFolders={onMoveDocumentBetweenFolders}
          recycleBin={backgroundRecycleBin}
          showRecycleBin={showRecycleBin}
          onToggleRecycleBin={onToggleRecycleBin}
          onRestoreFromRecycleBin={onRestoreBackgroundFromRecycleBin}
          onPermanentlyDelete={onPermanentlyDeleteBackground}
          onEmptyRecycleBin={onEmptyRecycleBin}
        />
      )
    },
    {
      id: 'characters',
      label: 'Characters',
      icon: '👥',
      component: (
        <CharacterList
          characters={characters}
          currentCharacterId={currentCharacterId}
          onCharacterSelect={onCharacterSelect}
          onCharacterAdd={onCharacterAdd}
          onCharacterDelete={onCharacterDelete}
          onCharacterUpdate={onCharacterUpdate}
          characterRecycleBin={characterRecycleBin}
          onRestoreFromRecycleBin={onRestoreCharacterFromRecycleBin}
          onPermanentlyDelete={onPermanentlyDeleteCharacter}
        />
      )
    },
    {
      id: 'locations',
      label: 'Locations',
      icon: '🌍',
      component: (
        <LocationList
          locations={locations}
          currentLocationId={currentLocationId}
          onLocationSelect={onLocationSelect}
          onLocationAdd={onLocationAdd}
          onLocationDelete={onLocationDelete}
          onLocationUpdate={onLocationUpdate}
          locationRecycleBin={locationRecycleBin}
          onRestoreFromRecycleBin={onRestoreLocationFromRecycleBin}
          onPermanentlyDelete={onPermanentlyDeleteLocation}
        />
      )
    },
    {
      id: 'threads',
      label: 'Threads',
      icon: '🧵',
      component: (
        <ThreadsControls
          chapters={chapters}
          characters={characters}
          characterDetectionBlacklist={characterDetectionBlacklist}
          onUpdateCharacterDetectionBlacklist={
            onUpdateCharacterDetectionBlacklist
          }
        />
      )
    }
  ];

  return (
    <div className="book-structure">
      <div className="accordion-container">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`accordion-section ${activeTab === tab.id ? 'active-section' : ''}`}
          >
            <button
              className={`accordion-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => handleTabChange(tab.id)}
              title={tab.label}
            >
              <span className="accordion-icon">{tab.icon}</span>
              <span className="accordion-label">{tab.label}</span>
              <span className="accordion-chevron">
                {activeTab === tab.id ? '▼' : '▶'}
              </span>
            </button>

            {activeTab === tab.id && (
              <div className="accordion-content">{tab.component}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default BookStructure;
