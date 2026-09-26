import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { createDraft } from '../../utils/draftOperations';
import { exportToPDF } from '../../utils/exportManager';
import ExportDialog from '../ExportDialog';

jest.mock('../../utils/exportManager', () => ({
  exportToPDF: jest.fn().mockResolvedValue(undefined),
  exportToManuscriptPDF: jest.fn().mockResolvedValue(undefined),
  exportToHTML: jest.fn().mockResolvedValue(undefined),
  exportToEPUB: jest.fn().mockResolvedValue(undefined)
}));
const baseBook = () => ({
  title: 'T',
  author: 'A',
  chapters: [
    {
      id: 'c1',
      title: 'C1',
      scenes: [{ id: 's1', title: 'S', content: 'one two three' }]
    }
  ],
  parts: [],
  frontMatter: [],
  backMatter: [],
  template: {},
  metadata: {}
});

const renderDialog = book =>
  render(<ExportDialog book={book} onClose={() => {}} onExport={() => {}} />);

describe('ExportDialog draft selection', () => {
  beforeEach(() => jest.clearAllMocks());

  it('hides the selector for a single-draft book', () => {
    renderDialog(baseBook());
    expect(screen.queryByLabelText(/draft/i)).toBeNull();
  });

  it('exports the chosen inactive draft', async () => {
    const { book, draftId } = createDraft(baseBook(), {
      name: 'Second',
      mode: 'empty'
    });
    renderDialog(book);
    fireEvent.change(screen.getByLabelText(/draft/i), {
      target: { value: draftId }
    });
    fireEvent.click(screen.getByRole('button', { name: /^export$/i }));
    await waitFor(() => expect(exportToPDF).toHaveBeenCalledTimes(1));
    const exported = exportToPDF.mock.calls[0][0];
    expect(exported.chapters).toBe(book.drafts[0].chapters);
    expect(exported.parts).toBe(book.drafts[0].parts);
  });

  it('defaults to the active draft', async () => {
    const { book } = createDraft(baseBook(), { name: 'Second', mode: 'empty' });
    renderDialog(book);
    fireEvent.click(screen.getByRole('button', { name: /^export$/i }));
    await waitFor(() => expect(exportToPDF).toHaveBeenCalledTimes(1));
    expect(exportToPDF.mock.calls[0][0].chapters).toBe(book.chapters);
  });

  it('summary counts follow the chosen draft', () => {
    const created = createDraft(baseBook(), { name: 'Second', mode: 'empty' });
    const { draftId } = created;
    const extra = {
      id: 'cx',
      title: 'X',
      scenes: [{ id: 'sx', title: 'S', content: 'a b c d e f g h' }]
    };
    const book = {
      ...created.book,
      drafts: created.book.drafts.map(d =>
        d.id === draftId
          ? { ...d, chapters: [extra, { ...extra, id: 'cy' }] }
          : d
      )
    };
    renderDialog(book);
    const summary = () => document.body;
    expect(summary()).toHaveTextContent(
      new RegExp(`Chapters:\\s*${book.chapters.length}(?!\\d)`)
    );
    fireEvent.change(screen.getByLabelText(/draft/i), {
      target: { value: draftId }
    });
    expect(summary()).toHaveTextContent(/Chapters:\s*2(?!\d)/);
    expect(summary()).toHaveTextContent(/Total Words:\s*16(?!\d)/);
  });
});
