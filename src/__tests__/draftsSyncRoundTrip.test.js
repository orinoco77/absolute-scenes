import { createDraft, createRevision } from '@absolute-scenes/book-model';
import { projectBook, reassembleBook } from '@absolute-scenes/git-sync';

test('drafts and revisions survive the git-sync projection round trip', () => {
  let book = {
    title: 'T',
    chapters: [
      {
        id: 'c',
        title: 'C',
        scenes: [{ id: 's', title: 'S', content: 'hello' }]
      }
    ],
    parts: [],
    illustrations: [],
    metadata: { created: '2026-01-01T00:00:00.000Z' }
  };
  book = createDraft(book, { name: 'Two', mode: 'copy' });
  book.chapters = [
    {
      ...book.chapters[0],
      scenes: [
        createRevision(book.chapters[0].scenes[0], {
          label: 'Alt',
          mode: 'blank'
        })
      ]
    }
  ];

  const files = projectBook(book);
  expect(files.get('book.json').content).not.toMatch(/hello/);

  const back = reassembleBook(files);
  expect(back.chapters).toEqual(book.chapters);
  expect(back.drafts).toEqual(book.drafts);
});
