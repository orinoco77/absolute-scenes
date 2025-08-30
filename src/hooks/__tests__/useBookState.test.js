/* eslint-disable no-unused-vars */
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

    it('updates metadata timestamp when folder operations are performed', async () => {
      const { result } = renderUseBookState();
      const initialModified = result.current.book.metadata.modified;

      // Add a delay to ensure timestamp difference (minimum 10ms for reliable timestamp difference)
      await new Promise(resolve => setTimeout(resolve, 10));

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

  describe('drag and drop operations', () => {
    describe('moveSceneBetweenChapters', () => {
      it('moves scene from source chapter to target chapter', () => {
        const { result } = renderUseBookState();

        // First add another chapter and some scenes
        let chapter2Id, scene1Id;

        act(() => {
          chapter2Id = result.current.addChapter();
          scene1Id = result.current.addScene('default');
        });

        // Verify initial state
        let book = result.current.book;
        let chapter1 = book.chapters.find(ch => ch.id === 'default');
        let chapter2 = book.chapters.find(ch => ch.id === chapter2Id);

        expect(chapter1.scenes).toHaveLength(1);
        expect(chapter2.scenes).toHaveLength(0);
        expect(chapter1.scenes[0].id).toBe(scene1Id);

        // Move scene1 from chapter1 to chapter2
        act(() => {
          result.current.moveSceneBetweenChapters(
            scene1Id,
            'default',
            chapter2Id
          );
        });

        // Get updated book state
        book = result.current.book;
        chapter1 = book.chapters.find(ch => ch.id === 'default');
        chapter2 = book.chapters.find(ch => ch.id === chapter2Id);

        expect(chapter1.scenes).toHaveLength(0);
        expect(chapter2.scenes).toHaveLength(1);
        expect(chapter2.scenes[0].id).toBe(scene1Id);
        expect(chapter1.scenes.find(s => s.id === scene1Id)).toBeUndefined();
      });

      it('does nothing if scene is not found in source chapter', () => {
        const { result } = renderUseBookState();

        let chapter2Id;
        act(() => {
          chapter2Id = result.current.addChapter();
        });

        const initialBook = result.current.book;

        act(() => {
          result.current.moveSceneBetweenChapters(
            'nonexistent-scene',
            'default',
            chapter2Id
          );
        });

        const { book } = result.current;
        expect(book.chapters).toEqual(initialBook.chapters);
      });

      it('updates metadata timestamp when moving scenes', async () => {
        const { result } = renderUseBookState();
        const initialModified = result.current.book.metadata.modified;

        let chapter2Id, sceneId;
        act(() => {
          chapter2Id = result.current.addChapter();
          sceneId = result.current.addScene('default');
        });

        await new Promise(resolve => setTimeout(resolve, 10));

        act(() => {
          result.current.moveSceneBetweenChapters(
            sceneId,
            'default',
            chapter2Id
          );
        });

        const { book } = result.current;
        expect(book.metadata.modified).not.toBe(initialModified);
        expect(new Date(book.metadata.modified).getTime()).toBeGreaterThan(
          new Date(initialModified).getTime()
        );
      });
    });

    describe('moveChapterToPart', () => {
      it('moves chapter from one part to another', async () => {
        const { result } = renderUseBookState();

        let part1Id, part2Id, chapterId;

        act(() => {
          part1Id = result.current.addPart();
        });

        // Small delay to ensure unique IDs
        await new Promise(resolve => setTimeout(resolve, 1));

        act(() => {
          part2Id = result.current.addPart();
        });

        await new Promise(resolve => setTimeout(resolve, 1));

        act(() => {
          chapterId = result.current.addChapter();
        });

        // Verify parts are empty initially
        let book = result.current.book;
        let part1 = book.parts.find(p => p.id === part1Id);
        let part2 = book.parts.find(p => p.id === part2Id);

        expect(part1.chapterIds).toHaveLength(0);
        expect(part2.chapterIds).toHaveLength(0);

        // Add chapter to first part
        act(() => {
          result.current.addChapterToPart(chapterId, part1Id);
        });

        // Verify initial state - chapter should be in part1, not in part2
        book = result.current.book;
        part1 = book.parts.find(p => p.id === part1Id);
        part2 = book.parts.find(p => p.id === part2Id);

        expect(part1.chapterIds).toContain(chapterId);
        expect(part2.chapterIds).not.toContain(chapterId);

        // Move chapter from part1 to part2
        act(() => {
          result.current.moveChapterToPart(chapterId, part1Id, part2Id);
        });

        // Get updated book state
        book = result.current.book;
        part1 = book.parts.find(p => p.id === part1Id);
        part2 = book.parts.find(p => p.id === part2Id);

        expect(part1.chapterIds).not.toContain(chapterId);
        expect(part2.chapterIds).toContain(chapterId);
      });

      it('updates metadata timestamp when moving chapters', async () => {
        const { result } = renderUseBookState();

        let part1Id, part2Id, chapterId;
        act(() => {
          part1Id = result.current.addPart();
          part2Id = result.current.addPart();
          chapterId = result.current.addChapter();
          result.current.addChapterToPart(chapterId, part1Id);
        });

        const initialModified = result.current.book.metadata.modified;
        await new Promise(resolve => setTimeout(resolve, 10));

        act(() => {
          result.current.moveChapterToPart(chapterId, part1Id, part2Id);
        });

        const { book } = result.current;
        expect(book.metadata.modified).not.toBe(initialModified);
      });
    });

    describe('addChapterToPart', () => {
      it('adds chapter to part if not already there', () => {
        const { result } = renderUseBookState();

        let partId, chapterId;

        act(() => {
          partId = result.current.addPart();
          chapterId = result.current.addChapter();
        });

        // Verify chapter is not in part initially
        const initialPart = result.current.book.parts.find(
          p => p.id === partId
        );
        expect(initialPart.chapterIds).not.toContain(chapterId);

        // Add chapter to part
        act(() => {
          result.current.addChapterToPart(chapterId, partId);
        });

        const { book } = result.current;
        const updatedPart = book.parts.find(p => p.id === partId);
        expect(updatedPart.chapterIds).toContain(chapterId);
      });

      it('does not add chapter if already in part', () => {
        const { result } = renderUseBookState();

        let partId, chapterId;

        act(() => {
          partId = result.current.addPart();
          chapterId = result.current.addChapter();
          result.current.addChapterToPart(chapterId, partId);
        });

        const initialPart = result.current.book.parts.find(
          p => p.id === partId
        );
        const initialLength = initialPart.chapterIds.length;

        // Try to add same chapter again
        act(() => {
          result.current.addChapterToPart(chapterId, partId);
        });

        const { book } = result.current;
        const updatedPart = book.parts.find(p => p.id === partId);
        expect(updatedPart.chapterIds).toHaveLength(initialLength);
      });
    });

    describe('removeChapterFromPart', () => {
      it('removes chapter from part', () => {
        const { result } = renderUseBookState();

        let partId, chapterId;

        act(() => {
          partId = result.current.addPart();
          chapterId = result.current.addChapter();
          result.current.addChapterToPart(chapterId, partId);
        });

        // Verify chapter is in part
        const initialPart = result.current.book.parts.find(
          p => p.id === partId
        );
        expect(initialPart.chapterIds).toContain(chapterId);

        // Remove chapter from part
        act(() => {
          result.current.removeChapterFromPart(chapterId, partId);
        });

        const { book } = result.current;
        const updatedPart = book.parts.find(p => p.id === partId);
        expect(updatedPart.chapterIds).not.toContain(chapterId);
      });

      it('updates metadata timestamp when removing chapters', async () => {
        const { result } = renderUseBookState();

        let partId, chapterId;
        act(() => {
          partId = result.current.addPart();
          chapterId = result.current.addChapter();
          result.current.addChapterToPart(chapterId, partId);
        });

        const initialModified = result.current.book.metadata.modified;
        await new Promise(resolve => setTimeout(resolve, 10));

        act(() => {
          result.current.removeChapterFromPart(chapterId, partId);
        });

        const { book } = result.current;
        expect(book.metadata.modified).not.toBe(initialModified);
      });
    });
  });

  describe('state consistency and validation', () => {
    describe('book state integrity', () => {
      it('maintains consistent state after complex drag operations', async () => {
        const { result } = renderUseBookState();

        let part1Id, part2Id, chapter1Id, chapter2Id, scene1Id, scene2Id;

        // Create complex structure
        act(() => {
          part1Id = result.current.addPart();
        });
        await new Promise(resolve => setTimeout(resolve, 1));

        act(() => {
          part2Id = result.current.addPart();
        });
        await new Promise(resolve => setTimeout(resolve, 1));

        act(() => {
          chapter1Id = result.current.addChapter();
        });
        await new Promise(resolve => setTimeout(resolve, 1));

        act(() => {
          chapter2Id = result.current.addChapter();
          scene1Id = result.current.addScene(chapter1Id);
          scene2Id = result.current.addScene(chapter2Id);
        });

        // Add chapters to parts
        act(() => {
          result.current.addChapterToPart(chapter1Id, part1Id);
          result.current.addChapterToPart(chapter2Id, part2Id);
        });

        // Move chapter between parts
        act(() => {
          result.current.moveChapterToPart(chapter1Id, part1Id, part2Id);
        });

        // Move scene between chapters
        act(() => {
          result.current.moveSceneBetweenChapters(
            scene1Id,
            chapter1Id,
            chapter2Id
          );
        });

        const { book } = result.current;

        // Verify state consistency
        expect(book.parts).toHaveLength(2);
        expect(book.chapters).toHaveLength(3); // default + 2 we added

        // No chapter should be in multiple parts
        const allChapterIds = book.parts.flatMap(part => part.chapterIds);
        const uniqueChapterIds = [...new Set(allChapterIds)];
        expect(allChapterIds).toHaveLength(uniqueChapterIds.length);

        // All chapter IDs in parts should reference valid chapters
        const validChapterIds = book.chapters.map(ch => ch.id);
        allChapterIds.forEach(chapterId => {
          expect(validChapterIds).toContain(chapterId);
        });

        // Scenes should be in correct chapters
        const chapter2 = book.chapters.find(ch => ch.id === chapter2Id);
        expect(chapter2.scenes).toHaveLength(2); // Both scenes should be here now

        const chapter1 = book.chapters.find(ch => ch.id === chapter1Id);
        expect(chapter1.scenes).toHaveLength(0); // Scene moved out

        // Metadata should be updated
        expect(book.metadata.modified).toBeDefined();
      });

      it('prevents invalid states', () => {
        const { result } = renderUseBookState();

        let partId, chapterId;
        act(() => {
          partId = result.current.addPart();
          chapterId = result.current.addChapter();
        });

        // Add chapter to part twice - should not duplicate
        act(() => {
          result.current.addChapterToPart(chapterId, partId);
          result.current.addChapterToPart(chapterId, partId); // Second time
        });

        const { book } = result.current;
        const part = book.parts.find(p => p.id === partId);

        // Chapter should only appear once
        expect(part.chapterIds.filter(id => id === chapterId)).toHaveLength(1);
      });

      it('handles operations on non-existent items gracefully', () => {
        const { result } = renderUseBookState();
        const initialBook = result.current.book;

        // Try operations with fake IDs
        act(() => {
          result.current.moveChapterToPart(
            'fake-chapter',
            'fake-part1',
            'fake-part2'
          );
          result.current.moveSceneBetweenChapters(
            'fake-scene',
            'fake-chapter1',
            'fake-chapter2'
          );
          result.current.addChapterToPart('fake-chapter', 'fake-part');
        });

        const { book } = result.current;

        // Book should be unchanged (except metadata timestamp might change)
        expect(book.parts).toEqual(initialBook.parts);
        expect(book.chapters).toEqual(initialBook.chapters);
      });
    });

    describe('concurrent operation safety', () => {
      it('maintains consistency with rapid successive operations', async () => {
        const { result } = renderUseBookState();

        let partId, chapterId;
        act(() => {
          partId = result.current.addPart();
          chapterId = result.current.addChapter();
        });

        // Rapid operations that could cause race conditions
        act(() => {
          result.current.addChapterToPart(chapterId, partId);
          result.current.removeChapterFromPart(chapterId, partId);
          result.current.addChapterToPart(chapterId, partId);
        });

        const { book } = result.current;
        const part = book.parts.find(p => p.id === partId);

        // Final state should be consistent
        expect(part.chapterIds).toContain(chapterId);
        expect(part.chapterIds.filter(id => id === chapterId)).toHaveLength(1);
      });
    });

    describe('edge case validation', () => {
      it('handles empty book state operations', () => {
        const { result } = renderUseBookState();

        // Try operations on empty book (only has default chapter)
        expect(() => {
          act(() => {
            result.current.moveChapterToPart(
              'default',
              'nonexistent-part1',
              'nonexistent-part2'
            );
            result.current.moveSceneBetweenChapters(
              'nonexistent-scene',
              'default',
              'nonexistent-chapter'
            );
          });
        }).not.toThrow();

        // Default chapter should still exist
        const { book } = result.current;
        expect(book.chapters.find(ch => ch.id === 'default')).toBeDefined();
      });

      it('validates part and chapter relationships', async () => {
        const { result } = renderUseBookState();

        let part1Id, part2Id, chapterId;

        // Create parts with delay to ensure unique IDs
        act(() => {
          part1Id = result.current.addPart();
        });

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          part2Id = result.current.addPart();
        });

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          chapterId = result.current.addChapter();

          // Add chapter to part1
          result.current.addChapterToPart(chapterId, part1Id);
        });

        // Move to different part
        act(() => {
          result.current.moveChapterToPart(chapterId, part1Id, part2Id);
        });

        const { book } = result.current;
        const part1 = book.parts.find(p => p.id === part1Id);
        const part2 = book.parts.find(p => p.id === part2Id);

        // Chapter should only be in part2 now
        expect(part1.chapterIds).not.toContain(chapterId);
        expect(part2.chapterIds).toContain(chapterId);

        // Verify no duplicate references
        const allChapterRefs = book.parts.flatMap(p => p.chapterIds);
        expect(allChapterRefs.filter(id => id === chapterId)).toHaveLength(1);
      });
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
