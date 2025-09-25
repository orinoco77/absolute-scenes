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
   * Start the streamlined GitHub connection flow
   */
  async startConnectionFlow() {
    if (!this.isElectron) {
      throw new Error(
        'GitHub integration is only available in the desktop app'
      );
    }

    const { shell } = window.require('electron');

    // Create a unique token name with timestamp to avoid conflicts
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .slice(0, 19);
    const tokenName = `AbsoluteScenes-Book-Writer-${timestamp}`;
    const tokenDescription = `Token for AbsoluteScenes Book Writer App (Created: ${new Date().toLocaleString()})`;

    // Open GitHub token creation page with pre-filled settings and unique name
    const tokenUrl =
      'https://github.com/settings/tokens/new?' +
      'scopes=repo,user:email&' +
      `description=${encodeURIComponent(tokenDescription)}&` +
      `note=${encodeURIComponent(tokenName)}`;

    await shell.openExternal(tokenUrl);
    return true;
  }

  /**
   * Validate and setup GitHub token
   */
  async validateAndSetupToken(token) {
    if (!token || !token.startsWith('ghp_')) {
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
            'Invalid token. Please check that you copied it correctly.'
          );
        } else if (response.status === 403) {
          throw new Error(
            'Token lacks required permissions. Please ensure "repo" and "user:email" scopes are selected.'
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
   * Save book content to repository
   */
  async saveBookToRepository(
    repo,
    bookData,
    commitMessage = 'Auto-save from AbsoluteScenes',
    filename = 'manuscript.book'
  ) {
    if (!this.token) {
      throw new Error('Not authenticated');
    }

    try {
      // Prepare file content with normalized line endings (always use LF)
      const rawContent = JSON.stringify(bookData, null, 2);
      const fileContent = rawContent
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n');
      const fileName = filename;

      // Get current file (if exists) to get SHA for update
      let fileSha = null;
      try {
        const fileResponse = await fetch(
          `https://api.github.com/repos/${repo.full_name}/contents/${fileName}`,
          {
            headers: {
              Authorization: `Bearer ${this.token}`,
              Accept: 'application/vnd.github.v3+json',
              'User-Agent': 'AbsoluteScenes-BookWriter'
            }
          }
        );

        if (fileResponse.ok) {
          const fileData = await fileResponse.json();
          fileSha = fileData.sha;
        } else if (fileResponse.status === 404) {
          // File doesn't exist yet - this is expected for new files
          console.log(`Creating new file: ${fileName}`);
        } else {
          console.warn(
            `Unexpected response when checking for existing file: ${fileResponse.status}`
          );
        }
      } catch (error) {
        // Network error or other issue - proceed without SHA (will create new file)
        console.log(`File check failed, creating new file: ${fileName}`);
      }

      // Create or update file
      const updateData = {
        message: commitMessage,
        content: btoa(unescape(encodeURIComponent(fileContent))), // Proper UTF-8 to Base64
        branch: 'main'
      };

      if (fileSha) {
        updateData.sha = fileSha; // Required for updates
      }

      const response = await fetch(
        `https://api.github.com/repos/${repo.full_name}/contents/${fileName}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${this.token}`,
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'AbsoluteScenes-BookWriter',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateData)
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.message || `Failed to save to repository: ${response.status}`
        );
      }

      const result = await response.json();
      console.log('Saved to repository:', result.commit.html_url);
      return result;
    } catch (error) {
      console.error('Failed to save to repository:', error);
      throw error;
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

  /**
   * Get all repositories for backup recovery
   */
  async getUserRepositoriesForRecovery() {
    if (!this.token) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await fetch(
        'https://api.github.com/user/repos?type=owner&sort=updated&per_page=100',
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

      // Filter for repositories that likely contain book files
      const bookRepos = [];
      for (const repo of repos) {
        try {
          const hasBookFile = await this.checkRepositoryForBookFile(repo);
          if (hasBookFile) {
            bookRepos.push({
              ...repo,
              bookFile: hasBookFile
            });
          }
        } catch (error) {
          // Skip repos we can't access
          continue;
        }
      }

      return bookRepos;
    } catch (error) {
      console.error('Failed to get repositories:', error);
      throw error;
    }
  }

  /**
   * Check if repository contains a .book file
   */
  async checkRepositoryForBookFile(repo) {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${repo.full_name}/contents`,
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'AbsoluteScenes-BookWriter'
          }
        }
      );

      if (response.status === 404) {
        // Repository is empty or inaccessible - this is normal
        return null;
      }

      if (!response.ok) {
        // Other error - log for debugging but don't fail
        console.warn(
          `Could not check repository ${repo.full_name}: ${response.status}`
        );
        return null;
      }

      const contents = await response.json();

      // Look for .book files
      const bookFile = contents.find(
        file => file.type === 'file' && file.name.endsWith('.book')
      );

      return bookFile || null;
    } catch (error) {
      // Network error or parsing issue
      return null;
    }
  }

  /**
   * Download book file from repository with retry logic
   */
  async downloadBookFromRepository(repo, bookFile, retryCount = 0) {
    if (!this.token) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await fetch(
        `https://api.github.com/repos/${repo.full_name}/contents/${bookFile.name}`,
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'AbsoluteScenes-BookWriter'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.status}`);
      }

      const fileData = await response.json();

      // Check if content exists - if not, file might be too large for inline content
      let rawContent;

      if (!fileData.content) {
        // Use Git Data API to get blob content (stays within CSP domain)
        const blobResponse = await fetch(
          `https://api.github.com/repos/${repo.full_name}/git/blobs/${fileData.sha}`,
          {
            headers: {
              Authorization: `Bearer ${this.token}`,
              Accept: 'application/vnd.github.v3+json',
              'User-Agent': 'AbsoluteScenes-BookWriter'
            }
          }
        );

        if (!blobResponse.ok) {
          throw new Error(
            `Failed to download large file via Git API: ${blobResponse.status}`
          );
        }

        const blobData = await blobResponse.json();

        if (!blobData.content) {
          throw new Error('Git API returned no content for the blob');
        }

        // Decode the base64 content from Git API
        const base64Content = blobData.content.replace(/\s/g, '');
        const binaryString = atob(base64Content);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        rawContent = new TextDecoder('utf-8').decode(bytes);
      } else {
        // Decode base64 content with proper UTF-8 handling
        const base64Content = fileData.content.replace(/\s/g, '');

        try {
          // Always use proper UTF-8 decoding for consistency
          const binaryString = atob(base64Content);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          rawContent = new TextDecoder('utf-8').decode(bytes);
        } catch (decodeError) {
          console.error('Base64 decode error:', decodeError);
          throw new Error('Failed to decode file content from GitHub');
        }
      }

      // Normalize line endings to LF (consistent across platforms)
      const content = rawContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

      // Parse and return book data
      try {
        const bookData = JSON.parse(content);

        // Validate that this looks like a book file
        if (!bookData || typeof bookData !== 'object') {
          throw new Error('Downloaded content is not a valid object');
        }

        return {
          bookData,
          filename: bookFile.name,
          lastModified: fileData.sha
        };
      } catch (parseError) {
        throw new Error(
          `Downloaded file is not a valid book format: ${parseError.message}`
        );
      }
    } catch (error) {
      console.error('Failed to download book:', error);

      // Retry logic for transient errors (up to 2 retries with exponential backoff)
      if (
        retryCount < 2 &&
        (error.message.includes('Failed to download file') ||
          error.message.includes('not a valid book format') ||
          error.message.includes('Failed to decode'))
      ) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s delays
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.downloadBookFromRepository(repo, bookFile, retryCount + 1);
      }

      throw error;
    }
  }
}

// Export singleton instance
export default new GitHubService();
