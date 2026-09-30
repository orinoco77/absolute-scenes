import { getRevisionInfo } from '@absolute-scenes/book-model';
import { useRef, useState } from 'react';

// Oldest first. A scene without `created` stamps its implicit first revision
// in the same millisecond as the next one, so on a tie the implicit
// `${scene.id}-rev1` wins; other ties keep input order.
const byCreation = (scene, revisions) => {
  const implicitId = `${scene.id}-rev1`;
  return revisions
    .map((r, i) => ({ r, i }))
    .sort((a, b) => {
      const ca = a.r.created || '';
      const cb = b.r.created || '';
      if (ca !== cb) return ca < cb ? -1 : 1;
      if (a.r.id === implicitId) return -1;
      if (b.r.id === implicitId) return 1;
      return a.i - b.i;
    })
    .map(({ r }) => r);
};

function NewRevisionForm({ onCreate, onCancel }) {
  const [label, setLabel] = useState('');
  const [mode, setMode] = useState('copy');
  const [activate, setActivate] = useState(true);

  return (
    <div className="revision-form">
      <label>
        Label
        <input
          type="text"
          value={label}
          onChange={e => setLabel(e.target.value)}
          autoFocus
        />
      </label>
      <label>
        <input
          type="radio"
          name="new-revision-mode"
          checked={mode === 'copy'}
          onChange={() => setMode('copy')}
        />
        Copy current text
      </label>
      <label>
        <input
          type="radio"
          name="new-revision-mode"
          checked={mode === 'blank'}
          onChange={() => setMode('blank')}
        />
        Start blank
      </label>
      <label>
        <input
          type="checkbox"
          checked={activate}
          onChange={e => setActivate(e.target.checked)}
        />
        Switch to new revision
      </label>
      <div className="revision-form-actions">
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={() => onCreate({ label, mode, activate })}
        >
          Create
        </button>
      </div>
    </div>
  );
}

function RevisionChip({ scene, onCreate, onSwitch, onRename, onDelete }) {
  const info = getRevisionInfo(scene);
  const revisions = byCreation(scene, info.revisions);
  const activeIndex = revisions.findIndex(r => r.isActive) + 1;
  const [menuOpen, setMenuOpen] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [editLabel, setEditLabel] = useState('');
  // Guards against committing twice (Enter, then blur as the input unmounts)
  const renamingRef = useRef(false);

  const close = () => {
    setMenuOpen(false);
    setShowNew(false);
    setRenaming(false);
    renamingRef.current = false;
  };

  // In place rather than window.prompt, which Electron doesn't support
  const startRename = () => {
    setEditLabel(info.activeLabel);
    setRenaming(true);
    renamingRef.current = true;
  };

  const finishRename = save => {
    if (!renamingRef.current) return;
    renamingRef.current = false;
    setRenaming(false);
    const label = editLabel.trim();
    if (save && label && label !== info.activeLabel) {
      onRename(info.activeId, label);
    }
  };

  const remove = revision => {
    close();
    if (window.confirm(`Delete “${revision.label}”? This cannot be undone.`)) {
      onDelete(revision.id);
    }
  };

  return (
    <div className="revision-chip">
      <button
        type="button"
        className="revision-chip-button"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        title={info.activeLabel}
        onClick={() => {
          setMenuOpen(o => !o);
          setShowNew(false);
        }}
      >
        Revision {activeIndex} of {info.total}
      </button>
      {menuOpen && (
        <div className="revision-menu" role="menu">
          {showNew ? (
            <NewRevisionForm
              onCreate={opts => {
                close();
                onCreate(opts);
              }}
              onCancel={() => setShowNew(false)}
            />
          ) : (
            <>
              {revisions.map(r =>
                r.isActive && renaming ? (
                  <input
                    key={r.id}
                    type="text"
                    className="revision-rename"
                    aria-label="Revision name"
                    value={editLabel}
                    autoFocus
                    onChange={e => setEditLabel(e.target.value)}
                    onBlur={() => finishRename(true)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') finishRename(true);
                      if (e.key === 'Escape') finishRename(false);
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    role="menuitem"
                    key={r.id}
                    aria-current={r.isActive ? 'true' : undefined}
                    className={r.isActive ? 'active' : ''}
                    onClick={() => {
                      close();
                      if (!r.isActive) onSwitch(r.id);
                    }}
                  >
                    {r.label}
                  </button>
                )
              )}
              <hr />
              <button
                type="button"
                role="menuitem"
                onClick={() => setShowNew(true)}
              >
                New revision…
              </button>
              <button type="button" role="menuitem" onClick={startRename}>
                Rename “{info.activeLabel}”…
              </button>
              {revisions
                .filter(r => !r.isActive)
                .map(r => (
                  <button
                    type="button"
                    role="menuitem"
                    key={`delete-${r.id}`}
                    onClick={() => remove(r)}
                  >
                    Delete “{r.label}”…
                  </button>
                ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default RevisionChip;
