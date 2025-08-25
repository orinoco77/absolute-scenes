import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import DistractionFreeMode from '../DistractionFreeMode';

// Mock the CSS import
jest.mock('../DistractionFreeMode.css', () => ({}));

// Mock fullscreen API
const mockRequestFullscreen = jest.fn();
const mockExitFullscreen = jest.fn();

Object.defineProperty(document, 'fullscreenElement', {
  writable: true,
  value: null
});

Object.defineProperty(document.documentElement, 'requestFullscreen', {
  writable: true,
  value: mockRequestFullscreen
});

Object.defineProperty(document, 'exitFullscreen', {
  writable: true,
  value: mockExitFullscreen
});

describe('DistractionFreeMode', () => {
  const mockScene = {
    id: 'scene-1',
    title: 'Test Scene',
    content: 'Initial content for testing'
  };

  const mockHandlers = {
    onSceneUpdate: jest.fn(),
    onClose: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // eslint-disable-next-line testing-library/no-node-access
    document.fullscreenElement = null;
  });

  describe('when not open', () => {
    it('renders nothing when isOpen is false', () => {
      const { container } = render(
        <DistractionFreeMode
          scene={mockScene}
          onSceneUpdate={mockHandlers.onSceneUpdate}
          onClose={mockHandlers.onClose}
          isOpen={false}
        />
      );

      // eslint-disable-next-line testing-library/no-node-access
      expect(container.firstChild).toBeNull();
    });
  });

  describe('when open', () => {
    it('renders the distraction-free interface', () => {
      render(
        <DistractionFreeMode
          scene={mockScene}
          onSceneUpdate={mockHandlers.onSceneUpdate}
          onClose={mockHandlers.onClose}
          isOpen={true}
        />
      );

      expect(
        screen.getByDisplayValue('Initial content for testing')
      ).toBeInTheDocument();
      expect(screen.getByText('Test Scene')).toBeInTheDocument();
      expect(screen.getByText('4 words')).toBeInTheDocument(); // "Initial content for testing" = 4 words
      expect(
        screen.getByTitle('Exit Distraction-Free Mode (Esc)')
      ).toBeInTheDocument();
    });

    it('shows scene title or "Untitled Scene" fallback', () => {
      const sceneWithoutTitle = { ...mockScene, title: '' };

      render(
        <DistractionFreeMode
          scene={sceneWithoutTitle}
          onSceneUpdate={mockHandlers.onSceneUpdate}
          onClose={mockHandlers.onClose}
          isOpen={true}
        />
      );

      expect(screen.getByText('Untitled Scene')).toBeInTheDocument();
    });

    it('focuses textarea when opened', () => {
      const { rerender } = render(
        <DistractionFreeMode
          scene={mockScene}
          onSceneUpdate={mockHandlers.onSceneUpdate}
          onClose={mockHandlers.onClose}
          isOpen={false}
        />
      );

      // Initially not focused
      // eslint-disable-next-line testing-library/no-node-access
      expect(document.activeElement.tagName).not.toBe('TEXTAREA');

      // Open distraction-free mode
      rerender(
        <DistractionFreeMode
          scene={mockScene}
          onSceneUpdate={mockHandlers.onSceneUpdate}
          onClose={mockHandlers.onClose}
          isOpen={true}
        />
      );

      const textarea = screen.getByDisplayValue('Initial content for testing');
      // eslint-disable-next-line testing-library/no-node-access
      expect(document.activeElement).toBe(textarea);
    });

    it('positions cursor at end of content when opened', () => {
      render(
        <DistractionFreeMode
          scene={mockScene}
          onSceneUpdate={mockHandlers.onSceneUpdate}
          onClose={mockHandlers.onClose}
          isOpen={true}
        />
      );

      const textarea = screen.getByDisplayValue('Initial content for testing');
      const expectedPosition = 'Initial content for testing'.length;

      expect(textarea.selectionStart).toBe(expectedPosition);
      expect(textarea.selectionEnd).toBe(expectedPosition);
    });
  });

  describe('content management', () => {
    it('updates content when scene changes', () => {
      const { rerender } = render(
        <DistractionFreeMode
          scene={mockScene}
          onSceneUpdate={mockHandlers.onSceneUpdate}
          onClose={mockHandlers.onClose}
          isOpen={true}
        />
      );

      const updatedScene = { ...mockScene, content: 'Updated content' };

      rerender(
        <DistractionFreeMode
          scene={updatedScene}
          onSceneUpdate={mockHandlers.onSceneUpdate}
          onClose={mockHandlers.onClose}
          isOpen={true}
        />
      );

      expect(screen.getByDisplayValue('Updated content')).toBeInTheDocument();
    });

    it('handles scene content changes', () => {
      render(
        <DistractionFreeMode
          scene={mockScene}
          onSceneUpdate={mockHandlers.onSceneUpdate}
          onClose={mockHandlers.onClose}
          isOpen={true}
        />
      );

      const textarea = screen.getByDisplayValue('Initial content for testing');

      fireEvent.change(textarea, {
        target: { value: 'New content typed by user' }
      });

      expect(mockHandlers.onSceneUpdate).toHaveBeenCalledWith('scene-1', {
        content: 'New content typed by user'
      });
    });

    it('updates word count as user types', () => {
      render(
        <DistractionFreeMode
          scene={mockScene}
          onSceneUpdate={mockHandlers.onSceneUpdate}
          onClose={mockHandlers.onClose}
          isOpen={true}
        />
      );

      const textarea = screen.getByDisplayValue('Initial content for testing');

      fireEvent.change(textarea, {
        target: { value: 'One two three' }
      });

      expect(screen.getByText('3 words')).toBeInTheDocument();
    });

    it('handles empty content correctly', () => {
      const emptyScene = { ...mockScene, content: '' };

      render(
        <DistractionFreeMode
          scene={emptyScene}
          onSceneUpdate={mockHandlers.onSceneUpdate}
          onClose={mockHandlers.onClose}
          isOpen={true}
        />
      );

      expect(screen.getByText('0 words')).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('Continue writing...')
      ).toBeInTheDocument(); // Placeholder based on scene existence, not content
    });

    it('shows different placeholder when scene is null vs existing', () => {
      const { rerender } = render(
        <DistractionFreeMode
          scene={null}
          onSceneUpdate={mockHandlers.onSceneUpdate}
          onClose={mockHandlers.onClose}
          isOpen={true}
        />
      );

      expect(
        screen.getByPlaceholderText('Start writing...')
      ).toBeInTheDocument();

      rerender(
        <DistractionFreeMode
          scene={mockScene}
          onSceneUpdate={mockHandlers.onSceneUpdate}
          onClose={mockHandlers.onClose}
          isOpen={true}
        />
      );

      expect(
        screen.getByPlaceholderText('Continue writing...')
      ).toBeInTheDocument();
    });
  });

  describe('keyboard interactions', () => {
    it('closes on Escape key', () => {
      render(
        <DistractionFreeMode
          scene={mockScene}
          onSceneUpdate={mockHandlers.onSceneUpdate}
          onClose={mockHandlers.onClose}
          isOpen={true}
        />
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockHandlers.onClose).toHaveBeenCalled();
    });

    it('does not close on other keys', () => {
      render(
        <DistractionFreeMode
          scene={mockScene}
          onSceneUpdate={mockHandlers.onSceneUpdate}
          onClose={mockHandlers.onClose}
          isOpen={true}
        />
      );

      fireEvent.keyDown(document, { key: 'Enter' });
      fireEvent.keyDown(document, { key: 'Space' });
      fireEvent.keyDown(document, { key: 'a' });

      expect(mockHandlers.onClose).not.toHaveBeenCalled();
    });

    it('handles Shift+Enter for forced line breaks', () => {
      render(
        <DistractionFreeMode
          scene={mockScene}
          onSceneUpdate={mockHandlers.onSceneUpdate}
          onClose={mockHandlers.onClose}
          isOpen={true}
        />
      );

      const textarea = screen.getByDisplayValue('Initial content for testing');

      // Set cursor position in middle of content
      textarea.selectionStart = 7; // After "Initial"
      textarea.selectionEnd = 7;

      fireEvent.keyDown(textarea, {
        key: 'Enter',
        shiftKey: true,
        preventDefault: jest.fn()
      });

      expect(mockHandlers.onSceneUpdate).toHaveBeenCalledWith('scene-1', {
        content: 'Initial\n<!--FORCED_BREAK-->\n content for testing'
      });
    });

    it('positions cursor correctly after inserting forced break', async () => {
      render(
        <DistractionFreeMode
          scene={mockScene}
          onSceneUpdate={mockHandlers.onSceneUpdate}
          onClose={mockHandlers.onClose}
          isOpen={true}
        />
      );

      const textarea = screen.getByDisplayValue('Initial content for testing');

      // Set cursor position
      textarea.selectionStart = 7;
      textarea.selectionEnd = 7;

      fireEvent.keyDown(textarea, {
        key: 'Enter',
        shiftKey: true,
        preventDefault: jest.fn()
      });

      // Wait for setTimeout to execute
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      // Cursor should be positioned after the forced break marker
      const expectedPosition = 7 + '\n<!--FORCED_BREAK-->\n'.length;
      expect(textarea.selectionStart).toBe(expectedPosition);
    });
  });

  describe('close button interaction', () => {
    it('closes when close button is clicked', () => {
      render(
        <DistractionFreeMode
          scene={mockScene}
          onSceneUpdate={mockHandlers.onSceneUpdate}
          onClose={mockHandlers.onClose}
          isOpen={true}
        />
      );

      const closeButton = screen.getByTitle('Exit Distraction-Free Mode (Esc)');
      fireEvent.click(closeButton);

      expect(mockHandlers.onClose).toHaveBeenCalled();
    });
  });

  describe('event cleanup', () => {
    it('removes event listeners when component unmounts', () => {
      const removeEventListenerSpy = jest.spyOn(
        document,
        'removeEventListener'
      );

      const { unmount } = render(
        <DistractionFreeMode
          scene={mockScene}
          onSceneUpdate={mockHandlers.onSceneUpdate}
          onClose={mockHandlers.onClose}
          isOpen={true}
        />
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );
    });

    it('removes event listeners when closed', () => {
      const removeEventListenerSpy = jest.spyOn(
        document,
        'removeEventListener'
      );

      const { rerender } = render(
        <DistractionFreeMode
          scene={mockScene}
          onSceneUpdate={mockHandlers.onSceneUpdate}
          onClose={mockHandlers.onClose}
          isOpen={true}
        />
      );

      rerender(
        <DistractionFreeMode
          scene={mockScene}
          onSceneUpdate={mockHandlers.onSceneUpdate}
          onClose={mockHandlers.onClose}
          isOpen={false}
        />
      );

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );
    });
  });

  describe('edge cases', () => {
    it('handles null scene gracefully', () => {
      render(
        <DistractionFreeMode
          scene={null}
          onSceneUpdate={mockHandlers.onSceneUpdate}
          onClose={mockHandlers.onClose}
          isOpen={true}
        />
      );

      expect(screen.getByText('Untitled Scene')).toBeInTheDocument();
      expect(screen.getByDisplayValue('')).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('Start writing...')
      ).toBeInTheDocument();
    });

    it('handles scene without content property', () => {
      const sceneWithoutContent = { id: 'test', title: 'Test' };

      render(
        <DistractionFreeMode
          scene={sceneWithoutContent}
          onSceneUpdate={mockHandlers.onSceneUpdate}
          onClose={mockHandlers.onClose}
          isOpen={true}
        />
      );

      expect(screen.getByDisplayValue('')).toBeInTheDocument();
    });

    it('updates content correctly when scene updates to null', () => {
      const { rerender } = render(
        <DistractionFreeMode
          scene={mockScene}
          onSceneUpdate={mockHandlers.onSceneUpdate}
          onClose={mockHandlers.onClose}
          isOpen={true}
        />
      );

      rerender(
        <DistractionFreeMode
          scene={null}
          onSceneUpdate={mockHandlers.onSceneUpdate}
          onClose={mockHandlers.onClose}
          isOpen={true}
        />
      );

      expect(screen.getByDisplayValue('')).toBeInTheDocument();
    });
  });
});
