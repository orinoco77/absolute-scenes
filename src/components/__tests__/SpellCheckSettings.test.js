import { render, screen, fireEvent } from '@testing-library/react';
import SpellCheckSettings from '../SpellCheckSettings';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = mockLocalStorage;

// Mock window.require for Electron IPC
const mockIpcRenderer = {
  invoke: jest.fn()
};

global.window = {
  ...global.window,
  require: jest.fn(() => ({
    ipcRenderer: mockIpcRenderer
  }))
};

describe('SpellCheckSettings', () => {
  let mockOnClose;

  beforeEach(() => {
    mockOnClose = jest.fn();
    mockIpcRenderer.invoke.mockClear();
    // Don't set a default return value, let individual tests set it
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders spell check settings dialog', () => {
    mockLocalStorage.getItem.mockReturnValue('en-US');

    render(<SpellCheckSettings onClose={mockOnClose} />);

    expect(screen.getByText('Spell Check Settings')).toBeInTheDocument();
    expect(screen.getByText('Language Selection')).toBeInTheDocument();
    expect(screen.getByLabelText('Spell Check Language')).toBeInTheDocument();
  });

  test('can change language selection', () => {
    mockLocalStorage.getItem.mockReturnValue('en-US');

    render(<SpellCheckSettings onClose={mockOnClose} />);

    const select = screen.getByLabelText('Spell Check Language');
    expect(select.value).toBe('en-US');

    fireEvent.change(select, { target: { value: 'en-GB' } });
    expect(select.value).toBe('en-GB');
  });

  test('defaults to en-US when no saved language', () => {
    mockLocalStorage.getItem.mockReturnValue(null);

    render(<SpellCheckSettings onClose={mockOnClose} />);

    const select = screen.getByLabelText('Spell Check Language');
    expect(select.value).toBe('en-US');
  });

  test('handles language selection change', () => {
    mockLocalStorage.getItem.mockReturnValue('en-US');

    render(<SpellCheckSettings onClose={mockOnClose} />);

    const select = screen.getByLabelText('Spell Check Language');

    fireEvent.change(select, { target: { value: 'fr' } });

    expect(select.value).toBe('fr');
  });

  test('closes dialog on cancel button', () => {
    mockLocalStorage.getItem.mockReturnValue('en-US');

    render(<SpellCheckSettings onClose={mockOnClose} />);

    const cancelButton = screen.getByText('Cancel');

    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('closes dialog on close button (×)', () => {
    mockLocalStorage.getItem.mockReturnValue('en-US');

    render(<SpellCheckSettings onClose={mockOnClose} />);

    const closeButton = screen.getByText('×');

    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('displays language options correctly', () => {
    mockLocalStorage.getItem.mockReturnValue('en-US');

    render(<SpellCheckSettings onClose={mockOnClose} />);

    const select = screen.getByLabelText('Spell Check Language');

    // Should have all language options - check by counting specific options instead of direct DOM access
    expect(select).toBeInTheDocument();

    // Check for some specific languages
    expect(
      screen.getByRole('option', { name: 'English (United States)' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'English (United Kingdom)' })
    ).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'French' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'German' })).toBeInTheDocument();
  });

  test('works without Electron environment', () => {
    mockLocalStorage.getItem.mockReturnValue('en-US');
    // Mock no Electron environment
    global.window.require = undefined;

    render(<SpellCheckSettings onClose={mockOnClose} />);

    expect(screen.getByText('Spell Check Settings')).toBeInTheDocument();
    // Should still render and work, just without IPC calls
  });
});
