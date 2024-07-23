
// Import elements from obsidian
import { Menu, App, Plugin, PluginSettingTab } from 'obsidian';

// Import onto tracker scripts
import { FreezeModal } from 'scripts/freezeModal';
import { UnpackOntologyModal } from 'scripts/unpackOntologyModal';
import { MapMakerModal } from 'scripts/mapMakerModal';
import { MapModal } from 'scripts/mapModal';

// Import and initialize settings
import * as settingsElemensSetup from 'scripts/settingsElements';
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

		// Create menu in ribbon:
		const ribbonIconEl = this.addRibbonIcon('go-to-file', 'Onto Tracker', (evt: MouseEvent) => {
			// Create menu on click:
			const menu = new Menu();

			//Add menu items:
			menu.addItem((item) =>
				item
				.setTitle("New freeze...")
				// .setIcon("documents")
				.onClick(() => {
					new FreezeModal(this.app, this.settings).open();
				})
			);
			menu.addItem((item) =>
				item
				.setTitle("Map...")
				// .setIcon("documents")
				.onClick(() => {
					new MapModal(this.app, this.settings).open();
				})
			);
			menu.addItem((item) =>
				item
				.setTitle("New mapping...")
				// .setIcon("documents")
				.onClick(() => {
					new MapMakerModal(this.app, this.settings).open();
				})
			);
			menu.addItem((item) =>
				item
				.setTitle("Unpack ontology...")
				// .setIcon("documents")
				.onClick(() => {
					new UnpackOntologyModal(this.app, this.settings).open();
				})
			);

			menu.showAtMouseEvent(evt);
		});
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// Add commands:
		this.addCommand({
			id: 'open-new-freeze-modal',
			name: 'Perform a new freeze...',
			callback: () => {
				new FreezeModal(this.app, this.settings).open();
			}
		});

		this.addCommand({
			id: 'open-map-modal',
			name: 'Perform a mapping...',
			callback: () => {
				new MapModal(this.app, this.settings).open();
			}
		});

		this.addCommand({
			id: 'open-map-maker-modal',
			name: 'Create a new mapping file...',
			callback: () => {
				new MapMakerModal(this.app, this.settings).open();
			}
		});

		this.addCommand({
			id: 'open-unpack-ontology-modal',
			name: 'Unpack an ontology file...',
			callback: () => {
				new UnpackOntologyModal(this.app, this.settings).open();
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

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
		settingsElemensSetup.settingsProjectTitleSetup(this, containerEl);
		settingsElemensSetup.settingsSourceFolderSetup(this, containerEl);
		settingsElemensSetup.settingsOntologyFileSetup(this, containerEl);
	};
};