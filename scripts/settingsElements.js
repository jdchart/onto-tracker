// Elements for the onto tracker settings tab:
import { Setting, Notice } from 'obsidian';
import * as utils from 'scripts/utils';

export const createSettingsElements = (settingsClass, containerEl) => {
    settingsProjectTitleSetup(settingsClass, containerEl);
    settingsSourceFolderSetup(settingsClass, containerEl);
    settingsOntologyFileSetup(settingsClass, containerEl);
};

// Project title
export const settingsProjectTitleSetup = (settingsClass, containerEl) => {
    new Setting(containerEl)
        .setName('Project title')
        .setDesc('The title of your project')
        .addText(text => text
            // .setPlaceholder('Enter your secret')
            .setValue(settingsClass.plugin.settings.projectTitle)
            .onChange(async (value) => {
                settingsClass.plugin.settings.projectTitle = value;
                await settingsClass.plugin.saveSettings();
            }));
};

// Source folder
export const settingsSourceFolderSetup = (settingsClass, containerEl) => {
    let thisSet = new Setting(containerEl)
        .setName('Source directory')
        //.setDesc('Please choose a source directory...')
        .setDesc(getValuerDescription(settingsClass.plugin.settings.sourceFolder, "Choose a source folder..."))

    thisSet.addButton(but => but
        .setButtonText("Source directory...")
        .onClick(async () => {
            // new Notice("Choosing...");
            let selectedFolder = await utils.getFolder();
            if (selectedFolder != null){
                settingsClass.plugin.settings.sourceFolder = selectedFolder;
                thisSet.setDesc(settingsClass.plugin.settings.sourceFolder);
                await settingsClass.plugin.saveSettings();
            };
        })
    );
};

// Ontology file:
export const settingsOntologyFileSetup = (settingsClass, containerEl) => {
    let thisSet = new Setting(containerEl)
        .setName('Ontology')
        //.setDesc('Please choose a source directory...')
        .setDesc(getValuerDescription(settingsClass.plugin.settings.ontoFile, "Choose an ontology file..."))
    thisSet.addButton(but => but
        .setButtonText("Ontology file...")
        .onClick(async () => {
            let selectedFolder = await utils.getFile();
            if (selectedFolder != null){
                let ext = utils.get_extension(selectedFolder).toLowerCase();
                if(ext != "xml"){
                    new Notice('Sorry, currently only XML files can be used as ontology files.');
                }else{
                    settingsClass.plugin.settings.ontoFile = selectedFolder;
                    thisSet.setDesc(settingsClass.plugin.settings.ontoFile);
                    await settingsClass.plugin.saveSettings();
                };  
            };
        })
    );
};

function getValuerDescription(value, placeholder){
    if (value === ''){return placeholder;}
    else{return value;};
};