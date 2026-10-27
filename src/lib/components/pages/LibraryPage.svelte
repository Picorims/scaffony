<script lang="ts">
    /*
    Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.
    
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at https://mozilla.org/MPL/2.0/.
    */

    import { getConfig, getCoverColors, getLibraryPath, readData, removeAllCoverColors, scan, setLibraryPath } from "$lib/user_data.svelte";
    import { onMount } from "svelte";
    import Button from "../atoms/Button.svelte";
    import { message, open } from "@tauri-apps/plugin-dialog";
    import TrackList from "../molecules/track_list/TrackList.svelte";
    import { AndroidFs } from 'tauri-plugin-android-fs-api'
    import { platform } from "@tauri-apps/plugin-os";
    import Modal from "../atoms/Modal.svelte";

    let libraryPicked = $state(false);
    let currentLibrary = $state<string>("No library selected");
    let scanDialog = $state<HTMLDialogElement>(document.createElement("dialog"))

    onMount(async () => {
        const lib = await getLibraryPath();
        if (lib) {
            currentLibrary = lib;
            libraryPicked = true;
        }
    })

    async function pickPath() {
        let path: string | null = null;
        if (platform() === "android") {
            // see also: https://developer.android.com/training/data-storage/manage-all-files?hl=fr
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
                libraryPicked = true;
                await readData();
            } else {
                message("Failed to set library path. Please try again. If the issue persists, check the logs for more details.");
            }
        }
    }
</script>

<div class="container">
    <div class="header">
        <Button variant="primary" text="Scan library" onclick={() => scanDialog.showModal()} disabled={!libraryPicked}/>
        <Button variant="secondary" text="Pick library" onclick={pickPath} />
        <span class="library-path">{currentLibrary}</span>
    </div>
    <TrackList tracks={getConfig().library} />
</div>

{#snippet close()}
    <Button text="Close" variant="secondary" onclick={() => scanDialog.close()} />
{/snippet}

<Modal bind:dialog={scanDialog} title={"Scan library"} buttons={close}>
    <div class="modal-container">
        <p>
            Scan to add new files and retrieve moved files (if the id file was moved with it).
            Missing files will not be removed from the library, but marked as missing.
        </p>
        <Button text="Scan" variant="primary" onclick={() => scan()} />
        <p>
            Cover color is used for a more immersive appearance.
        </p>
        <Button text="Get missing cover colors" variant="secondary" onclick={() => getCoverColors(false)} />
        <Button text="Get all cover colors" variant="secondary" onclick={() => getCoverColors(true)} />
        <Button text="Clear all cover colors" variant="secondary" onclick={() => removeAllCoverColors()} />
    </div>
</Modal>

<style>
    div.container {
        padding-top: 1rem;
        display: flex;
        flex-direction: column;
        flex-wrap: nowrap;
        width: 100%;
        height: 100%;
    }
    div.modal-container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
        margin-top: 1rem;
    }
    div.header {
        flex: 0 0 auto;
        margin-bottom: 1rem;
        margin-left: 1rem;
    }
    span.library-path {
        margin-left: 1rem;
        font-weight: bold;
    }

    @media screen and (width <= 600px) {
        div.container {
            padding-top: 0.5rem;
        }
        div.header {
            margin-left: 0.5rem;
            margin-bottom: 0.25rem;
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 0.25rem;
        }
        span.library-path {
            margin-left: 0;
            font-size: 0.8rem;
        }
    }
</style>