/**
 * Map Modal - Applies mapping rules to freeze content
 * 
 * This modal allows users to apply previously created mapping rules
 * to the files in a freeze, automatically classifying them according
 * to the configured ontology.
 */

// Various imports:
import { App, Modal, Setting, Notice } from 'obsidian';
import * as utils from 'scripts/utils';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const matter = require('gray-matter');
import { OntoTrackerSettings as ProjectSettings, MapProcessSettings as MapSettings, MappingData, OntologyData, listToOptions } from 'scripts/types';

/**
 * Modal for applying mappings to freeze content
 * Provides interface for selecting freeze and mapping to process
 */
class MapModal extends Modal {
	projectSettings: ProjectSettings;
	thisApp: App;
	mapSettings: MapSettings;

	/**
	 * Initialize the map modal
	 * @param app - Obsidian app instance
	 * @param settings - Project settings
	 */
	constructor(app: App, settings: ProjectSettings) {
		super(app);
		this.thisApp = app;
		this.projectSettings = settings;
		this.mapSettings = {
			'freezeName' : '',
			'mapName' : ''
		}
	}

	/**
	 * Display the map modal content
	 * Creates dropdowns for freeze and mapping selection
	 */
	async onOpen(): Promise<void> {
		// Create modal elements:
		const {contentEl} = this;
		contentEl.setText('Map');
		contentEl.createEl("div", { text : "Update the contents of a freeze with a mapping.", cls : "setting-item-description"})
		contentEl.createEl("br");

		// Get lists of existing freezes and mappings:
		const freezeList = await utils.getFolderFolders(this.thisApp, "freezes");
		this.mapSettings.freezeName = freezeList[0];
		const mappingList = await utils.getFolderFolders(this.thisApp, "mappings");
		this.mapSettings.mapName = mappingList[0];

		// Freeze:
		new Setting(contentEl)
			.setName('Freeze')
			.setDesc('Select a freeze to map.')
			.addDropdown(
				(drop) => {
					drop
					.addOptions(listToOptions(freezeList))
					.onChange((val) => {
						this.mapSettings.freezeName = val
					})
				}
			)

		// Mapping:
		new Setting(contentEl)
			.setName('Mapping')
			.setDesc('Select a mapping to use.')
			.addDropdown(
				(drop) => {
					drop
					.addOptions(listToOptions(mappingList))
					.onChange((val) => {
						this.mapSettings.mapName = val
					})
				}
			)

		// Trigger processing:
		new Setting(contentEl)
			.addButton((btn) => {
				btn
					.setButtonText("Map")
					.setCta()
					.onClick(async () => {
						try {
							// Validate selections
							if (!this.mapSettings.freezeName || !this.mapSettings.mapName) {
								new Notice('Error: Please select both a freeze and mapping');
								return;
							}

							this.close();
							await processMap(this.projectSettings, this.mapSettings, this.thisApp);
						} catch (error) {
							console.error('Error in mapping process:', error);
							new Notice(`Error in mapping: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
 * Process mapping application to freeze content
 * @param settings - Project settings
 * @param mapSettings - Selected freeze and mapping names
 * @param app - Obsidian app instance
 */
async function processMap(settings: ProjectSettings, mapSettings: MapSettings, app: App): Promise<void> {
	// Mapping processing:
	
	// Notify that processing has begun:
	new Notice(`Mapping "${mapSettings.freezeName}" using "${mapSettings.mapName}"...`);

	// Get ontology XML data and convert to a dictionary:
	const ontologyXML = await utils.readXML(settings.ontoFile);
	const onto_data = onto_to_dict(ontologyXML);
	
	// Read the mapping data:
	const mappingData = await getMappingData(mapSettings.mapName, app);

	// Process freeze folder:
	treatFolder("freezes/" + mapSettings.freezeName + "/content", app, mappingData, onto_data);

	// Notify processing finished:
	new Notice('Mapping completed!');
}

/**
 * Convert ontology XML data to dictionary format
 * @param ontology_data - Raw ontology data from XML
 * @returns Structured ontology data as dictionary
 */
function onto_to_dict(ontology_data: any): OntologyData {
	// Convert XML to dict

	const ret: OntologyData = {}
	for(const key in ontology_data.hml_structure){
		for(let i = 0; i < ontology_data.hml_structure[key].length; i++){
			const item = ontology_data.hml_structure[key][i];
			const itemArray = item[Object.keys(item)[0]];
			(ret as any)[key] = itemArray;
		}
	}
	return ret;
}

/**
 * Load mapping data from mapping files
 * @param mappingName - Name of the mapping to load
 * @param app - Obsidian app instance
 * @returns Combined mapping data from all mapping files
 */
async function getMappingData(mappingName: string, app: App): Promise<MappingData> {
	// Colelct the mapping data:

	// Read markdown files:
	const root = (app.vault.adapter as any).basePath;
	const mimeMapping = await utils.readMD(root + "/mappings/" + mappingName + "/02-mime_types_mapping.md");
	const mimeTypes = await utils.readMD(root + "/mappings/" + mappingName + "/01-mime_types.md");
	const extensionMapping = await utils.readMD(root + "/mappings/" + mappingName + "/03-extension_mapping.md");
	
	// Conserve only the YAML data:
	const mimeMappingParse = matter(mimeMapping).data;
	const mimeTypesParse = matter(mimeTypes).data;
	const extensionMappingParse = matter(extensionMapping).data;

	// Return in a single object.
	return {
		"mimeMapping" : mimeMappingParse,
		"mimeTypes" : mimeTypesParse,
		"extensionMapping" : extensionMappingParse
	};
}

/**
 * Recursively process a folder and its contents for mapping
 * @param folderPath - Path to the folder to process
 * @param app - Obsidian app instance
 * @param mappingData - Mapping rules to apply
 * @param ontoData - Ontology data for classification
 */
async function treatFolder(folderPath: string, app: App, mappingData: MappingData, ontoData: OntologyData): Promise<void> {
	// Process a folder.

	// Iterate through the contents of given folder:
	const existing = await app.vault.adapter.list(folderPath);
	for(let i = 0; i < existing.files.length; i++){
		// Treat files:

		// Check the file is markdown:
		const ext = utils.get_extension(existing.files[i], existing.files[i]);
		if(ext === "md"){
			// Treat file:
			await treatFile(existing.files[i], app, mappingData, ontoData);
		}
	}
	for(let i = 0; i < existing.folders.length; i++){
		// Treat folders:
		await treatFolder(existing.folders[i], app, mappingData, ontoData);
	}
}

/**
 * Process a single file for mapping classification
 * @param filePath - Path to the file to process
 * @param app - Obsidian app instance
 * @param mappingData - Mapping rules to apply
 * @param ontoData - Ontology data for classification
 */
async function treatFile(filePath: string, app: App, mappingData: MappingData, ontoData: OntologyData): Promise<void> {
	// Process a file

	// Read the file:
	const root = (app.vault.adapter as any).basePath;
	const fileRead = await utils.readMD(root + "/" + filePath);
	const fileReadParse = matter(fileRead);
	
	// Set mime type
	if(Object.keys(mappingData["mimeTypes"]).includes(fileReadParse.data["extension"])){
		fileReadParse.data["onto_mime_type"] = mappingData["mimeTypes"][fileReadParse.data["extension"]][0];
	}else{
		fileReadParse.data["onto_mime_type"] = "unknown/unknown";
	}

	// Get the file's main and secondary mime types:
	const mime_main = fileReadParse.data["onto_mime_type"].split("/")[0];
	const mime_second = fileReadParse.data["onto_mime_type"].split("/")[1];

	// Main mime type rule application
	const mimeMappingKeys = Object.keys(mappingData["mimeMapping"])
	for(let i = 0; i < mimeMappingKeys.length; i++ ){
		if(mimeMappingKeys[i].split("/").length === 1){
			if(mimeMappingKeys[i].split("/")[0] === mime_main){
				// Apply rule
				applyRule(fileReadParse.data, mappingData["mimeMapping"][mimeMappingKeys[i]], ontoData)
			}
		}
	}

	// Secondary mime type rule application
	for(let i = 0; i < mimeMappingKeys.length; i++ ){
		if(mimeMappingKeys[i].split("/").length > 1){
			if(mimeMappingKeys[i].split("/")[0] === mime_main){
				if(mimeMappingKeys[i].split("/")[1] === mime_second){
					// Apply rule
					applyRule(fileReadParse.data, mappingData["mimeMapping"][mimeMappingKeys[i]], ontoData)
				}
			}
		}
	}

	// Update file:
	const asString = matter.stringify(fileReadParse.content, fileReadParse.data);
	utils.updateMDFile(root + "/" + filePath, asString);
}

/**
 * Apply ontological classification rules to file metadata
 * @param fileData - File metadata to modify
 * @param rule - Classification rule(s) to apply
 * @param ontoData - Ontology data containing classification values
 */
function applyRule(fileData: any, rule: any, ontoData: any): void {	
	// Apply a list of rules to a file:

	if (rule != null){
		if (typeof rule === 'string' || rule instanceof String){
			rule = [rule];
		}

		// Iterate through rules to apply:
		for(let i = 0; i < rule.length; i++){
			// Parse the rule:
			const thisRule = rule[i];
			const ruleSplit = thisRule.split(" ");
			const ruleKey = ruleSplit[0]; // The class of the ontology
			// const ruleEqu = ruleSplit[1]; // Equality operator (currently unused)
			const ruleVal = ruleSplit[2]; // The value to be set

			// Add a new YAML property drawn from the ontology data:
			if(ruleKey in ontoData){
				fileData["onto_" + ruleKey] = ontoData[ruleKey][parseInt(ruleVal) - 1];
			}
		}
	}
}

// Note: freezeListToOptions is now replaced with listToOptions from utils

export {MapModal};