// A lmodal to create mappings which will be used to map freezes to the ontology.

// Imports
import { App, Modal, Setting, Notice } from 'obsidian';
const matter = require('gray-matter');

// Default data:
import { mime_data } from 'assets/mime_types';

// Main modal:
class MapMakerModal extends Modal {
	projectSettings : Object;
	thisApp : Object;
	mapSettings : { [key: string]: any };

	constructor(app: App, settings : Object) {
		super(app);
		this.thisApp = app;
		this.projectSettings = settings;
		this.mapSettings = {
			'fileName' : 'untitled'
		}
	};

	onOpen() {
		// Create modal elements:
		const {contentEl} = this;
		contentEl.setText('New mapping file...');
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
						this.close();
						await processMakeMapFile(this.projectSettings, this.mapSettings, this.thisApp);
					})
			})
	};

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	};
};

async function processMakeMapFile(settings, mapSettings, app){
	// Process mapping creation.

	// Notify that processing has begun:
	new Notice('Creating mapping...');

	// Check if mappings folder exists, if not, create it.
	if (await app.vault.adapter.exists("mappings") === false){
        await app.vault.createFolder("mappings");
    };

	// Create folder (if already exists, add an incremental number to it):
	const existing = await app.vault.adapter.list('mappings');
    let file_name = getFreezeFolderName('mappings/' + mapSettings.fileName, existing.folders, 0);
	await app.vault.createFolder(file_name);
	
	// Add mapping files:
	await app.vault.create(file_name + "/01-mime_types.md", mimeTypeMapContent());
	await app.vault.create(file_name + "/02-mime_types_mapping.md", mimeMapContent());
	await app.vault.create(file_name + "/03-extension_mapping.md", extensionContent());

	// Notify processing finished:
	new Notice('Mapping created!');
};

function mimeTypeMapContent(){
	// Create a file that allows the user to associate file extensions and mime types.

	let data = {}
	for(let i in mime_data["mimetypes"]){
		data[mime_data["mimetypes"][i]["fxm_Extension"][0]] = [mime_data["mimetypes"][i]["fxm_MimeType"][0]];
	};

	// Return the data as string.
	return matter.stringify("Here, you can associate file extensions and mime types. Learn more about mime types [here](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types).", data);
};

function mimeMapContent(){
	// Create a file that allows the user to create rules that will class files by mime type.
	let data = {
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
};

function extensionContent(){
	// Create a file that allows the user to create rules that will class files by file extension.
	let data = {};

	for(let i in mime_data["mimetypes"]){
		data[mime_data["mimetypes"][i]["fxm_Extension"][0]] = [];
	};

	// Return cotnent as string.
	return matter.stringify("Here you can create rules that will class files according to their file extension. For example, type `RecTypes == 65` in wav so that all wav files are given the RecType 65.", data);
};

function getFreezeFolderName(original_name, folder_list, index){
	// Get the final folder name.

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

export {MapMakerModal};