import { BrowserCollaborationService } from '../browserCollaborationService';

describe('BrowserCollaborationService First Sync Issue - mergeContent', () => {
  it('should not throw conflicts on mergeContent when base is empty', async () => {
    const service = new BrowserCollaborationService();
    const baseObj = {}; // First sync!
    const localObj = {
      title: 'My Book',
      author: 'Author 1',
      scenes: [{ id: '1', content: 'Same content', modifiedAt: 123 }],
      template: {
        fontSize: 14
      }
    };
    const remoteObj = {
      title: 'My Book modified', // <-- This differs
      author: 'Author 1 modified', // <-- This differs
      scenes: [{ id: '1', content: 'Same content modified', modifiedAt: 456 }],
      template: {
        fontSize: 16
      }
    };

    const result = await service.mergeContent(baseObj, remoteObj, localObj);
    console.log(
      'CONFLICTS GENERATED:',
      JSON.stringify(result.conflicts, null, 2)
    );
    expect(result.conflicts.length).toBe(0);
  });
});
