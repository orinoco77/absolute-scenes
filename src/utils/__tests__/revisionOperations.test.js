import {
  getRevisionInfo,
  createRevision,
  switchRevision,
  renameRevision,
  deleteRevision
} from '../revisionOperations';

const makeScene = () => ({
  id: 's1',
  title: 'One',
  content: 'first take',
  notes: ''
});

describe('getRevisionInfo', () => {
  it('treats a legacy scene as a single "Revision 1"', () => {
    const info = getRevisionInfo(makeScene());
    expect(info.total).toBe(1);
    expect(info.activeLabel).toBe('Revision 1');
  });
});

describe('createRevision', () => {
  it('copy + activate: parks the old text, new revision active with the same text', () => {
    const next = createRevision(makeScene(), { label: '', mode: 'copy' });
    expect(next.content).toBe('first take');
    expect(next.revisions).toHaveLength(1);
    expect(next.revisions[0]).toMatchObject({
      label: 'Revision 1',
      content: 'first take'
    });
    expect(next.activeRevision.label).toBe('Revision 2');
    expect(getRevisionInfo(next).total).toBe(2);
  });

  it('blank + activate: new blank text is active, old text preserved', () => {
    const next = createRevision(makeScene(), {
      label: 'Rewrite',
      mode: 'blank'
    });
    expect(next.content).toBe('');
    expect(next.activeRevision.label).toBe('Rewrite');
    expect(next.revisions[0].content).toBe('first take');
  });

  it('activate:false keeps the current revision active', () => {
    const next = createRevision(makeScene(), {
      label: 'Spare',
      mode: 'blank',
      activate: false
    });
    expect(next.content).toBe('first take');
    expect(next.activeRevision.label).toBe('Revision 1');
    expect(next.revisions).toEqual([
      expect.objectContaining({ label: 'Spare', content: '' })
    ]);
  });

  it('does not mutate the input', () => {
    const scene = makeScene();
    const snap = JSON.stringify(scene);
    createRevision(scene, { label: 'x', mode: 'copy' });
    expect(JSON.stringify(scene)).toBe(snap);
  });
});

describe('switchRevision', () => {
  it('swaps content with the chosen revision without losing edits to the active one', () => {
    let scene = createRevision(makeScene(), { label: 'B', mode: 'blank' });
    scene = { ...scene, content: 'second take, edited' };
    const first = scene.revisions[0].id;
    const switched = switchRevision(scene, first);
    expect(switched.content).toBe('first take');
    expect(switched.revisions[0].content).toBe('second take, edited');
    expect(switched.activeRevision.label).toBe('Revision 1');
    // and back again
    const back = switchRevision(switched, switched.revisions[0].id);
    expect(back.content).toBe('second take, edited');
  });

  it('is a no-op for the active or unknown revision', () => {
    const scene = createRevision(makeScene(), { label: 'B', mode: 'copy' });
    expect(switchRevision(scene, scene.activeRevision.id)).toBe(scene);
    expect(switchRevision(scene, 'nope')).toBe(scene);
  });
});

describe('renameRevision', () => {
  it('renames active and inactive revisions; ignores empty names', () => {
    const scene = createRevision(makeScene(), { label: 'B', mode: 'copy' });
    expect(
      renameRevision(scene, scene.activeRevision.id, ' Final ').activeRevision
        .label
    ).toBe('Final');
    expect(
      renameRevision(scene, scene.revisions[0].id, 'Old').revisions[0].label
    ).toBe('Old');
    expect(renameRevision(scene, scene.activeRevision.id, ' ')).toBe(scene);
  });
});

describe('deleteRevision', () => {
  it('deletes an inactive revision', () => {
    const scene = createRevision(makeScene(), { label: 'B', mode: 'copy' });
    expect(deleteRevision(scene, scene.revisions[0].id).revisions).toEqual([]);
  });

  it('throws for the active revision and for unknown ids', () => {
    const scene = createRevision(makeScene(), { label: 'B', mode: 'copy' });
    expect(() => deleteRevision(scene, scene.activeRevision.id)).toThrow(
      /active revision/i
    );
    expect(() => deleteRevision(scene, 'nope')).toThrow(/not found/i);
  });
});
