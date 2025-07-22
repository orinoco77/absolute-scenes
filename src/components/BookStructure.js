import React from 'react';
import SceneList from './SceneList';
import CharacterList from './CharacterList';
import CharacterThreadVisualization from './CharacterThreadVisualization';

// Threads control component for the sidebar
function ThreadsControls({ chapters, characters, characterDetectionBlacklist, onUpdateCharacterDetectionBlacklist }) {
  // Get character count for display
  const allCharacters = new Set();
  characters.forEach(char => allCharacters.add(char.name));
  
  // Count scenes
  const totalScenes = chapters.reduce((total, ch) => total + ch.scenes.length, 0);
  
  return (
    <div className="threads-controls" style={{ 
      padding: '1rem',
      height: '100%',
      overflow: 'auto'
    }}>
      <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1em' }}>Thread View</h3>
      
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '0.5rem' }}>
          Analyzing {totalScenes} scenes across {chapters.length} chapters
        </div>
        <div style={{ fontSize: '0.9em', color: '#666' }}>
          {characters.length} formal characters
        </div>
        {characterDetectionBlacklist && characterDetectionBlacklist.length > 0 && (
          <div style={{ fontSize: '0.9em', color: '#dc2626' }}>
            {characterDetectionBlacklist.length} blacklisted names
          </div>
        )}
      </div>
      
      <div style={{ marginTop: '1.5rem', fontSize: '0.85em', color: '#6b7280', lineHeight: 1.4 }}>
        <p><strong>How to use:</strong></p>
        <ul style={{ margin: '0.5rem 0', paddingLeft: '1.2rem' }}>
          <li>Click character names to highlight their threads</li>
          <li>Use ✕ next to names to blacklist false positives</li>
          <li>✓ marks characters from your character list</li>
          <li>Connecting lines show character continuity between scenes</li>
        </ul>
      </div>
      
      <div style={{ marginTop: '1.5rem', padding: '0.75rem', background: '#f8f9fa', borderRadius: '0.5rem', fontSize: '0.8em', color: '#666' }}>
        <strong>Coming soon:</strong> Filter controls, character grouping, and export options will be added here.
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
          onUpdateCharacterDetectionBlacklist={onUpdateCharacterDetectionBlacklist}
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
