import {
  sortFrontMatter,
  getFrontMatterOrder,
  sortBackMatter,
  getBackMatterOrder,
  FRONT_MATTER_ORDER,
  BACK_MATTER_ORDER
} from '../frontMatterUtils';

describe('frontMatterUtils', () => {
  describe('sortFrontMatter', () => {
    it('sorts front matter in canonical order', () => {
      const unsortedFrontMatter = [
        { type: 'prologue', title: 'Prologue' },
        { type: 'copyright', title: 'Copyright' },
        { type: 'map', title: 'Map' },
        { type: 'dedication', title: 'Dedication' },
        { type: 'foreword', title: 'Foreword' },
        { type: 'acknowledgments', title: 'Acknowledgments' }
      ];

      const sorted = sortFrontMatter(unsortedFrontMatter);

      const expectedOrder = [
        'copyright',
        'dedication',
        'acknowledgments',
        'foreword',
        'map',
        'prologue'
      ];
      const actualOrder = sorted.map(item => item.type);

      expect(actualOrder).toEqual(expectedOrder);
    });

    it('handles empty arrays', () => {
      expect(sortFrontMatter([])).toEqual([]);
    });

    it('handles null/undefined input', () => {
      expect(sortFrontMatter(null)).toEqual([]);
      expect(sortFrontMatter(undefined)).toEqual([]);
    });

    it('puts unknown types at the end', () => {
      const frontMatter = [
        { type: 'unknown', title: 'Unknown' },
        { type: 'copyright', title: 'Copyright' },
        { type: 'custom', title: 'Custom' }
      ];

      const sorted = sortFrontMatter(frontMatter);
      const actualOrder = sorted.map(item => item.type);

      expect(actualOrder).toEqual(['copyright', 'unknown', 'custom']);
    });
  });

  describe('getFrontMatterOrder', () => {
    it('returns correct order for known types', () => {
      expect(getFrontMatterOrder('manuscript-title')).toBe(0);
      expect(getFrontMatterOrder('copyright')).toBe(1);
      expect(getFrontMatterOrder('dedication')).toBe(2);
      expect(getFrontMatterOrder('acknowledgments')).toBe(3);
      expect(getFrontMatterOrder('foreword')).toBe(4);
      expect(getFrontMatterOrder('map')).toBe(5);
      expect(getFrontMatterOrder('prologue')).toBe(6);
    });

    it('returns 1000 for unknown types', () => {
      expect(getFrontMatterOrder('unknown')).toBe(1000);
      expect(getFrontMatterOrder('')).toBe(1000);
    });
  });

  describe('FRONT_MATTER_ORDER', () => {
    it('has the correct canonical order', () => {
      expect(FRONT_MATTER_ORDER).toEqual([
        'manuscript-title',
        'copyright',
        'dedication',
        'acknowledgments',
        'foreword',
        'map',
        'prologue'
      ]);
    });
  });

  describe('sortBackMatter', () => {
    it('sorts back matter in canonical order', () => {
      const unsortedBackMatter = [
        { type: 'index', title: 'Index' },
        { type: 'epilogue', title: 'Epilogue' },
        { type: 'bibliography', title: 'Bibliography' },
        { type: 'about-author', title: 'About the Author' },
        { type: 'appendix', title: 'Appendix' },
        { type: 'glossary', title: 'Glossary' },
        { type: 'acknowledgments', title: 'Acknowledgments' }
      ];

      const sorted = sortBackMatter(unsortedBackMatter);

      const expectedOrder = [
        'epilogue',
        'appendix',
        'glossary',
        'bibliography',
        'acknowledgments',
        'index',
        'about-author'
      ];
      const actualOrder = sorted.map(item => item.type);

      expect(actualOrder).toEqual(expectedOrder);
    });

    it('handles empty arrays', () => {
      expect(sortBackMatter([])).toEqual([]);
    });

    it('handles null/undefined input', () => {
      expect(sortBackMatter(null)).toEqual([]);
      expect(sortBackMatter(undefined)).toEqual([]);
    });

    it('puts unknown types at the end', () => {
      const backMatter = [
        { type: 'unknown', title: 'Unknown' },
        { type: 'epilogue', title: 'Epilogue' },
        { type: 'custom', title: 'Custom' }
      ];

      const sorted = sortBackMatter(backMatter);
      const actualOrder = sorted.map(item => item.type);

      expect(actualOrder).toEqual(['epilogue', 'unknown', 'custom']);
    });
  });

  describe('getBackMatterOrder', () => {
    it('returns correct order for known types', () => {
      expect(getBackMatterOrder('epilogue')).toBe(0);
      expect(getBackMatterOrder('appendix')).toBe(1);
      expect(getBackMatterOrder('glossary')).toBe(2);
      expect(getBackMatterOrder('bibliography')).toBe(3);
      expect(getBackMatterOrder('acknowledgments')).toBe(4);
      expect(getBackMatterOrder('index')).toBe(5);
      expect(getBackMatterOrder('about-author')).toBe(6);
    });

    it('returns 1000 for unknown types', () => {
      expect(getBackMatterOrder('unknown')).toBe(1000);
      expect(getBackMatterOrder('')).toBe(1000);
    });
  });

  describe('BACK_MATTER_ORDER', () => {
    it('has the correct canonical order', () => {
      expect(BACK_MATTER_ORDER).toEqual([
        'epilogue',
        'appendix',
        'glossary',
        'bibliography',
        'acknowledgments',
        'index',
        'about-author'
      ]);
    });
  });
});
