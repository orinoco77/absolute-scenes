// Pure functions for scene revisions. scene.content is the ACTIVE revision's
// text; scene.revisions[] holds inactive revisions only.
import { newId } from './draftOperations';

const now = () => new Date().toISOString();

const ensureActive = scene =>
  scene.activeRevision
    ? scene
    : {
        ...scene,
        activeRevision: {
          id: `${scene.id}-rev1`,
          label: 'Revision 1',
          created: scene.created || now()
        }
      };

export const getRevisionInfo = scene => {
  const s = ensureActive(scene);
  const inactive = (s.revisions || []).map(r => ({
    id: r.id,
    label: r.label,
    created: r.created,
    isActive: false
  }));
  return {
    activeId: s.activeRevision.id,
    activeLabel: s.activeRevision.label,
    total: inactive.length + 1,
    revisions: [
      {
        id: s.activeRevision.id,
        label: s.activeRevision.label,
        created: s.activeRevision.created,
        isActive: true
      },
      ...inactive
    ]
  };
};

export const createRevision = (scene, { label, mode, activate = true }) => {
  const s = ensureActive(scene);
  const total = (s.revisions || []).length + 1;
  const text = mode === 'copy' ? s.content || '' : '';
  const name = (label || '').trim() || `Revision ${total + 1}`;
  const fresh = { id: newId(), label: name, created: now() };

  if (!activate) {
    return {
      ...s,
      revisions: [...(s.revisions || []), { ...fresh, content: text }],
      modified: now()
    };
  }
  return {
    ...s,
    content: text,
    activeRevision: fresh,
    revisions: [
      ...(s.revisions || []),
      { ...s.activeRevision, content: s.content || '' }
    ],
    modified: now()
  };
};

export const switchRevision = (scene, revId) => {
  const s = ensureActive(scene);
  if (revId === s.activeRevision.id) return scene;
  const target = (s.revisions || []).find(r => r.id === revId);
  if (!target) return scene;
  const { content: targetContent, ...targetMeta } = target;
  return {
    ...s,
    content: targetContent,
    activeRevision: targetMeta,
    revisions: s.revisions.map(r =>
      r.id === revId ? { ...s.activeRevision, content: s.content || '' } : r
    ),
    modified: now()
  };
};

export const renameRevision = (scene, revId, label) => {
  const trimmed = (label || '').trim();
  if (!trimmed) return scene;
  const s = ensureActive(scene);
  if (revId === s.activeRevision.id) {
    return { ...s, activeRevision: { ...s.activeRevision, label: trimmed } };
  }
  if (!(s.revisions || []).some(r => r.id === revId)) return scene;
  return {
    ...s,
    revisions: s.revisions.map(r =>
      r.id === revId ? { ...r, label: trimmed } : r
    )
  };
};

export const deleteRevision = (scene, revId) => {
  const s = ensureActive(scene);
  if (revId === s.activeRevision.id)
    throw new Error('Cannot delete the active revision');
  if (!(s.revisions || []).some(r => r.id === revId))
    throw new Error('Revision not found');
  return { ...s, revisions: s.revisions.filter(r => r.id !== revId) };
};
