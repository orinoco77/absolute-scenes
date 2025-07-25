function StatusBar({
  hasUnsavedChanges,
  isSaving,
  currentOperation,
  githubSyncStatus,
  isOnline = true
}) {
  // Determine save status
  const getSaveStatus = () => {
    if (isSaving) {
      return { text: 'Saving...', icon: '💾', className: 'saving' };
    }

    if (hasUnsavedChanges) {
      return { text: 'Unsaved changes', icon: '●', className: 'unsaved' };
    }

    if (githubSyncStatus?.lastSyncTime) {
      const syncTime = new Date(githubSyncStatus.lastSyncTime);
      const now = new Date();
      const diffMinutes = Math.floor((now - syncTime) / (1000 * 60));

      if (diffMinutes < 1) {
        return { text: 'Synced to cloud', icon: '☁️', className: 'synced' };
      } else if (diffMinutes < 60) {
        return {
          text: `Synced ${diffMinutes}m ago`,
          icon: '☁️',
          className: 'synced-old'
        };
      } else {
        return { text: 'Saved locally', icon: '💾', className: 'saved' };
      }
    }

    return { text: 'Saved locally', icon: '💾', className: 'saved' };
  };

  const saveStatus = getSaveStatus();

  return (
    <div className="status-bar">
      <div className="status-left">
        {currentOperation && (
          <div className="operation-status">
            <span className="operation-icon">⏳</span>
            <span className="operation-text">{currentOperation}</span>
          </div>
        )}
        {!isOnline && (
          <div className="offline-indicator">
            <span className="offline-icon">📶</span>
            <span className="offline-text">Offline</span>
          </div>
        )}
      </div>

      <div className="status-right">
        <div className={`save-status ${saveStatus.className}`}>
          <span className="save-icon">{saveStatus.icon}</span>
          <span className="save-text">{saveStatus.text}</span>
        </div>
      </div>
    </div>
  );
}

export default StatusBar;
