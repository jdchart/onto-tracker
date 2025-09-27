// Unit tests for main plugin functionality

import OntoTracker from '../main';
import { OntoTrackerSettings } from '../scripts/types';

// Mock Obsidian API
const mockApp = {
  vault: {
    adapter: {
      exists: jest.fn(),
      list: jest.fn()
    }
  }
};

const mockPlugin = {
  app: mockApp,
  loadData: jest.fn(),
  saveData: jest.fn(),
  addSettingTab: jest.fn(),
  settings: {} as OntoTrackerSettings
};

describe('OntoTracker Plugin', () => {
  let plugin: OntoTracker;

  beforeEach(() => {
    plugin = new OntoTracker(mockApp as any, {} as any);
    jest.clearAllMocks();
  });

  describe('Plugin Initialization', () => {
    test('should have default settings', () => {
      expect(plugin.settings).toBeDefined();
    });

    test('should load settings on initialization', async () => {
      const mockLoadData = jest.fn().mockResolvedValue({
        projectTitle: 'Test Project',
        sourceFolder: '/test/source',
        ontoFile: '/test/ontology.xml'
      });
      
      plugin.loadData = mockLoadData;
      
      await plugin.loadSettings();
      
      expect(mockLoadData).toHaveBeenCalled();
      expect(plugin.settings.projectTitle).toBe('Test Project');
    });

    test('should save settings correctly', async () => {
      const mockSaveData = jest.fn().mockResolvedValue(undefined);
      plugin.saveData = mockSaveData;
      
      plugin.settings = {
        projectTitle: 'Updated Project',
        sourceFolder: '/updated/source',
        ontoFile: '/updated/ontology.xml'
      };
      
      await plugin.saveSettings();
      
      expect(mockSaveData).toHaveBeenCalledWith(plugin.settings);
    });
  });

  describe('Settings Management', () => {
    test('should merge default settings with loaded data', async () => {
      const partialSettings = { projectTitle: 'Partial Project' };
      plugin.loadData = jest.fn().mockResolvedValue(partialSettings);
      
      await plugin.loadSettings();
      
      expect(plugin.settings.projectTitle).toBe('Partial Project');
      expect(plugin.settings.sourceFolder).toBe(''); // Should use default
      expect(plugin.settings.ontoFile).toBe(''); // Should use default
    });

    test('should handle empty loaded data', async () => {
      plugin.loadData = jest.fn().mockResolvedValue({});
      
      await plugin.loadSettings();
      
      expect(plugin.settings.projectTitle).toBe('untitled');
      expect(plugin.settings.sourceFolder).toBe('');
      expect(plugin.settings.ontoFile).toBe('');
    });
  });

  describe('Plugin Lifecycle', () => {
    test('should handle onload without errors', async () => {
      plugin.loadData = jest.fn().mockResolvedValue({});
      plugin.addSettingTab = jest.fn();
      
      await expect(plugin.onload()).resolves.toBeUndefined();
    });

    test('should handle onunload without errors', () => {
      expect(() => plugin.onunload()).not.toThrow();
    });
  });
});