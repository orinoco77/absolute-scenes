import React, { useState } from 'react';

function LocationList({
  locations,
  currentLocationId,
  onLocationSelect,
  onLocationAdd,
  onLocationDelete,
  onLocationUpdate,
  locationRecycleBin,
  onRestoreFromRecycleBin,
  onPermanentlyDelete
}) {
  const [editingLocationId, setEditingLocationId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const handleNameEdit = location => {
    setEditingLocationId(location.id);
    setEditingName(location.name);
  };

  const handleNameSave = locationId => {
    onLocationUpdate(locationId, { name: editingName });
    setEditingLocationId(null);
    setEditingName('');
  };

  const handleNameCancel = () => {
    setEditingLocationId(null);
    setEditingName('');
  };

  const handleKeyDown = (e, locationId) => {
    if (e.key === 'Enter') {
      handleNameSave(locationId);
    } else if (e.key === 'Escape') {
      handleNameCancel();
    }
  };

  return (
    <div className="tab-list">
      <div className="tab-list-header">
        <h3>Locations</h3>
        <p className="tab-description">
          Define and manage the places in your story. Track settings,
          atmosphere, and geographic details.
        </p>
        <div className="header-buttons">
          <button
            onClick={onLocationAdd}
            className="primary-btn"
            title="Add New Location"
          >
            <span className="emoji-text">+ New Location</span>
            <span className="dark-text">🌍+ Location</span>
          </button>
        </div>
      </div>

      <div className="tab-content-container locations-container">
        <div className="locations-list">
          {locations.length === 0 ? (
            <div className="empty-state">
              <p>No locations yet. Click "New Location" to get started.</p>
            </div>
          ) : (
            locations.map(location => (
              <div
                key={location.id}
                className={`location-item ${currentLocationId === location.id ? 'active' : ''}`}
                onClick={() => onLocationSelect(location.id)}
              >
                <div className="location-icon">{location.icon || '📍'}</div>

                <div className="location-content">
                  {editingLocationId === location.id ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={e => setEditingName(e.target.value)}
                      onBlur={() => handleNameSave(location.id)}
                      onKeyDown={e => handleKeyDown(e, location.id)}
                      className="location-name-edit"
                      autoFocus
                      onClick={e => e.stopPropagation()}
                    />
                  ) : (
                    <>
                      <div
                        className="location-name"
                        onDoubleClick={() => handleNameEdit(location)}
                      >
                        {location.name}
                      </div>
                      <div className="location-type">
                        {location.type || 'General'}
                      </div>
                      <div className="location-meta">
                        <span>
                          Created{' '}
                          {new Date(location.created).toLocaleDateString()}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className="location-actions">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onLocationDelete(location.id);
                    }}
                    className="delete-location-btn"
                    title="Delete Location"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Recycle Bin for Locations */}
        {locationRecycleBin && locationRecycleBin.length > 0 && (
          <div className="location-recycle-bin">
            <div className="recycle-bin-header">
              <h4>🗑️ Deleted Locations</h4>
            </div>
            <div className="recycle-bin-content">
              {locationRecycleBin.map(recycleBinItem => (
                <div key={recycleBinItem.id} className="recycle-bin-item">
                  <div className="recycle-item-content">
                    <div className="recycle-item-title">
                      {recycleBinItem.item.name}
                    </div>
                    <div className="recycle-item-meta">
                      <span>
                        Deleted{' '}
                        {new Date(
                          recycleBinItem.deletedAt
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="recycle-item-actions">
                    <button
                      onClick={() => onRestoreFromRecycleBin(recycleBinItem.id)}
                      className="restore-btn"
                      title="Restore Location"
                    >
                      ↩️
                    </button>
                    <button
                      onClick={() => onPermanentlyDelete(recycleBinItem.id)}
                      className="permanent-delete-btn"
                      title="Permanently Delete"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default React.memo(LocationList);
