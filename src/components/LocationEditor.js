import { useState } from 'react';

// Available location icons
const LOCATION_ICONS = [
  '📍',
  '🏠',
  '🏢',
  '🏰',
  '🏛️',
  '⛪',
  '🕌',
  '🗼',
  '🌆',
  '🌉',
  '🏔️',
  '🌋',
  '🏞️',
  '🏜️',
  '🏖️',
  '🌊',
  '🌲',
  '🌳',
  '🌴',
  '🌺',
  '🎪',
  '🎡',
  '🎢',
  '🏪',
  '🏬',
  '🏥',
  '🏦',
  '🏨',
  '🚉',
  '✈️',
  '🚗',
  '⛵',
  '🎭',
  '📚',
  '🎨',
  '⚔️',
  '🔮',
  '💎',
  '👑',
  '🗝️'
];

// Location types
const LOCATION_TYPES = [
  'General',
  'City/Town',
  'Building',
  'Residence',
  'Natural Landmark',
  'Business',
  'Institution',
  'Transportation',
  'Entertainment',
  'Religious Site',
  'Historical Site',
  'Fantasy Location',
  'Secret Location'
];

function LocationEditor({ location, template, onLocationUpdate }) {
  const [showIconDropdown, setShowIconDropdown] = useState(false);

  const handleUpdate = (field, value) => {
    onLocationUpdate(location.id, { [field]: value });
  };

  const handleIconSelect = icon => {
    handleUpdate('icon', icon);
    setShowIconDropdown(false);
  };

  const handleDescriptionChange = e => {
    handleUpdate('description', e.target.value);
  };

  const handleNotesChange = e => {
    handleUpdate('notes', e.target.value);
  };

  // Count words in description
  const wordCount = location.description
    ? location.description
        .trim()
        .split(/\s+/)
        .filter(word => word.length > 0).length
    : 0;

  return (
    <div className="location-editor">
      <div className="location-header">
        <div className="location-title-section">
          <div className="location-avatar-selector">
            <div
              className="current-avatar"
              onClick={() => setShowIconDropdown(!showIconDropdown)}
              title="Click to change icon"
            >
              {location.icon || '📍'}
            </div>
            {showIconDropdown && (
              <div className="avatar-dropdown">
                {LOCATION_ICONS.map(icon => (
                  <button
                    key={icon}
                    className="avatar-option"
                    onClick={() => handleIconSelect(icon)}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="location-title-inputs">
            <input
              type="text"
              value={location.name || ''}
              onChange={e => handleUpdate('name', e.target.value)}
              className="location-name-input"
              placeholder="Location Name"
            />
            <select
              value={location.type || 'General'}
              onChange={e => handleUpdate('type', e.target.value)}
              className="location-type-input"
            >
              {LOCATION_TYPES.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="location-stats">
          <span>{wordCount} words</span>
          <span>Created {new Date(location.created).toLocaleDateString()}</span>
          <span>
            Modified {new Date(location.modified).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="location-editor-textarea">
        <div className="editor-toolbar">
          <span>📝 Description</span>
          <span className="format-help">
            Describe the location, its appearance, atmosphere, and significance
          </span>
        </div>
        <textarea
          value={location.description || ''}
          onChange={handleDescriptionChange}
          placeholder="Describe this location in detail. What does it look like? What's the atmosphere? What role does it play in your story?"
          style={{
            fontFamily: template?.fontFamily || 'Times New Roman',
            fontSize: `${(template?.fontSize || 12) + 4}px`,
            lineHeight: template?.lineHeight || 1.6
          }}
        />
      </div>

      <div className="location-details">
        <div className="location-detail-group">
          <label>Geography & Setting</label>
          <input
            type="text"
            value={location.geography || ''}
            onChange={e => handleUpdate('geography', e.target.value)}
            placeholder="e.g., Urban downtown, Rural countryside, Mountain valley"
            className="location-detail-input"
          />
        </div>

        <div className="location-detail-group">
          <label>Climate & Weather</label>
          <input
            type="text"
            value={location.climate || ''}
            onChange={e => handleUpdate('climate', e.target.value)}
            placeholder="e.g., Temperate, Hot and humid, Cold and snowy"
            className="location-detail-input"
          />
        </div>

        <div className="location-detail-group">
          <label>Key Features</label>
          <input
            type="text"
            value={location.features || ''}
            onChange={e => handleUpdate('features', e.target.value)}
            placeholder="e.g., Stone walls, Large windows, Hidden passages"
            className="location-detail-input"
          />
        </div>

        <div className="location-detail-group">
          <label>Significance to Story</label>
          <input
            type="text"
            value={location.significance || ''}
            onChange={e => handleUpdate('significance', e.target.value)}
            placeholder="e.g., Meeting place, Character's home, Scene of conflict"
            className="location-detail-input"
          />
        </div>
      </div>

      <div className="location-notes">
        <label>Additional Notes</label>
        <textarea
          value={location.notes || ''}
          onChange={handleNotesChange}
          placeholder="Additional notes, research, or ideas about this location..."
          rows={4}
        />
      </div>
    </div>
  );
}

export default LocationEditor;
