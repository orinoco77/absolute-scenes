/**
 * Tests for useInlineEdit hook
 * Verifies inline editing functionality extracted from multiple components
 */

import { renderHook, act } from '@testing-library/react';
import { useInlineEdit } from '../useInlineEdit';

describe('useInlineEdit', () => {
  let mockOnSave;
  let mockOnCancel;
  let mockValidate;

  beforeEach(() => {
    mockOnSave = jest.fn();
    mockOnCancel = jest.fn();
    mockValidate = jest.fn();
  });

  describe('Initial State', () => {
    it('initializes with null editing state', () => {
      const { result } = renderHook(() => useInlineEdit());

      expect(result.current.editingId).toBeNull();
      expect(result.current.editingValue).toBe('');
      expect(result.current.validationError).toBeNull();
    });
  });

  describe('Starting and Canceling Edits', () => {
    it('starts editing with provided id and value', () => {
      const { result } = renderHook(() => useInlineEdit());

      act(() => {
        result.current.startEditing('item1', 'Initial Value');
      });

      expect(result.current.editingId).toBe('item1');
      expect(result.current.editingValue).toBe('Initial Value');
      expect(result.current.validationError).toBeNull();
      expect(result.current.isEditing('item1')).toBe(true);
      expect(result.current.isEditing('item2')).toBe(false);
    });

    it('starts editing with empty value as default', () => {
      const { result } = renderHook(() => useInlineEdit());

      act(() => {
        result.current.startEditing('item1');
      });

      expect(result.current.editingValue).toBe('');
    });

    it('cancels editing and resets state', () => {
      const { result } = renderHook(() =>
        useInlineEdit({ onCancel: mockOnCancel })
      );

      // Start editing
      act(() => {
        result.current.startEditing('item1', 'Test Value');
      });

      expect(result.current.editingId).toBe('item1');

      // Cancel editing
      act(() => {
        result.current.cancelEditing();
      });

      expect(result.current.editingId).toBeNull();
      expect(result.current.editingValue).toBe('');
      expect(result.current.validationError).toBeNull();
      expect(mockOnCancel).toHaveBeenCalledWith('item1');
    });

    it('does not call onCancel if not editing', () => {
      const { result } = renderHook(() =>
        useInlineEdit({ onCancel: mockOnCancel })
      );

      act(() => {
        result.current.cancelEditing();
      });

      expect(mockOnCancel).not.toHaveBeenCalled();
    });
  });

  describe('Updating Values', () => {
    it('updates editing value', () => {
      const { result } = renderHook(() => useInlineEdit());

      act(() => {
        result.current.startEditing('item1', 'Initial');
      });

      act(() => {
        result.current.updateValue('Updated Value');
      });

      expect(result.current.editingValue).toBe('Updated Value');
      expect(result.current.getCurrentValue()).toBe('Updated Value');
    });

    it('clears validation error when updating value', () => {
      mockValidate.mockReturnValue({ valid: false, error: 'Invalid value' });

      const { result } = renderHook(() =>
        useInlineEdit({ validate: mockValidate })
      );

      // Start editing and try to save (which will fail validation)
      act(() => {
        result.current.startEditing('item1', 'Invalid');
      });

      act(() => {
        result.current.saveEdit();
      });

      expect(result.current.validationError).toBe('Invalid value');

      // Update value should clear error
      act(() => {
        result.current.updateValue('New Value');
      });

      expect(result.current.validationError).toBeNull();
    });
  });

  describe('Saving Edits', () => {
    it('saves edit with trimmed value', () => {
      mockOnSave.mockReturnValue(true);

      const { result } = renderHook(() =>
        useInlineEdit({ onSave: mockOnSave })
      );

      act(() => {
        result.current.startEditing('item1', '  Trimmed Value  ');
      });

      act(() => {
        const success = result.current.saveEdit();
        expect(success).toBe(true);
      });

      expect(mockOnSave).toHaveBeenCalledWith('item1', 'Trimmed Value');
      expect(result.current.editingId).toBeNull();
      expect(result.current.editingValue).toBe('');
    });

    it('prevents saving when not editing', () => {
      const { result } = renderHook(() =>
        useInlineEdit({ onSave: mockOnSave })
      );

      act(() => {
        const success = result.current.saveEdit();
        expect(success).toBe(false);
      });

      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('handles validation failure', () => {
      mockValidate.mockReturnValue({ valid: false, error: 'Value too short' });

      const { result } = renderHook(() =>
        useInlineEdit({
          onSave: mockOnSave,
          validate: mockValidate
        })
      );

      act(() => {
        result.current.startEditing('item1', 'abc');
      });

      act(() => {
        const success = result.current.saveEdit();
        expect(success).toBe(false);
      });

      expect(mockValidate).toHaveBeenCalledWith('abc');
      expect(result.current.validationError).toBe('Value too short');
      expect(result.current.hasValidationError()).toBe(true);
      expect(mockOnSave).not.toHaveBeenCalled();
      expect(result.current.editingId).toBe('item1'); // Still editing
    });

    it('handles validation with generic error message', () => {
      mockValidate.mockReturnValue({ valid: false });

      const { result } = renderHook(() =>
        useInlineEdit({
          onSave: mockOnSave,
          validate: mockValidate
        })
      );

      act(() => {
        result.current.startEditing('item1', 'test');
      });

      act(() => {
        const success = result.current.saveEdit();
        expect(success).toBe(false);
      });

      expect(result.current.validationError).toBe('Invalid value');
    });

    it('handles onSave returning false to prevent closing', () => {
      mockOnSave.mockReturnValue(false);

      const { result } = renderHook(() =>
        useInlineEdit({ onSave: mockOnSave })
      );

      act(() => {
        result.current.startEditing('item1', 'test');
      });

      act(() => {
        const success = result.current.saveEdit();
        expect(success).toBe(false);
      });

      expect(mockOnSave).toHaveBeenCalledWith('item1', 'test');
      expect(result.current.editingId).toBe('item1'); // Still editing
    });

    it('saves successfully with validation', () => {
      mockValidate.mockReturnValue({ valid: true });
      mockOnSave.mockReturnValue(true);

      const { result } = renderHook(() =>
        useInlineEdit({
          onSave: mockOnSave,
          validate: mockValidate
        })
      );

      act(() => {
        result.current.startEditing('item1', 'Valid Value');
      });

      act(() => {
        const success = result.current.saveEdit();
        expect(success).toBe(true);
      });

      expect(mockValidate).toHaveBeenCalledWith('Valid Value');
      expect(mockOnSave).toHaveBeenCalledWith('item1', 'Valid Value');
      expect(result.current.editingId).toBeNull();
    });
  });

  describe('Event Handlers', () => {
    it('saves on Enter key', () => {
      mockOnSave.mockReturnValue(true);

      const { result } = renderHook(() =>
        useInlineEdit({ onSave: mockOnSave })
      );

      act(() => {
        result.current.startEditing('item1', 'Test Value');
      });

      const enterEvent = {
        key: 'Enter',
        preventDefault: jest.fn()
      };

      act(() => {
        result.current.handleKeyPress(enterEvent);
      });

      expect(enterEvent.preventDefault).toHaveBeenCalled();
      expect(mockOnSave).toHaveBeenCalledWith('item1', 'Test Value');
      expect(result.current.editingId).toBeNull();
    });

    it('cancels on Escape key', () => {
      const { result } = renderHook(() =>
        useInlineEdit({ onCancel: mockOnCancel })
      );

      act(() => {
        result.current.startEditing('item1', 'Test Value');
      });

      const escapeEvent = {
        key: 'Escape',
        preventDefault: jest.fn()
      };

      act(() => {
        result.current.handleKeyPress(escapeEvent);
      });

      expect(escapeEvent.preventDefault).toHaveBeenCalled();
      expect(mockOnCancel).toHaveBeenCalledWith('item1');
      expect(result.current.editingId).toBeNull();
    });

    it('ignores other keys', () => {
      const { result } = renderHook(() =>
        useInlineEdit({ onSave: mockOnSave })
      );

      act(() => {
        result.current.startEditing('item1', 'Test Value');
      });

      const otherKeyEvent = {
        key: 'a',
        preventDefault: jest.fn()
      };

      act(() => {
        result.current.handleKeyPress(otherKeyEvent);
      });

      expect(otherKeyEvent.preventDefault).not.toHaveBeenCalled();
      expect(mockOnSave).not.toHaveBeenCalled();
      expect(result.current.editingId).toBe('item1'); // Still editing
    });

    it('saves on blur when no validation error', () => {
      mockOnSave.mockReturnValue(true);

      const { result } = renderHook(() =>
        useInlineEdit({ onSave: mockOnSave })
      );

      act(() => {
        result.current.startEditing('item1', 'Test Value');
      });

      act(() => {
        result.current.handleBlur();
      });

      expect(mockOnSave).toHaveBeenCalledWith('item1', 'Test Value');
      expect(result.current.editingId).toBeNull();
    });

    it('does not save on blur when validation error exists', () => {
      mockValidate.mockReturnValue({ valid: false, error: 'Invalid' });

      const { result } = renderHook(() =>
        useInlineEdit({
          onSave: mockOnSave,
          validate: mockValidate
        })
      );

      act(() => {
        result.current.startEditing('item1', 'Invalid Value');
      });

      // Trigger validation error by trying to save
      act(() => {
        result.current.saveEdit();
      });

      expect(result.current.hasValidationError()).toBe(true);

      // Blur should not save when there's a validation error
      act(() => {
        result.current.handleBlur();
      });

      expect(mockOnSave).toHaveBeenCalledTimes(0); // Should not be called due to validation failure
      expect(result.current.editingId).toBe('item1'); // Still editing
    });
  });

  describe('Utility Functions', () => {
    it('correctly identifies editing state', () => {
      const { result } = renderHook(() => useInlineEdit());

      expect(result.current.isEditing('item1')).toBe(false);

      act(() => {
        result.current.startEditing('item1', 'test');
      });

      expect(result.current.isEditing('item1')).toBe(true);
      expect(result.current.isEditing('item2')).toBe(false);
    });

    it('returns current editing value', () => {
      const { result } = renderHook(() => useInlineEdit());

      act(() => {
        result.current.startEditing('item1', 'Initial Value');
      });

      expect(result.current.getCurrentValue()).toBe('Initial Value');

      act(() => {
        result.current.updateValue('Updated Value');
      });

      expect(result.current.getCurrentValue()).toBe('Updated Value');
    });

    it('correctly identifies validation error state', () => {
      mockValidate.mockReturnValue({ valid: false, error: 'Error' });

      const { result } = renderHook(() =>
        useInlineEdit({ validate: mockValidate })
      );

      expect(result.current.hasValidationError()).toBe(false);

      act(() => {
        result.current.startEditing('item1', 'test');
      });

      act(() => {
        result.current.saveEdit();
      });

      expect(result.current.hasValidationError()).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty editing value gracefully', () => {
      mockOnSave.mockReturnValue(true);

      const { result } = renderHook(() =>
        useInlineEdit({ onSave: mockOnSave })
      );

      act(() => {
        result.current.startEditing('item1', '');
      });

      act(() => {
        const success = result.current.saveEdit();
        expect(success).toBe(true);
      });

      expect(mockOnSave).toHaveBeenCalledWith('item1', '');
    });

    it('handles validation function that returns undefined', () => {
      mockValidate.mockReturnValue(undefined);
      mockOnSave.mockReturnValue(true);

      const { result } = renderHook(() =>
        useInlineEdit({
          onSave: mockOnSave,
          validate: mockValidate
        })
      );

      act(() => {
        result.current.startEditing('item1', 'test');
      });

      act(() => {
        const success = result.current.saveEdit();
        expect(success).toBe(true);
      });

      expect(mockOnSave).toHaveBeenCalledWith('item1', 'test');
    });

    it('handles missing callbacks gracefully', () => {
      const { result } = renderHook(() => useInlineEdit());

      // Should not crash without callbacks
      act(() => {
        result.current.startEditing('item1', 'test');
        result.current.saveEdit();
        result.current.cancelEditing();
      });

      // Should complete the cycle without errors
      expect(result.current.editingId).toBeNull();
    });
  });
});
