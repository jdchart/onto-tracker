import * as utils from 'scripts/utils';
import path from 'path';
const matter = require('gray-matter');

const processFile = (root_path, filePath, stats, app) => {
    app.vault.create(
        root_path + "/" + path.basename(filePath) + ".md",
        parseFileContent(["freeze:" + root_path.split(path.sep)[1]], filePath, stats)
    );
};

function parseFileContent(tags, filePath, stats){
    let data = {
        "tags" : tags,
        "path" : filePath,
        "file_name" : path.basename(filePath),
        "size" : stats.size,
        "last_modified" : stats.mtime,
        "last_accessed" : stats.atime,
        "created" : stats.birthtime,
        "inode_number" : stats.ino,
        "device_id" : stats.dev,
        "extension" : path.extname(filePath).slice(1),
        "onto_mime_type" : null,
        // "onto_rec_type" : null,
        // "onto_rec_type_group" : null,
        // "onto_relations" : []
    }

    return matter.stringify("", data);
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

export const processFreeze = async (settings, freezeSettings, app) => {

    if (await app.vault.adapter.exists("freezes") === false){
        await app.vault.createFolder("freezes")
    };
    const existing = await app.vault.adapter.list('freezes');

    let folder_name = getFreezeFolderName('freezes/' + freezeSettings.freezeName, existing.folders, 0);
    app.vault.createFolder(folder_name);
    app.vault.createFolder(folder_name + "/content");

    await app.vault.create(folder_name + "/metadata.md", createMetadataContent(settings, freezeSettings));
    
    await utils.treatFiles(folder_name + "/content", settings.sourceFolder, processFile, app);

    new Notice('Freeze finished!');
};

function createMetadataContent(settings, freezeSettings){
    let data = {
        "Project title" : settings.projectTitle,
        "Project source folder" : settings.sourceFolder,
        "Ontology file" : settings.ontoFile,
        "Freeze name" : freezeSettings.freezeName,
        "Freeze date" : freezeSettings.freezeDate
    };
    
    return matter.stringify("", data);
};