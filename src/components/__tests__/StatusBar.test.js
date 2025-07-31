import { render, screen } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';
import StatusBar from '../StatusBar';

describe('StatusBar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    render(<StatusBar />);
    expect(screen.getByText('Saved locally')).toBeInTheDocument();
  });

  test('shows saving status when isSaving is true', () => {
    render(<StatusBar isSaving={true} />);

    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(screen.getByText('💾')).toBeInTheDocument();

    const saveStatus = screen.getByText('Saving...').closest('.save-status');
    expect(saveStatus).toHaveClass('saving');
  });

  test('shows unsaved changes when hasUnsavedChanges is true', () => {
    render(<StatusBar hasUnsavedChanges={true} />);

    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    expect(screen.getByText('●')).toBeInTheDocument();

    const saveStatus = screen
      .getByText('Unsaved changes')
      .closest('.save-status');
    expect(saveStatus).toHaveClass('unsaved');
  });

  test('shows saved locally as default status', () => {
    render(<StatusBar />);

    expect(screen.getByText('Saved locally')).toBeInTheDocument();
    expect(screen.getByText('💾')).toBeInTheDocument();

    const saveStatus = screen
      .getByText('Saved locally')
      .closest('.save-status');
    expect(saveStatus).toHaveClass('saved');
  });

  test('shows synced to cloud for recent sync', () => {
    const recentSyncTime = new Date(Date.now() - 30 * 1000); // 30 seconds ago
    const githubSyncStatus = {
      lastSyncTime: recentSyncTime.toISOString()
    };

    render(<StatusBar githubSyncStatus={githubSyncStatus} />);

    expect(screen.getByText('Synced to cloud')).toBeInTheDocument();
    expect(screen.getByText('☁️')).toBeInTheDocument();

    const saveStatus = screen
      .getByText('Synced to cloud')
      .closest('.save-status');
    expect(saveStatus).toHaveClass('synced');
  });

  test('shows sync time for older sync within an hour', () => {
    const oldSyncTime = new Date(Date.now() - 15 * 60 * 1000); // 15 minutes ago
    const githubSyncStatus = {
      lastSyncTime: oldSyncTime.toISOString()
    };

    render(<StatusBar githubSyncStatus={githubSyncStatus} />);

    expect(screen.getByText('Synced 15m ago')).toBeInTheDocument();
    expect(screen.getByText('☁️')).toBeInTheDocument();

    const saveStatus = screen
      .getByText('Synced 15m ago')
      .closest('.save-status');
    expect(saveStatus).toHaveClass('synced-old');
  });

  test('shows saved locally for very old sync', () => {
    const veryOldSyncTime = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
    const githubSyncStatus = {
      lastSyncTime: veryOldSyncTime.toISOString()
    };

    render(<StatusBar githubSyncStatus={githubSyncStatus} />);

    expect(screen.getByText('Saved locally')).toBeInTheDocument();
    expect(screen.getByText('💾')).toBeInTheDocument();

    const saveStatus = screen
      .getByText('Saved locally')
      .closest('.save-status');
    expect(saveStatus).toHaveClass('saved');
  });

  test('prioritizes isSaving over other statuses', () => {
    const githubSyncStatus = {
      lastSyncTime: new Date().toISOString()
    };

    render(
      <StatusBar
        isSaving={true}
        hasUnsavedChanges={true}
        githubSyncStatus={githubSyncStatus}
      />
    );

    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
    expect(screen.queryByText('Synced to cloud')).not.toBeInTheDocument();
  });

  test('prioritizes unsaved changes over sync status', () => {
    const githubSyncStatus = {
      lastSyncTime: new Date().toISOString()
    };

    render(
      <StatusBar hasUnsavedChanges={true} githubSyncStatus={githubSyncStatus} />
    );

    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    expect(screen.queryByText('Synced to cloud')).not.toBeInTheDocument();
  });

  test('shows current operation when provided', () => {
    render(<StatusBar currentOperation="Exporting PDF..." />);

    expect(screen.getByText('Exporting PDF...')).toBeInTheDocument();
    expect(screen.getByText('⏳')).toBeInTheDocument();

    const operationStatus = screen
      .getByText('Exporting PDF...')
      .closest('.operation-status');
    expect(operationStatus).toBeInTheDocument();
  });

  test('shows offline indicator when isOnline is false', () => {
    render(<StatusBar isOnline={false} />);

    expect(screen.getByText('Offline')).toBeInTheDocument();
    expect(screen.getByText('📶')).toBeInTheDocument();

    const offlineIndicator = screen
      .getByText('Offline')
      .closest('.offline-indicator');
    expect(offlineIndicator).toBeInTheDocument();
  });

  test('does not show offline indicator when isOnline is true', () => {
    render(<StatusBar isOnline={true} />);

    expect(screen.queryByText('Offline')).not.toBeInTheDocument();
    expect(screen.queryByText('📶')).not.toBeInTheDocument();
  });

  test('isOnline defaults to true', () => {
    render(<StatusBar />);

    expect(screen.queryByText('Offline')).not.toBeInTheDocument();
  });

  test('shows both operation and offline status simultaneously', () => {
    render(<StatusBar currentOperation="Loading..." isOnline={false} />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  test('handles githubSyncStatus without lastSyncTime', () => {
    const githubSyncStatus = {};

    render(<StatusBar githubSyncStatus={githubSyncStatus} />);

    expect(screen.getByText('Saved locally')).toBeInTheDocument();
  });

  test('handles null githubSyncStatus', () => {
    render(<StatusBar githubSyncStatus={null} />);

    expect(screen.getByText('Saved locally')).toBeInTheDocument();
  });

  test('calculates sync time correctly for edge cases', () => {
    // Test exactly 1 minute ago
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const githubSyncStatus = {
      lastSyncTime: oneMinuteAgo.toISOString()
    };

    render(<StatusBar githubSyncStatus={githubSyncStatus} />);

    expect(screen.getByText('Synced 1m ago')).toBeInTheDocument();

    const saveStatus = screen
      .getByText('Synced 1m ago')
      .closest('.save-status');
    expect(saveStatus).toHaveClass('synced-old');
  });

  test('calculates sync time correctly for exactly 60 minutes', () => {
    // Test exactly 60 minutes ago
    const sixtyMinutesAgo = new Date(Date.now() - 60 * 60 * 1000);
    const githubSyncStatus = {
      lastSyncTime: sixtyMinutesAgo.toISOString()
    };

    render(<StatusBar githubSyncStatus={githubSyncStatus} />);

    expect(screen.getByText('Saved locally')).toBeInTheDocument();

    const saveStatus = screen
      .getByText('Saved locally')
      .closest('.save-status');
    expect(saveStatus).toHaveClass('saved');
  });

  test('status bar has correct structure', () => {
    render(
      <StatusBar
        currentOperation="Test operation"
        isOnline={false}
        hasUnsavedChanges={true}
      />
    );

    const statusBar = document.querySelector('.status-bar');
    const statusLeft = document.querySelector('.status-left');
    const statusRight = document.querySelector('.status-right');

    expect(statusBar).toBeInTheDocument();
    expect(statusLeft).toBeInTheDocument();
    expect(statusRight).toBeInTheDocument();

    // Left side should contain operation and offline indicators
    expect(statusLeft).toContainElement(
      screen.getByText('Test operation').closest('.operation-status')
    );
    expect(statusLeft).toContainElement(
      screen.getByText('Offline').closest('.offline-indicator')
    );

    // Right side should contain save status
    expect(statusRight).toContainElement(
      screen.getByText('Unsaved changes').closest('.save-status')
    );
  });

  test('handles invalid sync time gracefully', () => {
    const githubSyncStatus = {
      lastSyncTime: 'invalid-date'
    };

    render(<StatusBar githubSyncStatus={githubSyncStatus} />);

    // Should fall back to default status
    expect(screen.getByText('Saved locally')).toBeInTheDocument();
  });

  test('shows correct status when multiple conditions are false', () => {
    render(
      <StatusBar
        hasUnsavedChanges={false}
        isSaving={false}
        githubSyncStatus={null}
        isOnline={true}
        currentOperation={null}
      />
    );

    expect(screen.getByText('Saved locally')).toBeInTheDocument();
    expect(screen.queryByText('Offline')).not.toBeInTheDocument();
    expect(screen.queryByText('⏳')).not.toBeInTheDocument();
  });
});
