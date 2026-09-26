// src/components/__tests__/RevisionChip.test.js
import { render, screen, fireEvent } from '@testing-library/react';
import { createRevision } from '../../utils/revisionOperations';
import RevisionChip from '../RevisionChip';

const scene = () => ({ id: 's', title: 'S', content: 'text' });
const handlers = () => ({
  onCreate: jest.fn(),
  onSwitch: jest.fn(),
  onRename: jest.fn(),
  onDelete: jest.fn()
});

describe('RevisionChip', () => {
  it('shows "Revision 1 of 1" for a legacy scene', () => {
    render(<RevisionChip scene={scene()} {...handlers()} />);
    expect(
      screen.getByRole('button', { name: /revision 1 of 1/i })
    ).toBeInTheDocument();
  });

  it('lists revisions and switches on click', () => {
    const s = createRevision(scene(), { label: 'Alt', mode: 'copy' });
    const h = handlers();
    render(<RevisionChip scene={s} {...h} />);
    fireEvent.click(screen.getByRole('button', { name: /revision 2 of 2/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Revision 1' }));
    expect(h.onSwitch).toHaveBeenCalledWith(s.revisions[0].id);
  });

  it('creates a revision with mode and activate options', () => {
    const h = handlers();
    render(<RevisionChip scene={scene()} {...h} />);
    fireEvent.click(screen.getByRole('button', { name: /revision 1 of 1/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /new revision/i }));
    fireEvent.change(screen.getByLabelText(/label/i), {
      target: { value: 'Darker' }
    });
    fireEvent.click(screen.getByLabelText(/start blank/i));
    fireEvent.click(screen.getByRole('button', { name: /^create$/i }));
    expect(h.onCreate).toHaveBeenCalledWith({
      label: 'Darker',
      mode: 'blank',
      activate: true
    });
  });

  it('does not offer delete for the active revision', () => {
    const s = createRevision(scene(), { label: 'Alt', mode: 'copy' });
    render(<RevisionChip scene={s} {...handlers()} />);
    fireEvent.click(screen.getByRole('button', { name: /revision 2 of 2/i }));
    expect(
      screen.queryByRole('menuitem', { name: /delete “alt”/i })
    ).toBeNull();
    expect(
      screen.getByRole('menuitem', { name: /delete “revision 1”/i })
    ).toBeInTheDocument();
  });
});
