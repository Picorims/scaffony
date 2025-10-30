<script lang="ts">
    import { getLibraryPath, setLibraryPath } from "$lib/user_data.svelte";
    import { onMount } from "svelte";
    import Button from "../atoms/Button.svelte";

    /*
    Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.
    
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at https://mozilla.org/MPL/2.0/.
    */

    import { message, open } from "@tauri-apps/plugin-dialog";

    let currentLibrary = $state<string>("No library selected");

    onMount(async () => {
        const lib = await getLibraryPath();
        if (lib) {
            currentLibrary = lib;
        }
    })

    async function pickPath() {
        const path = await open({
            directory: true,
            multiple: false,
            title: "Select Music Library Folder",
        })

        if (typeof path === "string") {
            const success = await setLibraryPath(path);
            if (success) {
                currentLibrary = path;
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
</div>

<style>
    div.container {
        padding: 1em;
    }
    span.library-path {
        margin-left: 1em;
        font-weight: bold;
    }
</style>