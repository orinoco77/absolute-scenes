import { listDrafts } from '@absolute-scenes/book-model';
import { useEffect, useRef, useState } from 'react';
import NewDraftDialog from './NewDraftDialog';

function DraftSwitcher({ book, onCreate, onSwitch, onRename, onDelete }) {
  const drafts = listDrafts(book);
  const active = drafts.find(d => d.isActive);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const containerRef = useRef(null);
  // Guards against committing twice (Enter, then blur as the input unmounts)
  const editingRef = useRef(null);

  const closeMenu = () => {
    setMenuOpen(false);
    setEditingId(null);
    editingRef.current = null;
  };

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onMouseDown = e => {
      if (!containerRef.current?.contains(e.target)) closeMenu();
    };
    const onKeyDown = e => {
      if (e.key === 'Escape') closeMenu();
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  const choose = draft => {
    closeMenu();
    if (!draft.isActive) onSwitch(draft.id);
  };

  const startRename = draft => {
    setEditingId(draft.id);
    setEditName(draft.name);
    editingRef.current = draft.id;
  };

  const finishRename = save => {
    const id = editingRef.current;
    if (!id) return;
    editingRef.current = null;
    setEditingId(null);
    const draft = drafts.find(d => d.id === id);
    const name = editName.trim();
    if (save && draft && name && name !== draft.name) onRename(id, name);
  };

  const remove = draft => {
    if (window.confirm(`Delete “${draft.name}”? This cannot be undone.`)) {
      onDelete(draft.id);
    }
  };

  const startNew = () => {
    closeMenu();
    setShowNew(true);
  };

  return (
    <div className="draft-switcher" ref={containerRef}>
      <button
        type="button"
        className="draft-switcher-trigger"
        aria-label={`Draft: ${active.name}`}
        aria-haspopup="true"
        aria-expanded={menuOpen}
        title="Switch, rename or create drafts of the whole book"
        onClick={() => (menuOpen ? closeMenu() : setMenuOpen(true))}
      >
        <span aria-hidden="true">📝</span>
        <span className="draft-switcher-name">{active.name}</span>
        <span aria-hidden="true">▾</span>
      </button>
      {menuOpen && (
        <div className="draft-menu" role="group" aria-label="Drafts">
          {drafts.map(d => (
            <div
              key={d.id}
              className={`draft-menu-row${d.isActive ? ' active' : ''}`}
            >
              {editingId === d.id ? (
                <input
                  type="text"
                  className="draft-menu-rename"
                  aria-label="Draft name"
                  value={editName}
                  autoFocus
                  onChange={e => setEditName(e.target.value)}
                  onBlur={() => finishRename(true)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') finishRename(true);
                    if (e.key === 'Escape') {
                      // Cancel the rename only; keep the menu open
                      e.stopPropagation();
                      finishRename(false);
                    }
                  }}
                />
              ) : (
                <button
                  type="button"
                  className="draft-menu-name"
                  aria-current={d.isActive ? 'true' : undefined}
                  onClick={() => choose(d)}
                >
                  {d.name}
                </button>
              )}
              <button
                type="button"
                className="draft-menu-action"
                aria-label={`Rename “${d.name}”`}
                title="Rename"
                onClick={() => startRename(d)}
              >
                ✎
              </button>
              {!d.isActive && (
                <button
                  type="button"
                  className="draft-menu-action draft-menu-delete"
                  aria-label={`Delete “${d.name}”`}
                  title="Delete"
                  onClick={() => remove(d)}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <hr />
          <button type="button" className="draft-menu-new" onClick={startNew}>
            ＋ New draft…
          </button>
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
