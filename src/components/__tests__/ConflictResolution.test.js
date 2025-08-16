/**
 * Test suite for ConflictResolution component
 * Following TDD approach - tests first, then implementation
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ConflictResolution } from '../ConflictResolution';

const mockConflicts = [
  {
    type: 'scene_content',
    sceneId: 'scene1',
    localContent: 'Local scene content',
    remoteContent: 'Remote scene content'
  },
  {
    type: 'title',
    localContent: 'Local Title',
    remoteContent: 'Remote Title'
  },
  {
    type: 'character',
    characterId: 'char1',
    field: 'name',
    localContent: 'Local Character Name',
    remoteContent: 'Remote Character Name'
  }
];

describe('ConflictResolution Component', () => {
  test('should render when conflicts exist', () => {
    const onResolve = jest.fn();
    const onCancel = jest.fn();

    render(
      <ConflictResolution
        conflicts={mockConflicts}
        onResolve={onResolve}
        onCancel={onCancel}
      />
    );

    expect(
      screen.getByText(/Collaboration Conflicts Detected/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/3 conflicts/i)).toBeInTheDocument();
  });

  test('should not render when no conflicts exist', () => {
    const onResolve = jest.fn();
    const onCancel = jest.fn();

    const { container } = render(
      <ConflictResolution
        conflicts={[]}
        onResolve={onResolve}
        onCancel={onCancel}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  test('should display scene content conflicts', () => {
    const conflicts = [mockConflicts[0]]; // Scene conflict only
    const onResolve = jest.fn();
    const onCancel = jest.fn();

    render(
      <ConflictResolution
        conflicts={conflicts}
        onResolve={onResolve}
        onCancel={onCancel}
      />
    );

    expect(screen.getByText(/Scene Content Conflict/i)).toBeInTheDocument();
    expect(screen.getByText('Local scene content')).toBeInTheDocument();
    expect(screen.getByText('Remote scene content')).toBeInTheDocument();
  });

  test('should display title conflicts', () => {
    const conflicts = [mockConflicts[1]]; // Title conflict only
    const onResolve = jest.fn();
    const onCancel = jest.fn();

    render(
      <ConflictResolution
        conflicts={conflicts}
        onResolve={onResolve}
        onCancel={onCancel}
      />
    );

    expect(screen.getByText(/Book Title Conflict/i)).toBeInTheDocument();
    expect(screen.getByText('Local Title')).toBeInTheDocument();
    expect(screen.getByText('Remote Title')).toBeInTheDocument();
  });

  test('should allow user to select local version', async () => {
    const conflicts = [mockConflicts[0]];
    const onResolve = jest.fn();
    const onCancel = jest.fn();

    render(
      <ConflictResolution
        conflicts={conflicts}
        onResolve={onResolve}
        onCancel={onCancel}
      />
    );

    const localButton = screen.getByText(/Use Local/i);
    fireEvent.click(localButton);

    const resolveButton = screen.getByText(/Resolve All Conflicts/i);
    fireEvent.click(resolveButton);

    await waitFor(() => {
      expect(onResolve).toHaveBeenCalledWith([
        {
          conflictIndex: 0,
          resolution: 'local',
          resolvedContent: 'Local scene content'
        }
      ]);
    });
  });

  test('should allow user to select remote version', async () => {
    const conflicts = [mockConflicts[0]];
    const onResolve = jest.fn();
    const onCancel = jest.fn();

    render(
      <ConflictResolution
        conflicts={conflicts}
        onResolve={onResolve}
        onCancel={onCancel}
      />
    );

    const remoteButton = screen.getByText(/Use Remote/i);
    fireEvent.click(remoteButton);

    const resolveButton = screen.getByText(/Resolve All Conflicts/i);
    fireEvent.click(resolveButton);

    await waitFor(() => {
      expect(onResolve).toHaveBeenCalledWith([
        {
          conflictIndex: 0,
          resolution: 'remote',
          resolvedContent: 'Remote scene content'
        }
      ]);
    });
  });

  test('should allow manual text editing', async () => {
    const conflicts = [mockConflicts[0]];
    const onResolve = jest.fn();
    const onCancel = jest.fn();

    render(
      <ConflictResolution
        conflicts={conflicts}
        onResolve={onResolve}
        onCancel={onCancel}
      />
    );

    const editButton = screen.getByText(/Manual Edit/i);
    fireEvent.click(editButton);

    const textArea = screen.getByRole('textbox');
    fireEvent.change(textArea, {
      target: { value: 'Manually edited content' }
    });

    const resolveButton = screen.getByText(/Resolve All Conflicts/i);
    fireEvent.click(resolveButton);

    await waitFor(() => {
      expect(onResolve).toHaveBeenCalledWith([
        {
          conflictIndex: 0,
          resolution: 'manual',
          resolvedContent: 'Manually edited content'
        }
      ]);
    });
  });

  test('should require all conflicts to be resolved before allowing submission', () => {
    const onResolve = jest.fn();
    const onCancel = jest.fn();

    render(
      <ConflictResolution
        conflicts={mockConflicts}
        onResolve={onResolve}
        onCancel={onCancel}
      />
    );

    const resolveButton = screen.getByText(/Resolve All Conflicts/i);
    expect(resolveButton).toBeDisabled();

    // Resolve first conflict
    const firstLocalButton = screen.getAllByText(/Use Local/i)[0];
    fireEvent.click(firstLocalButton);

    // Button should still be disabled
    expect(resolveButton).toBeDisabled();
  });

  test('should call onCancel when cancel button is clicked', () => {
    const onResolve = jest.fn();
    const onCancel = jest.fn();

    render(
      <ConflictResolution
        conflicts={mockConflicts}
        onResolve={onResolve}
        onCancel={onCancel}
      />
    );

    const cancelButton = screen.getByText(/Cancel/i);
    fireEvent.click(cancelButton);

    expect(onCancel).toHaveBeenCalled();
  });
});
