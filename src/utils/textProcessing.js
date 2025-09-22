// Text processing utilities for export functionality

/**
 * Converts double dashes (--) to em-dashes (—) in text
 * @param {string} text - The text to process
 * @returns {string} - Text with double dashes converted to em-dashes
 */
export function convertDoubleDashesToEmDashes(text) {
  if (!text || typeof text !== 'string') {
    return text || '';
  }

  // Replace all instances of double dashes with em-dashes
  return text.replace(/--/g, '—');
}

/**
 * Processes text content for export, applying all necessary transformations
 * @param {string} text - The text to process
 * @param {Object} options - Processing options
 * @returns {string} - Processed text
 */
export function processTextForExport(text, options = {}) {
  if (!text || typeof text !== 'string') {
    return text || '';
  }

  let processedText = text;

  // Apply em-dash conversion by default (can be disabled with options.skipEmDashes)
  if (!options.skipEmDashes) {
    processedText = convertDoubleDashesToEmDashes(processedText);
  }

  return processedText;
}
