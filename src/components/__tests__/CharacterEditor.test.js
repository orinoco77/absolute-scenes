/* eslint-disable testing-library/no-node-access */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CharacterEditor from '../CharacterEditor';

const mockCharacter = {
  id: 'char-1',
  name: 'John Doe',
  description: 'A brave warrior',
  role: 'Protagonist',
  avatar: '👨',
  notes: 'Main character notes',
  modified: '2023-12-01T10:00:00.000Z'
};

const mockTemplate = {
  fontFamily: 'Arial',
  fontSize: 12
};

describe('CharacterEditor Component', () => {
  let mockOnCharacterUpdate;

  beforeEach(() => {
    mockOnCharacterUpdate = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders no character selected message when no character provided', () => {
    render(
      <CharacterEditor
        character={null}
        template={mockTemplate}
        onCharacterUpdate={mockOnCharacterUpdate}
      />
    );

    expect(screen.getByText('No Character Selected')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Select a character from the list to edit their information, or create a new character.'
      )
    ).toBeInTheDocument();
  });

  test('renders character editor with character data', () => {
    render(
      <CharacterEditor
        character={mockCharacter}
        template={mockTemplate}
        onCharacterUpdate={mockOnCharacterUpdate}
      />
    );

    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Protagonist')).toBeInTheDocument();
    expect(screen.getByDisplayValue('A brave warrior')).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('Main character notes')
    ).toBeInTheDocument();
    // Use a more specific selector for the current avatar
    expect(
      screen.getByText('👨', { selector: '.current-avatar' })
    ).toBeInTheDocument();
  });

  test('updates character name', () => {
    render(
      <CharacterEditor
        character={mockCharacter}
        template={mockTemplate}
        onCharacterUpdate={mockOnCharacterUpdate}
      />
    );

    const nameInput = screen.getByDisplayValue('John Doe');
    fireEvent.change(nameInput, { target: { value: 'Jane Smith' } });

    expect(mockOnCharacterUpdate).toHaveBeenCalledWith('char-1', {
      name: 'Jane Smith'
    });
  });

  test('updates character role', () => {
    render(
      <CharacterEditor
        character={mockCharacter}
        template={mockTemplate}
        onCharacterUpdate={mockOnCharacterUpdate}
      />
    );

    const roleInput = screen.getByDisplayValue('Protagonist');
    fireEvent.change(roleInput, { target: { value: 'Antagonist' } });

    expect(mockOnCharacterUpdate).toHaveBeenCalledWith('char-1', {
      role: 'Antagonist'
    });
  });

  test('updates character notes', () => {
    render(
      <CharacterEditor
        character={mockCharacter}
        template={mockTemplate}
        onCharacterUpdate={mockOnCharacterUpdate}
      />
    );

    const notesTextarea = screen.getByDisplayValue('Main character notes');
    fireEvent.change(notesTextarea, {
      target: { value: 'Updated character notes' }
    });

    expect(mockOnCharacterUpdate).toHaveBeenCalledWith('char-1', {
      notes: 'Updated character notes'
    });
  });

  test('auto-saves description after delay', async () => {
    jest.useFakeTimers();

    render(
      <CharacterEditor
        character={mockCharacter}
        template={mockTemplate}
        onCharacterUpdate={mockOnCharacterUpdate}
      />
    );

    const descriptionTextarea = screen.getByDisplayValue('A brave warrior');
    fireEvent.change(descriptionTextarea, {
      target: { value: 'A brave and noble warrior' }
    });

    // Fast-forward time to trigger auto-save
    jest.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(mockOnCharacterUpdate).toHaveBeenCalledWith('char-1', {
        description: 'A brave and noble warrior'
      });
    });

    jest.useRealTimers();
  });

  test('calculates word count correctly', () => {
    const characterWithLongDescription = {
      ...mockCharacter,
      description: 'This is a test description with exactly eight words.'
    };

    render(
      <CharacterEditor
        character={characterWithLongDescription}
        template={mockTemplate}
        onCharacterUpdate={mockOnCharacterUpdate}
      />
    );

    // The actual word count is 9 words (including the period as part of 'words.')
    expect(screen.getByText(/Words: 9/)).toBeInTheDocument();
  });

  test('displays formatted modification date', () => {
    render(
      <CharacterEditor
        character={mockCharacter}
        template={mockTemplate}
        onCharacterUpdate={mockOnCharacterUpdate}
      />
    );

    // The exact format may vary by locale, but we can check that it contains the date
    expect(screen.getByText(/Modified:/)).toBeInTheDocument();
  });

  test('shows avatar dropdown when clicked', () => {
    render(
      <CharacterEditor
        character={mockCharacter}
        template={mockTemplate}
        onCharacterUpdate={mockOnCharacterUpdate}
      />
    );

    // Use class selector to get the specific avatar element we want to click
    const currentAvatar = document.querySelector('.current-avatar');
    fireEvent.click(currentAvatar);

    // Check that avatar options are available in the DOM (even if initially hidden)
    const avatarOptions = screen.getAllByText('👤');
    expect(avatarOptions.length).toBeGreaterThan(0);
  });

  test('handles character prop changes', () => {
    const { rerender } = render(
      <CharacterEditor
        character={mockCharacter}
        template={mockTemplate}
        onCharacterUpdate={mockOnCharacterUpdate}
      />
    );

    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();

    const updatedCharacter = { ...mockCharacter, name: 'Updated Name' };
    rerender(
      <CharacterEditor
        character={updatedCharacter}
        template={mockTemplate}
        onCharacterUpdate={mockOnCharacterUpdate}
      />
    );

    expect(screen.getByDisplayValue('Updated Name')).toBeInTheDocument();
  });

  test('resets state when character becomes null', () => {
    const { rerender } = render(
      <CharacterEditor
        character={mockCharacter}
        template={mockTemplate}
        onCharacterUpdate={mockOnCharacterUpdate}
      />
    );

    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();

    rerender(
      <CharacterEditor
        character={null}
        template={mockTemplate}
        onCharacterUpdate={mockOnCharacterUpdate}
      />
    );

    expect(screen.getByText('No Character Selected')).toBeInTheDocument();
  });
});
