// Shared TypeScript interfaces and types for Onto Tracker plugin

import { App } from 'obsidian';

/**
 * Main plugin settings interface
 */
export interface OntoTrackerSettings {
	projectTitle: string;
	sourceFolder: string;
	ontoFile: string;
}

/**
 * Freeze creation settings
 */
export interface FreezeSettings {
	freezeName: string;
	freezeDate: string;
	keepOld: boolean;
	forbidden: string;
}

/**
 * Mapping creation settings
 */
export interface MapSettings {
	fileName: string;
}

/**
 * Map processing settings
 */
export interface MapProcessSettings {
	freezeName: string;
	mapName: string;
}

/**
 * Unpack ontology settings
 */
export interface UnpackSettings {
	folderName: string;
}

/**
 * MIME type item structure from assets
 */
export interface MimeTypeItem {
	fxm_Extension: string[];
	fxm_MimeType: string[];
	fxm_OpenNewWindow: string[];
	fxm_IconFileName: string[];
	fxm_FiletypeName: string[];
	fxm_ImagePlaceholder: string[];
	fxm_Modified: string[];
}

/**
 * Mapping data structure for file processing
 */
export interface MappingData {
	mimeMapping: { [key: string]: string | string[] };
	mimeTypes: { [key: string]: string[] };
	extensionMapping: { [key: string]: string[] };
}

/**
 * Ontology data structure
 */
export interface OntologyData {
	[key: string]: OntologyItem[];
}

/**
 * Individual ontology item structure
 */
export interface OntologyItem {
	[key: string]: string | string[] | number;
}

/**
 * File processing function type
 */
export type FileProcessFunction = (
	rootPath: string,
	filePath: string,
	stats: FileStats,
	app: App,
	existing: ExistingFreeze[],
	freezeSettings: FreezeSettings,
	folderName: string
) => void;

/**
 * Existing freeze data structure
 */
export interface ExistingFreeze {
	path: string;
	date: string;
}

/**
 * Options for dropdown selections
 */
export interface SelectOptions {
	[key: string]: string;
}

/**
 * File system stats interface
 */
export interface FileStats {
	isDirectory(): boolean;
	size: number;
	mtime: Date;
	ctime: Date;
	ino: number;
	dev: number;
	atime: Date;
	birthtime: Date;
}

/**
 * Vault adapter interface for type safety
 */
export interface VaultAdapter {
	exists(path: string): Promise<boolean>;
	list(path: string): Promise<{ files: string[]; folders: string[] }>;
	basePath: string;
}

/**
 * Parsed markdown file structure
 */
export interface ParsedMarkdownFile {
	data: { [key: string]: any };
	content: string;
}

/**
 * Get the file extension from a path and filename
 * @param pathStr - The full file path
 * @param file - The filename
 * @returns The file extension (without the dot)
 */
export const getExtension = (pathStr: string, file: string): string => {
    // Use simple string manipulation to avoid require in types file
    const lastDotIndex = pathStr.lastIndexOf('.');
    let ext = lastDotIndex > 0 ? pathStr.slice(lastDotIndex + 1) : '';
    
    if (!ext && file.startsWith('.')) {
        ext = file.slice(1); // Treat files like .DS_Store as having the extension 'DS_Store'
    }
    return ext;
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