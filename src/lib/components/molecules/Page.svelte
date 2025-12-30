<script module lang="ts">
    /*
    Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.
    
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at https://mozilla.org/MPL/2.0/.
    */
    
    export type PageType = "library" | "playlists" | "tags" | "classify";
</script>

<script lang="ts">
    import ClassifyPage from "../pages/ClassifyPage.svelte";

    import LibraryPage from "../pages/LibraryPage.svelte";
    import PlaylistsPage from "../pages/PlaylistsPage.svelte";
    import TagsPage from "../pages/TagsPage.svelte";

    interface IProps {
        activePage: PageType;
    }
    const { activePage }: IProps = $props();
</script>

<div class="page">
    {#if activePage === "library"}
        <LibraryPage />
    {:else if activePage === "playlists"}
        <PlaylistsPage />
    {:else if activePage === "tags"}
        <TagsPage />
    {:else if activePage === "classify"}
        <ClassifyPage />
    {/if}
</div>

<style>
    div.page {
        flex: 1;
        width: 100%;
        height: 100%;
    }
</style>