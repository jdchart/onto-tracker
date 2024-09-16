// Unpack an ontology file into markdown files for consultation.

import { App, Modal, Setting, Notice } from 'obsidian';
import * as utils from 'scripts/utils';
const matter = require('gray-matter');

// Main modal:
class UnpackOntologyModal extends Modal {
	projectSettings : Object;
	thisApp : Object;
	unpackSettings : { [key: string]: any };

	constructor(app: App, settings : Object) {
		super(app);
		this.thisApp = app;
		this.projectSettings = settings;
		this.unpackSettings = {
			'folderName' : 'untitled'
		}
	};

	onOpen() {
		// Create modal elements:
		const {contentEl} = this;
		contentEl.setText('Unpack ontology');
		contentEl.createEl("div", { text : "Here you can unpack the currently selected ontology file into a folder. This will break the XML file into an easier to read collection of markdown files.", cls : "setting-item-description"});
		contentEl.createEl("br");

		// Destination:
		new Setting(contentEl)
			.setName('Desination')
			.setDesc('The name of the folder that will be created and contain the ontology.')
			.addText(text => text
				// .setPlaceholder('Enter your secret')
				.setValue(this.unpackSettings.folderName)
				.onChange((value) => {
					this.unpackSettings.folderName = value;
				})
			);

		// Trigger processing:
		new Setting(contentEl)
			.addButton((btn) => {
				btn
					.setButtonText("Unpack")
					.setCta()
					.onClick(async () => {
						this.close();
						await processUnpack(this.projectSettings, this.thisApp, this.unpackSettings);
					})
			})
	};

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	};
};

async function processUnpack(settings : Object, app : Object, ontoSettings){
	// Process unpacking:
	
	// Notify that processing has begun:
	new Notice('Unpacking ontology...');

	// Read the XML file:
	let ontologyXML = await utils.readXML(settings.ontoFile);

	// Check if ontos folder exists (if not, create it):
	if (await app.vault.adapter.exists("ontos") === false){
        await app.vault.createFolder("ontos");
    };

	// Get destination folder name (if name already exists, add an incremental number to it):
	const existing = await app.vault.adapter.list('ontos');
    let folder_name = getFreezeFolderName('ontos/' + ontoSettings.folderName, existing.folders, 0);
    app.vault.createFolder(folder_name);

	// Gather ontology metadata here:
	let metadata = {};

	// Iterate through the contents of the XML file:
	for(let key in ontologyXML.hml_structure){		
		let firstItem = ontologyXML.hml_structure[key][0]
		
		// Heurist format ontology bug fix:
		if (typeof firstItem === 'string' || firstItem instanceof String){
			if(firstItem != "\n\n"){
				metadata[key] = firstItem;
			};
		}
		else{
			// Create a folder for this class type:
			app.vault.createFolder(folder_name + "/" + key);

			// Create a file for each item in the class:
			for(let i = 0; i < ontologyXML.hml_structure[key].length; i++){
				// Convert item to array:
				let item = ontologyXML.hml_structure[key][i];
				let itemArray = item[Object.keys(item)[0]];
				
				// Create file for each item:
				for(let j = 0; j < itemArray.length; j++){
					await app.vault.create(folder_name + "/" + key + "/" + String(j + 1) + ".md", metadataParse(itemArray[j]));
				};
			};
		};
	};

	// Create metadata file:
	await app.vault.create(folder_name + "/metadata.md", metadataParse(metadata));

	// Notify processing finished:
	new Notice('Ontology unpacked!');
};

function metadataParse(data){
	// Parse the ontology data into file:
	let retData = {};

	// Add each attribute as YAML item:
	for(let key in data){
		let field = String(data[key])
		field = field.replace(/\[/g, "(").replace(/\]/g, ")").replace(/\n/g, "").replace(/\\/g, "").replace(/\uFFFD/g, '').replace(/:/g, '--');
		retData[String(key)] = field;
	};

	return matter.stringify("", retData);
};

function getFreezeFolderName(original_name, folder_list, index){
    // Return the final folder name.
	
	let proposed_name = original_name;
    if(index != 0){
        proposed_name = original_name + "_" + String(index);
    };

    if (folder_list.includes(proposed_name)){
        return getFreezeFolderName(original_name, folder_list, index + 1);
    }else{
        return proposed_name;
    };
};

export {UnpackOntologyModal};