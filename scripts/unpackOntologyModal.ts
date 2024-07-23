import { App, Modal, Setting, Notice } from 'obsidian';
import * as utils from 'scripts/utils';
const matter = require('gray-matter');

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
		const {contentEl} = this;
		contentEl.setText('Unpack ontology...');
		contentEl.createEl("div", { text : "Here you can unpack the currently selected ontology file into a folder. This will break the XML file into an easier to read collection of markdown files.", cls : "setting-item-description"})

		contentEl.createEl("br");

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


		new Setting(contentEl)
			.addButton((btn) => {
				btn
					.setButtonText("Unpack")
					.setCta()
					.onClick(async () => {
						new Notice('Unpacking ontology...');
						this.close();
						await processUnpack(this.projectSettings, this.thisApp, this.unpackSettings);
						new Notice('Ontology unpacked!');
					})
			})
	};

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	};
};

async function processUnpack(settings : Object, app : Object, ontoSettings){
	let ontologyXML = await utils.readXML(settings.ontoFile);
	// console.log(ontologyXML.hml_structure);
	
	if (await app.vault.adapter.exists("ontos") === false){
        await app.vault.createFolder("ontos");
    };

	const existing = await app.vault.adapter.list('ontos');
    let folder_name = getFreezeFolderName('ontos/' + ontoSettings.folderName, existing.folders, 0);
    app.vault.createFolder(folder_name);

	let metadata = {};

	
	for(let key in ontologyXML.hml_structure){		
		let firstItem = ontologyXML.hml_structure[key][0]
		if (typeof firstItem === 'string' || firstItem instanceof String){
			if(firstItem != "\n\n"){
				metadata[key] = firstItem;
			};
		}
		else{
			app.vault.createFolder(folder_name + "/" + key);

			for(let i = 0; i < ontologyXML.hml_structure[key].length; i++){
				let item = ontologyXML.hml_structure[key][i];

				let itemArray = item[Object.keys(item)[0]];
				
				
				
				for(let j = 0; j < itemArray.length; j++){
					

					await app.vault.create(folder_name + "/" + key + "/" + String(j + 1) + ".md", metadataParse(itemArray[j]));
				};
			};
		};
	};

	await app.vault.create(folder_name + "/metadata.md", metadataParse(metadata));
};

function metadataParse(data){
	let retData = {};




	// let ret = "---\n";
	for(let key in data){
		let field = String(data[key])
		field = field.replace(/\[/g, "(").replace(/\]/g, ")").replace(/\n/g, "").replace(/\\/g, "").replace(/\uFFFD/g, '').replace(/:/g, '--')
		// ret = ret + String(key) + ": " + field + "\n";

		retData[String(key)] = field;
	};
	// ret = ret + "---";
	return matter.stringify("", retData);
} 

function getFreezeFolderName(original_name, folder_list, index){
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