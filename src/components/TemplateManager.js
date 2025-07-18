import React, { useState, useEffect } from 'react';
import { BOOK_FONTS, getFontRecommendations, getFontLicenseInfo } from '../utils/fontManager';
import FontPreview from './FontPreview';

function TemplateManager({ template, onTemplateUpdate, onClose }) {
  const [localTemplate, setLocalTemplate] = useState(template);
  const [fontRecommendations, setFontRecommendations] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState(template.genre || 'general');
  const [showFontPreview, setShowFontPreview] = useState(false);

  useEffect(() => {
    // Get font recommendations based on selected genre
    const recommendations = getFontRecommendations(selectedGenre);
    setFontRecommendations(recommendations);
  }, [selectedGenre]);

  const handleSave = () => {
    onTemplateUpdate({
      ...localTemplate,
      genre: selectedGenre
    });
    onClose();
  };

  const handleInputChange = (field, value) => {
    setLocalTemplate(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleChapterHeaderChange = (field, value) => {
    setLocalTemplate(prev => ({
      ...prev,
      chapterHeader: {
        ...prev.chapterHeader,
        [field]: value
      }
    }));
  };

  const handleMarginChange = (margin, value) => {
    setLocalTemplate(prev => ({
      ...prev,
      pageMargins: {
        ...prev.pageMargins,
        [margin]: parseFloat(value) || 0
      }
    }));
  };

  const handleMirrorMarginsChange = (enabled) => {
    setLocalTemplate(prev => ({
      ...prev,
      mirrorMargins: enabled
    }));
  };

  const handleRunningHeaderChange = (field, value) => {
    setLocalTemplate(prev => ({
      ...prev,
      runningHeaders: {
        ...prev.runningHeaders,
        [field]: value
      }
    }));
  };

  const handleFontChange = (fontFamily) => {
    handleInputChange('fontFamily', fontFamily);
  };

  // Group fonts by category and quality
  const fontsByCategory = {
    premium: [],
    high: [],
    standard: []
  };

  Object.keys(BOOK_FONTS).forEach(key => {
    const font = BOOK_FONTS[key];
    if (font.category === 'serif') { // Only show serif fonts for body text
      if (!fontsByCategory[font.quality]) {
        fontsByCategory[font.quality] = [];
      }
      fontsByCategory[font.quality].push({
        key,
        ...font
      });
    }
  });

  const getFontQualityLabel = (quality) => {
    switch (quality) {
      case 'premium': return 'Premium Book Fonts (Best Quality)';
      case 'high': return 'High-Quality Alternatives';
      case 'standard': return 'Standard System Fonts';
      default: return 'Other Fonts';
    }
  };

  const getFontStatusIcon = (font) => {
    const licenseInfo = getFontLicenseInfo(font.name);
    if (licenseInfo.requiresLicense) {
      return <span style={{color: '#ff6b35', fontSize: '12px'}}>⚠ License Required</span>;
    } else if (font.systemFont) {
      return <span style={{color: '#4caf50', fontSize: '12px'}}>✓ Available</span>;
    } else {
      return <span style={{color: '#2196f3', fontSize: '12px'}}>ⓦ Web Font</span>;
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Template Settings</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <div className="modal-content">
          <div className="form-section">
            <h3>Font Selection</h3>
            
            <div className="form-group">
              <label>Book Genre (for font recommendations)</label>
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                style={{marginBottom: '10px'}}
              >
                <option value="general">General Fiction</option>
                <option value="literary">Literary Fiction</option>
                <option value="romance">Romance</option>
                <option value="thriller">Thriller/Mystery</option>
                <option value="fantasy">Fantasy/Sci-Fi</option>
                <option value="non-fiction">Non-Fiction</option>
                <option value="academic">Academic</option>
                <option value="contemporary">Contemporary</option>
                <option value="historical">Historical Fiction</option>
                <option value="young-adult">Young Adult</option>
              </select>
            </div>

            <div className="form-group">
              <label>Font Family</label>
              
              {/* Recommended Fonts */}
              {fontRecommendations.length > 0 && (
                <div style={{marginBottom: '15px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px'}}>
                  <h4 style={{margin: '0 0 10px 0', color: '#2196f3'}}>📖 Recommended for {selectedGenre.replace('-', ' ')}:</h4>
                  <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px'}}>
                    {fontRecommendations.slice(0, 4).map(font => (
                      <button
                        key={font.key}
                        type="button"
                        onClick={() => handleFontChange(font.name)}
                        style={{
                          padding: '8px',
                          border: localTemplate.fontFamily === font.name ? '2px solid #2196f3' : '1px solid #ddd',
                          backgroundColor: localTemplate.fontFamily === font.name ? '#e3f2fd' : 'white',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontSize: '12px'
                        }}
                      >
                        <div style={{fontWeight: 'bold'}}>{font.name}</div>
                        <div style={{color: '#666', fontSize: '10px'}}>{font.characteristics}</div>
                        {getFontStatusIcon(font)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* All Fonts by Category */}
              <select
                value={localTemplate.fontFamily}
                onChange={(e) => handleFontChange(e.target.value)}
                style={{width: '100%', padding: '8px'}}
              >
                {Object.entries(fontsByCategory).map(([quality, fonts]) => (
                  fonts.length > 0 && (
                    <optgroup key={quality} label={getFontQualityLabel(quality)}>
                      {fonts.map(font => (
                        <option key={font.key} value={font.name}>
                          {font.name} - {font.characteristics}
                        </option>
                      ))}
                    </optgroup>
                  )
                ))}
                
                {/* Legacy fonts for backward compatibility */}
                <optgroup label="Sans-Serif Fonts (Headers Only)">
                  <option value="Arial">Arial</option>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Calibri">Calibri</option>
                  <option value="Gill Sans">Gill Sans</option>
                </optgroup>
                <optgroup label="Monospace Fonts (Special Use)">
                  <option value="Courier New">Courier New</option>
                  <option value="Monaco">Monaco</option>
                  <option value="Consolas">Consolas</option>
                </optgroup>
              </select>
              
              {/* Font Information */}
              {localTemplate.fontFamily && BOOK_FONTS[Object.keys(BOOK_FONTS).find(key => BOOK_FONTS[key].name === localTemplate.fontFamily)] && (
                <div style={{marginTop: '10px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '4px', fontSize: '12px'}}>
                  {(() => {
                    const fontKey = Object.keys(BOOK_FONTS).find(key => BOOK_FONTS[key].name === localTemplate.fontFamily);
                    const font = BOOK_FONTS[fontKey];
                    const licenseInfo = getFontLicenseInfo(font.name);
                    return (
                      <div>
                        <div><strong>Description:</strong> {font.description}</div>
                        <div><strong>Best for:</strong> {font.bestFor.join(', ')}</div>
                        <div><strong>License:</strong> {licenseInfo.note}</div>
                        {licenseInfo.requiresLicense && (
                          <div style={{color: '#ff6b35', fontWeight: 'bold', marginTop: '5px'}}>
                            ⚠ This font requires a commercial license for book publishing
                          </div>
                        )}
                      </div>
                    );
                  })()} 
                </div>
              )}
              
              <small>Serif fonts are traditional for book bodies and enhance readability in print</small>
              
              {/* Font Preview Toggle */}
              <div style={{marginTop: '15px'}}>
                <button 
                  type="button"
                  onClick={() => setShowFontPreview(!showFontPreview)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: showFontPreview ? '#2196f3' : '#f5f5f5',
                    color: showFontPreview ? 'white' : '#333',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  {showFontPreview ? '👁 Hide' : '👁 Preview'} Font
                </button>
              </div>
              
              {/* Font Preview */}
              {showFontPreview && (
                <div style={{marginTop: '15px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '4px'}}>
                  <FontPreview 
                    selectedFont={localTemplate.fontFamily}
                    fontSize={localTemplate.fontSize}
                    lineHeight={localTemplate.lineHeight}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>Font Size</label>
            <input
              type="number"
              value={localTemplate.fontSize}
              onChange={(e) => handleInputChange('fontSize', parseInt(e.target.value))}
              min="8"
              max="24"
            />
            <small>Recommended: 10-12pt for most books, 14pt+ for large print</small>
            <div style={{marginTop: '8px', padding: '8px', backgroundColor: '#e3f2fd', borderRadius: '4px', fontSize: '11px'}}>
              ✨ <strong>Smart Sizing:</strong> Headers, page numbers, and running headers automatically scale with body text size
            </div>
          </div>

          <div className="form-group">
            <label>Line Height</label>
            <input
              type="number"
              step="0.1"
              value={localTemplate.lineHeight}
              onChange={(e) => handleInputChange('lineHeight', parseFloat(e.target.value))}
              min="1"
              max="3"
            />
            <small>Recommended: 1.2-1.4 for comfortable reading</small>
          </div>

          <div className="form-group">
            <label>Paragraph Style</label>
            <select
              value={localTemplate.paragraphStyle}
              onChange={(e) => handleInputChange('paragraphStyle', e.target.value)}
            >
              <option value="indented">Indented (Traditional Books)</option>
              <option value="separated">Line Separated (Modern Style)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Page Size</label>
            <select
              value={localTemplate.pageSize || 'letter'}
              onChange={(e) => handleInputChange('pageSize', e.target.value)}
            >
              <option value="letter">US Letter (8.5" × 11")</option>
              <option value="a4">A4 (8.27" × 11.69")</option>
              <option value="digest">Digest (5.5" × 8.5")</option>
              <option value="trade">Trade Paperback (6" × 9") - Popular</option>
              <option value="mass-market">Mass Market (4.25" × 6.87")</option>
              <option value="hardcover">Hardcover (6.14" × 9.21")</option>
              <option value="large-print">Large Print (7" × 10")</option>
            </select>
            <small>Trade Paperback (6"×9") is the most popular size for modern books</small>
          </div>

          <div className="form-group">
            <label>Text Alignment</label>
            <select
              value={localTemplate.textAlign || 'justified'}
              onChange={(e) => handleInputChange('textAlign', e.target.value)}
            >
              <option value="justified">Justified (Professional Books)</option>
              <option value="left">Left Aligned (Casual/Modern)</option>
            </select>
            <small>Justified text creates straight edges on both sides like printed books</small>
          </div>

          <div className="form-section">
            <h3>Page Margins (inches)</h3>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={localTemplate.mirrorMargins || false}
                  onChange={(e) => handleMirrorMarginsChange(e.target.checked)}
                />
                Use mirror margins for book binding
              </label>
              <small>Different margins for odd/even pages to account for spine binding</small>
            </div>
            <div className="margin-inputs">
              <div className="form-group">
                <label>Top</label>
                <input
                  type="number"
                  step="0.25"
                  value={localTemplate.pageMargins.top}
                  onChange={(e) => handleMarginChange('top', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Bottom</label>
                <input
                  type="number"
                  step="0.25"
                  value={localTemplate.pageMargins.bottom}
                  onChange={(e) => handleMarginChange('bottom', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>{localTemplate.mirrorMargins ? 'Inside (Spine)' : 'Left'}</label>
                <input
                  type="number"
                  step="0.25"
                  value={localTemplate.pageMargins.inside || localTemplate.pageMargins.left || 1.25}
                  onChange={(e) => handleMarginChange(localTemplate.mirrorMargins ? 'inside' : 'left', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>{localTemplate.mirrorMargins ? 'Outside (Edge)' : 'Right'}</label>
                <input
                  type="number"
                  step="0.25"
                  value={localTemplate.pageMargins.outside || localTemplate.pageMargins.right || 1}
                  onChange={(e) => handleMarginChange(localTemplate.mirrorMargins ? 'outside' : 'right', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Chapter Headers</h3>
            
            <div className="form-group">
              <label>Chapter Header Style</label>
              <select
                value={localTemplate.chapterHeader.style}
                onChange={(e) => handleChapterHeaderChange('style', e.target.value)}
              >
                <option value="numbered">Chapter 1, Chapter 2, etc.</option>
                <option value="titled">Chapter Title Only</option>
                <option value="both">Chapter 1: Title</option>
                <option value="custom">Custom Format</option>
              </select>
            </div>

            {localTemplate.chapterHeader.style === 'custom' && (
              <div className="form-group">
                <label>Custom Format</label>
                <input
                  type="text"
                  value={localTemplate.chapterHeader.format}
                  onChange={(e) => handleChapterHeaderChange('format', e.target.value)}
                  placeholder="e.g., 'Chapter {number} - {title}'"
                />
                <small>Use {"{number}"} for chapter number and {"{title}"} for chapter title</small>
              </div>
            )}

            <div className="form-group">
              <label>Chapter Header Font Size</label>
              <input
                type="number"
                value={localTemplate.chapterHeader.fontSize}
                onChange={(e) => handleChapterHeaderChange('fontSize', parseInt(e.target.value))}
                min="12"
                max="36"
              />
              <small>This is separate from the auto-scaling running headers and markdown headings</small>
            </div>

            <div className="form-group">
              <label>Chapter Header Weight</label>
              <select
                value={localTemplate.chapterHeader.fontWeight}
                onChange={(e) => handleChapterHeaderChange('fontWeight', e.target.value)}
              >
                <option value="normal">Normal</option>
                <option value="bold">Bold</option>
              </select>
            </div>

            <div className="form-group">
              <label>Chapter Header Alignment</label>
              <select
                value={localTemplate.chapterHeader.alignment}
                onChange={(e) => handleChapterHeaderChange('alignment', e.target.value)}
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={localTemplate.chapterHeader.pageBreak}
                  onChange={(e) => handleChapterHeaderChange('pageBreak', e.target.checked)}
                />
                Start each chapter on a new page
              </label>
            </div>

            <div className="form-group">
              <label>Spacing After Header (line heights)</label>
              <input
                type="number"
                step="0.5"
                value={localTemplate.chapterHeader.spacing}
                onChange={(e) => handleChapterHeaderChange('spacing', parseFloat(e.target.value))}
                min="0"
                max="5"
              />
            </div>

            {localTemplate.chapterHeader.pageBreak && (
              <>
                <div className="form-group">
                  <label>Line Breaks Before Chapter Header</label>
                  <input
                    type="number"
                    value={localTemplate.chapterHeader.lineBreaksBefore || 3}
                    onChange={(e) => handleChapterHeaderChange('lineBreaksBefore', parseInt(e.target.value))}
                    min="0"
                    max="10"
                  />
                  <small>Number of blank lines at the top of each new chapter page (0-10)</small>
                </div>

                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={localTemplate.chapterHeader.startOnRightPage || false}
                      onChange={(e) => handleChapterHeaderChange('startOnRightPage', e.target.checked)}
                    />
                    Always start chapters on right-hand pages
                  </label>
                  <small>Forces chapters to begin on odd-numbered pages (traditional book layout)</small>
                </div>
              </>
            )}
          </div>

          <div className="form-section">
            <h3>Running Headers</h3>
            
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={localTemplate.runningHeaders?.enabled || false}
                  onChange={(e) => handleRunningHeaderChange('enabled', e.target.checked)}
                />
                Show running headers on each page
              </label>
              <small>Author name on left pages, book title on right pages</small>
            </div>

            {localTemplate.runningHeaders?.enabled && (
              <>
                <div className="form-group">
                  <label>Header Alignment</label>
                  <select
                    value={localTemplate.runningHeaders?.alignment || 'outside'}
                    onChange={(e) => handleRunningHeaderChange('alignment', e.target.value)}
                  >
                    <option value="outside">Outside Edge (Professional)</option>
                    <option value="center">Centered</option>
                  </select>
                  <small>Outside edge means left-aligned on left pages, right-aligned on right pages</small>
                </div>

                <div className="form-group">
                  <div style={{padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '4px', fontSize: '12px'}}>
                    <strong>ℹ️ Header Font Size:</strong> Automatically sized at 75% of body text (currently {Math.round(localTemplate.fontSize * 0.75)}pt)
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={localTemplate.runningHeaders?.skipChapterPages || true}
                      onChange={(e) => handleRunningHeaderChange('skipChapterPages', e.target.checked)}
                    />
                    Skip headers on chapter opening pages
                  </label>
                  <small>Traditional books often omit running headers on pages where chapters begin</small>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} className="btn-primary">Save Template</button>
        </div>
      </div>
    </div>
  );
}

export default TemplateManager;