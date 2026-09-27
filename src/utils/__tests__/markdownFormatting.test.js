import { toggleMarkdownWrap } from '../markdownFormatting';

// [value, selectionStart, selectionEnd] -> { value, selectionStart, selectionEnd }
const apply = (text, marker) => {
  // '[' and ']' mark the selection in these fixtures
  const start = text.indexOf('[');
  const end = text.indexOf(']') - 1;
  const plain = text.replace('[', '').replace(']', '');
  const r = toggleMarkdownWrap(plain, start, end, marker);
  return (
    r.value.slice(0, r.selectionStart) +
    '[' +
    r.value.slice(r.selectionStart, r.selectionEnd) +
    ']' +
    r.value.slice(r.selectionEnd)
  );
};

describe('toggleMarkdownWrap', () => {
  it('wraps the selection in bold and keeps it selected', () => {
    expect(apply('a [word] b', '**')).toBe('a **[word]** b');
  });

  it('wraps the selection in italic', () => {
    expect(apply('a [word] b', '*')).toBe('a *[word]* b');
  });

  it('inserts empty markers with the cursor between them when nothing is selected', () => {
    expect(apply('a [] b', '**')).toBe('a **[]** b');
    expect(apply('a [] b', '*')).toBe('a *[]* b');
  });

  it('removes bold when the selection is already bold', () => {
    expect(apply('a **[word]** b', '**')).toBe('a [word] b');
  });

  it('removes italic when the selection is already italic', () => {
    expect(apply('a *[word]* b', '*')).toBe('a [word] b');
  });

  it('adds italic to bold text', () => {
    expect(apply('a **[word]** b', '*')).toBe('a ***[word]*** b');
  });

  it('adds bold to italic text', () => {
    expect(apply('a *[word]* b', '**')).toBe('a ***[word]*** b');
  });

  it('removes only italic from bold italic text', () => {
    expect(apply('a ***[word]*** b', '*')).toBe('a **[word]** b');
  });

  it('removes only bold from bold italic text', () => {
    expect(apply('a ***[word]*** b', '**')).toBe('a *[word]* b');
  });

  it('removes markers that are inside the selection', () => {
    expect(apply('a [**word**] b', '**')).toBe('a [word] b');
    expect(apply('a [*word*] b', '*')).toBe('a [word] b');
  });

  it('works at the very start and end of the text', () => {
    expect(apply('[word]', '**')).toBe('**[word]**');
    expect(apply('**[word]**', '**')).toBe('[word]');
  });
});
