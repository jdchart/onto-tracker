import { App, Modal, Setting, TFile } from 'obsidian';
import * as utils from 'scripts/utils';
const matter = require('gray-matter');

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
		const {contentEl} = this;
		contentEl.setText('Map...');

		contentEl.createEl("div", { text : "Update the contents of a freeze with a mapping.", cls : "setting-item-description"})

		contentEl.createEl("br");

		let freezeList = await utils.getFolderFolders(this.thisApp, "freezes");
		this.mapSettings.freezeName = freezeList[0];

		let mappingList = await utils.getFolderFolders(this.thisApp, "mappings");
		this.mapSettings.mapName = mappingList[0];

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

	let mappingData = await getMappingData(mapSettings.mapName, app);

	treatFolder("freezes/" + mapSettings.freezeName + "/content", app, mappingData);
};

async function getMappingData(mappingName, app){

	let root = app.vault.adapter.basePath;
	let mimeMapping = await utils.readMD(root + "/mappings/" + mappingName + "/mime_types_mapping.md");
	let mimeTypes = await utils.readMD(root + "/mappings/" + mappingName + "/mime_types.md");
	
	const mimeMappingParse = matter(mimeMapping).data;
	const mimeTypesParse = matter(mimeTypes).data;

	return {
		"mimeMapping" : mimeMappingParse,
		"mimeTypes" : mimeTypesParse
	};
};

async function treatFolder(folderPath, app, mappingData){
	const existing = await app.vault.adapter.list(folderPath);

	for(var i = 0; i < existing.files.length; i++){
		let ext = existing.files[i].split(".")[existing.files[i].split(".").length - 1];

		if(ext == "md"){
			await treatFile(existing.files[i], app, mappingData);
		}
	};
	for(var i = 0; i < existing.folders.length; i++){
		await treatFolder(existing.folders[i], app, mappingData);
	};
};

async function treatFile(filePath, app, mappingData){
	let root = app.vault.adapter.basePath;
	let fileRead = await utils.readMD(root + "/" + filePath);

	let fileReadParse = matter(fileRead);
	

	// PROCESES

	// Set mime type
	if(Object.keys(mappingData["mimeTypes"]).includes(fileReadParse.data["extension"])){
		fileReadParse.data["onto_mime_type"] = mappingData["mimeTypes"][fileReadParse.data["extension"]];
	}
	else{
		fileReadParse.data["onto_mime_type"] = "unknown/unknown";
	}

	// Parser mime type rules
	let mime_main = fileReadParse.data["onto_mime_type"].split("/")[0]
	let mime_second = fileReadParse.data["onto_mime_type"].split("/")[1]

	// Main type application
	let mimeMappingKeys = Object.keys(mappingData["mimeMapping"])
	for(var i = 0; i < mimeMappingKeys.length; i++ ){
		if(mimeMappingKeys[i].split("/").length == 1){
			if(mimeMappingKeys[i].split("/")[0] == mime_main){
				// Apply rule
				applyRule(fileReadParse.data, mappingData["mimeMapping"][mimeMappingKeys[i]])
			};
		};
	};

	// Secondary type application
	for(var i = 0; i < mimeMappingKeys.length; i++ ){
		if(mimeMappingKeys[i].split("/").length > 1){
			if(mimeMappingKeys[i].split("/")[0] == mime_main){
				if(mimeMappingKeys[i].split("/")[1] == mime_second){
					// Apply rule
					applyRule(fileReadParse.data, mappingData["mimeMapping"][mimeMappingKeys[i]])
				};
			};
		};
	};





	let asString = matter.stringify(fileReadParse.content, fileReadParse.data);
	utils.updateMDFile(root + "/" + filePath, asString);
};

function applyRule(fileData, rule){
	
	if (rule != null){
		if (typeof rule === 'string' || rule instanceof String){
			rule = [rule]
		}

		console.log("\n")
		console.log(fileData)
		console.log(rule)

		for(var i = 0; i < rule.length; i++){
			var thisRule = rule[i];
			var ruleSplit = thisRule.split(" ")[2];
			let onto_rec_type;
			let onto_rec_type_group;
			if(ruleSplit == "113"){
				onto_rec_type = "Document multimédia";
				onto_rec_type_group = "Manifestation physique";
			}else if(ruleSplit == "106"){
				onto_rec_type = "Sample";
				onto_rec_type_group = "Manifestation physique";
			}
			else if(ruleSplit == "108"){
				onto_rec_type = "Partition";
				onto_rec_type_group = "Manifestation physique";
			}
			
			fileData["onto_rec_type"] = onto_rec_type
			fileData["onto_rec_type_group"] = onto_rec_type_group
		}
	}else{
		console.log("\n")
		console.log(fileData)
		console.log("No rule found")
	}

}

function freezeListToOptions(fl){
	let ret = {}
	for(var i = 0; i < fl.length; i++){
		ret[fl[i]] = fl[i];
	};
	return ret;
};

export {MapModal};