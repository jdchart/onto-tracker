// Jest setup file for mocking Obsidian API

// Mock Obsidian API
global.require = jest.fn();

// Mock gray-matter
jest.mock('gray-matter', () => ({
  stringify: jest.fn((content, data) => `---\n${JSON.stringify(data, null, 2)}\n---\n${content}`),
  read: jest.fn(() => ({ data: {}, content: '' })),
  __esModule: true,
  default: jest.fn((content) => ({ data: {}, content }))
}));

// Mock xml2js
jest.mock('xml2js', () => ({
  parseString: jest.fn((data, callback) => {
    callback(null, { hml_structure: {} });
  })
}));

// Mock Obsidian classes and functions
const mockApp = {
  vault: {
    adapter: {
      exists: jest.fn().mockResolvedValue(false),
      list: jest.fn().mockResolvedValue({ files: [], folders: [] }),
      basePath: '/mock/path'
    },
    createFolder: jest.fn().mockResolvedValue(undefined),
    create: jest.fn().mockResolvedValue(undefined)
  }
};

const mockModal = class {
  constructor(app) {
    this.app = app;
  }
  
  open() {}
  close() {}
  onOpen() {}
  onClose() {}
};

const mockSetting = class {
  constructor(containerEl) {
    this.containerEl = containerEl;
    return this;
  }
  
  setName(name) { return this; }
  setDesc(desc) { return this; }
  addText(callback) { 
    callback({
      setValue: () => ({ onChange: () => {} }),
      onChange: () => {}
    });
    return this; 
  }
  addTextArea(callback) {
    callback({
      setValue: () => ({ onChange: () => {} }),
      onChange: () => {}
    });
    return this;
  }
  addToggle(callback) {
    callback({
      setValue: () => ({ onChange: () => {} }),
      onChange: () => {}
    });
    return this;
  }
  addDropdown(callback) {
    callback({
      addOptions: () => ({ onChange: () => {} }),
      onChange: () => {}
    });
    return this;
  }
  addButton(callback) {
    callback({
      setButtonText: () => ({ setCta: () => ({ onClick: () => {} }) }),
      setCta: () => ({ onClick: () => {} }),
      onClick: () => {}
    });
    return this;
  }
};

const mockNotice = class {
  constructor(message) {
    this.message = message;
  }
};

const mockPlugin = class {
  constructor() {
    this.app = mockApp;
    this.settings = {};
  }
  
  async loadData() { return {}; }
  async saveData(data) {}
  addSettingTab() {}
};

const mockPluginSettingTab = class {
  constructor(app, plugin) {
    this.app = app;
    this.plugin = plugin;
  }
  
  display() {}
};

// Export mocks to global scope
global.App = mockApp.constructor;
global.Modal = mockModal;
global.Setting = mockSetting;
global.Notice = mockNotice;
global.Plugin = mockPlugin;
global.PluginSettingTab = mockPluginSettingTab;

// Mock require calls
global.require = jest.fn((moduleName) => {
  if (moduleName === 'gray-matter') {
    return {
      stringify: jest.fn(),
      read: jest.fn(() => ({ data: {}, content: '' })),
      default: jest.fn()
    };
  }
  if (moduleName === 'xml2js') {
    return {
      parseString: jest.fn()
    };
  }
  if (moduleName === 'electron') {
    return {
      remote: {
        dialog: {
          showOpenDialog: jest.fn().mockResolvedValue({ canceled: true, filePaths: [] })
        }
      }
    };
  }
  return {};
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
};