import { exportToHTML } from '../htmlExporter';

const template = {
  fontFamily: 'Times New Roman',
  fontSize: 12,
  lineHeight: 1.6,
  paragraphStyle: 'indented',
  textAlign: 'justified',
  writingType: 'prose',
  chapterHeader: { fontSize: 18, fontWeight: 'bold', alignment: 'center' }
};

describe('exportToHTML formatting', () => {
  let invoke;

  beforeEach(() => {
    invoke = jest.fn().mockResolvedValue({ success: true, filePath: 'x.html' });
    window.require = () => ({ ipcRenderer: { invoke, send: jest.fn() } });
  });

  afterEach(() => {
    delete window.require;
  });

  it('renders ***text*** as bold italic', async () => {
    const book = {
      title: 'T',
      author: 'A',
      chapters: [
        {
          id: 'c',
          title: 'C',
          scenes: [{ id: 's', title: 'S', content: 'A ***test*** here.' }]
        }
      ]
    };

    await exportToHTML(book, { template });

    const html = invoke.mock.calls[0][1];
    expect(html).toContain('<strong><em>test</em></strong>');
    expect(html).not.toMatch(/\*test/);
  });
});
