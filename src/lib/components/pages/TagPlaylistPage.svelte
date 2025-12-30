<script lang="ts">
    /*
    Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.
    
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at https://mozilla.org/MPL/2.0/.
    */

    import { fromKebabToPascalCase } from "$lib/string";
import { getConfig, getPlaylist, getPlaylistLibraryEntries, getTag, getTagLibraryEntries } from "$lib/user_data.svelte";
    import Button from "../atoms/Button.svelte";
    import LucideIcon from "../atoms/LucideIcon.svelte";
    import Tag from "../atoms/Tag.svelte";
    import TrackList from "../molecules/track_list/TrackList.svelte";

    interface Props {
        type: "tag" | "playlist";
        name: string;
    }

    const { name, type }: Props = $props();
</script>

<div class="container">
    <div class="header">
        {#if type === "playlist"}
            <div class="cover" style:--color="{getPlaylist(name)?.colorHex ?? '#000000'}">
                <LucideIcon name={fromKebabToPascalCase(getPlaylist(name)?.lucideIcon ?? "disc-3")} size={48} />
            </div>
            <h2>Playlist - {name}</h2>
        {:else if type === "tag"}
            <h2>Tag</h2>
            {@const tagEntry = getTag(name)}
            {#if tagEntry}
                <Tag tag={tagEntry} size="header" />
            {/if}
        {/if}
    </div>

    {#if type === "tag"}
        {#if getTag(name) === null}
            <p>No tag found with the name "{name}".</p>
        {:else}
            <TrackList tracks={getTagLibraryEntries(name)} />
        {/if}
    {/if}

    {#if type === "playlist"}
        {#if getPlaylist(name) === null}
            <p>No playlist found with the name "{name}".</p>
        {:else}
            <TrackList tracks={getPlaylistLibraryEntries(name)} />
        {/if}
    {/if}
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

        display: flex;
        align-items: center;
        gap: 1em;
    }
    
    div.cover {
        margin-right: 1em;
        width: 64px;
        height: 64px;
        background-color: black;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
    }
    div.cover :global(svg) {
        stroke: var(--color);
    }
</style>