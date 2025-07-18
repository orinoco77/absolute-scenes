import React, { useState, useEffect } from 'react';
import GitHubService from '../utils/gitHubService';
import { saveRecoveredBook } from '../utils/fileOperations';

function BackupRecovery({ onClose, onBookRecovered, onStatusMessage }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [repositories, setRepositories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is already authenticated
    if (GitHubService.loadStoredAuth()) {
      setIsAuthenticated(true);
      loadRepositories();
    }
  }, []);

  const loadRepositories = async () => {
    setIsLoading(true);
    setError(null);
    if (onStatusMessage) onStatusMessage('Loading repositories...');

    try {
      const repos = await GitHubService.getUserRepositories();
      setRepositories(repos);
      if (onStatusMessage) onStatusMessage('');
    } catch (error) {
      console.error('Failed to load repositories:', error);
      setError(error.message);
      if (onStatusMessage) onStatusMessage('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadBook = async (repo) => {
    setIsDownloading(true);
    setError(null);
    if (onStatusMessage) onStatusMessage('Downloading from GitHub...');

    try {
      const bookData = await GitHubService.downloadBookFromRepository(repo, repo.bookFile);
      
      // Use the file operations utility to save the recovered book
      const result = await saveRecoveredBook(bookData.bookData, bookData.filename);
      
      if (result.success) {
        onBookRecovered(result.filePath, bookData.bookData);
        if (onStatusMessage) onStatusMessage('');
        onClose();
      } else {
        setError(result.error || 'Failed to save recovered book');
        if (onStatusMessage) onStatusMessage('');
      }
    } catch (error) {
      console.error('Failed to download book:', error);
      setError(error.message);
      if (onStatusMessage) onStatusMessage('');
    } finally {
      setIsDownloading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (!isAuthenticated) {
    return (
      <div className="modal-overlay">
        <div className="modal">
          <div className="modal-header">
            <h2>📥 Open from Backup</h2>
            <button onClick={onClose} className="close-btn">×</button>
          </div>

          <div className="modal-content">
            <div style={{
              textAlign: 'center',
              padding: '40px 20px'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
              <h3 style={{ margin: '0 0 12px 0' }}>GitHub Authentication Required</h3>
              <p style={{ margin: '0 0 20px 0', color: '#666', lineHeight: '1.5' }}>
                You need to be connected to GitHub to access your book backups.
              </p>
              <button
                onClick={() => {
                  onClose();
                  // Trigger GitHub integration dialog
                }}
                style={{
                  padding: '12px 24px',
                  background: '#2ea043',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                🔗 Connect to GitHub First
              </button>
            </div>
          </div>

          <div className="modal-footer">
            <button onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>📥 Open from Backup</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <div className="modal-content">
          {error && (
            <div style={{
              padding: '12px',
              background: '#ffebee',
              border: '1px solid #f44336',
              borderRadius: '4px',
              color: '#c62828',
              marginBottom: '20px'
            }}>
              <strong>⚠️ Error:</strong> {error}
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 8px 0' }}>Your Book Backups</h4>
            <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
              Choose a repository to recover your book from. Only repositories containing .book files are shown.
            </p>
          </div>

          {isLoading ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔄</div>
              <p style={{ margin: '0', color: '#666' }}>Loading your repositories...</p>
            </div>
          ) : repositories.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>📂</div>
              <h4 style={{ margin: '0 0 8px 0' }}>No Book Backups Found</h4>
              <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
                We couldn't find any repositories containing .book files in your GitHub account.
              </p>
            </div>
          ) : (
            <div style={{
              maxHeight: '400px',
              overflowY: 'auto',
              border: '1px solid #ddd',
              borderRadius: '6px'
            }}>
              {repositories.map((repo) => (
                <div
                  key={repo.id}
                  style={{
                    padding: '16px',
                    borderBottom: '1px solid #eee',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <h5 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>
                      📖 {repo.name}
                    </h5>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      <div>File: <strong>{repo.bookFile.name}</strong></div>
                      <div>Updated: {formatDate(repo.updated_at)}</div>
                      {repo.description && (
                        <div style={{ marginTop: '4px', fontStyle: 'italic' }}>
                          {repo.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownloadBook(repo)}
                    disabled={isDownloading}
                    style={{
                      padding: '8px 16px',
                      background: '#2ea043',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      cursor: isDownloading ? 'wait' : 'pointer',
                      opacity: isDownloading ? 0.7 : 1,
                      marginLeft: '16px'
                    }}
                  >
                    {isDownloading ? '📥 Downloading...' : '📥 Download'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {repositories.length > 0 && (
            <div style={{
              marginTop: '16px',
              padding: '12px',
              background: '#e3f2fd',
              borderRadius: '4px',
              fontSize: '13px',
              color: '#1565c0'
            }}>
              <strong>💡 Tip:</strong> Downloaded books will be saved to your computer and can be opened normally. 
              The backup copy stays safely in GitHub.
            </div>
          )}
        </div>

        <div className="modal-footer">
          {repositories.length > 0 && (
            <button 
              onClick={loadRepositories}
              disabled={isLoading}
              className="btn-secondary"
              style={{ marginRight: 'auto' }}
            >
              🔄 Refresh
            </button>
          )}
          <button onClick={onClose} className="btn-secondary">Close</button>
        </div>
      </div>
    </div>
  );
}

export default BackupRecovery;