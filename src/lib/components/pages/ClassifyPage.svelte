<script lang="ts">
    import { fromKebabToPascalCase } from "$lib/string";
    /*
    Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.
    
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at https://mozilla.org/MPL/2.0/.
    */

    import { getCategoryByName, getCategoryIcon, getConfig, getTagCategories, getTagCategory, getTagCompletionRatio, type CategoryEntry, type TagEntry } from "$lib/user_data.svelte";
    import Button from "../atoms/Button.svelte";
    import LucideIcon from "../atoms/LucideIcon.svelte";
    import Tag from "../atoms/Tag.svelte";
    import TrackList from "../molecules/track_list/TrackList.svelte";

    let categoryFilter = $state("");
    let tagFilter = $state("");
    let excludeCategoryFilter = $state("");
    let excludeTagFilter = $state("");
    let excludeFilter = $derived(excludeTagFilter !== "" ? excludeTagFilter : excludeCategoryFilter !== "" ? excludeCategoryFilter : undefined);
    let expandClassificationProgress = $state(false);
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

    function getCategoriesSortedByCompletionRatio(tagRatios: [TagEntry, number][]): [CategoryEntry, number][] {
        const categories = getTagCategories();

        const ratios: Record<string, number> = {};
        const counts: Record<string, number> = {};
        
        for (const category of categories) {
            ratios[category] = 0;
            counts[category] = 0;
        }

        for (const [tag, ratio] of tagRatios) {
            const category = getTagCategory(tag.name);
            ratios[category] += ratio;
            counts[category] ++;
        }
    
        let finalArray: [CategoryEntry, number][] = Object.entries(ratios).map(([category, ratioSum]) => [
            getCategoryByName(category),
            ratioSum / counts[category]
        ]);

        finalArray.sort((a, b) => a[1] - b[1]);

        console.log("alive");
        console.log(finalArray);

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
        <label>
            <span>Expand Classification Progress</span>
            <input type="checkbox" bind:checked={expandClassificationProgress}>
        </label>
    </div>
    <div class="tags-completion" class:full-size={expandClassificationProgress}>
        {@render ratioList()}
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

{#snippet ratioList()}
    {@const tagRatios = getTagsSortedByCompletionRatio()}
    {#each getCategoriesSortedByCompletionRatio(tagRatios) as [category, ratio] (category.name)}
        <p class="tag-and-percent">
            <span class="category-icon">
                <LucideIcon name={fromKebabToPascalCase(category.icon)} />
            </span>
            <span>{category.name} - </span>
            <span class="percent" data-percent={ratio * 100}>
                {Math.floor(ratio * 10_000) / 100}%
            </span>
        </p>
    {/each}
    {#each tagRatios as [tag, ratio] (tag.name)}
        <p class="tag-and-percent">
            <span class="category-icon">
                <LucideIcon name={fromKebabToPascalCase(getCategoryIcon(getTagCategory(tag.name)))} />
            </span>
            <Tag mode="display" shrinkable={false} size="normal" tag={tag} />
            <span class="percent" data-percent={ratio * 100}>
                {Math.floor(ratio * 10_000) / 100}%
            </span>
        </p>
    {/each}
{/snippet}

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
    label:has(input[type="checkbox"]) {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        cursor: pointer;
    }
    input[type="checkbox"] {
        width: 1.2em;
        height: 1.2em;
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

        &.full-size {
            max-height: initial;
        }
    }

    span.category-icon > :global(svg) {
        width: 1.5rem;
        height: 1.5rem;
        stroke: var(--text-darker-4)
    }

    p.tag-and-percent {
        display: inline-flex;
        align-items: center;
        margin-right: 3rem;
        gap: 0.35rem;
    }

    span.percent {
        position: relative;
        color: var(--text-darker-2);
    }
    span.percent::after {
        --percent: attr(data-percent %);
        --fill: if(
            style(--percent < 15%): var(--error);
            style(--percent < 30%): var(--warning);
            style(--percent < 75%): var(--correct);
            else: var(--primary);
        );
        position: absolute;
        content: "";
        bottom: -0.15rem;
        left: 0; 
        width: 100%;
        height: 0.15rem;
        background: linear-gradient(
                to right,
                var(--fill) 0%,
                var(--fill) var(--percent),
                transparent var(--percent),
                transparent 100%
            ), var(--background-lighter-3);
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