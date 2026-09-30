import * as bookModel from '@absolute-scenes/book-model';
import { useState, useCallback, useRef } from 'react';

export const useBookState = (initialBook = null) => {
  const [book, setBookInternal] = useState(
    initialBook || bookModel.createDefaultBook()
  );
  const bookRef = useRef(book);

  // Keep bookRef in sync with book state
  const setBook = useCallback(newBookOrUpdater => {
    if (typeof newBookOrUpdater === 'function') {
      setBookInternal(prev => {
        const updated = newBookOrUpdater(prev);
        bookRef.current = updated;
        return updated;
      });
    } else {
      setBookInternal(newBookOrUpdater);
      bookRef.current = newBookOrUpdater;
    }
  }, []);

  const updateBookMetadata = useCallback(
    metadata => {
      setBook(bookModel.updateBookMetadata(bookRef.current, metadata));
    },
    [setBook]
  );

  const updateTemplate = useCallback(
    templateUpdates => {
      setBook(bookModel.updateTemplate(bookRef.current, templateUpdates));
    },
    [setBook]
  );

  const updateGitHubSettings = useCallback(
    settings => {
      setBook(bookModel.updateGitHubSettings(bookRef.current, settings));
    },
    [setBook]
  );

  const updateGitHubSyncStatus = useCallback(
    settings => {
      setBook(bookModel.updateGitHubSyncStatus(bookRef.current, settings));
    },
    [setBook]
  );

  // Scene operations
  const updateScene = useCallback(
    (sceneId, updates) => {
      setBook(bookModel.updateScene(bookRef.current, sceneId, updates));
    },
    [setBook]
  );

  const addScene = useCallback(
    chapterId => {
      const newBook = bookModel.addScene(bookRef.current, chapterId);
      setBook(newBook);
      const chapter = newBook.chapters.find(ch => ch.id === chapterId);
      return chapter.scenes[chapter.scenes.length - 1].id;
    },
    [setBook]
  );

  const deleteScene = useCallback(
    sceneId => {
      setBook(bookModel.deleteScene(bookRef.current, sceneId));
    },
    [setBook]
  );

  const moveSceneBetweenChapters = useCallback(
    (sceneId, fromChapterId, toChapterId) => {
      setBook(
        bookModel.moveSceneBetweenChapters(
          bookRef.current,
          sceneId,
          fromChapterId,
          toChapterId
        )
      );
    },
    [setBook]
  );

  const reorderScenesInChapter = useCallback(
    (chapterId, fromIndex, toIndex) => {
      setBook(
        bookModel.reorderScenesInChapter(
          bookRef.current,
          chapterId,
          fromIndex,
          toIndex
        )
      );
    },
    [setBook]
  );

  // Chapter operations
  const updateChapter = useCallback(
    (chapterId, updates) => {
      setBook(bookModel.updateChapter(bookRef.current, chapterId, updates));
    },
    [setBook]
  );

  const addChapter = useCallback(() => {
    const newBook = bookModel.addChapter(bookRef.current);
    setBook(newBook);
    return newBook.chapters[newBook.chapters.length - 1].id;
  }, [setBook]);

  const deleteChapter = useCallback(
    chapterId => {
      setBook(bookModel.deleteChapter(bookRef.current, chapterId));
    },
    [setBook]
  );

  const reorderChapters = useCallback(
    (fromIndex, toIndex) => {
      setBook(bookModel.reorderChapters(bookRef.current, fromIndex, toIndex));
    },
    [setBook]
  );

  // Character operations
  const updateCharacter = useCallback(
    (characterId, updates) => {
      setBook(bookModel.updateCharacter(bookRef.current, characterId, updates));
    },
    [setBook]
  );

  const addCharacter = useCallback(() => {
    const newBook = bookModel.addCharacter(bookRef.current);
    setBook(newBook);
    return newBook.characters[newBook.characters.length - 1].id;
  }, [setBook]);

  const deleteCharacter = useCallback(
    characterId => {
      setBook(bookModel.deleteCharacter(bookRef.current, characterId));
    },
    [setBook]
  );

  // Location operations
  const updateLocation = useCallback(
    (locationId, updates) => {
      setBook(bookModel.updateLocation(bookRef.current, locationId, updates));
    },
    [setBook]
  );

  const addLocation = useCallback(() => {
    const newBook = bookModel.addLocation(bookRef.current);
    setBook(newBook);
    return newBook.locations[newBook.locations.length - 1].id;
  }, [setBook]);

  const deleteLocation = useCallback(
    locationId => {
      setBook(bookModel.deleteLocation(bookRef.current, locationId));
    },
    [setBook]
  );

  // Part operations
  const addPart = useCallback(() => {
    const newBook = bookModel.addPart(bookRef.current);
    setBook(newBook);
    return newBook.parts[newBook.parts.length - 1].id;
  }, [setBook]);

  const updatePart = useCallback(
    (partId, updates) => {
      setBook(bookModel.updatePart(bookRef.current, partId, updates));
    },
    [setBook]
  );

  const deletePart = useCallback(
    partId => {
      setBook(bookModel.deletePart(bookRef.current, partId));
    },
    [setBook]
  );

  const reorderParts = useCallback(
    (fromIndex, toIndex) => {
      setBook(bookModel.reorderParts(bookRef.current, fromIndex, toIndex));
    },
    [setBook]
  );

  // Chapter-to-part operations
  const moveChapterToPart = useCallback(
    (chapterId, fromPartId, toPartId) => {
      setBook(
        bookModel.moveChapterToPart(
          bookRef.current,
          chapterId,
          fromPartId,
          toPartId
        )
      );
    },
    [setBook]
  );

  const addChapterToPart = useCallback(
    (chapterId, toPartId) => {
      setBook(bookModel.addChapterToPart(bookRef.current, chapterId, toPartId));
    },
    [setBook]
  );

  const removeChapterFromPart = useCallback(
    (chapterId, fromPartId) => {
      setBook(
        bookModel.removeChapterFromPart(bookRef.current, chapterId, fromPartId)
      );
    },
    [setBook]
  );

  const reorderChaptersInPart = useCallback(
    (partId, fromIndex, toIndex) => {
      setBook(
        bookModel.reorderChaptersInPart(
          bookRef.current,
          partId,
          fromIndex,
          toIndex
        )
      );
    },
    [setBook]
  );

  // Document operations
  const addDocument = useCallback(
    folderId => {
      const newBook = bookModel.addDocument(bookRef.current, folderId);
      setBook(newBook);
      const folder = newBook.backgroundFolders.find(f => f.id === folderId);
      return folder.documents[folder.documents.length - 1].id;
    },
    [setBook]
  );

  const updateDocument = useCallback(
    (documentId, updates) => {
      setBook(bookModel.updateDocument(bookRef.current, documentId, updates));
    },
    [setBook]
  );

  const deleteDocument = useCallback(
    documentId => {
      setBook(bookModel.deleteDocument(bookRef.current, documentId));
    },
    [setBook]
  );

  // Background folder operations
  const addBackgroundFolder = useCallback(() => {
    const newBook = bookModel.addBackgroundFolder(bookRef.current);
    setBook(newBook);
    return newBook.backgroundFolders[newBook.backgroundFolders.length - 1].id;
  }, [setBook]);

  const updateBackgroundFolder = useCallback(
    (folderId, updates) => {
      setBook(
        bookModel.updateBackgroundFolder(bookRef.current, folderId, updates)
      );
    },
    [setBook]
  );

  const deleteBackgroundFolder = useCallback(
    folderId => {
      setBook(bookModel.deleteBackgroundFolder(bookRef.current, folderId));
    },
    [setBook]
  );

  // Front matter operations
  const addFrontMatter = useCallback(
    frontMatterItem => {
      setBook(bookModel.addFrontMatter(bookRef.current, frontMatterItem));
    },
    [setBook]
  );

  const updateFrontMatter = useCallback(
    (frontMatterId, updatedFrontMatter) => {
      setBook(
        bookModel.updateFrontMatter(
          bookRef.current,
          frontMatterId,
          updatedFrontMatter
        )
      );
    },
    [setBook]
  );

  const deleteFrontMatter = useCallback(
    frontMatterId => {
      setBook(bookModel.deleteFrontMatter(bookRef.current, frontMatterId));
    },
    [setBook]
  );

  const toggleFrontMatter = useCallback(
    (frontMatterId, enabled) => {
      setBook(
        bookModel.toggleFrontMatter(bookRef.current, frontMatterId, enabled)
      );
    },
    [setBook]
  );

  const reorderFrontMatter = useCallback(
    (fromIndex, toIndex) => {
      setBook(
        bookModel.reorderFrontMatter(bookRef.current, fromIndex, toIndex)
      );
    },
    [setBook]
  );

  // Back matter operations
  const addBackMatter = useCallback(
    backMatterItem => {
      setBook(bookModel.addBackMatter(bookRef.current, backMatterItem));
    },
    [setBook]
  );

  const updateBackMatter = useCallback(
    (backMatterId, updatedBackMatter) => {
      setBook(
        bookModel.updateBackMatter(
          bookRef.current,
          backMatterId,
          updatedBackMatter
        )
      );
    },
    [setBook]
  );

  const deleteBackMatter = useCallback(
    backMatterId => {
      setBook(bookModel.deleteBackMatter(bookRef.current, backMatterId));
    },
    [setBook]
  );

  const toggleBackMatter = useCallback(
    (backMatterId, enabled) => {
      setBook(
        bookModel.toggleBackMatter(bookRef.current, backMatterId, enabled)
      );
    },
    [setBook]
  );

  const reorderBackMatter = useCallback(
    (fromIndex, toIndex) => {
      setBook(bookModel.reorderBackMatter(bookRef.current, fromIndex, toIndex));
    },
    [setBook]
  );

  // Illustration operations
  const addIllustration = useCallback(
    illustration => {
      setBook(bookModel.addIllustration(bookRef.current, illustration));
    },
    [setBook]
  );

  const updateIllustration = useCallback(
    (illustrationId, updatedIllustration) => {
      setBook(
        bookModel.updateIllustration(
          bookRef.current,
          illustrationId,
          updatedIllustration
        )
      );
    },
    [setBook]
  );

  const deleteIllustration = useCallback(
    illustrationId => {
      setBook(bookModel.deleteIllustration(bookRef.current, illustrationId));
    },
    [setBook]
  );

  // Recovery operations
  const recoverBook = useCallback(
    recoveredBookData => {
      setBook(bookModel.recoverBook(recoveredBookData));
    },
    [setBook]
  );

  const resetBook = useCallback(() => {
    setBook(bookModel.createDefaultBook());
  }, [setBook]);

  // Utility functions
  const getCurrentScene = useCallback(
    sceneId => bookModel.getCurrentScene(book, sceneId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [book.chapters]
  );

  const getCurrentCharacter = useCallback(
    characterId => bookModel.getCurrentCharacter(book, characterId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [book.characters]
  );

  const getCurrentDocument = useCallback(
    documentId => bookModel.getCurrentDocument(book, documentId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [book.backgroundFolders]
  );

  const getCurrentLocation = useCallback(
    locationId => bookModel.getCurrentLocation(book, locationId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [book.locations]
  );

  const getCurrentFrontMatter = useCallback(
    frontMatterId => bookModel.getCurrentFrontMatter(book, frontMatterId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [book.frontMatter]
  );

  const getCurrentBackMatter = useCallback(
    backMatterId => bookModel.getCurrentBackMatter(book, backMatterId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [book.backMatter]
  );

  const getCurrentIllustration = useCallback(
    illustrationId => bookModel.getCurrentIllustration(book, illustrationId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [book.illustrations]
  );

  return {
    book,
    bookRef,
    setBook,

    // Metadata operations
    updateBookMetadata,
    updateTemplate,
    updateGitHubSettings,
    updateGitHubSyncStatus,

    // Content operations
    updateScene,
    addScene,
    deleteScene,
    moveSceneBetweenChapters,
    reorderScenesInChapter,
    updateChapter,
    addChapter,
    deleteChapter,
    reorderChapters,
    updateCharacter,
    addCharacter,
    deleteCharacter,
    updateLocation,
    addLocation,
    deleteLocation,
    addPart,
    updatePart,
    deletePart,
    reorderParts,
    moveChapterToPart,
    addChapterToPart,
    removeChapterFromPart,
    reorderChaptersInPart,
    addDocument,
    updateDocument,
    deleteDocument,
    addBackgroundFolder,
    updateBackgroundFolder,
    deleteBackgroundFolder,
    addFrontMatter,
    updateFrontMatter,
    deleteFrontMatter,
    toggleFrontMatter,
    reorderFrontMatter,
    addBackMatter,
    updateBackMatter,
    deleteBackMatter,
    toggleBackMatter,
    reorderBackMatter,

    // Illustration operations
    addIllustration,
    updateIllustration,
    deleteIllustration,

    // Recovery operations
    recoverBook,
    resetBook,

    // Utility functions
    getCurrentScene,
    getCurrentCharacter,
    getCurrentDocument,
    getCurrentLocation,
    getCurrentFrontMatter,
    getCurrentBackMatter,
    getCurrentIllustration
  };
};
