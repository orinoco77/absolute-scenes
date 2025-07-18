import React, { useState } from 'react';
import { exportToPDF, exportToHTML } from '../utils/exportManager';

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
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <div className="modal-content">
          <div className="form-group">
            <label>Export Format</label>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
            >
              <option value="pdf">PDF (Print Ready)</option>
              <option value="html">HTML (Web Preview)</option>
            </select>
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={includeSceneBreaks}
                onChange={(e) => setIncludeSceneBreaks(e.target.checked)}
              />
              Include scene breaks
            </label>
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={includeSceneTitles}
                onChange={(e) => setIncludeSceneTitles(e.target.checked)}
              />
              Include scene titles
            </label>
          </div>

          <div className="book-preview">
            <h3>Book Preview</h3>
            <p><strong>Title:</strong> {book.title}</p>
            <p><strong>Author:</strong> {book.author}</p>
            <p><strong>Page Size:</strong> {(() => {
              const pageDimensions = {
                'letter': 'US Letter (8.5" × 11")',
                'a4': 'A4 (8.27" × 11.69")',
                'digest': 'Digest (5.5" × 8.5")',
                'trade': 'Trade Paperback (6" × 9")',
                'mass-market': 'Mass Market (4.25" × 6.87")',
                'hardcover': 'Hardcover (6.14" × 9.21")',
                'large-print': 'Large Print (7" × 10")'
              };
              return pageDimensions[book.template.pageSize || 'letter'];
            })()}</p>
            <p><strong>Text Alignment:</strong> {book.template.textAlign === 'left' ? 'Left Aligned' : 'Justified (Professional)'}</p>
            <p><strong>Paragraph Style:</strong> {book.template.paragraphStyle === 'indented' ? 'Indented (Traditional)' : 'Line Separated (Modern)'}</p>
            <p><strong>Chapters:</strong> {book.chapters.length}</p>
            <p><strong>Scenes:</strong> {
              book.chapters.reduce((total, chapter) => total + chapter.scenes.length, 0)
            }</p>
            <p><strong>Total Words:</strong> {
              book.chapters.reduce((total, chapter) => 
                total + chapter.scenes.reduce((chapterTotal, scene) => 
                  chapterTotal + scene.content.split(/\s+/).filter(word => word.length > 0).length, 0
                ), 0
              )
            }</p>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleExport} className="btn-primary">Export</button>
        </div>
      </div>
    </div>
  );
}

export default ExportDialog;