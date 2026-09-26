import { renderHook, act } from '@testing-library/react';
import { useBookState } from '../useBookState';
import { useDrafts } from '../useDrafts';

const setup = () =>
  renderHook(() => {
    const state = useBookState();
    const drafts = useDrafts(state.setBook, state.bookRef);
    return { ...state, drafts };
  });

describe('useDrafts', () => {
  it('creates and switches drafts through setBook', () => {
    const { result } = setup();
    act(() => {
      result.current.addScene('default');
    });
    let draftId;
    act(() => {
      draftId = result.current.drafts.createDraft({
        name: 'Second',
        mode: 'copy'
      });
    });
    expect(result.current.book.drafts).toHaveLength(1);
    act(() => result.current.drafts.switchDraft(draftId));
    expect(result.current.book.activeDraft.name).toBe('Second');
  });

  it('creates and switches a scene revision by scene id', () => {
    const { result } = setup();
    let sceneId;
    act(() => {
      sceneId = result.current.addScene('default');
    });
    act(() => result.current.updateScene(sceneId, { content: 'v1' }));
    act(() =>
      result.current.drafts.createRevision(sceneId, {
        label: 'B',
        mode: 'blank'
      })
    );
    let scene = result.current.book.chapters[0].scenes[0];
    expect(scene.content).toBe('');
    act(() =>
      result.current.drafts.switchRevision(sceneId, scene.revisions[0].id)
    );
    scene = result.current.book.chapters[0].scenes[0];
    expect(scene.content).toBe('v1');
  });

  it('survives the load path (recoverBook) with drafts and revisions intact', () => {
    const { result } = setup();
    const saved = {
      ...result.current.book,
      activeDraft: { id: 'd1', name: 'Draft 1', created: 'x' },
      drafts: [
        { id: 'd2', name: 'Draft 2', created: 'y', chapters: [], parts: [] }
      ],
      parts: [{ id: 'p1', title: 'Part 1' }],
      chapters: [
        {
          id: 'c',
          title: 'C',
          scenes: [
            {
              id: 's',
              title: 'S',
              content: 'a',
              activeRevision: { id: 'r1', label: 'Revision 1', created: 'x' },
              revisions: [
                { id: 'r2', label: 'Alt', created: 'y', content: 'b' }
              ]
            }
          ]
        }
      ]
    };
    act(() => {
      result.current.recoverBook(saved);
    });
    const book = result.current.book;
    expect(book.drafts).toEqual(saved.drafts);
    expect(book.activeDraft).toEqual(saved.activeDraft);
    expect(book.parts).toEqual(saved.parts);
    expect(book.chapters[0].scenes[0].revisions[0].content).toBe('b');
    expect(book.chapters[0].scenes[0].activeRevision.id).toBe('r1');
  });
});
