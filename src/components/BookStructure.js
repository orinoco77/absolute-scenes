import React from 'react';
import SceneList from './SceneList';
import CharacterList from './CharacterList';

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
  
  // Tab props
  activeTab,
  onTabChange
}) {
  const handleTabChange = (tabId) => {
    onTabChange(tabId);
    
    // Auto-select first item when switching tabs if nothing is selected
    if (tabId === 'characters' && !currentCharacterId && characters.length > 0) {
      onCharacterSelect(characters[0].id);
    } else if (tabId === 'manuscript' && !currentSceneId && chapters.length > 0) {
      // Find first scene in first chapter
      const firstChapterWithScenes = chapters.find(ch => ch.scenes.length > 0);
      if (firstChapterWithScenes) {
        onChapterSelect(firstChapterWithScenes.id);
        onSceneSelect(firstChapterWithScenes.scenes[0].id);
      }
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
    }
  ];

  return (
    <div className="book-structure">
      <div className="book-structure-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.id)}
            title={tab.label}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>
      
      <div className="tab-content">
        {tabs.find(tab => tab.id === activeTab)?.component}
      </div>
    </div>
  );
}

export default BookStructure;
