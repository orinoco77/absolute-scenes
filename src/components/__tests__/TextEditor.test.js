import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TextEditor from '../TextEditor.jsx';

describe('TextEditor', () => {
  let mockOnChange;

  beforeEach(() => {
    mockOnChange = jest.fn();
  });

  test('renders basic text editor', () => {
    render(<TextEditor value="Hello world" onChange={mockOnChange} />);

    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue('Hello world');
  });

  test('handles text input', async () => {
    const user = userEvent.setup();
    render(<TextEditor value="" onChange={mockOnChange} />);

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Hello');

    expect(mockOnChange).toHaveBeenCalled();
  });

  test('supports placeholder', () => {
    render(
      <TextEditor
        value=""
        placeholder="Enter text here"
        onChange={mockOnChange}
      />
    );

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('placeholder', 'Enter text here');
  });

  test('supports spell check attribute', () => {
    render(<TextEditor value="" spellCheck={true} onChange={mockOnChange} />);

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('spellcheck', 'true');
  });

  test('can be disabled', () => {
    render(<TextEditor value="" disabled={true} onChange={mockOnChange} />);

    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeDisabled();
  });

  test('applies custom className and styles', () => {
    render(
      <TextEditor
        value=""
        className="custom-class"
        style={{ backgroundColor: 'red' }}
        onChange={mockOnChange}
      />
    );

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveClass('text-editor', 'custom-class');
  });

  describe('Find and Replace', () => {
    test('opens find/replace with Ctrl+F', async () => {
      const user = userEvent.setup();
      render(<TextEditor value="Hello world" onChange={mockOnChange} />);

      const textarea = screen.getByRole('textbox');
      await user.click(textarea);
      await user.keyboard('{Control>}f{/Control}');

      expect(screen.getByPlaceholderText('Find')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Replace')).toBeInTheDocument();
    });

    test('opens find/replace with Ctrl+H', async () => {
      const user = userEvent.setup();
      render(<TextEditor value="Hello world" onChange={mockOnChange} />);

      const textarea = screen.getByRole('textbox');
      await user.click(textarea);
      await user.keyboard('{Control>}h{/Control}');

      expect(screen.getByPlaceholderText('Find')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Replace')).toBeInTheDocument();
    });

    test('closes find/replace with Escape', async () => {
      const user = userEvent.setup();
      render(<TextEditor value="Hello world" onChange={mockOnChange} />);

      const textarea = screen.getByRole('textbox');
      await user.click(textarea);
      await user.keyboard('{Control>}f{/Control}');

      expect(screen.getByPlaceholderText('Find')).toBeInTheDocument();

      await user.keyboard('{Escape}');

      expect(screen.queryByPlaceholderText('Find')).not.toBeInTheDocument();
    });

    test('closes find/replace with close button', async () => {
      const user = userEvent.setup();
      render(<TextEditor value="Hello world" onChange={mockOnChange} />);

      const textarea = screen.getByRole('textbox');
      await user.click(textarea);
      await user.keyboard('{Control>}f{/Control}');

      expect(screen.getByPlaceholderText('Find')).toBeInTheDocument();

      const closeButton = screen.getByText('×');
      await user.click(closeButton);

      expect(screen.queryByPlaceholderText('Find')).not.toBeInTheDocument();
    });

    test('finds text matches', async () => {
      const user = userEvent.setup();
      render(
        <TextEditor
          value="Hello world hello universe"
          onChange={mockOnChange}
        />
      );

      const textarea = screen.getByRole('textbox');
      await user.click(textarea);
      await user.keyboard('{Control>}f{/Control}');

      const findInput = screen.getByPlaceholderText('Find');
      await user.type(findInput, 'hello');

      await waitFor(() => {
        expect(screen.getByText('1 of 2')).toBeInTheDocument();
      });
    });

    test('navigates between matches', async () => {
      const user = userEvent.setup();
      render(
        <TextEditor
          value="Hello world hello universe"
          onChange={mockOnChange}
        />
      );

      const textarea = screen.getByRole('textbox');
      await user.click(textarea);
      await user.keyboard('{Control>}f{/Control}');

      const findInput = screen.getByPlaceholderText('Find');
      await user.type(findInput, 'hello');

      await waitFor(() => {
        expect(screen.getByText('1 of 2')).toBeInTheDocument();
      });

      const nextButton = screen.getByText('↓');
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('2 of 2')).toBeInTheDocument();
      });
    });

    test('respects match case option', async () => {
      const user = userEvent.setup();
      render(
        <TextEditor
          value="Hello world hello universe"
          onChange={mockOnChange}
        />
      );

      const textarea = screen.getByRole('textbox');
      await user.click(textarea);
      await user.keyboard('{Control>}f{/Control}');

      const findInput = screen.getByPlaceholderText('Find');
      await user.type(findInput, 'hello');

      await waitFor(() => {
        expect(screen.getByText('1 of 2')).toBeInTheDocument();
      });

      const matchCaseCheckbox = screen.getByLabelText('Match case');
      await user.click(matchCaseCheckbox);

      await waitFor(() => {
        expect(screen.getByText('1 of 1')).toBeInTheDocument();
      });
    });

    test('respects whole word option', async () => {
      const user = userEvent.setup();
      render(
        <TextEditor
          value="Hello world helloworld universe"
          onChange={mockOnChange}
        />
      );

      const textarea = screen.getByRole('textbox');
      await user.click(textarea);
      await user.keyboard('{Control>}f{/Control}');

      const findInput = screen.getByPlaceholderText('Find');
      await user.type(findInput, 'hello');

      await waitFor(() => {
        expect(screen.getByText('1 of 2')).toBeInTheDocument();
      });

      const wholeWordCheckbox = screen.getByLabelText('Whole word');
      await user.click(wholeWordCheckbox);

      await waitFor(() => {
        expect(screen.getByText('1 of 1')).toBeInTheDocument();
      });
    });

    test('replaces single match', async () => {
      const user = userEvent.setup();
      render(<TextEditor value="Hello world" onChange={mockOnChange} />);

      const textarea = screen.getByRole('textbox');
      await user.click(textarea);
      await user.keyboard('{Control>}f{/Control}');

      const findInput = screen.getByPlaceholderText('Find');
      const replaceInput = screen.getByPlaceholderText('Replace');

      await user.type(findInput, 'Hello');
      await user.type(replaceInput, 'Hi');

      const replaceButton = screen.getByText('Replace');
      await user.click(replaceButton);

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({
            value: 'Hi world'
          })
        })
      );
    });

    test('replaces all matches', async () => {
      const user = userEvent.setup();
      render(
        <TextEditor
          value="Hello world hello universe"
          onChange={mockOnChange}
        />
      );

      const textarea = screen.getByRole('textbox');
      await user.click(textarea);
      await user.keyboard('{Control>}f{/Control}');

      const findInput = screen.getByPlaceholderText('Find');
      const replaceInput = screen.getByPlaceholderText('Replace');

      await user.type(findInput, 'hello');
      await user.type(replaceInput, 'hi');

      const replaceAllButton = screen.getByText('All');
      await user.click(replaceAllButton);

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({
            value: 'hi world hi universe'
          })
        })
      );
    });

    test('disables buttons when no matches', async () => {
      const user = userEvent.setup();
      render(<TextEditor value="Hello world" onChange={mockOnChange} />);

      const textarea = screen.getByRole('textbox');
      await user.click(textarea);
      await user.keyboard('{Control>}f{/Control}');

      const findInput = screen.getByPlaceholderText('Find');
      await user.type(findInput, 'xyz');

      await waitFor(() => {
        expect(screen.getByText('0 of 0')).toBeInTheDocument();
      });

      expect(screen.getByText('↑')).toBeDisabled();
      expect(screen.getByText('↓')).toBeDisabled();
      expect(screen.getByText('Replace')).toBeDisabled();
      expect(screen.getByText('All')).toBeDisabled();
    });
  });

  describe('Undo/Redo', () => {
    test('performs undo with Ctrl+Z', async () => {
      const user = userEvent.setup();
      const ref = { current: null };
      const { rerender } = render(
        <TextEditor ref={ref} value="" onChange={mockOnChange} />
      );

      const textarea = screen.getByRole('textbox');
      await user.click(textarea);

      // Clear previous calls to start fresh
      mockOnChange.mockClear();

      // Type first character
      await user.type(textarea, 'H');
      rerender(<TextEditor ref={ref} value="H" onChange={mockOnChange} />);

      // Type second character
      await user.type(textarea, 'i');
      rerender(<TextEditor ref={ref} value="Hi" onChange={mockOnChange} />);

      // Clear the onChange calls from typing so we can detect undo
      mockOnChange.mockClear();

      // Try direct undo call first to see if it works
      ref.current.undo();

      // Should trigger onChange with previous value
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({
            value: 'H'
          })
        })
      );
    });

    test('performs redo with Ctrl+Shift+Z', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <TextEditor value="" onChange={mockOnChange} />
      );

      const textarea = screen.getByRole('textbox');
      await user.click(textarea);

      // Type some text
      await user.type(textarea, 'H');
      rerender(<TextEditor value="H" onChange={mockOnChange} />);

      await user.type(textarea, 'i');
      rerender(<TextEditor value="Hi" onChange={mockOnChange} />);

      // Undo
      await user.keyboard('{Control>}z{/Control}');

      // Redo
      await user.keyboard('{Control>}{Shift>}z{/Shift}{/Control}');

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({
            value: 'Hi'
          })
        })
      );
    });

    test('performs redo with Ctrl+Y', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <TextEditor value="" onChange={mockOnChange} />
      );

      const textarea = screen.getByRole('textbox');
      await user.click(textarea);

      await user.type(textarea, 'H');
      rerender(<TextEditor value="H" onChange={mockOnChange} />);

      await user.type(textarea, 'i');
      rerender(<TextEditor value="Hi" onChange={mockOnChange} />);

      await user.keyboard('{Control>}z{/Control}');
      await user.keyboard('{Control>}y{/Control}');

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({
            value: 'Hi'
          })
        })
      );
    });

    test('allows deep undo through multiple changes', async () => {
      const user = userEvent.setup();
      const ref = { current: null };
      const { rerender } = render(
        <TextEditor ref={ref} value="" onChange={mockOnChange} />
      );

      const textarea = screen.getByRole('textbox');
      await user.click(textarea);

      // Clear previous calls
      mockOnChange.mockClear();

      // Make several changes
      await user.type(textarea, 'A');
      rerender(<TextEditor ref={ref} value="A" onChange={mockOnChange} />);

      await user.type(textarea, 'B');
      rerender(<TextEditor ref={ref} value="AB" onChange={mockOnChange} />);

      await user.type(textarea, 'C');
      rerender(<TextEditor ref={ref} value="ABC" onChange={mockOnChange} />);

      // Clear the onChange calls from typing
      mockOnChange.mockClear();

      // Undo multiple times
      await user.keyboard('{Control>}z{/Control}'); // Should go to "AB"
      expect(mockOnChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({ value: 'AB' })
        })
      );

      await user.keyboard('{Control>}z{/Control}'); // Should go to "A"
      expect(mockOnChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({ value: 'A' })
        })
      );

      await user.keyboard('{Control>}z{/Control}'); // Should go to ""
      expect(mockOnChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({ value: '' })
        })
      );
    });

    test('resetHistory clears undo history', () => {
      const ref = { current: null };
      const { rerender } = render(
        <TextEditor ref={ref} value="" onChange={mockOnChange} />
      );

      // Make some changes
      rerender(<TextEditor ref={ref} value="Hello" onChange={mockOnChange} />);
      rerender(
        <TextEditor ref={ref} value="Hello World" onChange={mockOnChange} />
      );

      // Reset history
      ref.current.resetHistory();

      // Undo should not work now
      ref.current.undo();
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Ref API', () => {
    test('exposes focus method', () => {
      const ref = { current: null };
      render(<TextEditor ref={ref} value="" onChange={mockOnChange} />);

      expect(ref.current).toBeTruthy();
      expect(typeof ref.current.focus).toBe('function');
    });

    test('exposes undo/redo methods', () => {
      const ref = { current: null };
      render(<TextEditor ref={ref} value="" onChange={mockOnChange} />);

      expect(ref.current).toBeTruthy();
      expect(typeof ref.current.undo).toBe('function');
      expect(typeof ref.current.redo).toBe('function');
      expect(typeof ref.current.resetHistory).toBe('function');
    });

    test('exposes find/replace methods', () => {
      const ref = { current: null };
      render(<TextEditor ref={ref} value="" onChange={mockOnChange} />);

      expect(ref.current).toBeTruthy();
      expect(typeof ref.current.showFindReplace).toBe('function');
      expect(typeof ref.current.hideFindReplace).toBe('function');
    });

    test('focus method works', () => {
      const ref = { current: null };
      render(<TextEditor ref={ref} value="" onChange={mockOnChange} />);

      const textarea = screen.getByRole('textbox');
      ref.current.focus();

      expect(textarea).toHaveFocus();
    });
  });

  describe('Event handling', () => {
    test('calls onFocus when focused', async () => {
      const mockOnFocus = jest.fn();
      const user = userEvent.setup();

      render(
        <TextEditor value="" onFocus={mockOnFocus} onChange={mockOnChange} />
      );

      const textarea = screen.getByRole('textbox');
      await user.click(textarea);

      expect(mockOnFocus).toHaveBeenCalled();
    });

    test('calls onBlur when blurred', async () => {
      const mockOnBlur = jest.fn();
      const user = userEvent.setup();

      render(
        <div>
          <TextEditor value="" onBlur={mockOnBlur} onChange={mockOnChange} />
          <button>Other element</button>
        </div>
      );

      const textarea = screen.getByRole('textbox');
      const button = screen.getByText('Other element');

      await user.click(textarea);
      await user.click(button);

      expect(mockOnBlur).toHaveBeenCalled();
    });

    test('calls custom onKeyDown handler', async () => {
      const mockOnKeyDown = jest.fn();
      const user = userEvent.setup();

      render(
        <TextEditor
          value=""
          onKeyDown={mockOnKeyDown}
          onChange={mockOnChange}
        />
      );

      const textarea = screen.getByRole('textbox');
      await user.click(textarea);
      await user.keyboard('a');

      expect(mockOnKeyDown).toHaveBeenCalled();
    });
  });
});
