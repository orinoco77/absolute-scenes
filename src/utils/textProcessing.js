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
 * Splits text into runs of plain, bold, italic and bold italic text from
 * Markdown emphasis (*italic*, **bold**, ***both***), nested in any order.
 *
 * Works like Markdown's delimiter stack: each run of asterisks first closes
 * the most recently opened markers (so the "***" in "**bold *italic***"
 * closes the italic, then the bold), then opens new ones. Asterisks next to
 * whitespace can't open or close, and unmatched markers stay as literal
 * asterisks.
 * @param {string} text - One line of text
 * @returns {Array<{text: string, bold: boolean, italic: boolean}>}
 */
export function parseInlineEmphasis(text) {
  if (!text) return [];

  // Tokens: { text } | { close: 'bold'|'italic' } | an opener
  // { size, bold, italic }, where bold/italic record which parts of it were
  // matched. A "***" opener stays whole until a closer decides which part
  // it closes; unmatched parts become literal asterisks.
  const tokens = [];
  const openers = [];
  const starRuns = /\*+/g;
  let last = 0;
  let match;

  while ((match = starRuns.exec(text)) !== null) {
    if (match.index > last)
      tokens.push({ text: text.slice(last, match.index) });
    let count = match[0].length;
    const before = text[match.index - 1];
    const after = text[match.index + count];
    const canClose = before !== undefined && !/\s/.test(before);
    const canOpen = after !== undefined && !/\s/.test(after);

    if (canClose) {
      while (count > 0 && openers.length > 0) {
        const top = openers[openers.length - 1];
        const hasBold = top.remaining >= 2;
        const hasItalic = top.remaining % 2 === 1;
        let closing;
        if (count >= 3 && hasBold && hasItalic) closing = ['italic', 'bold'];
        else if (count >= 2 && hasBold) closing = ['bold'];
        else if (hasItalic) closing = ['italic'];
        else break; // e.g. "*" can't close a bold-only opener
        for (const marker of closing) {
          const size = marker === 'bold' ? 2 : 1;
          top.token[marker] = true;
          tokens.push({ close: marker });
          top.remaining -= size;
          count -= size;
        }
        if (top.remaining === 0) openers.pop();
      }
    }

    if (count > 0 && canOpen) {
      if (count > 3) tokens.push({ text: '*'.repeat(count - 3) });
      const size = Math.min(count, 3);
      const token = { size, bold: false, italic: false };
      tokens.push(token);
      openers.push({ remaining: size, token });
    } else if (count > 0) {
      tokens.push({ text: '*'.repeat(count) });
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) tokens.push({ text: text.slice(last) });

  const runs = [];
  let bold = 0;
  let italic = 0;
  const addText = value => {
    const prev = runs[runs.length - 1];
    const style = { bold: bold > 0, italic: italic > 0 };
    if (prev && prev.bold === style.bold && prev.italic === style.italic) {
      prev.text += value;
    } else {
      runs.push({ text: value, ...style });
    }
  };

  tokens.forEach(token => {
    if (token.text !== undefined) {
      addText(token.text);
    } else if (token.close) {
      if (token.close === 'bold') bold -= 1;
      else italic -= 1;
    } else {
      const unmatched =
        token.size - (token.bold ? 2 : 0) - (token.italic ? 1 : 0);
      if (unmatched > 0) addText('*'.repeat(unmatched));
      if (token.bold) bold += 1;
      if (token.italic) italic += 1;
    }
  });

  return runs;
}

/**
 * Converts inline Markdown emphasis to HTML <strong>/<em> tags, keeping the
 * tags properly nested (<strong> always outside <em>).
 * @param {string} text - Text (already HTML-safe) to convert, one line
 * @returns {string} - Text with <strong>/<em> tags
 */
export function inlineMarkdownToHTML(text) {
  if (!text || typeof text !== 'string') {
    return text || '';
  }

  let html = '';
  let boldOpen = false;
  let italicOpen = false;

  parseInlineEmphasis(text).forEach(run => {
    // Close <em> if italic ends, or if <strong> must open or close around it
    if (italicOpen && (!run.italic || run.bold !== boldOpen)) {
      html += '</em>';
      italicOpen = false;
    }
    if (boldOpen && !run.bold) {
      html += '</strong>';
      boldOpen = false;
    }
    if (run.bold && !boldOpen) {
      html += '<strong>';
      boldOpen = true;
    }
    if (run.italic && !italicOpen) {
      html += '<em>';
      italicOpen = true;
    }
    html += run.text;
  });

  if (italicOpen) html += '</em>';
  if (boldOpen) html += '</strong>';
  return html;
}
