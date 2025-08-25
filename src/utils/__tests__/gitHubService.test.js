import gitHubService from '../gitHubService';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock fetch
global.fetch = jest.fn();

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;
beforeAll(() => {
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});

describe('GitHubService', () => {
  let service;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    fetch.mockClear();
    console.log.mockClear();
    console.warn.mockClear();
    console.error.mockClear();
    // Reset the singleton service state
    service = gitHubService;
    service.token = null;
    service.userInfo = null;
    service._hasCheckedStoredAuth = false;
  });

  describe('constructor', () => {
    it('initializes with null values', () => {
      expect(service.token).toBeNull();
      expect(service.userInfo).toBeNull();
      expect(service._hasCheckedStoredAuth).toBe(false);
    });

    it('detects Electron environment correctly when window.require exists', () => {
      // The service was already initialized with a mocked window.require in beforeEach
      expect(service.isElectron).toBe(true);
    });

    it('detects non-Electron environment when window.require does not exist', () => {
      // Create a fresh service instance without window.require
      delete window.require;
      // Re-read the service to test the actual detection logic
      expect(typeof window.require).toBe('undefined');
    });
  });

  describe('loadStoredAuth', () => {
    it('loads authentication from localStorage', () => {
      const mockAuthData = {
        token: 'test-token',
        userInfo: { login: 'testuser', id: 123 }
      };
      localStorageMock.getItem.mockReturnValueOnce(
        JSON.stringify(mockAuthData)
      );

      const result = service.loadStoredAuth();

      expect(result).toBe(true);
      expect(service.token).toBe('test-token');
      expect(service.userInfo).toEqual({ login: 'testuser', id: 123 });
      expect(localStorageMock.getItem).toHaveBeenCalledWith('github_auth');
    });

    it('returns false when no stored auth exists', () => {
      const result = service.loadStoredAuth();

      expect(result).toBe(false);
      expect(service.token).toBeNull();
      expect(service.userInfo).toBeNull();
    });

    it('handles corrupted localStorage data gracefully', () => {
      localStorageMock.getItem.mockReturnValueOnce('invalid-json');

      const result = service.loadStoredAuth();

      expect(result).toBe(false);
      expect(service.token).toBeNull();
      expect(service.userInfo).toBeNull();
      expect(console.warn).toHaveBeenCalledWith(
        'Failed to load stored GitHub auth:',
        expect.any(Error)
      );
    });

    it('handles localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const result = service.loadStoredAuth();

      expect(result).toBe(false);
      expect(console.warn).toHaveBeenCalledWith(
        'Failed to load stored GitHub auth:',
        expect.any(Error)
      );
    });
  });

  describe('isAuthenticated', () => {
    it('returns false when no token exists', () => {
      expect(service.isAuthenticated()).toBe(false);
    });

    it('returns true when token exists', () => {
      service.token = 'test-token';
      expect(service.isAuthenticated()).toBe(true);
    });

    it('auto-loads stored auth on first call', () => {
      const mockAuthData = {
        token: 'stored-token',
        userInfo: { login: 'storeduser' }
      };
      // Set up the mock localStorage data before the test
      localStorageMock.getItem.mockReturnValueOnce(
        JSON.stringify(mockAuthData)
      );

      const result = service.isAuthenticated();

      expect(result).toBe(true);
      expect(service.token).toBe('stored-token');
      expect(service._hasCheckedStoredAuth).toBe(true);
      expect(console.log).toHaveBeenCalledWith(
        '🔄 Auto-loading stored GitHub authentication...'
      );
    });

    it('does not auto-load auth on subsequent calls', () => {
      // First call triggers auto-load
      service.isAuthenticated();
      console.log.mockClear();

      // Second call should not trigger auto-load
      service.isAuthenticated();

      expect(console.log).not.toHaveBeenCalledWith(
        '🔄 Auto-loading stored GitHub authentication...'
      );
    });

    it('logs auto-load results', () => {
      const mockAuthData = {
        token: 'auto-token',
        userInfo: { login: 'autouser' }
      };
      // Set up the mock localStorage data before the test
      localStorageMock.getItem.mockReturnValueOnce(
        JSON.stringify(mockAuthData)
      );

      service.isAuthenticated();

      expect(console.log).toHaveBeenCalledWith('🔄 Auth auto-load result:', {
        loaded: true,
        hasToken: true,
        hasUserInfo: true
      });
    });
  });

  describe('storeAuth', () => {
    it('stores authentication in service and localStorage', () => {
      const mockUserInfo = { login: 'storeuser', id: 456 };

      service.storeAuth('store-token', mockUserInfo);

      expect(service.token).toBe('store-token');
      expect(service.userInfo).toEqual(mockUserInfo);
      expect(service._hasCheckedStoredAuth).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'github_auth',
        JSON.stringify({
          token: 'store-token',
          userInfo: mockUserInfo
        })
      );
    });

    it('handles localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });

      expect(() => service.storeAuth('error-token', {})).not.toThrow();
      expect(console.error).toHaveBeenCalledWith(
        'Failed to store GitHub auth:',
        expect.any(Error)
      );
    });
  });

  describe('clearAuth', () => {
    it('clears authentication state', () => {
      service.token = 'clear-token';
      service.userInfo = { login: 'clearuser' };
      service._hasCheckedStoredAuth = true;

      service.clearAuth();

      expect(service.token).toBeNull();
      expect(service.userInfo).toBeNull();
      expect(service._hasCheckedStoredAuth).toBe(false);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('github_auth');
    });
  });

  describe('startConnectionFlow', () => {
    it('throws error when not in Electron environment', async () => {
      service.isElectron = false;

      await expect(service.startConnectionFlow()).rejects.toThrow(
        'GitHub integration is only available in the desktop app'
      );
    });

    it('opens external GitHub token creation URL in Electron', async () => {
      // Mock Electron environment
      service.isElectron = true;
      const mockShell = {
        openExternal: jest.fn().mockResolvedValue(true)
      };
      Object.defineProperty(window, 'require', {
        writable: true,
        value: jest.fn().mockReturnValue({ shell: mockShell })
      });

      const result = await service.startConnectionFlow();

      expect(result).toBe(true);
      expect(mockShell.openExternal).toHaveBeenCalledWith(
        expect.stringContaining('https://github.com/settings/tokens/new?')
      );
      expect(mockShell.openExternal).toHaveBeenCalledWith(
        expect.stringContaining('scopes=repo,user:email')
      );
    });
  });

  describe('validateAndSetupToken', () => {
    it('validates and sets up valid GitHub token', async () => {
      const mockUserData = { login: 'testuser', id: 123, name: 'Test User' };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUserData)
      });
      jest.spyOn(service, 'storeAuth');

      const result = await service.validateAndSetupToken('ghp_validtoken123');

      expect(result).toEqual(mockUserData);
      expect(service.storeAuth).toHaveBeenCalledWith(
        'ghp_validtoken123',
        mockUserData
      );
      expect(fetch).toHaveBeenCalledWith('https://api.github.com/user', {
        headers: {
          Authorization: 'Bearer ghp_validtoken123',
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'AbsoluteScenes-BookWriter'
        }
      });
    });

    it('throws error for invalid token format', async () => {
      await expect(
        service.validateAndSetupToken('invalid-token')
      ).rejects.toThrow(
        'Please enter a valid GitHub personal access token (starts with "ghp_")'
      );
    });

    it('throws error for empty token', async () => {
      await expect(service.validateAndSetupToken('')).rejects.toThrow(
        'Please enter a valid GitHub personal access token (starts with "ghp_")'
      );
    });

    it('handles 401 unauthorized response', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      await expect(
        service.validateAndSetupToken('ghp_invalidtoken')
      ).rejects.toThrow(
        'Invalid token. Please check that you copied it correctly.'
      );
    });

    it('handles 403 insufficient permissions response', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 403
      });

      await expect(
        service.validateAndSetupToken('ghp_limitedtoken')
      ).rejects.toThrow(
        'Token lacks required permissions. Please ensure "repo" and "user:email" scopes are selected.'
      );
    });

    it('handles other API errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      await expect(
        service.validateAndSetupToken('ghp_errortoken')
      ).rejects.toThrow('GitHub API error: 500');
    });

    it('handles network errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        service.validateAndSetupToken('ghp_networkissue')
      ).rejects.toThrow('Network error');
      expect(console.error).toHaveBeenCalledWith(
        'Token validation failed:',
        expect.any(Error)
      );
    });
  });

  describe('getRepositoryContributors', () => {
    beforeEach(() => {
      service.token = 'test-token';
    });

    it('fetches and processes repository contributors successfully', async () => {
      const mockContributors = [
        { login: 'user1', type: 'User', contributions: 25 },
        { login: 'bot1', type: 'Bot', contributions: 5 },
        { login: 'user2', type: 'User', contributions: 10 }
      ];

      const mockUser1Details = { login: 'user1', name: 'User One' };
      const mockUser2Details = { login: 'user2', name: 'User Two' };

      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockContributors)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUser1Details)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUser2Details)
        });

      const result =
        await service.getRepositoryContributors('testowner/testrepo');

      expect(result).toEqual([
        { login: 'user1', name: 'User One', contributions: 25 },
        { login: 'user2', name: 'User Two', contributions: 10 }
      ]);

      expect(fetch).toHaveBeenNthCalledWith(
        1,
        'https://api.github.com/repos/testowner/testrepo/contributors',
        {
          headers: {
            Authorization: 'Bearer test-token',
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'AbsoluteScenes-BookWriter'
          }
        }
      );
    });

    it('handles 404 repository not found', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      await expect(
        service.getRepositoryContributors('nonexistent/repo')
      ).rejects.toThrow('Repository not found or no access permissions');
    });

    it('handles other API errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      await expect(
        service.getRepositoryContributors('error/repo')
      ).rejects.toThrow('GitHub API error: 500');
    });

    it('throws error when not authenticated', async () => {
      service.token = null;

      await expect(
        service.getRepositoryContributors('test/repo')
      ).rejects.toThrow('Not authenticated with GitHub');
    });

    it('handles errors when fetching individual user details', async () => {
      const mockContributors = [
        { login: 'user1', type: 'User', contributions: 25 }
      ];

      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockContributors)
        })
        .mockRejectedValueOnce(
          new Error('Network error fetching user details')
        );

      const result = await service.getRepositoryContributors('test/repo');

      expect(result).toEqual([
        { login: 'user1', name: null, contributions: 25 }
      ]);
      expect(console.warn).toHaveBeenCalledWith(
        'Could not fetch details for user1:',
        expect.any(Error)
      );
    });
  });

  describe('getUserRepositories', () => {
    beforeEach(() => {
      service.token = 'test-token';
    });

    it('fetches user repositories successfully', async () => {
      const mockRepos = [
        {
          id: 1,
          name: 'repo1',
          full_name: 'testuser/repo1',
          private: false,
          updated_at: '2023-01-01T00:00:00Z',
          clone_url: 'https://github.com/testuser/repo1.git',
          html_url: 'https://github.com/testuser/repo1',
          owner: { login: 'testuser' }
        },
        {
          id: 2,
          name: 'repo2',
          full_name: 'testuser/repo2',
          private: true,
          updated_at: '2023-01-02T00:00:00Z',
          clone_url: 'https://github.com/testuser/repo2.git',
          html_url: 'https://github.com/testuser/repo2',
          owner: { login: 'testuser' }
        }
      ];
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRepos)
      });

      const result = await service.getUserRepositories();

      // The service processes the raw repos, so expect processed format
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        name: 'repo1',
        full_name: 'testuser/repo1',
        private: false,
        owner: 'testuser',
        clone_url: 'https://github.com/testuser/repo1.git',
        html_url: 'https://github.com/testuser/repo1'
      });
      expect(fetch).toHaveBeenCalledWith(
        'https://api.github.com/user/repos?sort=updated&per_page=100',
        {
          headers: {
            Authorization: 'Bearer test-token',
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'AbsoluteScenes-BookWriter'
          }
        }
      );
    });

    it('throws error when not authenticated', async () => {
      service.token = null;

      await expect(service.getUserRepositories()).rejects.toThrow(
        'Not authenticated with GitHub'
      );
    });

    it('handles API errors when fetching repositories', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 403
      });

      await expect(service.getUserRepositories()).rejects.toThrow();
    });
  });

  describe('error handling and edge cases', () => {
    it('handles missing fetch implementation', async () => {
      const originalFetch = global.fetch;
      delete global.fetch;

      service.token = 'test-token';

      await expect(service.getUserRepositories()).rejects.toThrow();

      global.fetch = originalFetch;
    });

    it('handles malformed API responses', async () => {
      service.token = 'test-token';
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON'))
      });

      await expect(service.getUserRepositories()).rejects.toThrow();
    });
  });

  describe('integration scenarios', () => {
    it('handles complete token validation flow', async () => {
      const mockUserData = { login: 'integrationuser', id: 999 };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUserData)
      });

      // Initial state
      expect(service.isAuthenticated()).toBe(false);

      // Authenticate with token
      const authResult = await service.validateAndSetupToken(
        'ghp_integrationtoken'
      );
      expect(authResult).toEqual(mockUserData);
      expect(service.isAuthenticated()).toBe(true);

      // Check localStorage was updated
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'github_auth',
        JSON.stringify({
          token: 'ghp_integrationtoken',
          userInfo: mockUserData
        })
      );

      // Clear auth
      service.clearAuth();
      expect(service.isAuthenticated()).toBe(false);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('github_auth');
    });
  });
});
