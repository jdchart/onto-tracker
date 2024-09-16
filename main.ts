
// Import elements from obsidian:
import { App, Plugin, PluginSettingTab } from 'obsidian';

// Import onto tracker menu scripts:
import { createRibbonElements } from 'scripts/ribbonElements';
import { createCommands } from 'scripts/commandElements';
import { createSettingsElements } from 'scripts/settingsElements';

// Import and initialize settings
interface OntoTrackerSettings {
	projectTitle: string;
	sourceFolder: string;
	ontoFile: string;
};
const DEFAULT_SETTINGS: OntoTrackerSettings = {
	projectTitle: 'untitled',
	sourceFolder: '',
	ontoFile: ''
};

// Main plugin function
export default class OntoTracker extends Plugin {
	settings: OntoTrackerSettings;

	async onload() {
		await this.loadSettings();

		// Create the menu located on the left ribbon.
		createRibbonElements(this);

		// Add commands:
		createCommands(this);

		// Add settings:
		this.addSettingTab(new OntoTrackerSettingTab(this.app, this));
	};

	onunload() {};

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	};

	async saveSettings() {
		await this.saveData(this.settings);
	};
};

// Create the plugin settings tab:
class OntoTrackerSettingTab extends PluginSettingTab {
	plugin: OntoTracker;

	constructor(app: App, plugin: OntoTracker) {
		super(app, plugin);
		this.plugin = plugin;
		this.app = app;
	};

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		// Create each settings element:
		createSettingsElements(this, containerEl, this.app, this);
	};
};