import { saveBook, saveBookToFile } from '../utils/fileOperations';

/**
 * Deduplicate book data to prevent duplicate chapters, scenes, and parts
 */
function deduplicateBookData(book) {
  const cleanedBook = { ...book };

  // Deduplicate parts by ID
  if (cleanedBook.parts && Array.isArray(cleanedBook.parts)) {
    const seenPartIds = new Set();
    cleanedBook.parts = cleanedBook.parts.filter(part => {
      if (seenPartIds.has(part.id)) {
        console.warn(`Removing duplicate part with ID: ${part.id}`);
        return false;
      }
      seenPartIds.add(part.id);
      return true;
    });
  }

  // Deduplicate chapters by ID
  if (cleanedBook.chapters && Array.isArray(cleanedBook.chapters)) {
    const seenChapterIds = new Set();
    cleanedBook.chapters = cleanedBook.chapters.filter(chapter => {
      if (seenChapterIds.has(chapter.id)) {
        console.warn(`Removing duplicate chapter with ID: ${chapter.id}`);
        return false;
      }
      seenChapterIds.add(chapter.id);
      return true;
    });

    // Also deduplicate scenes within each chapter
    cleanedBook.chapters = cleanedBook.chapters.map(chapter => {
      if (chapter.scenes && Array.isArray(chapter.scenes)) {
        const seenSceneIds = new Set();
        const deduplicatedScenes = chapter.scenes.filter(scene => {
          if (seenSceneIds.has(scene.id)) {
            console.warn(
              `Removing duplicate scene with ID: ${scene.id} in chapter: ${chapter.title}`
            );
            return false;
          }
          seenSceneIds.add(scene.id);
          return true;
        });
        return { ...chapter, scenes: deduplicatedScenes };
      }
      return chapter;
    });
  }

  // Deduplicate characters by ID
  if (cleanedBook.characters && Array.isArray(cleanedBook.characters)) {
    const seenCharacterIds = new Set();
    cleanedBook.characters = cleanedBook.characters.filter(character => {
      if (seenCharacterIds.has(character.id)) {
        console.warn(`Removing duplicate character with ID: ${character.id}`);
        return false;
      }
      seenCharacterIds.add(character.id);
      return true;
    });
  }

  // Deduplicate locations by ID
  if (cleanedBook.locations && Array.isArray(cleanedBook.locations)) {
    const seenLocationIds = new Set();
    cleanedBook.locations = cleanedBook.locations.filter(location => {
      if (seenLocationIds.has(location.id)) {
        console.warn(`Removing duplicate location with ID: ${location.id}`);
        return false;
      }
      seenLocationIds.add(location.id);
      return true;
    });
  }

  // Deduplicate illustrations by ID
  if (cleanedBook.illustrations && Array.isArray(cleanedBook.illustrations)) {
    const seenIllustrationIds = new Set();
    cleanedBook.illustrations = cleanedBook.illustrations.filter(
      illustration => {
        if (seenIllustrationIds.has(illustration.id)) {
          console.warn(
            `Removing duplicate illustration with ID: ${illustration.id}`
          );
          return false;
        }
        seenIllustrationIds.add(illustration.id);
        return true;
      }
    );
  }

  // Deduplicate front matter by ID
  if (cleanedBook.frontMatter && Array.isArray(cleanedBook.frontMatter)) {
    const seenFrontMatterIds = new Set();
    cleanedBook.frontMatter = cleanedBook.frontMatter.filter(item => {
      if (seenFrontMatterIds.has(item.id)) {
        console.warn(`Removing duplicate front matter with ID: ${item.id}`);
        return false;
      }
      seenFrontMatterIds.add(item.id);
      return true;
    });
  }

  // Deduplicate back matter by ID
  if (cleanedBook.backMatter && Array.isArray(cleanedBook.backMatter)) {
    const seenBackMatterIds = new Set();
    cleanedBook.backMatter = cleanedBook.backMatter.filter(item => {
      if (seenBackMatterIds.has(item.id)) {
        console.warn(`Removing duplicate back matter with ID: ${item.id}`);
        return false;
      }
      seenBackMatterIds.add(item.id);
      return true;
    });
  }

  return cleanedBook;
}

/**
 * Service class to handle save operations following the Single Responsibility Principle
 */
export class SaveService {
  constructor() {
    this.saveOperationRef = { current: false };
  }

  /**
   * Check if a save operation is currently in progress
   */
  isSaveInProgress() {
    return this.saveOperationRef.current;
  }

  /**
   * Save book to file with proper error handling and state management
   */
  async saveBookData({
    book,
    currentFilePath,
    onSaveStart,
    onSaveEnd,
    onSaveSuccess,
    onSaveError,
    onOperationUpdate
  }) {
    // Prevent concurrent save operations
    if (this.saveOperationRef.current) {
      return { success: false, error: 'Save operation already in progress' };
    }

    // Set operation flags
    this.saveOperationRef.current = true;
    onSaveStart?.();
    onOperationUpdate?.('Saving book...');

    try {
      let saveResult;
      let savedFilePath = currentFilePath;

      // Ensure we have clean book data before saving
      const bookDataToSave = deduplicateBookData({
        ...book,
        metadata: {
          ...book.metadata,
          modified: new Date().toISOString()
        }
      });

      if (currentFilePath) {
        // Quick save to existing file
        onOperationUpdate?.('Saving to file...');
        saveResult = await saveBookToFile(bookDataToSave, currentFilePath);
      } else {
        // Save As dialog for new files
        onOperationUpdate?.('Choose save location...');
        saveResult = await saveBook(bookDataToSave);
        savedFilePath = saveResult.filePath;
      }

      // Handle save result
      if (saveResult.success) {
        onSaveSuccess?.(savedFilePath);
        return { success: true, filePath: savedFilePath };
      } else if (saveResult.canceled) {
        // User canceled - this is normal, don't show error
        return { success: false, canceled: true };
      } else {
        // Actual error occurred
        const errorMessage = saveResult.error || 'Unknown error';
        onSaveError?.(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error('=== SAVE OPERATION FAILED ===', error);
      const errorMessage = error.message || 'Save operation failed';
      onSaveError?.(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      // Always clean up operation flags
      this.saveOperationRef.current = false;
      onSaveEnd?.();
      onOperationUpdate?.(null);
    }
  }

  /**
   * Save As operation (always show dialog)
   */
  async saveAsBookData({
    book,
    onSaveStart,
    onSaveEnd,
    onSaveSuccess,
    onSaveError,
    onOperationUpdate
  }) {
    // Prevent concurrent save operations
    if (this.saveOperationRef.current) {
      return { success: false, error: 'Save operation already in progress' };
    }

    // Set operation flags
    this.saveOperationRef.current = true;
    onSaveStart?.();
    onOperationUpdate?.('Save As...');

    try {
      // Ensure we have clean book data before saving
      const bookDataToSave = deduplicateBookData({
        ...book,
        metadata: {
          ...book.metadata,
          modified: new Date().toISOString()
        }
      });

      // Always show save dialog for Save As
      onOperationUpdate?.('Choose save location...');
      const saveResult = await saveBook(bookDataToSave);

      // Handle save result
      if (saveResult.success) {
        onSaveSuccess?.(saveResult.filePath);
        return { success: true, filePath: saveResult.filePath };
      } else if (saveResult.canceled) {
        // User canceled - this is normal, don't show error
        return { success: false, canceled: true };
      } else {
        // Actual error occurred
        const errorMessage = saveResult.error || 'Unknown error';
        onSaveError?.(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error('=== SAVE AS OPERATION FAILED ===', error);
      const errorMessage = error.message || 'Save As operation failed';
      onSaveError?.(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      // Always clean up operation flags
      this.saveOperationRef.current = false;
      onSaveEnd?.();
      onOperationUpdate?.(null);
    }
  }

  /**
   * Create a debounced save function
   */
  createDebouncedSave(saveCallback, delay = 100) {
    let timeout;
    return () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (!this.saveOperationRef.current) {
          saveCallback();
        }
      }, delay);
    };
  }
}
