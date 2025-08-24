import { saveBook, saveBookToFile } from '../utils/fileOperations';

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
      const bookDataToSave = {
        ...book,
        metadata: {
          ...book.metadata,
          modified: new Date().toISOString()
        }
      };

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
      const bookDataToSave = {
        ...book,
        metadata: {
          ...book.metadata,
          modified: new Date().toISOString()
        }
      };

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
