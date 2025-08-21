// Test helpers for Scrivener import functionality
// These functions extract the core logic from electron.js to make it testable

const { DOMParser } = require('xmldom');

// Extract parseCompileSettings function
function parseCompileSettings(compileXmlContent) {
  try {
    if (!compileXmlContent || compileXmlContent.trim() === '') {
      return { title: '', author: '' };
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(compileXmlContent, 'text/xml');

    // Check for parsing errors
    const parserErrors = doc.getElementsByTagName('parsererror');
    if (parserErrors.length > 0) {
      return { title: '', author: '' };
    }

    const titleElement = doc.getElementsByTagName('Title')[0];
    const authorElement = doc.getElementsByTagName('Author')[0];

    const title = titleElement?.textContent?.trim() || '';
    const author = authorElement?.textContent?.trim() || '';

    return { title, author };
  } catch (error) {
    return { title: '', author: '' };
  }
}

// Extract convertRtfToPlainText function
function convertRtfToPlainText(rtfContent) {
  try {
    if (!rtfContent || rtfContent.trim() === '') {
      return '';
    }

    // If it's not RTF content, return as-is
    if (!rtfContent.includes('{\\rtf')) {
      return rtfContent.trim();
    }

    let text = rtfContent;

    // Remove RTF header and font table
    text = text.replace(/{\\rtf1[^}]*}/g, '');
    text = text.replace(/{\\fonttbl[^}]*}/g, '');
    text = text.replace(/{\\colortbl[^}]*}/g, '');
    text = text.replace(/{\\stylesheet[^}]*}/g, '');

    // Remove RTF control words
    text = text.replace(/\\[a-z]+\d*/g, '');
    text = text.replace(/\\[^a-z]/g, '');

    // Handle Unicode characters
    text = text.replace(/\\u(\d+)\?/g, (match, code) => {
      const charCode = parseInt(code, 10);
      // Handle Windows-1252 encoding for common characters
      if (charCode === 8220 || charCode === 8221) return '"'; // Smart quotes
      if (charCode === 8217) return "'"; // Smart apostrophe
      if (charCode === 8216) return "'"; // Left single quote
      if (charCode === 8212) return '—'; // Em dash
      if (charCode === 8211) return '–'; // En dash
      if (charCode === 8230) return '...'; // Ellipsis
      return String.fromCharCode(charCode);
    });

    // Handle question mark replacements from Unicode conversion
    text = text.replace(/\?/g, '');

    // Convert paragraph breaks
    text = text.replace(/\\par\b/g, '\n');
    text = text.replace(/\\par/g, '\n');

    // Remove RTF braces and extra formatting
    text = text.replace(/[{}]/g, '');

    // Clean up smart quotes and apostrophes that might still be encoded
    text = text.replace(/[""]/g, '"');
    text = text.replace(/['']/g, "'");

    // Remove any remaining backslashes that aren't part of content
    text = text.replace(/\\\*/g, '*');

    // Clean up whitespace
    text = text.replace(/\s+/g, ' ');
    text = text.replace(/\n\s+/g, '\n');

    // Final cleanup: remove any remaining RTF artifacts at the very start
    text = text.replace(/^[\\*;irnatuldh\s]*/, ''); // Remove leading artifacts
    text = text.replace(/^[A-Za-z]+-[A-Za-z]+;\s*/, ''); // Remove leading font names like "PalatinoLinotype-Italic;"
    text = text.replace(/^;;\s*/, ''); // Remove leading ;;
    text = text.trim();

    return text;
  } catch (error) {
    // Fallback: try to extract meaningful content even if RTF parsing fails
    try {
      const fallbackText = rtfContent
        .replace(/{[^}]*}/g, '') // Remove all RTF groups
        .replace(/\\[a-z]+\d*/g, '') // Remove control words
        .replace(/\\./g, '') // Remove escaped characters
        .split('\n')
        .map(line => {
          const cleanText = line
            .replace(/[{}\\]/g, '')
            .replace(/^;;\s*/, '') // Remove leading ;;
            .replace(/^[\\*;irnatuldh\s]*/, '') // Remove leading artifacts
            .trim();
          return cleanText;
        })
        .filter(
          text =>
            text &&
            text.length > 0 &&
            text !== '*' &&
            text !== ';;' &&
            !text.match(/^[\\*;irnatuldh\s]*$/) &&
            !text.match(/^[A-Za-z]+-[A-Za-z]+;?\s*$/) && // Filter out font names
            !text.match(/^[A-Za-z]+Linotype-[A-Za-z]+;?\s*$/)
        ) // Filter out Linotype fonts
        .join(' ');

      return fallbackText;
    } catch (fallbackError) {
      return '';
    }
  }
}

// Mock file system operations for testing
function createMockFileSystem() {
  return {
    readFile: jest.fn(),
    readdir: jest.fn(),
    stat: jest.fn(),
    existsSync: jest.fn()
  };
}

// Helper function to get element text content
function getElementText(element, tagName) {
  const child = element.getElementsByTagName(tagName)[0];
  return child?.textContent?.trim() || '';
}

// Helper function to get section type ID
function getSectionTypeId(element) {
  const metaData = element.getElementsByTagName('MetaData')[0];
  if (!metaData) return null;

  const sectionTypes = metaData.getElementsByTagName('SectionTypes')[0];
  if (!sectionTypes) return null;

  const typeElement = sectionTypes.getElementsByTagName('Type')[0];
  return typeElement?.textContent?.trim() || null;
}

// Mock implementation of importScrivenerProjectSync for testing
async function importScrivenerProjectSync(projectDirectory) {
  const fs = global.mockElectronMain.fs;
  const path = global.mockElectronMain.path;

  // Find .scrivx file
  const scrivxPath = path.join(projectDirectory, 'project.scrivx');

  // Initialize default book structure
  const bookData = {
    title: '',
    author: '',
    frontMatter: [],
    parts: [],
    chapters: [],
    characters: [],
    locations: [],
    backgroundFolders: [
      {
        id: 'default-bg',
        title: 'General Notes',
        documents: []
      }
    ],
    characterDetectionBlacklist: [],
    template: {
      fontFamily: 'Times New Roman',
      fontSize: 12,
      lineHeight: 1.6,
      paragraphStyle: 'indented',
      pageSize: 'letter',
      genre: 'general',
      pageMargins: { top: 1, bottom: 1, inside: 1.25, outside: 1 },
      mirrorMargins: false,
      textAlign: 'justified',
      chapterHeader: {
        style: 'numbered',
        format: 'Chapter {number}',
        fontSize: 18,
        fontWeight: 'bold',
        alignment: 'center',
        pageBreak: true,
        spacing: 2,
        lineBreaksBefore: 3,
        startOnRightPage: false
      },
      runningHeaders: {
        enabled: false,
        alignment: 'outside',
        fontSize: 10,
        skipChapterPages: true
      }
    },
    github: { repository: null, lastSyncTime: null },
    metadata: {
      created: new Date().toISOString(),
      modified: new Date().toISOString()
    },
    collaboration: { enabled: false, authors: [], currentAuthor: null }
  };

  try {
    // Read the main project file
    const scrivxContent = await fs.promises.readFile(scrivxPath, 'utf8');
    const parser = new DOMParser();
    const doc = parser.parseFromString(scrivxContent, 'text/xml');

    // Check for parsing errors
    const parserErrors = doc.getElementsByTagName('parsererror');
    if (parserErrors.length > 0) {
      return bookData;
    }

    // Parse compile settings for title and author
    let compileSettings = { title: '', author: '' };
    try {
      const compileXmlPath = path.join(
        projectDirectory,
        'Settings',
        'compile.xml'
      );
      const compileContent = await fs.promises.readFile(compileXmlPath, 'utf8');
      compileSettings = parseCompileSettings(compileContent);
    } catch (error) {
      // Compile settings are optional
    }

    bookData.title = compileSettings.title;
    bookData.author = compileSettings.author;

    // Parse section types
    const sectionTypes = {};
    const sectionTypeElements = doc.getElementsByTagName('SectionType');
    for (let i = 0; i < sectionTypeElements.length; i++) {
      const element = sectionTypeElements[i];
      const uuid = element.getAttribute('UUID');
      const name = getElementText(element, 'Name');
      if (uuid && name) {
        sectionTypes[uuid] = name;
      }
    }

    // Parse level types to understand organizational style
    const levelTypes = {};
    const levelTypeElements = doc.getElementsByTagName('Item');
    for (let i = 0; i < levelTypeElements.length; i++) {
      const element = levelTypeElements[i];
      const name = getElementText(element, 'Name');
      const synonymOf = getElementText(element, 'SynonymOf');
      if (name && synonymOf) {
        levelTypes[synonymOf] = name;
      }
    }

    // Simple parsing for test purposes
    const binderItems = doc.getElementsByTagName('BinderItem');
    const processedIds = new Set();

    for (let i = 0; i < binderItems.length; i++) {
      const item = binderItems[i];
      const type = item.getAttribute('Type');
      const uuid = item.getAttribute('UUID');

      // Skip if already processed
      if (processedIds.has(uuid)) {
        continue;
      }
      processedIds.add(uuid);

      const title = getElementText(item, 'Title');
      const sectionTypeId = getSectionTypeId(item);
      const sectionTypeName = sectionTypeId
        ? sectionTypes[sectionTypeId]
        : null;

      if (type === 'Folder') {
        // Check if this is a part
        if (
          sectionTypeName &&
          (sectionTypeName.toLowerCase().includes('part') ||
            levelTypes[sectionTypeId] === 'Part')
        ) {
          const part = {
            id: uuid,
            title: title,
            chapterIds: []
          };
          // Find child chapters - simplified for testing
          const children = item.getElementsByTagName('BinderItem');
          for (let j = 0; j < children.length; j++) {
            const child = children[j];
            if (
              child.getAttribute('Type') === 'Text' ||
              child.getAttribute('Type') === 'Folder'
            ) {
              const childSectionTypeId = getSectionTypeId(child);
              const childSectionTypeName = childSectionTypeId
                ? sectionTypes[childSectionTypeId]
                : null;
              if (
                childSectionTypeName &&
                (childSectionTypeName.toLowerCase().includes('chapter') ||
                  levelTypes[childSectionTypeId] === 'Chapter')
              ) {
                part.chapterIds.push(child.getAttribute('UUID'));
              }
            }
          }
          bookData.parts.push(part);
        }
        // Check for character/location folders
        else if (title.toLowerCase().includes('character')) {
          const children = item.getElementsByTagName('BinderItem');
          for (let j = 0; j < children.length; j++) {
            const child = children[j];
            if (child.getAttribute('Type') === 'Text') {
              const charUuid = child.getAttribute('UUID');
              const charName = getElementText(child, 'Title');
              try {
                const rtfPath = path.join(
                  projectDirectory,
                  'Files',
                  'Data',
                  `${charUuid}.rtf`
                );
                const rtfContent = await fs.promises.readFile(rtfPath, 'utf8');
                const description = convertRtfToPlainText(rtfContent);
                bookData.characters.push({
                  id: charUuid,
                  name: charName,
                  description: description,
                  notes: '',
                  created: new Date().toISOString(),
                  modified: new Date().toISOString()
                });
              } catch (error) {
                bookData.characters.push({
                  id: charUuid,
                  name: charName,
                  description: '',
                  notes: '',
                  created: new Date().toISOString(),
                  modified: new Date().toISOString()
                });
              }
            }
          }
        } else if (
          title.toLowerCase().includes('place') ||
          title.toLowerCase().includes('location')
        ) {
          const children = item.getElementsByTagName('BinderItem');
          for (let j = 0; j < children.length; j++) {
            const child = children[j];
            if (child.getAttribute('Type') === 'Text') {
              const locUuid = child.getAttribute('UUID');
              const locName = getElementText(child, 'Title');
              try {
                const rtfPath = path.join(
                  projectDirectory,
                  'Files',
                  'Data',
                  `${locUuid}.rtf`
                );
                const rtfContent = await fs.promises.readFile(rtfPath, 'utf8');
                const description = convertRtfToPlainText(rtfContent);
                bookData.locations.push({
                  id: locUuid,
                  name: locName,
                  description: description,
                  notes: '',
                  created: new Date().toISOString(),
                  modified: new Date().toISOString()
                });
              } catch (error) {
                bookData.locations.push({
                  id: locUuid,
                  name: locName,
                  description: '',
                  notes: '',
                  created: new Date().toISOString(),
                  modified: new Date().toISOString()
                });
              }
            }
          }
        }
        // Check for research folder that contains characters/locations
        else if (title.toLowerCase().includes('research')) {
          const children = item.getElementsByTagName('BinderItem');
          for (let j = 0; j < children.length; j++) {
            const child = children[j];
            const childTitle = getElementText(child, 'Title');
            if (child.getAttribute('Type') === 'Folder') {
              if (childTitle.toLowerCase().includes('character')) {
                const grandChildren = child.getElementsByTagName('BinderItem');
                for (let k = 0; k < grandChildren.length; k++) {
                  const grandChild = grandChildren[k];
                  if (grandChild.getAttribute('Type') === 'Text') {
                    const charUuid = grandChild.getAttribute('UUID');
                    const charName = getElementText(grandChild, 'Title');
                    try {
                      const rtfPath = path.join(
                        projectDirectory,
                        'Files',
                        'Data',
                        `${charUuid}.rtf`
                      );
                      const rtfContent = await fs.promises.readFile(
                        rtfPath,
                        'utf8'
                      );
                      const description = convertRtfToPlainText(rtfContent);
                      bookData.characters.push({
                        id: charUuid,
                        name: charName,
                        description: description,
                        notes: '',
                        created: new Date().toISOString(),
                        modified: new Date().toISOString()
                      });
                    } catch (error) {
                      bookData.characters.push({
                        id: charUuid,
                        name: charName,
                        description: '',
                        notes: '',
                        created: new Date().toISOString(),
                        modified: new Date().toISOString()
                      });
                    }
                  }
                }
              } else if (
                childTitle.toLowerCase().includes('place') ||
                childTitle.toLowerCase().includes('location')
              ) {
                const grandChildren = child.getElementsByTagName('BinderItem');
                for (let k = 0; k < grandChildren.length; k++) {
                  const grandChild = grandChildren[k];
                  if (grandChild.getAttribute('Type') === 'Text') {
                    const locUuid = grandChild.getAttribute('UUID');
                    const locName = getElementText(grandChild, 'Title');
                    try {
                      const rtfPath = path.join(
                        projectDirectory,
                        'Files',
                        'Data',
                        `${locUuid}.rtf`
                      );
                      const rtfContent = await fs.promises.readFile(
                        rtfPath,
                        'utf8'
                      );
                      const description = convertRtfToPlainText(rtfContent);
                      bookData.locations.push({
                        id: locUuid,
                        name: locName,
                        description: description,
                        notes: '',
                        created: new Date().toISOString(),
                        modified: new Date().toISOString()
                      });
                    } catch (error) {
                      bookData.locations.push({
                        id: locUuid,
                        name: locName,
                        description: '',
                        notes: '',
                        created: new Date().toISOString(),
                        modified: new Date().toISOString()
                      });
                    }
                  }
                }
              }
            }
          }
        }
        // Check for front matter
        else if (
          title.toLowerCase().includes('front matter') ||
          title.toLowerCase().includes('prologue')
        ) {
          const children = item.getElementsByTagName('BinderItem');
          for (let j = 0; j < children.length; j++) {
            const child = children[j];
            if (child.getAttribute('Type') === 'Text') {
              const fmUuid = child.getAttribute('UUID');
              const fmTitle = getElementText(child, 'Title');
              try {
                const rtfPath = path.join(
                  projectDirectory,
                  'Files',
                  'Data',
                  `${fmUuid}.rtf`
                );
                const rtfContent = await fs.promises.readFile(rtfPath, 'utf8');
                const content = convertRtfToPlainText(rtfContent);
                bookData.frontMatter.push({
                  id: fmUuid,
                  title: fmTitle,
                  content: content,
                  enabled: true,
                  created: new Date().toISOString(),
                  modified: new Date().toISOString()
                });
              } catch (error) {
                bookData.frontMatter.push({
                  id: fmUuid,
                  title: fmTitle,
                  content: '',
                  enabled: true,
                  created: new Date().toISOString(),
                  modified: new Date().toISOString()
                });
              }
            }
          }
        }
      } else if (type === 'Text') {
        // Handle individual text items
        if (
          title.toLowerCase().includes('prologue') ||
          sectionTypeName?.toLowerCase().includes('front')
        ) {
          // This is front matter
          try {
            const rtfPath = path.join(
              projectDirectory,
              'Files',
              'Data',
              `${uuid}.rtf`
            );
            const rtfContent = await fs.promises.readFile(rtfPath, 'utf8');
            const content = convertRtfToPlainText(rtfContent);
            bookData.frontMatter.push({
              id: uuid,
              title: title,
              content: content,
              enabled: true,
              created: new Date().toISOString(),
              modified: new Date().toISOString()
            });
          } catch (error) {
            bookData.frontMatter.push({
              id: uuid,
              title: title,
              content: '',
              enabled: true,
              created: new Date().toISOString(),
              modified: new Date().toISOString()
            });
          }
        } else {
          // This might be a chapter
          try {
            const rtfPath = path.join(
              projectDirectory,
              'Files',
              'Data',
              `${uuid}.rtf`
            );
            const rtfContent = await fs.promises.readFile(rtfPath, 'utf8');
            const content = convertRtfToPlainText(rtfContent);
            bookData.chapters.push({
              id: uuid,
              title: title,
              scenes: [
                {
                  id: `${uuid}-scene-1`,
                  title: title,
                  content: content,
                  created: new Date().toISOString(),
                  modified: new Date().toISOString()
                }
              ]
            });
          } catch (error) {
            bookData.chapters.push({
              id: uuid,
              title: title,
              scenes: [
                {
                  id: `${uuid}-scene-1`,
                  title: title,
                  content: '',
                  created: new Date().toISOString(),
                  modified: new Date().toISOString()
                }
              ]
            });
          }
        }
      }
    }

    return bookData;
  } catch (error) {
    throw new Error(`Failed to import Scrivener project: ${error.message}`);
  }
}

// Helper functions for parsing different types of content
async function parseCharacterFolder(
  folderItem,
  bookData,
  fs,
  path,
  projectDirectory
) {
  const children = folderItem.getElementsByTagName('BinderItem');

  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.getAttribute('Type') === 'Text') {
      const uuid = child.getAttribute('UUID');
      const name = getElementText(child, 'Title');

      try {
        const rtfPath = path.join(
          projectDirectory,
          'Files',
          'Data',
          `${uuid}.rtf`
        );
        const rtfContent = await fs.promises.readFile(rtfPath, 'utf8');
        const description = convertRtfToPlainText(rtfContent);

        bookData.characters.push({
          id: uuid,
          name: name,
          description: description,
          notes: '',
          created: new Date().toISOString(),
          modified: new Date().toISOString()
        });
      } catch (error) {
        // File might not exist, add character with empty description
        bookData.characters.push({
          id: uuid,
          name: name,
          description: '',
          notes: '',
          created: new Date().toISOString(),
          modified: new Date().toISOString()
        });
      }
    }
  }
}

async function parseLocationFolder(
  folderItem,
  bookData,
  fs,
  path,
  projectDirectory
) {
  const children = folderItem.getElementsByTagName('BinderItem');

  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.getAttribute('Type') === 'Text') {
      const uuid = child.getAttribute('UUID');
      const name = getElementText(child, 'Title');

      try {
        const rtfPath = path.join(
          projectDirectory,
          'Files',
          'Data',
          `${uuid}.rtf`
        );
        const rtfContent = await fs.promises.readFile(rtfPath, 'utf8');
        const description = convertRtfToPlainText(rtfContent);

        bookData.locations.push({
          id: uuid,
          name: name,
          description: description,
          notes: '',
          created: new Date().toISOString(),
          modified: new Date().toISOString()
        });
      } catch (error) {
        // File might not exist, add location with empty description
        bookData.locations.push({
          id: uuid,
          name: name,
          description: '',
          notes: '',
          created: new Date().toISOString(),
          modified: new Date().toISOString()
        });
      }
    }
  }
}

async function _parseFrontMatterItem(item, fs, path, projectDirectory) {
  const uuid = item.getAttribute('UUID');
  const title = getElementText(item, 'Title');

  try {
    const rtfPath = path.join(projectDirectory, 'Files', 'Data', `${uuid}.rtf`);
    const rtfContent = await fs.promises.readFile(rtfPath, 'utf8');
    const content = convertRtfToPlainText(rtfContent);

    return {
      id: uuid,
      title: title,
      content: content,
      enabled: true,
      created: new Date().toISOString(),
      modified: new Date().toISOString()
    };
  } catch (error) {
    return {
      id: uuid,
      title: title,
      content: '',
      enabled: true,
      created: new Date().toISOString(),
      modified: new Date().toISOString()
    };
  }
}

async function _parseChapterItem(
  item,
  fs,
  path,
  projectDirectory,
  _sectionTypes,
  _levelTypes
) {
  const uuid = item.getAttribute('UUID');
  const title = getElementText(item, 'Title');

  try {
    const rtfPath = path.join(projectDirectory, 'Files', 'Data', `${uuid}.rtf`);
    const rtfContent = await fs.promises.readFile(rtfPath, 'utf8');
    const content = convertRtfToPlainText(rtfContent);

    return {
      id: uuid,
      title: title,
      scenes: [
        {
          id: `${uuid}-scene-1`,
          title: title,
          content: content,
          created: new Date().toISOString(),
          modified: new Date().toISOString()
        }
      ]
    };
  } catch (error) {
    return {
      id: uuid,
      title: title,
      scenes: [
        {
          id: `${uuid}-scene-1`,
          title: title,
          content: '',
          created: new Date().toISOString(),
          modified: new Date().toISOString()
        }
      ]
    };
  }
}

// Helper function to get direct children (not all descendants)
function getDirectChildren(element) {
  const children = [];
  const childElements = element.childNodes;

  for (let i = 0; i < childElements.length; i++) {
    const child = childElements[i];
    if (child.nodeType === 1 && child.tagName === 'BinderItem') {
      // Element node
      children.push(child);
    } else if (child.nodeType === 1 && child.tagName === 'Children') {
      // Look inside Children elements
      const grandChildren = child.childNodes;
      for (let j = 0; j < grandChildren.length; j++) {
        const grandChild = grandChildren[j];
        if (grandChild.nodeType === 1 && grandChild.tagName === 'BinderItem') {
          children.push(grandChild);
        }
      }
    }
  }

  return children;
}

// Helper function to get parent title
function getParentTitle(element) {
  // In a real implementation, this would traverse up the DOM tree
  // For testing, we'll check if the element has a parent with a title
  const parent = element.parentNode;
  if (parent && parent.getElementsByTagName) {
    const titleElement = parent.getElementsByTagName('Title')[0];
    return titleElement?.textContent?.trim() || '';
  }
  return '';
}

// Parse research folder that might contain characters and locations
async function parseResearchFolder(
  folderItem,
  bookData,
  fs,
  path,
  projectDirectory
) {
  const children = folderItem.getElementsByTagName('BinderItem');

  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    const childTitle = getElementText(child, 'Title');

    if (child.getAttribute('Type') === 'Folder') {
      if (childTitle.toLowerCase().includes('character')) {
        await parseCharacterFolder(child, bookData, fs, path, projectDirectory);
      } else if (
        childTitle.toLowerCase().includes('place') ||
        childTitle.toLowerCase().includes('location')
      ) {
        await parseLocationFolder(child, bookData, fs, path, projectDirectory);
      }
    }
  }
}

// Parse individual character item
async function parseCharacterItem(item, fs, path, projectDirectory) {
  const uuid = item.getAttribute('UUID');
  const name = getElementText(item, 'Title');

  try {
    const rtfPath = path.join(projectDirectory, 'Files', 'Data', `${uuid}.rtf`);
    const rtfContent = await fs.promises.readFile(rtfPath, 'utf8');
    const description = convertRtfToPlainText(rtfContent);

    return {
      id: uuid,
      name: name,
      description: description,
      notes: '',
      created: new Date().toISOString(),
      modified: new Date().toISOString()
    };
  } catch (error) {
    return {
      id: uuid,
      name: name,
      description: '',
      notes: '',
      created: new Date().toISOString(),
      modified: new Date().toISOString()
    };
  }
}

// Parse individual location item
async function parseLocationItem(item, fs, path, projectDirectory) {
  const uuid = item.getAttribute('UUID');
  const name = getElementText(item, 'Title');

  try {
    const rtfPath = path.join(projectDirectory, 'Files', 'Data', `${uuid}.rtf`);
    const rtfContent = await fs.promises.readFile(rtfPath, 'utf8');
    const description = convertRtfToPlainText(rtfContent);

    return {
      id: uuid,
      name: name,
      description: description,
      notes: '',
      created: new Date().toISOString(),
      modified: new Date().toISOString()
    };
  } catch (error) {
    return {
      id: uuid,
      name: name,
      description: '',
      notes: '',
      created: new Date().toISOString(),
      modified: new Date().toISOString()
    };
  }
}

module.exports = {
  parseCompileSettings,
  convertRtfToPlainText,
  importScrivenerProjectSync,
  createMockFileSystem,
  getElementText,
  getSectionTypeId,
  getParentTitle,
  getDirectChildren,
  parseResearchFolder,
  parseCharacterItem,
  parseLocationItem
};
