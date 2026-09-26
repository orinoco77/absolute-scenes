import { useCallback } from 'react';
import * as drafts from '../utils/draftOperations';
import * as revisions from '../utils/revisionOperations';

const withScene = (book, sceneId, fn) => ({
  ...book,
  chapters: book.chapters.map(chapter => ({
    ...chapter,
    scenes: chapter.scenes.map(scene =>
      scene.id === sceneId ? fn(scene) : scene
    )
  })),
  metadata: { ...book.metadata, modified: new Date().toISOString() }
});

// bookRef (optional) lets createDraft return the new id synchronously: React
// may defer setBook updaters, so an id captured inside one is not reliable.
export const useDrafts = (setBook, bookRef) => {
  const createDraft = useCallback(
    opts => {
      if (bookRef?.current) {
        const result = drafts.createDraft(bookRef.current, opts);
        setBook(result.book);
        return result.draftId;
      }
      let draftId;
      setBook(prev => {
        const result = drafts.createDraft(prev, opts);
        draftId = result.draftId;
        return result.book;
      });
      return draftId;
    },
    [setBook, bookRef]
  );

  const switchDraft = useCallback(
    draftId => setBook(prev => drafts.switchDraft(prev, draftId)),
    [setBook]
  );
  const renameDraft = useCallback(
    (draftId, name) => setBook(prev => drafts.renameDraft(prev, draftId, name)),
    [setBook]
  );
  const deleteDraft = useCallback(
    draftId => setBook(prev => drafts.deleteDraft(prev, draftId)),
    [setBook]
  );

  const createRevision = useCallback(
    (sceneId, opts) =>
      setBook(prev =>
        withScene(prev, sceneId, s => revisions.createRevision(s, opts))
      ),
    [setBook]
  );
  const switchRevision = useCallback(
    (sceneId, revId) =>
      setBook(prev =>
        withScene(prev, sceneId, s => revisions.switchRevision(s, revId))
      ),
    [setBook]
  );
  const renameRevision = useCallback(
    (sceneId, revId, label) =>
      setBook(prev =>
        withScene(prev, sceneId, s => revisions.renameRevision(s, revId, label))
      ),
    [setBook]
  );
  const deleteRevision = useCallback(
    (sceneId, revId) =>
      setBook(prev =>
        withScene(prev, sceneId, s => revisions.deleteRevision(s, revId))
      ),
    [setBook]
  );

  return {
    createDraft,
    switchDraft,
    renameDraft,
    deleteDraft,
    createRevision,
    switchRevision,
    renameRevision,
    deleteRevision
  };
};
