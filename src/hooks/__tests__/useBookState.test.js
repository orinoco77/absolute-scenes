import { renderHook, act } from '@testing-library/react';
import { useBookState } from '../useBookState';

describe('useBookState', () => {
  const renderUseBookState = () => renderHook(() => useBookState());

  describe('initial state', () => {
    it('creates a default book via book-model', () => {
      const { result } = renderUseBookState();
      const { book } = result.current;

      expect(book.chapters).toEqual([
        { id: 'default', title: 'Chapter 1', scenes: [] }
      ]);
      expect(book.template).toBeDefined();
      expect(book.github).toBeDefined();
      expect(book.metadata.created).toBeDefined();
      expect(book.metadata.modified).toBeDefined();
      expect(Array.isArray(book.backgroundFolders)).toBe(true);
    });
  });

  describe('"add" operations return the id of the item they just created', () => {
    it('addScene returns a real scene in the target chapter', () => {
      const { result } = renderUseBookState();
      let sceneId;
      act(() => {
        sceneId = result.current.addScene('default');
      });
      const scene = result.current.book.chapters[0].scenes.find(
        s => s.id === sceneId
      );
      expect(scene).toBeDefined();
      expect(scene.title).toBe('Scene 1');
    });

    it('addChapter returns a real chapter', () => {
      const { result } = renderUseBookState();
      let chapterId;
      act(() => {
        chapterId = result.current.addChapter();
      });
      const chapter = result.current.book.chapters.find(
        c => c.id === chapterId
      );
      expect(chapter).toBeDefined();
      expect(chapter.title).toBe('Chapter 2');
    });

    it('addCharacter returns a real character', () => {
      const { result } = renderUseBookState();
      let characterId;
      act(() => {
        characterId = result.current.addCharacter();
      });
      expect(
        result.current.book.characters.find(c => c.id === characterId)
      ).toBeDefined();
    });

    it('addLocation returns a real location', () => {
      const { result } = renderUseBookState();
      let locationId;
      act(() => {
        locationId = result.current.addLocation();
      });
      expect(
        result.current.book.locations.find(l => l.id === locationId)
      ).toBeDefined();
    });

    it('addPart returns a real part', () => {
      const { result } = renderUseBookState();
      let partId;
      act(() => {
        partId = result.current.addPart();
      });
      expect(
        result.current.book.parts.find(p => p.id === partId)
      ).toBeDefined();
    });

    it('addDocument returns a real document in the target folder', () => {
      const { result } = renderUseBookState();
      const folderId = result.current.book.backgroundFolders[0].id;
      let documentId;
      act(() => {
        documentId = result.current.addDocument(folderId);
      });
      const folder = result.current.book.backgroundFolders.find(
        f => f.id === folderId
      );
      expect(folder.documents.find(d => d.id === documentId)).toBeDefined();
    });

    it('addBackgroundFolder returns a real folder', () => {
      const { result } = renderUseBookState();
      let folderId;
      act(() => {
        folderId = result.current.addBackgroundFolder();
      });
      const folder = result.current.book.backgroundFolders.find(
        f => f.id === folderId
      );
      expect(folder).toBeDefined();
      expect(folder.title).toBe('Folder 2');
    });
  });

  describe('mutations delegate to book-model and update book state', () => {
    it('updateScene applies the change', () => {
      const { result } = renderUseBookState();
      let sceneId;
      act(() => {
        sceneId = result.current.addScene('default');
      });
      act(() => {
        result.current.updateScene(sceneId, { content: 'Hello' });
      });
      expect(result.current.book.chapters[0].scenes[0].content).toBe('Hello');
    });

    it('deleteScene removes the scene', () => {
      const { result } = renderUseBookState();
      let sceneId;
      act(() => {
        sceneId = result.current.addScene('default');
      });
      act(() => {
        result.current.deleteScene(sceneId);
      });
      expect(result.current.book.chapters[0].scenes).toHaveLength(0);
    });

    it('moveSceneBetweenChapters moves the scene', () => {
      const { result } = renderUseBookState();
      let sceneId, secondChapterId;
      act(() => {
        sceneId = result.current.addScene('default');
        secondChapterId = result.current.addChapter();
      });
      act(() => {
        result.current.moveSceneBetweenChapters(
          sceneId,
          'default',
          secondChapterId
        );
      });
      expect(result.current.book.chapters[0].scenes).toHaveLength(0);
      const target = result.current.book.chapters.find(
        c => c.id === secondChapterId
      );
      expect(target.scenes[0].id).toBe(sceneId);
    });
  });

  describe('error propagation', () => {
    it('throws when an operation is given an id that does not exist', () => {
      const { result } = renderUseBookState();
      expect(() => {
        act(() => {
          result.current.updateScene('missing', { content: 'x' });
        });
      }).toThrow('Scene not found: missing');
    });

    it('still blocks deleting the last chapter, now via a throw instead of a silent no-op', () => {
      const { result } = renderUseBookState();
      expect(() => {
        act(() => {
          result.current.deleteChapter('default');
        });
      }).toThrow('Cannot delete the last chapter');
    });
  });

  describe('book recovery', () => {
    it('migrates a legacy book without chapters into the current shape', () => {
      const { result } = renderUseBookState();
      act(() => {
        result.current.recoverBook({
          scenes: [{ id: 's1', title: 'S', content: 'x', notes: '' }],
          metadata: {
            created: '2020-01-01T00:00:00.000Z',
            modified: '2020-01-01T00:00:00.000Z'
          }
        });
      });
      expect(result.current.book.chapters).toEqual([
        {
          id: 'default',
          title: 'Chapter 1',
          scenes: [{ id: 's1', title: 'S', content: 'x', notes: '' }]
        }
      ]);
    });
  });

  describe('bookRef synchronization', () => {
    it('keeps bookRef in sync with book state', () => {
      const { result } = renderUseBookState();
      const { bookRef } = result.current;
      const initialBook = bookRef.current;

      act(() => {
        result.current.updateBookMetadata({ title: 'New Title' });
      });

      expect(bookRef.current.title).toBe('New Title');
      expect(bookRef.current).not.toBe(initialBook);
    });

    it('bookRef reflects an "add" operation immediately, not only on next render', () => {
      const { result } = renderUseBookState();
      act(() => {
        result.current.addChapter();
        expect(result.current.bookRef.current.chapters).toHaveLength(2);
      });
    });
  });
});
