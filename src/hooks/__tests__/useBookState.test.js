import { renderHook, act } from '@testing-library/react';
import { useBookState } from '../useBookState';

describe('useBookState', () => {
  const renderUseBookState = () => renderHook(() => useBookState());

  describe('initial state', () => {
    it('creates default book with correct structure', () => {
      const { result } = renderUseBookState();
      const { book } = result.current;

      expect(book).toMatchObject({
        title: '',
        author: '',
        frontMatter: [],
        parts: [],
        chapters: [
          {
            id: 'default',
            title: 'Chapter 1',
            scenes: []
          }
        ],
        backMatter: [],
        characters: [],
        locations: []
      });

      // Check that backgroundFolders exists
      expect(book.backgroundFolders).toBeDefined();
      expect(Array.isArray(book.backgroundFolders)).toBe(true);

      expect(book.metadata).toBeDefined();
      expect(book.metadata.created).toBeDefined();
      expect(book.metadata.modified).toBeDefined();

      expect(book.template).toBeDefined();
      expect(book.github).toBeDefined();
    });
  });

  describe('scene operations', () => {
    it('adds a scene to a chapter', () => {
      const { result } = renderUseBookState();
      let sceneId;

      act(() => {
        sceneId = result.current.addScene('default');
        expect(typeof sceneId).toBe('string');
      });

      const { book } = result.current;
      const defaultChapter = book.chapters.find(ch => ch.id === 'default');

      expect(defaultChapter.scenes).toHaveLength(1);
      expect(defaultChapter.scenes[0]).toMatchObject({
        title: 'Scene 1',
        content: '',
        notes: '',
        assignedAuthor: null
      });

      expect(defaultChapter.scenes[0].id).toBe(sceneId);
      expect(defaultChapter.scenes[0].created).toBeDefined();
      expect(defaultChapter.scenes[0].modified).toBeDefined();
    });

    it('updates a scene', () => {
      const { result } = renderUseBookState();
      let sceneId;

      act(() => {
        sceneId = result.current.addScene('default');
      });

      act(() => {
        result.current.updateScene(sceneId, {
          title: 'Updated Scene',
          content: 'Updated content\nwith newlines',
          notes: 'Updated notes'
        });
      });

      const { book } = result.current;
      const scene = book.chapters[0].scenes[0];

      expect(scene.title).toBe('Updated Scene');
      expect(scene.content).toBe('Updated content\nwith newlines');
      expect(scene.notes).toBe('Updated notes');
    });

    it('normalizes content on scene update', () => {
      const { result } = renderUseBookState();
      let sceneId;

      act(() => {
        sceneId = result.current.addScene('default');
      });

      act(() => {
        result.current.updateScene(sceneId, {
          content: 'Windows\r\nline endings\r\ntest',
          notes: 'Mac\rline endings\rtest'
        });
      });

      const { book } = result.current;
      const scene = book.chapters[0].scenes[0];

      expect(scene.content).toBe('Windows\nline endings\ntest');
      expect(scene.notes).toBe('Mac\nline endings\ntest');
    });

    it('deletes a scene', () => {
      const { result } = renderUseBookState();
      let sceneId;

      act(() => {
        sceneId = result.current.addScene('default');
      });

      act(() => {
        result.current.deleteScene(sceneId);
      });

      const { book } = result.current;
      expect(book.chapters[0].scenes).toHaveLength(0);
    });
  });

  describe('chapter operations', () => {
    it('adds a chapter', () => {
      const { result } = renderUseBookState();

      act(() => {
        const chapterId = result.current.addChapter();
        expect(typeof chapterId).toBe('string');
      });

      const { book } = result.current;
      expect(book.chapters).toHaveLength(2);
      expect(book.chapters[1]).toMatchObject({
        title: 'Chapter 2',
        scenes: [],
        assignedAuthor: null
      });
    });

    it('updates a chapter', () => {
      const { result } = renderUseBookState();

      act(() => {
        result.current.updateChapter('default', {
          title: 'Prologue',
          assignedAuthor: 'John Doe'
        });
      });

      const { book } = result.current;
      const chapter = book.chapters.find(ch => ch.id === 'default');

      expect(chapter.title).toBe('Prologue');
      expect(chapter.assignedAuthor).toBe('John Doe');
    });

    it('deletes a chapter but not the last one', () => {
      const { result } = renderUseBookState();
      let chapterId;

      act(() => {
        chapterId = result.current.addChapter();
      });

      act(() => {
        result.current.deleteChapter(chapterId);
      });

      const { book } = result.current;
      expect(book.chapters).toHaveLength(1);
      expect(book.chapters[0].id).toBe('default');
    });

    it('prevents deleting the last chapter', () => {
      const { result } = renderUseBookState();

      act(() => {
        result.current.deleteChapter('default');
      });

      const { book } = result.current;
      expect(book.chapters).toHaveLength(1);
      expect(book.chapters[0].id).toBe('default');
    });
  });

  describe('character operations', () => {
    it('adds a character', () => {
      const { result } = renderUseBookState();

      act(() => {
        const characterId = result.current.addCharacter();
        expect(typeof characterId).toBe('string');
      });

      const { book } = result.current;
      expect(book.characters).toHaveLength(1);
      expect(book.characters[0]).toMatchObject({
        name: 'Character 1',
        description: '',
        role: '',
        avatar: '👤',
        notes: ''
      });
    });

    it('updates a character', () => {
      const { result } = renderUseBookState();
      let characterId;

      act(() => {
        characterId = result.current.addCharacter();
      });

      act(() => {
        result.current.updateCharacter(characterId, {
          name: 'John Doe',
          description: 'Protagonist',
          role: 'Main Character',
          avatar: '🧙‍♂️'
        });
      });

      const { book } = result.current;
      const character = book.characters[0];

      expect(character.name).toBe('John Doe');
      expect(character.description).toBe('Protagonist');
      expect(character.role).toBe('Main Character');
      expect(character.avatar).toBe('🧙‍♂️');
    });

    it('deletes a character', () => {
      const { result } = renderUseBookState();
      let characterId;

      act(() => {
        characterId = result.current.addCharacter();
      });

      act(() => {
        result.current.deleteCharacter(characterId);
      });

      const { book } = result.current;
      expect(book.characters).toHaveLength(0);
    });
  });

  describe('back matter operations', () => {
    it('adds back matter', () => {
      const { result } = renderUseBookState();
      const backMatterItem = {
        id: 'test-epilogue',
        type: 'epilogue',
        title: 'Epilogue',
        content: 'The end.',
        enabled: true
      };

      act(() => {
        result.current.addBackMatter(backMatterItem);
      });

      const { book } = result.current;
      expect(book.backMatter).toHaveLength(1);
      expect(book.backMatter[0]).toEqual(backMatterItem);
    });

    it('updates back matter', () => {
      const { result } = renderUseBookState();
      const backMatterItem = {
        id: 'test-epilogue',
        type: 'epilogue',
        title: 'Epilogue',
        content: 'The end.',
        enabled: true
      };

      act(() => {
        result.current.addBackMatter(backMatterItem);
      });

      const updatedItem = {
        ...backMatterItem,
        content: 'Updated ending.',
        enabled: false
      };

      act(() => {
        result.current.updateBackMatter('test-epilogue', updatedItem);
      });

      const { book } = result.current;
      expect(book.backMatter[0].content).toBe('Updated ending.');
      expect(book.backMatter[0].enabled).toBe(false);
    });

    it('deletes back matter', () => {
      const { result } = renderUseBookState();
      const backMatterItem = {
        id: 'test-epilogue',
        type: 'epilogue',
        title: 'Epilogue',
        content: 'The end.',
        enabled: true
      };

      act(() => {
        result.current.addBackMatter(backMatterItem);
      });

      act(() => {
        result.current.deleteBackMatter('test-epilogue');
      });

      const { book } = result.current;
      expect(book.backMatter).toHaveLength(0);
    });
  });

  describe('metadata updates', () => {
    it('updates book metadata', () => {
      const { result } = renderUseBookState();

      act(() => {
        result.current.updateBookMetadata({
          title: 'My Great Novel',
          author: 'Jane Smith'
        });
      });

      const { book } = result.current;
      expect(book.title).toBe('My Great Novel');
      expect(book.author).toBe('Jane Smith');
      expect(book.metadata.modified).toBeDefined();
    });

    it('updates template settings', () => {
      const { result } = renderUseBookState();

      act(() => {
        result.current.updateTemplate({
          fontFamily: 'Arial',
          fontSize: 14,
          textAlign: 'left'
        });
      });

      const { book } = result.current;
      expect(book.template.fontFamily).toBe('Arial');
      expect(book.template.fontSize).toBe(14);
      expect(book.template.textAlign).toBe('left');
    });
  });

  describe('utility functions', () => {
    it('getCurrentScene returns correct scene', () => {
      const { result } = renderUseBookState();
      let sceneId;

      act(() => {
        sceneId = result.current.addScene('default');
        result.current.updateScene(sceneId, { title: 'Test Scene' });
      });

      const scene = result.current.getCurrentScene(sceneId);
      expect(scene.title).toBe('Test Scene');
    });

    it('getCurrentScene returns null for invalid id', () => {
      const { result } = renderUseBookState();
      const scene = result.current.getCurrentScene('invalid-id');
      expect(scene).toBeNull();
    });

    it('getCurrentCharacter returns correct character', () => {
      const { result } = renderUseBookState();
      let characterId;

      act(() => {
        characterId = result.current.addCharacter();
        result.current.updateCharacter(characterId, { name: 'Test Character' });
      });

      const character = result.current.getCurrentCharacter(characterId);
      expect(character.name).toBe('Test Character');
    });

    it('getCurrentBackMatter returns correct back matter', () => {
      const { result } = renderUseBookState();
      const backMatterItem = {
        id: 'test-item',
        type: 'epilogue',
        title: 'Test Epilogue',
        content: 'Test content',
        enabled: true
      };

      act(() => {
        result.current.addBackMatter(backMatterItem);
      });

      const backMatter = result.current.getCurrentBackMatter('test-item');
      expect(backMatter.title).toBe('Test Epilogue');
    });
  });

  describe('book recovery', () => {
    it('can recover from old format book', () => {
      const { result } = renderUseBookState();
      const oldFormatBook = {
        title: 'Old Book',
        author: 'Old Author',
        chapters: [
          {
            id: '1',
            title: 'Chapter 1',
            scenes: [
              {
                id: 'scene1',
                title: 'Old Scene',
                content: 'Old content',
                notes: ''
              }
            ]
          }
        ]
      };

      act(() => {
        result.current.recoverBook(oldFormatBook);
      });

      const { book } = result.current;
      expect(book.title).toBe('Old Book');
      expect(book.author).toBe('Old Author');
      expect(book.chapters).toHaveLength(1);
      expect(book.chapters[0].title).toBe('Chapter 1');
      expect(book.chapters[0].scenes).toHaveLength(1);
      expect(book.chapters[0].scenes[0].title).toBe('Old Scene');
    });
  });

  describe('background folder operations', () => {
    it('adds a background folder', () => {
      const { result } = renderUseBookState();
      const initialFolderCount = result.current.book.backgroundFolders.length;

      let newFolderId;
      act(() => {
        newFolderId = result.current.addBackgroundFolder();
      });

      const { book } = result.current;
      expect(book.backgroundFolders).toHaveLength(initialFolderCount + 1);

      const newFolder = book.backgroundFolders.find(f => f.id === newFolderId);
      expect(newFolder).toBeDefined();
      expect(newFolder.title).toBe(`Folder ${initialFolderCount + 1}`);
      expect(newFolder.documents).toEqual([]);
      expect(newFolder.created).toBeDefined();
      expect(newFolder.modified).toBeDefined();
    });

    it('updates a background folder', () => {
      const { result } = renderUseBookState();
      const folderId = result.current.book.backgroundFolders[0].id;
      const updates = {
        title: 'Updated Folder Name'
      };

      act(() => {
        result.current.updateBackgroundFolder(folderId, updates);
      });

      const { book } = result.current;
      const updatedFolder = book.backgroundFolders.find(f => f.id === folderId);
      expect(updatedFolder.title).toBe('Updated Folder Name');
      expect(updatedFolder.modified).toBeDefined();
    });

    it('deletes a background folder', () => {
      const { result } = renderUseBookState();
      let newFolderId;

      // First add a folder
      act(() => {
        newFolderId = result.current.addBackgroundFolder();
      });

      const folderCountAfterAdd = result.current.book.backgroundFolders.length;

      // Then delete it
      act(() => {
        result.current.deleteBackgroundFolder(newFolderId);
      });

      const { book } = result.current;
      expect(book.backgroundFolders).toHaveLength(folderCountAfterAdd - 1);
      expect(
        book.backgroundFolders.find(f => f.id === newFolderId)
      ).toBeUndefined();
    });

    it('updates metadata timestamp when folder operations are performed', () => {
      const { result } = renderUseBookState();
      const initialModified = result.current.book.metadata.modified;

      act(() => {
        result.current.addBackgroundFolder();
      });

      const { book } = result.current;
      expect(book.metadata.modified).not.toBe(initialModified);
      expect(new Date(book.metadata.modified).getTime()).toBeGreaterThan(
        new Date(initialModified).getTime()
      );
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
      expect(bookRef.current).not.toBe(initialBook); // Reference should change
    });
  });
});
