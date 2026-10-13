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
    <div class="menu">
        <IconButton onClick={() => {
            appState.menuVisible = !appState.menuVisible;
        }}>
            <Menu />
        </IconButton>
    </div>
    {#if appState.progressPercent < 100}
        <div>
            <progress value={appState.progressPercent} max="100"></progress>
            <span class="progress-info">{appState.progressComment}</span>
        </div>
    {/if}
    <span class="logo">Scaffony</span>
</header>

<style>
    header {
        flex: 0;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        background-color: var(--background-lighter-2);
        color: var(--text);
        font-family: var(--font-header);
        font-size: 1rem;
        font-weight: 400;
    }
    header.mobile {
        padding-top: 3vh;
    }
    div.menu {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        padding: 0 1rem;
        background-color: var(--background-lighter-3);
    }
    div.menu :global(svg) {
        width: 2.5rem;
        height: 2.5rem;
    }
    progress {
        color: var(--primary);
    }
    span.progress-info {
        font-size: 0.85rem;
        font-family: var(--font-body);
        color: var(--text-darker-1);
    }
    span.logo {
        padding: 0.2em 1em;
    }
</style>