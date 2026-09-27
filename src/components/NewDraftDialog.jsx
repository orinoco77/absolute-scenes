import { useState } from 'react';
import { createPortal } from 'react-dom';

function NewDraftDialog({ defaultName, onCreate, onClose }) {
  const [name, setName] = useState(defaultName);
  const [mode, setMode] = useState('copy');

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate({ name, mode });
    onClose();
  };

  // Portalled so the header's .book-info input styles don't leak in
  return createPortal(
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>New Draft</h2>
          <button onClick={onClose} className="close-btn">
            ×
          </button>
        </div>

        <div className="modal-content">
          <div className="form-group">
            <label htmlFor="new-draft-name">Name</label>
            <input
              id="new-draft-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="form-group new-draft-mode">
            <label>
              <input
                type="radio"
                name="new-draft-mode"
                value="copy"
                checked={mode === 'copy'}
                onChange={() => setMode('copy')}
              />
              Copy current text
            </label>
            <label>
              <input
                type="radio"
                name="new-draft-mode"
                value="empty"
                checked={mode === 'empty'}
                onChange={() => setMode('empty')}
              />
              Outline only (chapter and scene titles, no text)
            </label>
            <label>
              <input
                type="radio"
                name="new-draft-mode"
                value="blank"
                checked={mode === 'blank'}
                onChange={() => setMode('blank')}
              />
              Blank slate
            </label>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="btn-primary"
            disabled={!name.trim()}
          >
            Create
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default NewDraftDialog;
