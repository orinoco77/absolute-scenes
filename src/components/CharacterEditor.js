import React, { useState, useEffect } from 'react';

function CharacterEditor({ character, template, onCharacterUpdate }) {
  const [content, setContent] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [avatar, setAvatar] = useState('👤');
  const [notes, setNotes] = useState('');

  // Update local state when character changes
  useEffect(() => {
    if (character) {
      setContent(character.description || '');
      setName(character.name || '');
      setRole(character.role || '');
      setAvatar(character.avatar || '👤');
      setNotes(character.notes || '');
    } else {
      setContent('');
      setName('');
      setRole('');
      setAvatar('👤');
      setNotes('');
    }
  }, [character]);

  // Auto-save when content changes
  useEffect(() => {
    if (character && content !== (character.description || '')) {
      const timer = setTimeout(() => {
        onCharacterUpdate(character.id, { description: content });
      }, 1000); // Auto-save after 1 second of no typing
      
      return () => clearTimeout(timer);
    }
  }, [content, character, onCharacterUpdate]);

  const handleNameChange = (newName) => {
    setName(newName);
    if (character) {
      onCharacterUpdate(character.id, { name: newName });
    }
  };

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    if (character) {
      onCharacterUpdate(character.id, { role: newRole });
    }
  };

  const handleAvatarChange = (newAvatar) => {
    setAvatar(newAvatar);
    if (character) {
      onCharacterUpdate(character.id, { avatar: newAvatar });
    }
  };

  const handleNotesChange = (newNotes) => {
    setNotes(newNotes);
    if (character) {
      onCharacterUpdate(character.id, { notes: newNotes });
    }
  };

  const handleContentChange = (e) => {
    setContent(e.target.value);
  };

  const getWordCount = () => {
    return content.split(/\s+/).filter(word => word.length > 0).length;
  };

  const avatarOptions = ['👤', '👨', '👩', '👦', '👧', '👴', '👵', '🧔', '👨‍🦰', '👩‍🦰', '👨‍🦱', '👩‍🦱', '👨‍🦳', '👩‍🦳', '👨‍🦲', '👩‍🦲', '🤴', '👸', '🧙‍♂️', '🧙‍♀️', '🧝‍♂️', '🧝‍♀️', '🧛‍♂️', '🧛‍♀️', '🧞‍♂️', '🧞‍♀️', '🧚‍♂️', '🧚‍♀️'];

  if (!character) {
    return (
      <div className="character-editor">
        <div className="no-character">
          <h3>No Character Selected</h3>
          <p>Select a character from the list to edit their information, or create a new character.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="character-editor">
      <div className="character-header">
        <div className="character-title-section">
          <div className="character-avatar-selector">
            <div className="current-avatar" onClick={() => {
              const dropdown = document.querySelector('.avatar-dropdown');
              dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
            }}>
              {avatar}
            </div>
            <div className="avatar-dropdown" style={{ display: 'none' }}>
              {avatarOptions.map(emojiOption => (
                <button
                  key={emojiOption}
                  className="avatar-option"
                  onClick={() => {
                    handleAvatarChange(emojiOption);
                    document.querySelector('.avatar-dropdown').style.display = 'none';
                  }}
                >
                  {emojiOption}
                </button>
              ))}
            </div>
          </div>
          
          <div className="character-title-inputs">
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="character-name-input"
              placeholder="Character Name"
            />
            
            <input
              type="text"
              value={role}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="character-role-input"
              placeholder="Role (e.g., Protagonist, Antagonist, Supporting)"
            />
          </div>
        </div>
        
        <div className="character-stats">
          <span>Words: {getWordCount()}</span>
          <span>Modified: {new Date(character.modified).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="editor-container">
        <div className="editor-toolbar">
          <span>Character Description & Background</span>
          <div className="format-help">
            Use this space to describe your character's appearance, personality, backstory, motivations, and any other relevant details.
          </div>
        </div>
        
        <div className="character-editor-textarea">
          <textarea
            value={content}
            onChange={handleContentChange}
            placeholder="Describe your character here..."
            spellCheck="true"
          />
        </div>
      </div>

      <div className="character-notes">
        <label htmlFor="character-notes">Quick Notes & Ideas:</label>
        <textarea
          id="character-notes"
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="Quick notes, character arcs, relationships, or ideas..."
          rows={3}
        />
      </div>
    </div>
  );
}

export default CharacterEditor;