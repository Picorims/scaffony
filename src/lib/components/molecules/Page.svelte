<script module lang="ts">
    /*
    Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.
    
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at https://mozilla.org/MPL/2.0/.
    */
    
    export type PageType = "library" | "playlists" | "tags";
</script>

<script lang="ts">
    import LibraryPage from "../pages/LibraryPage.svelte";
import Library from "../pages/LibraryPage.svelte";
    import PlaylistsPage from "../pages/PlaylistsPage.svelte";
    import TagsPage from "../pages/TagsPage.svelte";

    interface IProps {
        activePage: PageType;
    }
    const { activePage }: IProps = $props();
</script>

<span>
    {#if activePage === "library"}
        <LibraryPage />
    {:else if activePage === "playlists"}
        <PlaylistsPage />
    {:else if activePage === "tags"}
        <TagsPage />
    {/if}
</span>