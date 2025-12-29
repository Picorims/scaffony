/*
Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import { path } from "@tauri-apps/api";
import { appDataDir, join } from "@tauri-apps/api/path";
import {
    open,
    exists,
    mkdir,
    readDir,
    type DirEntry,
} from "@tauri-apps/plugin-fs";

const LIBRARY_PATH_FILE_NAME = "scaffony_current_library.txt";
const DATA_FILE_NAME = "scaffony_data.json";
/**
 * Sorted from worst to best.
 */
const PREFERRED_AUDIO_EXTENSIONS = [".aac", ".mp3", ".ogg", ".wav", ".flac"];

export interface LibraryEntry {
    name: string;
    artist: string;
    path: string;
}

export interface IConfig {
    version: 1;
    library: LibraryEntry[];
}

const DEFAULT_CONFIG: IConfig = {
    version: 1,
    library: [],
};

let config = $state<IConfig>(DEFAULT_CONFIG);

export function getConfig(): IConfig {
    return config;
}

async function getCacheFilePath(): Promise<string> {
    return await path.join(await appDataDir(), LIBRARY_PATH_FILE_NAME);
}

async function ensureAppDataDirExists(): Promise<void> {
    const appDataDirPath = await appDataDir();
    const dirExists = await exists(appDataDirPath);
    if (!dirExists) {
        await mkdir(appDataDirPath, { recursive: true });
    }
}

async function createLibraryPathCacheIfNotExists(
    pathStr: string
): Promise<void> {
    const fileExists = await exists(pathStr);
    if (!fileExists) {
        const file = await open(pathStr, {
            write: true,
            create: true,
        });
        // empty file
        await file.close();
    }
}

/**
 * Checks the cache file for a stored library path and returns it if valid. Otherwise returns null.
 * @returns
 */
async function getCurrentLibraryFromCache(): Promise<string | null> {
    const cacheFilePath = await getCacheFilePath();
    await ensureAppDataDirExists();
    await createLibraryPathCacheIfNotExists(cacheFilePath);
    const file = await open(cacheFilePath, {
        read: true,
    });

    const stat = await file.stat();
    const buf = new Uint8Array(stat.size);
    await file.read(buf);
    const textContents = new TextDecoder().decode(buf);
    await file.close();
    // If it is a valid path, return it, else return null
    if (textContents.length > 0 && (await path.isAbsolute(textContents))) {
        if (!(await exists(textContents))) {
            return null;
        }
        return textContents;
    } else {
        return null;
    }
}

/**
 * Writes the current library path to cache file.
 * @param libraryPath
 */
async function writeCurrentLibraryToCache(libraryPath: string): Promise<void> {
    const cacheFilePath = await getCacheFilePath();
    await ensureAppDataDirExists();
    await createLibraryPathCacheIfNotExists(cacheFilePath);
    const file = await open(cacheFilePath, {
        write: true,
        truncate: true,
    });
    const buf = new TextEncoder().encode(libraryPath);
    await file.write(buf);
    await file.close();
}

/**
 * Returns the currently set library path from cache. Otherwise returns null if not set.
 * @returns
 */
export function getLibraryPath(): Promise<string | null> {
    return getCurrentLibraryFromCache();
}

/**
 * Writes the provided library path to cache after validating it.
 * @param libraryPath
 * @returns
 */
export async function setLibraryPath(libraryPath: string): Promise<boolean> {
    if (!(await path.isAbsolute(libraryPath))) {
        console.error(`Provided library path is not absolute: ${libraryPath}`);
        return false;
    }
    if (!(await exists(libraryPath))) {
        console.error(`Provided library path does not exist: ${libraryPath}`);
        return false;
    }
    await writeCurrentLibraryToCache(libraryPath);
    console.info(`Library path set to: ${libraryPath}`);
    return true;
}

async function ensureDataFileExists(dataFilePath: string): Promise<void> {
    const fileExists = await exists(dataFilePath);
    if (!fileExists) {
        console.info(
            `Data file does not exist at ${dataFilePath}, creating default data file...`
        );
        const file = await open(dataFilePath, {
            write: true,
            create: true,
        });
        // write default config
        const data: IConfig = DEFAULT_CONFIG;
        const textContents = JSON.stringify(data, null, 4);
        const buf = new TextEncoder().encode(textContents);
        await file.write(buf);
        await file.close();
    }
}

/**
 * Called at initialization to load user data from disk.
 */
export async function readData(): Promise<boolean> {
    console.info("Reading user data from disk...");
    const libraryPath = await getCurrentLibraryFromCache();
    if (libraryPath === null) {
        console.warn("No valid library path found in cache, cannot read data.");
        return false;
    }

    const readPath = await path.join(libraryPath, DATA_FILE_NAME);
    console.info(`Reading user data from ${readPath}...`);
    await ensureDataFileExists(readPath);
    const file = await open(readPath, {
        read: true,
        create: false,
    });

    const stat = await file.stat();
    const buf = new Uint8Array(stat.size);
    await file.read(buf);
    const textContents = new TextDecoder().decode(buf);
    await file.close();
    if (textContents.length > 0) {
        const data: IConfig = JSON.parse(textContents);
        // TODO data validation with zod or typia or jsv
        config = addMissingFieldsToConfig(data);
    } else if (textContents.length === 0) {
        // empty, write current config
        await writeData();
    }

    return true;
}

/**
 * Not guaranteed to not mutate the input object.
 * @param data
 * @returns
 */
function addMissingFieldsToConfig(data: IConfig): IConfig {
    if (!data.library) {
        data.library = [];
    }
    return data;
}

export async function writeData(): Promise<boolean> {
    const libraryPath = await getCurrentLibraryFromCache();
    if (libraryPath === null) {
        console.error(
            "No valid library path found in cache, cannot write data."
        );
        return false;
    }

    const file = await open(await path.join(libraryPath, DATA_FILE_NAME), {
        write: true,
        create: true,
        truncate: true,
    });
    let data: IConfig = config;
    const textContents = JSON.stringify(data, null, 4);
    const buf = new TextEncoder().encode(textContents);
    await file.write(buf);
    await file.close();

    return true;
}

/**
 * Scans the current library path for media files and updates the user data accordingly.
 */
export async function scan() {
    const libraryPath = await getCurrentLibraryFromCache();
    if (libraryPath === null) {
        console.error("No valid library path found in cache, cannot scan.");
        return false;
    }

    console.info(`Scanning library path ${libraryPath} for new audio files...`);
    await scanDirectory(libraryPath);
    await writeData();
}

async function scanDirectory(pathStr: string) {
    console.info(`Scanning directory: ${pathStr}`);
    const entries = await readDir(pathStr);
    for (const entry of entries) {
        if (entry.isSymlink) {
            console.info(`Skipping symlink: ${entry.name}`);
            continue; // skip symlinks
        }
        const path = await join(pathStr, entry.name);
        if (isAudioFile(entry)) {
            const index = libraryIndex(path);
            if (index === -1) {
                console.info(
                    `Found new audio file: ${path}, adding to library...`
                );
                const newEntry: LibraryEntry = {
                    name: entry.name.slice(0, entry.name.lastIndexOf(".")),
                    artist: "Unknown Artist",
                    path: path,
                };
                config.library.push(newEntry);
            } else if (hasBetterQualityExtension(path, config.library[index])) {
                console.info(
                    `Found better quality audio file: ${path}, updating library entry...`
                );
                config.library[index].path = path;
            }
        } else if (entry.isDirectory) {
            await scanDirectory(path);
        }
    }
}

function isAudioFile(entry: DirEntry): boolean {
    const audioExtensions = [".mp3", ".wav", ".flac", ".aac", ".ogg", ".m4a"];
    if (!entry.isFile) {
        return false;
    }
    const extension = entry.name
        .slice(entry.name.lastIndexOf("."))
        .toLowerCase();
    return audioExtensions.includes(extension);
}

function libraryIndex(filePath: string): number {
    const pathWithoutExtension = filePath.slice(0, filePath.lastIndexOf("."));
    return config.library.findIndex(
        (entry) => entry.path.slice(0, entry.path.lastIndexOf(".")) === pathWithoutExtension
    );
}

function hasBetterQualityExtension(
    filePath: string,
    libraryEntry: LibraryEntry
): boolean {
    const fileExtension = filePath
        .slice(filePath.lastIndexOf("."))
        .toLowerCase();
    const existingEntryExtension = libraryEntry.path
        .slice(libraryEntry.path.lastIndexOf("."))
        .toLowerCase();
    const fileExtensionIndex =
        PREFERRED_AUDIO_EXTENSIONS.indexOf(fileExtension);
    const existingEntryExtensionIndex = PREFERRED_AUDIO_EXTENSIONS.indexOf(
        existingEntryExtension
    );
    return (
        fileExtensionIndex > -1 &&
        existingEntryExtensionIndex > -1 &&
        fileExtensionIndex > existingEntryExtensionIndex
    );
}
