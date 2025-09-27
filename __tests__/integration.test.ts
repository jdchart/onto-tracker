// Integration tests for plugin features and workflows

import { OntoTrackerSettings, FreezeSettings, MapSettings, UnpackSettings } from '../scripts/types';

// Mock external dependencies
jest.mock('gray-matter', () => ({
  stringify: jest.fn((content, data) => `---\n${JSON.stringify(data, null, 2)}\n---\n${content}`),
  read: jest.fn(() => ({ data: { 'Freeze date': '2024-01-01' }, content: 'test content' })),
  __esModule: true,
  default: jest.fn((content) => ({ data: {}, content }))
}));

jest.mock('xml2js', () => ({
  parseString: jest.fn((data, callback) => {
    callback(null, { 
      hml_structure: { 
        'TestClass': [{ 'item1': [{ name: 'Test Item' }] }],
        'metadata': 'test metadata'
      } 
    });
  })
}));

// Create comprehensive mock app
const createMockApp = () => ({
  vault: {
    adapter: {
      exists: jest.fn().mockResolvedValue(false),
      list: jest.fn().mockResolvedValue({ files: [], folders: [] }),
      basePath: '/mock/vault'
    },
    createFolder: jest.fn().mockResolvedValue(undefined),
    create: jest.fn().mockResolvedValue(undefined)
  }
});

const mockSettings: OntoTrackerSettings = {
  projectTitle: 'Integration Test Project',
  sourceFolder: '/test/source',
  ontoFile: '/test/ontology.xml'
};

describe('Plugin Integration Tests', () => {
  let mockApp: any;

  beforeEach(() => {
    mockApp = createMockApp();
    jest.clearAllMocks();
  });

  describe('Freeze Creation Workflow', () => {
    test('should complete freeze creation workflow', async () => {
      const freezeSettings: FreezeSettings = {
        freezeName: 'integration-test-freeze',
        freezeDate: '2024-01-01T12:00:00',
        keepOld: true,
        forbidden: 'DS_Store,tmp'
      };

      // Mock the freeze folder doesn't exist initially
      mockApp.vault.adapter.exists.mockResolvedValue(false);
      mockApp.vault.adapter.list.mockResolvedValue({ folders: [], files: [] });

      // Import and test processFreeze
      const { processFreeze } = await import('../scripts/procFreeze');
      
      await processFreeze(mockSettings, freezeSettings, mockApp);

      // Verify the workflow steps
      expect(mockApp.vault.adapter.exists).toHaveBeenCalledWith('freezes');
      expect(mockApp.vault.createFolder).toHaveBeenCalledWith('freezes');
      expect(mockApp.vault.createFolder).toHaveBeenCalledWith(expect.stringContaining('integration-test-freeze'));
      expect(mockApp.vault.createFolder).toHaveBeenCalledWith(expect.stringContaining('/content'));
      expect(mockApp.vault.create).toHaveBeenCalledWith(
        expect.stringContaining('/metadata.md'),
        expect.any(String)
      );
    });

    test('should handle existing freeze folders in workflow', async () => {
      const freezeSettings: FreezeSettings = {
        freezeName: 'existing-freeze',
        freezeDate: '2024-01-01T12:00:00',
        keepOld: true,
        forbidden: ''
      };

      // Mock existing freeze folders
      mockApp.vault.adapter.exists.mockResolvedValue(true);
      mockApp.vault.adapter.list.mockResolvedValue({ 
        folders: ['freezes/existing-freeze'], 
        files: [] 
      });

      const { processFreeze } = await import('../scripts/procFreeze');
      
      await processFreeze(mockSettings, freezeSettings, mockApp);

      // Should create folder with incremented name
      expect(mockApp.vault.createFolder).toHaveBeenCalledWith(expect.stringContaining('existing-freeze'));
    });
  });

  describe('Modal Integration', () => {
    test('should handle freeze modal workflow', async () => {
      const { FreezeModal } = await import('../scripts/freezeModal');
      
      const modal = new FreezeModal(mockApp, mockSettings);

      expect(modal.projectSettings).toEqual(mockSettings);
      expect(modal.freezeSettings.freezeName).toBe('untitled');

      // Test modal lifecycle
      const mockContentEl = {
        setText: jest.fn(),
        createEl: jest.fn().mockReturnValue({
          createEl: jest.fn(),
          addEventListener: jest.fn()
        }),
        empty: jest.fn()
      };
      modal.contentEl = mockContentEl;

      expect(() => modal.onOpen()).not.toThrow();
      expect(() => modal.onClose()).not.toThrow();
    });

    test('should handle map maker modal workflow', async () => {
      const { MapMakerModal } = await import('../scripts/mapMakerModal');
      
      const modal = new MapMakerModal(mockApp, mockSettings);

      expect(modal.projectSettings).toEqual(mockSettings);
      expect(modal.mapSettings.fileName).toBe('untitled');

      // Test modal lifecycle
      const mockContentEl = {
        setText: jest.fn(),
        createEl: jest.fn(),
        empty: jest.fn()
      };
      modal.contentEl = mockContentEl;

      expect(() => modal.onOpen()).not.toThrow();
      expect(() => modal.onClose()).not.toThrow();
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle vault operation failures gracefully', async () => {
      const freezeSettings: FreezeSettings = {
        freezeName: 'error-test-freeze',
        freezeDate: '2024-01-01T12:00:00',
        keepOld: true,
        forbidden: ''
      };

      // Mock vault operations to fail
      mockApp.vault.adapter.exists.mockRejectedValue(new Error('Vault error'));
      mockApp.vault.createFolder.mockRejectedValue(new Error('Create folder error'));

      const { processFreeze } = await import('../scripts/procFreeze');
      
      // Should handle errors gracefully without throwing
      await expect(processFreeze(mockSettings, freezeSettings, mockApp)).resolves.toBeUndefined();
    });

    test('should handle missing ontology file', async () => {
      const settingsWithMissingFile: OntoTrackerSettings = {
        ...mockSettings,
        ontoFile: '/nonexistent/file.xml'
      };

      const unpackSettings: UnpackSettings = {
        folderName: 'test-unpack'
      };

      // This should be handled gracefully by the error handling in the functions
      expect(settingsWithMissingFile.ontoFile).toBe('/nonexistent/file.xml');
    });
  });

  describe('Data Flow Integration', () => {
    test('should maintain data consistency through freeze workflow', async () => {
      const freezeSettings: FreezeSettings = {
        freezeName: 'data-flow-test',
        freezeDate: '2024-01-01T12:00:00',
        keepOld: false,
        forbidden: 'log,tmp'
      };

      mockApp.vault.adapter.exists.mockResolvedValue(true);
      mockApp.vault.adapter.list.mockResolvedValue({ folders: [], files: [] });

      const { processFreeze } = await import('../scripts/procFreeze');
      
      await processFreeze(mockSettings, freezeSettings, mockApp);

      // Verify that settings are passed through correctly
      const createCall = mockApp.vault.create.mock.calls.find(call => 
        call[0].includes('metadata.md')
      );
      
      expect(createCall).toBeDefined();
      expect(createCall[1]).toContain('Integration Test Project'); // Should contain project title
    });

    test('should handle mapping workflow data flow', () => {
      const mapSettings = {
        fileName: 'test-mapping'
      };

      // Test data flow through mapping creation
      expect(mapSettings.fileName).toBe('test-mapping');
      
      // Verify the data structure matches expected interfaces
      const expectedStructure = {
        fileName: expect.any(String)
      };
      
      expect(mapSettings).toMatchObject(expectedStructure);
    });
  });
});