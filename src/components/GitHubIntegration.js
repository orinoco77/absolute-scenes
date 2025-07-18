import React, { useState, useEffect } from 'react';
import GitHubService from '../utils/gitHubService';

function GitHubIntegration({ currentRepo, onGitHubSettingsUpdate, onGitHubSyncStatusUpdate, onClose, book, currentFilePath, onStatusMessage }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [showTokenSetup, setShowTokenSetup] = useState(false);
  const [token, setToken] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [currentRepository, setCurrentRepository] = useState(currentRepo);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1); // 1: intro, 2: token creation, 3: token input
  
  // Use sync time from book data
  const lastSyncTime = book.github?.lastSyncTime ? new Date(book.github.lastSyncTime) : null;

  useEffect(() => {
    // Check if user is already authenticated
    if (GitHubService.loadStoredAuth()) {
      setIsAuthenticated(true);
      setUserInfo(GitHubService.userInfo);
    }
  }, []);

  useEffect(() => {
    // Sync currentRepository with book's GitHub repository
    setCurrentRepository(book.github?.repository || null);
  }, [book.github?.repository]);

  const handleStartSetup = async () => {
    // Validate that book has title and author before proceeding
    if (!book.title?.trim() || !book.author?.trim()) {
      setError('Please set a book title and author before connecting to GitHub. This helps us create a properly named repository for your book.');
      return;
    }

    setError(null);
    setShowTokenSetup(true);
    setStep(2);

    try {
      // Open GitHub token creation page
      await GitHubService.startConnectionFlow();
      // Auto-advance to token input after a moment
      setTimeout(() => setStep(3), 2000);
    } catch (error) {
      console.error('Failed to start GitHub setup:', error);
      setError(error.message);
    }
  };

  const handleTokenSubmit = async () => {
    if (!token.trim()) {
      setError('Please enter your GitHub token');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const user = await GitHubService.validateAndSetupToken(token.trim());
      setIsAuthenticated(true);
      setUserInfo(user);
      setShowTokenSetup(false);
      
      // Auto-setup repository for their book
      if (book.title?.trim() && book.author?.trim()) {
        await handleSetupRepository();
      }
    } catch (error) {
      console.error('Token validation failed:', error);
      setError(error.message);
    } finally {
      setIsValidating(false);
    }
  };

  const handleSetupRepository = async () => {
    if (!isAuthenticated) return;

    // Validate that book has title and author before creating repo
    if (!book.title?.trim() || !book.author?.trim()) {
      setError('Please set a book title and author before creating a repository. This ensures your repository has a meaningful name.');
      return;
    }

    setIsSyncing(true);
    setError(null);

    try {
      const repo = await GitHubService.setupBookRepository(
        book.title || 'Untitled Book',
        book.author || 'Author'
      );
      
      setCurrentRepository(repo);
      onGitHubSettingsUpdate({ repository: repo });
      
      // Immediately save the current book to the repo with proper filename
      setIsSyncing(true);
      try {
        const commitMessage = `Initial commit: ${book.title} by ${book.author}`;
        
      // Generate filename based on current file or book title
      let filename = 'manuscript.book';
      if (currentFilePath) {
        // Extract filename from path, keep as .book
        filename = currentFilePath.split(/[\\/]/).pop();
        if (!filename.endsWith('.book')) {
          filename = filename.replace(/\.(book|json)$/, '') + '.book';
        }
      } else if (book.title?.trim()) {
        // Generate filename from book title
        filename = book.title.toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '') + '.book';
      }
        
        await GitHubService.saveBookToRepository(repo, book, commitMessage, filename);
        onGitHubSyncStatusUpdate({ lastSyncTime: new Date().toISOString() });
      } catch (syncError) {
        console.warn('Initial sync failed:', syncError.message);
        // Don't fail the whole setup if sync fails
      }
    } catch (error) {
      console.error('Repository setup failed:', error);
      setError(error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncToGitHub = async () => {
    if (!currentRepository || !isAuthenticated) return;

    setIsSyncing(true);
    setError(null);
    if (onStatusMessage) onStatusMessage('Syncing with GitHub...');

    try {
      const commitMessage = `Manual sync: ${new Date().toLocaleString()}`;
      
      // Generate filename based on current file or book title
      let filename = 'manuscript.book';
      if (currentFilePath) {
        // Extract filename from path, keep as .book
        filename = currentFilePath.split(/[\\/]/).pop();
        if (!filename.endsWith('.book')) {
          filename = filename.replace(/\.(book|json)$/, '') + '.book';
        }
      } else if (book.title?.trim()) {
        // Generate filename from book title
        filename = book.title.toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '') + '.book';
      }
      
      await GitHubService.saveBookToRepository(currentRepository, book, commitMessage, filename);
      onGitHubSyncStatusUpdate({ lastSyncTime: new Date().toISOString() });
      if (onStatusMessage) onStatusMessage('');
    } catch (error) {
      console.error('Sync failed:', error);
      setError(error.message);
      if (onStatusMessage) onStatusMessage('');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = () => {
    GitHubService.disconnect();
    setIsAuthenticated(false);
    setUserInfo(null);
    setCurrentRepository(null);
    onGitHubSettingsUpdate({ repository: null, lastSyncTime: null });
    setError(null);
    setShowTokenSetup(false);
    setStep(1);
    setToken('');
  };

  const openRepositoryInBrowser = () => {
    if (currentRepository?.html_url) {
      const { shell } = window.require('electron');
      shell.openExternal(currentRepository.html_url);
    }
  };

  const openGitHubSignup = () => {
    const { shell } = window.require('electron');
    shell.openExternal('https://github.com/join');
  };

  if (showTokenSetup) {
    return (
      <div className="modal-overlay">
        <div className="modal">
          <div className="modal-header">
            <h2>🔗 Connect to GitHub</h2>
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

            {step === 2 && (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌐</div>
                <h3 style={{ margin: '0 0 12px 0' }}>Step 1: Create Access Token</h3>
                <p style={{ margin: '0 0 20px 0', color: '#666', lineHeight: '1.5' }}>
                  We've opened GitHub in your browser. Follow these simple steps:
                </p>
                <div style={{
                  textAlign: 'left',
                  background: '#f8f9fa',
                  padding: '16px',
                  borderRadius: '6px',
                  marginBottom: '20px'
                }}>
                  <div style={{
                    padding: '12px',
                    background: '#e8f5e8',
                    borderRadius: '4px',
                    marginBottom: '12px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#2d5a2d'
                  }}>
                    💡 Important: Don't change anything on the GitHub page!
                  </div>
                  <ol style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.6' }}>
                    <li>✅ All settings are pre-configured perfectly for you</li>
                    <li>📅 The expiration date is optional ("No expiration" is fine)</li>
                    <li>🟢 Simply scroll down and click "Generate token"</li>
                    <li>📋 Copy the token that appears (starts with "ghp_")</li>
                  </ol>
                  <div style={{
                    padding: '12px',
                    background: '#fff3cd',
                    borderRadius: '4px',
                    marginTop: '12px',
                    fontSize: '13px',
                    color: '#856404'
                  }}>
                    <strong>💡 Reconnecting?</strong> If you have an existing AbsoluteScenes token, you can use that instead of creating a new one.
                  </div>
                </div>
                <button
                  onClick={() => setStep(3)}
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
                  ✅ I've copied my token
                </button>
              </div>
            )}

            {step === 3 && (
              <div>
                <h3 style={{ margin: '0 0 16px 0', textAlign: 'center' }}>Step 2: Enter Your Token</h3>
                <div style={{
                  padding: '16px',
                  background: '#e3f2fd',
                  borderRadius: '6px',
                  marginBottom: '16px',
                  fontSize: '14px'
                }}>
                  <strong>🔐 Privacy Note:</strong> Your token is stored locally on your computer only. 
                  We never send it to our servers.
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    GitHub Personal Access Token
                  </label>
                  <input
                    type="password"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'monospace'
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleTokenSubmit();
                      }
                    }}
                  />
                  <small style={{ display: 'block', marginTop: '8px', color: '#666' }}>
                    Paste the token you just copied from GitHub (starts with "ghp_"). You can also reuse an existing AbsoluteScenes token if you have one.
                  </small>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <button
                    onClick={() => setStep(2)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleTokenSubmit}
                    disabled={isValidating || !token.trim()}
                    style={{
                      flex: 2,
                      padding: '12px',
                      background: token.trim() ? '#2ea043' : '#ccc',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: (isValidating || !token.trim()) ? 'wait' : 'pointer',
                      opacity: (isValidating || !token.trim()) ? 0.7 : 1
                    }}
                  >
                    {isValidating ? '🔄 Connecting...' : '🚀 Connect to GitHub'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button 
              onClick={() => {
                setShowTokenSetup(false);
                setStep(1);
                setToken('');
                setError(null);
              }} 
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>📚 Book Backup & Sync</h2>
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

          {!isAuthenticated ? (
            <div className="github-setup">
              {(!book.title?.trim() || !book.author?.trim()) && (
                <div style={{
                  padding: '15px',
                  background: '#fff3cd',
                  border: '1px solid #ffeaa7',
                  borderRadius: '6px',
                  marginBottom: '20px',
                  fontSize: '14px',
                  color: '#856404'
                }}>
                  <strong>📝 Almost Ready!</strong> Please set your book title and author above before connecting to GitHub. This helps us create a properly named repository for your book.
                </div>
              )}
              <div style={{
                textAlign: 'center',
                padding: '20px',
                background: '#f8f9fa',
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
                <h3 style={{ margin: '0 0 12px 0', color: '#333' }}>Safe & Secure Book Backup</h3>
                <p style={{ margin: '0', color: '#666', lineHeight: '1.5' }}>
                  Keep your book safe with automatic cloud backup and version history.
                  Your work is always secure and never lost.
                </p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 12px 0' }}>✨ What you get:</h4>
                <ul style={{ margin: '0', paddingLeft: '20px', lineHeight: '1.6' }}>
                  <li><strong>Automatic backup</strong> - Your book is saved to the cloud</li>
                  <li><strong>Version history</strong> - See all your changes over time</li>
                  <li><strong>Access anywhere</strong> - View your work from any device</li>
                  <li><strong>Always free</strong> - No subscription required</li>
                </ul>
              </div>

              <div style={{
                padding: '15px',
                background: '#e3f2fd',
                borderRadius: '6px',
                marginBottom: '20px',
                fontSize: '14px'
              }}>
                <strong>🔐 Privacy & Security:</strong> We use GitHub's secure system. 
                Your work stays private, and you control who can access it.
              </div>

              <button
                onClick={handleStartSetup}
                disabled={!book.title?.trim() || !book.author?.trim()}
                style={{
                  width: '100%',
                  padding: '15px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  background: (!book.title?.trim() || !book.author?.trim()) ? '#ccc' : '#2ea043',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: (!book.title?.trim() || !book.author?.trim()) ? 'not-allowed' : 'pointer',
                  opacity: (!book.title?.trim() || !book.author?.trim()) ? 0.6 : 1,
                  transition: 'all 0.2s ease'
                }}
              >
                <span style={{ marginRight: '8px' }}>🚀</span>
                Get Started - It's Free!
              </button>

              <div style={{
                textAlign: 'center',
                marginTop: '16px',
                fontSize: '13px',
                color: '#666'
              }}>
                Don't have a GitHub account? 
                <a 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    openGitHubSignup();
                  }}
                  style={{ color: '#0969da', textDecoration: 'none' }}
                >
                  Create one free here
                </a>
                <br />It takes less than 2 minutes!
              </div>
            </div>
          ) : (
            <div className="github-connected">
              <div style={{
                padding: '16px',
                background: '#d4edda',
                border: '1px solid #c3e6cb',
                borderRadius: '6px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '20px', marginRight: '8px' }}>✅</span>
                  <strong style={{ color: '#155724' }}>Connected to GitHub</strong>
                </div>
                <div style={{ fontSize: '14px', color: '#155724' }}>
                  Signed in as <strong>{userInfo?.login}</strong>
                </div>
              </div>

              {currentRepository ? (
                <div>
                  <div style={{
                    padding: '16px',
                    background: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    marginBottom: '20px'
                  }}>
                    <h4 style={{ margin: '0 0 8px 0' }}>📖 Book Repository</h4>
                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
                      <strong>Name:</strong> {currentRepository.name}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={openRepositoryInBrowser}
                        style={{
                          padding: '8px 12px',
                          background: '#0969da',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        🌐 View on GitHub
                      </button>
                      <button
                        onClick={handleSyncToGitHub}
                        disabled={isSyncing}
                        style={{
                          padding: '8px 12px',
                          background: '#2ea043',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: isSyncing ? 'wait' : 'pointer',
                          opacity: isSyncing ? 0.7 : 1
                        }}
                      >
                        {isSyncing ? '🔄 Syncing...' : '💾 Sync Now'}
                      </button>
                    </div>
                  </div>

                  {lastSyncTime && (
                    <div style={{
                      padding: '12px',
                      background: '#e8f5e8',
                      borderRadius: '4px',
                      fontSize: '13px',
                      color: '#2d5a2d',
                      marginBottom: '16px'
                    }}>
                      ✅ Last synced: {lastSyncTime.toLocaleString()}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  {(!book.title?.trim() || !book.author?.trim()) && (
                    <div style={{
                      padding: '15px',
                      background: '#fff3cd',
                      border: '1px solid #ffeaa7',
                      borderRadius: '6px',
                      marginBottom: '20px',
                      fontSize: '14px',
                      color: '#856404'
                    }}>
                      <strong>📝 Required:</strong> Please set your book title and author above before creating a repository.
                    </div>
                  )}
                  
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>📂</div>
                  <h4 style={{ margin: '0 0 8px 0' }}>Setup Book Repository</h4>
                  <p style={{ margin: '0 0 16px 0', color: '#666', fontSize: '14px' }}>
                    We'll create a private repository for your book automatically.
                  </p>
                  <button
                    onClick={handleSetupRepository}
                    disabled={isSyncing || !book.title?.trim() || !book.author?.trim()}
                    style={{
                      padding: '12px 24px',
                      background: (!book.title?.trim() || !book.author?.trim()) ? '#ccc' : '#2ea043',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      cursor: (isSyncing || !book.title?.trim() || !book.author?.trim()) ? 'not-allowed' : 'pointer',
                      opacity: (isSyncing || !book.title?.trim() || !book.author?.trim()) ? 0.7 : 1
                    }}
                  >
                    {isSyncing ? '🔄 Setting up...' : '🚀 Setup Repository'}
                  </button>
                </div>
              )}

              <div style={{
                borderTop: '1px solid #eee',
                paddingTop: '16px',
                textAlign: 'center'
              }}>
                <button
                  onClick={handleDisconnect}
                  style={{
                    padding: '8px 16px',
                    background: 'transparent',
                    color: '#dc3545',
                    border: '1px solid #dc3545',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  🔓 Disconnect from GitHub
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">Close</button>
        </div>
      </div>
    </div>
  );
}

export default GitHubIntegration;