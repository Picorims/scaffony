/*
Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import { app, path } from "@tauri-apps/api";
import { appDataDir, join } from "@tauri-apps/api/path";
import {
    open,
    exists,
    mkdir,
    readDir,
    type DirEntry,
    create,
    readTextFile,
} from "@tauri-apps/plugin-fs";
import { platform } from "@tauri-apps/plugin-os";
import { appState } from "./app_state.svelte";
import { convertFileSrc } from "@tauri-apps/api/core";
import { toHex } from "./string";
import { objSortedByKey } from "./object";
import { getRandomIcon } from "./lucide";

const LIBRARY_PATH_FILE_NAME = "scaffony_current_library.txt";
const DATA_FILE_NAME = "scaffony_data.json";
/**
 * Sorted from worst to best.
 */
const PREFERRED_AUDIO_EXTENSIONS = [".m4a", ".aac", ".mp3", ".ogg", ".wav", ".flac"];
const SCAN_DIR_PROGRESS_EXPONENT = 3;

/**
 * UUID: directory path
 */
let uuidCache: Record<string, string> = {}

export interface LibraryEntry {
    name: string;
    artist: string;
    /**
     * Path are relative to the library root. They are
     * normalized with a forward slash '/' as separator.
     * It should be transformed back on a per-platform basis
     * when used.
     * 
     * **Does NOT include the extension.**
     */
    path: string;
    /**
     * All available extensions for the track.
     */
    extensions: string[];
    /**
     * Path are relative to the library root. They are
     * normalized with a forward slash '/' as separator.
     * It should be transformed back on a per-platform basis
     * when used.
     */
    coverPath: string | null;
    /**
     * tag_name: true if assigned, false if not (explicitly).
     * absent for unset state / to be decided by user.
     */
    tags: Record<string, boolean>;
    uuid: string;
    /**
     * If all audio paths could not be resolved.
     */
    missing: boolean;
    /**
     * Virtual, non playable entry (.scfvirtual)
     */
    virtual: boolean;
    color?: string;
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

export interface CategoryEntry {
    name: string;
    /**
     * if true, only one tag of the category can be assigned at once.
     */
    exclusive: boolean;
    icon: string;
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
    categories: Record<string, CategoryEntry>;
    waitList: {
        /**
         * UUIDs
         */
        currentList: string[]
        position: number
    }
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
        {
            name: "No mood tag",
            colorHex: "#888888",
            lucideIcon: "smile-plus",
            filters: [
                {
                    type: "excludes_category",
                    category: "mood",
                },
            ],
        },
        {
            name: "No genre tag",
            colorHex: "#888888",
            lucideIcon: "shapes",
            filters: [
                {
                    type: "excludes_category",
                    category: "genre",
                },
            ],
        },
        {
            name: "No energy tag",
            colorHex: "#888888",
            lucideIcon: "gauge",
            filters: [
                {
                    type: "excludes_category",
                    category: "energy",
                },
            ],
        }
    ],
    categories: {
        "rate": {
            name: "rate",
            exclusive: true,
            icon: "",
        },
        "mood": {
            name: "mood",
            exclusive: false,
            icon: "",
        },
        "genre": {
            name: "genre",
            exclusive: false,
            icon: "",
        },
        "energy": {
            name: "energy",
            exclusive: false,
            icon: "",
        },
    },
    waitList: {
        currentList: [],
        position: 0
    }
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

export function getCategoryTags(category: string) {
    return config.tags.filter(t => getTagCategory(t.name) === category);
}

export function getTag(tagName: string): TagEntry | null {
    const tag = config.tags.find((tag) => tag.name === tagName);
    return tag || null; 
}

export function getTagCategory(tagName: string) {
    return tagName.split(":")[0];
}

/**
 * given a library entry, returns the list of "yes" tags,
 * with a " " space string to split categories.
 */
export function getActiveTagKeysWithCategorySeparators(entry: LibraryEntry) {
    return Object.keys(entry.tags).filter(t => entry.tags[t]).reduce<string[]>((acc: string[], v) => {
        if (acc.length > 0) {
            const prev = acc[acc.length - 1];
            if (prev !== " " && getTagCategory(prev) !== getTagCategory(v)) {

                // used for detecting spacing to insert between categories
                acc.push(" ");
            }
        }
        // Must be done after, otherwise the if compares the tag with itself.
        // Which is... uh... useless.
        acc.push(v);
        return acc;
    }, [])
}

export function getTagCompletionRatio(tagName: string, excludeFilter?: string): number {
    let filteredList = config.library;
    if (excludeFilter !== undefined) {
        filteredList = config.library.filter(track => Object.keys(track.tags).find(t => t.startsWith(excludeFilter)) !== undefined);
    }
    let total = filteredList.length;
    let count = 0;
    for (const track of filteredList) {
        if (track.tags[tagName] !== undefined) {
            count += 1;
        }
    }
    return count / total;
}

export function getPlaylist(playlistName: string): PlaylistEntry | null {
    const playlist = config.playlists.find(
        (playlist) => playlist.name === playlistName
    );
    return playlist || null;
}

export function getTagLibraryEntries(tagName: string): LibraryEntry[] {
    return config.library.filter((entry => entry.tags[tagName] === true));
}

export function getPlaylistLibraryEntries(playlistName: string): LibraryEntry[] {
    const playlist = getPlaylist(playlistName);
    if (!playlist) {
        console.warn(`Playlist '${playlistName}' not found, returning empty list of library entries.`);
        return [];
    }
    let result = [...config.library];
    for (const filter of playlist.filters) {
        switch (filter.type) {
            case "includes_category": {
                result = result.filter((entry) => hasTagWithCategory(entry, filter.category));
                break;
            }
            case "excludes_category": {
                result = result.filter((entry) => !hasTagWithCategory(entry, filter.category));
                break;
            }
            case "includes_tag": {
                result = result.filter((entry) => hasTag(entry, filter.tag));
                break;
            }
            case "excludes_tag": {
                result = result.filter((entry) => !hasTag(entry, filter.tag));
                break;
            }
        }
    }
    return result;
}

function hasTagWithCategory(entry: LibraryEntry, category: string): boolean {
    for (const tagName in entry.tags) {
        if (tagName.startsWith(category + ":") && entry.tags[tagName] === true) {
            return true;
        }
    }
    return false;
}
function hasTag(entry: LibraryEntry, tagName: string): boolean {
    return entry.tags[tagName] === true;
}

export function setTagState(entry: LibraryEntry, tagName: string, state: "yes" | "no" | "unknown"): void {
    const srcEntry = config.library.find((e) => e.path === entry.path);
    if (!srcEntry) {
        throw new Error(`Library entry with path ${entry.path} not found.`);
    }
    if (state === "unknown") {
        console.log(`Removing tag ${tagName} from ${entry.name}`);
        delete srcEntry.tags[tagName];
    } else {
        console.log(`Setting tag ${tagName} of ${entry.name} to: ${state === "yes"}`);
        srcEntry.tags[tagName] = state === "yes";
    }

    const category = getTagCategory(tagName);
    if (state === "yes" && isCategoryExclusive(category)) {
        // set all others to "no"
        const categoryTags = getCategoryTags(category);
        for (const tag of categoryTags) {
            if (tag.name !== tagName) {
                console.log(`Exclusive mode: setting tag ${tagName} of ${entry.name} to: false`);
                srcEntry.tags[tag.name] = false;
            }
        }
    }
    sortTagsOnLibraryEntries();
    writeData();
}

export function setDataWaitList(waitList: IConfig["waitList"]) {
    config.waitList = waitList;
    commit();
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
            appState.libraryPath = null;
            return null;
        }
        appState.libraryPath = textContents;
        return textContents;
    } else {
        appState.libraryPath = null;
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
    if (platform() !== "android" && !(await path.isAbsolute(libraryPath))) {
        console.error(`Provided library path is not absolute: ${libraryPath}`);
        return false;
    }
    if (!(await exists(libraryPath))) {
        console.error(`Provided library path does not exist: ${libraryPath}`);
        return false;
    }
    await writeCurrentLibraryToCache(libraryPath);
    appState.libraryPath = libraryPath;
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
    try {
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
    } catch (error) {
        console.error(`Error reading user data from ${readPath}:`, error);
        // if (platform() === "android") {
        alert("Error reading user data. Make sure Scaffony has the necessary file permissions (MANAGE_EXTERNAL_STORAGE).");
        // }
        return false;
    }
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
    for (const e of data.library) {
        if (e.extensions === undefined) {
            e.extensions = [];
        }
    }
    if (!data.tags) {
        data.tags = [];
    }
    if (!data.playlists) {
        data.playlists = [];
    }
    if (!data.categories) {
        data.categories = {};
    }
    if (!data.waitList) {
        data.waitList = {
            currentList: [],
            position: 0
        }
    }
    for (const category of Object.keys(data.categories)) {
        if (data.categories[category].icon === undefined) {
            data.categories[category].icon = getRandomIcon();
        }
    }
    return data;
}

export function commit() {
    sortTags();
    writeData();
}

function sortTags() {
    config.tags.sort((a, b) => a.name.localeCompare(b.name));
    sortTagsOnLibraryEntries();
}

function sortTagsOnLibraryEntries() {
    for (const entry of config.library) {
        entry.tags = objSortedByKey<typeof entry.tags>(entry.tags);
    }
}


export function addTag(newTag: TagEntry) {
    config.tags.push(newTag);
    if (!newTag.name.includes(":")) {
        throw new Error("Missing colon ':' in tag name.");
    }
    const category = newTag.name.split(":")[0];
    if (!hasCategory(category)) {
        addCategory(category);
    }
    commit();
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
    commit();
}

export function deleteTag(tagName: string) {
    config.tags = config.tags.filter((tag) => tag.name !== tagName);
    for (const entry of config.library) {
        if (tagName in entry.tags) {
            delete entry.tags[tagName];
        }
    }
    commit();
}

export function addCategory(category: string) {
    config.categories[category] = {
        name: category,
        exclusive: false,
        icon: "",
    };
    commit();
}

export function hasCategory(category: string) {
    return config.categories[category] !== undefined;
}

export function editCategory(category: string, exclusive: boolean) {
    if (!hasCategory(category)) {
        throw new Error("Trying to edit non-existent category.");
    }
    config.categories[category].exclusive = exclusive;
    console.log(`Category ${category} is now exclusive: ${exclusive}`);
    commit();
}

export function editCategoryIcon(category: string, icon: string) {
    if (!hasCategory(category)) {
        throw new Error("Trying to edit non-existent category.");
    }
    config.categories[category].icon = icon;
    console.log(`Category ${category} icon is now: ${icon}`);
    commit();
}

export function getCategoryByName(category: string) {
    if (!hasCategory(category)) {
        throw new Error("Trying to query non-existent category.");
    }
    return config.categories[category];
}

export function getCategoryIcon(category: string) {
    if (!hasCategory(category)) {
        throw new Error("Trying to query non-existent category.");
    }
    return config.categories[category].icon;
}

export function isCategoryExclusive(category: string) {
    if (!hasCategory(category)) {
        throw new Error("Trying to query non-existent category.");
    }
    return config.categories[category].exclusive;
} 

export function addPlaylist(newPlaylist: PlaylistEntry) {
    config.playlists.push(newPlaylist);
    commit();
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
    commit();
}

export function deletePlaylist(playlistName: string) {
    config.playlists = config.playlists.filter(
        (playlist) => playlist.name !== playlistName
    );
    commit();
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
    uuidCache = {};
    appState.progressComment = "Scanning directory...";
    appState.progressPercent = 0;
    await scanDirectory(libraryPath);
    appState.progressPercent = 100;
    console.log(uuidCache);
    appState.progressComment = "Fixing paths...";
    appState.progressPercent = 0;
    await fixPaths(libraryPath);
    appState.progressPercent = 100;
    await writeData();
}

function scanDirPercent(ratio: number, from: number, to: number) {
    const r = ratio;
    // const adjustedRatio = (((1.5*r - 0.75) ** 3 + 0.01*(r**2) + 0.001*r + 0.5) ** SCAN_DIR_PROGRESS_EXPONENT) * 1.25;
    const adjustedRatio = r;
    return adjustedRatio * (to - from) + from;
}

/**
 * Also returns if empty.
 * @param pathStr Directory to scan.
 * @param relativePath Relative path built from recursive scan (for self call only)
 * @param percentFrom progress framing start (for self call only)
 * @param percentTo progress framing end (for self call only)
 */
async function scanDirectory(pathStr: string, relativePath = "", percentFrom = 0, percentTo = 100): Promise<boolean> {
    // console.info(`Scanning directory: ${pathStr} (${relativePath})`);
    console.info(`Scanning directory: ${relativePath}`);
    const entries = await readDir(pathStr);
    const cover = findCoverInDirectory(entries);
    if (cover !== null) {
        console.info("Found cover: " + cover);
    }
    let pos = 0;
    let total = entries.filter(e => !e.name.startsWith(".")).length;
    if (total === 0) {
        return true;
    }
    for (const entry of entries) {
        appState.progressPercent = scanDirPercent(pos / total, percentFrom, percentTo);
        if (entry.isSymlink) {
            console.info(`Skipping symlink: ${entry.name}`);
            continue; // skip symlinks
        }
        const entryFullPath = await join(pathStr, entry.name);
        const entryRelativePath = (await join(relativePath, entry.name)).replaceAll("\\", "/");
        if (isAudioFile(entry)) {
            const index = libraryIndex(entryRelativePath);

            if (index === -1) {
                // It doesn't exist yet, or the path changed.
                const hasUUIDfile = await exists(pathToMarkerPath(entryFullPath)); 
                let uuid: string | null = null;
                let uuidExistsInLib = false;
                if (hasUUIDfile) {
                    uuid = await readTextFile(pathToMarkerPath(entryFullPath));
                    uuidExistsInLib = config.library.findIndex(e => e.uuid === uuid) !== -1;
                }
                if (hasUUIDfile && uuid !== null && uuidExistsInLib) {
                    // path changed, cache it for fixing.
                    console.info(
                        `Found audio file: ${entryRelativePath.slice(entryRelativePath.lastIndexOf("/"))}, but it has a marker of the same name, so skipping...`
                    );
                    uuidCache[uuid] = relativePath + "/" + entry.name;
                    // TODO more checks ? read file, get entry by uuid, check path is the same? costly.
                } else {
                    // actually a new entry.
                    console.info(
                        `Found new audio file: ${entryRelativePath}, adding to library...`
                    );
                    if (cover) {
                        console.info(`Found cover image in directory: ${cover}`);
                    }
                    const newEntry: LibraryEntry = {
                        name: withoutAudioExtension(entry.name),
                        artist: "Unknown Artist",
                        path: withoutAudioExtension(entryRelativePath),
                        extensions: [entryRelativePath.slice(entryRelativePath.lastIndexOf("."))],
                        coverPath: cover ? (await join(relativePath, cover)).replaceAll("\\", "/") : null,
                        tags: {},
                        uuid: uuid ?? self.crypto.randomUUID(),
                        missing: false,
                        virtual: false
                    };
                    config.library.push(newEntry);
                    const existingEntryPath = newEntry.path;
                    const markerName = pathToMarkerName(existingEntryPath);
                    const uuidMarkerPath = await join(pathStr, markerName);
                    if (!await exists(uuidMarkerPath)) {
                        console.info(`Creating UUID marker: ${markerName}`);
                        createUUIDFile(uuidMarkerPath, newEntry.uuid);
                        uuidCache[newEntry.uuid] = relativePath + "/" + entry.name;
                    }
                }

            } else if (missingExtension(entryFullPath, config.library[index])) {
                // entry exists, but a new format was found.
                console.info(
                    `Found different quality audio file: ${entryRelativePath}, updating library entry...`
                );
                config.library[index].extensions.push(entryFullPath.slice(entryFullPath.lastIndexOf(".")));

            } else if (await currentLibraryAudioFileMissing(config.library[index])) {
                // entry exists but it is marked as missing file, which we just found, so we fix it.
                console.info(
                    `Found replacement ${entryRelativePath} to missing audio file ${config.library[index].path}, updating library entry...`
                );
                config.library[index].path = withoutAudioExtension(entryRelativePath);

            }
            // console.log(index, cover, config.library[index]?.coverPath ?? "? failed");
            if (index !== -1 && cover && config.library[index].coverPath === null) {
                // the entry exists but doesn't have a specified cover, which we found at the top of the function.
                console.info(`Found cover for entry ${config.library[index].name}, updating library entry...`);
                config.library[index].coverPath = (await join(relativePath, cover)).replaceAll("\\", "/");
            }
        } else if (isUUIDFile(entry)) {
            const uuid = await readTextFile(entryFullPath);
            uuidCache[uuid] = relativePath + "/" + entry.name;
        } else if (entry.isDirectory) {
            if (entry.name.startsWith(".")) {
                console.info("Skipping hidden directory " + entry.name);
            } else {
                try {
                    const from = scanDirPercent(pos / total, percentFrom, percentTo);
                    const to = scanDirPercent((pos + 1) / total, percentFrom, percentTo);
                    const empty = await scanDirectory(entryFullPath, (await join(relativePath, entry.name)).replaceAll("\\", "/"), from, to);
                    if (empty) {
                        pos -= 1;
                        total -= 1;
                    }
                } catch (error) {
                    console.error(`Error scanning directory ${entryRelativePath}:`, error);
                }
            }
        }
        if (!entry.name.startsWith(".")) {
            pos += 1;
        }
    }
    return false;
}

/**
 * Returns the first found image with 'cover' in its name from the provided directory entries.
 * @param entries
 */
function findCoverInDirectory(entries: DirEntry[]): string | null {
    for (const entry of entries) {
        if (entry.isFile && isImageFile(entry)) {
            const nameHasCover = (
                entry.name.toLowerCase().includes("cover")
                || entry.name.toLowerCase().includes("folder")
            );
            if (nameHasCover) {
                return entry.name;
            }
        }
    }
    return null;
}

function withoutAudioExtension(str: string) {
    let mutedStr = str;
    for (const ext of PREFERRED_AUDIO_EXTENSIONS) {
        const regex = new RegExp(String.raw`${ext}$`, "g");
        mutedStr = mutedStr.replace(regex, "");
    }
    return mutedStr;
}

function isFileWithExtension(entry: DirEntry, extensions: string[]) {
    if (!entry.isFile) {
        return false;
    }
    const extension = entry.name
        .slice(entry.name.lastIndexOf("."))
        .toLowerCase();
    return extensions.includes(extension);
}

function isAudioFile(entry: DirEntry): boolean {
    return isFileWithExtension(entry, PREFERRED_AUDIO_EXTENSIONS);
}

function isUUIDFile(entry: DirEntry): boolean {
    return isFileWithExtension(entry, [".scfuuid"]); 
}

function isImageFile(entry: DirEntry): boolean {
    return isFileWithExtension(entry, [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"]);
}

/**
 * Converts 'foo/bar/baz.mp3' to 'baz.scfuuid'.
 * @param path 
 * @returns 
 */
function pathToMarkerName(path: string) {
    return withoutAudioExtension(path.slice(path.lastIndexOf("/") + 1)) + ".scfuuid";
}
/**
 * Converts 'foo/bar/baz.mp3' to 'foo/bar/baz.scfuuid'.
 * @param path 
 * @returns 
 */
function pathToMarkerPath(path: string) {
    return withoutAudioExtension(path) + ".scfuuid";
}

async function createUUIDFile(path: string, uuid: string) {
    if (!path.endsWith(".scfuuid")) {
        throw new Error("Cannot create marker file. Path is not a .scfuuid path.");
    }
    const uuidMarker = await create(path);
    const encoder = new TextEncoder();
    const data = encoder.encode(uuid);
    await uuidMarker.write(data);
    await uuidMarker.close();
}

function libraryIndex(filePath: string): number {
    const pathWithoutExtension = filePath.slice(0, filePath.lastIndexOf("."));
    return config.library.findIndex(
        (entry) => entry.path === pathWithoutExtension
    );
}

function missingExtension(
    filePath: string,
    libraryEntry: LibraryEntry
): boolean {
    const fileExtension = filePath
        .slice(filePath.lastIndexOf("."))
        .toLowerCase();
    return !libraryEntry.extensions.includes(fileExtension);
}

export async function getEntryAudioPathWithBestExtension(e: LibraryEntry): Promise<string> {
    if (appState.libraryPath === null) {
        return "";
    }
    // best extension first
    const sortedExtensions: string[] = [...e.extensions].sort((a, b) => PREFERRED_AUDIO_EXTENSIONS.indexOf(b) - PREFERRED_AUDIO_EXTENSIONS.indexOf(a));
    let i = 0;
    while (i < sortedExtensions.length) {
        const path = await join(appState.libraryPath, e.path + sortedExtensions[i]);
        if (await exists(path)) {
            return path;
        }
        i++;
    }

    // none of the path + extension combinations exist, return nothing.
    return "";
}

async function currentLibraryAudioFileMissing(libraryEntry: LibraryEntry) {
    if (appState.libraryPath === null) {
        throw new Error("Cannot check for audio file existing. Library not loaded!");
    }
    const existsArray: Promise<boolean>[] = [];
    for (const extension of libraryEntry.extensions) {
        const path = await join(appState.libraryPath, libraryEntry.path + extension);
        existsArray.push(exists(path));
    }
    const awaited = await Promise.all(existsArray);
    return !awaited.includes(true);
} 

async function fixPaths(libraryPath: string) {
    if (appState.libraryPath === null) {
        throw new Error("Cannot fix paths, no library loaded!");
    }
    let pos = 0;
    for (const e of config.library) {
        appState.progressPercent = pos / config.library.length * 100;
        const uuidPath = uuidCache[e.uuid];
        if (uuidPath === undefined) {
            if (!await currentLibraryAudioFileMissing(e)) {
                // Only the uuid file is missing, the audio itself still exists.
                // So we recreate it.
                createUUIDFile(await join(libraryPath, pathToMarkerPath(e.path)), e.uuid);
                console.info(`${e.name}'s marker uuid ${e.uuid} missing, but ${e.path} exists. Recreating it.`);
                e.missing = false;
            } else {
                console.info(`${e.name}'s marker uuid ${e.uuid} missing! Looking for ${e.path}`);
                e.missing = true;
            }
        } else {
            const currentRelPath = e.path;
            const currentRelDir = currentRelPath.slice(0, currentRelPath.lastIndexOf("/"));
            const newPath = withoutAudioExtension(uuidPath.replace(".scfuuid", ""));
            //FIXME possible that it doesn't support different files with same name.
            if (currentRelDir !== uuidPath && newPath !== e.path) {
                // file has moved
                console.info(`${e.name} with uuid ${e.uuid} has moved. Updating paths.`);
                console.info(`was ${e.path}, now is ${newPath}`);
                e.path = newPath;
                if (e.coverPath !== null) {
                    e.coverPath = null; // next scan will fix it.
                }
            }

            if (await currentLibraryAudioFileMissing(e)) {
                console.info(`${e.name} audio file is missing!`);
                e.missing = true;
            } else {
                e.missing = false;
            }
            if (e.coverPath !== null) {
                const newFullCoverPath = await join(libraryPath, e.coverPath);
                if (!await exists(newFullCoverPath)) {
                    console.info(`cover path for ${e.name} is missing: ${e.coverPath}, deleting path.`);
                    e.coverPath = null;
                }
            }
        }
        pos++;
    }
}

export async function getCoverColors(force = false) {
    if (appState.libraryPath === null) {
        return;
    }

    console.log("Retrieving cover dominant colors... force all: " + force);

    const PROCESSING_RES = 64;
    const PROCESSING_ZOOM = 1.1;
    const canvas = new OffscreenCanvas(PROCESSING_RES, PROCESSING_RES);
    const ctx = canvas.getContext("2d", {
        willReadFrequently: true
    });
    
    appState.progressPercent = 0;
    appState.progressComment = "Retrieving cover dominant colors...";
    for (let i = 0; i < config.library.length; i++) {
        appState.progressPercent = i / config.library.length * 100;
        const entry = config.library[i];
        if (entry.coverPath === null) {
            entry.color = undefined;
        } else if (entry.color === undefined || force) {
            const coverPath = await join(appState.libraryPath, entry.coverPath);
            if (await exists(coverPath)) {
                // load image
                const img = document.createElement("img");
                img.src = convertFileSrc(coverPath);
                img.crossOrigin = "anonymous";
                await img.decode();
                
                // get color
                const size = PROCESSING_RES * PROCESSING_ZOOM;
                const pos = (PROCESSING_RES - size) / 2;
                ctx?.drawImage(img, pos, pos, size, size);
                const pxData = ctx?.getImageData(0, 0, PROCESSING_RES, PROCESSING_RES, {colorSpace: "srgb", pixelFormat: "rgba-unorm8"});
                const frequencies: Record<number, Record<number, Record<number, number>>> = {};
                const keys: Array<[number, number, number]> = [];
                for (let j = 0; j < PROCESSING_RES * PROCESSING_RES; j += 4) {
                    const r = pxData?.data[j] ?? 0;
                    const g = pxData?.data[j + 1] ?? 0;
                    const b = pxData?.data[j + 2] ?? 0;

                    if (frequencies[r] === undefined) {
                        frequencies[r] = {}
                    }
                    if (frequencies[r][g] === undefined) {
                        frequencies[r][g] = {}
                    }
                    if (frequencies[r][g][b] === undefined) {
                        frequencies[r][g][b] = 0
                    }
                    frequencies[r][g][b] += 1;
                    keys.push([r, g, b]);
                }

                let mostFrequentColor: [number, number, number] = [0, 0, 0];
                let mostFrequentColorFreq = -Infinity;
                const weight = (r: number, g: number, b: number) => {
                    // Give less favor to black/white to try keeping some hue if there is some.
                    // But do not penalize the brighter colors too much.
                    const x = (r + g + b) / 3 / 255;
                    // return (-4 * x * x ) + 4 * x;
                    // return (-3 * x * x ) + 3.5 * x;
                    // return (-3 * x * x ) + 4 * x;
                    // return (-8 * x ** 3 + 10 * x ** 2 - 0.1 * x) / 2;
                    return (-6 * x ** 3 + 6.3 * x ** 2);
                }
                for (const [r, g, b] of keys) {
                    let freq = frequencies[r][g][b];
                    freq *= weight(r, g, b);
                    
                    if (freq > mostFrequentColorFreq) {
                        mostFrequentColor = [r, g, b];
                        mostFrequentColorFreq = freq;
                    }
                }

                entry.color = toHex(mostFrequentColor);
            }
        }
    }
    await writeData();
    appState.progressPercent = 100;
}

export async function removeAllCoverColors() {
    if (appState.libraryPath === null) {
        return;
    }

    console.log("Removing all cover colors...");

    appState.progressPercent = 0;
    appState.progressComment = "Removing cover dominant colors...";
    for (let i = 0; i < config.library.length; i++) {
        appState.progressPercent = i / config.library.length * 100;
        const entry = config.library[i];
        entry.color = undefined;
    }

    await writeData();
    appState.progressPercent = 100;
}