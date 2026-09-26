import { useState } from 'react';
import { listDrafts } from '../utils/draftOperations';
import NewDraftDialog from './NewDraftDialog';

function DraftSwitcher({ book, onCreate, onSwitch, onRename, onDelete }) {
  const drafts = listDrafts(book);
  const active = drafts.find(d => d.isActive);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const rename = () => {
    setMenuOpen(false);
    const name = window.prompt('Rename draft', active.name);
    if (name && name.trim()) onRename(active.id, name);
  };

  const remove = draft => {
    setMenuOpen(false);
    if (window.confirm(`Delete “${draft.name}”? This cannot be undone.`)) {
      onDelete(draft.id);
    }
  };

  return (
    <div className="draft-switcher">
      <select
        aria-label="Draft"
        value={active.id}
        onChange={e => onSwitch(e.target.value)}
      >
        {drafts.map(d => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="icon-button"
        aria-label="New draft"
        title="Start a new draft of the whole book"
        onClick={() => setShowNew(true)}
      >
        ＋
      </button>
      <button
        type="button"
        className="icon-button"
        aria-label="Draft options"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen(o => !o)}
      >
        ⋯
      </button>
      {menuOpen && (
        <div className="draft-menu" role="menu">
          <button type="button" role="menuitem" onClick={rename}>
            Rename “{active.name}”…
          </button>
          {drafts
            .filter(d => !d.isActive)
            .map(d => (
              <button
                type="button"
                role="menuitem"
                key={d.id}
                onClick={() => remove(d)}
              >
                Delete “{d.name}”…
              </button>
            ))}
        </div>
      )}
      {showNew && (
        <NewDraftDialog
          defaultName={`Draft ${drafts.length + 1}`}
          onCreate={onCreate}
          onClose={() => setShowNew(false)}
        />
      )}
    </div>
  );
}

export default DraftSwitcher;
