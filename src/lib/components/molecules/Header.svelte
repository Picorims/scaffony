<script lang="ts">
    /*
    Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.
    
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at https://mozilla.org/MPL/2.0/.
    */

    import { Menu } from "@lucide/svelte";
    import IconButton from "../atoms/IconButton.svelte";
    import { appState } from "$lib/app_state.svelte";
    import { platform } from "@tauri-apps/plugin-os";
</script>

<header class:mobile={platform() === "android"}>
    <IconButton onClick={() => {
        appState.menuVisible = !appState.menuVisible;
    }}>
        <Menu />
    </IconButton>
    <span>Scaffony</span>
</header>

<style>
    header {
        flex: 0;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.5rem 1.5rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        background-color: var(--background-lighter-2);
        color: var(--text);
        font-family: var(--font-header);
        font-size: 1.25rem;
        font-weight: 400;
    }
    header.mobile {
        padding-top: 3vh;
    }
</style>