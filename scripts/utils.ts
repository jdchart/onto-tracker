// Various utility functions for onto tracker - TypeScript version

import * as fs from 'fs';
import * as path from 'path';
import { parseString } from 'xml2js';
import { promisify } from 'util';
import { Notice, App } from 'obsidian';
import { FileProcessFunction, FreezeSettings } from './types';

const readFileAsync = promisify(fs.readFile);

/**
 * Write JSON data to a file asynchronously
 * @param filePath - The path where to write the file
 * @param jsonData - The data to write as JSON
 */
export const writeJson = async (filePath: string, jsonData: any): Promise<void> => {
    try {
        const jsonString = JSON.stringify(jsonData, null, 2);
        await fs.promises.writeFile(filePath, jsonString, 'utf8');
        console.log('JSON file has been saved!');
    } catch (err) {
        console.error('Error writing file:', err);
        throw err;
    }
};

/**
 * Read and parse an XML file asynchronously
 * @param filePath - The path to the XML file
 * @returns Parsed XML data as JavaScript object
 */
export const readXML = async (filePath: string): Promise<any> => {
    try {
        const data = await readFileAsync(filePath, 'utf-8');
        const result = await new Promise((resolve, reject) => {
            parseString(data, (parseErr: Error | null, result: any) => {
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
        throw err;
    }
};

/**
 * Read a markdown file asynchronously
 * @param filePath - The path to the markdown file
 * @returns File content as string
 */
export const readMD = async (filePath: string): Promise<string> => {
    try {
        const data = await readFileAsync(filePath, 'utf-8');
        return data;
    } catch (err) {
        console.error('Error reading/parsing MD:', err);
        throw err;
    }
};

/**
 * Update a markdown file with new content
 * @param filePath - The path to the file
 * @param newContent - The new content to write
 */
export const updateMDFile = async (filePath: string, newContent: string): Promise<void> => {
    try {
        await fs.promises.writeFile(filePath, newContent, { flag: 'w' });
    } catch (err) {
        console.error('Error writing to file:', err);
        throw err;
    }
};

/**
 * Get a list of folder names within a vault directory
 * @param app - The Obsidian app instance
 * @param folderName - The name of the folder to list
 * @returns Array of folder names
 */
export const getFolderFolders = async (app: App, folderName: string): Promise<string[]> => {
    try {
        if (await (app.vault.adapter as any).exists(folderName) === true) {
            const existing = await (app.vault.adapter as any).list(folderName);
            const ret: string[] = [];
            for (let i = 0; i < existing.folders.length; i++) {
                ret.push(existing.folders[i].split(folderName + "/")[1]);
            }
            return ret;
        } else {
            return [];
        }
    } catch (err) {
        console.error('Error getting folder list:', err);
        return [];
    }
};

/**
 * Get a file path using file dialog (Electron-based)
 * @returns Selected file path or null if cancelled
 */
export const getFile = async (): Promise<string | null> => {
    try {
        // Note: Electron require needed for file dialog functionality
        const electron = require('electron'); // eslint-disable-line @typescript-eslint/no-var-requires
        const { dialog } = electron.remote;
        const result = await dialog.showOpenDialog({
            properties: ['openFile']
        });

        if (!result.canceled && result.filePaths.length > 0) {
            return result.filePaths[0];
        } else {
            return null;
        }
    } catch (err) {
        console.error('Error opening file dialog:', err);
        return null;
    }
};

/**
 * Get a folder path using file dialog (Electron-based)
 * @returns Selected folder path or null if cancelled
 */
export const getFolder = async (): Promise<string | null> => {
    try {
        // Note: Electron require needed for file dialog functionality  
        const electron = require('electron'); // eslint-disable-line @typescript-eslint/no-var-requires
        const { dialog } = electron.remote;
        const result = await dialog.showOpenDialog({
            properties: ['openDirectory']
        });

        if (!result.canceled && result.filePaths.length > 0) {
            return result.filePaths[0];
        } else {
            return null;
        }
    } catch (err) {
        console.error('Error opening folder dialog:', err);
        return null;
    }
};

/**
 * Recursively process files in a directory for freeze creation
 * @param rootPath - The root path in the vault
 * @param folderPath - The current folder path being processed
 * @param fileProcess - Function to process each file
 * @param app - The Obsidian app instance
 * @param forbiddenFormats - Array of forbidden file extensions
 * @param existing - Existing files data
 * @param freezeSettings - Freeze configuration settings
 * @param folderName - Name of the freeze folder
 */
export const treatFiles = async (
    rootPath: string,
    folderPath: string,
    fileProcess: FileProcessFunction,
    app: App,
    forbiddenFormats: string[],
    existing: any,
    freezeSettings: FreezeSettings,
    folderName: string
): Promise<void> => {
    try {
        const files = await fs.promises.readdir(folderPath);
        
        for (const file of files) {
            const filePath = path.join(folderPath, file);
            try {
                const stats = await fs.promises.stat(filePath);
                
                if (stats.isDirectory()) {
                    // Create a folder if needed
                    await (app.vault as any).createFolder(rootPath + "/" + path.basename(filePath));
                    await treatFiles(
                        rootPath + "/" + path.basename(filePath),
                        filePath,
                        fileProcess,
                        app,
                        forbiddenFormats,
                        existing,
                        freezeSettings,
                        folderName
                    );
                } else {
                    // Process file
                    const extension = getExtension(filePath, file);
                    if (!forbiddenFormats.includes(extension)) {
                        fileProcess(rootPath, filePath, stats, app, existing, freezeSettings, folderName);
                    }
                }
            } catch (err) {
                console.error('Error getting file stats:', err);
                new Notice('Error reading file "' + filePath + '"');
            }
        }
    } catch (err) {
        console.error('Error reading folder:', err);
        new Notice('Error reading folder "' + folderPath + '"');
    }
};

/**
 * Get the file extension from a path and filename
 * @param pathStr - The full file path
 * @param file - The filename
 * @returns The file extension (without the dot)
 */
export const getExtension = (pathStr: string, file: string): string => {
    let ext = path.extname(pathStr).slice(1);
    if (!ext && file.startsWith('.')) {
        ext = file.slice(1); // Treat files like .DS_Store as having the extension 'DS_Store'
    }
    return ext;
};

/**
 * Recursively get a list of files with specific extensions
 * @param dir - Directory to search
 * @param extList - Array of allowed extensions
 * @returns Array of file paths matching the extensions
 */
export const getFileList = (dir: string, extList: string[]): string[] => {
    let results: string[] = [];
    
    try {
        const list = fs.readdirSync(dir);
        
        for (const file of list) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            
            if (stat && stat.isDirectory()) {
                results = results.concat(getFileList(fullPath, extList));
            } else {
                const extension = getExtension(fullPath, file);
                if (extList.includes(extension)) {
                    results.push(fullPath);
                }
            }
        }
    } catch (err) {
        console.error('Error reading directory:', err);
    }
    
    return results;
};

/**
 * Convert a list to HTML select options format
 * @param list - Array of strings to convert
 * @returns Object with key-value pairs for select options
 */
export const listToOptions = (list: string[]): { [key: string]: string } => {
    const ret: { [key: string]: string } = {};
    for (let i = 0; i < list.length; i++) {
        ret[list[i]] = list[i];
    }
    return ret;
};

/**
 * Generate a unique folder name by adding incremental numbers if needed
 * @param originalName - The desired folder name
 * @param folderList - List of existing folder names
 * @param index - Current increment index (starts at 0)
 * @returns A unique folder name
 */
export const getUniqueFolderName = (originalName: string, folderList: string[], index = 0): string => {
    let proposedName = originalName;
    if (index !== 0) {
        proposedName = originalName + "_" + String(index);
    }

    if (folderList.includes(proposedName)) {
        return getUniqueFolderName(originalName, folderList, index + 1);
    } else {
        return proposedName;
    }
};

// Legacy function name for backward compatibility
export const get_extension = getExtension;