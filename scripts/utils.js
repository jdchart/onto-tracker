// Various utility functions for onto tracker

// Various imports:
import fs from 'fs';
import path from 'path';
import { parseString } from 'xml2js';
import { promisify } from 'util';
import { Notice } from 'obsidian';

export const writeJson = (filePath, jsonData) =>{
    // Write a json file to disk:
    
    const jsonString = JSON.stringify(jsonData, null, 2);

    fs.writeFile(filePath, jsonString, 'utf8', (err) => {
        if (err) {
          console.error('Error writing file:', err);
          return;
        }
        console.log('JSON file has been saved!');
      });
};

const readFileAsync = promisify(fs.readFile);

export const readXML = async (filePath) => {
    // Read the contents of an xml file asynchronously:

    try {
        const data = await readFileAsync(filePath, 'utf-8');
        const result = await new Promise((resolve, reject) => {
            parseString(data, (parseErr, result) => {
                if (parseErr) {
                    reject(parseErr);
                } else {
                    resolve(result);
                }
            });
        });
        return result;
    } catch (err) {
        console.error('Error reading/parsing XML:', err);
        throw err; // Rethrow the error to propagate it upwards
    };
};

export const readMD = async (filePath) => {
    // Read the contents of a markdown file asynchronously.

    try {
        const data = await readFileAsync(filePath, 'utf-8');
        return data;
    } catch (err) {
        console.error('Error reading/parsing MD:', err);
        throw err;
    }
};

export const updateMDFile = (path, newContent) => {
    // Write the new content to a file:

    fs.writeFile(path, newContent, { flag: 'w' }, (err) => {
        if (err) {
            console.error('Error writing to file:', err);
            return;
        }
    });
}

export const getFolderFolders = async (app, folderName) => {
    // Get a list of folders in a directory in the vault:

    if (await app.vault.adapter.exists(folderName) === true){
        const existing = await app.vault.adapter.list(folderName);
        let ret = []
        for(let i = 0; i < existing.folders.length; i++){
            ret.push(existing.folders[i].split(folderName + "/")[1]);
        };
        
        return ret;
    }
    else{
        return [];
    };	
};

export const getFile = async () => {
    // Get a file path using file dialog:
    const { dialog } = require('electron').remote;

    const result = await dialog.showOpenDialog({
        properties: ['openFile']
    });

    if (!result.canceled && result.filePaths.length > 0) {
        const selectedFile = result.filePaths[0];
        return selectedFile
    } else {
        return null;
    }
};

export const getFolder = async () => {
    // Get a folder using the file dialog:

    const { dialog } = require('electron').remote;

    const result = await dialog.showOpenDialog({
        properties: ['openDirectory']
    });

    if (!result.canceled && result.filePaths.length > 0) {
        const selectedFolder = result.filePaths[0];
        return selectedFolder
    } else {
        return null;
    };
};

export const treatFiles = async (root_path, folderPath, fileProcess, app, forbidden_formats, existing, freezeSettings, folder_name) => {
    // Function for iteratively treating files for a freeze:
    
    fs.readdir(folderPath, (err, files) => {
        if (err) {
            console.error('Error reading folder:', err);
            new Notice('Error reading folder \"' + folderPath + "\"");
            return;
        }

        // Iterate through each file or folder in the directory
        files.forEach(file => {
            const filePath = path.join(folderPath, file);
            // Get file stats
            fs.stat(filePath, (err, stats) => {
                if (err) {
                    console.error('Error getting file stats:', err);
                    new Notice('Error reading file \"' + filePath + "\"");
                    return;
                }
                if (stats.isDirectory()) {
                    // Create a folder if needed:
                    app.vault.createFolder(root_path + "/" + path.basename(filePath))
                    treatFiles(root_path + "/" + path.basename(filePath), filePath, fileProcess, app, forbidden_formats, existing, freezeSettings, folder_name);
                } else {
                    // Process file:
                    let extension = get_extension(filePath, file);
                    if (forbidden_formats.includes(extension) == false){
                        fileProcess(root_path, filePath, stats, app, existing, freezeSettings, folder_name)
                    };  
                };
            });
        });
    });
};

export const get_extension = (path_str, file) => {
    // Return the file extension of a file (includign cases like .DS_Store):
    let ext = path.extname(path_str).slice(1);
    if (!ext && file.startsWith('.')) {
        ext = file.slice(1); // Treat files like .DS_Store as having the extension 'DS_Store'
    };
    return ext;
};

export const getFileList = (dir, extList) => {
    // Synchroniously get a list of files in a folder (according to a lsit of extensions)
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      file = path.join(dir, file);
      const stat = fs.statSync(file);
      if (stat && stat.isDirectory()) {
        results = results.concat(getFileList(file, extList));
      } else {
        let extension = get_extension(file, file);
        if(extList.includes(extension)){
            results.push(file);
        };
      };
    });
    return results;
};