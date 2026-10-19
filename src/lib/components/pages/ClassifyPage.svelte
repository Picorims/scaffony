<script lang="ts">
    /*
    Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.
    
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at https://mozilla.org/MPL/2.0/.
    */

    import { getConfig, getTagCategories, getTagCompletionRatio, type TagEntry } from "$lib/user_data.svelte";
    import Button from "../atoms/Button.svelte";
    import Tag from "../atoms/Tag.svelte";
    import TrackList from "../molecules/track_list/TrackList.svelte";

    let categoryFilter = $state("");
    let tagFilter = $state("");
    let excludeCategoryFilter = $state("");
    let excludeTagFilter = $state("");
    let excludeFilter = $derived(excludeTagFilter !== "" ? excludeTagFilter : excludeCategoryFilter !== "" ? excludeCategoryFilter : undefined);
    $inspect(excludeFilter, excludeCategoryFilter, excludeTagFilter, categoryFilter);

    function getTagsSortedByCompletionRatio(): [TagEntry, number][] {
        const tags = [...getConfig().tags];
        const completionRatios: Record<string, number> = {};
        for (const tag of tags) {
            completionRatios[tag.name] = getTagCompletionRatio(tag.name, excludeFilter);
        }
        tags.sort((a, b) => completionRatios[a.name] - completionRatios[b.name]);
        const finalArray: [TagEntry, number][] = [];
        for (const tag of tags) {
            finalArray.push([tag, completionRatios[tag.name]]);
        }
        return finalArray;
    }
</script>

<div class="container">
    <div class="header">
        <label>
            Category:
            <select bind:value={categoryFilter}>
                <option value="">--all--</option>
                {#each getTagCategories() as category (category)}
                    <option value={category}>{category}</option>
                {/each}
            </select>
        </label>
        <label>
            Tag:
            <select bind:value={tagFilter}>
                <option value="">--all--</option>
                {#each getConfig().tags as tag (tag.name)}
                    <option value={tag.name}>{tag.name}</option>
                {/each}
            </select>
        </label>
        <label>
            Exclude Category:
            <select bind:value={excludeCategoryFilter}>
                <option value="">--none--</option>
                {#each getTagCategories() as category (category)}
                    <option value={category}>{category}</option>
                {/each}
            </select>
        </label>
        <label>
            Exclude Tag:
            <select bind:value={excludeTagFilter}>
                <option value="">--none--</option>
                {#each getConfig().tags as tag (tag.name)}
                    <option value={tag.name}>{tag.name}</option>
                {/each}
            </select>
        </label>
    </div>
    <div class="tags-completion">
        <!-- {#key excludeFilter} -->
            {#each getTagsSortedByCompletionRatio() as [tag, ratio] (tag.name)}
                <p>
                    <Tag mode="display" shrinkable={false} size="normal" tag={tag} />
                    {Math.floor(ratio * 10_000) / 100}%
                </p>
            {/each}
        <!-- {/key} -->
    </div>
    {#if tagFilter !== "" || categoryFilter !== ""}
        <TrackList
            tracks={getConfig().library}
            mode={"classify"}
            classifyFilter={tagFilter !== "" ? tagFilter : categoryFilter !== "" ? categoryFilter : undefined}
            {excludeFilter}
        />
    {:else}
        <p>
            <strong>Please select a category or a tag.</strong>
        </p>
    {/if}
</div>

<style>
    div.container {
        display: flex;
        flex-direction: column;
        flex-wrap: nowrap;
        width: 100%;
        height: 100%;
        gap: 1rem;
    }
    div.header {
        margin-top: 1rem;
        margin-left: 1rem;
    }
    div.header > label {
        display: inline-block;
        white-space: nowrap;
        margin-right: 1rem;
        margin-bottom: 0.5rem;
    }
    div.tags-completion {
        margin-left: 1rem;
        max-height: 20%;
        overflow-y: scroll;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(256px, 1fr));
    }
</style>