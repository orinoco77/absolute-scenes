import { inlineMarkdownToHTML } from '../textProcessing';

describe('inlineMarkdownToHTML', () => {
  it('renders bold', () => {
    expect(inlineMarkdownToHTML('a **word** b')).toBe(
      'a <strong>word</strong> b'
    );
  });

  it('renders italic', () => {
    expect(inlineMarkdownToHTML('a *word* b')).toBe('a <em>word</em> b');
  });

  it('renders bold italic from triple asterisks', () => {
    expect(inlineMarkdownToHTML('a ***test*** b')).toBe(
      'a <strong><em>test</em></strong> b'
    );
  });

  it('renders italic nested inside bold', () => {
    expect(inlineMarkdownToHTML('**bold *it* bold**')).toBe(
      '<strong>bold <em>it</em> bold</strong>'
    );
  });

  it('handles several styles on one line', () => {
    expect(inlineMarkdownToHTML('***x*** and **y** and *z*')).toBe(
      '<strong><em>x</em></strong> and <strong>y</strong> and <em>z</em>'
    );
  });

  it('leaves lone asterisks alone', () => {
    expect(inlineMarkdownToHTML('2 * 3 = 6')).toBe('2 * 3 = 6');
  });

  describe('nesting that ends or starts with three asterisks', () => {
    it('italic at the end of bold: **bold and *italic***', () => {
      expect(inlineMarkdownToHTML('**bold and *italic***')).toBe(
        '<strong>bold and <em>italic</em></strong>'
      );
    });

    it('italic at the start of bold: ***italic* and bold**', () => {
      expect(inlineMarkdownToHTML('***italic* and bold**')).toBe(
        '<strong><em>italic</em> and bold</strong>'
      );
    });

    it('bold at the end of italic: *italic and **bold***', () => {
      const html = inlineMarkdownToHTML('*italic and **bold***');
      expect(html).not.toContain('*');
      expect(html).toBe('<em>italic and </em><strong><em>bold</em></strong>');
    });

    it('bold at the start of italic: ***bold** and italic*', () => {
      const html = inlineMarkdownToHTML('***bold** and italic*');
      expect(html).not.toContain('*');
      expect(html).toBe('<strong><em>bold</em></strong><em> and italic</em>');
    });
  });

  it('leaves unmatched markers as plain asterisks', () => {
    expect(inlineMarkdownToHTML('**not closed')).toBe('**not closed');
    expect(inlineMarkdownToHTML('*not closed')).toBe('*not closed');
  });
});
