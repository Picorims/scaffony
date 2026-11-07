<script lang="ts">
    /*
    Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.

    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at https://mozilla.org/MPL/2.0/.
    */

    import { getConfig, type Filter, type FilterIncludesTag, type FilterExcludesTag, type FilterIncludesCategory, type FilterExcludesCategory, getTagCategories } from "$lib/user_data.svelte";
    import { Ampersands, FolderCheck, FolderX, SquaresIntersect, SquaresUnite, TagPlus, TagX, Trash } from "@lucide/svelte";
    import Button from "../atoms/Button.svelte";
    import IconButton from "../atoms/IconButton.svelte";
    import { fromKebabToPascalCase } from "$lib/string";
    import LucideIcon from "../atoms/LucideIcon.svelte";
    import FilterPreview from "../atoms/FilterPreview.svelte";
    import FilterIcon from "../atoms/FilterIcon.svelte";
    import TagOptions from "../atoms/TagOptions.svelte";
    
    interface Props {
        selectId: string;
        mutableFiltersList: Filter[];
    }

    const {selectId, mutableFiltersList}: Props = $props();

</script>

<FilterPreview filter={mutableFiltersList} indent />
{@render filters(selectId, mutableFiltersList, true)}

<datalist id="tag-categories-list">
    {#each getTagCategories() as category}
        <option value={category}></option>
    {/each}
</datalist>

{#snippet filters(selectId: string, mutableFiltersList: Filter[], noMarginLeft = false)}
    <fieldset class="filters" class:no-margin-left={noMarginLeft}>
        <legend>
            <h3>Filters</h3>
        </legend>
        <div>

            <select id={selectId}>
                <option value="" disabled selected>Add filter...</option>
                <option value="includes_tag">Includes Tag</option>
                <option value="excludes_tag">Excludes Tag</option>
                <option value="includes_category">Includes Category</option>
                <option value="excludes_category">Excludes Category</option>
                <option value="all">All of...</option>
                <option value="any">Any of...</option>
            </select>
            <Button variant="secondary" text="Add Filter" onclick={() => {
                const select = document.querySelector(`#${selectId}`) as HTMLSelectElement;
                const selectedValue = select.value;
                if (selectedValue) {
                    let newFilter: unknown; // HACK find a more type-safe way
                    switch (selectedValue) {
                        case "includes_tag":
                            newFilter = { type: "includes_tag", tagName: "" };
                            break;
                        case "excludes_tag":
                            newFilter = { type: "excludes_tag", tagName: "" };
                            break;
                        case "includes_category":
                            newFilter = { type: "includes_category", categoryName: "" };
                            break;
                        case "excludes_category":
                            newFilter = { type: "excludes_category", categoryName: "" };
                            break;
                        case "all":
                            newFilter = { type: "all", children: [] };
                            break;
                        case "any":
                            newFilter = { type: "any", children: [] };
                            break;
                    }
                    if (newFilter) {
                        mutableFiltersList.push(newFilter as Filter); // HACK find a more type-safe way
                    }
                }
            }} />
        </div>

        {#each mutableFiltersList as filter, index}
            {@render filterEntry(filter, selectId, () => {
                mutableFiltersList.splice(index, 1);
            })}
        {/each}
    </fieldset>
{/snippet}



{#snippet filterEntry(filter: Filter, namespace: string, onRemove: () => void)}
    <div class="filter-entry">
        <h4>
            <FilterIcon type={filter.type} />
            {filter.type}
        </h4>

        {#if filter.type === "includes_tag" || filter.type === "excludes_tag"}
            <label
                >Tag Name:
                <select bind:value={(filter as FilterIncludesTag | FilterExcludesTag).tag}>
                    <TagOptions />
                </select>
            </label>
        {/if}

        {#if filter.type === "includes_category" || filter.type === "excludes_category"}
            <label
                >Category Name:
                <input
                    type="text"
                    bind:value={(filter as FilterIncludesCategory | FilterExcludesCategory).category}
                    list="tag-categories-list"
                />
            </label>
        {/if}

        {#if filter.type === "all" || filter.type === "any"}
            {@render filters(`${namespace}-${filter.type}`, filter.children)}
        {/if}
            <!-- FIXME any allow that none is true. -->
        <IconButton onClick={onRemove}>
            <Trash />
        </IconButton>
    </div>
{/snippet}

<style>
    fieldset.filters {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-top: 0.5rem;
        border-color: oklch(from var(--lvl-1) 0.5 c h);
        border-width: 2px;

        &:not(.no-margin-left) {
            margin-left: 1rem;
        }

        & fieldset.filters {
            border-color: oklch(from var(--lvl-2) 0.5 c h);
            & fieldset.filters {
                border-color: oklch(from var(--lvl-3) 0.5 c h);
                & fieldset.filters {
                    border-color: oklch(from var(--lvl-4) 0.5 c h);
                    & fieldset.filters {
                        border-color: oklch(from var(--lvl-5) 0.5 c h);
                        & fieldset.filters {
                            border-color: oklch(from var(--lvl-6) 0.5 c h);
                            & fieldset.filters {
                                border-color: var(--background-lighter-3);
                            }
                        }
                    }
                }
            }
        }
    }
    div.filter-entry {
        padding: 0.5rem;
        padding-left: 1rem;
        background-color: var(--background);
        border-radius: 4px;
        border: 1px solid var(--background-lighter-2);
    }
    div.filter-entry h4 {
        margin-bottom: 0.5em;
    }
    div.filter-entry :global(svg.filter-icon) {
        display: inline-block;
        margin-right: 0.5em;
        stroke: var(--text-darker-6);
        vertical-align: middle;

        &:global([data-type="includes_category"]),
        &:global([data-type="excludes_category"]) {
            stroke: var(--category-color);
        }
        &:global([data-type="any"]),
        &:global([data-type="all"]) {
            stroke: var(--operation-color);
        }
        &:global([data-type="includes_tag"]),
        &:global([data-type="excludes_tag"]) {
            stroke: var(--tag-color);
        }
    }
</style>