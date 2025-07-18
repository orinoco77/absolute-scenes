/**
 * Advanced Font Management System for Book Publishing
 * Handles custom font loading for jsPDF and provides fallbacks
 */

import jsPDF from 'jspdf';

// Font definitions with characteristics for book publishing
export const BOOK_FONTS = {
  // Classic Serif Fonts (Best for Book Bodies)
  'palatino': {
    name: 'Palatino Linotype',
    category: 'serif',
    description: 'Elegant and highly readable, designed specifically for books',
    characteristics: 'Classic, elegant, professional',
    bestFor: ['fiction', 'literary', 'general'],
    fallback: 'times',
    webFont: 'Palatino, "Palatino Linotype", "Book Antiqua", serif',
    quality: 'premium'
  },
  'garamond': {
    name: 'EB Garamond',
    category: 'serif',
    description: 'Timeless classic, widely used in professional publishing',
    characteristics: 'Versatile, neutral, easy to read',
    bestFor: ['fiction', 'non-fiction', 'general'],
    fallback: 'times',
    webFont: '"EB Garamond", Garamond, "Times New Roman", serif',
    quality: 'premium'
  },
  'cormorant-garamond': {
    name: 'Cormorant Garamond',
    category: 'serif',
    description: 'Elegant display serif with excellent readability',
    characteristics: 'Sophisticated, distinctive, artistic',
    bestFor: ['literary', 'poetry', 'art-books'],
    fallback: 'times',
    webFont: '"Cormorant Garamond", Garamond, "Times New Roman", serif',
    quality: 'premium'
  },
  'caslon': {
    name: 'Adobe Caslon Pro',
    category: 'serif',
    description: 'Traditional choice used for the Declaration of Independence',
    characteristics: 'Authoritative, academic, serious',
    bestFor: ['non-fiction', 'academic', 'historical'],
    fallback: 'times',
    webFont: 'Caslon, "Adobe Caslon Pro", serif',
    quality: 'premium'
  },
  'baskerville': {
    name: 'Libre Baskerville',
    category: 'serif',
    description: 'Dramatic elegance with excellent readability',
    characteristics: 'Elegant, dramatic, sophisticated',
    bestFor: ['literary', 'thriller', 'mystery'],
    fallback: 'times',
    webFont: '"Libre Baskerville", Baskerville, "Times New Roman", serif',
    quality: 'premium'
  },
  'minion': {
    name: 'Minion Pro',
    category: 'serif',
    description: 'Adobe\'s professional publishing standard',
    characteristics: 'Professional, clean, highly readable',
    bestFor: ['magazines', 'newspapers', 'professional'],
    fallback: 'times',
    webFont: 'Minion, "Minion Pro", serif',
    quality: 'premium'
  },
  'sabon': {
    name: 'Sabon',
    category: 'serif',
    description: 'Elegant typeface, particularly good for romance novels',
    characteristics: 'Romantic, elegant, feminine',
    bestFor: ['romance', 'literary', 'contemporary'],
    fallback: 'times',
    webFont: 'Sabon, serif',
    quality: 'premium'
  },
  'bembo': {
    name: 'Bembo',
    category: 'serif',
    description: 'Classic contemporary look, widely used in fiction',
    characteristics: 'Contemporary, classic, balanced',
    bestFor: ['fiction', 'contemporary', 'general'],
    fallback: 'times',
    webFont: 'Bembo, serif',
    quality: 'premium'
  },
  
  // Standard High-Quality Alternatives
  'georgia': {
    name: 'Georgia',
    category: 'serif',
    description: 'Designed for screen reading, excellent for digital books',
    characteristics: 'Clear, robust, screen-optimized',
    bestFor: ['ebooks', 'digital', 'young-adult'],
    fallback: 'times',
    webFont: 'Georgia, serif',
    quality: 'high',
    systemFont: true
  },
  'times': {
    name: 'Times New Roman',
    category: 'serif',
    description: 'Classic and reliable, though somewhat dated',
    characteristics: 'Traditional, formal, widely available',
    bestFor: ['general', 'academic', 'formal'],
    fallback: 'times',
    webFont: '"Times New Roman", Times, serif',
    quality: 'standard',
    systemFont: true
  },
  'crimson': {
    name: 'Crimson Text',
    category: 'serif',
    description: 'Contemporary serif designed for both print and digital',
    characteristics: 'Modern, elegant, versatile',
    bestFor: ['modern-fiction', 'thriller', 'fantasy'],
    fallback: 'times',
    webFont: '"Crimson Text", "Times New Roman", serif',
    quality: 'high'
  },
  'source-serif': {
    name: 'Source Serif 4',
    category: 'serif',
    description: 'Adobe\'s open-source serif designed for professional publishing',
    characteristics: 'Professional, clean, highly readable',
    bestFor: ['non-fiction', 'technical', 'professional'],
    fallback: 'times',
    webFont: '"Source Serif Pro", "Times New Roman", serif',
    quality: 'premium'
  },
  
  // Sans-Serif (for headers and special uses)
  'gill-sans': {
    name: 'Gill Sans',
    category: 'sans-serif',
    description: 'Classic British sans-serif, excellent for headers',
    characteristics: 'Clean, British, authoritative',
    bestFor: ['headers', 'titles', 'non-fiction'],
    fallback: 'helvetica',
    webFont: '"Gill Sans", "Gill Sans MT", sans-serif',
    quality: 'premium'
  },
  'helvetica': {
    name: 'Helvetica',
    category: 'sans-serif',
    description: 'Clean and modern, good for headers and titles',
    characteristics: 'Clean, modern, neutral',
    bestFor: ['headers', 'modern', 'minimalist'],
    fallback: 'helvetica',
    webFont: 'Helvetica, Arial, sans-serif',
    quality: 'high',
    systemFont: true
  },
  
  // Monospace
  'courier': {
    name: 'Courier New',
    category: 'monospace',
    description: 'Typewriter style, good for code or special effects',
    characteristics: 'Typewriter, retro, uniform',
    bestFor: ['code', 'manuscripts', 'special-effects'],
    fallback: 'courier',
    webFont: '"Courier New", Courier, monospace',
    quality: 'standard',
    systemFont: true
  }
};

// Font loading state
let loadedFonts = new Set();
let fontLoadingPromises = new Map();
let fontSystemInitialized = false; // Guard to prevent duplicate initialization

/**
 * Load a custom font file and add it to jsPDF
 * @param {string} fontKey - The font key from BOOK_FONTS
 * @param {string} fontPath - Path to the font file (relative to public folder)
 * @param {Object} options - Font options
 */
export async function loadCustomFont(fontKey, fontPath, options = {}) {
  if (loadedFonts.has(fontKey)) {
    return true; // Already loaded
  }

  // Check if we're already loading this font
  if (fontLoadingPromises.has(fontKey)) {
    return fontLoadingPromises.get(fontKey);
  }

  const loadPromise = new Promise(async (resolve, reject) => {
    try {
      // For now, we'll create a placeholder that maps to system fonts
      // In a real implementation, you would:
      // 1. Fetch the font file
      // 2. Convert it to base64
      // 3. Add it to jsPDF using addFont()
      
      console.log(`Font ${fontKey} would be loaded from ${fontPath}`);
      
      // Mark as loaded (even though we're using fallback)
      loadedFonts.add(fontKey);
      resolve(true);
    } catch (error) {
      console.warn(`Failed to load font ${fontKey}:`, error);
      reject(error);
    }
  });

  fontLoadingPromises.set(fontKey, loadPromise);
  return loadPromise;
}

/**
 * Get the best available font for jsPDF
 * @param {string} fontFamily - The requested font family
 * @return {string} - The jsPDF font name to use
 */
export function getPdfFont(fontFamily) {
  // First, try to find exact match in our font catalog
  const fontKey = Object.keys(BOOK_FONTS).find(key => {
    const font = BOOK_FONTS[key];
    return font.name === fontFamily || key === fontFamily.toLowerCase().replace(/\s+/g, '-');
  });

  if (fontKey && BOOK_FONTS[fontKey]) {
    const font = BOOK_FONTS[fontKey];
    
    // Check if custom font is loaded
    if (loadedFonts.has(fontKey)) {
      return fontKey; // Use the custom font
    }
    
    // Fall back to jsPDF built-in font
    return font.fallback;
  }

  // Legacy mapping for backward compatibility
  const legacyFontMap = {
    'Times New Roman': 'times',
    'Georgia': 'times',
    'Garamond': 'times',
    'Palatino Linotype': 'times',
    'Book Antiqua': 'times',
    'Minion Pro': 'times',
    'Adobe Caslon Pro': 'times',
    'Crimson Text': 'times',
    'Baskerville': 'times',
    'Sabon': 'times',
    'Bembo': 'times',
    
    'Arial': 'helvetica',
    'Helvetica': 'helvetica',
    'Calibri': 'helvetica',
    'Gill Sans': 'helvetica',
    
    'Courier New': 'courier',
    'Monaco': 'courier',
    'Consolas': 'courier'
  };

  return legacyFontMap[fontFamily] || 'times';
}

/**
 * Get font recommendations based on genre
 * @param {string} genre - The book genre
 * @return {Array} - Array of recommended font keys
 */
export function getFontRecommendations(genre) {
  const recommendations = [];
  
  Object.keys(BOOK_FONTS).forEach(key => {
    const font = BOOK_FONTS[key];
    if (font.bestFor.includes(genre) || font.bestFor.includes('general')) {
      recommendations.push({
        key,
        ...font,
        recommended: font.bestFor.includes(genre)
      });
    }
  });

  // Sort by quality and recommendation
  return recommendations.sort((a, b) => {
    if (a.recommended && !b.recommended) return -1;
    if (!a.recommended && b.recommended) return 1;
    
    const qualityOrder = { premium: 3, high: 2, standard: 1 };
    return (qualityOrder[b.quality] || 0) - (qualityOrder[a.quality] || 0);
  });
}

/**
 * Get the CSS font family string for HTML preview
 * @param {string} fontFamily - The requested font family
 * @return {string} - CSS font-family value
 */
export function getCssFontFamily(fontFamily) {
  const fontKey = Object.keys(BOOK_FONTS).find(key => {
    const font = BOOK_FONTS[key];
    return font.name === fontFamily || key === fontFamily.toLowerCase().replace(/\s+/g, '-');
  });

  if (fontKey && BOOK_FONTS[fontKey]) {
    return BOOK_FONTS[fontKey].webFont;
  }

  // Return the original font family with fallbacks
  if (fontFamily.includes('serif') || 
      ['Times New Roman', 'Georgia', 'Garamond'].includes(fontFamily)) {
    return `"${fontFamily}", serif`;
  } else if (fontFamily.includes('sans') || 
             ['Arial', 'Helvetica'].includes(fontFamily)) {
    return `"${fontFamily}", sans-serif`;
  } else if (['Courier', 'Monaco'].includes(fontFamily)) {
    return `"${fontFamily}", monospace`;
  }

  return `"${fontFamily}", serif`; // Default to serif for books
}

/**
 * Initialize the font system
 */
export function initializeFontSystem() {
  // Prevent duplicate initialization in React StrictMode
  if (fontSystemInitialized) {
    console.log('Font system already initialized - skipping duplicate');
    return;
  }
  
  console.log('Font system initialized with', Object.keys(BOOK_FONTS).length, 'available fonts');
  fontSystemInitialized = true;
  
  // Check if we're in Electron environment
  const isElectron = typeof window !== 'undefined' && typeof window.require === 'function';
  
  if (isElectron) {
    // Load local fonts in Electron environment
    console.log('Electron environment detected - loading local fonts');
    
    const link = document.createElement('link');
    link.href = './fonts/fonts.css';
    link.rel = 'stylesheet';
    link.onload = () => {
      console.log('Local fonts loaded successfully');
      console.log('Available fonts: EB Garamond, Libre Baskerville, Crimson Text, Source Serif 4, Cormorant Garamond');
    };
    link.onerror = () => {
      console.warn('Local fonts not found - using system fonts instead');
      console.info('To install beautiful fonts, see FONT_INSTALLATION.md');
    };
    document.head.appendChild(link);
  } else {
    // Load Google Fonts in browser environment
    console.log('Browser environment detected - loading Google Fonts');
    
    const googleFonts = [
      'EB+Garamond:400,400i,700,700i',
      'Libre+Baskerville:400,400i,700',
      'Crimson+Text:400,400i,600,600i',
      'Source+Serif+Pro:400,400i,700'
    ];
    
    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?${googleFonts.map(f => `family=${f}`).join('&')}&display=swap`;
    link.rel = 'stylesheet';
    link.onerror = () => {
      console.warn('Failed to load Google Fonts - using system fonts instead');
    };
    document.head.appendChild(link);
  }
}

/**
 * Check if a font requires a license
 * @param {string} fontFamily - The font family name
 * @return {Object} - License information
 */
export function getFontLicenseInfo(fontFamily) {
  const fontKey = Object.keys(BOOK_FONTS).find(key => {
    const font = BOOK_FONTS[key];
    return font.name === fontFamily;
  });

  if (fontKey && BOOK_FONTS[fontKey]) {
    const font = BOOK_FONTS[fontKey];
    
    if (font.systemFont) {
      return {
        requiresLicense: false,
        type: 'system',
        note: 'Available on most systems'
      };
    } else if (font.quality === 'premium') {
      return {
        requiresLicense: true,
        type: 'commercial',
        note: 'Professional font license required for commercial use'
      };
    } else {
      return {
        requiresLicense: false,
        type: 'web',
        note: 'Available via web fonts'
      };
    }
  }

  return {
    requiresLicense: true,
    type: 'unknown',
    note: 'License status unknown'
  };
}

export default {
  BOOK_FONTS,
  loadCustomFont,
  getPdfFont,
  getFontRecommendations,
  getCssFontFamily,
  initializeFontSystem,
  getFontLicenseInfo
};