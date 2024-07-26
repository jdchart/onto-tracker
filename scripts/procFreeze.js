// The processing for folder freezes (triggered by the freezeModal.ts)

// Various imports:
import * as utils from 'scripts/utils';
import path from 'path';
const matter = require('gray-matter');
import { Notice } from 'obsidian';

// Main processing function:
export const processFreeze = async (settings, freezeSettings, app) => {

    // Notify that freeze is processing:
    new Notice('Performing freeze...');

    // Check if freeze folder exists at root, if not, creates it:
    if (await app.vault.adapter.exists("freezes") === false){
        await app.vault.createFolder("freezes")
    };
    // Get a list of existing freezes:
    const existing = await app.vault.adapter.list('freezes');
    const existing_ordered = await order_existing(existing, app);

    // Get this freeze's folder name and create folders:
    let folder_name = getFreezeFolderName('freezes/' + freezeSettings.freezeName, existing.folders, 0);
    app.vault.createFolder(folder_name);
    app.vault.createFolder(folder_name + "/content");

    // Create a metadata file for the freeze:
    await app.vault.create(folder_name + "/metadata.md", createMetadataContent(settings, freezeSettings));
    
    // Process files:
    await utils.treatFiles(folder_name + "/content", settings.sourceFolder, processFile, app, parseForbiddenFiles(freezeSettings.forbidden), existing_ordered, freezeSettings, folder_name);

    // Alert that freeze has finished processing.
    new Notice('Freeze finished!');
};

async function order_existing(existing_freezes, app){
    // Order the lsit of existing freezes by dat:
    
    let ret = [];
    for(var i = 0; i < existing_freezes.folders.length; i++){
        const file = matter.read(app.vault.adapter.basePath + "/" + existing_freezes.folders[i] + "/metadata.md");
        let this_date = file.data["Freeze date"];
        ret.push({"path" : existing_freezes.folders[i], "date" : this_date});
    };

    ret.sort((a, b) => new Date(b.date) - new Date(a.date));

    return ret;
};

function parseForbiddenFiles(format_list){
    // Transform string to list:
    return split = format_list.replaceAll(" ", "").split(",");
};

const processFile = (root_path, filePath, stats, app, existing, freezeSettings, freezeFolderName) => {
    // The function that will be called when treating files:

    let existed = false;
    // Check if file existed in previous freezes:
    if(freezeSettings.keepOld){
        existed = checkIfFileExisted(existing, stats, app);
    };
    
    // Create the md from file data:
    app.vault.create(
        root_path + "/" + path.basename(filePath) + ".md",
        parseFileContent(["freeze:" + root_path.split(path.sep)[1]], filePath, stats, existed, freezeSettings.keepOld, freezeFolderName)
    );
};

function checkIfFileExisted(existing_freezes, stats, app){
    // Check if a file existed in previous freezes 
    // (true if inode number and device id are the same).
    
    let existed = false;
    for(var i = 0; i < existing_freezes.length; i++){
        if(existed === false){
            const file_list = utils.getFileList(app.vault.adapter.basePath + "/" + existing_freezes[i].path + "/content", ["md"]);
            for(var j = 0; j < file_list.length; j++){
                let file_read = matter.read(file_list[j]);
                if(file_read.data["inode_number"] === stats.ino && file_read.data["device_id"] === stats.dev){
                    existed = {"content" : file_read , "freeze" : existing_freezes[i]};
                    break;
                };
            };
        };
    };
    return existed;
};

function parseFileContent(tags, filePath, stats, existed, keepOld, freezeFolderName){
    // Content to be created in the md file from file data:
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
        "freeze_history" : []
    };

    // Process getting data from existing files:
    if(keepOld){
        if(existed === false){
            data["freeze_history"] = [freezeFolderName.replace("freezes/", "")];
        }else{
            data["freeze_history"] = existed.content.data["freeze_history"]
            data["freeze_history"].push(freezeFolderName.replace("freezes/", ""));

            // Add other keys that may have existed:
            for(var key in existed.content.data){
                if(Object.keys(data).includes(key) == false){
                    data[key] = existed.content.data[key];
                };  
            };
        };
    }else{
        data["freeze_history"] = [freezeFolderName.replace("freezes/", "")];
    };
    let md_content = "";
    if(keepOld){
        if(existed != false){
            md_content = existed.content.content;
        };
    };

    // Return the content as a string:
    return matter.stringify(md_content.trim(), data);
};

function createMetadataContent(settings, freezeSettings){
    // Create a basic metadata file about the freeze's info.    
    let data = {
        "Project title" : settings.projectTitle,
        "Project source folder" : settings.sourceFolder,
        "Ontology file" : settings.ontoFile,
        "Freeze name" : freezeSettings.freezeName,
        "Freeze date" : freezeSettings.freezeDate,
        "Detect existing files" : freezeSettings.keepOld,
        "Ignore files" : freezeSettings.forbidden
    };
    
    return matter.stringify("", data);
};

function getFreezeFolderName(original_name, folder_list, index){
    // Get the name for the freeze folder (if a freeze already exists with this name, will add an incremental number)
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