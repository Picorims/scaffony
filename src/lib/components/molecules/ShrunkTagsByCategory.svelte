<script lang="ts">
    import { getActiveTagKeysWithCategorySeparators, getTag, type LibraryEntry } from "$lib/user_data.svelte";
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
</script>

{#each tagKeys as tagName}
    {#if tagName !== " " && entry.tags[tagName] === true}
        {@const tagEntry = getTag(tagName)}
        {#if tagEntry !== null}
        <Tag tag={tagEntry} size="normal" shrinkable forceShrink className={"tag-overlap"} />
        {/if}
    {:else if tagName === " "}
        <span class="tag-category-spacing"></span>
    {/if}
{/each}

<style>
    :global(.tag-overlap) {
        margin-left: -0.75rem !important;
    }
    span.tag-category-spacing {
        position: relative;
        display: inline-block;
        width: 1.5rem;
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