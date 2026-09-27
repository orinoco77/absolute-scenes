// Pure functions for whole-book drafts. book.chapters / book.parts are always
// the ACTIVE draft's tree; inactive drafts live in book.drafts[].

const IMPLICIT_DRAFT_ID = 'default-draft';

let idCounter = 0;
export const newId = () =>
  `${Date.now().toString(36)}${(idCounter++).toString(36)}${Math.random()
    .toString(36)
    .slice(2, 6)}`;

const now = () => new Date().toISOString();
const touch = book => ({
  ...book,
  metadata: { ...book.metadata, modified: now() }
});

export const getActiveDraft = book =>
  book.activeDraft || {
    id: IMPLICIT_DRAFT_ID,
    name: 'Draft 1',
    created: book.metadata?.created || now()
  };

export const listDrafts = book => {
  const active = getActiveDraft(book);
  return [
    { ...active, isActive: true },
    ...(book.drafts || []).map(d => ({
      id: d.id,
      name: d.name,
      created: d.created,
      isActive: false
    }))
  ].sort((a, b) => String(a.created).localeCompare(String(b.created)));
};

export const getExportBook = (book, draftId) => {
  if (!draftId || draftId === getActiveDraft(book).id) return book;
  const draft = (book.drafts || []).find(d => d.id === draftId);
  if (!draft) return book;
  return { ...book, chapters: draft.chapters || [], parts: draft.parts || [] };
};

// Deep-copies chapters/parts with fresh ids. Revision history is not copied:
// the new draft starts each scene with its current text only.
const cloneTree = (chapters, parts, includeText) => {
  const chapterIdMap = new Map();
  const newChapters = (chapters || []).map(chapter => {
    const id = newId();
    chapterIdMap.set(chapter.id, id);
    return {
      ...chapter,
      id,
      scenes: (chapter.scenes || []).map(scene => {
        const {
          revisions: _revisions,
          activeRevision: _activeRevision,
          ...rest
        } = scene;
        return {
          ...rest,
          id: newId(),
          content: includeText ? scene.content || '' : '',
          notes: includeText ? scene.notes || '' : '',
          created: now(),
          modified: now()
        };
      })
    };
  });
  const newParts = (parts || []).map(part => ({
    ...part,
    id: newId(),
    chapterIds: (part.chapterIds || [])
      .map(id => chapterIdMap.get(id))
      .filter(Boolean)
  }));
  return { chapters: newChapters, parts: newParts };
};

export const createDraft = (book, { name, mode }) => {
  const active = getActiveDraft(book);
  const trimmed = (name || '').trim();
  const draftName = trimmed || `Draft ${listDrafts(book).length + 1}`;
  // 'copy': text and structure; 'empty': outline only (chapter and scene
  // titles, no text); 'blank': a fresh start, like a new book
  const { chapters, parts } =
    mode === 'blank'
      ? {
          chapters: [{ id: newId(), title: 'Chapter 1', scenes: [] }],
          parts: []
        }
      : cloneTree(book.chapters, book.parts, mode === 'copy');
  const draft = {
    id: newId(),
    name: draftName,
    created: now(),
    chapters,
    parts
  };
  return {
    book: touch({
      ...book,
      activeDraft: active,
      drafts: [...(book.drafts || []), draft]
    }),
    draftId: draft.id
  };
};

export const switchDraft = (book, draftId) => {
  const active = getActiveDraft(book);
  if (draftId === active.id) return book;
  const target = (book.drafts || []).find(d => d.id === draftId);
  if (!target) return book;
  const parked = {
    id: active.id,
    name: active.name,
    created: active.created,
    chapters: book.chapters,
    parts: book.parts || []
  };
  return touch({
    ...book,
    chapters: target.chapters,
    parts: target.parts || [],
    activeDraft: { id: target.id, name: target.name, created: target.created },
    drafts: (book.drafts || []).map(d => (d.id === draftId ? parked : d))
  });
};

export const renameDraft = (book, draftId, name) => {
  const trimmed = (name || '').trim();
  if (!trimmed) return book;
  const active = getActiveDraft(book);
  if (draftId === active.id) {
    return touch({ ...book, activeDraft: { ...active, name: trimmed } });
  }
  if (!(book.drafts || []).some(d => d.id === draftId)) return book;
  return touch({
    ...book,
    drafts: book.drafts.map(d =>
      d.id === draftId ? { ...d, name: trimmed } : d
    )
  });
};

export const deleteDraft = (book, draftId) => {
  if (draftId === getActiveDraft(book).id) {
    throw new Error('Cannot delete the active draft');
  }
  if (!(book.drafts || []).some(d => d.id === draftId)) {
    throw new Error('Draft not found');
  }
  return touch({ ...book, drafts: book.drafts.filter(d => d.id !== draftId) });
};
