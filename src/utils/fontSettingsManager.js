/**
 * Font Settings Manager
 * Handles loading, applying, and managing font preferences for text editors
 */

// Default font options with proper fallbacks
export const FONT_OPTIONS = [
  {
    id: 'system',
    name: 'System Default',
    category: 'system',
    cssValue: 'system-ui, -apple-system, "Segoe UI", sans-serif',
    description: "Uses your operating system's default interface font"
  },
  // Monospace fonts
  {
    id: 'monaco',
    name: 'Monaco',
    category: 'monospace',
    cssValue: '"Monaco", "Menlo", "Ubuntu Mono", "Consolas", monospace',
    description: 'Clean monospace font, excellent for code and precise editing'
  },
  {
    id: 'consolas',
    name: 'Consolas',
    category: 'monospace',
    cssValue: '"Consolas", "Monaco", "Courier New", monospace',
    description: "Microsoft's monospace font, great for long writing sessions"
  },
  {
    id: 'source-code-pro',
    name: 'Source Code Pro',
    category: 'monospace',
    cssValue: '"Source Code Pro", "Monaco", "Consolas", monospace',
    description: "Adobe's open-source monospace font with excellent readability"
  },
  // Sans-serif fonts
  {
    id: 'helvetica',
    name: 'Helvetica',
    category: 'sans-serif',
    cssValue: 'Helvetica, Arial, sans-serif',
    description: 'Classic Swiss sans-serif, clean and professional'
  },
  {
    id: 'open-sans',
    name: 'Open Sans',
    category: 'sans-serif',
    cssValue: '"Open Sans", "Segoe UI", Arial, sans-serif',
    description: 'Modern, friendly sans-serif with excellent legibility'
  },
  {
    id: 'lato',
    name: 'Lato',
    category: 'sans-serif',
    cssValue: '"Lato", "Helvetica Neue", Arial, sans-serif',
    description: 'Contemporary sans-serif designed for clarity'
  },
  // Serif fonts
  {
    id: 'garamond',
    name: 'EB Garamond',
    category: 'serif',
    cssValue: '"EB Garamond", Garamond, "Times New Roman", serif',
    description: 'Classic book font, excellent for long-form writing'
  },
  {
    id: 'baskerville',
    name: 'Libre Baskerville',
    category: 'serif',
    cssValue: '"Libre Baskerville", Baskerville, "Times New Roman", serif',
    description:
      'Elegant serif with dramatic character, great for literary work'
  },
  {
    id: 'georgia',
    name: 'Georgia',
    category: 'serif',
    cssValue: 'Georgia, "Times New Roman", serif',
    description: 'Web-optimized serif font designed for screen reading'
  },
  {
    id: 'crimson-text',
    name: 'Crimson Text',
    category: 'serif',
    cssValue: '"Crimson Text", "Times New Roman", serif',
    description: 'Contemporary serif designed for both print and digital'
  }
];

/**
 * Get current font setting from localStorage
 */
export function getCurrentFontSetting() {
  return localStorage.getItem('editorFont') || 'system';
}

/**
 * Get font option by ID
 */
export function getFontOption(fontId) {
  return FONT_OPTIONS.find(font => font.id === fontId);
}

/**
 * Get CSS font family for a given font ID
 */
export function getFontCssValue(fontId) {
  const fontOption = getFontOption(fontId);
  return fontOption ? fontOption.cssValue : FONT_OPTIONS[0].cssValue;
}

/**
 * Apply font setting to the document
 */
export function applyFontSetting(fontId) {
  const fontOption = getFontOption(fontId);
  if (fontOption) {
    // Set CSS custom property for editor font
    document.documentElement.style.setProperty(
      '--editor-font-family',
      fontOption.cssValue
    );

    // Save to localStorage
    localStorage.setItem('editorFont', fontId);

    // Trigger custom event for components that need to react
    window.dispatchEvent(
      new CustomEvent('fontSettingChanged', {
        detail: { fontId, fontOption }
      })
    );

    return true;
  }
  return false;
}

/**
 * Initialize font system on app startup
 */
export function initializeFontSettings() {
  const currentFontId = getCurrentFontSetting();
  const fontOption = getFontOption(currentFontId);

  if (fontOption) {
    // Apply the current font setting
    document.documentElement.style.setProperty(
      '--editor-font-family',
      fontOption.cssValue
    );

    // Also set a default fallback
    document.documentElement.style.setProperty(
      '--editor-font-fallback',
      'system-ui, -apple-system, "Segoe UI", sans-serif'
    );
  }
}

/**
 * Get font recommendations based on writing type
 */
export function getFontRecommendations(writingType = 'general') {
  const recommendations = {
    fiction: ['garamond', 'baskerville', 'georgia'],
    'non-fiction': ['georgia', 'crimson-text', 'garamond'],
    technical: ['monaco', 'consolas', 'source-code-pro'],
    modern: ['open-sans', 'lato', 'helvetica'],
    general: ['system', 'georgia', 'monaco']
  };

  return recommendations[writingType] || recommendations.general;
}
