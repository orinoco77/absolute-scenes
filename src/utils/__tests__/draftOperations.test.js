import {
  newId,
  getActiveDraft,
  listDrafts,
  getExportBook,
  createDraft,
  switchDraft,
  renameDraft,
  deleteDraft
} from '../draftOperations';

const makeBook = () => ({
  title: 'T',
  chapters: [
    {
      id: 'c1',
      title: 'Chapter 1',
      scenes: [
        { id: 's1', title: 'One', content: 'alpha', revisions: [], notes: '' },
        { id: 's2', title: 'Two', content: 'beta', notes: 'n' }
      ]
    }
  ],
  parts: [{ id: 'p1', title: 'Part 1', chapterIds: ['c1'] }],
  characters: [{ id: 'ch1', name: 'A' }],
  metadata: {
    created: '2026-01-01T00:00:00.000Z',
    modified: '2026-01-01T00:00:00.000Z'
  }
});

describe('newId', () => {
  it('never repeats, even in a tight loop', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => newId()));
    expect(ids.size).toBe(1000);
  });
});

describe('getActiveDraft / listDrafts on a legacy book', () => {
  it('reports an implicit Draft 1', () => {
    const book = makeBook();
    expect(getActiveDraft(book)).toMatchObject({
      id: 'default-draft',
      name: 'Draft 1'
    });
    expect(listDrafts(book)).toEqual([
      expect.objectContaining({
        id: 'default-draft',
        name: 'Draft 1',
        isActive: true
      })
    ]);
  });
});

describe('createDraft', () => {
  it('copy mode: duplicates text with fresh ids and remaps parts, leaving the active draft alone', () => {
    const book = makeBook();
    const { book: next, draftId } = createDraft(book, {
      name: ' Draft 2 ',
      mode: 'copy'
    });

    expect(next.chapters).toBe(book.chapters); // active tree untouched
    expect(next.activeDraft).toMatchObject({
      id: 'default-draft',
      name: 'Draft 1'
    });
    expect(next.drafts).toHaveLength(1);

    const draft = next.drafts[0];
    expect(draft.id).toBe(draftId);
    expect(draft.name).toBe('Draft 2');
    expect(draft.chapters[0].id).not.toBe('c1');
    expect(draft.chapters[0].scenes.map(s => s.content)).toEqual([
      'alpha',
      'beta'
    ]);
    const newSceneIds = draft.chapters[0].scenes.map(s => s.id);
    expect(newSceneIds).not.toContain('s1');
    expect(newSceneIds).not.toContain('s2');
    expect(new Set(newSceneIds).size).toBe(2);
    expect(draft.parts).toEqual([
      {
        id: expect.any(String),
        title: 'Part 1',
        chapterIds: [draft.chapters[0].id]
      }
    ]);
    expect(draft.parts[0].id).not.toBe('p1');
  });

  it('copy mode: does not carry revision history into the copy', () => {
    const book = makeBook();
    book.chapters[0].scenes[0].revisions = [
      { id: 'r1', label: 'Old', created: 'x', content: 'old' }
    ];
    book.chapters[0].scenes[0].activeRevision = {
      id: 'r0',
      label: 'Revision 1',
      created: 'x'
    };
    const { book: next } = createDraft(book, { name: 'D2', mode: 'copy' });
    const copied = next.drafts[0].chapters[0].scenes[0];
    expect(copied.content).toBe('alpha');
    expect(copied.revisions).toBeUndefined();
    expect(copied.activeRevision).toBeUndefined();
  });

  it('empty mode: keeps chapter and scene titles but blanks content and notes', () => {
    const { book: next } = createDraft(makeBook(), {
      name: 'Fresh',
      mode: 'empty'
    });
    const scenes = next.drafts[0].chapters[0].scenes;
    expect(scenes.map(s => s.title)).toEqual(['One', 'Two']);
    expect(scenes.every(s => s.content === '')).toBe(true);
    expect(next.drafts[0].chapters[0].title).toBe('Chapter 1');
  });

  it('defaults an empty name to "Draft N"', () => {
    const { book: next } = createDraft(makeBook(), {
      name: '   ',
      mode: 'copy'
    });
    expect(next.drafts[0].name).toBe('Draft 2');
  });

  it('does not mutate the input book', () => {
    const book = makeBook();
    const snapshot = JSON.stringify(book);
    createDraft(book, { name: 'D2', mode: 'copy' });
    expect(JSON.stringify(book)).toBe(snapshot);
  });
});

describe('switchDraft', () => {
  it('swaps the active tree and parts with the chosen draft, losing nothing', () => {
    const book = makeBook();
    const { book: withDraft, draftId } = createDraft(book, {
      name: 'D2',
      mode: 'empty'
    });
    const switched = switchDraft(withDraft, draftId);

    expect(switched.activeDraft.id).toBe(draftId);
    expect(switched.chapters[0].scenes.every(s => s.content === '')).toBe(true);
    expect(switched.parts[0].chapterIds).toEqual([switched.chapters[0].id]);
    expect(switched.drafts).toHaveLength(1);
    expect(switched.drafts[0].id).toBe('default-draft');
    expect(switched.drafts[0].chapters[0].scenes[0].content).toBe('alpha');
    expect(switched.drafts[0].parts[0].chapterIds).toEqual(['c1']);
    expect(switched.characters).toBe(withDraft.characters); // shared
  });

  it('is a no-op for the active or an unknown draft', () => {
    const book = makeBook();
    expect(switchDraft(book, 'default-draft')).toBe(book);
    expect(switchDraft(book, 'nope')).toBe(book);
  });

  it('round-trips: switching away and back restores the original trees', () => {
    const book = makeBook();
    const { book: b1, draftId } = createDraft(book, {
      name: 'D2',
      mode: 'empty'
    });
    const there = switchDraft(b1, draftId);
    const back = switchDraft(there, 'default-draft');
    expect(back.chapters).toEqual(book.chapters);
    expect(back.parts).toEqual(book.parts);
  });
});

describe('renameDraft', () => {
  it('renames the active draft (materialising the implicit one)', () => {
    const next = renameDraft(makeBook(), 'default-draft', ' First ');
    expect(next.activeDraft.name).toBe('First');
  });

  it('renames an inactive draft', () => {
    const { book, draftId } = createDraft(makeBook(), {
      name: 'D2',
      mode: 'copy'
    });
    expect(renameDraft(book, draftId, 'Renamed').drafts[0].name).toBe(
      'Renamed'
    );
  });

  it('ignores an empty name', () => {
    const book = makeBook();
    expect(renameDraft(book, 'default-draft', '  ')).toBe(book);
  });
});

describe('deleteDraft', () => {
  it('removes an inactive draft', () => {
    const { book, draftId } = createDraft(makeBook(), {
      name: 'D2',
      mode: 'copy'
    });
    expect(deleteDraft(book, draftId).drafts).toEqual([]);
  });

  it('throws for the active draft', () => {
    expect(() => deleteDraft(makeBook(), 'default-draft')).toThrow(
      /active draft/i
    );
  });

  it('throws for an unknown draft', () => {
    expect(() => deleteDraft(makeBook(), 'nope')).toThrow(/not found/i);
  });
});

describe('getExportBook', () => {
  it('returns the book itself for a legacy book / active draft / missing id', () => {
    const book = makeBook();
    expect(getExportBook(book)).toBe(book);
    expect(getExportBook(book, 'default-draft')).toBe(book);
    expect(getExportBook(book, 'nope')).toBe(book);
  });

  it('returns the inactive draft chapters and parts merged over the shared book data', () => {
    const { book, draftId } = createDraft(makeBook(), {
      name: 'D2',
      mode: 'empty'
    });
    const exp = getExportBook(book, draftId);
    expect(exp.chapters).toBe(book.drafts[0].chapters);
    expect(exp.parts).toBe(book.drafts[0].parts);
    expect(exp.characters).toBe(book.characters);
    expect(exp.title).toBe('T');
  });

  it('tolerates a draft with missing parts', () => {
    const book = {
      ...makeBook(),
      drafts: [{ id: 'd', name: 'D', created: 'x', chapters: [] }]
    };
    expect(getExportBook(book, 'd').parts).toEqual([]);
  });
});
