/**
 * Custom Font Loader for jsPDF
 * Handles loading and registering TTF fonts as base64 strings
 */

import jsPDF from 'jspdf';

// Font data storage
const fontData = new Map();
const loadingPromises = new Map();

/**
 * Convert TTF file to base64 string
 * This is a placeholder - in production you'd use the jsPDF font converter
 * or pre-convert your fonts and store them as base64 strings
 */
async function convertTTFToBase64(fontPath) {
  try {
    const response = await fetch(fontPath);
    const arrayBuffer = await response.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    return base64;
  } catch (error) {
    console.warn(`Failed to convert font ${fontPath}:`, error);
    return null;
  }
}

/**
 * Sample base64 fonts (you would replace these with your actual font data)
 * These are placeholder strings - real fonts would be much longer
 */
const SAMPLE_FONTS = {
  // These would be actual base64-encoded TTF fonts
  'palatino-normal': 'T1RUTy8v...', // Placeholder for Palatino Linotype Regular
  'palatino-bold': 'T1RUTy8v...', // Placeholder for Palatino Linotype Bold
  'palatino-italic': 'T1RUTy8v...', // Placeholder for Palatino Linotype Italic
  'garamond-normal': 'T1RUTy8v...', // Placeholder for Garamond Regular
  'garamond-bold': 'T1RUTy8v...', // Placeholder for Garamond Bold
  'garamond-italic': 'T1RUTy8v...', // Placeholder for Garamond Italic
  'baskerville-normal': 'T1RUTy8v...', // Placeholder for Baskerville Regular
  'baskerville-bold': 'T1RUTy8v...', // Placeholder for Baskerville Bold
  'baskerville-italic': 'T1RUTy8v...', // Placeholder for Baskerville Italic
};

/**
 * Font configuration for different weights and styles
 */
const FONT_CONFIGS = {
  'palatino': {
    normal: { ttfName: 'Palatino-Regular.ttf', base64Key: 'palatino-normal' },
    bold: { ttfName: 'Palatino-Bold.ttf', base64Key: 'palatino-bold' },
    italic: { ttfName: 'Palatino-Italic.ttf', base64Key: 'palatino-italic' },
    bolditalic: { ttfName: 'Palatino-BoldItalic.ttf', base64Key: 'palatino-bolditalic' }
  },
  'garamond': {
    normal: { ttfName: 'Garamond-Regular.ttf', base64Key: 'garamond-normal' },
    bold: { ttfName: 'Garamond-Bold.ttf', base64Key: 'garamond-bold' },
    italic: { ttfName: 'Garamond-Italic.ttf', base64Key: 'garamond-italic' },
    bolditalic: { ttfName: 'Garamond-BoldItalic.ttf', base64Key: 'garamond-bolditalic' }
  },
  'baskerville': {
    normal: { ttfName: 'Baskerville-Regular.ttf', base64Key: 'baskerville-normal' },
    bold: { ttfName: 'Baskerville-Bold.ttf', base64Key: 'baskerville-bold' },
    italic: { ttfName: 'Baskerville-Italic.ttf', base64Key: 'baskerville-italic' },
    bolditalic: { ttfName: 'Baskerville-BoldItalic.ttf', base64Key: 'baskerville-bolditalic' }
  }
};

/**
 * Load a custom font family with all its weights
 * @param {jsPDF} doc - The jsPDF document instance
 * @param {string} fontKey - The font key (e.g., 'palatino')
 * @returns {Promise<boolean>} - Success status
 */
export async function loadCustomFontFamily(doc, fontKey) {
  const cacheKey = `family-${fontKey}`;
  
  // Check if already loaded
  if (fontData.has(cacheKey)) {
    return true;
  }
  
  // Check if already loading
  if (loadingPromises.has(cacheKey)) {
    return loadingPromises.get(cacheKey);
  }
  
  const loadPromise = new Promise(async (resolve) => {
    try {
      const fontConfig = FONT_CONFIGS[fontKey];
      if (!fontConfig) {
        console.warn(`Font configuration not found for: ${fontKey}`);
        resolve(false);
        return;
      }
      
      let successCount = 0;
      const totalFonts = Object.keys(fontConfig).length;
      
      // Load each font weight
      for (const [weight, config] of Object.entries(fontConfig)) {
        try {
          let base64Data = SAMPLE_FONTS[config.base64Key];
          
          // In production, you would either:
          // 1. Have pre-converted base64 strings stored
          // 2. Load from a font file and convert
          // 3. Fetch from a font service
          
          if (!base64Data) {
            // Try to load from public/fonts directory
            const fontPath = `/fonts/${config.ttfName}`;
            base64Data = await convertTTFToBase64(fontPath);
          }
          
          if (base64Data && base64Data.length > 10) { // Basic validation
            // Add font to jsPDF virtual file system
            doc.addFileToVFS(config.ttfName, base64Data);
            
            // Register the font
            doc.addFont(config.ttfName, fontKey, weight);
            
            successCount++;
            console.log(`Loaded ${fontKey} ${weight} font`);
          } else {
            console.warn(`Failed to load ${fontKey} ${weight}: Invalid font data`);
          }
        } catch (error) {
          console.warn(`Error loading ${fontKey} ${weight}:`, error);
        }
      }
      
      const success = successCount > 0;
      if (success) {
        fontData.set(cacheKey, {
          fontKey,
          weightsLoaded: successCount,
          totalWeights: totalFonts,
          loadedAt: Date.now()
        });
      }
      
      resolve(success);
    } catch (error) {
      console.error(`Failed to load font family ${fontKey}:`, error);
      resolve(false);
    }
  });
  
  loadingPromises.set(cacheKey, loadPromise);
  return loadPromise;
}

/**
 * Check if a font family is loaded
 * @param {string} fontKey - The font key
 * @returns {boolean} - Whether the font is loaded
 */
export function isFontLoaded(fontKey) {
  return fontData.has(`family-${fontKey}`);
}

/**
 * Get loading status for all fonts
 * @returns {Object} - Font loading status
 */
export function getFontLoadingStatus() {
  const status = {};
  for (const [key, data] of fontData.entries()) {
    if (key.startsWith('family-')) {
      const fontKey = key.replace('family-', '');
      status[fontKey] = {
        loaded: true,
        weightsLoaded: data.weightsLoaded,
        totalWeights: data.totalWeights,
        loadedAt: data.loadedAt
      };
    }
  }
  return status;
}

/**
 * Pre-load common book fonts
 * @param {jsPDF} doc - The jsPDF document instance
 * @returns {Promise<Object>} - Loading results
 */
export async function preloadBookFonts(doc) {
  const fontsToLoad = ['palatino', 'garamond', 'baskerville'];
  const results = {};
  
  for (const fontKey of fontsToLoad) {
    try {
      results[fontKey] = await loadCustomFontFamily(doc, fontKey);
    } catch (error) {
      results[fontKey] = false;
      console.warn(`Failed to preload ${fontKey}:`, error);
    }
  }
  
  return results;
}

/**
 * Enhanced font mapping that considers loaded custom fonts
 * @param {jsPDF} doc - The jsPDF document instance  
 * @param {string} fontFamily - The requested font family
 * @returns {string} - The actual font name to use
 */
export function getOptimalFont(doc, fontFamily) {
  const fontKey = fontFamily.toLowerCase().replace(/[\s-]/g, '');
  
  // Map common font names to our font keys
  const fontMapping = {
    'palatinolinotype': 'palatino',
    'palatino': 'palatino',
    'garamond': 'garamond',
    'ebgaramond': 'garamond',
    'baskerville': 'baskerville',
    'librebaskerville': 'baskerville'
  };
  
  const mappedKey = fontMapping[fontKey];
  
  if (mappedKey && isFontLoaded(mappedKey)) {
    return mappedKey; // Use the custom font
  }
  
  // Fall back to jsPDF built-in fonts
  if (fontFamily.toLowerCase().includes('serif')) {
    return 'times';
  } else if (fontFamily.toLowerCase().includes('sans')) {
    return 'helvetica';
  } else if (fontFamily.toLowerCase().includes('mono')) {
    return 'courier';
  }
  
  return 'times'; // Default fallback
}

/**
 * Auto-load font when needed
 * @param {jsPDF} doc - The jsPDF document instance
 * @param {string} fontFamily - The requested font family
 * @returns {Promise<string>} - The actual font name to use
 */
export async function ensureFontLoaded(doc, fontFamily) {
  const fontKey = fontFamily.toLowerCase().replace(/[\s-]/g, '');
  
  const fontMapping = {
    'palatinolinotype': 'palatino',
    'palatino': 'palatino',
    'garamond': 'garamond',
    'baskerville': 'baskerville'
  };
  
  const mappedKey = fontMapping[fontKey];
  
  if (mappedKey && !isFontLoaded(mappedKey)) {
    console.log(`Auto-loading font: ${mappedKey}`);
    await loadCustomFontFamily(doc, mappedKey);
  }
  
  return getOptimalFont(doc, fontFamily);
}

export default {
  loadCustomFontFamily,
  isFontLoaded,
  getFontLoadingStatus,
  preloadBookFonts,
  getOptimalFont,
  ensureFontLoaded
};