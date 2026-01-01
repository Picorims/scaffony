<script lang="ts">
    /*
    Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.
    
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at https://mozilla.org/MPL/2.0/.
    */

    import { getConfig, getLibraryPath, readData, scan, setLibraryPath } from "$lib/user_data.svelte";
    import { onMount } from "svelte";
    import Button from "../atoms/Button.svelte";
    import { message, open } from "@tauri-apps/plugin-dialog";
    import TrackList from "../molecules/track_list/TrackList.svelte";
    import { AndroidFs } from 'tauri-plugin-android-fs-api'
    import { platform } from "@tauri-apps/plugin-os";

    let currentLibrary = $state<string>("No library selected");

    onMount(async () => {
        const lib = await getLibraryPath();
        if (lib) {
            currentLibrary = lib;
        }
    })

    async function pickPath() {
        let path: string | null = null;
        if (platform() === "android") {
            let uri = await AndroidFs.showOpenDirPicker();
            if (uri === null) {
                return;
            }
            AndroidFs.persistUriPermission(uri);
            let fsPath: string | URL = await AndroidFs.getFsPath(uri);

            // HACK This is a personal project, nobody else is supposed to use it,
            // and I do not want to suffer:
            // https://stackoverflow.com/questions/13209494/how-to-get-the-full-file-path-from-uri#41520090
            // example:  content://com.android.externalstorage.documents/tree/0000-0000:path/to_dir/document/0000-0000:path/to_dir
            let decodedUrl = "";
            if (typeof fsPath === "string") {
                decodedUrl = fsPath;
            } else {
                decodedUrl = fsPath.toString();
            }
            decodedUrl = decodeURIComponent(decodedUrl);
            // TODO fix schenanigans
            console.log("raw uri: " + decodedUrl);
            const relativePath = decodedUrl.split(":")[3];
            // SD Card is mounted under XXXX-XXXX
            path = `/storage/${decodedUrl.split(":")[1].replace(/.*\//,"")}/${relativePath}`;
        } else {
            path = await open({
                directory: true,
                multiple: false,
                title: "Select Music Library Folder",
            })
        }

        console.log(`Picked library path: ${path}`);

        if (typeof path === "string") {
            const success = await setLibraryPath(path);
            if (success) {
                currentLibrary = path;
                await readData();
                await scan();
            } else {
                message("Failed to set library path. Please try again. If the issue persists, check the logs for more details.");
            }
        }
    }
</script>

<div class="container">
    <div class="header">
        <Button variant="secondary" text="Pick library" onclick={pickPath} />
        <span class="library-path">{currentLibrary}</span>
    </div>
    <TrackList tracks={getConfig().library} />
</div>

<style>
    div.container {
        padding: 1em;
        display: flex;
        flex-direction: column;
        flex-wrap: nowrap;
        width: 100%;
        height: 100%;
    }
    div.header {
        flex: 0 0 auto;
        margin-bottom: 1em;
    }
    span.library-path {
        margin-left: 1em;
        font-weight: bold;
    }
</style>