<script lang="ts">
    /*
    Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.
    
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at https://mozilla.org/MPL/2.0/.
    */

    import { getConfig, getTagCategories } from "$lib/user_data.svelte";
    import Button from "../atoms/Button.svelte";
    import TrackList from "../molecules/track_list/TrackList.svelte";

    let categoryFilter = $state("");
    let tagFilter = $state("");
</script>

<div class="container">
    <div class="header">
        <label>
            Category:
            <select bind:value={categoryFilter}>
                <option value="">--all--</option>
                {#each getTagCategories() as category}
                    <option value={category}>{category}</option>
                {/each}
            </select>
        </label>
        <label>
            Tag:
            <select bind:value={tagFilter}>
                <option value="">--all--</option>
                {#each getConfig().tags as tag}
                    <option value={tag.name}>{tag.name}</option>
                {/each}
            </select>
        </label>
    </div>
    <TrackList tracks={getConfig().library} mode={"classify"} classifyFilter={tagFilter !== "" ? tagFilter : categoryFilter !== "" ? categoryFilter : undefined} />
</div>

<style>
    div.container {
        padding: 1em;
        display: flex;
        flex-direction: column;
        flex-wrap: nowrap;
        width: 100%;
        height: 100%;
        gap: 1em;
    }
    div.header > label {
        display: inline-block;
        white-space: nowrap;
        margin-right: 1em;
        margin-bottom: 0.5em;
    }
</style>