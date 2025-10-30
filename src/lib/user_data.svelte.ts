/*
Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import { path } from "@tauri-apps/api";
import { invoke } from "@tauri-apps/api/core";
import { cacheDir } from "@tauri-apps/api/path";
import { open, BaseDirectory, exists } from "@tauri-apps/plugin-fs";
import { writable } from "svelte/store";

const LIBRARY_PATH_FILE_NAME = "scaffony_current_library.txt";
const DATA_FILE_NAME = "scaffony_data.json";

export interface IConfig {
    version: 1;
}

const DEFAULT_CONFIG: IConfig = {
    version: 1,
};

let config = $state<IConfig>(DEFAULT_CONFIG);

async function createLibraryPathCacheIfNotExists(pathStr: string): Promise<void> {
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
    const cacheFilePath = await path.join(await cacheDir(), LIBRARY_PATH_FILE_NAME);
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
    if (textContents.length > 0 && await path.isAbsolute(textContents)) {
        if (!await exists(textContents)) {
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
    const cacheFilePath = await path.join(await cacheDir(), LIBRARY_PATH_FILE_NAME);
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
    if (!await path.isAbsolute(libraryPath)) {
        console.error(`Provided library path is not absolute: ${libraryPath}`);
        return false;
    }
    if (!await exists(libraryPath)) {
        console.error(`Provided library path does not exist: ${libraryPath}`);
        return false;
    }
    await writeCurrentLibraryToCache(libraryPath);
    console.info(`Library path set to: ${libraryPath}`);
    return true;
}

async function ensureDataFileExists(libraryPath: string): Promise<void> {
    const dataFilePath = await path.join(libraryPath, DATA_FILE_NAME);
    const fileExists = await exists(dataFilePath);
    if (!fileExists) {
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
    await ensureDataFileExists(libraryPath);
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
        config = data;
    } else if (textContents.length === 0) {
        // empty, write current config
        await writeData();
    }

    return true;
}

export async function writeData(): Promise<boolean> {
    const libraryPath = await getCurrentLibraryFromCache();
    if (libraryPath === null) {
        console.error("No valid library path found in cache, cannot write data.");
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