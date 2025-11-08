import { useState, useCallback, useRef } from 'react';

// Utility function to normalize content for cross-platform consistency
const normalizeContent = content => {
  if (typeof content !== 'string') return content;
  // Normalize line endings to LF and ensure consistent encoding
  return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
};

// Default book structure
const createDefaultBook = () => ({
  title: '',
  author: '',
  frontMatter: [], // Optional front matter sections
  parts: [], // Optional parts to organize chapters
  chapters: [
    {
      id: 'default',
      title: 'Chapter 1',
      scenes: []
    }
  ],
  backMatter: [], // Optional back matter sections
  illustrations: [], // Full-page illustrations with page assignments
  characters: [],
  characterDetectionBlacklist: [],
  locations: [],
  backgroundFolders: [
    {
      id: 'default-bg',
      title: 'General Notes',
      documents: []
    }
  ],
  template: {
    fontFamily: 'Times New Roman',
    fontSize: 12,
    lineHeight: 1.6,
    paragraphStyle: 'indented',
    pageSize: 'letter',
    genre: 'general',
    pageMargins: {
      top: 1,
      bottom: 1,
      inside: 1.25, // Inner margin (towards spine)
      outside: 1 // Outer margin (towards edge)
    },
    mirrorMargins: false, // Use different margins for odd/even pages
    textAlign: 'justified', // 'left', 'justified'
    chapterHeader: {
      style: 'numbered',
      format: 'Chapter {number}',
      fontSize: 18,
      fontWeight: 'bold',
      alignment: 'center',
      pageBreak: true,
      spacing: 2,
      lineBreaksBefore: 3,
      startOnRightPage: false
    },
    runningHeaders: {
      enabled: false,
      alignment: 'outside', // 'outside' or 'center'
      fontSize: 10,
      skipChapterPages: true
    }
  },
  github: {
    repository: null,
    lastSyncTime: null
  },
  metadata: {
    created: new Date().toISOString(),
    modified: new Date().toISOString()
  },
  collaboration: {
    enabled: false, // Hidden until multiple authors are detected
    authors: [], // List of author names for assignment
    currentAuthor: null // Currently signed-in author
  }
});

export const useBookState = (initialBook = null) => {
  const [book, setBookInternal] = useState(initialBook || createDefaultBook());
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
      setBook(prev => ({
        ...prev,
        ...metadata,
        metadata: { ...prev.metadata, modified: new Date().toISOString() }
      }));
    },
    [setBook]
  );

  const updateTemplate = useCallback(
    templateUpdates => {
      setBook(prev => ({
        ...prev,
        template: { ...prev.template, ...templateUpdates },
        metadata: { ...prev.metadata, modified: new Date().toISOString() }
      }));
    },
    [setBook]
  );

  const updateGitHubSettings = useCallback(
    settings => {
      setBook(prev => ({
        ...prev,
        github: { ...prev.github, ...settings },
        metadata: { ...prev.metadata, modified: new Date().toISOString() }
      }));
    },
    [setBook]
  );

  const updateGitHubSyncStatus = useCallback(
    settings => {
      // Update GitHub settings without marking as changed (for sync metadata only)
      setBook(prev => ({
        ...prev,
        github: { ...prev.github, ...settings }
      }));
    },
    [setBook]
  );

  // Scene operations
  const updateScene = useCallback(
    (sceneId, updates) => {
      // Normalize content if it's being updated
      const normalizedUpdates = { ...updates };
      if (normalizedUpdates.content) {
        normalizedUpdates.content = normalizeContent(normalizedUpdates.content);
      }
      if (normalizedUpdates.notes) {
        normalizedUpdates.notes = normalizeContent(normalizedUpdates.notes);
      }

      setBook(prev => ({
        ...prev,
        chapters: prev.chapters.map(chapter => ({
          ...chapter,
          scenes: chapter.scenes.map(scene =>
            scene.id === sceneId
              ? {
                  ...scene,
                  ...normalizedUpdates,
                  modified: new Date().toISOString()
                }
              : scene
          )
        })),
        metadata: { ...prev.metadata, modified: new Date().toISOString() }
      }));
    },
    [setBook]
  );

  const addScene = useCallback(
    chapterId => {
      const newScene = {
        id: Date.now().toString(),
        title: '',
        content: '',
        notes: '',
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        assignedAuthor: null
      };

      setBook(prev => {
        const chapter = prev.chapters.find(ch => ch.id === chapterId);
        if (!chapter) return prev;

        newScene.title = `Scene ${chapter.scenes.length + 1}`;

        return {
          ...prev,
          chapters: prev.chapters.map(chapter =>
            chapter.id === chapterId
              ? { ...chapter, scenes: [...chapter.scenes, newScene] }
              : chapter
          ),
          metadata: { ...prev.metadata, modified: new Date().toISOString() }
        };
      });

      return newScene.id;
    },
    [setBook]
  );

  const deleteScene = useCallback(
    sceneId => {
      setBook(prev => ({
        ...prev,
        chapters: prev.chapters.map(chapter => ({
          ...chapter,
          scenes: chapter.scenes.filter(scene => scene.id !== sceneId)
        })),
        metadata: { ...prev.metadata, modified: new Date().toISOString() }
      }));
    },
    [setBook]
  );

  const moveSceneBetweenChapters = useCallback(
    (sceneId, fromChapterId, toChapterId) => {
      setBook(prev => {
        let sceneToMove = null;

        // First, find and remove the scene from its current chapter
        const updatedChapters = prev.chapters.map(chapter => {
          if (chapter.id === fromChapterId) {
            const sceneIndex = chapter.scenes.findIndex(s => s.id === sceneId);
            if (sceneIndex !== -1) {
              sceneToMove = chapter.scenes[sceneIndex];
              return {
                ...chapter,
                scenes: chapter.scenes.filter(s => s.id !== sceneId)
              };
            }
          }
          return chapter;
        });

        // Then add the scene to the target chapter
        if (sceneToMove) {
          const finalChapters = updatedChapters.map(chapter => {
            if (chapter.id === toChapterId) {
              return {
                ...chapter,
                scenes: [...chapter.scenes, sceneToMove]
              };
            }
            return chapter;
          });

          return {
            ...prev,
            chapters: finalChapters,
            metadata: { ...prev.metadata, modified: new Date().toISOString() }
          };
        }

        return prev; // No changes if scene not found
      });
    },
    [setBook]
  );

  const reorderScenesInChapter = useCallback(
    (chapterId, fromIndex, toIndex) => {
      setBook(prev => {
        const updatedChapters = prev.chapters.map(chapter => {
          if (chapter.id === chapterId) {
            const scenes = [...chapter.scenes];
            const [movedScene] = scenes.splice(fromIndex, 1);
            scenes.splice(toIndex, 0, movedScene);
            return { ...chapter, scenes };
          }
          return chapter;
        });

        return {
          ...prev,
          chapters: updatedChapters,
          metadata: { ...prev.metadata, modified: new Date().toISOString() }
        };
      });
    },
    [setBook]
  );

  // Chapter operations
  const updateChapter = useCallback(
    (chapterId, updates) => {
      setBook(prev => ({
        ...prev,
        chapters: prev.chapters.map(chapter =>
          chapter.id === chapterId ? { ...chapter, ...updates } : chapter
        ),
        metadata: { ...prev.metadata, modified: new Date().toISOString() }
      }));
    },
    [setBook]
  );

  const addChapter = useCallback(() => {
    const newChapter = {
      id: Date.now().toString(),
      title: '',
      scenes: [],
      assignedAuthor: null
    };

    setBook(prev => {
      newChapter.title = `Chapter ${prev.chapters.length + 1}`;
      return {
        ...prev,
        chapters: [...prev.chapters, newChapter],
        metadata: { ...prev.metadata, modified: new Date().toISOString() }
      };
    });

    return newChapter.id;
  }, [setBook]);

  const deleteChapter = useCallback(
    chapterId => {
      setBook(prev => {
        if (prev.chapters.length <= 1) {
          return prev; // Cannot delete the last chapter
        }
        return {
          ...prev,
          chapters: prev.chapters.filter(ch => ch.id !== chapterId),
          metadata: { ...prev.metadata, modified: new Date().toISOString() }
        };
      });
    },
    [setBook]
  );

  const reorderChapters = useCallback(
    (fromIndex, toIndex) => {
      setBook(prev => {
        const chapters = [...prev.chapters];
        const [movedChapter] = chapters.splice(fromIndex, 1);
        chapters.splice(toIndex, 0, movedChapter);

        return {
          ...prev,
          chapters,
          metadata: { ...prev.metadata, modified: new Date().toISOString() }
        };
      });
    },
    [setBook]
  );

  // Character operations
  const updateCharacter = useCallback(
    (characterId, updates) => {
      setBook(prev => ({
        ...prev,
        characters: prev.characters.map(character =>
          character.id === characterId
            ? { ...character, ...updates, modified: new Date().toISOString() }
            : character
        ),
        metadata: { ...prev.metadata, modified: new Date().toISOString() }
      }));
    },
    [setBook]
  );

  const addCharacter = useCallback(() => {
    const newCharacter = {
      id: Date.now().toString(),
      name: '',
      description: '',
      role: '',
      avatar: '👤',
      notes: '',
      created: new Date().toISOString(),
      modified: new Date().toISOString()
    };

    setBook(prev => {
      newCharacter.name = `Character ${prev.characters.length + 1}`;
      return {
        ...prev,
        characters: [...prev.characters, newCharacter],
        metadata: { ...prev.metadata, modified: new Date().toISOString() }
      };
    });

    return newCharacter.id;
  }, [setBook]);

  const deleteCharacter = useCallback(
    characterId => {
      setBook(prev => ({
        ...prev,
        characters: prev.characters.filter(
          character => character.id !== characterId
        ),
        metadata: { ...prev.metadata, modified: new Date().toISOString() }
      }));
    },
    [setBook]
  );

  // Location operations
  const updateLocation = useCallback(
    (locationId, updates) => {
      setBook(prev => ({
        ...prev,
        locations: prev.locations.map(location =>
          location.id === locationId
            ? { ...location, ...updates, modified: new Date().toISOString() }
            : location
        ),
        metadata: { ...prev.metadata, modified: new Date().toISOString() }
      }));
    },
    [setBook]
  );

  const addLocation = useCallback(() => {
    const newLocation = {
      id: Date.now().toString(),
      name: '',
      description: '',
      type: 'General',
      icon: '📍',
      notes: '',
      created: new Date().toISOString(),
      modified: new Date().toISOString()
    };

    setBook(prev => {
      newLocation.name = `Location ${prev.locations.length + 1}`;
      return {
        ...prev,
        locations: [...prev.locations, newLocation],
        metadata: { ...prev.metadata, modified: new Date().toISOString() }
      };
    });

    return newLocation.id;
  }, [setBook]);

  const deleteLocation = useCallback(
    locationId => {
      setBook(prev => ({
        ...prev,
        locations: prev.locations.filter(
          location => location.id !== locationId
        ),
        metadata: { ...prev.metadata, modified: new Date().toISOString() }
      }));
    },
    [setBook]
  );

  // Part operations
  const addPart = useCallback(() => {
    const newPart = {
      id: Date.now().toString(),
      title: '',
      chapterIds: []
    };

    setBook(prev => {
      newPart.title = `Part ${prev.parts.length + 1}`;
      return {
        ...prev,
        parts: [...prev.parts, newPart],
        metadata: { ...prev.metadata, modified: new Date().toISOString() }
      };
    });

    return newPart.id;
  }, [setBook]);

  const updatePart = useCallback(
    (partId, updates) => {
      setBook(prev => ({
        ...prev,
        parts: prev.parts.map(part =>
          part.id === partId ? { ...part, ...updates } : part
        ),
        metadata: { ...prev.metadata, modified: new Date().toISOString() }
      }));
    },
    [setBook]
  );

  const deletePart = useCallback(
    partId => {
      setBook(prev => ({
        ...prev,
        parts: prev.parts.filter(p => p.id !== partId),
        metadata: { ...prev.metadata, modified: new Date().toISOString() }
      }));
    },
    [setBook]
  );

  const reorderParts = useCallback(
    (fromIndex, toIndex) => {
      setBook(prev => {
        const parts = [...prev.parts];
        const [movedPart] = parts.splice(fromIndex, 1);
        parts.splice(toIndex, 0, movedPart);

        return {
          ...prev,
          parts,
          metadata: { ...prev.metadata, modified: new Date().toISOString() }
        };
      });
    },
    [setBook]
  );

  // Chapter-to-part operations
  const moveChapterToPart = useCallback(
    (chapterId, fromPartId, toPartId) => {
      setBook(prev => {
        const newParts = prev.parts.map(part => {
          if (part.id === fromPartId) {
            // Remove chapter from current part
            return {
              ...part,
              chapterIds: part.chapterIds.filter(id => id !== chapterId)
            };
          } else if (part.id === toPartId) {
            // Add chapter to new part if not already there
            if (!part.chapterIds.includes(chapterId)) {
              return {
                ...part,
                chapterIds: [...part.chapterIds, chapterId]
              };
            }
            // Return unchanged part if chapter already exists
            return part;
          }
          return part;
        });

        return {
          ...prev,
          parts: newParts,
          metadata: { ...prev.metadata, modified: new Date().toISOString() }
        };
      });
    },
    [setBook]
  );

  const addChapterToPart = useCallback(
    (chapterId, toPartId) => {
      setBook(prev => {
        const newParts = prev.parts.map(part => {
          if (part.id === toPartId) {
            // Add chapter to part if not already there
            if (!part.chapterIds.includes(chapterId)) {
              return {
                ...part,
                chapterIds: [...part.chapterIds, chapterId]
              };
            }
            // Return unchanged part if chapter already exists
            return part;
          }
          return part;
        });

        return {
          ...prev,
          parts: newParts,
          metadata: { ...prev.metadata, modified: new Date().toISOString() }
        };
      });
    },
    [setBook]
  );

  const removeChapterFromPart = useCallback(
    (chapterId, fromPartId) => {
      setBook(prev => {
        const newParts = prev.parts.map(part => {
          if (part.id === fromPartId) {
            return {
              ...part,
              chapterIds: part.chapterIds.filter(id => id !== chapterId)
            };
          }
          return part;
        });

        return {
          ...prev,
          parts: newParts,
          metadata: { ...prev.metadata, modified: new Date().toISOString() }
        };
      });
    },
    [setBook]
  );

  const reorderChaptersInPart = useCallback(
    (partId, fromIndex, toIndex) => {
      setBook(prev => {
        const newParts = prev.parts.map(part => {
          if (part.id === partId) {
            const chapterIds = [...part.chapterIds];
            const [movedChapterId] = chapterIds.splice(fromIndex, 1);
            chapterIds.splice(toIndex, 0, movedChapterId);
            return { ...part, chapterIds };
          }
          return part;
        });

        return {
          ...prev,
          parts: newParts,
          metadata: { ...prev.metadata, modified: new Date().toISOString() }
        };
      });
    },
    [setBook]
  );

  // Document operations
  const addDocument = useCallback(
    folderId => {
      const newDocument = {
        id: Date.now().toString(),
        title: '',
        content: '',
        created: new Date().toISOString(),
        modified: new Date().toISOString()
      };

      setBook(prev => {
        const folder = prev.backgroundFolders.find(f => f.id === folderId);
        if (!folder) return prev;

        newDocument.title = `Document ${folder.documents.length + 1}`;

        return {
          ...prev,
          backgroundFolders: prev.backgroundFolders.map(folder =>
            folder.id === folderId
              ? { ...folder, documents: [...folder.documents, newDocument] }
              : folder
          ),
          metadata: { ...prev.metadata, modified: new Date().toISOString() }
        };
      });

      return newDocument.id;
    },
    [setBook]
  );

  const updateDocument = useCallback(
    (documentId, updates) => {
      setBook(prev => ({
        ...prev,
        backgroundFolders: prev.backgroundFolders.map(folder => ({
          ...folder,
          documents: folder.documents.map(doc =>
            doc.id === documentId
              ? { ...doc, ...updates, modified: new Date().toISOString() }
              : doc
          )
        })),
        metadata: { ...prev.metadata, modified: new Date().toISOString() }
      }));
    },
    [setBook]
  );

  const deleteDocument = useCallback(
    documentId => {
      setBook(prev => ({
        ...prev,
        backgroundFolders: prev.backgroundFolders.map(folder => ({
          ...folder,
          documents: folder.documents.filter(doc => doc.id !== documentId)
        })),
        metadata: { ...prev.metadata, modified: new Date().toISOString() }
      }));
    },
    [setBook]
  );

  // Background folder operations
  const addBackgroundFolder = useCallback(() => {
    const newFolder = {
      id: Date.now().toString(),
      title: '',
      documents: [],
      created: new Date().toISOString(),
      modified: new Date().toISOString()
    };

    setBook(prev => {
      newFolder.title = `Folder ${prev.backgroundFolders.length + 1}`;

      return {
        ...prev,
        backgroundFolders: [...prev.backgroundFolders, newFolder],
        metadata: { ...prev.metadata, modified: new Date().toISOString() }
      };
    });

    return newFolder.id; // Return the new folder ID
  }, [setBook]);

  const updateBackgroundFolder = useCallback(
    (folderId, updates) => {
      setBook(prev => ({
        ...prev,
        backgroundFolders: prev.backgroundFolders.map(folder =>
          folder.id === folderId
            ? { ...folder, ...updates, modified: new Date().toISOString() }
            : folder
        ),
        metadata: { ...prev.metadata, modified: new Date().toISOString() }
      }));
    },
    [setBook]
  );

  const deleteBackgroundFolder = useCallback(
    folderId => {
      setBook(prev => ({
        ...prev,
        backgroundFolders: prev.backgroundFolders.filter(
          folder => folder.id !== folderId
        ),
        metadata: { ...prev.metadata, modified: new Date().toISOString() }
      }));
    },
    [setBook]
  );

  // Front matter operations
  const addFrontMatter = useCallback(
    frontMatterItem => {
      setBook(prev => ({
        ...prev,
        frontMatter: [...prev.frontMatter, frontMatterItem],
        metadata: { ...prev.metadata, modified: new Date().toISOString() }
      }));
    },
    [setBook]
  );

  const updateFrontMatter = useCallback(
    (frontMatterId, updatedFrontMatter) => {
      setBook(prev => ({
        ...prev,
        frontMatter: prev.frontMatter.map(fm =>
          fm.id === frontMatterId ? updatedFrontMatter : fm
        ),
        metadata: { ...prev.metadata, modified: new Date().toISOString() }
      }));
    },
    [setBook]
  );

  const deleteFrontMatter = useCallback(
    frontMatterId => {
      setBook(prev => ({
        ...prev,
        frontMatter: prev.frontMatter.filter(fm => fm.id !== frontMatterId),
        metadata: { ...prev.metadata, modified: new Date().toISOString() }
      }));
    },
    [setBook]
  );

  // Back matter operations
  const addBackMatter = useCallback(
    backMatterItem => {
      setBook(prev => ({
        ...prev,
        backMatter: [...(prev.backMatter || []), backMatterItem],
        metadata: { ...prev.metadata, modified: new Date().toISOString() }
      }));
    },
    [setBook]
  );

  const updateBackMatter = useCallback(
    (backMatterId, updatedBackMatter) => {
      setBook(prev => ({
        ...prev,
        backMatter: (prev.backMatter || []).map(bm =>
          bm.id === backMatterId ? updatedBackMatter : bm
        ),
        metadata: { ...prev.metadata, modified: new Date().toISOString() }
      }));
    },
    [setBook]
  );

  const deleteBackMatter = useCallback(
    backMatterId => {
      setBook(prev => ({
        ...prev,
        backMatter: (prev.backMatter || []).filter(
          bm => bm.id !== backMatterId
        ),
        metadata: { ...prev.metadata, modified: new Date().toISOString() }
      }));
    },
    [setBook]
  );

  // Illustration operations
  const addIllustration = useCallback(
    illustration => {
      setBook(prev => ({
        ...prev,
        illustrations: [...(prev.illustrations || []), illustration],
        metadata: { ...prev.metadata, modified: new Date().toISOString() }
      }));
    },
    [setBook]
  );

  const updateIllustration = useCallback(
    (illustrationId, updatedIllustration) => {
      setBook(prev => ({
        ...prev,
        illustrations: (prev.illustrations || []).map(ill =>
          ill.id === illustrationId ? updatedIllustration : ill
        ),
        metadata: { ...prev.metadata, modified: new Date().toISOString() }
      }));
    },
    [setBook]
  );

  const deleteIllustration = useCallback(
    illustrationId => {
      setBook(prev => ({
        ...prev,
        illustrations: (prev.illustrations || []).filter(
          ill => ill.id !== illustrationId
        ),
        metadata: { ...prev.metadata, modified: new Date().toISOString() }
      }));
    },
    [setBook]
  );

  // Recovery operations
  const recoverBook = useCallback(
    recoveredBookData => {
      // Normalize all text content for cross-platform consistency
      const normalizeBookContent = book => {
        return {
          ...book,
          chapters:
            book.chapters?.map(chapter => ({
              ...chapter,
              scenes:
                chapter.scenes?.map(scene => ({
                  ...scene,
                  content: normalizeContent(scene.content),
                  notes: normalizeContent(scene.notes)
                })) || []
            })) || [],
          frontMatter:
            book.frontMatter?.map(item => ({
              ...item,
              content: normalizeContent(item.content)
            })) || [],
          backMatter:
            book.backMatter?.map(item => ({
              ...item,
              content: normalizeContent(item.content)
            })) || [],
          characters:
            book.characters?.map(char => ({
              ...char,
              description: normalizeContent(char.description),
              notes: normalizeContent(char.notes)
            })) || [],
          locations:
            book.locations?.map(loc => ({
              ...loc,
              description: normalizeContent(loc.description)
            })) || []
        };
      };

      // Migrate old formats
      const migratedBook = { ...recoveredBookData };

      // Migrate old format to new chapter format if needed
      if (migratedBook.scenes && !migratedBook.chapters) {
        migratedBook.chapters = [
          {
            id: 'default',
            title: 'Chapter 1',
            scenes: migratedBook.scenes
          }
        ];
        delete migratedBook.scenes;
      }

      // Add missing arrays
      if (!migratedBook.frontMatter) migratedBook.frontMatter = [];
      if (!migratedBook.parts) migratedBook.parts = [];
      if (!migratedBook.characters) migratedBook.characters = [];
      if (!migratedBook.characterDetectionBlacklist)
        migratedBook.characterDetectionBlacklist = [];
      if (!migratedBook.locations) migratedBook.locations = [];
      if (!migratedBook.backgroundFolders) {
        migratedBook.backgroundFolders = [
          {
            id: 'default-bg',
            title: 'General Notes',
            documents: []
          }
        ];
      }
      if (!migratedBook.github) {
        migratedBook.github = {
          repository: null,
          lastSyncTime: null
        };
      }

      const normalizedBook = normalizeBookContent(migratedBook);
      setBook(normalizedBook);
    },
    [setBook]
  );

  const resetBook = useCallback(() => {
    const newBook = createDefaultBook();
    setBook(newBook);
  }, [setBook]);

  // Utility functions
  const getCurrentScene = useCallback(
    sceneId => {
      if (!sceneId) return null;
      for (const chapter of book.chapters) {
        const scene = chapter.scenes.find(scene => scene.id === sceneId);
        if (scene) return scene;
      }
      return null;
    },
    [book.chapters]
  );

  const getCurrentCharacter = useCallback(
    characterId => {
      if (!characterId) return null;
      return (
        book.characters.find(character => character.id === characterId) || null
      );
    },
    [book.characters]
  );

  const getCurrentDocument = useCallback(
    documentId => {
      if (!documentId) return null;
      for (const folder of book.backgroundFolders) {
        const document = folder.documents.find(doc => doc.id === documentId);
        if (document) return document;
      }
      return null;
    },
    [book.backgroundFolders]
  );

  const getCurrentLocation = useCallback(
    locationId => {
      if (!locationId) return null;
      return (
        book.locations.find(location => location.id === locationId) || null
      );
    },
    [book.locations]
  );

  const getCurrentFrontMatter = useCallback(
    frontMatterId => {
      if (!frontMatterId) return null;
      return book.frontMatter.find(fm => fm.id === frontMatterId) || null;
    },
    [book.frontMatter]
  );

  const getCurrentBackMatter = useCallback(
    backMatterId => {
      if (!backMatterId || !book.backMatter) return null;
      return book.backMatter.find(bm => bm.id === backMatterId) || null;
    },
    [book.backMatter]
  );

  const getCurrentIllustration = useCallback(
    illustrationId => {
      if (!illustrationId || !book.illustrations) return null;
      return book.illustrations.find(ill => ill.id === illustrationId) || null;
    },
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
    addBackMatter,
    updateBackMatter,
    deleteBackMatter,

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
