/**
 * Debug script for the merge test
 * Run with: node --experimental-modules debug-merge-test.js
 */

import { BrowserCollaborationService } from './src/utils/browserCollaborationService.js';

const service = new BrowserCollaborationService();

const createBook = (overrides = {}) => ({
  title: 'Test Book',
  author: 'Test Author',
  chapters: [],
  characters: [],
  locations: [],
  parts: [],
  backgroundFolders: [],
  frontMatter: [],
  characterDetectionBlacklist: [],
  template: {},
  github: {},
  metadata: {},
  collaboration: {},
  ...overrides
});

async function testMerge() {
  console.log('Testing scene merge...\n');

  const base = createBook({
    chapters: [{
      id: 'ch1',
      title: 'Chapter 1',
      scenes: [{ id: 's1', title: 'Scene 1', content: 'Content 1' }]
    }]
  });

  const local = createBook({
    chapters: [{
      id: 'ch1',
      title: 'Chapter 1',
      scenes: [
        { id: 's1', title: 'Scene 1', content: 'Content 1' },
        { id: 's2', title: 'Scene 2', content: 'Local Scene' }
      ]
    }]
  });

  const remote = createBook({
    chapters: [{
      id: 'ch1',
      title: 'Chapter 1',
      scenes: [
        { id: 's1', title: 'Scene 1', content: 'Content 1' },
        { id: 's3', title: 'Scene 3', content: 'Remote Scene' }
      ]
    }]
  });

  console.log('Base chapters:', JSON.stringify(base.chapters, null, 2));
  console.log('\nLocal chapters:', JSON.stringify(local.chapters, null, 2));
  console.log('\nRemote chapters:', JSON.stringify(remote.chapters, null, 2));

  const result = await service.mergeContent(base, remote, local);

  console.log('\n=== MERGE RESULT ===');
  console.log('Has conflicts:', result.hasConflicts);
  console.log('Conflicts:', JSON.stringify(result.conflicts, null, 2));
  console.log('\nMerged chapters:', JSON.stringify(result.content.chapters, null, 2));

  const scenes = result.content.chapters[0]?.scenes || [];
  console.log('\n=== VERIFICATION ===');
  console.log('Number of scenes:', scenes.length);
  console.log('Scene IDs:', scenes.map(s => s.id));

  const hasS1 = scenes.some(s => s.id === 's1');
  const hasS2 = scenes.some(s => s.id === 's2');
  const hasS3 = scenes.some(s => s.id === 's3');

  console.log('Has s1:', hasS1);
  console.log('Has s2:', hasS2);
  console.log('Has s3:', hasS3);

  if (scenes.length === 3 && hasS1 && hasS2 && hasS3 && !result.hasConflicts) {
    console.log('\n✅ TEST PASSED');
  } else {
    console.log('\n❌ TEST FAILED');
  }
}

testMerge().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
