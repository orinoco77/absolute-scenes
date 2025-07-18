/**
 * Font Preview and Loading Utilities
 * Provides font preview capabilities and advanced font loading
 */

import { BOOK_FONTS, getCssFontFamily } from './fontManager';

/**
 * Generate a font preview sample
 * @param {string} fontFamily - The font family name
 * @param {number} fontSize - Font size in points
 * @param {number} lineHeight - Line height multiplier
 * @return {Object} - Preview configuration
 */
export function generateFontPreview(fontFamily, fontSize = 12, lineHeight = 1.4) {
  const cssFont = getCssFontFamily(fontFamily);
  
  const sampleTexts = {
    title: "The Moonlit Garden",
    paragraph: `In the heart of the ancient city stood a garden that bloomed only under moonlight. Sarah walked along the cobblestone path, her footsteps echoing in the silver-bathed silence. The roses here were unlike any she had ever seen—their petals seemed to glow with an inner light, casting soft shadows that danced with each gentle breeze.`,
    dialogue: `"Have you ever seen anything like this?" she whispered to Marcus, who stood transfixed by the luminescent fountain at the garden's center.`,
    description: `The fountain's water cascaded in impossible spirals, defying gravity as droplets hung suspended in the air like diamonds against velvet. This was no ordinary place—it was where dreams took physical form, where the impossible became beautifully, terrifyingly real.`
  };
  
  return {
    fontFamily: cssFont,
    fontSize: `${fontSize}pt`,
    lineHeight: lineHeight,
    samples: sampleTexts,
    style: {
      fontFamily: cssFont,
      fontSize: `${fontSize}pt`,
      lineHeight: lineHeight,
      color: '#333',
      textAlign: 'justify'
    }
  };
}

/**
 * Create a font comparison between multiple fonts
 * @param {Array} fontFamilies - Array of font family names
 * @param {Object} options - Comparison options
 * @return {Array} - Array of preview configurations
 */
export function createFontComparison(fontFamilies, options = {}) {
  const {
    fontSize = 12,
    lineHeight = 1.4,
    sampleText = "The quick brown fox jumps over the lazy dog. In a hole in the ground there lived a hobbit."
  } = options;
  
  return fontFamilies.map(fontFamily => {
    const fontInfo = Object.values(BOOK_FONTS).find(font => font.name === fontFamily);
    return {
      name: fontFamily,
      info: fontInfo,
      preview: generateFontPreview(fontFamily, fontSize, lineHeight),
      sampleText,
      characteristics: fontInfo?.characteristics || 'Standard font',
      bestFor: fontInfo?.bestFor || ['general']
    };
  });
}

/**
 * Calculate reading comfort metrics for a font
 * @param {string} fontFamily - The font family name
 * @param {number} fontSize - Font size in points
 * @param {number} lineHeight - Line height multiplier
 * @return {Object} - Comfort metrics
 */
export function calculateReadingComfort(fontFamily, fontSize, lineHeight) {
  const fontInfo = Object.values(BOOK_FONTS).find(font => font.name === fontFamily);
  
  // Basic comfort scoring (this would be more sophisticated in a real implementation)
  let comfortScore = 50; // Base score
  
  // Font size adjustments
  if (fontSize >= 10 && fontSize <= 14) comfortScore += 20;
  else if (fontSize < 10) comfortScore -= 15;
  else if (fontSize > 16) comfortScore -= 10;
  
  // Line height adjustments
  if (lineHeight >= 1.2 && lineHeight <= 1.6) comfortScore += 15;
  else if (lineHeight < 1.2) comfortScore -= 20;
  else if (lineHeight > 2.0) comfortScore -= 10;
  
  // Font quality adjustments
  if (fontInfo) {
    if (fontInfo.quality === 'premium') comfortScore += 15;
    else if (fontInfo.quality === 'high') comfortScore += 10;
    if (fontInfo.category === 'serif') comfortScore += 10; // Serif generally better for reading
  }
  
  // Normalize to 0-100
  comfortScore = Math.max(0, Math.min(100, comfortScore));
  
  let rating = 'Poor';
  if (comfortScore >= 80) rating = 'Excellent';
  else if (comfortScore >= 65) rating = 'Good';
  else if (comfortScore >= 50) rating = 'Fair';
  
  return {
    score: comfortScore,
    rating,
    recommendations: generateRecommendations(fontSize, lineHeight, fontInfo)
  };
}

/**
 * Generate improvement recommendations
 * @param {number} fontSize - Current font size
 * @param {number} lineHeight - Current line height
 * @param {Object} fontInfo - Font information
 * @return {Array} - Array of recommendation strings
 */
function generateRecommendations(fontSize, lineHeight, fontInfo) {
  const recommendations = [];
  
  if (fontSize < 10) {
    recommendations.push('Consider increasing font size to 10-12pt for better readability');
  } else if (fontSize > 14) {
    recommendations.push('Font size might be too large for comfortable reading');
  }
  
  if (lineHeight < 1.2) {
    recommendations.push('Increase line height to 1.2-1.4 for better line spacing');
  } else if (lineHeight > 1.8) {
    recommendations.push('Line height might be too loose, consider reducing to 1.4-1.6');
  }
  
  if (fontInfo && fontInfo.category === 'sans-serif') {
    recommendations.push('Consider using a serif font for body text - easier on the eyes for long reading');
  }
  
  if (!fontInfo || fontInfo.quality === 'standard') {
    recommendations.push('Consider upgrading to a premium book font for professional appearance');
  }
  
  return recommendations;
}

/**
 * Load and cache web fonts for better preview
 * @param {Array} fontFamilies - Array of font families to load
 * @return {Promise} - Promise that resolves when fonts are loaded
 */
export async function preloadWebFonts(fontFamilies) {
  const webFontsToLoad = [];
  
  fontFamilies.forEach(fontFamily => {
    const fontInfo = Object.values(BOOK_FONTS).find(font => font.name === fontFamily);
    if (fontInfo && !fontInfo.systemFont) {
      // Add to web fonts loading queue
      webFontsToLoad.push(fontInfo.webFont);
    }
  });
  
  if (webFontsToLoad.length === 0) {
    return Promise.resolve();
  }
  
  // Create a promise that resolves when fonts are loaded
  return new Promise((resolve) => {
    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?${webFontsToLoad.map(font => `family=${encodeURIComponent(font.split(',')[0])}`).join('&')}&display=swap`;
    link.rel = 'stylesheet';
    link.onload = () => resolve();
    link.onerror = () => resolve(); // Resolve even on error to not block the app
    document.head.appendChild(link);
    
    // Fallback timeout
    setTimeout(resolve, 2000);
  });
}

/**
 * Get optimal font size for different reading contexts
 * @param {string} context - Reading context ('print', 'ebook', 'web', 'large-print')
 * @param {string} pageSize - Page size for print context
 * @return {Object} - Recommended font settings
 */
export function getOptimalFontSize(context, pageSize = 'trade') {
  const recommendations = {
    print: {
      trade: { fontSize: 11, lineHeight: 1.3, note: 'Standard for 6x9 trade paperbacks' },
      'mass-market': { fontSize: 9, lineHeight: 1.2, note: 'Compact size requires smaller font' },
      hardcover: { fontSize: 12, lineHeight: 1.4, note: 'Larger format allows comfortable reading' },
      'large-print': { fontSize: 16, lineHeight: 1.5, note: 'Enhanced readability for vision assistance' }
    },
    ebook: {
      fontSize: 12,
      lineHeight: 1.4,
      note: 'Readers can adjust, but this is a good default'
    },
    web: {
      fontSize: 14,
      lineHeight: 1.5,
      note: 'Screen reading requires slightly larger fonts'
    },
    preview: {
      fontSize: 13,
      lineHeight: 1.4,
      note: 'Good for on-screen preview of print books'
    }
  };
  
  if (context === 'print' && recommendations.print[pageSize]) {
    return recommendations.print[pageSize];
  }
  
  return recommendations[context] || recommendations.print.trade;
}

export default {
  generateFontPreview,
  createFontComparison,
  calculateReadingComfort,
  preloadWebFonts,
  getOptimalFontSize
};