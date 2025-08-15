/**
 * Cross-platform GitHub Integration Service
 * Works with React Web, React Native, and Electron
 */

class GitHubService {
  constructor() {
    this.token = null;
    this.userInfo = null;
    this.platform = this.detectPlatform();
    this._hasCheckedStoredAuth = false;
  }

  /**
   * Detect the current platform
   */
  detectPlatform() {
    if (typeof window === 'undefined') {
      return 'node';
    }
    if (typeof window.require === 'function') {
      return 'electron';
    }
    if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
      return 'react-native';
    }
    return 'web';
  }

  /**
   * Check if user is authenticated (with automatic auth loading)
   */
  isAuthenticated() {
    if (!this.token && !this._hasCheckedStoredAuth) {
      console.log('🔄 Auto-loading stored GitHub authentication...');
      this._hasCheckedStoredAuth = true;
      const loaded = this.loadStoredAuth();
      console.log('🔄 Auth auto-load result:', {
        loaded,
        hasToken: !!this.token,
        hasUserInfo: !!this.userInfo,
        platform: this.platform
      });
    }
    return !!this.token;
  }

  /**
   * Get stored authentication from appropriate storage
   */
  async loadStoredAuth() {
    try {
      let storedAuth = null;
      
      if (this.platform === 'react-native') {
        // Use AsyncStorage for React Native
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        storedAuth = await AsyncStorage.getItem('github_auth');
      } else if (typeof localStorage !== 'undefined') {
        // Use localStorage for web/electron
        storedAuth = localStorage.getItem('github_auth');
      }

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
  async storeAuth(token, userInfo) {
    try {
      this.token = token;
      this.userInfo = userInfo;
      this._hasCheckedStoredAuth = true;
      
      const authData = JSON.stringify({ token, userInfo });
      
      if (this.platform === 'react-native') {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem('github_auth', authData);
      } else if (typeof localStorage !== 'undefined') {
        localStorage.setItem('github_auth', authData);
      }
    } catch (error) {
      console.error('Failed to store GitHub auth:', error);
    }
  }

  /**
   * Clear stored authentication
   */
  async clearAuth() {
    this.token = null;
    this.userInfo = null;
    this._hasCheckedStoredAuth = false;
    
    try {
      if (this.platform === 'react-native') {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.removeItem('github_auth');
      } else if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('github_auth');
      }
    } catch (error) {
      console.error('Failed to clear GitHub auth:', error);
    }
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

    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'AbsoluteScenes-Mobile'
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
      await this.storeAuth(token, userInfo);
      return userInfo;
    } catch (error) {
      console.error('Token validation failed:', error);
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
            'User-Agent': 'AbsoluteScenes-Mobile'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const repos = await response.json();
      return repos.map(repo => ({
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        private: repo.private,
        updated_at: repo.updated_at,
        owner: repo.owner.login,
        html_url: repo.html_url
      }));
    } catch (error) {
      console.error('Failed to get user repositories:', error);
      throw error;
    }
  }

  /**
   * Download book file from repository
   */
  async downloadBookFromRepository(repoFullName, fileName = 'manuscript.book') {
    if (!this.token) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await fetch(
        `https://api.github.com/repos/${repoFullName}/contents/${fileName}`,
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'AbsoluteScenes-Mobile'
          }
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Book file not found in repository');
        }
        throw new Error(`Failed to download file: ${response.status}`);
      }

      const fileData = await response.json();

      // Decode base64 content with proper UTF-8 handling
      const base64Content = fileData.content.replace(/\s/g, '');
      const binaryString = atob(base64Content);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const rawContent = new TextDecoder('utf-8').decode(bytes);

      // Normalize line endings to LF
      const content = rawContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

      try {
        const bookData = JSON.parse(content);
        return {
          bookData,
          filename: fileName,
          lastModified: fileData.sha,
          repository: repoFullName
        };
      } catch (parseError) {
        throw new Error('Downloaded file is not a valid book format');
      }
    } catch (error) {
      console.error('Failed to download book:', error);
      throw error;
    }
  }

  /**
   * Save book content to repository
   */
  async saveBookToRepository(
    repoFullName,
    bookData,
    commitMessage = 'Mobile edit from AbsoluteScenes',
    fileName = 'manuscript.book'
  ) {
    if (!this.token) {
      throw new Error('Not authenticated');
    }

    try {
      // Prepare file content with normalized line endings
      const rawContent = JSON.stringify(bookData, null, 2);
      const fileContent = rawContent
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n');

      // Get current file SHA if it exists
      let fileSha = null;
      try {
        const fileResponse = await fetch(
          `https://api.github.com/repos/${repoFullName}/contents/${fileName}`,
          {
            headers: {
              Authorization: `Bearer ${this.token}`,
              Accept: 'application/vnd.github.v3+json',
              'User-Agent': 'AbsoluteScenes-Mobile'
            }
          }
        );

        if (fileResponse.ok) {
          const fileData = await fileResponse.json();
          fileSha = fileData.sha;
        }
      } catch (error) {
        console.log(`Creating new file: ${fileName}`);
      }

      // Create or update file
      const updateData = {
        message: commitMessage,
        content: btoa(
          new TextEncoder()
            .encode(fileContent)
            .reduce((data, byte) => data + String.fromCharCode(byte), '')
        ),
        branch: 'main'
      };

      if (fileSha) {
        updateData.sha = fileSha;
      }

      const response = await fetch(
        `https://api.github.com/repos/${repoFullName}/contents/${fileName}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${this.token}`,
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'AbsoluteScenes-Mobile',
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
   * Get repositories that contain book files
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
            'User-Agent': 'AbsoluteScenes-Mobile'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const repos = await response.json();
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
            'User-Agent': 'AbsoluteScenes-Mobile'
          }
        }
      );

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        return null;
      }

      const contents = await response.json();
      const bookFile = contents.find(
        file => file.type === 'file' && file.name.endsWith('.book')
      );

      return bookFile || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Disconnect from GitHub
   */
  async disconnect() {
    await this.clearAuth();
  }
}

// Export singleton instance
export default new GitHubService();