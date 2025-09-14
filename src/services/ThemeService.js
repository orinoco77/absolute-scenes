/**
 * ThemeService - Manages application theming
 * Handles theme switching, persistence, and available theme definitions
 */

export class ThemeService {
  constructor() {
    this.themes = [
      {
        id: 'light',
        name: 'Light',
        description: 'Clean, bright interface'
      },
      {
        id: 'dark',
        name: 'Dark',
        description: 'Writer-friendly dark mode'
      }
    ];

    this.currentTheme = this.loadTheme();
    this.applyTheme(this.currentTheme);
  }

  /**
   * Load theme preference from localStorage
   * @returns {string} Theme ID
   */
  loadTheme() {
    try {
      const saved = localStorage.getItem('app-theme');
      if (saved && this.isValidTheme(saved)) {
        return saved;
      }
    } catch (error) {
      console.warn('Failed to load theme from localStorage:', error);
    }
    return 'light'; // Default theme
  }

  /**
   * Save theme preference to localStorage
   * @param {string} themeId
   */
  saveTheme(themeId) {
    try {
      localStorage.setItem('app-theme', themeId);
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error);
    }
  }

  /**
   * Apply theme by setting data-theme attribute
   * @param {string} themeId
   */
  applyTheme(themeId) {
    if (!this.isValidTheme(themeId)) {
      console.warn(`Invalid theme ID: ${themeId}`);
      return;
    }

    document.documentElement.setAttribute('data-theme', themeId);
    this.currentTheme = themeId;
  }

  /**
   * Set new theme (apply and save)
   * @param {string} themeId
   */
  setTheme(themeId) {
    this.applyTheme(themeId);
    this.saveTheme(themeId);
  }

  /**
   * Get current active theme ID
   * @returns {string}
   */
  getCurrentTheme() {
    return this.currentTheme;
  }

  /**
   * Get all available themes
   * @returns {Array<{id: string, name: string, description: string}>}
   */
  getAvailableThemes() {
    return this.themes;
  }

  /**
   * Check if theme ID is valid
   * @param {string} themeId
   * @returns {boolean}
   */
  isValidTheme(themeId) {
    return this.themes.some(theme => theme.id === themeId);
  }

  /**
   * Get theme by ID
   * @param {string} themeId
   * @returns {object|null}
   */
  getTheme(themeId) {
    return this.themes.find(theme => theme.id === themeId) || null;
  }

  /**
   * Detect system dark mode preference
   * @returns {boolean}
   */
  prefersColorSchemeDark() {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    );
  }

  /**
   * Auto-apply dark theme based on system preference
   * Only applies if no theme has been manually selected
   */
  applySystemTheme() {
    const hasManualTheme = localStorage.getItem('app-theme');
    if (!hasManualTheme && this.prefersColorSchemeDark()) {
      this.setTheme('dark');
    }
  }
}
