import { useState, useCallback } from 'react';

/**
 * Custom hook for drag and drop functionality
 * Eliminates duplicate drag state management across components
 *
 * @param {Object} options - Configuration options
 * @param {Function} options.onReorder - Callback when items are reordered (fromIndex, toIndex)
 * @param {Function} options.validateDrop - Optional validation function for drop targets
 * @param {Function} options.extractDropData - Optional function to extract drop data from event
 * @returns {Object} Drag and drop state and handlers
 */
export function useDragAndDrop({
  onReorder,
  validateDrop,
  extractDropData
} = {}) {
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverTarget, setDragOverTarget] = useState(null);
  const [dragInvalidTarget, setDragInvalidTarget] = useState(null);

  const handleDragStart = useCallback((e, item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';

    // Extract HTML data if available for visual feedback
    if (e.target.outerHTML) {
      e.dataTransfer.setData('text/html', e.target.outerHTML);
    }
  }, []);

  const handleDragOver = useCallback(e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDragEnter = useCallback(
    (e, target) => {
      e.preventDefault();

      if (!draggedItem || !target) return;

      // Use custom validation if provided
      if (validateDrop) {
        const validation = validateDrop(draggedItem, target);
        if (validation.valid) {
          setDragOverTarget(target);
          setDragInvalidTarget(null);
        } else {
          setDragOverTarget(null);
          setDragInvalidTarget(target);
        }
        return;
      }

      // Default validation - can't drop on self
      if (draggedItem.id !== target.id) {
        setDragOverTarget(target);
        setDragInvalidTarget(null);
      } else {
        setDragInvalidTarget(target);
      }
    },
    [draggedItem, validateDrop]
  );

  const handleDragLeave = useCallback(e => {
    // Only clear drag over target if we're leaving the drop zone completely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverTarget(null);
      setDragInvalidTarget(null);
    }
  }, []);

  const handleDrop = useCallback(
    (e, target) => {
      e.preventDefault();
      setDragOverTarget(null);
      setDragInvalidTarget(null);

      if (!draggedItem || !target || draggedItem.id === target.id) return;

      // Use custom validation if provided
      if (validateDrop && !validateDrop(draggedItem, target).valid) {
        return;
      }

      // Extract drop data if custom extractor provided
      const dropData = extractDropData
        ? extractDropData(draggedItem, target, e)
        : { draggedItem, target };

      // Call reorder callback with the drop data
      if (onReorder) {
        onReorder(dropData);
      }
    },
    [draggedItem, validateDrop, extractDropData, onReorder]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
    setDragOverTarget(null);
    setDragInvalidTarget(null);
  }, []);

  const resetDragState = useCallback(() => {
    setDraggedItem(null);
    setDragOverTarget(null);
    setDragInvalidTarget(null);
  }, []);

  const isDragging = draggedItem !== null;
  const isValidDropTarget = targetId => dragOverTarget?.id === targetId;
  const isInvalidDropTarget = targetId => dragInvalidTarget?.id === targetId;

  return {
    // State
    draggedItem,
    dragOverTarget,
    dragInvalidTarget,
    isDragging,

    // Event handlers
    handleDragStart,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    handleDragEnd,

    // Utility functions
    resetDragState,
    isValidDropTarget,
    isInvalidDropTarget
  };
}
