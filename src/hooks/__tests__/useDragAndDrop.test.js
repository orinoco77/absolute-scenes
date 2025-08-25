/**
 * Tests for useDragAndDrop hook
 * Verifies drag and drop functionality extracted from multiple components
 */

import { renderHook, act } from '@testing-library/react';
import { useDragAndDrop } from '../useDragAndDrop';

describe('useDragAndDrop', () => {
  let mockOnReorder;
  let mockValidateDrop;
  let mockExtractDropData;

  beforeEach(() => {
    mockOnReorder = jest.fn();
    mockValidateDrop = jest.fn();
    mockExtractDropData = jest.fn();
  });

  describe('Initial State', () => {
    it('initializes with null drag states', () => {
      const { result } = renderHook(() => useDragAndDrop());

      expect(result.current.draggedItem).toBeNull();
      expect(result.current.dragOverTarget).toBeNull();
      expect(result.current.dragInvalidTarget).toBeNull();
      expect(result.current.isDragging).toBe(false);
    });
  });

  describe('Basic Drag Operations', () => {
    it('handles drag start correctly', () => {
      const { result } = renderHook(() =>
        useDragAndDrop({ onReorder: mockOnReorder })
      );

      const mockItem = { id: 'item1', type: 'scene' };
      const mockEvent = {
        dataTransfer: {
          effectAllowed: '',
          setData: jest.fn()
        },
        target: {
          outerHTML: '<div>Item 1</div>'
        }
      };

      act(() => {
        result.current.handleDragStart(mockEvent, mockItem);
      });

      expect(result.current.draggedItem).toEqual(mockItem);
      expect(result.current.isDragging).toBe(true);
      expect(mockEvent.dataTransfer.effectAllowed).toBe('move');
      expect(mockEvent.dataTransfer.setData).toHaveBeenCalledWith(
        'text/html',
        '<div>Item 1</div>'
      );
    });

    it('handles drag over correctly', () => {
      const { result } = renderHook(() => useDragAndDrop());

      const mockEvent = {
        preventDefault: jest.fn(),
        dataTransfer: { dropEffect: '' }
      };

      act(() => {
        result.current.handleDragOver(mockEvent);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.dataTransfer.dropEffect).toBe('move');
    });

    it('handles drag end correctly', () => {
      const { result } = renderHook(() => useDragAndDrop());

      // First set some drag state
      const mockItem = { id: 'item1', type: 'scene' };
      const mockEvent = {
        dataTransfer: { effectAllowed: '', setData: jest.fn() },
        target: {}
      };

      act(() => {
        result.current.handleDragStart(mockEvent, mockItem);
      });

      expect(result.current.isDragging).toBe(true);

      // Then end the drag
      act(() => {
        result.current.handleDragEnd();
      });

      expect(result.current.draggedItem).toBeNull();
      expect(result.current.dragOverTarget).toBeNull();
      expect(result.current.dragInvalidTarget).toBeNull();
      expect(result.current.isDragging).toBe(false);
    });
  });

  describe('Drag Enter Logic', () => {
    it('sets valid drop target without custom validation', () => {
      const { result } = renderHook(() => useDragAndDrop());

      const draggedItem = { id: 'item1', type: 'scene' };
      const target = { id: 'item2', type: 'scene' };

      // Start drag
      act(() => {
        result.current.handleDragStart(
          {
            dataTransfer: { effectAllowed: '', setData: jest.fn() },
            target: {}
          },
          draggedItem
        );
      });

      // Drag enter
      const mockEvent = { preventDefault: jest.fn() };
      act(() => {
        result.current.handleDragEnter(mockEvent, target);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(result.current.dragOverTarget).toEqual(target);
      expect(result.current.dragInvalidTarget).toBeNull();
    });

    it('prevents dropping on self', () => {
      const { result } = renderHook(() => useDragAndDrop());

      const item = { id: 'item1', type: 'scene' };

      // Start drag
      act(() => {
        result.current.handleDragStart(
          {
            dataTransfer: { effectAllowed: '', setData: jest.fn() },
            target: {}
          },
          item
        );
      });

      // Try to drag enter on self
      const mockEvent = { preventDefault: jest.fn() };
      act(() => {
        result.current.handleDragEnter(mockEvent, item);
      });

      expect(result.current.dragOverTarget).toBeNull();
      expect(result.current.dragInvalidTarget).toEqual(item);
    });

    it('uses custom validation when provided', () => {
      mockValidateDrop.mockReturnValue({ valid: false });

      const { result } = renderHook(() =>
        useDragAndDrop({ validateDrop: mockValidateDrop })
      );

      const draggedItem = { id: 'item1', type: 'scene' };
      const target = { id: 'item2', type: 'chapter' };

      // Start drag
      act(() => {
        result.current.handleDragStart(
          {
            dataTransfer: { effectAllowed: '', setData: jest.fn() },
            target: {}
          },
          draggedItem
        );
      });

      // Drag enter with invalid target
      const mockEvent = { preventDefault: jest.fn() };
      act(() => {
        result.current.handleDragEnter(mockEvent, target);
      });

      expect(mockValidateDrop).toHaveBeenCalledWith(draggedItem, target);
      expect(result.current.dragOverTarget).toBeNull();
      expect(result.current.dragInvalidTarget).toEqual(target);
    });
  });

  describe('Drag Leave Logic', () => {
    it('clears targets when leaving drop zone', () => {
      const { result } = renderHook(() => useDragAndDrop());

      // Set up drag state
      const draggedItem = { id: 'item1', type: 'scene' };
      const target = { id: 'item2', type: 'scene' };

      act(() => {
        result.current.handleDragStart(
          {
            dataTransfer: { effectAllowed: '', setData: jest.fn() },
            target: {}
          },
          draggedItem
        );
      });

      act(() => {
        result.current.handleDragEnter({ preventDefault: jest.fn() }, target);
      });

      expect(result.current.dragOverTarget).toEqual(target);

      // Leave the drop zone
      const mockEvent = {
        currentTarget: { contains: jest.fn(() => false) },
        relatedTarget: {}
      };

      act(() => {
        result.current.handleDragLeave(mockEvent);
      });

      expect(result.current.dragOverTarget).toBeNull();
      expect(result.current.dragInvalidTarget).toBeNull();
    });

    it('does not clear targets when staying within drop zone', () => {
      const { result } = renderHook(() => useDragAndDrop());

      // Set up drag state
      const draggedItem = { id: 'item1', type: 'scene' };
      const target = { id: 'item2', type: 'scene' };

      act(() => {
        result.current.handleDragStart(
          {
            dataTransfer: { effectAllowed: '', setData: jest.fn() },
            target: {}
          },
          draggedItem
        );
      });

      act(() => {
        result.current.handleDragEnter({ preventDefault: jest.fn() }, target);
      });

      // Stay within the drop zone
      const mockEvent = {
        currentTarget: { contains: jest.fn(() => true) },
        relatedTarget: {}
      };

      act(() => {
        result.current.handleDragLeave(mockEvent);
      });

      expect(result.current.dragOverTarget).toEqual(target);
    });
  });

  describe('Drop Logic', () => {
    it('handles successful drop with onReorder callback', () => {
      const { result } = renderHook(() =>
        useDragAndDrop({ onReorder: mockOnReorder })
      );

      const draggedItem = { id: 'item1', type: 'scene' };
      const target = { id: 'item2', type: 'scene' };

      // Start drag
      act(() => {
        result.current.handleDragStart(
          {
            dataTransfer: { effectAllowed: '', setData: jest.fn() },
            target: {}
          },
          draggedItem
        );
      });

      // Drop
      const mockEvent = { preventDefault: jest.fn() };
      act(() => {
        result.current.handleDrop(mockEvent, target);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockOnReorder).toHaveBeenCalledWith({ draggedItem, target });
      expect(result.current.dragOverTarget).toBeNull();
      expect(result.current.dragInvalidTarget).toBeNull();
    });

    it('uses custom drop data extractor', () => {
      const customDropData = {
        draggedItem: { id: 'item1' },
        target: { id: 'item2' },
        operation: 'reorder',
        fromIndex: 0,
        toIndex: 1
      };

      mockExtractDropData.mockReturnValue(customDropData);

      const { result } = renderHook(() =>
        useDragAndDrop({
          onReorder: mockOnReorder,
          extractDropData: mockExtractDropData
        })
      );

      const draggedItem = { id: 'item1', type: 'scene' };
      const target = { id: 'item2', type: 'scene' };

      // Start drag
      act(() => {
        result.current.handleDragStart(
          {
            dataTransfer: { effectAllowed: '', setData: jest.fn() },
            target: {}
          },
          draggedItem
        );
      });

      // Drop
      const mockEvent = { preventDefault: jest.fn() };
      act(() => {
        result.current.handleDrop(mockEvent, target);
      });

      expect(mockExtractDropData).toHaveBeenCalledWith(
        draggedItem,
        target,
        mockEvent
      );
      expect(mockOnReorder).toHaveBeenCalledWith(customDropData);
    });

    it('prevents drop on same item', () => {
      const { result } = renderHook(() =>
        useDragAndDrop({ onReorder: mockOnReorder })
      );

      const item = { id: 'item1', type: 'scene' };

      // Start drag
      act(() => {
        result.current.handleDragStart(
          {
            dataTransfer: { effectAllowed: '', setData: jest.fn() },
            target: {}
          },
          item
        );
      });

      // Try to drop on self
      const mockEvent = { preventDefault: jest.fn() };
      act(() => {
        result.current.handleDrop(mockEvent, item);
      });

      expect(mockOnReorder).not.toHaveBeenCalled();
    });

    it('prevents drop with failed validation', () => {
      mockValidateDrop.mockReturnValue({ valid: false });

      const { result } = renderHook(() =>
        useDragAndDrop({
          onReorder: mockOnReorder,
          validateDrop: mockValidateDrop
        })
      );

      const draggedItem = { id: 'item1', type: 'scene' };
      const target = { id: 'item2', type: 'chapter' };

      // Start drag
      act(() => {
        result.current.handleDragStart(
          {
            dataTransfer: { effectAllowed: '', setData: jest.fn() },
            target: {}
          },
          draggedItem
        );
      });

      // Try to drop on invalid target
      const mockEvent = { preventDefault: jest.fn() };
      act(() => {
        result.current.handleDrop(mockEvent, target);
      });

      expect(mockValidateDrop).toHaveBeenCalledWith(draggedItem, target);
      expect(mockOnReorder).not.toHaveBeenCalled();
    });
  });

  describe('Utility Functions', () => {
    it('provides correct drop target validation', () => {
      const { result } = renderHook(() => useDragAndDrop());

      const draggedItem = { id: 'item1', type: 'scene' };
      const target = { id: 'item2', type: 'scene' };

      // Start drag
      act(() => {
        result.current.handleDragStart(
          {
            dataTransfer: { effectAllowed: '', setData: jest.fn() },
            target: {}
          },
          draggedItem
        );
      });

      // Set valid target
      act(() => {
        result.current.handleDragEnter({ preventDefault: jest.fn() }, target);
      });

      expect(result.current.dragOverTarget).toEqual(target);
      expect(result.current.isValidDropTarget('item2')).toBe(true);
      expect(result.current.isValidDropTarget('item3')).toBe(false);
    });

    it('provides correct invalid drop target validation', () => {
      const { result } = renderHook(() => useDragAndDrop());

      const draggedItem = { id: 'item1', type: 'scene' };
      const invalidTarget = { id: 'item1', type: 'scene' }; // Same item

      // Start drag
      act(() => {
        result.current.handleDragStart(
          {
            dataTransfer: { effectAllowed: '', setData: jest.fn() },
            target: {}
          },
          draggedItem
        );
      });

      // Try invalid target (same item)
      act(() => {
        result.current.handleDragEnter(
          { preventDefault: jest.fn() },
          invalidTarget
        );
      });

      expect(result.current.isInvalidDropTarget('item1')).toBe(true);
      expect(result.current.isInvalidDropTarget('item2')).toBe(false);
    });

    it('resets drag state manually', () => {
      const { result } = renderHook(() => useDragAndDrop());

      const draggedItem = { id: 'item1', type: 'scene' };

      // Start drag
      act(() => {
        result.current.handleDragStart(
          {
            dataTransfer: { effectAllowed: '', setData: jest.fn() },
            target: {}
          },
          draggedItem
        );
      });

      expect(result.current.isDragging).toBe(true);

      // Reset manually
      act(() => {
        result.current.resetDragState();
      });

      expect(result.current.draggedItem).toBeNull();
      expect(result.current.dragOverTarget).toBeNull();
      expect(result.current.dragInvalidTarget).toBeNull();
      expect(result.current.isDragging).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('handles missing event properties gracefully', () => {
      const { result } = renderHook(() => useDragAndDrop());

      // Test with minimal event object
      const mockItem = { id: 'item1', type: 'scene' };
      const mockEvent = {
        dataTransfer: { effectAllowed: '', setData: jest.fn() },
        target: {} // No outerHTML
      };

      act(() => {
        result.current.handleDragStart(mockEvent, mockItem);
      });

      expect(result.current.draggedItem).toEqual(mockItem);
      // Should not crash when outerHTML is missing
    });

    it('handles null/undefined targets gracefully', () => {
      const { result } = renderHook(() => useDragAndDrop());

      const draggedItem = { id: 'item1', type: 'scene' };

      act(() => {
        result.current.handleDragStart(
          {
            dataTransfer: { effectAllowed: '', setData: jest.fn() },
            target: {}
          },
          draggedItem
        );
      });

      // Test with null target
      const mockEvent = { preventDefault: jest.fn() };

      act(() => {
        result.current.handleDragEnter(mockEvent, null);
      });

      expect(result.current.dragOverTarget).toBeNull();
      expect(result.current.dragInvalidTarget).toBeNull();

      // Test with undefined target
      act(() => {
        result.current.handleDragEnter(mockEvent, undefined);
      });

      expect(result.current.dragOverTarget).toBeNull();
      expect(result.current.dragInvalidTarget).toBeNull();
    });
  });
});
