import { useExpandableList } from '../hooks/useExpandableList';
import { useInlineEdit } from '../hooks/useInlineEdit';

function BackgroundList({
  folders,
  currentDocumentId,
  currentFolderId,
  onDocumentSelect,
  onFolderSelect,
  onDocumentAdd,
  onFolderAdd,
  onDocumentDelete,
  onDocumentUpdate,
  onFolderDelete,
  onFolderUpdate,
  onReorderFolders: _onReorderFolders,
  onReorderDocumentsInFolder: _onReorderDocumentsInFolder,
  onMoveDocumentBetweenFolders: _onMoveDocumentBetweenFolders,
  recycleBin,
  showRecycleBin,
  onToggleRecycleBin,
  onRestoreFromRecycleBin,
  onPermanentlyDelete,
  onEmptyRecycleBin
}) {
  // Expandable folders hook
  const { isExpanded: isFolderExpanded, toggleItem: toggleFolder } =
    useExpandableList({
      items: folders,
      autoExpand: false,
      initialExpanded: currentFolderId
        ? [currentFolderId]
        : folders.length > 0
          ? [folders[0].id]
          : ['default-bg'],
      currentItemId: currentFolderId
    });
  // Folder editing hook
  const folderEdit = useInlineEdit({
    onSave: (folderId, newTitle) => {
      if (newTitle.trim()) {
        onFolderUpdate(folderId, { title: newTitle });
        return true;
      }
      return false;
    }
  });

  // Document editing hook
  const documentEdit = useInlineEdit({
    onSave: (documentId, newTitle) => {
      if (newTitle.trim()) {
        onDocumentUpdate(documentId, { title: newTitle });
        return true;
      }
      return false;
    }
  });

  const getTotalDocuments = () => {
    return folders.reduce(
      (total, folder) => total + folder.documents.length,
      0
    );
  };

  const getTotalWords = () => {
    return folders.reduce((total, folder) => {
      return (
        total +
        folder.documents.reduce((folderTotal, doc) => {
          const wordCount = doc.content
            ? doc.content.split(/\s+/).filter(word => word.length > 0).length
            : 0;
          return folderTotal + wordCount;
        }, 0)
      );
    }, 0);
  };

  return (
    <div className="tab-list">
      <div className="tab-list-header">
        <h3>Background Info</h3>
        <p className="tab-description">
          Store your world-building, historical context, character backstories,
          and development notes. Organize them in folders for easy access.
        </p>

        <div className="current-chapter-indicator">
          <strong>
            {folders.find(f => f.id === currentFolderId)?.title || 'No Folder'}
          </strong>
          <br />
          <small>
            {getTotalDocuments()} documents • {getTotalWords()} total words
          </small>
        </div>

        <div className="header-buttons">
          <button
            onClick={onDocumentAdd}
            className="add-scene-btn primary-btn"
            disabled={!currentFolderId}
            title="Add new background document to current folder"
          >
            + Document
          </button>
          <button
            onClick={onFolderAdd}
            className="add-chapter-btn primary-btn"
            title="Create new folder"
          >
            + Folder
          </button>
          <button
            onClick={onToggleRecycleBin}
            className={`recycle-bin-btn secondary-btn ${
              recycleBin.length > 0 ? 'has-items' : ''
            }`}
            title="Toggle recycle bin"
          >
            🗑️ ({recycleBin.length})
          </button>
        </div>
      </div>

      <div className="tab-content-container chapters-container">
        {folders.map(folder => (
          <div key={folder.id} className="chapter-group">
            <div
              className={`chapter-header ${
                folder.id === currentFolderId ? 'active-chapter' : ''
              }`}
            >
              <div className="chapter-header-content">
                <button
                  className="chapter-toggle"
                  onClick={() => toggleFolder(folder.id)}
                  title={
                    isFolderExpanded(folder.id)
                      ? 'Collapse folder'
                      : 'Expand folder'
                  }
                >
                  {isFolderExpanded(folder.id) ? '📂' : '📁'}
                </button>

                {folderEdit.isEditing(folder.id) ? (
                  <input
                    type="text"
                    value={folderEdit.editingValue}
                    onChange={e => folderEdit.updateValue(e.target.value)}
                    onBlur={folderEdit.handleBlur}
                    onKeyDown={folderEdit.handleKeyPress}
                    className="chapter-title-edit"
                    autoFocus
                  />
                ) : (
                  <div
                    className="chapter-title"
                    onClick={() => onFolderSelect(folder.id)}
                    onDoubleClick={() =>
                      folderEdit.startEditing(folder.id, folder.title)
                    }
                    title="Click to select folder, double-click to rename"
                  >
                    {folder.title}
                  </div>
                )}

                <div className="chapter-meta">
                  <div className="scene-count">
                    {folder.documents.length} docs
                  </div>
                  <div className="word-count">
                    {folder.documents.reduce((total, doc) => {
                      const wordCount = doc.content
                        ? doc.content
                            .split(/\s+/)
                            .filter(word => word.length > 0).length
                        : 0;
                      return total + wordCount;
                    }, 0)}{' '}
                    words
                  </div>
                </div>

                {folders.length > 1 && (
                  <button
                    className="chapter-delete"
                    onClick={() => onFolderDelete(folder.id)}
                    title="Delete folder and all its documents"
                  >
                    ❌
                  </button>
                )}
              </div>
            </div>

            {isFolderExpanded(folder.id) && (
              <div className="scenes-in-chapter">
                {folder.documents.length === 0 ? (
                  <div className="empty-chapter">
                    No documents in this folder yet.
                    <br />
                    Click "+ Document" to add one.
                  </div>
                ) : (
                  <div className="scenes">
                    {folder.documents.map((doc, index) => (
                      <div
                        key={doc.id}
                        className={`scene-item ${
                          doc.id === currentDocumentId ? 'active' : ''
                        }`}
                        onClick={() => onDocumentSelect(doc.id)}
                      >
                        <div className="drag-handle" title="Drag to reorder">
                          ⋮⋮
                        </div>
                        <div className="scene-number">{index + 1}</div>
                        <div
                          className="scene-content"
                          style={{
                            flex: '1',
                            minWidth: '0',
                            marginRight: '8px'
                          }}
                        >
                          {documentEdit.isEditing(doc.id) ? (
                            <input
                              type="text"
                              value={documentEdit.editingValue}
                              onChange={e =>
                                documentEdit.updateValue(e.target.value)
                              }
                              onBlur={documentEdit.handleBlur}
                              onKeyDown={documentEdit.handleKeyPress}
                              className="scene-title-edit"
                              style={{
                                width: '100%',
                                maxWidth: 'calc(100% - 10px)',
                                marginRight: '10px',
                                boxSizing: 'border-box'
                              }}
                              autoFocus
                            />
                          ) : (
                            <div
                              className="scene-title"
                              onDoubleClick={e => {
                                e.stopPropagation();
                                documentEdit.startEditing(doc.id, doc.title);
                              }}
                              title="Double-click to rename document"
                              style={{
                                paddingRight: '10px',
                                wordWrap: 'break-word',
                                overflow: 'hidden'
                              }}
                            >
                              {doc.title}
                            </div>
                          )}
                          <div className="scene-meta">
                            <span className="scene-word-count">
                              {doc.content
                                ? doc.content
                                    .split(/\s+/)
                                    .filter(word => word.length > 0).length
                                : 0}{' '}
                              words
                            </span>
                            <span className="scene-date">
                              {new Date(doc.modified).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="scene-actions">
                          <button
                            className="delete-scene-btn"
                            onClick={e => {
                              e.stopPropagation();
                              onDocumentDelete(doc.id);
                            }}
                            title="Delete document"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {folders.length === 0 && (
          <div className="empty-state">
            <p>
              No background folders yet. Create your first folder to start
              organizing your background information.
            </p>
          </div>
        )}

        {showRecycleBin && recycleBin.length > 0 && (
          <div className="recycle-bin">
            <div className="recycle-bin-header">
              <h4>Recycle Bin</h4>
              <div className="recycle-bin-controls">
                <button
                  onClick={onEmptyRecycleBin}
                  className="empty-bin-btn"
                  title="Permanently delete all items"
                >
                  Empty
                </button>
                <button
                  onClick={onToggleRecycleBin}
                  className="close-bin-btn"
                  title="Close recycle bin"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="recycle-bin-content">
              {recycleBin.map(item => (
                <div key={item.id} className="recycle-bin-item">
                  <div className="recycle-item-content">
                    <div className="recycle-item-title">
                      📄 {item.item.title}
                    </div>
                    <div className="recycle-item-meta">
                      <span>From: {item.originalFolderTitle}</span>
                      <span>
                        Deleted: {new Date(item.deletedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="recycle-item-actions">
                    <button
                      onClick={() => onRestoreFromRecycleBin(item.id)}
                      className="restore-btn"
                      title="Restore document"
                    >
                      ↶
                    </button>
                    <button
                      onClick={() => onPermanentlyDelete(item.id)}
                      className="permanent-delete-btn"
                      title="Delete permanently"
                    >
                      ❌
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

export default BackgroundList;
