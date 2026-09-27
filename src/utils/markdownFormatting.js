// Toggle Markdown bold ('**') or italic ('*') around a textarea selection,
// the way Ctrl/Cmd+B and Ctrl/Cmd+I work in a word processor.
//
// Stars around the selection are read as: 1 = italic, 2 = bold,
// 3 = bold italic. Bold is on when there are 2 or 3; italic when there are
// 1 or 3. Toggling on adds the marker; toggling off removes one marker's
// worth from each side. Markers just outside the selection are checked
// first, then markers at the edges of the selection itself.

const countStars = (text, fromEnd) => {
  let n = 0;
  if (fromEnd) {
    for (let i = text.length - 1; i >= 0 && text[i] === '*'; i--) n++;
  } else {
    for (let i = 0; i < text.length && text[i] === '*'; i++) n++;
  }
  return n;
};

const isOn = (stars, marker) =>
  marker === '**' ? stars === 2 || stars === 3 : stars === 1 || stars === 3;

export const toggleMarkdownWrap = (value, start, end, marker) => {
  const before = value.slice(0, start);
  const selected = value.slice(start, end);
  const after = value.slice(end);
  const len = marker.length;

  // Markers just outside the selection: **[word]**
  const outside = Math.min(countStars(before, true), countStars(after, false));
  if (isOn(outside, marker)) {
    return {
      value: before.slice(0, -len) + selected + after.slice(len),
      selectionStart: start - len,
      selectionEnd: end - len
    };
  }

  // Markers inside the edges of the selection: [**word**]
  const inside = Math.min(
    countStars(selected, false),
    countStars(selected, true)
  );
  if (outside === 0 && selected.length > 2 * inside && isOn(inside, marker)) {
    const inner = selected.slice(len, -len);
    return {
      value: before + inner + after,
      selectionStart: start,
      selectionEnd: start + inner.length
    };
  }

  return {
    value: before + marker + selected + marker + after,
    selectionStart: start + len,
    selectionEnd: end + len
  };
};
