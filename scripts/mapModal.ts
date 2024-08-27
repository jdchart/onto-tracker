// A modal that allows the user to map files in a freeze according to an existing mapping.

// Various imports:
import { App, Modal, Setting, Notice } from 'obsidian';
import * as utils from 'scripts/utils';
const matter = require('gray-matter');

// Main modal:
class MapModal extends Modal {
	projectSettings : Object;
	thisApp : Object;
	mapSettings : { [key: string]: any };

	constructor(app: App, settings : Object) {
		super(app);
		this.thisApp = app;
		this.projectSettings = settings;
		this.mapSettings = {
			'freezeName' : '',
			'mapName' : ''
		}
	};

	async onOpen() {
		// Create modal elements:
		const {contentEl} = this;
		contentEl.setText('Map...');
		contentEl.createEl("div", { text : "Update the contents of a freeze with a mapping.", cls : "setting-item-description"})
		contentEl.createEl("br");

		// Get lists of existing freezes and mappings:
		let freezeList = await utils.getFolderFolders(this.thisApp, "freezes");
		this.mapSettings.freezeName = freezeList[0];
		let mappingList = await utils.getFolderFolders(this.thisApp, "mappings");
		this.mapSettings.mapName = mappingList[0];

		// Freeze:
		new Setting(contentEl)
			.setName('Freeze')
			.setDesc('Select a freeze to map.')
			.addDropdown(
				(drop) => {
					drop
					.addOptions(freezeListToOptions(freezeList))
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
					.addOptions(freezeListToOptions(mappingList))
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
						this.close();
						await processMap(this.projectSettings, this.mapSettings, this.thisApp);
					})
			})
	};

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	};
};

async function processMap(settings, mapSettings, app){
	// Mapping processing:
	
	// Notify that processing has begun:
	new Notice('Mapping \"' + mapSettings.freezeName + "\" using \"" + mapSettings.mapName + "\"...");

	// Get ontology XML data and convert to a dictionary:
	let ontologyXML = await utils.readXML(settings.ontoFile);
	let onto_data = onto_to_dict(ontologyXML);
	
	// Read the mapping data:
	let mappingData = await getMappingData(mapSettings.mapName, app);

	// Process freeze folder:
	treatFolder("freezes/" + mapSettings.freezeName + "/content", app, mappingData, onto_data);

	// Notify processing finished:
	new Notice('Mapping completed!');
};

function onto_to_dict(ontology_data){
	// Convert XML to dict

	let ret = {}
	for(let key in ontology_data.hml_structure){
		for(let i = 0; i < ontology_data.hml_structure[key].length; i++){
			let item = ontology_data.hml_structure[key][i];
			let itemArray = item[Object.keys(item)[0]];
			ret[key] = itemArray;
		};
	};
	return ret;
};

async function getMappingData(mappingName, app){
	// Colelct the mapping data:

	// Read markdown files:
	let root = app.vault.adapter.basePath;
	let mimeMapping = await utils.readMD(root + "/mappings/" + mappingName + "/02-mime_types_mapping.md");
	let mimeTypes = await utils.readMD(root + "/mappings/" + mappingName + "/01-mime_types.md");
	let extensionMapping = await utils.readMD(root + "/mappings/" + mappingName + "/03-extension_mapping.md");
	
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
};

async function treatFolder(folderPath, app, mappingData, ontoData){
	// Process a folder.

	// Iterate through the contents of given folder:
	const existing = await app.vault.adapter.list(folderPath);
	for(var i = 0; i < existing.files.length; i++){
		// Treat files:

		// Check the file is markdown:
		let ext = utils.get_extension(existing.files[i], existing.files[i]);
		if(ext == "md"){
			// Treat file:
			await treatFile(existing.files[i], app, mappingData, ontoData);
		};
	};
	for(var i = 0; i < existing.folders.length; i++){
		// Treat folders:
		await treatFolder(existing.folders[i], app, mappingData, ontoData);
	};
};

async function treatFile(filePath, app, mappingData, ontoData){
	// Process a file

	// Read the file:
	let root = app.vault.adapter.basePath;
	let fileRead = await utils.readMD(root + "/" + filePath);
	let fileReadParse = matter(fileRead);
	
	// Set mime type
	if(Object.keys(mappingData["mimeTypes"]).includes(fileReadParse.data["extension"])){
		fileReadParse.data["onto_mime_type"] = mappingData["mimeTypes"][fileReadParse.data["extension"]][0];
	}else{
		fileReadParse.data["onto_mime_type"] = "unknown/unknown";
	};

	// Get the file's main and secondary mime types:
	let mime_main = fileReadParse.data["onto_mime_type"].split("/")[0];
	let mime_second = fileReadParse.data["onto_mime_type"].split("/")[1];

	// Main mime type rule application
	let mimeMappingKeys = Object.keys(mappingData["mimeMapping"])
	for(var i = 0; i < mimeMappingKeys.length; i++ ){
		if(mimeMappingKeys[i].split("/").length == 1){
			if(mimeMappingKeys[i].split("/")[0] == mime_main){
				// Apply rule
				applyRule(fileReadParse.data, mappingData["mimeMapping"][mimeMappingKeys[i]], ontoData)
			};
		};
	};

	// Secondary mime type rule application
	for(var i = 0; i < mimeMappingKeys.length; i++ ){
		if(mimeMappingKeys[i].split("/").length > 1){
			if(mimeMappingKeys[i].split("/")[0] == mime_main){
				if(mimeMappingKeys[i].split("/")[1] == mime_second){
					// Apply rule
					applyRule(fileReadParse.data, mappingData["mimeMapping"][mimeMappingKeys[i]], ontoData)
				};
			};
		};
	};

	// Update file:
	let asString = matter.stringify(fileReadParse.content, fileReadParse.data);
	utils.updateMDFile(root + "/" + filePath, asString);
};

function applyRule(fileData: any, rule: any, ontoData : any){	
	// Apply a list of rules to a file:

	if (rule != null){
		if (typeof rule === 'string' || rule instanceof String){
			rule = [rule];
		};

		// Iterate through rules to apply:
		for(var i = 0; i < rule.length; i++){
			// Parse the rule:
			let thisRule = rule[i];
			let ruleSplit = thisRule.split(" ");
			const ruleKey = ruleSplit[0]; // The class of the ontology
			const ruleEqu = ruleSplit[1];
			const ruleVal = ruleSplit[2]; // The value to be set

			// Add a new YAML property drawn from the ontology data:
			if(ruleKey in ontoData){
				fileData["onto_" + ruleKey] = ontoData[ruleKey][parseInt(ruleVal) - 1];
			};
		};
	}else{};
};

function freezeListToOptions(fl : any){
	// Convert a list to html options.

	let ret = {};
	for(var i = 0; i < fl.length; i++){
		ret[fl[i]] = fl[i];
	};
	return ret;
};

export {MapModal};