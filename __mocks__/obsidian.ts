// Mock for Obsidian API

export class App {
  vault = {
    adapter: {
      exists: jest.fn().mockResolvedValue(false),
      list: jest.fn().mockResolvedValue({ files: [], folders: [] }),
      basePath: '/mock/vault/path'
    },
    createFolder: jest.fn().mockResolvedValue(undefined),
    create: jest.fn().mockResolvedValue(undefined)
  };
}

export class Modal {
  app: App;
  contentEl = {
    setText: jest.fn(),
    createEl: jest.fn().mockReturnValue({
      createEl: jest.fn(),
      setText: jest.fn()
    }),
    empty: jest.fn()
  };

  constructor(app: App) {
    this.app = app;
  }

  open() {}
  close() {}
  onOpen() {}
  onClose() {}
}

export class Setting {
  constructor(containerEl: any) {
    return this;
  }
  
  setName(name: string) { return this; }
  setDesc(desc: string) { return this; }
  
  addText(callback: (text: any) => void) { 
    callback({
      setValue: jest.fn().mockReturnValue({ onChange: jest.fn() }),
      onChange: jest.fn()
    });
    return this; 
  }
  
  addTextArea(callback: (text: any) => void) {
    callback({
      setValue: jest.fn().mockReturnValue({ onChange: jest.fn() }),
      onChange: jest.fn()
    });
    return this;
  }
  
  addToggle(callback: (toggle: any) => void) {
    callback({
      setValue: jest.fn().mockReturnValue({ onChange: jest.fn() }),
      onChange: jest.fn()
    });
    return this;
  }
  
  addDropdown(callback: (dropdown: any) => void) {
    callback({
      addOptions: jest.fn().mockReturnValue({ onChange: jest.fn() }),
      onChange: jest.fn()
    });
    return this;
  }
  
  addButton(callback: (button: any) => void) {
    callback({
      setButtonText: jest.fn().mockReturnValue({ 
        setCta: jest.fn().mockReturnValue({ onClick: jest.fn() }) 
      }),
      setCta: jest.fn().mockReturnValue({ onClick: jest.fn() }),
      onClick: jest.fn()
    });
    return this;
  }
}

export class Notice {
  message: string;
  
  constructor(message: string) {
    this.message = message;
  }
}

export class Plugin {
  app: App;
  settings: any = {};
  
  constructor(app: App, manifest: any) {
    this.app = app;
  }
  
  async loadData(): Promise<any> { return {}; }
  async saveData(data: any): Promise<void> {}
  addSettingTab(tab: any): void {}
  
  async onload(): Promise<void> {}
  onunload(): void {}
}

export class PluginSettingTab {
  app: App;
  plugin: Plugin;
  containerEl = {
    empty: jest.fn(),
    createEl: jest.fn().mockReturnValue({
      createEl: jest.fn(),
      setText: jest.fn()
    })
  };
  
  constructor(app: App, plugin: Plugin) {
    this.app = app;
    this.plugin = plugin;
  }
  
  display(): void {}
}