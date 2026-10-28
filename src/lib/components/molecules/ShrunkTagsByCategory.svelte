<script lang="ts">
    import { fromKebabToPascalCase } from "$lib/string";
    import { getActiveTagKeysWithCategorySeparators, getCategoryIcon, getTag, getTagCategory, type LibraryEntry } from "$lib/user_data.svelte";
    import LucideIcon from "../atoms/LucideIcon.svelte";
    import Tag from "../atoms/Tag.svelte";

    /*
    Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.
    
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at https://mozilla.org/MPL/2.0/.
    */
    interface Props {
        entry: LibraryEntry
    }

    let {entry}: Props = $props();
    let tagKeys = $derived(getActiveTagKeysWithCategorySeparators(entry));

    function tagToCategoryToIcon(tag: string) {
        return fromKebabToPascalCase(getCategoryIcon(getTagCategory(tag)));
    }
</script>

{#key tagKeys}
    {#each tagKeys as tagName, index}
        {#if index === 0}
            <span class="category-icon">
                <LucideIcon name={tagToCategoryToIcon(tagName)} />
            </span>
        {/if}
        {#if tagName !== " " && entry.tags[tagName] === true}
            {@const tagEntry = getTag(tagName)}
            {#if tagEntry !== null}
                <Tag tag={tagEntry} size="normal" shrinkable forceShrink className={"tag-overlap"} />
            {/if}
        {:else if tagName === " "}
            <span class="tag-category-spacing"></span>
            {#if index + 1 < tagKeys.length}
                <span class="category-icon">
                    <LucideIcon name={tagToCategoryToIcon(tagKeys[index + 1])} />
                </span>
            {/if}
        {/if}
    {/each}
{/key}

<style>
    :global(.tag-overlap) {
        margin-left: -0.75rem !important;
    }
    span.category-icon > :global(svg) {
        height: 1.2rem;
        margin-right: 0.25em;
        /* HACK so category and tag icons are aligned */
        transform: translate(0, 0.1em);
    }
    span.tag-category-spacing {
        position: relative;
        display: inline-block;
        width: 0.5rem;
        height: 1rem;

        &::after {
            content: "";
            position: absolute;
            top: 0;
            left: 0.3rem;
            width: 0;
            height: 100%;
            border-right: 1px dashed var(--text-darker-4);
        }
    }

    @media screen and (width <= 600px) {
        span.tag-category-spacing {
            width: 1.25rem;
        }
        :global(.tag-overlap) {
            margin-left: -0.5rem !important;
        }
    }
</style>