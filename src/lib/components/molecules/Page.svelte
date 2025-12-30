<script module lang="ts">
    /*
    Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.
    
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at https://mozilla.org/MPL/2.0/.
    */
    
    export type PageType = "library" | "playlists" | "tags" | "classify" | "tag" | "playlist";
</script>

<script lang="ts">
    import ClassifyPage from "../pages/ClassifyPage.svelte";

    import LibraryPage from "../pages/LibraryPage.svelte";
    import PlaylistsPage from "../pages/PlaylistsPage.svelte";
    import TagPlaylistPage from "../pages/TagPlaylistPage.svelte";
    import TagsPage from "../pages/TagsPage.svelte";

    interface IProps {
        activePage: PageType;
        subPage: string | null;
    }
    const { activePage, subPage }: IProps = $props();
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
    {:else if activePage === "tag" }
        <TagPlaylistPage type="tag" name={subPage ?? "Unknown Tag"} />
    {:else if activePage === "playlist" }
        <TagPlaylistPage type="playlist" name={subPage ?? "Unknown Playlist"} />
    {/if}
</div>

<style>
    div.page {
        flex: 1;
        width: 100%;
        height: 100%;
    }
</style>