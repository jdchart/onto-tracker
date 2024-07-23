// Various utility functions for onto tracker

import fs from 'fs';
import path from 'path';
import { parseString } from 'xml2js';
import { promisify } from 'util';

export const writeJson = (filePath, jsonData) =>{
    const jsonString = JSON.stringify(jsonData, null, 2);

    fs.writeFile(filePath, jsonString, 'utf8', (err) => {
        if (err) {
          console.error('Error writing file:', err);
          return;
        }
        console.log('JSON file has been saved!');
      });
}

const readFileAsync = promisify(fs.readFile);

export const readXML = async (filePath) => {
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
    }
};

export const readMD = async (filePath) => {
    try {
        const data = await readFileAsync(filePath, 'utf-8');
        // const result = await new Promise((resolve, reject) => {
        //     parseString(data, (parseErr, result) => {
        //         if (parseErr) {
        //             reject(parseErr);
        //         } else {
        //             resolve(result);
        //         }
        //     });
        // });
        return data;
    } catch (err) {
        console.error('Error reading/parsing MD:', err);
        throw err; // Rethrow the error to propagate it upwards
    }
};

export const updateMDFile = (path, newContent) => {
    // Write the new content to the file
    fs.writeFile(path, newContent, { flag: 'w' }, (err) => {
        if (err) {
            console.error('Error writing to file:', err);
            return;
        }
    });
}

export const getFolder = async () => {
    const { dialog } = require('electron').remote;

    const result = await dialog.showOpenDialog({
        properties: ['openDirectory']
    });

    if (!result.canceled && result.filePaths.length > 0) {
        const selectedFolder = result.filePaths[0];
        return selectedFolder
    } else {
        return null;
    }
};

export const getFolderFolders = async (app, folderName) => {
    if (await app.vault.adapter.exists(folderName) === true){
        const existing = await app.vault.adapter.list(folderName);
        let ret = []
        for(let i = 0; i < existing.folders.length; i++){
            ret.push(existing.folders[i].split(folderName + "/")[1])
        }
        
        return ret;
    }
    else{
        return [];
    };	
};

export const getFile = async () => {
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

export const treatFiles = async (root_path, folderPath, fileProcess, app) => {
    fs.readdir(folderPath, (err, files) => {
        if (err) {
            console.error('Error reading folder:', err);
            return;
        }

        // Iterate through each file or folder in the directory
        files.forEach(file => {
            const filePath = path.join(folderPath, file);
            // Get file stats
            fs.stat(filePath, (err, stats) => {
                if (err) {
                    console.error('Error getting file stats:', err);
                    return;
                }
                if (stats.isDirectory()) {
                    app.vault.createFolder(root_path + "/" + path.basename(filePath))
                    treatFiles(root_path + "/" + path.basename(filePath), filePath, fileProcess, app);
                } else {
                    if (file != ".DS_Store"){
                        fileProcess(root_path, filePath, stats, app)
                    }
                    
                }
            });
        });
    });
};