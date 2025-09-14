import React, { useState } from 'react';

function CharacterList({
  characters,
  currentCharacterId,
  onCharacterSelect,
  onCharacterAdd,
  onCharacterDelete,
  onCharacterUpdate,
  characterRecycleBin,
  onRestoreFromRecycleBin,
  onPermanentlyDelete
}) {
  const [editingCharacter, setEditingCharacter] = useState(null);
  const [showRecycleBin, setShowRecycleBin] = useState(false);

  const handleCharacterTitleChange = (characterId, newName) => {
    onCharacterUpdate(characterId, { name: newName });
    setEditingCharacter(null);
  };

  const getWordCount = content => {
    if (!content) return 0;
    return content.split(/\s+/).filter(word => word.length > 0).length;
  };

  return (
    <div className="tab-list">
      <div className="tab-list-header">
        <h3>Characters</h3>
        <p className="tab-description">
          Manage your story's characters. Character information is saved with
          your book but won't appear in exports.
        </p>
        <div className="header-buttons">
          <button
            onClick={onCharacterAdd}
            className="primary-btn"
            title="Add Character"
          >
            👤+ Character
          </button>
          <button
            onClick={() => setShowRecycleBin(!showRecycleBin)}
            className={`secondary-btn ${characterRecycleBin.length > 0 ? 'has-items' : ''}`}
            title={`Character Recycle Bin (${characterRecycleBin.length} items)`}
          >
            <span className="emoji-text">
              🗑️ ({characterRecycleBin.length})
            </span>
            <span className="dark-text">🗑️ ({characterRecycleBin.length})</span>
          </button>
        </div>
      </div>

      <div className="tab-content-container">
        {characters.length === 0 ? (
          <div className="empty-state">
            <p>
              <span className="emoji-text">
                No characters yet. Click "👤+ Character" to add one.
              </span>
              <span className="dark-text">
                No characters yet. Click "👤+ Character" to add one.
              </span>
            </p>
          </div>
        ) : (
          characters.map(character => {
            const wordCount = getWordCount(character.description);

            return (
              <div
                key={character.id}
                className={`character-item ${
                  character.id === currentCharacterId ? 'active' : ''
                }`}
                onClick={() => onCharacterSelect(character.id)}
              >
                <div className="character-avatar">
                  {character.avatar || '👤'}
                </div>

                <div className="character-content">
                  {editingCharacter === character.id ? (
                    <input
                      type="text"
                      defaultValue={character.name}
                      className="character-name-edit"
                      autoFocus
                      onBlur={e =>
                        handleCharacterTitleChange(character.id, e.target.value)
                      }
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          handleCharacterTitleChange(
                            character.id,
                            e.target.value
                          );
                        } else if (e.key === 'Escape') {
                          setEditingCharacter(null);
                        }
                      }}
                      onClick={e => e.stopPropagation()}
                    />
                  ) : (
                    <div
                      className="character-name"
                      onDoubleClick={e => {
                        e.stopPropagation();
                        setEditingCharacter(character.id);
                      }}
                    >
                      {character.name}
                    </div>
                  )}

                  {character.role && (
                    <div className="character-role">{character.role}</div>
                  )}

                  <div className="character-meta">
                    <span className="character-date">
                      {new Date(character.modified).toLocaleDateString()}
                    </span>
                    <span className="character-word-count">
                      {wordCount} words
                    </span>
                  </div>
                </div>

                <div className="character-actions">
                  <button
                    className="delete-character-btn"
                    onClick={e => {
                      e.stopPropagation();
                      onCharacterDelete(character.id);
                    }}
                    title="Delete character"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Character Recycle Bin */}
      {showRecycleBin && (
        <div
          className="recycle-bin"
          style={{
            flexShrink: 0,
            maxHeight: '300px',
            overflow: 'auto',
            borderTop: '1px solid #e5e7eb',
            backgroundColor: '#fafafa'
          }}
        >
          <div className="recycle-bin-header">
            <h4>🗑️ Character Recycle Bin</h4>
            <div className="recycle-bin-controls">
              {characterRecycleBin.length > 0 && (
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        'Permanently delete all characters in recycle bin? This cannot be undone.'
                      )
                    ) {
                      characterRecycleBin.forEach(item =>
                        onPermanentlyDelete(item.id)
                      );
                    }
                  }}
                  className="empty-bin-btn"
                  title="Permanently delete all characters"
                >
                  Empty Bin
                </button>
              )}
              <button
                onClick={() => setShowRecycleBin(false)}
                className="close-bin-btn"
                title="Close recycle bin"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="recycle-bin-content">
            {characterRecycleBin.length === 0 ? (
              <div className="empty-bin">
                <span>Character recycle bin is empty</span>
              </div>
            ) : (
              characterRecycleBin.map(item => (
                <div key={item.id} className="recycle-bin-item">
                  <div className="recycle-item-content">
                    <div className="recycle-item-title">
                      👤 {item.item.name}
                    </div>
                    <div className="recycle-item-meta">
                      <span>
                        deleted {new Date(item.deletedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="recycle-item-actions">
                    <button
                      onClick={() => onRestoreFromRecycleBin(item.id)}
                      className="restore-btn"
                      title="Restore character"
                    >
                      ↩️
                    </button>
                    <button
                      onClick={() => onPermanentlyDelete(item.id)}
                      className="permanent-delete-btn"
                      title="Permanently delete"
                    >
                      ❌
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default React.memo(CharacterList);
