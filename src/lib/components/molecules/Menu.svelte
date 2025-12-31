<script lang="ts">
    import { Icon, LibraryBig, ListMusic, Shapes, Tags } from "@lucide/svelte";
    import MenuEntry from "../atoms/MenuEntry.svelte";
    import type { PageType } from "./Page.svelte";
    import { appState, navigateTo } from "$lib/app_state.svelte";
    import { platform } from "@tauri-apps/plugin-os";

    interface IProps {
        onnavigate?: (page: PageType) => void;
    }

    const { onnavigate = () => {} }: IProps = $props();

    function navigateToPage(p: PageType) {
        if (platform() === "android") {
            appState.menuVisible = false;
        }
        navigateTo(p, null);
        onnavigate(p);
    }

    /*
    Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.
    
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at https://mozilla.org/MPL/2.0/.
    */
    const entries: Array<{ text: string; Icon: typeof Icon; page: PageType }> = [
        { text: "Library", Icon: LibraryBig, page: "library" },
        { text: "Playlists", Icon: ListMusic, page: "playlists" },
        { text: "Tags", Icon: Tags, page: "tags" },
        { text: "Classify", Icon: Shapes, page: "classify" },
    ];
</script>

<nav>
    {#each entries as entry}
        <MenuEntry
            text={entry.text}
            Icon={entry.Icon}
            active={appState.activePage === entry.page}
            onclick={() => {navigateToPage(entry.page);}}
        />
    {/each}
</nav>

<style>
    nav {
        width: min-content;
        height: 100%;
        display: flex;
        flex-direction: column;
        background-color: var(--background-lighter-1);
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }
</style>
