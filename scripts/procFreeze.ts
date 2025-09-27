// The processing for folder freezes (triggered by the freezeModal.ts)

// Various imports:
import * as utils from 'scripts/utils';
import * as path from 'path';
import * as matter from 'gray-matter';
import { Notice, App } from 'obsidian';
import { OntoTrackerSettings, FreezeSettings, FileStats, getUniqueFolderName } from 'scripts/types';

/**
 * Interface for existing freeze data
 */
interface ExistingFreeze {
    path: string;
    date: string;
}

/**
 * Interface for file existence check result
 */
interface FileExistenceResult {
    content: any;
    freeze: ExistingFreeze;
}

/**
 * Main processing function for creating freezes
 * @param settings - Project settings
 * @param freezeSettings - Freeze configuration
 * @param app - Obsidian app instance
 */
export const processFreeze = async (
    settings: OntoTrackerSettings, 
    freezeSettings: FreezeSettings, 
    app: App
): Promise<void> => {
    // Notify that freeze is processing:
    new Notice('Performing freeze...');

    try {
        // Check if freeze folder exists at root, if not, creates it:
        if (await (app.vault.adapter as any).exists("freezes") === false) {
            await (app.vault as any).createFolder("freezes");
        }

        // Get a list of existing freezes:
        const existing = await (app.vault.adapter as any).list('freezes');
        const existingOrdered = await orderExisting(existing, app);

        // Get this freeze's folder name and create folders:
        const folderName = getUniqueFolderName('freezes/' + freezeSettings.freezeName, existing.folders, 0);
        await (app.vault as any).createFolder(folderName);
        await (app.vault as any).createFolder(folderName + "/content");

        // Create a metadata file for the freeze:
        await (app.vault as any).create(folderName + "/metadata.md", createMetadataContent(settings, freezeSettings));
        
        // Process files:
        await utils.treatFiles(
            folderName + "/content", 
            settings.sourceFolder, 
            processFile, 
            app, 
            parseForbiddenFiles(freezeSettings.forbidden), 
            existingOrdered, 
            freezeSettings, 
            folderName
        );

        // Alert that freeze has finished processing.
        new Notice('Freeze finished!');
    } catch (error) {
        console.error('Error during freeze processing:', error);
        new Notice('Error occurred during freeze processing');
    }
};

/**
 * Order existing freezes by date
 * @param existingFreezes - List of existing freeze folders
 * @param app - Obsidian app instance
 * @returns Ordered array of freeze data
 */
async function orderExisting(existingFreezes: any, app: App): Promise<ExistingFreeze[]> {
    const ret: ExistingFreeze[] = [];
    
    try {
        for (let i = 0; i < existingFreezes.folders.length; i++) {
            const file = matter.read((app.vault.adapter as any).basePath + "/" + existingFreezes.folders[i] + "/metadata.md");
            const thisDate = file.data["Freeze date"];
            ret.push({ path: existingFreezes.folders[i], date: thisDate });
        }

        ret.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
        console.error('Error ordering existing freezes:', error);
    }

    return ret;
}

/**
 * Parse forbidden file formats string into array
 * @param formatList - Comma-separated string of forbidden formats
 * @returns Array of forbidden file extensions
 */
function parseForbiddenFiles(formatList: string): string[] {
    return formatList.replace(/\s/g, "").split(",");
}

/**
 * Process a single file for freeze creation
 * @param rootPath - Root path in the vault
 * @param filePath - Path to the file being processed
 * @param stats - File system stats
 * @param app - Obsidian app instance
 * @param existing - Existing freeze data
 * @param freezeSettings - Freeze configuration
 * @param freezeFolderName - Name of the freeze folder
 */
const processFile = (
    rootPath: string,
    filePath: string,
    stats: FileStats,
    app: App,
    existing: ExistingFreeze[],
    freezeSettings: FreezeSettings,
    freezeFolderName: string
): void => {
    try {
        let existed: FileExistenceResult | false = false;

        // Check if file existed in previous freezes:
        if (freezeSettings.keepOld) {
            existed = checkIfFileExisted(existing, stats, app);
        }
        
        // Create the md from file data:
        (app.vault as any).create(
            rootPath + "/" + path.basename(filePath) + ".md",
            parseFileContent(
                ["freeze:" + rootPath.split(path.sep)[1]], 
                filePath, 
                stats, 
                existed, 
                freezeSettings.keepOld, 
                freezeFolderName
            )
        );
    } catch (error) {
        console.error('Error processing file:', error);
        new Notice('Error processing file: ' + path.basename(filePath));
    }
};

/**
 * Check if a file existed in previous freezes
 * @param existingFreezes - Array of existing freeze data
 * @param stats - File system stats
 * @param app - Obsidian app instance
 * @returns File existence result or false
 */
function checkIfFileExisted(
    existingFreezes: ExistingFreeze[], 
    stats: FileStats, 
    app: App
): FileExistenceResult | false {
    try {
        for (let i = 0; i < existingFreezes.length; i++) {
            const fileList = utils.getFileList(
                (app.vault.adapter as any).basePath + "/" + existingFreezes[i].path + "/content", 
                ["md"]
            );
            
            for (let j = 0; j < fileList.length; j++) {
                const fileRead = matter.read(fileList[j]);
                if (fileRead.data["inode_number"] === (stats as any).ino && 
                    fileRead.data["device_id"] === (stats as any).dev) {
                    return { content: fileRead, freeze: existingFreezes[i] };
                }
            }
        }
    } catch (error) {
        console.error('Error checking file existence:', error);
    }
    
    return false;
}

/**
 * Parse file content for freeze creation
 * @param tags - Tags to add to the file
 * @param filePath - Path to the original file
 * @param stats - File system stats
 * @param existed - Whether file existed in previous freezes
 * @param keepOld - Whether to keep old content
 * @param freezeFolderName - Name of the freeze folder
 * @returns Formatted markdown content
 */
function parseFileContent(
    tags: string[],
    filePath: string,
    stats: FileStats,
    existed: FileExistenceResult | false,
    keepOld: boolean,
    freezeFolderName: string
): string {
    const data = {
        "tags": tags,
        "path": filePath,
        "file_name": path.basename(filePath),
        "size": (stats as any).size,
        "last_modified": (stats as any).mtime,
        "last_accessed": (stats as any).atime,
        "created": (stats as any).birthtime,
        "inode_number": (stats as any).ino,
        "device_id": (stats as any).dev,
        "extension": path.extname(filePath).slice(1),
        "freeze_history": [] as string[]
    };

    // Process getting data from existing files:
    if (keepOld) {
        if (existed === false) {
            data["freeze_history"] = [freezeFolderName.replace("freezes/", "")];
        } else {
            data["freeze_history"] = existed.content.data["freeze_history"];
            data["freeze_history"].push(freezeFolderName.replace("freezes/", ""));

            // Add other keys that may have existed:
            for (const key in existed.content.data) {
                if (!Object.keys(data).includes(key)) {
                    (data as any)[key] = existed.content.data[key];
                }
            }
        }
    } else {
        data["freeze_history"] = [freezeFolderName.replace("freezes/", "")];
    }

    let mdContent = "";
    if (keepOld && existed !== false) {
        mdContent = existed.content.content;
    }

    // Return the content as a string:
    return matter.stringify(mdContent.trim(), data);
}

/**
 * Create metadata content for the freeze
 * @param settings - Project settings
 * @param freezeSettings - Freeze configuration
 * @returns Formatted metadata content
 */
function createMetadataContent(settings: OntoTrackerSettings, freezeSettings: FreezeSettings): string {
    const data = {
        "Project title": settings.projectTitle,
        "Project source folder": settings.sourceFolder,
        "Ontology file": settings.ontoFile,
        "Freeze name": freezeSettings.freezeName,
        "Freeze date": freezeSettings.freezeDate,
        "Detect existing files": freezeSettings.keepOld,
        "Ignore files": freezeSettings.forbidden
    };
    
    return matter.stringify("This file contains information about the freeze.", data);
}