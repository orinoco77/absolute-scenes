import { useState, useEffect } from 'react';

function SpellCheckSettings({ onClose }) {
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [availableLanguages, setAvailableLanguages] = useState([]);

  // Language options with display names
  const languageOptions = [
    { code: 'en-US', name: 'English (United States)' },
    { code: 'en-GB', name: 'English (United Kingdom)' },
    { code: 'en-CA', name: 'English (Canada)' },
    { code: 'en-AU', name: 'English (Australia)' },
    { code: 'fr', name: 'French' },
    { code: 'fr-CA', name: 'French (Canada)' },
    { code: 'es', name: 'Spanish' },
    { code: 'es-MX', name: 'Spanish (Mexico)' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'pt-BR', name: 'Portuguese (Brazil)' },
    { code: 'nl', name: 'Dutch' },
    { code: 'sv', name: 'Swedish' },
    { code: 'da', name: 'Danish' },
    { code: 'no', name: 'Norwegian' },
    { code: 'ru', name: 'Russian' },
    { code: 'pl', name: 'Polish' },
    { code: 'cs', name: 'Czech' },
    { code: 'hu', name: 'Hungarian' },
    { code: 'tr', name: 'Turkish' },
    { code: 'ar', name: 'Arabic' },
    { code: 'zh', name: 'Chinese (Simplified)' },
    { code: 'zh-TW', name: 'Chinese (Traditional)' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' }
  ];

  useEffect(() => {
    // Load current spell check language setting
    const savedLanguage = localStorage.getItem('spellCheckLanguage') || 'en-US';
    setSelectedLanguage(savedLanguage);

    // Get available languages from Electron if possible
    const getAvailableLanguages = async () => {
      try {
        const electron = window.require ? window.require('electron') : null;
        if (electron && electron.ipcRenderer) {
          const languages = await electron.ipcRenderer.invoke(
            'get-available-spell-checker-languages'
          );
          setAvailableLanguages(languages);
        }
      } catch (error) {
        console.warn('Failed to get available spell checker languages:', error);
      }
    };

    getAvailableLanguages();
  }, []);

  const handleSave = async () => {
    // Save the language preference
    localStorage.setItem('spellCheckLanguage', selectedLanguage);

    // Send the new language to the main process
    try {
      const electron = window.require ? window.require('electron') : null;
      if (electron && electron.ipcRenderer) {
        await electron.ipcRenderer.invoke('set-spell-checker-languages', [
          selectedLanguage
        ]);
      }
    } catch (error) {
      console.warn('Failed to set spell checker languages:', error);
    }

    onClose();
  };

  const handleLanguageChange = e => {
    setSelectedLanguage(e.target.value);
  };

  const isLanguageAvailable = languageCode => {
    // If we don't have the available languages list yet, assume all are available
    if (!availableLanguages || availableLanguages.length === 0) return true;
    return availableLanguages.includes(languageCode);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Spell Check Settings</h2>
          <button onClick={onClose} className="close-btn">
            ×
          </button>
        </div>

        <div className="modal-content">
          <div className="form-section">
            <h3>Language Selection</h3>

            <div className="form-group">
              <label htmlFor="spellcheck-language">Spell Check Language</label>
              <select
                id="spellcheck-language"
                value={selectedLanguage}
                onChange={handleLanguageChange}
                style={{ width: '100%', padding: '8px' }}
              >
                {languageOptions.map(lang => (
                  <option
                    key={lang.code}
                    value={lang.code}
                    disabled={!isLanguageAvailable(lang.code)}
                  >
                    {lang.name}
                    {!isLanguageAvailable(lang.code) ? ' (Not Available)' : ''}
                  </option>
                ))}
              </select>
              <small>
                Select your primary writing language. This affects spell
                checking in all text areas.
              </small>
            </div>

            {availableLanguages && availableLanguages.length > 0 && (
              <div
                style={{
                  marginTop: '15px',
                  padding: '10px',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              >
                <strong>Available Languages:</strong>{' '}
                {availableLanguages.length} languages are supported on your
                system.
              </div>
            )}

            <div
              style={{
                marginTop: '15px',
                padding: '10px',
                backgroundColor: '#e3f2fd',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            >
              <strong>Note:</strong> Language changes will take effect
              immediately. You may need to restart typing in text areas to see
              spell checking in the new language.
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleSave} className="btn-primary">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

export default SpellCheckSettings;
