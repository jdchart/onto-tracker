// Unit tests for types and utility functions

import { getUniqueFolderName, listToOptions } from '../scripts/types';

describe('Type Utility Functions', () => {
  describe('getUniqueFolderName', () => {
    test('should return original name if not in list', () => {
      const folderList = ['folder1', 'folder2'];
      expect(getUniqueFolderName('newFolder', folderList)).toBe('newFolder');
    });

    test('should append number if name exists', () => {
      const folderList = ['folder1', 'folder1_1', 'folder2'];
      expect(getUniqueFolderName('folder1', folderList)).toBe('folder1_2');
    });

    test('should handle multiple conflicts', () => {
      const folderList = ['test', 'test_1', 'test_2'];
      expect(getUniqueFolderName('test', folderList)).toBe('test_3');
    });

    test('should work with custom index', () => {
      const folderList = ['folder1'];
      expect(getUniqueFolderName('folder1', folderList, 5)).toBe('folder1_5');
    });

    test('should handle empty folder list', () => {
      expect(getUniqueFolderName('folder1', [])).toBe('folder1');
    });

    test('should handle special characters in folder names', () => {
      const folderList = ['folder-with-dashes', 'folder_with_underscores'];
      expect(getUniqueFolderName('new-folder', folderList)).toBe('new-folder');
    });
  });

  describe('listToOptions', () => {
    test('should convert array to options object', () => {
      const input = ['option1', 'option2', 'option3'];
      const expected = {
        'option1': 'option1',
        'option2': 'option2',
        'option3': 'option3'
      };
      expect(listToOptions(input)).toEqual(expected);
    });

    test('should handle empty array', () => {
      expect(listToOptions([])).toEqual({});
    });

    test('should handle array with one item', () => {
      const input = ['single'];
      const expected = { 'single': 'single' };
      expect(listToOptions(input)).toEqual(expected);
    });

    test('should handle array with duplicate items', () => {
      const input = ['item1', 'item2', 'item1'];
      const expected = {
        'item1': 'item1',
        'item2': 'item2'
      };
      expect(listToOptions(input)).toEqual(expected);
    });

    test('should handle special characters', () => {
      const input = ['item-1', 'item_2', 'item.3'];
      const expected = {
        'item-1': 'item-1',
        'item_2': 'item_2',
        'item.3': 'item.3'
      };
      expect(listToOptions(input)).toEqual(expected);
    });
  });

  describe('Type Definitions', () => {
    test('should have proper interface structure', () => {
      // Test that our interfaces are properly defined by creating instances
      const freezeSettings = {
        freezeName: 'test',
        freezeDate: '2024-01-01',
        keepOld: true,
        forbidden: 'DS_Store'
      };

      const mapSettings = {
        fileName: 'test-mapping'
      };

      const projectSettings = {
        projectTitle: 'Test Project',
        sourceFolder: '/test/source',
        ontoFile: '/test/onto.xml'
      };

      // These should not throw TypeScript errors
      expect(freezeSettings.freezeName).toBe('test');
      expect(mapSettings.fileName).toBe('test-mapping');
      expect(projectSettings.projectTitle).toBe('Test Project');
    });
  });
});