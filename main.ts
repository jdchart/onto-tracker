
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
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			// console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => {
			// console.log('setInterval'), 5 * 60 * 1000)
		}));
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
class SampleSettingTab extends PluginSettingTab {
	plugin: OntoTracker;

	constructor(app: App, plugin: OntoTracker) {
		super(app, plugin);
		this.plugin = plugin;
	};

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		// Create each settings element:
		createSettingsElements(this, containerEl);
	};
};