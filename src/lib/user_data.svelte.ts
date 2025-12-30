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
    coverPath: string | null;
    /**
     * tag_name: true if assigned, false if not (explicitly).
     * absent for unset state / to be decided by user.
     */
    tags: Record<string, boolean>;
}

/**
 * warning: used with the spread operator, avoid nested objects.
 *
 * global search ISSUE_TAG_SPREAD_OPERATOR
 */
export interface TagEntry {
    /**
     * colon separates the category from the value, e.g. "mood:happy"
     */
    name: string;
    colorHex: string;
    lucideIcon: string;
}

/**
 * A playlist is defined by a set of filters.
 * 
 * global search ISSUE_PLAYLIST_SPREAD_OPERATOR
 */
export interface PlaylistEntry {
    name: string;
    colorHex: string;
    lucideIcon: string;
    filters: Filter[];
}

export interface FilterIncludesCategory {
    type: "includes_category";
    category: string;
}
export interface FilterExcludesCategory {
    type: "excludes_category";
    category: string;
}
export interface FilterIncludesTag {
    type: "includes_tag";
    tag: string;
}
export interface FilterExcludesTag {
    type: "excludes_tag";
    tag: string;
}
export type Filter =
    | FilterIncludesCategory
    | FilterIncludesTag
    | FilterExcludesCategory
    | FilterExcludesTag;

export interface IConfig {
    version: 1;
    library: LibraryEntry[];
    tags: TagEntry[];
    playlists: PlaylistEntry[];
}

const DEFAULT_CONFIG: IConfig = {
    version: 1,
    library: [],
    tags: [
        { name: "rate:5", colorHex: "#FFD700", lucideIcon: "star" },
        { name: "rate:4", colorHex: "#C0C0C0", lucideIcon: "star" },
        { name: "rate:3", colorHex: "#CD7F32", lucideIcon: "star" },
        { name: "mood:happy", colorHex: "#69ff8a", lucideIcon: "smile" },
        { name: "mood:sad", colorHex: "#4b87f7", lucideIcon: "frown" },
        { name: "mood:chill", colorHex: "#ffbe69", lucideIcon: "coffee" },
        { name: "mood:angry", colorHex: "#ff4c4c", lucideIcon: "angry" },
        { name: "genre:pop_rock", colorHex: "#ff69b4", lucideIcon: "guitar" },
        { name: "genre:classical", colorHex: "#dbdbdbff", lucideIcon: "piano" },
        { name: "genre:orchestral", colorHex: "#ff9969", lucideIcon: "drum" },
        {
            name: "genre:electronic",
            colorHex: "#69d1ff",
            lucideIcon: "keyboard-music",
        },
        { name: "genre:lofi", colorHex: "#a369ff", lucideIcon: "library-big" },
        { name: "energy:dynamic", colorHex: "#ff6969", lucideIcon: "zap" },
        {
            name: "energy:chill_dynamic",
            colorHex: "#ffda69",
            lucideIcon: "activity",
        },
        { name: "energy:calm", colorHex: "#69ffec", lucideIcon: "haze" },
    ],
    playlists: [
        {
            name: "Not rated",
            colorHex: "#888888",
            lucideIcon: "circle-question-mark",
            filters: [
                {
                    type: "excludes_category",
                    category: "rate",
                },
            ],
        },
        {
            name: "Good stuff",
            colorHex: "#69ff87",
            lucideIcon: "thumbs-up",
            filters: [
                {
                    type: "includes_tag",
                    tag: "rate:5",
                },
                {
                    type: "includes_tag",
                    tag: "rate:4",
                },
            ],
        },
    ],
};

let config = $state<IConfig>(DEFAULT_CONFIG);

export function getConfig(): IConfig {
    return config;
}

export function getTagCategories(): string[] {
    const categories = new Set<string>();
    for (const tag of config.tags) {
        const parts = tag.name.split(":");
        if (parts.length === 2) {
            categories.add(parts[0]);
        }
    }
    return Array.from(categories);
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
        sortTags();
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
    if (!data.tags) {
        data.tags = [];
    }
    if (!data.playlists) {
        data.playlists = [];
    }
    return data;
}

export function commit() {
    sortTags();
    writeData();
}

function sortTags() {
    config.tags.sort((a, b) => a.name.localeCompare(b.name));
}

export function addTag(newTag: TagEntry) {
    config.tags.push(newTag);
    sortTags();
    writeData();
}

export function editTag(oldTagName: string, newTag: TagEntry) {
    const tagIndex = config.tags.findIndex((tag) => tag.name === oldTagName);
    if (tagIndex === -1) {
        throw new Error(`Tag with name ${oldTagName} not found.`);
    }
    config.tags[tagIndex] = newTag;
    for (const entry of config.library) {
        if (oldTagName in entry.tags) {
            const value = entry.tags[oldTagName];
            delete entry.tags[oldTagName];
            entry.tags[newTag.name] = value;
        }
    }
    sortTags();
    writeData();
}

export function deleteTag(tagName: string) {
    config.tags = config.tags.filter((tag) => tag.name !== tagName);
    for (const entry of config.library) {
        if (tagName in entry.tags) {
            delete entry.tags[tagName];
        }
    }
    writeData();
}

export function addPlaylist(newPlaylist: PlaylistEntry) {
    config.playlists.push(newPlaylist);
    writeData();
}

export function editPlaylist(
    oldPlaylistName: string,
    newPlaylist: PlaylistEntry
) {
    const playlistIndex = config.playlists.findIndex(
        (playlist) => playlist.name === oldPlaylistName
    );
    if (playlistIndex === -1) {
        throw new Error(`Playlist with name ${oldPlaylistName} not found.`);
    }
    config.playlists[playlistIndex] = newPlaylist;
    writeData();
}

export function deletePlaylist(playlistName: string) {
    config.playlists = config.playlists.filter(
        (playlist) => playlist.name !== playlistName
    );
    writeData();
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
    const cover = findCoverInDirectory(entries);
    if (cover) {
        console.info(`Found cover image in directory: ${cover}`);
    }
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
                    coverPath: cover ? await join(pathStr, cover) : null,
                    tags: {},
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

/**
 * Returns the first found image with 'cover' in its name from the provided directory entries.
 * @param entries
 */
function findCoverInDirectory(entries: DirEntry[]): string | null {
    for (const entry of entries) {
        if (entry.isFile && isImageFile(entry)) {
            const nameHasCover = entry.name.toLowerCase().includes("cover");
            if (nameHasCover) {
                return entry.name;
            }
        }
    }
    return null;
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

function isImageFile(entry: DirEntry): boolean {
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"];
    if (!entry.isFile) {
        return false;
    }
    const extension = entry.name
        .slice(entry.name.lastIndexOf("."))
        .toLowerCase();
    return imageExtensions.includes(extension);
}

function libraryIndex(filePath: string): number {
    const pathWithoutExtension = filePath.slice(0, filePath.lastIndexOf("."));
    return config.library.findIndex(
        (entry) =>
            entry.path.slice(0, entry.path.lastIndexOf(".")) ===
            pathWithoutExtension
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
