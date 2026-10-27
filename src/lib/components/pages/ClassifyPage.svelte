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
            <span>Category:</span>
            <select bind:value={categoryFilter}>
                <option value="">--all--</option>
                {#each getTagCategories() as category (category)}
                    <option value={category}>{category}</option>
                {/each}
            </select>
        </label>
        <label>
            <span>Tag:</span>
            <select bind:value={tagFilter}>
                <option value="">--all--</option>
                {#each getConfig().tags as tag (tag.name)}
                    <option value={tag.name}>{tag.name}</option>
                {/each}
            </select>
        </label>
        <label>
            <span>Exclude Category:</span>
            <select bind:value={excludeCategoryFilter}>
                <option value="">--none--</option>
                {#each getTagCategories() as category (category)}
                    <option value={category}>{category}</option>
                {/each}
            </select>
        </label>
        <label>
            <span>Exclude Tag:</span>
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
                <p class="tag-and-percent">
                    <Tag mode="display" shrinkable={false} size="normal" tag={tag} />
                    <span>
                        {Math.floor(ratio * 10_000) / 100}%
                    </span>
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
        <p class="fallback">
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
    p.fallback {
        margin: 0 1rem;
        text-wrap: balance;
    }
    div.tags-completion {
        --cell-width: 256px;
        padding: 0.25rem;
        padding-left: 1rem;
        max-height: 20%;
        overflow-y: scroll;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(var(--cell-width), 1fr));
        box-shadow: inset 0 0 32px var(--background-darker-2);
    }
    p.tag-and-percent {
        display: inline-flex;
        align-items: center;
        margin-right: 0.5rem;
        gap: 0.1rem;
    }

    @media screen and (width <= 600px) {
        div.container {
            gap: 0.25rem;
        }
        div.header {
            margin: 0.5rem;
            margin-bottom: 0;
            display: flex;
            flex-wrap: wrap;
            gap: 0.25rem;

            & label {
                max-width: 100%;
                flex: 1 1 auto;
                margin-bottom: 0.25rem;
                margin-right: 0;
                display: inline-flex;
                gap: 0.25rem;
            
                & > select {
                    flex: 1 1 0;
                    min-width: 1rem;
                    width: fit-content;
                }
            }
        }
        P.fallback {
            margin-left: 0.5rem;
        }
        div.tags-completion {
            --cell-width: 128px;
            padding-left: 0.5rem;
            max-height: 18%;
        }
    }
</style>