
// Import elements from obsidian:
import { App, Plugin, PluginSettingTab } from 'obsidian';

// Import onto tracker menu scripts:
import { createRibbonElements } from 'scripts/ribbonElements';
import { createCommands } from 'scripts/commandElements';
import { createSettingsElements } from 'scripts/settingsElements';

// Import and initialize settings
import { OntoTrackerSettings } from 'scripts/types';

const DEFAULT_SETTINGS: OntoTrackerSettings = {
	projectTitle: 'untitled',
	sourceFolder: '',
	ontoFile: ''
};

/**
 * Onto Tracker Plugin - Main plugin class
 * 
 * This plugin allows users to manage projects according to an ontology by:
 * - Creating "freezes" of project content
 * - Mapping files to ontological categories
 * - Unpacking ontology files for consultation
 * - Tracking file changes over time
 */
export default class OntoTracker extends Plugin {
	/** Plugin settings containing project configuration */
	settings: OntoTrackerSettings;

	/**
	 * Plugin initialization method
	 * Sets up ribbon elements, commands, and settings tab
	 */
	async onload(): Promise<void> {
		await this.loadSettings();

		// Create the menu located on the left ribbon.
		createRibbonElements(this);

		// Add commands:
		createCommands(this);

		// Add settings:
		this.addSettingTab(new OntoTrackerSettingTab(this.app, this));
	}

	/**
	 * Plugin cleanup method
	 * Called when plugin is disabled or Obsidian is closed
	 */
	onunload(): void {
		// No cleanup needed currently
	}

	/**
	 * Load plugin settings from storage
	 * Merges saved settings with default values
	 */
	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	/**
	 * Save current plugin settings to storage
	 */
	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}

/**
 * Settings tab for the Onto Tracker plugin
 * Provides user interface for configuring plugin settings
 */
class OntoTrackerSettingTab extends PluginSettingTab {
	/** Reference to the main plugin instance */
	plugin: OntoTracker;

	/**
	 * Initialize the settings tab
	 * @param app - Obsidian app instance
	 * @param plugin - Main plugin instance
	 */
	constructor(app: App, plugin: OntoTracker) {
		super(app, plugin);
		this.plugin = plugin;
		this.app = app;
	}

	/**
	 * Display the settings tab content
	 * Creates UI elements for project configuration
	 */
	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		// Create each settings element:
		createSettingsElements(this, containerEl, this.app, this);
	}
}