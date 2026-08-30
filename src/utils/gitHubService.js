/* eslint-disable import/no-anonymous-default-export */
/**
 * Streamlined GitHub Integration Service
 * Handles token-based authentication and repository management for non-technical users
 */

class GitHubService {
  constructor() {
    this.token = null;
    this.userInfo = null;
    this.isElectron =
      typeof window !== 'undefined' && typeof window.require === 'function';
    this._hasCheckedStoredAuth = false; // Track if we've tried loading stored auth
  }

  /**
   * Check if user is authenticated (with automatic auth loading)
   */
  isAuthenticated() {
    // Auto-load stored auth if we haven't checked yet
    if (!this.token && !this._hasCheckedStoredAuth) {
      console.log('🔄 Auto-loading stored GitHub authentication...');
      this._hasCheckedStoredAuth = true;
      const loaded = this.loadStoredAuth();
      console.log('🔄 Auth auto-load result:', {
        loaded,
        hasToken: !!this.token,
        hasUserInfo: !!this.userInfo
      });
    }
    return !!this.token;
  }

  /**
   * Get stored authentication from localStorage
   */
  loadStoredAuth() {
    try {
      const storedAuth = localStorage.getItem('github_auth');
      if (storedAuth) {
        const authData = JSON.parse(storedAuth);
        this.token = authData.token;
        this.userInfo = authData.userInfo;
        return true;
      }
    } catch (error) {
      console.warn('Failed to load stored GitHub auth:', error);
    }
    return false;
  }

  /**
   * Store authentication securely
   */
  storeAuth(token, userInfo) {
    try {
      this.token = token;
      this.userInfo = userInfo;
      this._hasCheckedStoredAuth = true; // Mark as checked since we now have auth
      localStorage.setItem('github_auth', JSON.stringify({ token, userInfo }));
    } catch (error) {
      console.error('Failed to store GitHub auth:', error);
    }
  }

  /**
   * Clear stored authentication
   */
  clearAuth() {
    this.token = null;
    this.userInfo = null;
    this._hasCheckedStoredAuth = false; // Reset so we can check again later
    localStorage.removeItem('github_auth');
  }

  /**
   * Handle authentication errors with helpful user guidance
   */
  handleAuthError(error, response = null) {
    // If it's a 401 error, it's likely an expired or invalid token
    if (response?.status === 401 || error.message?.includes('401')) {
      // Clear the stored auth since it's no longer valid
      this.clearAuth();

      throw new Error(
        '🔑 Your GitHub token has expired or is invalid.\n\n' +
          'To fix this:\n' +
          '1. Click "Set Up GitHub Sync" to create a new token\n' +
          '2. Set expiration to "No expiration" (for long-term use)\n' +
          '3. Click "Generate token" and copy it\n\n' +
          'The "repo" permission is already selected for you!'
      );
    }

    // Re-throw other errors as-is
    throw error;
  }

  /**
   * Start the streamlined GitHub connection flow
   */
  async startConnectionFlow() {
    if (!this.isElectron) {
      throw new Error(
        'GitHub integration is only available in the desktop app'
      );
    }

    const { shell } = window.require('electron');

    // Create a descriptive token name
    const tokenDescription = `Absolute Scenes - Book Writing App (Created: ${new Date().toLocaleString()})`;

    // Use classic personal access tokens because they support URL parameters
    // to preset the scopes and settings - makes it easier for non-technical users
    // Classic tokens can also be set to "no expiration" just like fine-grained tokens
    const tokenUrl =
      'https://github.com/settings/tokens/new?' +
      `scopes=repo&` + // Preset 'repo' scope for full repository access
      `description=${encodeURIComponent(tokenDescription)}`;
    // Note: GitHub doesn't support setting expiration via URL, but we'll guide users to select "No expiration" in the UI

    await shell.openExternal(tokenUrl);
    return true;
  }

  /**
   * Validate and setup GitHub token
   */
  async validateAndSetupToken(token) {
    // Accept both classic (ghp_) and fine-grained (github_pat_) tokens for flexibility
    if (
      !token ||
      !(token.startsWith('ghp_') || token.startsWith('github_pat_'))
    ) {
      throw new Error(
        'Please enter a valid GitHub personal access token (starts with "ghp_")'
      );
    }

    // Test the token by getting user info
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'AbsoluteScenes-BookWriter'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            'Invalid or expired token. Please create a new token with "No expiration" selected.'
          );
        } else if (response.status === 403) {
          throw new Error(
            'Token lacks required permissions. Please ensure the "repo" scope is checked when creating the token.'
          );
        } else {
          throw new Error(`GitHub API error: ${response.status}`);
        }
      }

      const userInfo = await response.json();

      // Store the valid token
      this.storeAuth(token, userInfo);

      return userInfo;
    } catch (error) {
      console.error('Token validation failed:', error);
      throw error;
    }
  }

  /**
   * Get repository contributors for collaboration detection
   */
  async getRepositoryContributors(repository) {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated with GitHub');
    }

    try {
      const response = await fetch(
        `https://api.github.com/repos/${repository}/contributors`,
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'AbsoluteScenes-BookWriter'
          }
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Repository not found or no access permissions');
        }
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const contributors = await response.json();

      // Filter out bots and get user details for each contributor
      const realContributors = contributors.filter(
        contrib => contrib.type === 'User'
      );

      // Get detailed user info for each contributor (to get real names)
      const detailedContributors = await Promise.all(
        realContributors.map(async contrib => {
          try {
            const userResponse = await fetch(
              `https://api.github.com/users/${contrib.login}`,
              {
                headers: {
                  Authorization: `Bearer ${this.token}`,
                  Accept: 'application/vnd.github.v3+json',
                  'User-Agent': 'AbsoluteScenes-BookWriter'
                }
              }
            );

            if (userResponse.ok) {
              const userInfo = await userResponse.json();
              return {
                login: contrib.login,
                name: userInfo.name,
                contributions: contrib.contributions
              };
            }
          } catch (error) {
            console.warn(
              `Could not fetch details for ${contrib.login}:`,
              error
            );
          }

          // Fallback to basic info
          return {
            login: contrib.login,
            name: null,
            contributions: contrib.contributions
          };
        })
      );

      return detailedContributors;
    } catch (error) {
      console.error('Failed to get repository contributors:', error);
      throw error;
    }
  }

  /**
   * Get user's repositories for selection
   */
  async getUserRepositories() {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated with GitHub');
    }

    try {
      const response = await fetch(
        'https://api.github.com/user/repos?sort=updated&per_page=100',
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'AbsoluteScenes-BookWriter'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const repos = await response.json();

      // Return relevant repo info
      return repos.map(repo => ({
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        private: repo.private,
        updated_at: repo.updated_at,
        owner: repo.owner.login,
        clone_url: repo.clone_url,
        html_url: repo.html_url
      }));
    } catch (error) {
      console.error('Failed to get user repositories:', error);
      throw error;
    }
  }

  /**
   * Get user information
   */
  async getUserInfo() {
    if (!this.token) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${this.token}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'AbsoluteScenes-BookWriter'
        }
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get user info:', error);
      throw error;
    }
  }

  /**
   * Create or get repository for the book
   */
  async setupBookRepository(bookTitle, bookAuthor) {
    if (!this.token) {
      throw new Error('Not authenticated');
    }

    // Generate a clean repo name from book title
    const repoName = this.generateRepoName(bookTitle, bookAuthor);

    try {
      // First, check if repo already exists
      const existingRepo = await this.getRepository(repoName);
      if (existingRepo) {
        return existingRepo;
      }

      // Create new private repository
      const response = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'AbsoluteScenes-BookWriter',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: repoName,
          description: `Book manuscript: "${bookTitle}" by ${bookAuthor}`,
          private: true
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.message || `Failed to create repository: ${response.status}`
        );
      }

      const repo = await response.json();
      console.log('Created repository:', repo.full_name);
      return repo;
    } catch (error) {
      console.error('Failed to setup repository:', error);
      throw error;
    }
  }

  /**
   * Check if repository exists
   */
  async getRepository(repoName) {
    if (!this.token || !this.userInfo) {
      return null;
    }

    try {
      const response = await fetch(
        `https://api.github.com/repos/${this.userInfo.login}/${repoName}`,
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'AbsoluteScenes-BookWriter'
          }
        }
      );

      if (response.status === 404) {
        return null; // Repository doesn't exist
      }

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to check repository:', error);
      return null;
    }
  }

  /**
   * Generate a clean repository name from book title and author
   */
  generateRepoName(title, author) {
    const cleanTitle = (title || 'untitled-book')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Remove duplicate hyphens
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

    const cleanAuthor = (author || 'author')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .split('-')[0]; // Take first word only

    return `${cleanTitle}-by-${cleanAuthor}`.substring(0, 50); // GitHub repo name limit
  }

  /**
   * Get repository URL for viewing
   */
  getRepositoryUrl(repo) {
    return repo?.html_url || null;
  }

  /**
   * Disconnect from GitHub
   */
  disconnect() {
    this.clearAuth();
  }
}

// Export singleton instance
export default new GitHubService();
