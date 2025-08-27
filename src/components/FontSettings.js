import { useState, useEffect } from 'react';
import {
  FONT_OPTIONS,
  getCurrentFontSetting,
  applyFontSetting
} from '../utils/fontSettingsManager';

function FontSettings({ onClose }) {
  const [selectedFont, setSelectedFont] = useState('system');

  useEffect(() => {
    // Load current font setting
    const savedFont = getCurrentFontSetting();
    setSelectedFont(savedFont);
  }, []);

  const handleSave = () => {
    // Apply font setting using the manager
    applyFontSetting(selectedFont);

    // Close dialog
    onClose();
  };

  const selectedFontOption = FONT_OPTIONS.find(f => f.id === selectedFont);

  return (
    <div className="modal-overlay">
      <div className="modal font-settings">
        <div className="modal-header">
          <h2>Editor Font Settings</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <p className="description">
            Choose the font family for all text editors in the application. This
            affects scene content, notes, and other text editing areas.
          </p>

          <div className="font-categories">
            {/* System Default */}
            <div className="font-category">
              <h3>System</h3>
              {FONT_OPTIONS.filter(font => font.category === 'system').map(
                font => (
                  <div key={font.id} className="font-option">
                    <label className="font-label">
                      <input
                        type="radio"
                        name="font"
                        value={font.id}
                        checked={selectedFont === font.id}
                        onChange={e => setSelectedFont(e.target.value)}
                      />
                      <div className="font-info">
                        <div className="font-name">{font.name}</div>
                        <div className="font-description">
                          {font.description}
                        </div>
                      </div>
                    </label>
                    <div
                      className="font-preview"
                      style={{ fontFamily: font.cssValue }}
                    >
                      The quick brown fox jumps over the lazy dog. 1234567890
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Monospace */}
            <div className="font-category">
              <h3>Monospace</h3>
              <p className="category-description">
                Fixed-width fonts where every character takes the same space.
                Great for precise editing and code-like formatting.
              </p>
              {FONT_OPTIONS.filter(font => font.category === 'monospace').map(
                font => (
                  <div key={font.id} className="font-option">
                    <label className="font-label">
                      <input
                        type="radio"
                        name="font"
                        value={font.id}
                        checked={selectedFont === font.id}
                        onChange={e => setSelectedFont(e.target.value)}
                      />
                      <div className="font-info">
                        <div className="font-name">{font.name}</div>
                        <div className="font-description">
                          {font.description}
                        </div>
                      </div>
                    </label>
                    <div
                      className="font-preview"
                      style={{ fontFamily: font.cssValue }}
                    >
                      The quick brown fox jumps over the lazy dog. 1234567890
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Sans-serif */}
            <div className="font-category">
              <h3>Sans-serif</h3>
              <p className="category-description">
                Clean fonts without decorative strokes. Modern and minimalist,
                excellent for contemporary writing and digital reading.
              </p>
              {FONT_OPTIONS.filter(font => font.category === 'sans-serif').map(
                font => (
                  <div key={font.id} className="font-option">
                    <label className="font-label">
                      <input
                        type="radio"
                        name="font"
                        value={font.id}
                        checked={selectedFont === font.id}
                        onChange={e => setSelectedFont(e.target.value)}
                      />
                      <div className="font-info">
                        <div className="font-name">{font.name}</div>
                        <div className="font-description">
                          {font.description}
                        </div>
                      </div>
                    </label>
                    <div
                      className="font-preview"
                      style={{ fontFamily: font.cssValue }}
                    >
                      The quick brown fox jumps over the lazy dog. 1234567890
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Serif */}
            <div className="font-category">
              <h3>Serif</h3>
              <p className="category-description">
                Traditional fonts with decorative strokes. Classic choice for
                books and long-form writing, easier on the eyes for extended
                reading.
              </p>
              {FONT_OPTIONS.filter(font => font.category === 'serif').map(
                font => (
                  <div key={font.id} className="font-option">
                    <label className="font-label">
                      <input
                        type="radio"
                        name="font"
                        value={font.id}
                        checked={selectedFont === font.id}
                        onChange={e => setSelectedFont(e.target.value)}
                      />
                      <div className="font-info">
                        <div className="font-name">{font.name}</div>
                        <div className="font-description">
                          {font.description}
                        </div>
                      </div>
                    </label>
                    <div
                      className="font-preview"
                      style={{ fontFamily: font.cssValue }}
                    >
                      The quick brown fox jumps over the lazy dog. 1234567890
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {selectedFontOption && (
            <div className="current-selection">
              <h4>Current Selection:</h4>
              <div className="selected-font-preview">
                <div className="font-name-large">{selectedFontOption.name}</div>
                <div
                  className="preview-text"
                  style={{ fontFamily: selectedFontOption.cssValue }}
                >
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                  do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco
                  laboris.
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="button cancel-button" onClick={onClose}>
            Cancel
          </button>
          <button className="button save-button" onClick={handleSave}>
            Apply Font
          </button>
        </div>
      </div>
    </div>
  );
}

export default FontSettings;
