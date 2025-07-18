import React, { useState, useEffect } from 'react';
import { BOOK_FONTS, getCssFontFamily } from '../utils/fontManager';

function FontPreview({ selectedFont, fontSize = 12, lineHeight = 1.6, sampleText = null }) {
  const [previewText, setPreviewText] = useState(
    sampleText || `The quick brown fox jumps over the lazy dog. This sample text demonstrates how the font appears in both regular and italic styles, and shows readability across different character combinations.`
  );

  // Get font information
  const fontKey = Object.keys(BOOK_FONTS).find(key => 
    BOOK_FONTS[key].name === selectedFont
  );
  const fontInfo = fontKey ? BOOK_FONTS[fontKey] : null;
  const cssFont = getCssFontFamily(selectedFont);

  // Different sample texts for different contexts
  const sampleTexts = {
    readability: "The quick brown fox jumps over the lazy dog. This sample text demonstrates how the font appears in both regular and italic styles, and shows readability across different character combinations.",
    literary: "It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness. In a hole in the ground there lived a hobbit. Not a nasty, dirty, wet hole filled with the ends of worms and an oozy smell.",
    academic: "Typography is the art and technique of arranging type to make written language legible, readable, and appealing when displayed. The arrangement of type involves selecting typefaces, point sizes, line lengths, line-spacing, and letter-spacing.",
    technical: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
  };

  const previewStyle = {
    fontFamily: cssFont,
    fontSize: `${fontSize}pt`,
    lineHeight: lineHeight,
    color: '#333',
    padding: '20px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: 'white',
    minHeight: '120px',
    maxWidth: '600px',
    textAlign: 'justify'
  };

  return (
    <div className="font-preview">
      <div className="font-preview-header" style={{ marginBottom: '10px' }}>
        <h4 style={{ margin: '0 0 5px 0', color: '#2196f3' }}>
          {selectedFont} Preview
        </h4>
        {fontInfo && (
          <div style={{ fontSize: '12px', color: '#666' }}>
            <span><strong>Style:</strong> {fontInfo.characteristics}</span>
            <span style={{ marginLeft: '15px' }}><strong>Best for:</strong> {fontInfo.bestFor.join(', ')}</span>
          </div>
        )}
      </div>

      {/* Sample text selector */}
      <div style={{ marginBottom: '10px' }}>
        <label style={{ fontSize: '12px', color: '#666', marginRight: '10px' }}>Sample text:</label>
        <select 
          value="custom" 
          onChange={(e) => {
            if (e.target.value !== 'custom') {
              setPreviewText(sampleTexts[e.target.value]);
            }
          }}
          style={{ fontSize: '12px', padding: '2px' }}
        >
          <option value="custom">Custom text</option>
          <option value="readability">Readability test</option>
          <option value="literary">Literary sample</option>
          <option value="academic">Academic text</option>
          <option value="technical">Technical sample</option>
        </select>
      </div>

      {/* Preview area */}
      <div style={previewStyle}>
        {previewText}
      </div>

      {/* Style variations */}
      <div style={{ marginTop: '15px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
        {/* Regular */}
        <div style={{ ...previewStyle, padding: '10px', minHeight: 'auto', fontSize: `${fontSize - 1}pt` }}>
          <div style={{ fontSize: '11px', color: '#666', marginBottom: '5px' }}>Regular</div>
          <div>The quick brown fox jumps over the lazy dog.</div>
        </div>

        {/* Bold */}
        <div style={{ ...previewStyle, padding: '10px', minHeight: 'auto', fontSize: `${fontSize - 1}pt`, fontWeight: 'bold' }}>
          <div style={{ fontSize: '11px', color: '#666', marginBottom: '5px', fontWeight: 'normal' }}>Bold</div>
          <div>The quick brown fox jumps over the lazy dog.</div>
        </div>

        {/* Italic */}
        <div style={{ ...previewStyle, padding: '10px', minHeight: 'auto', fontSize: `${fontSize - 1}pt`, fontStyle: 'italic' }}>
          <div style={{ fontSize: '11px', color: '#666', marginBottom: '5px', fontStyle: 'normal' }}>Italic</div>
          <div>The quick brown fox jumps over the lazy dog.</div>
        </div>
      </div>

      {/* Custom text input */}
      <div style={{ marginTop: '15px' }}>
        <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '5px' }}>Custom preview text:</label>
        <textarea
          value={previewText}
          onChange={(e) => setPreviewText(e.target.value)}
          style={{
            width: '100%',
            height: '60px',
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'Arial, sans-serif',
            resize: 'vertical'
          }}
          placeholder="Enter your own text to preview how it looks in the selected font..."
        />
      </div>

      {/* Font size and line height controls */}
      <div style={{ marginTop: '15px', display: 'flex', gap: '15px', alignItems: 'center' }}>
        <div>
          <label style={{ fontSize: '11px', color: '#666', display: 'block' }}>Font Size</label>
          <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{fontSize}pt</span>
        </div>
        <div>
          <label style={{ fontSize: '11px', color: '#666', display: 'block' }}>Line Height</label>
          <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{lineHeight}</span>
        </div>
        {fontInfo && (
          <div style={{ marginLeft: 'auto', fontSize: '11px', color: '#666' }}>
            Quality: <span style={{ 
              color: fontInfo.quality === 'premium' ? '#4caf50' : 
                     fontInfo.quality === 'high' ? '#2196f3' : '#666',
              fontWeight: 'bold',
              textTransform: 'capitalize'
            }}>
              {fontInfo.quality}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default FontPreview;