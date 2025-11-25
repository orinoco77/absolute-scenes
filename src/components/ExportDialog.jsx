import { useState } from 'react';
import {
  exportToPDF,
  exportToManuscriptPDF,
  exportToHTML,
  exportToEPUB
} from '../utils/exportManager';

function ExportDialog({ book, onClose, onExport, onOperationUpdate }) {
  const [exportFormat, setExportFormat] = useState('pdf');
  const [includeSceneBreaks, setIncludeSceneBreaks] = useState(true);
  const [includeSceneTitles, setIncludeSceneTitles] = useState(false);
  const [manuscriptPageSize, setManuscriptPageSize] = useState('a4'); // Default to A4
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportMessage, setExportMessage] = useState('');

  const handleExport = async () => {
    const options = {
      includeSceneBreaks,
      includeSceneTitles,
      template: book.template,
      manuscriptPageSize: manuscriptPageSize,
      onProgress: (percentage, message) => {
        setExportProgress(percentage);
        setExportMessage(message);
        onOperationUpdate?.(message);
      }
    };

    setIsExporting(true);
    onOperationUpdate?.(`Exporting ${exportFormat.toUpperCase()}...`);
    try {
      switch (exportFormat) {
        case 'pdf':
          await exportToPDF(book, options);
          break;
        case 'manuscript':
          await exportToManuscriptPDF(book, options);
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
    } finally {
      setIsExporting(false);
      setExportProgress(0);
      setExportMessage('');
      onOperationUpdate?.(null);
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
              <option value="manuscript">PDF (Manuscript)</option>
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

          {exportFormat === 'manuscript' && (
            <div className="form-group">
              <label>Manuscript Page Size</label>
              <select
                value={manuscriptPageSize}
                onChange={e => setManuscriptPageSize(e.target.value)}
              >
                <option value="a4">
                  A4 (210 × 297mm) - International Standard
                </option>
                <option value="letter">
                  US Letter (8.5" × 11") - US Standard
                </option>
              </select>
            </div>
          )}

          {exportFormat === 'manuscript' && (
            <div className="form-group">
              <div
                style={{
                  padding: '0.75rem',
                  backgroundColor: 'var(--color-info-bg)',
                  border: '1px solid var(--color-info-border)',
                  borderRadius: '0.25rem',
                  fontSize: '0.9em',
                  color: 'var(--color-primary)'
                }}
              >
                <strong>📝 Manuscript Format Notes:</strong>
                <ul style={{ margin: '0.5rem 0 0 1.5rem', padding: 0 }}>
                  <li>
                    {manuscriptPageSize === 'a4'
                      ? 'A4 size (210 × 297mm) with 25mm margins'
                      : 'US Letter size (8.5" × 11") with 1" margins'}
                  </li>
                  <li>Times New Roman 12pt font, double-spaced</li>
                  <li>Professional manuscript title page with contact info</li>
                  <li>Left-aligned text (not justified)</li>
                  <li>First-line paragraph indentation</li>
                  <li>Running headers with author/title</li>
                  <li>Page numbers on all pages</li>
                </ul>
                <p
                  style={{
                    margin: '0.5rem 0 0 0',
                    fontSize: '0.8em',
                    fontStyle: 'italic'
                  }}
                >
                  💡 This format follows industry standards for manuscript
                  submission to publishers and agents worldwide.
                </p>
              </div>
            </div>
          )}

          {exportFormat === 'epub' && (
            <div className="form-group">
              <div
                style={{
                  padding: '0.75rem',
                  backgroundColor: 'var(--color-info-bg)',
                  border: '1px solid var(--color-info-border)',
                  borderRadius: '0.25rem',
                  fontSize: '0.9em',
                  color: 'var(--color-primary)'
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

          {exportFormat !== 'epub' && exportFormat !== 'manuscript' && (
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
                if (exportFormat === 'manuscript') {
                  return manuscriptPageSize === 'a4'
                    ? 'A4 (210 × 297mm) - Manuscript Standard'
                    : 'US Letter (8.5" × 11") - Manuscript Standard';
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
                : exportFormat === 'manuscript'
                  ? 'Left Aligned (Manuscript Standard)'
                  : book.template.textAlign === 'left'
                    ? 'Left Aligned'
                    : 'Justified (Professional)'}
            </p>
            <p>
              <strong>Paragraph Style:</strong>{' '}
              {exportFormat === 'manuscript'
                ? 'Indented (Manuscript Standard)'
                : book.template.paragraphStyle === 'indented'
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
                id="export-parts-structure"
                style={{
                  marginTop: '1em',
                  padding: '0.5em',
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
                          color: 'var(--color-warning)'
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

        {isExporting && (
          <div
            style={{
              padding: '1rem',
              borderTop: '1px solid var(--color-border)',
              background: 'var(--color-surface-elevated)'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.5rem',
                fontSize: '0.9em'
              }}
            >
              <span>{exportMessage}</span>
              <span style={{ fontWeight: 'bold' }}>{exportProgress}%</span>
            </div>
            <div
              style={{
                width: '100%',
                height: '8px',
                background: 'var(--color-background)',
                borderRadius: '4px',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  width: `${exportProgress}%`,
                  height: '100%',
                  background: 'var(--color-primary)',
                  transition: 'width 0.3s ease',
                  borderRadius: '4px'
                }}
              />
            </div>
          </div>
        )}

        <div className="modal-footer">
          <button
            onClick={onClose}
            className="btn-secondary"
            disabled={isExporting}
            style={{ opacity: isExporting ? 0.5 : 1 }}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="btn-primary"
            disabled={isExporting}
            style={{ opacity: isExporting ? 0.5 : 1 }}
          >
            Export
          </button>
        </div>
        {isExporting && (
          <div className="loading-overlay">
            <div className="loading-content">
              <div className="loading-spinner large" />
              <span>Exporting {exportFormat.toUpperCase()}...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ExportDialog;
