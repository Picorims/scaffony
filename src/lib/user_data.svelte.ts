/*
Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import { path } from "@tauri-apps/api";
import { invoke } from "@tauri-apps/api/core";
import { open, BaseDirectory } from "@tauri-apps/plugin-fs";
import { writable } from "svelte/store";

export interface IConfig {
    libraries: string[];
}

const defaultConfig: IConfig = {
    libraries: [],
};

let config = $state<IConfig>(defaultConfig);

/**
 * Called at initialization to load user data from disk.
 */
export async function readData() {
    console.info("Reading user data from disk...");
    const workingDir = await invoke<string>("get_working_dir");
    const readPath = await path.join(workingDir, "user_data/config.json");
    console.info(`Reading user data from ${readPath}...`);
    const file = await open(readPath, {
        read: true,
        create: true,
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
        // first run, write default config
        writeData();
    }
}

export async function writeData() {
    const workingDir = await invoke<string>("get_working_dir");
    const file = await open(`${workingDir}/user_data/config.json`, {
        write: true,
        create: true,
        truncate: true,
    });
    let data: IConfig = config;
    const textContents = JSON.stringify(data, null, 4);
    const buf = new TextEncoder().encode(textContents);
    await file.write(buf);
    await file.close();
}