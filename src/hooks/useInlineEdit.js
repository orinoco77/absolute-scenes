import { useState, useCallback } from 'react';

/**
 * Custom hook for inline editing functionality
 * Eliminates duplicate editing state management across components
 *
 * @param {Object} options - Configuration options
 * @param {Function} options.onSave - Callback when edit is saved (id, newValue)
 * @param {Function} options.onCancel - Optional callback when edit is cancelled
 * @param {Function} options.validate - Optional validation function (value) => { valid, error }
 * @returns {Object} Inline editing state and handlers
 */
export function useInlineEdit({ onSave, onCancel, validate } = {}) {
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [validationError, setValidationError] = useState(null);

  const startEditing = useCallback((id, currentValue = '') => {
    setEditingId(id);
    setEditingValue(currentValue);
    setValidationError(null);
  }, []);

  const cancelEditing = useCallback(() => {
    const wasEditing = editingId;
    setEditingId(null);
    setEditingValue('');
    setValidationError(null);

    if (onCancel && wasEditing) {
      onCancel(wasEditing);
    }
  }, [editingId, onCancel]);

  const updateValue = useCallback(
    newValue => {
      setEditingValue(newValue);

      // Clear validation error when user types
      if (validationError) {
        setValidationError(null);
      }
    },
    [validationError]
  );

  const saveEdit = useCallback(() => {
    if (!editingId) return false;

    const value = editingValue.trim();

    // Run validation if provided
    if (validate) {
      const validation = validate(value);
      if (validation && !validation.valid) {
        setValidationError(validation.error || 'Invalid value');
        return false;
      }
    }

    // Save the edit
    if (onSave) {
      const success = onSave(editingId, value);
      // onSave can return false to prevent closing edit mode
      if (success === false) {
        return false;
      }
    }

    // Clear editing state
    setEditingId(null);
    setEditingValue('');
    setValidationError(null);
    return true;
  }, [editingId, editingValue, validate, onSave]);

  const handleKeyPress = useCallback(
    e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveEdit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEditing();
      }
    },
    [saveEdit, cancelEditing]
  );

  const handleBlur = useCallback(() => {
    // Save on blur if no validation error
    if (!validationError) {
      saveEdit();
    }
  }, [validationError, saveEdit]);

  const isEditing = id => editingId === id;
  const getCurrentValue = () => editingValue;
  const hasValidationError = () => validationError !== null;

  return {
    // State
    editingId,
    editingValue,
    validationError,

    // Actions
    startEditing,
    cancelEditing,
    updateValue,
    saveEdit,

    // Event handlers
    handleKeyPress,
    handleBlur,

    // Utility functions
    isEditing,
    getCurrentValue,
    hasValidationError
  };
}
