import { render, screen, fireEvent } from '@testing-library/react';
import { createDraft } from '../../utils/draftOperations';
import DraftSwitcher from '../DraftSwitcher';

const baseBook = () => ({
  chapters: [{ id: 'c', title: 'C', scenes: [] }],
  parts: [],
  metadata: { created: '2026-01-01T00:00:00.000Z' }
});

const twoDrafts = () =>
  createDraft(baseBook(), {
    name: 'Second',
    mode: 'copy'
  });

const handlers = () => ({
  onCreate: jest.fn(),
  onSwitch: jest.fn(),
  onRename: jest.fn(),
  onDelete: jest.fn()
});

const openMenu = () =>
  fireEvent.click(screen.getByRole('button', { name: /^draft:/i }));

afterEach(() => jest.restoreAllMocks());

describe('DraftSwitcher', () => {
  it('shows the implicit Draft 1 for a legacy book', () => {
    render(<DraftSwitcher book={baseBook()} {...handlers()} />);
    expect(
      screen.getByRole('button', { name: 'Draft: Draft 1' })
    ).toBeInTheDocument();
  });

  it('keeps the menu closed until the button is clicked', () => {
    render(<DraftSwitcher book={baseBook()} {...handlers()} />);
    expect(screen.queryByRole('group', { name: 'Drafts' })).toBeNull();
    openMenu();
    expect(screen.getByRole('group', { name: 'Drafts' })).toBeInTheDocument();
  });

  it('switches draft when another is chosen and closes the menu', () => {
    const { book, draftId } = twoDrafts();
    const h = handlers();
    render(<DraftSwitcher book={book} {...h} />);
    openMenu();
    fireEvent.click(screen.getByRole('button', { name: 'Second' }));
    expect(h.onSwitch).toHaveBeenCalledWith(draftId);
    expect(screen.queryByRole('group', { name: 'Drafts' })).toBeNull();
  });

  it('does not switch when the active draft is chosen', () => {
    const { book } = twoDrafts();
    const h = handlers();
    render(<DraftSwitcher book={book} {...h} />);
    openMenu();
    fireEvent.click(screen.getByRole('button', { name: 'Draft 1' }));
    expect(h.onSwitch).not.toHaveBeenCalled();
  });

  it('marks the active draft', () => {
    const { book } = twoDrafts();
    render(<DraftSwitcher book={book} {...handlers()} />);
    openMenu();
    expect(screen.getByRole('button', { name: 'Draft 1' })).toHaveAttribute(
      'aria-current',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Second' })).not.toHaveAttribute(
      'aria-current'
    );
  });

  it('creates a draft from the menu via the dialog with the chosen mode', () => {
    const h = handlers();
    render(<DraftSwitcher book={baseBook()} {...h} />);
    openMenu();
    fireEvent.click(screen.getByRole('button', { name: /new draft/i }));
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'Rewrite' }
    });
    fireEvent.click(screen.getByLabelText(/outline only/i));
    fireEvent.click(screen.getByRole('button', { name: /^create$/i }));
    expect(h.onCreate).toHaveBeenCalledWith({ name: 'Rewrite', mode: 'empty' });
  });

  it('creates a blank-slate draft', () => {
    const h = handlers();
    render(<DraftSwitcher book={baseBook()} {...h} />);
    openMenu();
    fireEvent.click(screen.getByRole('button', { name: /new draft/i }));
    fireEvent.click(screen.getByLabelText(/blank slate/i));
    fireEvent.click(screen.getByRole('button', { name: /^create$/i }));
    expect(h.onCreate).toHaveBeenCalledWith({ name: 'Draft 2', mode: 'blank' });
  });

  it('defaults new-draft mode to copy and default name to Draft N', () => {
    const h = handlers();
    render(<DraftSwitcher book={baseBook()} {...h} />);
    openMenu();
    fireEvent.click(screen.getByRole('button', { name: /new draft/i }));
    expect(screen.getByLabelText(/name/i)).toHaveValue('Draft 2');
    fireEvent.click(screen.getByRole('button', { name: /^create$/i }));
    expect(h.onCreate).toHaveBeenCalledWith({ name: 'Draft 2', mode: 'copy' });
  });

  it('offers delete only for inactive drafts, after confirmation', () => {
    const { book, draftId } = twoDrafts();
    const h = handlers();
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    render(<DraftSwitcher book={book} {...h} />);
    openMenu();
    expect(
      screen.queryByRole('button', { name: 'Delete “Draft 1”' })
    ).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Delete “Second”' }));
    expect(window.confirm).toHaveBeenCalled();
    expect(h.onDelete).toHaveBeenCalledWith(draftId);
  });

  it('does not delete when confirmation is declined', () => {
    const { book } = twoDrafts();
    const h = handlers();
    jest.spyOn(window, 'confirm').mockReturnValue(false);
    render(<DraftSwitcher book={book} {...h} />);
    openMenu();
    fireEvent.click(screen.getByRole('button', { name: 'Delete “Second”' }));
    expect(h.onDelete).not.toHaveBeenCalled();
  });

  it('renames a draft in place with Enter', () => {
    const { book, draftId } = twoDrafts();
    const h = handlers();
    render(<DraftSwitcher book={book} {...h} />);
    openMenu();
    fireEvent.click(screen.getByRole('button', { name: 'Rename “Second”' }));
    const input = screen.getByRole('textbox', { name: 'Draft name' });
    expect(input).toHaveValue('Second');
    fireEvent.change(input, { target: { value: 'Second pass' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(h.onRename).toHaveBeenCalledWith(draftId, 'Second pass');
    expect(screen.queryByRole('textbox', { name: 'Draft name' })).toBeNull();
  });

  it('renames the active draft too', () => {
    const { book } = twoDrafts();
    const h = handlers();
    render(<DraftSwitcher book={book} {...h} />);
    openMenu();
    fireEvent.click(screen.getByRole('button', { name: 'Rename “Draft 1”' }));
    const input = screen.getByRole('textbox', { name: 'Draft name' });
    fireEvent.change(input, { target: { value: 'First pass' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(h.onRename).toHaveBeenCalledWith(book.activeDraft.id, 'First pass');
  });

  it('cancels a rename with Escape without closing the menu', () => {
    const { book } = twoDrafts();
    const h = handlers();
    render(<DraftSwitcher book={book} {...h} />);
    openMenu();
    fireEvent.click(screen.getByRole('button', { name: 'Rename “Second”' }));
    const input = screen.getByRole('textbox', { name: 'Draft name' });
    fireEvent.change(input, { target: { value: 'Nope' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(h.onRename).not.toHaveBeenCalled();
    expect(screen.queryByRole('textbox', { name: 'Draft name' })).toBeNull();
    expect(screen.getByRole('group', { name: 'Drafts' })).toBeInTheDocument();
  });

  it('ignores a blank or unchanged rename', () => {
    const { book } = twoDrafts();
    const h = handlers();
    render(<DraftSwitcher book={book} {...h} />);
    openMenu();
    fireEvent.click(screen.getByRole('button', { name: 'Rename “Second”' }));
    const input = screen.getByRole('textbox', { name: 'Draft name' });
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.click(screen.getByRole('button', { name: 'Rename “Second”' }));
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Draft name' }), {
      key: 'Enter'
    });
    expect(h.onRename).not.toHaveBeenCalled();
  });

  it('closes the menu with Escape', () => {
    render(<DraftSwitcher book={baseBook()} {...handlers()} />);
    openMenu();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('group', { name: 'Drafts' })).toBeNull();
  });

  it('closes the menu on an outside click', () => {
    render(
      <div>
        <p>outside</p>
        <DraftSwitcher book={baseBook()} {...handlers()} />
      </div>
    );
    openMenu();
    fireEvent.mouseDown(screen.getByText('outside'));
    expect(screen.queryByRole('group', { name: 'Drafts' })).toBeNull();
  });
});
