import React, { useState, useEffect } from 'react';
import { generateFontPreview, calculateReadingComfort, createFontComparison } from '../utils/fontPreview';
import { BOOK_FONTS } from '../utils/fontManager';

function FontPreviewDialog({ isOpen, onClose, currentFont, fontSize, lineHeight, onFontSelect }) {
  const [selectedFonts, setSelectedFonts] = useState([currentFont]);
  const [previewText, setPreviewText] = useState('paragraph');
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comfortMetrics, setComfortMetrics] = useState(null);

  useEffect(() => {
    if (currentFont) {
      const metrics = calculateReadingComfort(currentFont, fontSize, lineHeight);
      setComfortMetrics(metrics);
    }
  }, [currentFont, fontSize, lineHeight]);

  if (!isOpen) return null;

  const handleAddFontToComparison = (fontName) => {
    if (!selectedFonts.includes(fontName) && selectedFonts.length < 4) {
      setSelectedFonts([...selectedFonts, fontName]);
    }
  };

  const handleRemoveFontFromComparison = (fontName) => {
    setSelectedFonts(selectedFonts.filter(f => f !== fontName));
  };

  const previewSamples = {
    title: "Chapter One: The Beginning",
    paragraph: `In the heart of the ancient city stood a garden that bloomed only under moonlight. Sarah walked along the cobblestone path, her footsteps echoing in the silver-bathed silence. The roses here were unlike any she had ever seen—their petals seemed to glow with an inner light, casting soft shadows that danced with each gentle breeze. She paused beside the central fountain, where water cascaded in impossible spirals.`,
    dialogue: `"Have you ever seen anything like this?" she whispered to Marcus, who stood transfixed by the luminescent fountain at the garden's center.

"Never," he replied, his voice barely audible above the gentle splash of the enchanted water. "It's like something from a dream."`,
    mixed: `**Chapter Three: Revelations**

The morning sun filtered through the *ancient oak trees*, casting dappled shadows across the forest floor. Sarah knew she was close now—the pull of the mysterious artifact grew stronger with each step.

"We should be careful," Marcus warned, his hand instinctively moving to the hilt of his sword. "The legends speak of guardians in these woods."`
  };

  const fontComparison = createFontComparison(selectedFonts, {
    fontSize,
    lineHeight,
    sampleText: previewSamples[previewText]
  });

  const getComfortColor = (score) => {
    if (score >= 80) return '#4caf50';
    if (score >= 65) return '#8bc34a';
    if (score >= 50) return '#ff9800';
    return '#f44336';
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{maxWidth: '900px', width: '90vw', maxHeight: '80vh'}}>
        <div className="modal-header">
          <h2>Font Preview & Comparison</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <div className="modal-content" style={{maxHeight: '60vh', overflowY: 'auto'}}>
          {/* Preview Controls */}
          <div style={{marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px'}}>
            <div style={{display: 'flex', gap: '15px', marginBottom: '15px', alignItems: 'center', flexWrap: 'wrap'}}>
              <label style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                <input
                  type="checkbox"
                  checked={comparisonMode}
                  onChange={(e) => setComparisonMode(e.target.checked)}
                />
                <span>Comparison Mode</span>
              </label>
              
              <div style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                <span>Preview Text:</span>
                <select 
                  value={previewText} 
                  onChange={(e) => setPreviewText(e.target.value)}
                  style={{padding: '4px 8px'}}
                >
                  <option value="title">Chapter Title</option>
                  <option value="paragraph">Body Paragraph</option>
                  <option value="dialogue">Dialogue</option>
                  <option value="mixed">Mixed Formatting</option>
                </select>
              </div>
            </div>

            {/* Reading Comfort Metrics */}
            {comfortMetrics && (
              <div style={{padding: '10px', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #ddd'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px'}}>
                  <span><strong>Reading Comfort:</strong></span>
                  <div style={{
                    padding: '2px 8px',
                    borderRadius: '12px',
                    backgroundColor: getComfortColor(comfortMetrics.score),
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {comfortMetrics.rating} ({comfortMetrics.score}/100)
                  </div>
                </div>
                {comfortMetrics.recommendations.length > 0 && (
                  <div style={{fontSize: '12px', color: '#666'}}>
                    <strong>Recommendations:</strong>
                    <ul style={{margin: '4px 0', paddingLeft: '16px'}}>
                      {comfortMetrics.recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Font Selection for Comparison */}
          {comparisonMode && (
            <div style={{marginBottom: '20px'}}>
              <h4>Select Fonts to Compare (max 4):</h4>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', marginBottom: '10px'}}>
                {Object.values(BOOK_FONTS)
                  .filter(font => font.category === 'serif')
                  .slice(0, 8)
                  .map(font => (
                  <button
                    key={font.name}
                    onClick={() => {
                      if (selectedFonts.includes(font.name)) {
                        handleRemoveFontFromComparison(font.name);
                      } else {
                        handleAddFontToComparison(font.name);
                      }
                    }}
                    style={{
                      padding: '8px',
                      border: selectedFonts.includes(font.name) ? '2px solid #2196f3' : '1px solid #ddd',
                      backgroundColor: selectedFonts.includes(font.name) ? '#e3f2fd' : 'white',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '12px'
                    }}
                    disabled={!selectedFonts.includes(font.name) && selectedFonts.length >= 4}
                  >
                    <div style={{fontWeight: 'bold'}}>{font.name}</div>
                    <div style={{color: '#666', fontSize: '10px'}}>{font.characteristics}</div>
                  </button>
                ))}
              </div>
              <div style={{fontSize: '12px', color: '#666'}}>
                Selected: {selectedFonts.join(', ')}
              </div>
            </div>
          )}

          {/* Font Previews */}
          <div className="font-previews">
            {fontComparison.map((fontData, index) => {
              const preview = fontData.preview;
              return (
                <div key={fontData.name} style={{
                  marginBottom: '24px',
                  padding: '16px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  backgroundColor: fontData.name === currentFont ? '#f0f8ff' : 'white'
                }}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
                    <div>
                      <h4 style={{margin: '0 0 4px 0', color: '#2196f3'}}>{fontData.name}</h4>
                      <div style={{fontSize: '12px', color: '#666'}}>
                        {fontData.characteristics} • Best for: {fontData.bestFor.join(', ')}
                      </div>
                      {fontData.info && (
                        <div style={{fontSize: '10px', color: '#888', marginTop: '2px'}}>
                          Quality: {fontData.info.quality} • {fontData.info.description}
                        </div>
                      )}
                    </div>
                    {fontData.name !== currentFont && (
                      <button
                        onClick={() => {
                          onFontSelect(fontData.name);
                          onClose();
                        }}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#2196f3',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Use This Font
                      </button>
                    )}
                  </div>
                  
                  <div style={{
                    padding: '16px',
                    backgroundColor: '#fafafa',
                    borderRadius: '4px',
                    fontFamily: preview.fontFamily,
                    fontSize: preview.fontSize,
                    lineHeight: preview.lineHeight,
                    textAlign: 'justify',
                    border: '1px solid #eee',
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}>
                    {previewText === 'mixed' ? (
                      <div>
                        <div style={{fontWeight: 'bold', fontSize: '1.2em', marginBottom: '0.5em'}}>Chapter Three: Revelations</div>
                        <p>The morning sun filtered through the <em>ancient oak trees</em>, casting dappled shadows across the forest floor. Sarah knew she was close now—the pull of the mysterious artifact grew stronger with each step.</p>
                        <p>"We should be careful," Marcus warned, his hand instinctively moving to the hilt of his sword. "The legends speak of guardians in these woods."</p>
                      </div>
                    ) : previewText === 'title' ? (
                      <div style={{fontWeight: 'bold', fontSize: '1.5em', textAlign: 'center'}}>
                        {previewSamples[previewText]}
                      </div>
                    ) : (
                      <div style={{whiteSpace: 'pre-line'}}>
                        {previewSamples[previewText]}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">Close</button>
        </div>
      </div>
    </div>
  );
}

export default FontPreviewDialog;