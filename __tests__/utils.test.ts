// Unit tests for utility functions

import { getExtension, listToOptions, getUniqueFolderName } from '../scripts/types';
import * as utils from '../scripts/utils';

// Mock fs and path modules
jest.mock('fs');
jest.mock('path');

describe('Utility Functions', () => {
  describe('getExtension', () => {
    test('should return file extension without dot', () => {
      expect(getExtension('/path/to/file.txt', 'file.txt')).toBe('txt');
      expect(getExtension('/path/to/file.mp3', 'file.mp3')).toBe('mp3');
      expect(getExtension('/path/to/file.tar.gz', 'file.tar.gz')).toBe('gz');
    });

    test('should handle files without extensions', () => {
      expect(getExtension('/path/to/file', 'file')).toBe('');
    });

    test('should handle hidden files like .DS_Store', () => {
      expect(getExtension('/path/to/.DS_Store', '.DS_Store')).toBe('DS_Store');
      expect(getExtension('/path/to/.gitignore', '.gitignore')).toBe('gitignore');
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
  });

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
      expect(getUniqueFolderName('folder1', folderList, 5)).toBe('folder1_6');
    });
  });

  describe('writeJson', () => {
    test('should write JSON data to file', async () => {
      const mockData = { test: 'data', number: 123 };
      const mockPath = '/test/path.json';
      
      // Mock fs.promises.writeFile
      const mockWriteFile = jest.fn().mockResolvedValue(undefined);
      (utils as any).fs = { promises: { writeFile: mockWriteFile } };
      
      await expect(utils.writeJson(mockPath, mockData)).resolves.toBeUndefined();
    });
  });

  describe('readMD', () => {
    test('should read markdown file content', async () => {
      const mockContent = '# Test Markdown\\nThis is test content.';
      const mockPath = '/test/file.md';
      
      // Mock the readFileAsync function
      jest.spyOn(utils, 'readMD').mockResolvedValue(mockContent);
      
      const result = await utils.readMD(mockPath);
      expect(result).toBe(mockContent);
    });
  });

  describe('updateMDFile', () => {
    test('should update markdown file with new content', async () => {
      const mockPath = '/test/file.md';
      const mockContent = '# Updated Content';
      
      // Mock fs.promises.writeFile
      const mockWriteFile = jest.fn().mockResolvedValue(undefined);
      (utils as any).fs = { promises: { writeFile: mockWriteFile } };
      
      await expect(utils.updateMDFile(mockPath, mockContent)).resolves.toBeUndefined();
    });
  });
});