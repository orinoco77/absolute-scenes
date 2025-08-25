import { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook for managing expandable list items
 * Eliminates duplicate expansion state management across components
 *
 * @param {Object} options - Configuration options
 * @param {Array} options.items - Array of items with id property
 * @param {boolean} options.autoExpand - Whether to auto-expand all items (default: true)
 * @param {Array} options.initialExpanded - Array of IDs to initially expand
 * @param {string} options.currentItemId - ID of currently selected item (auto-expands)
 * @returns {Object} Expansion state and handlers
 */
export function useExpandableList({
  items = [],
  autoExpand = true,
  initialExpanded = [],
  currentItemId = null
} = {}) {
  const [expandedItems, setExpandedItems] = useState(() => {
    if (initialExpanded.length > 0) {
      return new Set(initialExpanded);
    }

    if (autoExpand && items.length > 0) {
      return new Set(items.map(item => item.id));
    }

    return new Set();
  });

  // Auto-expand items when the list changes
  useEffect(() => {
    if (autoExpand && items.length > 0) {
      setExpandedItems(prev => {
        const newExpanded = new Set(prev);
        items.forEach(item => {
          if (!newExpanded.has(item.id)) {
            newExpanded.add(item.id);
          }
        });
        return newExpanded;
      });
    }
  }, [items, autoExpand]);

  // Auto-expand current item when it changes (but allow manual collapse)
  useEffect(() => {
    if (currentItemId && !expandedItems.has(currentItemId)) {
      setExpandedItems(prev => new Set([...prev, currentItemId]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentItemId]); // Intentionally omit expandedItems to allow manual collapse

  const toggleItem = useCallback(itemId => {
    setExpandedItems(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(itemId)) {
        newExpanded.delete(itemId);
      } else {
        newExpanded.add(itemId);
      }
      return newExpanded;
    });
  }, []);

  const expandItem = useCallback(itemId => {
    setExpandedItems(prev => {
      if (!prev.has(itemId)) {
        return new Set([...prev, itemId]);
      }
      return prev;
    });
  }, []);

  const collapseItem = useCallback(itemId => {
    setExpandedItems(prev => {
      if (prev.has(itemId)) {
        const newExpanded = new Set(prev);
        newExpanded.delete(itemId);
        return newExpanded;
      }
      return prev;
    });
  }, []);

  const expandAll = useCallback(() => {
    if (items.length > 0) {
      setExpandedItems(new Set(items.map(item => item.id)));
    }
  }, [items]);

  const collapseAll = useCallback(() => {
    setExpandedItems(new Set());
  }, []);

  const isExpanded = useCallback(
    itemId => {
      return expandedItems.has(itemId);
    },
    [expandedItems]
  );

  const getExpandedCount = useCallback(() => {
    return expandedItems.size;
  }, [expandedItems]);

  const getExpandedIds = useCallback(() => {
    return Array.from(expandedItems);
  }, [expandedItems]);

  return {
    // State
    expandedItems,

    // Actions
    toggleItem,
    expandItem,
    collapseItem,
    expandAll,
    collapseAll,

    // Utility functions
    isExpanded,
    getExpandedCount,
    getExpandedIds
  };
}
