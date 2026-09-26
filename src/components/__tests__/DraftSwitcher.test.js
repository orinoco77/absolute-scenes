// src/components/__tests__/DraftSwitcher.test.js
import { render, screen, fireEvent } from '@testing-library/react';
import { createDraft } from '../../utils/draftOperations';
import DraftSwitcher from '../DraftSwitcher';

const baseBook = () => ({
  chapters: [{ id: 'c', title: 'C', scenes: [] }],
  parts: [],
  metadata: { created: '2026-01-01T00:00:00.000Z' }
});

const handlers = () => ({
  onCreate: jest.fn(),
  onSwitch: jest.fn(),
  onRename: jest.fn(),
  onDelete: jest.fn()
});

describe('DraftSwitcher', () => {
  it('shows the implicit Draft 1 for a legacy book', () => {
    render(<DraftSwitcher book={baseBook()} {...handlers()} />);
    expect(screen.getByLabelText('Draft')).toHaveDisplayValue('Draft 1');
  });

  it('switches draft when another is chosen', () => {
    const { book, draftId } = createDraft(baseBook(), {
      name: 'Second',
      mode: 'copy'
    });
    const h = handlers();
    render(<DraftSwitcher book={book} {...h} />);
    fireEvent.change(screen.getByLabelText('Draft'), {
      target: { value: draftId }
    });
    expect(h.onSwitch).toHaveBeenCalledWith(draftId);
  });

  it('creates a draft via the dialog with the chosen mode', () => {
    const h = handlers();
    render(<DraftSwitcher book={baseBook()} {...h} />);
    fireEvent.click(screen.getByRole('button', { name: /new draft/i }));
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'Rewrite' }
    });
    fireEvent.click(screen.getByLabelText(/empty structure/i));
    fireEvent.click(screen.getByRole('button', { name: /^create$/i }));
    expect(h.onCreate).toHaveBeenCalledWith({ name: 'Rewrite', mode: 'empty' });
  });

  it('defaults new-draft mode to copy and default name to Draft N', () => {
    const h = handlers();
    render(<DraftSwitcher book={baseBook()} {...h} />);
    fireEvent.click(screen.getByRole('button', { name: /new draft/i }));
    expect(screen.getByLabelText(/name/i)).toHaveValue('Draft 2');
    fireEvent.click(screen.getByRole('button', { name: /^create$/i }));
    expect(h.onCreate).toHaveBeenCalledWith({ name: 'Draft 2', mode: 'copy' });
  });

  it('only offers delete for inactive drafts, after confirmation', () => {
    const { book, draftId } = createDraft(baseBook(), {
      name: 'Second',
      mode: 'copy'
    });
    const h = handlers();
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    render(<DraftSwitcher book={book} {...h} />);
    fireEvent.click(screen.getByRole('button', { name: /draft options/i }));
    expect(
      screen.queryByRole('menuitem', { name: /delete “draft 1”/i })
    ).toBeNull();
    fireEvent.click(screen.getByRole('menuitem', { name: /delete “second”/i }));
    expect(h.onDelete).toHaveBeenCalledWith(draftId);
  });
});
