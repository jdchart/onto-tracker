// Unit tests for modal functionality

import { FreezeModal } from '../scripts/freezeModal';
import { MapMakerModal } from '../scripts/mapMakerModal';
import { UnpackOntologyModal } from '../scripts/unpackOntologyModal';
import { MapModal } from '../scripts/mapModal';
import { OntoTrackerSettings } from '../scripts/types';

// Mock Obsidian API
const mockApp = {
  vault: {
    adapter: {
      exists: jest.fn().mockResolvedValue(false),
      list: jest.fn().mockResolvedValue({ files: [], folders: [] })
    },
    createFolder: jest.fn(),
    create: jest.fn()
  }
};

const mockSettings: OntoTrackerSettings = {
  projectTitle: 'Test Project',
  sourceFolder: '/test/source',
  ontoFile: '/test/ontology.xml'
};

describe('Modal Classes', () => {
  describe('FreezeModal', () => {
    let modal: FreezeModal;

    beforeEach(() => {
      modal = new FreezeModal(mockApp as any, mockSettings);
      jest.clearAllMocks();
    });

    test('should initialize with correct settings', () => {
      expect(modal.projectSettings).toEqual(mockSettings);
      expect(modal.thisApp).toBe(mockApp);
      expect(modal.freezeSettings.freezeName).toBe('untitled');
      expect(modal.freezeSettings.keepOld).toBe(true);
    });

    test('should have default freeze settings', () => {
      expect(modal.freezeSettings).toEqual({
        freezeName: 'untitled',
        freezeDate: '',
        keepOld: true,
        forbidden: 'DS_Store'
      });
    });

    test('should handle modal open without errors', () => {
      // Mock contentEl
      const mockContentEl = {
        setText: jest.fn(),
        createEl: jest.fn(),
        empty: jest.fn()
      };
      modal.contentEl = mockContentEl as any;
      
      expect(() => modal.onOpen()).not.toThrow();
    });

    test('should handle modal close without errors', () => {
      const mockContentEl = {
        empty: jest.fn()
      };
      modal.contentEl = mockContentEl as any;
      
      expect(() => modal.onClose()).not.toThrow();
      expect(mockContentEl.empty).toHaveBeenCalled();
    });
  });

  describe('MapMakerModal', () => {
    let modal: MapMakerModal;

    beforeEach(() => {
      modal = new MapMakerModal(mockApp as any, mockSettings);
      jest.clearAllMocks();
    });

    test('should initialize with correct settings', () => {
      expect(modal.projectSettings).toEqual(mockSettings);
      expect(modal.thisApp).toBe(mockApp);
      expect(modal.mapSettings.fileName).toBe('untitled');
    });

    test('should handle modal operations without errors', () => {
      const mockContentEl = {
        setText: jest.fn(),
        createEl: jest.fn(),
        empty: jest.fn()
      };
      modal.contentEl = mockContentEl as any;
      
      expect(() => modal.onOpen()).not.toThrow();
      expect(() => modal.onClose()).not.toThrow();
    });
  });

  describe('UnpackOntologyModal', () => {
    let modal: UnpackOntologyModal;

    beforeEach(() => {
      modal = new UnpackOntologyModal(mockApp as any, mockSettings);
      jest.clearAllMocks();
    });

    test('should initialize with correct settings', () => {
      expect(modal.projectSettings).toEqual(mockSettings);
      expect(modal.thisApp).toBe(mockApp);
      expect(modal.unpackSettings.folderName).toBe('untitled');
    });

    test('should handle modal operations without errors', () => {
      const mockContentEl = {
        setText: jest.fn(),
        createEl: jest.fn(),
        empty: jest.fn()
      };
      modal.contentEl = mockContentEl as any;
      
      expect(() => modal.onOpen()).not.toThrow();
      expect(() => modal.onClose()).not.toThrow();
    });
  });

  describe('MapModal', () => {
    let modal: MapModal;

    beforeEach(() => {
      modal = new MapModal(mockApp as any, mockSettings);
      jest.clearAllMocks();
    });

    test('should initialize with correct settings', () => {
      expect(modal.projectSettings).toEqual(mockSettings);
      expect(modal.thisApp).toBe(mockApp);
      expect(modal.mapSettings.freezeName).toBe('');
      expect(modal.mapSettings.mapName).toBe('');
    });

    test('should handle modal operations without errors', async () => {
      const mockContentEl = {
        setText: jest.fn(),
        createEl: jest.fn(),
        empty: jest.fn()
      };
      modal.contentEl = mockContentEl as any;
      
      // Mock getFolderFolders to return empty arrays
      jest.spyOn(utils, 'getFolderFolders').mockResolvedValue([]);
      
      await expect(modal.onOpen()).resolves.toBeUndefined();
      expect(() => modal.onClose()).not.toThrow();
    });
  });
});