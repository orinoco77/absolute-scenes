/**
 * Utility functions for front matter and back matter ordering and management
 */

// Define the canonical order for front matter sections
export const FRONT_MATTER_ORDER = [
  'copyright',
  'dedication',
  'acknowledgments',
  'foreword',
  'map',
  'prologue'
];

// Define the canonical order for back matter sections
export const BACK_MATTER_ORDER = [
  'epilogue',
  'appendix',
  'glossary',
  'bibliography',
  'acknowledgments',
  'index',
  'about-author'
];

/**
 * Sort front matter according to canonical publishing order
 * @param {Array} frontMatterArray - Array of front matter items
 * @returns {Array} Sorted array of front matter items
 */
export function sortFrontMatter(frontMatterArray) {
  if (!Array.isArray(frontMatterArray)) {
    return [];
  }

  return [...frontMatterArray].sort((a, b) => {
    const aIndex = FRONT_MATTER_ORDER.indexOf(a.type);
    const bIndex = FRONT_MATTER_ORDER.indexOf(b.type);

    // If type not in canonical order, put it at the end
    const aOrder = aIndex === -1 ? 1000 : aIndex;
    const bOrder = bIndex === -1 ? 1000 : bIndex;

    return aOrder - bOrder;
  });
}

/**
 * Get the display order index for a front matter type
 * @param {string} type - Front matter type
 * @returns {number} Order index (lower numbers appear first)
 */
export function getFrontMatterOrder(type) {
  const index = FRONT_MATTER_ORDER.indexOf(type);
  return index === -1 ? 1000 : index;
}

/**
 * Sort back matter according to canonical publishing order
 * @param {Array} backMatterArray - Array of back matter items
 * @returns {Array} Sorted array of back matter items
 */
export function sortBackMatter(backMatterArray) {
  if (!Array.isArray(backMatterArray)) {
    return [];
  }

  return [...backMatterArray].sort((a, b) => {
    const aIndex = BACK_MATTER_ORDER.indexOf(a.type);
    const bIndex = BACK_MATTER_ORDER.indexOf(b.type);

    // If type not in canonical order, put it at the end
    const aOrder = aIndex === -1 ? 1000 : aIndex;
    const bOrder = bIndex === -1 ? 1000 : bIndex;

    return aOrder - bOrder;
  });
}

/**
 * Get the display order index for a back matter type
 * @param {string} type - Back matter type
 * @returns {number} Order index (lower numbers appear first)
 */
export function getBackMatterOrder(type) {
  const index = BACK_MATTER_ORDER.indexOf(type);
  return index === -1 ? 1000 : index;
}
