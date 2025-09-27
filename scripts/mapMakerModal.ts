/**
 * Map Maker Modal - Creates mapping files for ontological classification
 * 
 * This modal allows users to create mapping rules that automatically classify
 * files according to their MIME types and extensions based on the loaded ontology.
 */

// Imports
import { App, Modal, Setting, Notice } from 'obsidian';
import * as matter from 'gray-matter';

// Default data:
import { mime_data } from 'assets/mime_types';
import { OntoTrackerSettings as ProjectSettings, MapSettings, MimeTypeItem, getUniqueFolderName } from 'scripts/types';

/**
 * Modal for creating mapping configurations
 * Generates mapping files that define how files should be classified
 */
class MapMakerModal extends Modal {
	projectSettings: ProjectSettings;
	thisApp: App;
	mapSettings: MapSettings;

	/**
	 * Initialize the map maker modal
	 * @param app - Obsidian app instance
	 * @param settings - Project settings
	 */
	constructor(app: App, settings: ProjectSettings) {
		super(app);
		this.thisApp = app;
		this.projectSettings = settings;
		this.mapSettings = {
			'fileName' : 'untitled'
		}
	}

	/**
	 * Display the map maker modal content
	 * Creates form for mapping name input
	 */
	onOpen(): void {
		// Create modal elements:
		const {contentEl} = this;
		contentEl.setText('New mapping file');
		contentEl.createEl("div", { text : "Create a new mapping file which will tell Onto Tracker how to automatically class files.", cls : "setting-item-description"});
		contentEl.createEl("br");

		// Name
		new Setting(contentEl)
			.setName('Mapping name')
			.setDesc('Give the mapping  a name.')
			.addText(text => text
				// .setPlaceholder('Enter your secret')
				.setValue(this.mapSettings.fileName)
				.onChange((value) => {
					this.mapSettings.fileName = value;
				})
			);

		// Trigger processing
		new Setting(contentEl)
			.addButton((btn) => {
				btn
					.setButtonText("Create")
					.setCta()
					.onClick(async () => {
						try {
							// Validate input
							if (!this.mapSettings.fileName.trim()) {
								new Notice('Error: Please enter a mapping name');
								return;
							}

							this.close();
							await processMakeMapFile(this.projectSettings, this.mapSettings, this.thisApp);
						} catch (error) {
							console.error('Error creating mapping:', error);
							new Notice(`Error creating mapping: ${error instanceof Error ? error.message : 'Unknown error'}`);
						}
					})
			})
	}

	/**
	 * Clean up modal content when closed
	 */
	onClose(): void {
		const {contentEl} = this;
		contentEl.empty();
	}
}

/**
 * Process the creation of mapping files
 * @param settings - Project settings
 * @param mapSettings - Mapping configuration
 * @param app - Obsidian app instance
 */
async function processMakeMapFile(settings: ProjectSettings, mapSettings: MapSettings, app: App): Promise<void> {
	try {
		// Notify that processing has begun:
		new Notice('Creating mapping');

		// Check if mappings folder exists, if not, create it.
		if (await (app.vault.adapter as any).exists("mappings") === false){
			await (app.vault as any).createFolder("mappings");
		}

		// Create folder (if already exists, add an incremental number to it):
		const existing = await (app.vault.adapter as any).list('mappings');
		const fileName = getUniqueFolderName('mappings/' + mapSettings.fileName, existing.folders, 0);
		await (app.vault as any).createFolder(fileName);
		
		// Add mapping files:
		await (app.vault as any).create(fileName + "/01-mime_types.md", mimeTypeMapContent());
		await (app.vault as any).create(fileName + "/02-mime_types_mapping.md", mimeMapContent());
		await (app.vault as any).create(fileName + "/03-extension_mapping.md", extensionContent());

		// Notify processing finished:
		new Notice('Mapping created!');
	} catch (error) {
		console.error('Error creating mapping files:', error);
		new Notice(`Error creating mapping: ${error instanceof Error ? error.message : 'Unknown error'}`);
		throw error;
	}
}

/**
 * Generate content for MIME type mapping file
 * @returns Formatted markdown content with MIME type associations
 */
function mimeTypeMapContent(): string {
	// Create a file that allows the user to associate file extensions and mime types.

	const data: { [key: string]: string[] } = {}
	for(const i in mime_data["mimetypes"]) {
		const mimeType = mime_data["mimetypes"][i] as MimeTypeItem;
		data[mimeType["fxm_Extension"][0]] = [mimeType["fxm_MimeType"][0]];
	}

	// Return the data as string.
	return matter.stringify("Here, you can associate file extensions and mime types. Learn more about mime types [here](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types).", data);
}

/**
 * Generate content for MIME type classification rules
 * @returns Formatted markdown content with classification templates
 */
function mimeMapContent(): string {
	// Create a file that allows the user to create rules that will class files by mime type.
	const data = {
		"audio" : [],
		"video" : [],
		"image" : [],
		"text" : [],
		"application" : [],
		"message" : [],
		"other" : []
	};

	// Return cotnent as string.
	return matter.stringify("Here you can create rules that will class files according to their mime type. For example, type `RecTypes == 65` in audio so that all audio files are given the RecType 65. You can also add subtypes (for example audio/x-wav) to further refine mapping.", data);
}

/**
 * Generate content for file extension mapping
 * @returns Formatted markdown content with extension-based rules
 */
function extensionContent(): string {
	// Create a file that allows the user to create rules that will class files by file extension.
	const data: { [key: string]: string[] } = {};

	for(const i in mime_data["mimetypes"]) {
		const mimeType = mime_data["mimetypes"][i] as MimeTypeItem;
		data[mimeType["fxm_Extension"][0]] = [];
	}

	// Return cotnent as string.
	return matter.stringify("Here you can create rules that will class files according to their file extension. For example, type `RecTypes == 65` in wav so that all wav files are given the RecType 65.", data);
}

// Note: getUniqueFolderName is now imported from utils

export {MapMakerModal};