/**
 * Tests for SaveService
 * Critical service for data persistence - must be thoroughly tested
 */

import { SaveService } from '../SaveService';
import * as fileOperations from '../../utils/fileOperations';

// Mock file operations
jest.mock('../../utils/fileOperations', () => ({
  saveBook: jest.fn(),
  saveBookToFile: jest.fn()
}));

describe('SaveService', () => {
  let saveService;
  let mockCallbacks;
  let mockBook;

  beforeEach(() => {
    saveService = new SaveService();
    jest.clearAllMocks();
    
    // Reset mock implementations
    fileOperations.saveBook.mockReset();
    fileOperations.saveBookToFile.mockReset();
    
    mockCallbacks = {
      onSaveStart: jest.fn(),
      onSaveEnd: jest.fn(), 
      onSaveSuccess: jest.fn(),
      onSaveError: jest.fn(),
      onOperationUpdate: jest.fn()
    };

    mockBook = {
      title: 'Test Book',
      author: 'Test Author',
      chapters: [],
      metadata: {
        created: '2023-01-01T00:00:00.000Z'
      }
    };
  });

  describe('constructor', () => {
    it('initializes with correct state', () => {
      expect(saveService.isSaveInProgress()).toBe(false);
      expect(saveService.saveOperationRef.current).toBe(false);
    });
  });

  describe('isSaveInProgress', () => {
    it('returns current save operation state', () => {
      expect(saveService.isSaveInProgress()).toBe(false);
      
      saveService.saveOperationRef.current = true;
      expect(saveService.isSaveInProgress()).toBe(true);
      
      saveService.saveOperationRef.current = false;
      expect(saveService.isSaveInProgress()).toBe(false);
    });
  });

  describe('saveBookData', () => {
    describe('success scenarios', () => {
      it('saves to existing file successfully', async () => {
        const filePath = '/test/book.book';
        fileOperations.saveBookToFile.mockResolvedValue({
          success: true,
          filePath
        });

        const result = await saveService.saveBookData({
          book: mockBook,
          currentFilePath: filePath,
          ...mockCallbacks
        });

        expect(result).toEqual({ success: true, filePath });
        expect(fileOperations.saveBookToFile).toHaveBeenCalledWith(
          expect.objectContaining({
            ...mockBook,
            metadata: expect.objectContaining({
              modified: expect.any(String)
            })
          }),
          filePath
        );
        expect(mockCallbacks.onSaveStart).toHaveBeenCalled();
        expect(mockCallbacks.onSaveEnd).toHaveBeenCalled();
        expect(mockCallbacks.onSaveSuccess).toHaveBeenCalledWith(filePath);
        expect(mockCallbacks.onOperationUpdate).toHaveBeenCalledWith('Saving book...');
        expect(mockCallbacks.onOperationUpdate).toHaveBeenLastCalledWith(null);
      });

      it('saves new file with dialog successfully', async () => {
        const newFilePath = '/test/newbook.book';
        fileOperations.saveBook.mockResolvedValue({
          success: true,
          filePath: newFilePath
        });

        const result = await saveService.saveBookData({
          book: mockBook,
          currentFilePath: null,
          ...mockCallbacks
        });

        expect(result).toEqual({ success: true, filePath: newFilePath });
        expect(fileOperations.saveBook).toHaveBeenCalledWith(
          expect.objectContaining({
            metadata: expect.objectContaining({
              modified: expect.any(String)
            })
          })
        );
        expect(mockCallbacks.onSaveSuccess).toHaveBeenCalledWith(newFilePath);
      });

      it('adds modified timestamp to book metadata', async () => {
        fileOperations.saveBookToFile.mockResolvedValue({ success: true });

        await saveService.saveBookData({
          book: mockBook,
          currentFilePath: '/test/book.book',
          ...mockCallbacks
        });

        const savedBook = fileOperations.saveBookToFile.mock.calls[0][0];
        expect(savedBook.metadata.modified).toBeDefined();
        expect(new Date(savedBook.metadata.modified)).toBeInstanceOf(Date);
      });

      it('preserves existing metadata when adding modified timestamp', async () => {
        fileOperations.saveBookToFile.mockResolvedValue({ success: true });
        const bookWithMetadata = {
          ...mockBook,
          metadata: {
            created: '2023-01-01T00:00:00.000Z',
            version: '1.0.0'
          }
        };

        await saveService.saveBookData({
          book: bookWithMetadata,
          currentFilePath: '/test/book.book',
          ...mockCallbacks
        });

        const savedBook = fileOperations.saveBookToFile.mock.calls[0][0];
        expect(savedBook.metadata.created).toBe('2023-01-01T00:00:00.000Z');
        expect(savedBook.metadata.version).toBe('1.0.0');
        expect(savedBook.metadata.modified).toBeDefined();
      });
    });

    describe('cancellation scenarios', () => {
      it('handles user cancellation gracefully', async () => {
        fileOperations.saveBook.mockResolvedValue({
          success: false,
          canceled: true
        });

        const result = await saveService.saveBookData({
          book: mockBook,
          currentFilePath: null,
          ...mockCallbacks
        });

        expect(result).toEqual({ success: false, canceled: true });
        expect(mockCallbacks.onSaveError).not.toHaveBeenCalled();
        expect(mockCallbacks.onSaveEnd).toHaveBeenCalled();
      });
    });

    describe('error scenarios', () => {
      it('handles file operation errors', async () => {
        const errorMessage = 'Permission denied';
        fileOperations.saveBookToFile.mockResolvedValue({
          success: false,
          error: errorMessage
        });

        const result = await saveService.saveBookData({
          book: mockBook,
          currentFilePath: '/test/book.book',
          ...mockCallbacks
        });

        expect(result).toEqual({ success: false, error: errorMessage });
        expect(mockCallbacks.onSaveError).toHaveBeenCalledWith(errorMessage);
        expect(mockCallbacks.onSaveSuccess).not.toHaveBeenCalled();
      });

      it('handles exceptions during save operation', async () => {
        const error = new Error('Unexpected error');
        fileOperations.saveBookToFile.mockRejectedValue(error);

        const result = await saveService.saveBookData({
          book: mockBook,
          currentFilePath: '/test/book.book',
          ...mockCallbacks
        });

        expect(result).toEqual({ success: false, error: 'Unexpected error' });
        expect(mockCallbacks.onSaveError).toHaveBeenCalledWith('Unexpected error');
      });

      it('handles unknown errors gracefully', async () => {
        fileOperations.saveBookToFile.mockResolvedValue({
          success: false
          // No error message provided
        });

        const result = await saveService.saveBookData({
          book: mockBook,
          currentFilePath: '/test/book.book',
          ...mockCallbacks
        });

        expect(result).toEqual({ success: false, error: 'Unknown error' });
        expect(mockCallbacks.onSaveError).toHaveBeenCalledWith('Unknown error');
      });
    });

    describe('concurrent operation prevention', () => {
      it('prevents concurrent save operations', async () => {
        // Start first save operation (don't await)
        const firstSave = saveService.saveBookData({
          book: mockBook,
          currentFilePath: '/test/book1.book',
          ...mockCallbacks
        });

        // Try to start second save while first is in progress
        const result = await saveService.saveBookData({
          book: mockBook,
          currentFilePath: '/test/book2.book',
          ...mockCallbacks
        });

        expect(result).toEqual({
          success: false,
          error: 'Save operation already in progress'
        });

        // Clean up first save
        fileOperations.saveBookToFile.mockResolvedValue({ success: true });
        await firstSave;
      });

      it('allows new save after previous completes', async () => {
        fileOperations.saveBookToFile.mockResolvedValue({ success: true });

        // First save
        await saveService.saveBookData({
          book: mockBook,
          currentFilePath: '/test/book1.book',
          ...mockCallbacks
        });

        // Second save should succeed
        const result = await saveService.saveBookData({
          book: mockBook,
          currentFilePath: '/test/book2.book',
          ...mockCallbacks
        });

        expect(result.success).toBe(true);
        expect(fileOperations.saveBookToFile).toHaveBeenCalledTimes(2);
      });

      it('cleans up state even when save fails', async () => {
        fileOperations.saveBookToFile.mockRejectedValue(new Error('Save failed'));

        await saveService.saveBookData({
          book: mockBook,
          currentFilePath: '/test/book.book',
          ...mockCallbacks
        });

        expect(saveService.isSaveInProgress()).toBe(false);
      });
    });

    describe('operation updates', () => {
      it('sends correct operation updates during save', async () => {
        fileOperations.saveBookToFile.mockResolvedValue({ success: true });

        await saveService.saveBookData({
          book: mockBook,
          currentFilePath: '/test/book.book',
          ...mockCallbacks
        });

        expect(mockCallbacks.onOperationUpdate).toHaveBeenCalledWith('Saving book...');
        expect(mockCallbacks.onOperationUpdate).toHaveBeenCalledWith('Saving to file...');
        expect(mockCallbacks.onOperationUpdate).toHaveBeenLastCalledWith(null);
      });

      it('sends correct updates for new file save', async () => {
        fileOperations.saveBook.mockResolvedValue({ success: true, filePath: '/test/new.book' });

        await saveService.saveBookData({
          book: mockBook,
          currentFilePath: null,
          ...mockCallbacks
        });

        expect(mockCallbacks.onOperationUpdate).toHaveBeenCalledWith('Saving book...');
        expect(mockCallbacks.onOperationUpdate).toHaveBeenCalledWith('Choose save location...');
        expect(mockCallbacks.onOperationUpdate).toHaveBeenLastCalledWith(null);
      });
    });
  });

  describe('saveAsBookData', () => {
    it('always uses save dialog for Save As', async () => {
      const newFilePath = '/test/saveas.book';
      fileOperations.saveBook.mockResolvedValue({
        success: true,
        filePath: newFilePath
      });

      const result = await saveService.saveAsBookData({
        book: mockBook,
        ...mockCallbacks
      });

      expect(result).toEqual({ success: true, filePath: newFilePath });
      expect(fileOperations.saveBook).toHaveBeenCalled();
      expect(fileOperations.saveBookToFile).not.toHaveBeenCalled();
    });

    it('prevents concurrent operations', async () => {
      // Start Save As operation
      const saveAs = saveService.saveAsBookData({
        book: mockBook,
        ...mockCallbacks
      });

      // Try another Save As while first is in progress
      const result = await saveService.saveAsBookData({
        book: mockBook,
        ...mockCallbacks
      });

      expect(result).toEqual({
        success: false,
        error: 'Save operation already in progress'
      });

      // Clean up first operation
      fileOperations.saveBook.mockResolvedValue({ success: true, filePath: '/test.book' });
      await saveAs;
    });

    it('handles cancellation', async () => {
      fileOperations.saveBook.mockResolvedValue({
        success: false,
        canceled: true
      });

      const result = await saveService.saveAsBookData({
        book: mockBook,
        ...mockCallbacks
      });

      expect(result).toEqual({ success: false, canceled: true });
      expect(mockCallbacks.onSaveError).not.toHaveBeenCalled();
    });

    it('handles errors', async () => {
      const errorMessage = 'Disk full';
      fileOperations.saveBook.mockResolvedValue({
        success: false,
        error: errorMessage
      });

      const result = await saveService.saveAsBookData({
        book: mockBook,
        ...mockCallbacks
      });

      expect(result).toEqual({ success: false, error: errorMessage });
      expect(mockCallbacks.onSaveError).toHaveBeenCalledWith(errorMessage);
    });
  });

  describe('createDebouncedSave', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('creates debounced save function with default delay', () => {
      const saveCallback = jest.fn();
      const debouncedSave = saveService.createDebouncedSave(saveCallback);

      expect(typeof debouncedSave).toBe('function');
      
      // Call multiple times quickly
      debouncedSave();
      debouncedSave();
      debouncedSave();

      // Should not have called callback yet
      expect(saveCallback).not.toHaveBeenCalled();

      // Fast-forward time
      jest.advanceTimersByTime(100);

      // Should have called callback once
      expect(saveCallback).toHaveBeenCalledTimes(1);
    });

    it('creates debounced save function with custom delay', () => {
      const saveCallback = jest.fn();
      const debouncedSave = saveService.createDebouncedSave(saveCallback, 500);

      debouncedSave();
      
      // Should not call at default delay
      jest.advanceTimersByTime(100);
      expect(saveCallback).not.toHaveBeenCalled();

      // Should call at custom delay
      jest.advanceTimersByTime(400);
      expect(saveCallback).toHaveBeenCalledTimes(1);
    });

    it('prevents save if operation already in progress', () => {
      const saveCallback = jest.fn();
      const debouncedSave = saveService.createDebouncedSave(saveCallback);

      // Set save in progress
      saveService.saveOperationRef.current = true;

      debouncedSave();
      jest.advanceTimersByTime(100);

      // Should not have called callback
      expect(saveCallback).not.toHaveBeenCalled();
    });

    it('allows save when no operation in progress', () => {
      const saveCallback = jest.fn();
      const debouncedSave = saveService.createDebouncedSave(saveCallback);

      // Ensure no save in progress
      saveService.saveOperationRef.current = false;

      debouncedSave();
      jest.advanceTimersByTime(100);

      // Should have called callback
      expect(saveCallback).toHaveBeenCalledTimes(1);
    });

    it('debounces multiple calls correctly', () => {
      const saveCallback = jest.fn();
      const debouncedSave = saveService.createDebouncedSave(saveCallback, 200);

      // Call multiple times
      debouncedSave();
      jest.advanceTimersByTime(50);
      debouncedSave();
      jest.advanceTimersByTime(50);
      debouncedSave();

      // Should reset timer each time
      jest.advanceTimersByTime(150); // Total 250ms from last call
      expect(saveCallback).not.toHaveBeenCalled();

      jest.advanceTimersByTime(50); // Now 200ms from last call
      expect(saveCallback).toHaveBeenCalledTimes(1);
    });
  });
});