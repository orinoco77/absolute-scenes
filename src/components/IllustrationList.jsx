import { useState } from 'react';

function IllustrationList({
  illustrations,
  currentIllustrationId,
  onIllustrationSelect,
  onIllustrationAdd,
  onIllustrationDelete
}) {
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);

  const handleAddIllustration = () => {
    const newIllustration = {
      id: `illustration-${Date.now()}`,
      title: 'New Illustration',
      pageNumber: null, // Will be assigned by user
      imageData: null,
      imageFileName: null,
      caption: '',
      altText: '',
      placement: 'full-page', // full-page for now, later: inline
      created: new Date().toISOString(),
      modified: new Date().toISOString()
    };
    onIllustrationAdd(newIllustration);
    onIllustrationSelect(newIllustration.id);
  };

  const handleDragStart = (e, illustration) => {
    setDraggedItem(illustration);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, illustration) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverItem(illustration);
  };

  const handleDragLeave = () => {
    setDragOverItem(null);
  };

  const handleDrop = (e, targetIllustration) => {
    e.preventDefault();
    setDragOverItem(null);

    if (!draggedItem || draggedItem.id === targetIllustration.id) {
      setDraggedItem(null);
      return;
    }

    // Reorder logic would go here - for now we'll skip it
    // as page-based ordering is more complex
    setDraggedItem(null);
  };

  const getSortedIllustrations = () => {
    return [...illustrations].sort((a, b) => {
      // Sort by page number, putting unassigned pages at the end
      if (a.pageNumber === null && b.pageNumber === null) return 0;
      if (a.pageNumber === null) return 1;
      if (b.pageNumber === null) return -1;
      return a.pageNumber - b.pageNumber;
    });
  };

  const getIllustrationIcon = illustration => {
    if (!illustration.imageData) return '🖼️';
    return '🎨';
  };

  const getIllustrationStats = illustration => {
    const stats = [];

    if (illustration.pageNumber !== null) {
      stats.push(`Page ${illustration.pageNumber}`);
    } else {
      stats.push('No page assigned');
    }

    if (illustration.imageFileName) {
      stats.push(illustration.imageFileName);
    }

    return stats.join(' • ');
  };

  const sortedIllustrations = getSortedIllustrations();

  if (illustrations.length === 0) {
    return (
      <div className="tab-list">
        <div className="tab-list-header">
          <h3>Illustrations</h3>
          <p className="tab-description">
            Manage full-page illustrations for your book. Images are embedded
            and will appear on specific pages in your final export.
          </p>
          <div className="header-buttons">
            <button
              className="primary-btn"
              onClick={handleAddIllustration}
              title="Add new illustration"
            >
              <span className="emoji-text">🖼️+ Illustration</span>
              <span className="dark-text">🖼️+ Illustration</span>
            </button>
          </div>
        </div>

        <div className="tab-content-container">
          <div className="empty-state">
            <p>No illustrations yet. Click "🖼️+ Illustration" to add one.</p>
          </div>
        </div>

        <div className="no-illustrations" style={{ display: 'none' }}>
          <div className="illustration-suggestions">
            <h4>Add Full-Page Illustrations</h4>
            <p>
              Illustrations are images that take up entire pages in your book.
              They can be placed at specific page numbers and will automatically
              adjust your text pagination.
            </p>
            <div className="suggestion-buttons">
              <button className="primary-btn" onClick={handleAddIllustration}>
                <span className="emoji-text">📸 Add Illustration</span>
                <span className="dark-text">📸 Add Illustration</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tab-list">
      <div className="tab-list-header">
        <h3>Illustrations</h3>
        <p className="tab-description">
          Manage full-page illustrations for your book. Images are embedded and
          will appear on specific pages in your final export.
        </p>
        <div className="header-buttons">
          <button
            className="primary-btn"
            onClick={handleAddIllustration}
            title="Add new illustration"
          >
            <span className="emoji-text">🖼️+ Illustration</span>
            <span className="dark-text">🖼️+ Illustration</span>
          </button>
        </div>
      </div>

      <div className="tab-content-container">
        <div className="illustration-items">
          {sortedIllustrations.map(illustration => (
            <div
              key={illustration.id}
              className={`illustration-item ${
                currentIllustrationId === illustration.id ? 'selected' : ''
              } ${dragOverItem?.id === illustration.id ? 'drag-over' : ''}`}
              onClick={() => onIllustrationSelect(illustration.id)}
              draggable
              onDragStart={e => handleDragStart(e, illustration)}
              onDragOver={e => handleDragOver(e, illustration)}
              onDragLeave={handleDragLeave}
              onDrop={e => handleDrop(e, illustration)}
            >
              <span className="drag-handle">⋮⋮</span>

              <div className="illustration-icon">
                {getIllustrationIcon(illustration)}
              </div>

              <div className="illustration-details">
                <div className="illustration-title-row">
                  <div className="illustration-title">{illustration.title}</div>
                  <div className="illustration-actions">
                    <button
                      className="delete-button"
                      onClick={e => {
                        e.stopPropagation();
                        if (window.confirm('Delete this illustration?')) {
                          onIllustrationDelete(illustration.id);
                        }
                      }}
                      title="Delete illustration"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="illustration-meta">
                  <span className="illustration-stats">
                    {getIllustrationStats(illustration)}
                  </span>
                  <span className="modified-time">
                    Modified:{' '}
                    {new Date(illustration.modified).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="illustration-info">
          <details>
            <summary>About Illustrations</summary>
            <div className="info-content">
              <strong>Full-Page Illustrations</strong> take up entire pages and
              will push text to subsequent pages.
              <ul>
                <li>Assign specific page numbers to control placement</li>
                <li>Consider impact on chapter start pages (odd/even rules)</li>
                <li>Images should be high resolution for print quality</li>
                <li>Add captions and alt text for accessibility</li>
              </ul>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}

export default IllustrationList;
