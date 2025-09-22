const {
  parseCompileSettings,
  convertRtfToPlainText,
  getSectionTypeId,
  getParentTitle
} = require('../scrivenerImportTestHelpers');

// Mock xmldom
const mockDocument = {
  getElementsByTagName: jest.fn(),
  parseFromString: jest.fn()
};

jest.mock('@xmldom/xmldom', () => ({
  DOMParser: jest.fn(() => mockDocument)
}));

describe('scrivenerImportTestHelpers', () => {
  describe('parseCompileSettings', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      mockDocument.parseFromString = jest.fn(() => mockDocument);
    });

    it('parses valid compile settings XML', () => {
      const mockTitleElement = { textContent: 'My Great Novel' };
      const mockAuthorElement = { textContent: 'John Doe' };

      mockDocument.getElementsByTagName = jest.fn(tagName => {
        if (tagName === 'parsererror') return [];
        if (tagName === 'Title') return [mockTitleElement];
        if (tagName === 'Author') return [mockAuthorElement];
        return [];
      });

      const xmlContent =
        '<compile><Title>My Great Novel</Title><Author>John Doe</Author></compile>';
      const result = parseCompileSettings(xmlContent);

      expect(result).toEqual({
        title: 'My Great Novel',
        author: 'John Doe'
      });
      expect(mockDocument.parseFromString).toHaveBeenCalledWith(
        xmlContent,
        'text/xml'
      );
    });

    it('handles empty XML content', () => {
      const result = parseCompileSettings('');
      expect(result).toEqual({ title: '', author: '' });
    });

    it('handles null XML content', () => {
      const result = parseCompileSettings(null);
      expect(result).toEqual({ title: '', author: '' });
    });

    it('handles malformed XML', () => {
      mockDocument.getElementsByTagName = jest.fn(tagName => {
        if (tagName === 'parsererror') return [{ textContent: 'Parse error' }];
        return [];
      });

      const result = parseCompileSettings('<invalid><xml>');
      expect(result).toEqual({ title: '', author: '' });
    });

    it('handles missing title and author elements', () => {
      mockDocument.getElementsByTagName = jest.fn(() => []);

      const result = parseCompileSettings('<compile></compile>');
      expect(result).toEqual({ title: '', author: '' });
    });

    it('handles parsing exceptions', () => {
      mockDocument.parseFromString.mockImplementation(() => {
        throw new Error('Parsing failed');
      });

      const result = parseCompileSettings('<valid>xml</valid>');
      expect(result).toEqual({ title: '', author: '' });
    });

    it('trims whitespace from title and author', () => {
      const mockTitleElement = { textContent: '  Whitespace Novel  ' };
      const mockAuthorElement = { textContent: '\n\t  Jane Doe  \n\t' };

      mockDocument.getElementsByTagName = jest.fn(tagName => {
        if (tagName === 'parsererror') return [];
        if (tagName === 'Title') return [mockTitleElement];
        if (tagName === 'Author') return [mockAuthorElement];
        return [];
      });

      const result = parseCompileSettings(
        '<compile><Title>  Whitespace Novel  </Title><Author>  Jane Doe  </Author></compile>'
      );
      expect(result).toEqual({
        title: 'Whitespace Novel',
        author: 'Jane Doe'
      });
    });
  });

  describe('convertRtfToPlainText', () => {
    it('handles empty content', async () => {
      expect(await convertRtfToPlainText('')).toBe('');
      expect(await convertRtfToPlainText(null)).toBe('');
    });

    it('returns non-RTF content as-is', async () => {
      const plainText = 'This is plain text content';
      expect(await convertRtfToPlainText(plainText)).toBe(plainText);
    });
  });

  describe('getSectionTypeId', () => {
    it('extracts section type ID', () => {
      const mockTypeElement = { textContent: 'section-type-123' };
      const mockSectionTypesElement = {
        getElementsByTagName: () => [mockTypeElement]
      };
      const mockMetaDataElement = {
        getElementsByTagName: () => [mockSectionTypesElement]
      };
      const mockItem = { getElementsByTagName: () => [mockMetaDataElement] };

      const result = getSectionTypeId(mockItem);
      expect(result).toBe('section-type-123');
    });

    it('returns null when MetaData not found', () => {
      const mockItem = { getElementsByTagName: () => [] };
      const result = getSectionTypeId(mockItem);
      expect(result).toBeNull();
    });

    it('returns null when SectionTypes not found', () => {
      const mockMetaDataElement = { getElementsByTagName: () => [] };
      const mockItem = { getElementsByTagName: () => [mockMetaDataElement] };
      const result = getSectionTypeId(mockItem);
      expect(result).toBeNull();
    });

    it('returns null when Type not found', () => {
      const mockSectionTypesElement = { getElementsByTagName: () => [] };
      const mockMetaDataElement = {
        getElementsByTagName: () => [mockSectionTypesElement]
      };
      const mockItem = { getElementsByTagName: () => [mockMetaDataElement] };
      const result = getSectionTypeId(mockItem);
      expect(result).toBeNull();
    });
  });

  describe('getParentTitle', () => {
    it('extracts parent title', () => {
      const mockTitleElement = { textContent: 'Parent Title' };
      const mockParentNode = {
        getElementsByTagName: () => [mockTitleElement]
      };
      const mockNode = { parentNode: mockParentNode };

      const result = getParentTitle(mockNode);
      expect(result).toBe('Parent Title');
    });

    it('returns empty string when no parent', () => {
      const mockNode = { parentNode: null };
      const result = getParentTitle(mockNode);
      expect(result).toBe('');
    });

    it('returns empty string when parent has no getElementsByTagName', () => {
      const mockNode = { parentNode: {} };
      const result = getParentTitle(mockNode);
      expect(result).toBe('');
    });
  });
});
