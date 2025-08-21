import { useCallback } from 'react';

/**
 * Custom hook for book operations
 * Extracts book-related operations from the main App component
 */
export function useBookOperations(book, setBook, bookRef, markAsChanged) {
  // Scene operations
  const handleSceneUpdate = useCallback(
    (sceneId, updates) => {
      setBook(prevBook => {
        const newBook = { ...prevBook };
        newBook.chapters = newBook.chapters.map(chapter => ({
          ...chapter,
          scenes: chapter.scenes.map(scene =>
            scene.id === sceneId ? { ...scene, ...updates } : scene
          )
        }));
        return newBook;
      });
      markAsChanged();
    },
    [setBook, markAsChanged]
  );

  const handleAddScene = useCallback(
    (chapterId, sceneData) => {
      setBook(prevBook => {
        const newBook = { ...prevBook };
        newBook.chapters = newBook.chapters.map(chapter =>
          chapter.id === chapterId
            ? {
                ...chapter,
                scenes: [
                  ...chapter.scenes,
                  {
                    id:
                      Date.now().toString() +
                      Math.random().toString(36).substr(2, 9),
                    title: sceneData.title || 'New Scene',
                    content: sceneData.content || '',
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                  }
                ]
              }
            : chapter
        );
        return newBook;
      });
      markAsChanged();
    },
    [setBook, markAsChanged]
  );

  const handleDeleteScene = useCallback(
    sceneId => {
      setBook(prevBook => {
        const newBook = { ...prevBook };
        newBook.chapters = newBook.chapters.map(chapter => ({
          ...chapter,
          scenes: chapter.scenes.filter(scene => scene.id !== sceneId)
        }));
        return newBook;
      });
      markAsChanged();
    },
    [setBook, markAsChanged]
  );

  // Chapter operations
  const handleChapterUpdate = useCallback(
    (chapterId, updates) => {
      setBook(prevBook => {
        const newBook = { ...prevBook };
        newBook.chapters = newBook.chapters.map(chapter =>
          chapter.id === chapterId ? { ...chapter, ...updates } : chapter
        );
        return newBook;
      });
      markAsChanged();
    },
    [setBook, markAsChanged]
  );

  const handleAddChapter = useCallback(
    chapterData => {
      setBook(prevBook => {
        const newChapter = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          title: chapterData.title || 'New Chapter',
          scenes: [
            {
              id:
                Date.now().toString() +
                Math.random().toString(36).substr(2, 9) +
                '_scene',
              title: 'Scene 1',
              content: '',
              created: new Date().toISOString(),
              modified: new Date().toISOString()
            }
          ]
        };

        return {
          ...prevBook,
          chapters: [...prevBook.chapters, newChapter]
        };
      });
      markAsChanged();
    },
    [setBook, markAsChanged]
  );

  const handleDeleteChapter = useCallback(
    chapterId => {
      setBook(prevBook => ({
        ...prevBook,
        chapters: prevBook.chapters.filter(chapter => chapter.id !== chapterId)
      }));
      markAsChanged();
    },
    [setBook, markAsChanged]
  );

  // Character operations
  const handleCharacterUpdate = useCallback(
    (characterId, updates) => {
      setBook(prevBook => ({
        ...prevBook,
        characters: prevBook.characters.map(char =>
          char.id === characterId ? { ...char, ...updates } : char
        )
      }));
      markAsChanged();
    },
    [setBook, markAsChanged]
  );

  const handleAddCharacter = useCallback(
    characterData => {
      setBook(prevBook => ({
        ...prevBook,
        characters: [
          ...prevBook.characters,
          {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name: characterData.name || 'New Character',
            description: characterData.description || '',
            notes: characterData.notes || '',
            created: new Date().toISOString(),
            modified: new Date().toISOString()
          }
        ]
      }));
      markAsChanged();
    },
    [setBook, markAsChanged]
  );

  const handleDeleteCharacter = useCallback(
    characterId => {
      setBook(prevBook => ({
        ...prevBook,
        characters: prevBook.characters.filter(char => char.id !== characterId)
      }));
      markAsChanged();
    },
    [setBook, markAsChanged]
  );

  // Location operations
  const handleLocationUpdate = useCallback(
    (locationId, updates) => {
      setBook(prevBook => ({
        ...prevBook,
        locations: prevBook.locations.map(loc =>
          loc.id === locationId ? { ...loc, ...updates } : loc
        )
      }));
      markAsChanged();
    },
    [setBook, markAsChanged]
  );

  const handleAddLocation = useCallback(
    locationData => {
      setBook(prevBook => ({
        ...prevBook,
        locations: [
          ...prevBook.locations,
          {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name: locationData.name || 'New Location',
            description: locationData.description || '',
            notes: locationData.notes || '',
            created: new Date().toISOString(),
            modified: new Date().toISOString()
          }
        ]
      }));
      markAsChanged();
    },
    [setBook, markAsChanged]
  );

  const handleDeleteLocation = useCallback(
    locationId => {
      setBook(prevBook => ({
        ...prevBook,
        locations: prevBook.locations.filter(loc => loc.id !== locationId)
      }));
      markAsChanged();
    },
    [setBook, markAsChanged]
  );

  return {
    // Scene operations
    handleSceneUpdate,
    handleAddScene,
    handleDeleteScene,

    // Chapter operations
    handleChapterUpdate,
    handleAddChapter,
    handleDeleteChapter,

    // Character operations
    handleCharacterUpdate,
    handleAddCharacter,
    handleDeleteCharacter,

    // Location operations
    handleLocationUpdate,
    handleAddLocation,
    handleDeleteLocation
  };
}
