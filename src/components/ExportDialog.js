import { useState } from 'react';
import {
  exportToPDF,
  exportToHTML,
  exportToEPUB
} from '../utils/exportManager';

function ExportDialog({ book, onClose, onExport }) {
  const [exportFormat, setExportFormat] = useState('pdf');
  const [includeSceneBreaks, setIncludeSceneBreaks] = useState(true);
  const [includeSceneTitles, setIncludeSceneTitles] = useState(false);

  const handleExport = async () => {
    const options = {
      includeSceneBreaks,
      includeSceneTitles,
      template: book.template
    };

    try {
      switch (exportFormat) {
        case 'pdf':
          await exportToPDF(book, options);
          break;
        case 'html':
          await exportToHTML(book, options);
          break;
        case 'epub':
          await exportToEPUB(book, options);
          break;
        default:
          break;
      }
      onExport(exportFormat);
      onClose();
    } catch (error) {
      alert('Export failed: ' + error.message);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Export Book</h2>
          <button onClick={onClose} className="close-btn">
            ×
          </button>
        </div>

        <div className="modal-content">
          <div className="form-group">
            <label>Export Format</label>
            <select
              value={exportFormat}
              onChange={e => setExportFormat(e.target.value)}
            >
              <option value="pdf">PDF (Print Ready)</option>
              <option value="html">HTML (Web Preview)</option>
              <option value="epub">EPUB (Ebook)</option>
            </select>
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={includeSceneBreaks}
                onChange={e => setIncludeSceneBreaks(e.target.checked)}
              />
              Include scene breaks
            </label>
          </div>

          {exportFormat === 'epub' && (
            <div className="form-group">
              <div
                style={{
                  padding: '0.75rem',
                  backgroundColor: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: '0.25rem',
                  fontSize: '0.9em',
                  color: '#0369a1'
                }}
              >
                <strong>📱 Ebook Format Notes:</strong>
                <ul style={{ margin: '0.5rem 0 0 1.5rem', padding: 0 }}>
                  <li>
                    No page breaks or mirror margins (content flows
                    continuously)
                  </li>
                  <li>Chapter breaks use spacing instead of new pages</li>
                  <li>Readers can adjust font size and typeface</li>
                  <li>Optimized for various screen sizes</li>
                  <li>
                    EPUB works on most ebook readers (including newer Kindles)
                  </li>
                </ul>
                <p
                  style={{
                    margin: '0.5rem 0 0 0',
                    fontSize: '0.8em',
                    fontStyle: 'italic'
                  }}
                >
                  💡 For older Kindles that need MOBI format, you can convert
                  this EPUB using free tools like Calibre.
                </p>
              </div>
            </div>
          )}

          {exportFormat !== 'epub' && (
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={includeSceneTitles}
                  onChange={e => setIncludeSceneTitles(e.target.checked)}
                />
                Include scene titles
              </label>
            </div>
          )}

          <div className="book-preview">
            <h3>Book Preview</h3>
            <p>
              <strong>Title:</strong> {book.title}
            </p>
            <p>
              <strong>Author:</strong> {book.author}
            </p>
            {book.parts && book.parts.length > 0 && (
              <p>
                <strong>Parts:</strong> {book.parts.length}
              </p>
            )}
            <p>
              <strong>Page Size:</strong>{' '}
              {(() => {
                if (exportFormat === 'epub') {
                  return 'Responsive (adapts to any device)';
                }
                const pageDimensions = {
                  letter: 'US Letter (8.5" × 11")',
                  a4: 'A4 (8.27" × 11.69")',
                  digest: 'Digest (5.5" × 8.5")',
                  trade: 'Trade Paperback (6" × 9")',
                  'mass-market': 'Mass Market (4.25" × 6.87")',
                  hardcover: 'Hardcover (6.14" × 9.21")',
                  'large-print': 'Large Print (7" × 10")'
                };
                return pageDimensions[book.template.pageSize || 'letter'];
              })()}
            </p>
            <p>
              <strong>Text Alignment:</strong>{' '}
              {exportFormat === 'epub'
                ? book.template.textAlign === 'left'
                  ? 'Left Aligned (reader adjustable)'
                  : 'Justified (reader adjustable)'
                : book.template.textAlign === 'left'
                  ? 'Left Aligned'
                  : 'Justified (Professional)'}
            </p>
            <p>
              <strong>Paragraph Style:</strong>{' '}
              {book.template.paragraphStyle === 'indented'
                ? 'Indented (Traditional)'
                : 'Line Separated (Modern)'}
            </p>
            <p>
              <strong>Chapters:</strong> {book.chapters.length}
            </p>
            <p>
              <strong>Scenes:</strong>{' '}
              {book.chapters.reduce(
                (total, chapter) => total + chapter.scenes.length,
                0
              )}
            </p>
            <p>
              <strong>Total Words:</strong>{' '}
              {book.chapters.reduce(
                (total, chapter) =>
                  total +
                  chapter.scenes.reduce(
                    (chapterTotal, scene) =>
                      chapterTotal +
                      (scene.content || '')
                        .split(/\s+/)
                        .filter(word => word.length > 0).length,
                    0
                  ),
                0
              )}
            </p>
            {book.parts && book.parts.length > 0 && (
              <div
                style={{
                  marginTop: '1em',
                  padding: '0.5em',
                  backgroundColor: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: '0.25rem'
                }}
              >
                <strong>📚 Parts Structure:</strong>
                <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                  {book.parts.map((part, __index) => {
                    const partChapters = part.chapterIds
                      .map(chapterId =>
                        book.chapters.find(ch => ch.id === chapterId)
                      )
                      .filter(Boolean);
                    const partWords = partChapters.reduce(
                      (total, ch) =>
                        total +
                        ch.scenes.reduce(
                          (chTotal, scene) =>
                            chTotal +
                            (scene.content || '')
                              .split(/\s+/)
                              .filter(word => word.length > 0).length,
                          0
                        ),
                      0
                    );
                    return (
                      <li key={part.id} style={{ marginBottom: '0.25rem' }}>
                        <strong>{part.title}</strong> - {partChapters.length}{' '}
                        chapters, {partWords.toLocaleString()} words
                      </li>
                    );
                  })}
                </ul>
                {(() => {
                  const assignedChapterIds = new Set();
                  book.parts.forEach(part => {
                    part.chapterIds.forEach(chapterId => {
                      assignedChapterIds.add(chapterId);
                    });
                  });
                  const unassignedChapters = book.chapters.filter(
                    ch => !assignedChapterIds.has(ch.id)
                  );

                  if (unassignedChapters.length > 0) {
                    const unassignedWords = unassignedChapters.reduce(
                      (total, ch) =>
                        total +
                        ch.scenes.reduce(
                          (chTotal, scene) =>
                            chTotal +
                            (scene.content || '')
                              .split(/\s+/)
                              .filter(word => word.length > 0).length,
                          0
                        ),
                      0
                    );
                    return (
                      <p
                        style={{
                          margin: '0.5rem 0 0 0',
                          fontSize: '0.9em',
                          color: '#ef6c00'
                        }}
                      >
                        📄 {unassignedChapters.length} unassigned chapters (
                        {unassignedWords.toLocaleString()} words)
                      </p>
                    );
                  }
                  return null;
                })()}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleExport} className="btn-primary">
            Export
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExportDialog;
