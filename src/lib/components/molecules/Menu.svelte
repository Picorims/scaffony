<script lang="ts">
    import { Icon, LibraryBig, ListMusic, Tags } from "@lucide/svelte";
    import MenuEntry from "../atoms/MenuEntry.svelte";
    import type { PageType } from "./Page.svelte";

    interface IProps {
        onnavigate: (page: PageType) => void;
    }

    const { onnavigate }: IProps = $props();
    let page = $state<PageType>("libraries");

    $effect(() => {
        onnavigate(page);
    });

    /*
    Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.
    
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at https://mozilla.org/MPL/2.0/.
    */
    const entries: Array<{ text: string; Icon: typeof Icon; page: PageType }> = [
        { text: "Libraries", Icon: LibraryBig, page: "libraries" },
        { text: "Playlists", Icon: ListMusic, page: "playlists" },
        { text: "Tags", Icon: Tags, page: "tags" },
    ];
</script>

<nav>
    {#each entries as entry}
        <MenuEntry
            text={entry.text}
            Icon={entry.Icon}
            active={page === entry.page}
            onclick={() => (page = entry.page)}
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
