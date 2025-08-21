// Mock the electron module since these are main process functions
const mockDialog = {
  showOpenDialog: jest.fn()
};

const mockFS = {
  promises: {
    readFile: jest.fn(),
    readdir: jest.fn(),
    stat: jest.fn()
  }
};

const mockPath = {
  join: jest.fn((...args) => args.join('/')),
  extname: jest.fn(filePath => {
    const parts = filePath.split('.');
    return parts.length > 1 ? '.' + parts[parts.length - 1] : '';
  })
};

// Mock electron main process functions
global.mockElectronMain = {
  dialog: mockDialog,
  fs: mockFS,
  path: mockPath
};

// Import the functions we want to test (these would normally be in electron.js)
const {
  parseCompileSettings,
  convertRtfToPlainText,
  importScrivenerProjectSync
} = require('../scrivenerImportTestHelpers');

describe('Scrivener Import Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parseCompileSettings', () => {
    test('should extract title and author from compile.xml', () => {
      const compileXml = `<?xml version="1.0" encoding="UTF-8"?>
        <CompileSettings>
          <Title>The Fractured Crown</Title>
          <Author>Adam Short</Author>
          <Format>
            <Name>Paperback Novel</Name>
          </Format>
        </CompileSettings>`;

      const result = parseCompileSettings(compileXml);

      expect(result).toEqual({
        title: 'The Fractured Crown',
        author: 'Adam Short'
      });
    });

    test('should handle missing title gracefully', () => {
      const compileXml = `<?xml version="1.0" encoding="UTF-8"?>
        <CompileSettings>
          <Author>John Doe</Author>
        </CompileSettings>`;

      const result = parseCompileSettings(compileXml);

      expect(result).toEqual({
        title: '',
        author: 'John Doe'
      });
    });

    test('should handle missing author gracefully', () => {
      const compileXml = `<?xml version="1.0" encoding="UTF-8"?>
        <CompileSettings>
          <Title>Test Book</Title>
        </CompileSettings>`;

      const result = parseCompileSettings(compileXml);

      expect(result).toEqual({
        title: 'Test Book',
        author: ''
      });
    });

    test('should handle malformed XML gracefully', () => {
      const compileXml = `Invalid XML content`;

      const result = parseCompileSettings(compileXml);

      expect(result).toEqual({
        title: '',
        author: ''
      });
    });

    test('should handle empty XML gracefully', () => {
      const compileXml = '';

      const result = parseCompileSettings(compileXml);

      expect(result).toEqual({
        title: '',
        author: ''
      });
    });
  });

  describe('convertRtfToPlainText', () => {
    test('should convert basic RTF to plain text', () => {
      const rtfContent = `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}
        {\\f0\\fs24 This is a test paragraph.}}`;

      const result = convertRtfToPlainText(rtfContent);

      expect(result).toBe('This is a test paragraph.');
    });

    test('should handle smart quotes conversion', () => {
      const rtfContent = `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}
        {\\f0\\fs24 "Hello" and 'world' with smart quotes.}}`;

      const result = convertRtfToPlainText(rtfContent);

      expect(result).toBe('"Hello" and \'world\' with smart quotes.');
    });

    test('should remove RTF formatting codes', () => {
      const rtfContent = `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}
        {\\f0\\fs24\\b Bold text} and {\\i italic text}.}`;

      const result = convertRtfToPlainText(rtfContent);

      expect(result).toBe('Bold text and italic text.');
    });

    test('should handle line breaks properly', () => {
      const rtfContent = `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}
        {\\f0\\fs24 First line\\par Second line\\par Third line}}`;

      const result = convertRtfToPlainText(rtfContent);

      expect(result).toBe('First line Second line Third line');
    });

    test('should remove font name artifacts', () => {
      const rtfContent = `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 PalatinoLinotype-Italic;}}
        PalatinoLinotype-Italic; This is the actual content.}`;

      const result = convertRtfToPlainText(rtfContent);

      expect(result).toBe('This is the actual content.');
    });

    test('should handle Windows-1252 encoding characters', () => {
      const rtfContent = `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}
        {\\f0\\fs24 Smart quotes \\u8220?Hello\\u8221? and apostrophe \\u8217?s}}`;

      const result = convertRtfToPlainText(rtfContent);

      expect(result).toBe('Smart quotes Hello and apostrophe s');
    });

    test('should clean up leading artifacts', () => {
      const rtfContent = `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}
        ;;*irnatural This is the real content.}`;

      const result = convertRtfToPlainText(rtfContent);

      expect(result).toBe('This is the real content.');
    });

    test('should handle empty RTF content', () => {
      const rtfContent = '';

      const result = convertRtfToPlainText(rtfContent);

      expect(result).toBe('');
    });

    test('should handle non-RTF content gracefully', () => {
      const rtfContent = 'This is plain text, not RTF';

      const result = convertRtfToPlainText(rtfContent);

      expect(result).toBe('This is plain text, not RTF');
    });

    test('should remove multiple consecutive spaces', () => {
      const rtfContent = `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}
        {\\f0\\fs24 Text   with    multiple     spaces.}}`;

      const result = convertRtfToPlainText(rtfContent);

      expect(result).toBe('Text with multiple spaces.');
    });
  });

  describe('importScrivenerProjectSync', () => {
    const mockScrivxContent = `<?xml version="1.0" encoding="UTF-8"?>
      <ScrivenerProject>
        <Binder>
          <BinderItem Type="Folder" UUID="part-1">
            <Title>Part One</Title>
            <MetaData>
              <SectionTypes>
                <Type>part-type-id</Type>
              </SectionTypes>
            </MetaData>
            <Children>
              <BinderItem Type="Text" UUID="chapter-1">
                <Title>Chapter 1</Title>
                <MetaData>
                  <SectionTypes>
                    <Type>chapter-type-id</Type>
                  </SectionTypes>
                </MetaData>
              </BinderItem>
            </Children>
          </BinderItem>
          <BinderItem Type="Folder" UUID="characters-folder">
            <Title>Characters</Title>
            <Children>
              <BinderItem Type="Text" UUID="char-1">
                <Title>John Smith</Title>
              </BinderItem>
            </Children>
          </BinderItem>
        </Binder>
        <LabelSettings>
          <LevelTypes>
            <Item>
              <Name>Part</Name>
              <SynonymOf>part-type-id</SynonymOf>
            </Item>
            <Item>
              <Name>Chapter</Name>
              <SynonymOf>chapter-type-id</SynonymOf>
            </Item>
          </LevelTypes>
        </LabelSettings>
        <SectionTypes>
          <SectionType UUID="part-type-id">
            <Name>Part</Name>
          </SectionType>
          <SectionType UUID="chapter-type-id">
            <Name>Chapter</Name>
          </SectionType>
        </SectionTypes>
      </ScrivenerProject>`;

    const mockCompileContent = `<?xml version="1.0" encoding="UTF-8"?>
      <CompileSettings>
        <Title>Test Novel</Title>
        <Author>Test Author</Author>
      </CompileSettings>`;

    const mockChapterContent = `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}
      {\\f0\\fs24 This is the content of chapter 1.}}`;

    const mockCharacterContent = `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}
      {\\f0\\fs24 John Smith is the protagonist. He is tall and brave.}}`;

    beforeEach(() => {
      mockFS.promises.readFile.mockImplementation(filePath => {
        if (filePath.includes('.scrivx')) {
          return Promise.resolve(mockScrivxContent);
        }
        if (filePath.includes('compile.xml')) {
          return Promise.resolve(mockCompileContent);
        }
        if (filePath.includes('chapter-1.rtf')) {
          return Promise.resolve(mockChapterContent);
        }
        if (filePath.includes('char-1.rtf')) {
          return Promise.resolve(mockCharacterContent);
        }
        return Promise.reject(new Error('File not found'));
      });

      mockFS.promises.readdir.mockImplementation(dirPath => {
        if (dirPath.includes('Files/Data')) {
          return Promise.resolve(['chapter-1.rtf', 'char-1.rtf']);
        }
        return Promise.resolve([]);
      });

      mockFS.promises.stat.mockImplementation(() => {
        return Promise.resolve({
          isDirectory: () => false,
          isFile: () => true
        });
      });
    });

    test('should import a basic Scrivener project successfully', async () => {
      const projectPath = '/path/to/test.scriv';

      const result = await importScrivenerProjectSync(projectPath);

      expect(result.title).toBe('Test Novel');
      expect(result.author).toBe('Test Author');
      expect(result.frontMatter).toEqual([]);
      expect(result.parts).toHaveLength(1);
      expect(result.parts[0].title).toBe('Part One');
      expect(result.characters).toHaveLength(1);
      expect(result.characters[0].name).toBe('John Smith');
      expect(result.backgroundFolders).toEqual(expect.any(Array));
    });

    test('should handle missing compile.xml gracefully', async () => {
      mockFS.promises.readFile.mockImplementation(filePath => {
        if (filePath.includes('.scrivx')) {
          return Promise.resolve(mockScrivxContent);
        }
        if (filePath.includes('compile.xml')) {
          return Promise.reject(new Error('File not found'));
        }
        return Promise.resolve('');
      });

      const projectPath = '/path/to/test.scriv';

      const result = await importScrivenerProjectSync(projectPath);

      expect(result.title).toBe('');
      expect(result.author).toBe('');
    });

    test('should handle malformed scrivx file', async () => {
      mockFS.promises.readFile.mockImplementation(filePath => {
        if (filePath.includes('.scrivx')) {
          return Promise.resolve('Invalid XML content');
        }
        return Promise.resolve('');
      });

      const projectPath = '/path/to/test.scriv';

      const result = await importScrivenerProjectSync(projectPath);
      // Should return default structure even with malformed XML
      expect(result.title).toBe('');
      expect(result.author).toBe('');
    });

    test('should identify front matter items correctly', async () => {
      const frontMatterScrivx = `<?xml version="1.0" encoding="UTF-8"?>
        <ScrivenerProject>
          <Binder>
            <BinderItem Type="Folder" UUID="front-matter">
              <Title>Front Matter</Title>
              <Children>
                <BinderItem Type="Text" UUID="prologue">
                  <Title>Prologue</Title>
                </BinderItem>
              </Children>
            </BinderItem>
          </Binder>
          <LabelSettings>
            <LevelTypes>
            </LevelTypes>
          </LabelSettings>
          <SectionTypes>
          </SectionTypes>
        </ScrivenerProject>`;

      const prologueContent = `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}
        {\\f0\\fs24 This is the prologue content.}}`;

      mockFS.promises.readFile.mockImplementation(filePath => {
        if (filePath.includes('.scrivx')) {
          return Promise.resolve(frontMatterScrivx);
        }
        if (filePath.includes('prologue.rtf')) {
          return Promise.resolve(prologueContent);
        }
        return Promise.resolve('');
      });

      const projectPath = '/path/to/test.scriv';

      const result = await importScrivenerProjectSync(projectPath);

      expect(result.frontMatter.length).toBeGreaterThan(0);
      const prologueItem = result.frontMatter.find(
        item => item.id === 'prologue'
      );
      expect(prologueItem).toBeDefined();
      expect(prologueItem.title).toBe('Prologue');
      expect(prologueItem.content).toBe('This is the prologue content.');
    });

    test('should handle empty chapters gracefully', async () => {
      const emptyChapterScrivx = `<?xml version="1.0" encoding="UTF-8"?>
        <ScrivenerProject>
          <Binder>
            <BinderItem Type="Text" UUID="empty-chapter">
              <Title>Empty Chapter</Title>
            </BinderItem>
          </Binder>
          <LabelSettings>
            <LevelTypes>
            </LevelTypes>
          </LabelSettings>
          <SectionTypes>
          </SectionTypes>
        </ScrivenerProject>`;

      mockFS.promises.readFile.mockImplementation(filePath => {
        if (filePath.includes('.scrivx')) {
          return Promise.resolve(emptyChapterScrivx);
        }
        if (filePath.includes('empty-chapter.rtf')) {
          return Promise.resolve('');
        }
        return Promise.resolve('');
      });

      const projectPath = '/path/to/test.scriv';

      const result = await importScrivenerProjectSync(projectPath);

      expect(result.chapters).toHaveLength(1);
      expect(result.chapters[0].scenes).toHaveLength(1);
      expect(result.chapters[0].scenes[0].content).toBe('');
    });

    test('should detect locations from Research folder', async () => {
      const locationsScrivx = `<?xml version="1.0" encoding="UTF-8"?>
        <ScrivenerProject>
          <Binder>
            <BinderItem Type="Folder" UUID="research">
              <Title>Research</Title>
              <Children>
                <BinderItem Type="Folder" UUID="places">
                  <Title>Places</Title>
                  <Children>
                    <BinderItem Type="Text" UUID="location-1">
                      <Title>Castle Blackstone</Title>
                    </BinderItem>
                  </Children>
                </BinderItem>
              </Children>
            </BinderItem>
          </Binder>
          <LabelSettings>
            <LevelTypes>
            </LevelTypes>
          </LabelSettings>
          <SectionTypes>
          </SectionTypes>
        </ScrivenerProject>`;

      const locationContent = `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}
        {\\f0\\fs24 A dark and imposing fortress.}}`;

      mockFS.promises.readFile.mockImplementation(filePath => {
        if (filePath.includes('.scrivx')) {
          return Promise.resolve(locationsScrivx);
        }
        if (filePath.includes('location-1.rtf')) {
          return Promise.resolve(locationContent);
        }
        return Promise.resolve('');
      });

      const projectPath = '/path/to/test.scriv';

      const result = await importScrivenerProjectSync(projectPath);

      expect(result.locations.length).toBeGreaterThan(0);
      const castleLocation = result.locations.find(
        loc => loc.id === 'location-1'
      );
      expect(castleLocation).toBeDefined();
      expect(castleLocation.name).toBe('Castle Blackstone');
      expect(castleLocation.description).toBe('A dark and imposing fortress.');
    });
  });

  describe('Integration Tests', () => {
    test('should handle a complete Fantasy Saga-style project structure', async () => {
      const complexScrivx = `<?xml version="1.0" encoding="UTF-8"?>
        <ScrivenerProject>
          <Binder>
            <BinderItem Type="Folder" UUID="manuscript">
              <Title>Manuscript</Title>
              <Children>
                <BinderItem Type="Folder" UUID="part-1">
                  <Title>Part One: The Beginning</Title>
                  <MetaData>
                    <SectionTypes>
                      <Type>part-type</Type>
                    </SectionTypes>
                  </MetaData>
                  <Children>
                    <BinderItem Type="Folder" UUID="chapter-1">
                      <Title>Chapter 1</Title>
                      <MetaData>
                        <SectionTypes>
                          <Type>chapter-type</Type>
                        </SectionTypes>
                      </MetaData>
                      <Children>
                        <BinderItem Type="Text" UUID="scene-1">
                          <Title>Opening Scene</Title>
                          <MetaData>
                            <SectionTypes>
                              <Type>scene-type</Type>
                            </SectionTypes>
                          </MetaData>
                        </BinderItem>
                        <BinderItem Type="Text" UUID="scene-2">
                          <Title>Second Scene</Title>
                          <MetaData>
                            <SectionTypes>
                              <Type>scene-type</Type>
                            </SectionTypes>
                          </MetaData>
                        </BinderItem>
                      </Children>
                    </BinderItem>
                  </Children>
                </BinderItem>
              </Children>
            </BinderItem>
            <BinderItem Type="Folder" UUID="research">
              <Title>Research</Title>
              <Children>
                <BinderItem Type="Folder" UUID="characters">
                  <Title>Characters</Title>
                  <Children>
                    <BinderItem Type="Text" UUID="protagonist">
                      <Title>Hero Character</Title>
                    </BinderItem>
                  </Children>
                </BinderItem>
              </Children>
            </BinderItem>
          </Binder>
          <LabelSettings>
            <LevelTypes>
              <Item>
                <Name>Part</Name>
                <SynonymOf>part-type</SynonymOf>
              </Item>
              <Item>
                <Name>Chapter</Name>
                <SynonymOf>chapter-type</SynonymOf>
              </Item>
              <Item>
                <Name>Scene</Name>
                <SynonymOf>scene-type</SynonymOf>
              </Item>
            </LevelTypes>
          </LabelSettings>
          <SectionTypes>
            <SectionType UUID="part-type">
              <Name>Part</Name>
            </SectionType>
            <SectionType UUID="chapter-type">
              <Name>Chapter</Name>
            </SectionType>
            <SectionType UUID="scene-type">
              <Name>Scene</Name>
            </SectionType>
          </SectionTypes>
        </ScrivenerProject>`;

      mockFS.promises.readFile.mockImplementation(filePath => {
        if (filePath.includes('.scrivx')) {
          return Promise.resolve(complexScrivx);
        }
        if (filePath.includes('scene-1.rtf')) {
          return Promise.resolve('{\\rtf1 Scene 1 content here.}');
        }
        if (filePath.includes('scene-2.rtf')) {
          return Promise.resolve('{\\rtf1 Scene 2 content here.}');
        }
        if (filePath.includes('protagonist.rtf')) {
          return Promise.resolve('{\\rtf1 The hero of our story.}');
        }
        return Promise.resolve('');
      });

      const projectPath = '/path/to/fantasy.scriv';

      const result = await importScrivenerProjectSync(projectPath);

      // Should have proper part structure
      expect(result.parts.length).toBeGreaterThan(0);
      const partOne = result.parts.find(
        part => part.title === 'Part One: The Beginning'
      );
      expect(partOne).toBeDefined();
      expect(partOne.chapterIds).toEqual(['chapter-1']);

      // Should have multiple chapters/scenes (simplified test parsing)
      expect(result.chapters.length).toBeGreaterThan(0);

      // Find the scene chapters
      const openingScene = result.chapters.find(
        ch => ch.title === 'Opening Scene'
      );
      const secondScene = result.chapters.find(
        ch => ch.title === 'Second Scene'
      );

      expect(openingScene).toBeDefined();
      expect(secondScene).toBeDefined();

      // Should have character(s) - allow for parsing variations
      expect(result.characters.length).toBeGreaterThan(0);
      const heroChar = result.characters.find(
        ch => ch.name === 'Hero Character'
      );
      expect(heroChar).toBeDefined();
      expect(heroChar.name).toBe('Hero Character');
    });
  });
});
