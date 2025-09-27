/**
 * Unpack Ontology Modal - Converts ontology XML files to readable markdown
 * 
 * This modal allows users to unpack complex ontology XML files into
 * a structured collection of markdown files for easier consultation
 * and understanding of the ontological structure.
 */

import { App, Modal, Setting, Notice } from 'obsidian';
import * as utils from 'scripts/utils';
import * as matter from 'gray-matter';
import { OntoTrackerSettings as ProjectSettings, UnpackSettings, getUniqueFolderName } from 'scripts/types';

/**
 * Modal for unpacking ontology files
 * Provides interface for configuring ontology unpacking destination
 */
class UnpackOntologyModal extends Modal {
	projectSettings: ProjectSettings;
	thisApp: App;
	unpackSettings: UnpackSettings;

	/**
	 * Initialize the unpack ontology modal
	 * @param app - Obsidian app instance
	 * @param settings - Project settings containing ontology file path
	 */
	constructor(app: App, settings: ProjectSettings) {
		super(app);
		this.thisApp = app;
		this.projectSettings = settings;
		this.unpackSettings = {
			'folderName' : 'untitled'
		}
	}

	/**
	 * Display the unpack modal content
	 * Creates form for destination folder configuration
	 */
	onOpen(): void {
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
						try {
							// Validate settings
							if (!this.projectSettings.ontoFile) {
								new Notice('Error: No ontology file specified in settings');
								return;
							}

							if (!this.unpackSettings.folderName.trim()) {
								new Notice('Error: Please enter a folder name');
								return;
							}

							this.close();
							await processUnpack(this.projectSettings, this.thisApp, this.unpackSettings);
						} catch (error) {
							console.error('Error unpacking ontology:', error);
							new Notice(`Error unpacking ontology: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
 * Process the unpacking of an ontology file
 * @param settings - Project settings containing ontology file path
 * @param app - Obsidian app instance
 * @param ontoSettings - Unpacking configuration
 */
async function processUnpack(settings: ProjectSettings, app: App, ontoSettings: UnpackSettings): Promise<void> {
	// Process unpacking:
	
	// Notify that processing has begun:
	new Notice('Unpacking ontology...');

	// Read the XML file:
	const ontologyXML = await utils.readXML((settings as any).ontoFile);

	// Check if ontos folder exists (if not, create it):
	if (await (app as any).vault.adapter.exists("ontos") === false){
        await (app as any).vault.createFolder("ontos");
    }

	// Get destination folder name (if name already exists, add an incremental number to it):
	const existing = await (app as any).vault.adapter.list('ontos');
    const folder_name = getUniqueFolderName('ontos/' + ontoSettings.folderName, existing.folders, 0);
    (app as any).vault.createFolder(folder_name);

	// Gather ontology metadata here:
	const metadata: { [key: string]: any } = {};

	// Iterate through the contents of the XML file:
	for(const key in ontologyXML.hml_structure){		
		const firstItem = ontologyXML.hml_structure[key][0]
		
		// Heurist format ontology bug fix:
		if (typeof firstItem === 'string' || firstItem instanceof String){
			if(firstItem != "\n\n"){
				(metadata as any)[key] = firstItem;
			}
		}
		else{
			// Create a folder for this class type:
			(app as any).vault.createFolder(folder_name + "/" + key);

			// Create a file for each item in the class:
			for(let i = 0; i < ontologyXML.hml_structure[key].length; i++){
				// Convert item to array:
				const item = ontologyXML.hml_structure[key][i];
				const itemArray = item[Object.keys(item)[0]];
				
				// Create file for each item:
				for(let j = 0; j < itemArray.length; j++){
					await (app as any).vault.create(folder_name + "/" + key + "/" + String(j + 1) + ".md", metadataParse(itemArray[j]));
				}
			}
		}
	}

	// Create metadata file:
	await (app as any).vault.create(folder_name + "/metadata.md", metadataParse(metadata));

	// Notify processing finished:
	new Notice('Ontology unpacked!');
}

/**
 * Parse ontology metadata into markdown format
 * @param data - Raw ontology metadata
 * @returns Formatted markdown content with YAML frontmatter
 */
function metadataParse(data: any): string {
	// Parse the ontology data into file:
	const retData: { [key: string]: string } = {};

	// Add each attribute as YAML item:
	for(const key in data){
		let field = String(data[key])
		field = field.replace(/\[/g, "(").replace(/\]/g, ")").replace(/\n/g, "").replace(/\\/g, "").replace(/\uFFFD/g, '').replace(/:/g, '--');
		(retData as any)[String(key)] = field;
	}

	return matter.stringify("", retData);
}

// Note: getUniqueFolderName is now imported from utils

export {UnpackOntologyModal};