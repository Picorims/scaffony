<script lang="ts">
    import { getConfig, getTagCategories, type TagEntry } from "$lib/user_data.svelte";
    import Tag from "../atoms/Tag.svelte";

    /*
    Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.
    
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at https://mozilla.org/MPL/2.0/.
    */

    let categories = $state<string[]>([]);
    let tags = $state<TagEntry[]>([]);

    $effect(() => {
        categories = getTagCategories();
        tags = getConfig().tags;
    });
</script>

<div class="container">
    {#each categories as category}
        <h2>{category}</h2>
        <div class="tag-category">
            {#each tags.filter(tag => tag.name.startsWith(category + ":")) as tag}
                <div class="tag-entry">
                    <Tag tag={tag} />
                </div>
            {/each}
        </div>
    {/each}
</div>

<style>
    div.container {
        padding: 1em;
        display: flex;
        flex-direction: column;
        flex-wrap: nowrap;
        width: 100%;
        min-width: 0;
        height: 100%;
        overflow-x: hidden;
        overflow-y: auto;
    }

    h2 {
        margin-top: 1em;
        margin-bottom: 0.5em;
        border-top: 1px solid var(--text-darker-1);
    }
</style>