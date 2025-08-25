/**
 * Service class to handle GitHub synchronization operations
 * Following Single Responsibility Principle
 */
export class GitHubSyncService {
  /**
   * Handle GitHub synchronization
   */
  async syncWithGitHub({
    bookData,
    filePath,
    saveTime,
    onOperationUpdate,
    onSyncSuccess,
    onSyncError
  }) {
    try {
      onOperationUpdate?.('Syncing to GitHub...');

      const { BrowserEnhancedGitHubService } = await import(
        '../utils/browserEnhancedGitHubService'
      );
      const enhancedService = new BrowserEnhancedGitHubService();

      const isAuth = enhancedService.gitHubService.isAuthenticated();

      if (!isAuth) {
        throw new Error(
          'GitHub auto-sync failed: Not authenticated. Please check your GitHub connection in settings.'
        );
      }

      const commitMessage = `Auto-save: ${new Date().toLocaleString()}`;

      const result = await enhancedService.safeSyncWithRepository(
        bookData.github.repository,
        bookData,
        commitMessage,
        filePath
      );

      if (result.conflicts && result.conflicts.length > 0) {
        // For auto-sync, don't show conflict UI - just warn user
        const conflictMessage =
          'Auto-sync detected conflicts with remote changes. Please use the manual sync button in GitHub settings to resolve conflicts safely.';
        onSyncError?.(conflictMessage);
        return { success: false, hasConflicts: true, error: conflictMessage };
      } else if (result.success) {
        // Sync successful
        onSyncSuccess?.(saveTime);
        return { success: true, syncTime: saveTime };
      } else if (result.error) {
        console.warn('Auto-sync failed:', result.error);
        const errorMessage = `Auto-sync failed: ${result.error}`;
        onSyncError?.(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.warn('GitHub sync failed:', error.message);
      // Show user-friendly error for auto-sync failures
      const errorMessage = `GitHub auto-sync failed: ${error.message}. You can manually sync from the GitHub settings.`;
      onSyncError?.(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      // Clear operation when sync is complete (success or failure)
      onOperationUpdate?.(null);
    }
  }

  /**
   * Check if GitHub sync should be performed
   */
  shouldSyncToGitHub(bookData) {
    return bookData?.github?.repository != null && 
           typeof bookData.github.repository === 'string' &&
           bookData.github.repository.trim() !== '';
  }
}
