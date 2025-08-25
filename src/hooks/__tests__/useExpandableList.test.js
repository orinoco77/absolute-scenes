/**
 * Tests for useExpandableList hook
 * Verifies expandable list functionality extracted from multiple components
 */

import { renderHook, act } from '@testing-library/react';
import { useExpandableList } from '../useExpandableList';

describe('useExpandableList', () => {
  const mockItems = [
    { id: 'item1', name: 'Item 1' },
    { id: 'item2', name: 'Item 2' },
    { id: 'item3', name: 'Item 3' }
  ];

  describe('Initial State', () => {
    it('initializes with empty set when no options provided', () => {
      const { result } = renderHook(() => useExpandableList());

      expect(result.current.expandedItems).toEqual(new Set());
      expect(result.current.getExpandedCount()).toBe(0);
      expect(result.current.getExpandedIds()).toEqual([]);
    });

    it('initializes with all items expanded when autoExpand is true', () => {
      const { result } = renderHook(() =>
        useExpandableList({ items: mockItems, autoExpand: true })
      );

      expect(result.current.getExpandedCount()).toBe(3);
      expect(result.current.isExpanded('item1')).toBe(true);
      expect(result.current.isExpanded('item2')).toBe(true);
      expect(result.current.isExpanded('item3')).toBe(true);
    });

    it('initializes with no items expanded when autoExpand is false', () => {
      const { result } = renderHook(() =>
        useExpandableList({ items: mockItems, autoExpand: false })
      );

      expect(result.current.getExpandedCount()).toBe(0);
      expect(result.current.isExpanded('item1')).toBe(false);
      expect(result.current.isExpanded('item2')).toBe(false);
      expect(result.current.isExpanded('item3')).toBe(false);
    });

    it('initializes with specific items expanded', () => {
      const { result } = renderHook(() =>
        useExpandableList({
          items: mockItems,
          autoExpand: false,
          initialExpanded: ['item1', 'item3']
        })
      );

      expect(result.current.getExpandedCount()).toBe(2);
      expect(result.current.isExpanded('item1')).toBe(true);
      expect(result.current.isExpanded('item2')).toBe(false);
      expect(result.current.isExpanded('item3')).toBe(true);
    });

    it('initializes with current item expanded', () => {
      const { result } = renderHook(() =>
        useExpandableList({
          items: mockItems,
          autoExpand: false,
          currentItemId: 'item2'
        })
      );

      expect(result.current.isExpanded('item2')).toBe(true);
      expect(result.current.getExpandedCount()).toBe(1);
    });
  });

  describe('Toggle Operations', () => {
    it('toggles item expansion state', () => {
      const { result } = renderHook(() =>
        useExpandableList({ items: mockItems, autoExpand: false })
      );

      expect(result.current.isExpanded('item1')).toBe(false);

      act(() => {
        result.current.toggleItem('item1');
      });

      expect(result.current.isExpanded('item1')).toBe(true);
      expect(result.current.getExpandedCount()).toBe(1);

      act(() => {
        result.current.toggleItem('item1');
      });

      expect(result.current.isExpanded('item1')).toBe(false);
      expect(result.current.getExpandedCount()).toBe(0);
    });

    it('toggles multiple items independently', () => {
      const { result } = renderHook(() =>
        useExpandableList({ items: mockItems, autoExpand: false })
      );

      act(() => {
        result.current.toggleItem('item1');
        result.current.toggleItem('item3');
      });

      expect(result.current.isExpanded('item1')).toBe(true);
      expect(result.current.isExpanded('item2')).toBe(false);
      expect(result.current.isExpanded('item3')).toBe(true);
      expect(result.current.getExpandedCount()).toBe(2);
    });
  });

  describe('Explicit Expand/Collapse Operations', () => {
    it('expands item when collapsed', () => {
      const { result } = renderHook(() =>
        useExpandableList({ items: mockItems, autoExpand: false })
      );

      expect(result.current.isExpanded('item1')).toBe(false);

      act(() => {
        result.current.expandItem('item1');
      });

      expect(result.current.isExpanded('item1')).toBe(true);
      expect(result.current.getExpandedCount()).toBe(1);
    });

    it('does not change state when expanding already expanded item', () => {
      const { result } = renderHook(() =>
        useExpandableList({
          items: mockItems,
          autoExpand: false,
          initialExpanded: ['item1']
        })
      );

      const initialState = result.current.expandedItems;

      act(() => {
        result.current.expandItem('item1');
      });

      expect(result.current.expandedItems).toBe(initialState);
      expect(result.current.isExpanded('item1')).toBe(true);
    });

    it('collapses item when expanded', () => {
      const { result } = renderHook(() =>
        useExpandableList({
          items: mockItems,
          autoExpand: false,
          initialExpanded: ['item1']
        })
      );

      expect(result.current.isExpanded('item1')).toBe(true);

      act(() => {
        result.current.collapseItem('item1');
      });

      expect(result.current.isExpanded('item1')).toBe(false);
      expect(result.current.getExpandedCount()).toBe(0);
    });

    it('does not change state when collapsing already collapsed item', () => {
      const { result } = renderHook(() =>
        useExpandableList({ items: mockItems, autoExpand: false })
      );

      const initialState = result.current.expandedItems;

      act(() => {
        result.current.collapseItem('item1');
      });

      expect(result.current.expandedItems).toBe(initialState);
      expect(result.current.isExpanded('item1')).toBe(false);
    });
  });

  describe('Bulk Operations', () => {
    it('expands all items', () => {
      const { result } = renderHook(() =>
        useExpandableList({ items: mockItems, autoExpand: false })
      );

      expect(result.current.getExpandedCount()).toBe(0);

      act(() => {
        result.current.expandAll();
      });

      expect(result.current.getExpandedCount()).toBe(3);
      expect(result.current.isExpanded('item1')).toBe(true);
      expect(result.current.isExpanded('item2')).toBe(true);
      expect(result.current.isExpanded('item3')).toBe(true);
    });

    it('collapses all items', () => {
      const { result } = renderHook(() =>
        useExpandableList({ items: mockItems, autoExpand: true })
      );

      expect(result.current.getExpandedCount()).toBe(3);

      act(() => {
        result.current.collapseAll();
      });

      expect(result.current.getExpandedCount()).toBe(0);
      expect(result.current.isExpanded('item1')).toBe(false);
      expect(result.current.isExpanded('item2')).toBe(false);
      expect(result.current.isExpanded('item3')).toBe(false);
    });

    it('handles expandAll with empty items array', () => {
      const { result } = renderHook(() =>
        useExpandableList({ items: [], autoExpand: false })
      );

      act(() => {
        result.current.expandAll();
      });

      expect(result.current.getExpandedCount()).toBe(0);
    });
  });

  describe('Auto-expansion on Items Change', () => {
    it('auto-expands new items when autoExpand is true', () => {
      const { result, rerender } = renderHook(
        ({ items }) => useExpandableList({ items, autoExpand: true }),
        { initialProps: { items: [mockItems[0]] } }
      );

      expect(result.current.getExpandedCount()).toBe(1);
      expect(result.current.isExpanded('item1')).toBe(true);

      // Add more items
      rerender({ items: mockItems });

      expect(result.current.getExpandedCount()).toBe(3);
      expect(result.current.isExpanded('item1')).toBe(true);
      expect(result.current.isExpanded('item2')).toBe(true);
      expect(result.current.isExpanded('item3')).toBe(true);
    });

    it('does not auto-expand new items when autoExpand is false', () => {
      const { result, rerender } = renderHook(
        ({ items }) => useExpandableList({ items, autoExpand: false }),
        { initialProps: { items: [mockItems[0]] } }
      );

      act(() => {
        result.current.expandItem('item1');
      });

      expect(result.current.getExpandedCount()).toBe(1);

      // Add more items
      rerender({ items: mockItems });

      expect(result.current.getExpandedCount()).toBe(1);
      expect(result.current.isExpanded('item1')).toBe(true);
      expect(result.current.isExpanded('item2')).toBe(false);
      expect(result.current.isExpanded('item3')).toBe(false);
    });
  });

  describe('Current Item Auto-expansion', () => {
    it('auto-expands current item when it changes', () => {
      const { result, rerender } = renderHook(
        ({ currentItemId }) =>
          useExpandableList({
            items: mockItems,
            autoExpand: false,
            currentItemId
          }),
        { initialProps: { currentItemId: null } }
      );

      expect(result.current.getExpandedCount()).toBe(0);

      // Set current item
      rerender({ currentItemId: 'item2' });

      expect(result.current.isExpanded('item2')).toBe(true);
      expect(result.current.getExpandedCount()).toBe(1);

      // Change current item
      rerender({ currentItemId: 'item3' });

      expect(result.current.isExpanded('item2')).toBe(true);
      expect(result.current.isExpanded('item3')).toBe(true);
      expect(result.current.getExpandedCount()).toBe(2);
    });

    it('does not change state if current item is already expanded', () => {
      const { result, rerender } = renderHook(
        ({ currentItemId }) =>
          useExpandableList({
            items: mockItems,
            autoExpand: false,
            initialExpanded: ['item1'],
            currentItemId
          }),
        { initialProps: { currentItemId: null } }
      );

      const initialState = result.current.expandedItems;

      rerender({ currentItemId: 'item1' });

      expect(result.current.expandedItems).toBe(initialState);
      expect(result.current.isExpanded('item1')).toBe(true);
    });
  });

  describe('Utility Functions', () => {
    it('correctly identifies expansion state', () => {
      const { result } = renderHook(() =>
        useExpandableList({
          items: mockItems,
          autoExpand: false,
          initialExpanded: ['item1', 'item3']
        })
      );

      expect(result.current.isExpanded('item1')).toBe(true);
      expect(result.current.isExpanded('item2')).toBe(false);
      expect(result.current.isExpanded('item3')).toBe(true);
      expect(result.current.isExpanded('nonexistent')).toBe(false);
    });

    it('returns correct expanded count', () => {
      const { result } = renderHook(() =>
        useExpandableList({
          items: mockItems,
          autoExpand: false,
          initialExpanded: ['item1', 'item3']
        })
      );

      expect(result.current.getExpandedCount()).toBe(2);

      act(() => {
        result.current.toggleItem('item2');
      });

      expect(result.current.getExpandedCount()).toBe(3);

      act(() => {
        result.current.collapseItem('item1');
      });

      expect(result.current.getExpandedCount()).toBe(2);
    });

    it('returns correct expanded IDs array', () => {
      const { result } = renderHook(() =>
        useExpandableList({
          items: mockItems,
          autoExpand: false,
          initialExpanded: ['item1', 'item3']
        })
      );

      const expandedIds = result.current.getExpandedIds();
      expect(expandedIds).toContain('item1');
      expect(expandedIds).toContain('item3');
      expect(expandedIds).not.toContain('item2');
      expect(expandedIds.length).toBe(2);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty items array gracefully', () => {
      const { result } = renderHook(() =>
        useExpandableList({ items: [], autoExpand: true })
      );

      expect(result.current.getExpandedCount()).toBe(0);
      expect(result.current.isExpanded('any-id')).toBe(false);

      act(() => {
        result.current.toggleItem('any-id');
      });

      expect(result.current.isExpanded('any-id')).toBe(true);
      expect(result.current.getExpandedCount()).toBe(1);
    });

    it('handles items without id property gracefully', () => {
      const itemsWithoutIds = [{ name: 'Item 1' }, { name: 'Item 2' }];

      const { result } = renderHook(() =>
        useExpandableList({ items: itemsWithoutIds, autoExpand: true })
      );

      // Should not crash, though IDs will be undefined and Set will dedupe them
      expect(result.current.getExpandedCount()).toBe(1); // Only one undefined in Set
      expect(result.current.isExpanded(undefined)).toBe(true);
    });

    it('handles duplicate IDs in initialExpanded', () => {
      const { result } = renderHook(() =>
        useExpandableList({
          items: mockItems,
          autoExpand: false,
          initialExpanded: ['item1', 'item1', 'item2']
        })
      );

      expect(result.current.getExpandedCount()).toBe(2);
      expect(result.current.isExpanded('item1')).toBe(true);
      expect(result.current.isExpanded('item2')).toBe(true);
    });

    it('handles null/undefined currentItemId', () => {
      const { result, rerender } = renderHook(
        ({ currentItemId }) =>
          useExpandableList({
            items: mockItems,
            autoExpand: false,
            currentItemId
          }),
        { initialProps: { currentItemId: 'item1' } }
      );

      expect(result.current.isExpanded('item1')).toBe(true);

      rerender({ currentItemId: null });
      // Should not crash or change expansion state
      expect(result.current.isExpanded('item1')).toBe(true);

      rerender({ currentItemId: undefined });
      // Should not crash or change expansion state
      expect(result.current.isExpanded('item1')).toBe(true);
    });
  });
});
