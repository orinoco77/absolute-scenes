/* eslint-disable jsx-a11y/anchor-is-valid */
import { useState, useEffect } from 'react';
import { BrowserEnhancedGitHubService } from '../utils/browserEnhancedGitHubService';
import GitHubService from '../utils/gitHubService';
import { ConflictResolution } from './ConflictResolution';

function GitHubIntegration({
  currentRepo,
  onGitHubSettingsUpdate,
  onGitHubSyncStatusUpdate,
  onClose,
  book,
  currentFilePath,
  onStatusMessage,
  onBookUpdate
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [showTokenSetup, setShowTokenSetup] = useState(false);
  const [token, setToken] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [currentRepository, setCurrentRepository] = useState(currentRepo);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1); // 1: intro, 2: token creation, 3: token input, 4: author name, 5: repo choice, 6: repo selection
  const [authorName, setAuthorName] = useState('');
  const [isSettingUpCollaboration, setIsSettingUpCollaboration] =
    useState(false);
  const [repositoryChoice, setRepositoryChoice] = useState(''); // 'new' or 'existing'
  const [availableRepos, setAvailableRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);

  // New collaboration state
  const [conflicts, setConflicts] = useState([]);
  const [enhancedService] = useState(() => new BrowserEnhancedGitHubService());
  const [pendingSyncData, setPendingSyncData] = useState(null);

  // Use sync time from book data
  const lastSyncTime = book.github?.lastSyncTime
    ? new Date(book.github.lastSyncTime)
    : null;

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

  useEffect(() => {
    // Cleanup enhanced service on unmount
    return () => {
      enhancedService.cleanup();
    };
  }, [enhancedService]);

  const handleStartSetup = async () => {
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

      // Advance to author name step instead of finishing
      setStep(4);
      setAuthorName(user.name || user.login || ''); // Pre-fill with GitHub name
    } catch (error) {
      console.error('Token validation failed:', error);
      setError(error.message);
    } finally {
      setIsValidating(false);
    }
  };

  const handleAuthorNameSubmit = async () => {
    if (!authorName.trim()) {
      setError('Please enter your author name or pseudonym');
      return;
    }

    // Advance to repository choice step
    setStep(5);
    setError(null);
  };

  const handleRepositoryChoice = async choice => {
    setRepositoryChoice(choice);
    setError(null);

    if (choice === 'new') {
      // Check if we need title/author for new repository creation
      if (!book.title?.trim() || !book.author?.trim()) {
        setError(
          'To create a new repository, please set your book title and author first. This ensures your repository has a meaningful name.'
        );
        return;
      }
      // Skip repository selection, go straight to final setup
      await handleFinalSetup();
    } else if (choice === 'existing') {
      // Load available repositories and advance to selection step
      setStep(6);
      await loadUserRepositories();
    }
  };

  const loadUserRepositories = async () => {
    setIsLoadingRepos(true);
    setError(null);

    try {
      const repos = await GitHubService.getUserRepositories();
      setAvailableRepos(repos);
    } catch (error) {
      console.error('Failed to load repositories:', error);
      setError(`Could not load repositories: ${error.message}`);
    } finally {
      setIsLoadingRepos(false);
    }
  };

  const handleRepositorySelection = async () => {
    if (!selectedRepo) {
      setError('Please select a repository');
      return;
    }

    // Find the full repository object from the selected name
    const repositoryObject = availableRepos.find(
      repo => repo.full_name === selectedRepo
    );
    if (!repositoryObject) {
      setError('Selected repository not found');
      return;
    }

    setCurrentRepository(repositoryObject);
    await handleFinalSetup();
  };

  const handleFinalSetup = async () => {
    setIsSettingUpCollaboration(true);
    setError(null);

    try {
      // Find the selected repository object from available repos
      let repositoryToStore = currentRepository;

      if (selectedRepo && !currentRepository) {
        // User selected an existing repository
        repositoryToStore = availableRepos.find(
          repo => repo.full_name === selectedRepo
        );
      }

      // Store the selected repository in book settings
      if (repositoryToStore) {
        setCurrentRepository(repositoryToStore);
        onGitHubSettingsUpdate({
          repository: repositoryToStore
        });
      }

      // Store author name and setup collaboration
      await setupCollaboration(authorName.trim());

      setShowTokenSetup(false);

      // Auto-setup repository for their book (only for new repos)
      if (
        book.title?.trim() &&
        book.author?.trim() &&
        repositoryChoice === 'new'
      ) {
        await handleSetupRepository();
      }
    } catch (error) {
      console.error('Collaboration setup failed:', error);
      setError(error.message);
    } finally {
      setIsSettingUpCollaboration(false);
    }
  };

  const setupCollaboration = async currentAuthorName => {
    try {
      // Store author name in GitHub settings
      onGitHubSettingsUpdate({
        authorName: currentAuthorName
      });

      // If we have a repository, check for other contributors
      if (currentRepository) {
        const contributors = await GitHubService.getRepositoryContributors(
          currentRepository.full_name
        );
        // Found contributors for collaboration detection

        const otherAuthors = contributors
          .filter(contrib => contrib.login !== userInfo.login)
          .map(contrib => contrib.name || contrib.login);

        const allAuthors = [currentAuthorName, ...otherAuthors];
        // Detected authors for collaboration setup

        // Determine collaboration settings
        const collaborationSettings = {
          enabled: allAuthors.length > 1,
          authors: allAuthors,
          currentAuthor: currentAuthorName,
          // Add a flag to allow manual enabling for testing
          canForceEnable: allAuthors.length === 1
        };

        // Store collaboration info in GitHub settings for now
        // (We'll need a better way to update the main collaboration object)
        onGitHubSettingsUpdate({
          collaboration: collaborationSettings
        });

        if (allAuthors.length > 1) {
          if (onStatusMessage) {
            onStatusMessage(
              `Collaboration enabled! Found ${allAuthors.length} contributors: ${allAuthors.join(', ')}`
            );
          }
        } else {
          if (onStatusMessage) {
            onStatusMessage(
              'Single author detected - collaboration features remain hidden'
            );
          }
        }
      } else {
        // No repository yet - single author for now
        const collaborationSettings = {
          enabled: false,
          authors: [currentAuthorName],
          currentAuthor: currentAuthorName
        };

        onGitHubSettingsUpdate({
          collaboration: collaborationSettings
        });
      }
    } catch (error) {
      console.warn('Could not analyze repository contributors:', error);
      // Continue with single author setup
      const collaborationSettings = {
        enabled: false,
        authors: [currentAuthorName],
        currentAuthor: currentAuthorName
      };

      onGitHubSettingsUpdate({
        collaboration: collaborationSettings
      });
    }
  };

  const handleSetupRepository = async () => {
    if (!isAuthenticated) return;

    // Validate that book has title and author before creating repo
    if (!book.title?.trim() || !book.author?.trim()) {
      setError(
        'Please set a book title and author before creating a repository. This ensures your repository has a meaningful name.'
      );
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
          filename =
            book.title
              .toLowerCase()
              .replace(/[^a-z0-9\s-]/g, '')
              .replace(/\s+/g, '-')
              .replace(/-+/g, '-')
              .replace(/^-|-$/g, '') + '.book';
        }

        await GitHubService.saveBookToRepository(
          repo,
          book,
          commitMessage,
          filename
        );
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

      if (onStatusMessage) onStatusMessage('Checking for conflicts...');

      // Use new enhanced collaboration service
      const result = await enhancedService.safeSyncWithRepository(
        currentRepository,
        book,
        commitMessage,
        currentFilePath
      );

      if (result.success) {
        // Sync completed without conflicts
        onGitHubSyncStatusUpdate({ lastSyncTime: new Date().toISOString() });
        if (result.mergedContent && onBookUpdate) {
          onBookUpdate(result.mergedContent);
          if (onStatusMessage)
            onStatusMessage('Sync completed with automatic merge!');
        } else {
          if (onStatusMessage) onStatusMessage('Sync completed successfully!');
        }

        // Clear status message after a short delay
        setTimeout(() => {
          if (onStatusMessage) onStatusMessage('');
        }, 2000);
      } else if (result.requiresResolution) {
        // Conflicts detected - show resolution UI
        setConflicts(result.conflicts);
        setPendingSyncData({
          repository: currentRepository,
          commitMessage,
          localBookData: book,
          filename:
            result.filename ||
            enhancedService.generateFilename(book, currentFilePath)
        });
        if (onStatusMessage)
          onStatusMessage(
            'Conflicts detected - please resolve them to continue sync.'
          );
      } else {
        // Sync failed for other reasons
        throw new Error(result.error || 'Sync failed');
      }
    } catch (error) {
      console.error('Sync failed:', error);
      setError(error.message);
      if (onStatusMessage) onStatusMessage('');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConflictResolution = async resolutions => {
    if (!pendingSyncData) return;

    setIsSyncing(true);
    if (onStatusMessage) onStatusMessage('Applying conflict resolutions...');

    try {
      const result = await enhancedService.resolveConflictsAndSync(
        pendingSyncData.repository,
        resolutions,
        pendingSyncData.localBookData,
        pendingSyncData.commitMessage,
        pendingSyncData.filename
      );

      if (result.success) {
        // Update book with resolved content
        if (result.mergedContent && onBookUpdate) {
          onBookUpdate(result.mergedContent);
        }

        onGitHubSyncStatusUpdate({ lastSyncTime: new Date().toISOString() });
        if (onStatusMessage)
          onStatusMessage('Conflicts resolved - sync completed!');

        // Clear conflict state
        setConflicts([]);
        setPendingSyncData(null);

        // Clear status message after a short delay
        setTimeout(() => {
          if (onStatusMessage) onStatusMessage('');
        }, 2000);
      } else {
        throw new Error(result.error || 'Failed to resolve conflicts');
      }
    } catch (error) {
      console.error('Conflict resolution failed:', error);
      setError(error.message);
      if (onStatusMessage) onStatusMessage('');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConflictCancel = () => {
    setConflicts([]);
    setPendingSyncData(null);
    if (onStatusMessage)
      onStatusMessage('Sync cancelled - conflicts not resolved.');
    setTimeout(() => {
      if (onStatusMessage) onStatusMessage('');
    }, 2000);
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
            <button onClick={onClose} className="close-btn">
              ×
            </button>
          </div>

          <div className="modal-content">
            {error && (
              <div
                className="github-error-message"
                style={{
                  padding: '12px',
                  borderRadius: '4px',
                  marginBottom: '20px'
                }}
              >
                <strong>⚠️ Error:</strong> {error}
              </div>
            )}

            {step === 2 && (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌐</div>
                <h3 style={{ margin: '0 0 12px 0' }}>
                  Step 1: Create Access Token
                </h3>
                <p
                  style={{
                    margin: '0 0 20px 0',
                    color: 'var(--color-text-muted)',
                    lineHeight: '1.5'
                  }}
                >
                  We've opened GitHub in your browser. Follow these simple
                  steps:
                </p>
                <div
                  className="github-setup-instructions"
                  style={{
                    textAlign: 'left',
                    padding: '16px',
                    borderRadius: '6px',
                    marginBottom: '20px'
                  }}
                >
                  <div
                    className="github-setup-tip"
                    style={{
                      padding: '12px',
                      borderRadius: '4px',
                      marginBottom: '12px',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}
                  >
                    💡 Important: Don't change anything on the GitHub page!
                  </div>
                  <ol
                    style={{
                      margin: 0,
                      paddingLeft: '20px',
                      lineHeight: '1.6'
                    }}
                  >
                    <li>
                      ✅ All settings are pre-configured perfectly for you
                    </li>
                    <li>
                      📅 The expiration date is optional ("No expiration" is
                      fine)
                    </li>
                    <li>🟢 Simply scroll down and click "Generate token"</li>
                    <li>📋 Copy the token that appears (starts with "ghp_")</li>
                  </ol>
                  <div
                    className="github-reconnect-tip"
                    style={{
                      padding: '12px',
                      borderRadius: '4px',
                      marginTop: '12px',
                      fontSize: '13px'
                    }}
                  >
                    <strong>💡 Reconnecting?</strong> If you have an existing
                    AbsoluteScenes token, you can use that instead of creating a
                    new one.
                  </div>
                </div>
                <button
                  onClick={() => setStep(3)}
                  style={{
                    padding: '12px 24px',
                    background: 'var(--color-success)',
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
                <h3 style={{ margin: '0 0 16px 0', textAlign: 'center' }}>
                  Step 2: Enter Your Token
                </h3>
                <div
                  className="github-privacy-note"
                  style={{
                    padding: '16px',
                    borderRadius: '6px',
                    marginBottom: '16px',
                    fontSize: '14px'
                  }}
                >
                  <strong>🔐 Privacy Note:</strong> Your token is stored locally
                  on your computer only. We never send it to our servers.
                </div>
                <div className="form-group">
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: 'bold'
                    }}
                  >
                    GitHub Personal Access Token
                  </label>
                  <input
                    type="password"
                    value={token}
                    onChange={e => setToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid var(--color-border)',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'var(--font-family-primary)'
                    }}
                    onKeyPress={e => {
                      if (e.key === 'Enter') {
                        handleTokenSubmit();
                      }
                    }}
                  />
                  <small
                    style={{
                      display: 'block',
                      marginTop: '8px',
                      color: 'var(--color-text-muted)'
                    }}
                  >
                    Paste the token you just copied from GitHub (starts with
                    "ghp_"). You can also reuse an existing AbsoluteScenes token
                    if you have one.
                  </small>
                </div>
                <div
                  style={{ display: 'flex', gap: '12px', marginTop: '20px' }}
                >
                  <button
                    onClick={() => setStep(2)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: 'var(--color-secondary)',
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
                      background: token.trim()
                        ? 'var(--color-success)'
                        : 'var(--color-surface-disabled)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor:
                        isValidating || !token.trim() ? 'wait' : 'pointer',
                      opacity: isValidating || !token.trim() ? 0.7 : 1
                    }}
                  >
                    {isValidating ? (
                      <>
                        <span className="emoji-text">🔄 Connecting...</span>
                        <span className="dark-text">🔄 Connecting...</span>
                      </>
                    ) : (
                      <>
                        <span className="emoji-text">🚀 Connect to GitHub</span>
                        <span className="dark-text">🔗 Connect</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <h3 style={{ margin: '0 0 16px 0', textAlign: 'center' }}>
                  Final Step: Your Author Name
                </h3>
                <div
                  className="github-success-status"
                  style={{
                    padding: '15px',
                    borderRadius: '6px',
                    marginBottom: '20px'
                  }}
                >
                  <p style={{ margin: '0 0 10px 0' }}>
                    ✅ <strong>GitHub connection successful!</strong>
                  </p>
                  <p
                    style={{
                      margin: '0',
                      fontSize: '14px',
                      color: 'var(--color-text-muted)'
                    }}
                  >
                    How would you like to be identified in collaborative
                    writing? This can be your real name or a pseudonym.
                  </p>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: 'bold'
                    }}
                  >
                    Your Author Name:
                  </label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={e => setAuthorName(e.target.value)}
                    placeholder="e.g., Jane Smith, J.K. Writer, etc."
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid var(--color-border)',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    onKeyPress={e => {
                      if (e.key === 'Enter') {
                        handleAuthorNameSubmit();
                      }
                    }}
                  />
                  <small
                    style={{
                      display: 'block',
                      marginTop: '8px',
                      color: 'var(--color-text-muted)'
                    }}
                  >
                    This name will be used for scene assignments and
                    collaboration features.
                  </small>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setStep(3)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: 'var(--color-secondary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleAuthorNameSubmit}
                    disabled={isSettingUpCollaboration || !authorName.trim()}
                    style={{
                      flex: 2,
                      padding: '12px',
                      background: authorName.trim()
                        ? 'var(--color-success)'
                        : 'var(--color-surface-disabled)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor:
                        isSettingUpCollaboration || !authorName.trim()
                          ? 'wait'
                          : 'pointer'
                    }}
                  >
                    {isSettingUpCollaboration
                      ? '🔄 Setting up...'
                      : '✅ Complete Setup'}
                  </button>
                </div>
              </div>
            )}

            {step === 5 && (
              <div>
                <h3 style={{ margin: '0 0 16px 0', textAlign: 'center' }}>
                  Repository Setup
                </h3>
                <div
                  className="github-repo-setup-info"
                  style={{
                    padding: '15px',
                    borderRadius: '6px',
                    marginBottom: '20px'
                  }}
                >
                  <p style={{ margin: '0 0 10px 0' }}>
                    <strong>Choose how to set up your book repository:</strong>
                  </p>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <div
                    className={`github-repo-choice ${repositoryChoice === 'new' ? 'selected' : ''}`}
                    onClick={() => handleRepositoryChoice('new')}
                    style={{
                      padding: '20px',
                      borderRadius: '8px',
                      marginBottom: '15px',
                      cursor: 'pointer'
                    }}
                  >
                    <h4 style={{ margin: '0 0 8px 0' }}>
                      📝 Create New Repository
                    </h4>
                    <p
                      style={{
                        margin: '0',
                        fontSize: '14px',
                        color: 'var(--color-text-muted)'
                      }}
                    >
                      Perfect for starting a new book project. We'll create a
                      new repository for you.
                    </p>
                  </div>

                  <div
                    className={`github-repo-choice ${repositoryChoice === 'existing' ? 'selected' : ''}`}
                    onClick={() => handleRepositoryChoice('existing')}
                    style={{
                      padding: '20px',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <h4 style={{ margin: '0 0 8px 0' }}>
                      👥 Join Existing Repository
                    </h4>
                    <p
                      style={{
                        margin: '0',
                        fontSize: '14px',
                        color: 'var(--color-text-muted)'
                      }}
                    >
                      Connect to a book that already exists. Great for
                      collaborative writing!
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setStep(4)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: 'var(--color-secondary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    ← Back
                  </button>
                </div>
              </div>
            )}

            {step === 6 && (
              <div>
                <h3 style={{ margin: '0 0 16px 0', textAlign: 'center' }}>
                  Select Repository
                </h3>
                <div
                  className="github-repo-select-info"
                  style={{
                    padding: '15px',
                    borderRadius: '6px',
                    marginBottom: '20px'
                  }}
                >
                  <p style={{ margin: '0', fontSize: '14px' }}>
                    <strong>Choose a repository to collaborate on:</strong>
                  </p>
                </div>

                {isLoadingRepos ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <div>🔄 Loading your repositories...</div>
                  </div>
                ) : (
                  <div style={{ marginBottom: '20px' }}>
                    <div
                      style={{
                        maxHeight: '300px',
                        overflowY: 'auto',
                        border: '1px solid var(--color-border)',
                        borderRadius: '6px'
                      }}
                    >
                      {availableRepos.length === 0 ? (
                        <div
                          style={{
                            padding: '20px',
                            textAlign: 'center',
                            color: 'var(--color-text-muted)'
                          }}
                        >
                          No repositories found. You may need to be added as a
                          collaborator to existing book projects.
                        </div>
                      ) : (
                        availableRepos.map(repo => (
                          <div
                            key={repo.full_name}
                            onClick={() => setSelectedRepo(repo.full_name)}
                            style={{
                              padding: '15px',
                              borderBottom: '1px solid var(--color-border)',
                              cursor: 'pointer',
                              background:
                                selectedRepo === repo.full_name
                                  ? 'var(--color-success-background)'
                                  : 'white'
                            }}
                          >
                            <div
                              style={{
                                fontWeight: 'bold',
                                marginBottom: '5px'
                              }}
                            >
                              {repo.private ? '🔒' : '📖'} {repo.name}
                            </div>
                            <div
                              style={{
                                fontSize: '12px',
                                color: 'var(--color-text-muted)'
                              }}
                            >
                              {repo.full_name}
                            </div>
                            {repo.description && (
                              <div
                                style={{
                                  fontSize: '13px',
                                  color: 'var(--color-text-muted)',
                                  marginTop: '5px'
                                }}
                              >
                                {repo.description}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setStep(5)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: 'var(--color-secondary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleRepositorySelection}
                    disabled={!selectedRepo || isSettingUpCollaboration}
                    style={{
                      flex: 2,
                      padding: '12px',
                      background:
                        selectedRepo && !isSettingUpCollaboration
                          ? 'var(--color-success)'
                          : 'var(--color-surface-disabled)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor:
                        selectedRepo && !isSettingUpCollaboration
                          ? 'pointer'
                          : 'not-allowed'
                    }}
                  >
                    {isSettingUpCollaboration
                      ? '🔄 Connecting...'
                      : '✅ Connect to Repository'}
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
          <button onClick={onClose} className="close-btn">
            ×
          </button>
        </div>

        <div className="modal-content">
          {error && (
            <div
              className="github-error-message"
              style={{
                padding: '12px',
                borderRadius: '4px',
                marginBottom: '20px'
              }}
            >
              <strong>⚠️ Error:</strong> {error}
            </div>
          )}

          {!isAuthenticated ? (
            <div className="github-setup">
              <div
                className="github-intro-panel"
                style={{
                  textAlign: 'center',
                  padding: '20px',
                  borderRadius: '8px',
                  marginBottom: '20px'
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
                <h3
                  style={{ margin: '0 0 12px 0', color: 'var(--color-text)' }}
                >
                  Safe & Secure Book Backup
                </h3>
                <p
                  style={{
                    margin: '0',
                    color: 'var(--color-text-muted)',
                    lineHeight: '1.5'
                  }}
                >
                  Keep your book safe with automatic cloud backup and version
                  history. Your work is always secure and never lost.
                </p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 12px 0' }}>✨ What you get:</h4>
                <ul
                  style={{
                    margin: '0',
                    paddingLeft: '20px',
                    lineHeight: '1.6'
                  }}
                >
                  <li>
                    <strong>Automatic backup</strong> - Your book is saved to
                    the cloud
                  </li>
                  <li>
                    <strong>Version history</strong> - See all your changes over
                    time
                  </li>
                  <li>
                    <strong>Access anywhere</strong> - View your work from any
                    device
                  </li>
                  <li>
                    <strong>Always free</strong> - No subscription required
                  </li>
                </ul>
              </div>

              <div
                className="github-privacy-info"
                style={{
                  padding: '15px',
                  borderRadius: '6px',
                  marginBottom: '20px',
                  fontSize: '14px'
                }}
              >
                <strong>🔐 Privacy & Security:</strong> We use GitHub's secure
                system. Your work stays private, and you control who can access
                it.
              </div>

              <button
                onClick={handleStartSetup}
                style={{
                  width: '100%',
                  padding: '15px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  background: 'var(--color-success)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <span style={{ marginRight: '8px' }}>🚀</span>
                Get Started - It's Free!
              </button>

              <div
                style={{
                  textAlign: 'center',
                  marginTop: '16px',
                  fontSize: '13px',
                  color: 'var(--color-text-muted)'
                }}
              >
                Don't have a GitHub account?
                <a
                  href="#"
                  onClick={e => {
                    e.preventDefault();
                    openGitHubSignup();
                  }}
                  style={{
                    color: 'var(--color-primary)',
                    textDecoration: 'none'
                  }}
                >
                  Create one free here
                </a>
                <br />
                It takes less than 2 minutes!
              </div>
            </div>
          ) : (
            <div className="github-connected">
              <div
                id="github-connection-status"
                style={{
                  padding: '16px',
                  borderRadius: '6px',
                  marginBottom: '20px'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}
                >
                  <span style={{ fontSize: '20px', marginRight: '8px' }}>
                    ✅
                  </span>
                  <strong style={{ color: 'var(--color-success)' }}>
                    Connected to GitHub
                  </strong>
                </div>
                <div
                  style={{ fontSize: '14px', color: 'var(--color-success)' }}
                >
                  Signed in as <strong>{userInfo?.login}</strong>
                </div>
              </div>

              {currentRepository ? (
                <div>
                  <div
                    className="github-repo-info"
                    style={{
                      padding: '16px',
                      borderRadius: '6px',
                      marginBottom: '20px'
                    }}
                  >
                    <h4 style={{ margin: '0 0 8px 0' }}>📖 Book Repository</h4>
                    <div
                      style={{
                        fontSize: '14px',
                        color: 'var(--color-text-muted)',
                        marginBottom: '12px'
                      }}
                    >
                      <strong>Name:</strong> {currentRepository.name}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={openRepositoryInBrowser}
                        style={{
                          padding: '8px 12px',
                          background: 'var(--color-primary)',
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
                          background: 'var(--color-success)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: isSyncing ? 'wait' : 'pointer',
                          opacity: isSyncing ? 0.7 : 1
                        }}
                      >
                        {isSyncing ? (
                          <>
                            <span className="emoji-text">🔄 Syncing...</span>
                            <span className="dark-text">🔄 Syncing...</span>
                          </>
                        ) : (
                          <>
                            <span className="emoji-text">💾 Sync Now</span>
                            <span className="dark-text">💾 Sync</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {lastSyncTime && (
                    <div
                      className="github-sync-status"
                      style={{
                        padding: '12px',
                        borderRadius: '4px',
                        fontSize: '13px',
                        marginBottom: '16px'
                      }}
                    >
                      ✅ Last synced: {lastSyncTime.toLocaleString()}
                    </div>
                  )}

                  {/* Collaboration Testing Section */}
                  {(() => {
                    const collaboration = book.github?.collaboration;
                    const shouldShow =
                      collaboration &&
                      !collaboration.enabled &&
                      collaboration.authors?.length === 1;
                    // Checking collaboration testing section visibility
                    return shouldShow;
                  })() && (
                    <div
                      className="github-collab-testing"
                      style={{
                        padding: '12px',
                        borderRadius: '4px',
                        marginTop: '16px'
                      }}
                    >
                      <h5
                        style={{
                          margin: '0 0 8px 0',
                          color: 'var(--color-warning)'
                        }}
                      >
                        🧪 Collaboration Testing
                      </h5>
                      <p
                        style={{
                          margin: '0 0 12px 0',
                          fontSize: '13px',
                          color: 'var(--color-warning)'
                        }}
                      >
                        This repository has only 1 contributor. You can enable
                        collaboration mode for testing:
                      </p>
                      <button
                        onClick={() => {
                          const testCollaboration = {
                            enabled: true,
                            authors: [
                              book.github.collaboration.currentAuthor,
                              'Test Author'
                            ],
                            currentAuthor:
                              book.github.collaboration.currentAuthor,
                            isTestMode: true
                          };
                          onGitHubSettingsUpdate({
                            collaboration: testCollaboration
                          });
                        }}
                        style={{
                          padding: '6px 12px',
                          background: 'var(--color-warning)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        🧪 Enable Test Collaboration Mode
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>
                    📂
                  </div>
                  <h4 style={{ margin: '0 0 8px 0' }}>Setup Book Repository</h4>
                  <p
                    style={{
                      margin: '0 0 16px 0',
                      color: 'var(--color-text-muted)',
                      fontSize: '14px'
                    }}
                  >
                    We'll create a private repository for your book
                    automatically.
                  </p>
                  <button
                    onClick={handleSetupRepository}
                    disabled={
                      isSyncing || !book.title?.trim() || !book.author?.trim()
                    }
                    style={{
                      padding: '12px 24px',
                      background:
                        !book.title?.trim() || !book.author?.trim()
                          ? 'var(--color-surface-disabled)'
                          : 'var(--color-success)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      cursor:
                        isSyncing || !book.title?.trim() || !book.author?.trim()
                          ? 'not-allowed'
                          : 'pointer',
                      opacity:
                        isSyncing || !book.title?.trim() || !book.author?.trim()
                          ? 0.7
                          : 1
                    }}
                  >
                    {isSyncing ? '🔄 Setting up...' : '🚀 Setup Repository'}
                  </button>

                  <div
                    style={{
                      margin: '12px 0',
                      color: 'var(--color-text-muted)',
                      fontSize: '13px'
                    }}
                  >
                    or
                  </div>

                  <button
                    onClick={() => {
                      // Jump to repository selection flow
                      setRepositoryChoice('existing');
                      setStep(6);
                      setShowTokenSetup(true); // Show the step-based UI
                      loadUserRepositories();
                    }}
                    disabled={isSyncing}
                    style={{
                      padding: '10px 20px',
                      background: 'var(--color-primary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      cursor: isSyncing ? 'not-allowed' : 'pointer',
                      opacity: isSyncing ? 0.7 : 1
                    }}
                  >
                    📥 Join Existing Repository
                  </button>
                </div>
              )}

              <div
                style={{
                  borderTop: '1px solid var(--color-border)',
                  paddingTop: '16px',
                  textAlign: 'center'
                }}
              >
                <button
                  onClick={handleDisconnect}
                  style={{
                    padding: '8px 16px',
                    background: 'transparent',
                    color: 'var(--color-error)',
                    border: '1px solid var(--color-error)',
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
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>

      {/* Conflict Resolution UI */}
      {conflicts.length > 0 && (
        <ConflictResolution
          conflicts={conflicts}
          onResolve={handleConflictResolution}
          onCancel={handleConflictCancel}
        />
      )}
    </div>
  );
}

export default GitHubIntegration;
