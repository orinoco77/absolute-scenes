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

/**
 * Converts inline Markdown emphasis to HTML: ***bold italic***, **bold**
 * and *italic*. Bold italic is matched first so its markers aren't split
 * between the bold and italic patterns. Markers must hug the text, so a
 * lone asterisk ("2 * 3") is left alone.
 * @param {string} text - Text (already HTML-safe) to convert
 * @returns {string} - Text with <strong>/<em> tags
 */
export function inlineMarkdownToHTML(text) {
  if (!text || typeof text !== 'string') {
    return text || '';
  }

  return text
    .replace(/\*\*\*(?=\S)(.+?)(?<=\S)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(?=\S)(.+?)(?<=\S)\*\*/g, '<strong>$1</strong>')
    .replace(/(?<!\*)\*(?=\S)([^*\n]+?)(?<=\S)\*(?!\*)/g, '<em>$1</em>');
}
