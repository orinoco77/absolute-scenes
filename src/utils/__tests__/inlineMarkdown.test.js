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
});
