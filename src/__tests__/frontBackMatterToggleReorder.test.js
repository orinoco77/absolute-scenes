import { renderHook, act } from '@testing-library/react';
import { useBookState } from '../hooks/useBookState';

// Mock date for consistent testing
const mockDate = '2023-12-01T10:00:00.000Z';
const mockDateNow = 1701424800000;
const OriginalDate = Date;

beforeAll(() => {
  global.Date = class extends OriginalDate {
    constructor(...args) {
      if (args.length) {
        super(...args);
      } else {
        super(mockDateNow);
      }
    }

    toISOString() {
      return mockDate;
    }

    static now() {
      return mockDateNow;
    }
  };
});

afterAll(() => {
  global.Date = OriginalDate;
});

describe('Front/Back Matter Toggle and Reorder', () => {
  describe('Front Matter Toggle', () => {
    test('should toggle front matter enabled state to false', () => {
      const { result } = renderHook(() => useBookState());

      // Add a front matter item
      act(() => {
        result.current.addFrontMatter({
          id: 'prologue-1',
          type: 'prologue',
          title: 'Prologue',
          content: 'Test prologue content',
          enabled: true,
          created: mockDate,
          modified: mockDate
        });
      });

      // Verify it was added and is enabled
      expect(result.current.book.frontMatter).toHaveLength(1);
      expect(result.current.book.frontMatter[0].enabled).toBe(true);

      // Toggle it off
      act(() => {
        result.current.toggleFrontMatter('prologue-1', false);
      });

      // Verify it's now disabled
      expect(result.current.book.frontMatter[0].enabled).toBe(false);
    });

    test('should toggle front matter enabled state to true', () => {
      const { result } = renderHook(() => useBookState());

      // Add a disabled front matter item
      act(() => {
        result.current.addFrontMatter({
          id: 'dedication-1',
          type: 'dedication',
          title: 'Dedication',
          content: 'Test dedication',
          enabled: false,
          created: mockDate,
          modified: mockDate
        });
      });

      expect(result.current.book.frontMatter[0].enabled).toBe(false);

      // Toggle it on
      act(() => {
        result.current.toggleFrontMatter('dedication-1', true);
      });

      // Verify it's now enabled
      expect(result.current.book.frontMatter[0].enabled).toBe(true);
    });
  });

  describe('Back Matter Toggle', () => {
    test('should toggle back matter enabled state to false', () => {
      const { result } = renderHook(() => useBookState());

      act(() => {
        result.current.addBackMatter({
          id: 'epilogue-1',
          type: 'epilogue',
          title: 'Epilogue',
          content: 'Test epilogue content',
          enabled: true,
          created: mockDate,
          modified: mockDate
        });
      });

      expect(result.current.book.backMatter[0].enabled).toBe(true);

      act(() => {
        result.current.toggleBackMatter('epilogue-1', false);
      });

      expect(result.current.book.backMatter[0].enabled).toBe(false);
    });

    test('should toggle back matter enabled state to true', () => {
      const { result } = renderHook(() => useBookState());

      act(() => {
        result.current.addBackMatter({
          id: 'acknowledgments-1',
          type: 'acknowledgments',
          title: 'Acknowledgments',
          content: 'Test acknowledgments',
          enabled: false,
          created: mockDate,
          modified: mockDate
        });
      });

      expect(result.current.book.backMatter[0].enabled).toBe(false);

      act(() => {
        result.current.toggleBackMatter('acknowledgments-1', true);
      });

      expect(result.current.book.backMatter[0].enabled).toBe(true);
    });
  });

  describe('Front Matter Reorder', () => {
    test('should reorder front matter items from index 0 to 1', () => {
      const { result } = renderHook(() => useBookState());

      // Add two items
      act(() => {
        result.current.addFrontMatter({
          id: 'prologue-1',
          type: 'prologue',
          title: 'Prologue',
          content: 'First item',
          enabled: true,
          created: mockDate,
          modified: mockDate
        });
        result.current.addFrontMatter({
          id: 'dedication-1',
          type: 'dedication',
          title: 'Dedication',
          content: 'Second item',
          enabled: true,
          created: mockDate,
          modified: mockDate
        });
      });

      // Verify initial order
      expect(result.current.book.frontMatter[0].id).toBe('prologue-1');
      expect(result.current.book.frontMatter[1].id).toBe('dedication-1');

      // Reorder: move first item to second position
      act(() => {
        result.current.reorderFrontMatter(0, 1);
      });

      // Verify new order
      expect(result.current.book.frontMatter[0].id).toBe('dedication-1');
      expect(result.current.book.frontMatter[1].id).toBe('prologue-1');
    });

    test('should reorder front matter items from index 1 to 0', () => {
      const { result } = renderHook(() => useBookState());

      act(() => {
        result.current.addFrontMatter({
          id: 'foreword-1',
          type: 'foreword',
          title: 'Foreword',
          content: 'First',
          enabled: true,
          created: mockDate,
          modified: mockDate
        });
        result.current.addFrontMatter({
          id: 'preface-1',
          type: 'preface',
          title: 'Preface',
          content: 'Second',
          enabled: true,
          created: mockDate,
          modified: mockDate
        });
      });

      expect(result.current.book.frontMatter[0].id).toBe('foreword-1');
      expect(result.current.book.frontMatter[1].id).toBe('preface-1');

      // Move second item to first position
      act(() => {
        result.current.reorderFrontMatter(1, 0);
      });

      expect(result.current.book.frontMatter[0].id).toBe('preface-1');
      expect(result.current.book.frontMatter[1].id).toBe('foreword-1');
    });

    test('should handle reordering with three items', () => {
      const { result } = renderHook(() => useBookState());

      act(() => {
        result.current.addFrontMatter({
          id: 'item-1',
          type: 'prologue',
          title: 'First',
          content: '',
          enabled: true,
          created: mockDate,
          modified: mockDate
        });
        result.current.addFrontMatter({
          id: 'item-2',
          type: 'dedication',
          title: 'Second',
          content: '',
          enabled: true,
          created: mockDate,
          modified: mockDate
        });
        result.current.addFrontMatter({
          id: 'item-3',
          type: 'foreword',
          title: 'Third',
          content: '',
          enabled: true,
          created: mockDate,
          modified: mockDate
        });
      });

      // Move first item to last position
      act(() => {
        result.current.reorderFrontMatter(0, 2);
      });

      expect(result.current.book.frontMatter[0].id).toBe('item-2');
      expect(result.current.book.frontMatter[1].id).toBe('item-3');
      expect(result.current.book.frontMatter[2].id).toBe('item-1');
    });
  });

  describe('Back Matter Reorder', () => {
    test('should reorder back matter items from index 0 to 1', () => {
      const { result } = renderHook(() => useBookState());

      act(() => {
        result.current.addBackMatter({
          id: 'epilogue-1',
          type: 'epilogue',
          title: 'Epilogue',
          content: 'First',
          enabled: true,
          created: mockDate,
          modified: mockDate
        });
        result.current.addBackMatter({
          id: 'acknowledgments-1',
          type: 'acknowledgments',
          title: 'Acknowledgments',
          content: 'Second',
          enabled: true,
          created: mockDate,
          modified: mockDate
        });
      });

      expect(result.current.book.backMatter[0].id).toBe('epilogue-1');
      expect(result.current.book.backMatter[1].id).toBe('acknowledgments-1');

      act(() => {
        result.current.reorderBackMatter(0, 1);
      });

      expect(result.current.book.backMatter[0].id).toBe('acknowledgments-1');
      expect(result.current.book.backMatter[1].id).toBe('epilogue-1');
    });

    test('should reorder back matter items from index 1 to 0', () => {
      const { result } = renderHook(() => useBookState());

      act(() => {
        result.current.addBackMatter({
          id: 'about-1',
          type: 'about-author',
          title: 'About the Author',
          content: 'First',
          enabled: true,
          created: mockDate,
          modified: mockDate
        });
        result.current.addBackMatter({
          id: 'glossary-1',
          type: 'glossary',
          title: 'Glossary',
          content: 'Second',
          enabled: true,
          created: mockDate,
          modified: mockDate
        });
      });

      expect(result.current.book.backMatter[0].id).toBe('about-1');
      expect(result.current.book.backMatter[1].id).toBe('glossary-1');

      act(() => {
        result.current.reorderBackMatter(1, 0);
      });

      expect(result.current.book.backMatter[0].id).toBe('glossary-1');
      expect(result.current.book.backMatter[1].id).toBe('about-1');
    });
  });

  describe('Combined Toggle and Reorder Operations', () => {
    test('should maintain enabled state after reordering', () => {
      const { result } = renderHook(() => useBookState());

      act(() => {
        result.current.addFrontMatter({
          id: 'item-1',
          type: 'prologue',
          title: 'First',
          content: '',
          enabled: true,
          created: mockDate,
          modified: mockDate
        });
        result.current.addFrontMatter({
          id: 'item-2',
          type: 'dedication',
          title: 'Second',
          content: '',
          enabled: false,
          created: mockDate,
          modified: mockDate
        });
      });

      // Verify initial states
      expect(result.current.book.frontMatter[0].enabled).toBe(true);
      expect(result.current.book.frontMatter[1].enabled).toBe(false);

      // Reorder
      act(() => {
        result.current.reorderFrontMatter(0, 1);
      });

      // States should be maintained after reorder
      expect(result.current.book.frontMatter[0].enabled).toBe(false);
      expect(result.current.book.frontMatter[1].enabled).toBe(true);
    });

    test('should allow toggling after reordering', () => {
      const { result } = renderHook(() => useBookState());

      act(() => {
        result.current.addBackMatter({
          id: 'item-1',
          type: 'epilogue',
          title: 'First',
          content: '',
          enabled: true,
          created: mockDate,
          modified: mockDate
        });
        result.current.addBackMatter({
          id: 'item-2',
          type: 'acknowledgments',
          title: 'Second',
          content: '',
          enabled: true,
          created: mockDate,
          modified: mockDate
        });
      });

      // Reorder
      act(() => {
        result.current.reorderBackMatter(0, 1);
      });

      // Toggle the first item (which was originally second)
      act(() => {
        result.current.toggleBackMatter('item-2', false);
      });

      expect(result.current.book.backMatter[0].enabled).toBe(false);
      expect(result.current.book.backMatter[1].enabled).toBe(true);
    });
  });
});
