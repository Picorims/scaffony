<script lang="ts">
    /*
    Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.

    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at https://mozilla.org/MPL/2.0/.
    */

    import { fromKebabToPascalCase } from "$lib/string";
    import {
        getCategoryIcon,
        getTag,
        hasCategory,
        type Filter,
        type FilterByType,
        type FilterIncludesCategory,
    } from "$lib/user_data.svelte";
    import { BadgeQuestionMark } from "@lucide/svelte";
    import LucideIcon from "./LucideIcon.svelte";
    import Tag from "./Tag.svelte";

    interface Props {
        filter: Filter[];
        indent?: boolean;
    }

    const { filter, indent = false }: Props = $props();
</script>

<details open={indent}>
    <summary>Filter</summary>
    {@render filterToStylizedString({
        type: "all",
        children: filter,
    })}
</details>

<!-- {#snippet tagIcon(tagName: string)}
    <LucideIcon
        name={fromKebabToPascalCase(getTag(tagName)?.lucideIcon ?? "")}
        class="tag-icon"
    />
{/snippet} -->
{#snippet categoryIcon(categoryName: string)}
    {#if !hasCategory(categoryName)}
        <BadgeQuestionMark class="category-icon" />
    {:else}
        <LucideIcon
            name={fromKebabToPascalCase(getCategoryIcon(categoryName))}
            class="category-icon"
        />
    {/if}
{/snippet}

{#snippet indentedBy(n: number)}
    <span class="indent" data-n={n}></span>
{/snippet}

{#snippet tagF(tagName: string, functionName: string)}
    <span class="function">{functionName}</span>(
    <!-- {@render tagIcon(f.tag)}
        <span class="tag">{f.tag}</span> -->
    {@const tag = getTag(tagName)}
    {#if tag}
        <span class="middle"
            ><Tag {tag} shrinkable={false} size="normal" /></span
        >
    {/if}
    )
{/snippet}

{#snippet categoryF(categoryName: string, functionName: string)}
    <span class="function">{functionName}</span>(
    {@render categoryIcon(categoryName)}
    <span class="category">{categoryName}</span>
    )
{/snippet}

{#snippet filterToStylizedString(f: Filter, level = 1)}
    {#if f.type === "includes_tag" || f.type === "excludes_tag"}
        {@render tagF(f.tag, f.type)}
    {:else if f.type === "includes_category" || f.type === "excludes_category"}
        {@render categoryF(f.category, f.type)}
    {:else if f.type === "all"}
        <span class="parenthesis" data-n={((level - 1) % 6) + 1}>(</span>

        {#each f.children as cf, index (index)}
            {#if indent && index === 0}
                <br />
                {@render indentedBy(level)}
            {/if}
            {@render filterToStylizedString(cf, level + 1)}

            {#if index < f.children.length - 1}
                {#if indent}
                    <br />
                    {@render indentedBy(level)}
                {/if}
                <span class="operator">AND&nbsp;</span>
            {/if}
        {/each}

        {#if indent}
            <br />
            {@render indentedBy(Math.max(level - 1, 0))}
        {/if}
        <span class="parenthesis" data-n={((level - 1) % 6) + 1}>)</span>
    {:else if f.type === "any"}
        <span class="parenthesis" data-n={((level - 1) % 6) + 1}>(</span>

        {#each f.children as cf, index (index)}
            {#if indent && index === 0}
                <br />
                {@render indentedBy(level)}
            {/if}
            {@render filterToStylizedString(cf, level + 1)}

            {#if index < f.children.length - 1}
                {#if indent}
                    <br />
                    {@render indentedBy(level)}
                {/if}
                <span class="operator">OR&nbsp;</span>
            {/if}
        {/each}

        {#if indent}
            <br />
            {@render indentedBy(Math.max(level - 1, 0))}
        {/if}
        <span class="parenthesis" data-n={((level - 1) % 6) + 1}>)</span>
    {/if}
{/snippet}

<style>
    details {
        display: inline-block;
        border: 1px solid var(--background-lighter-3);
        border-radius: 4px;
        padding: 0.5rem;
        min-width: 1rem;
        line-height: 1rem;

        --tag-color: rgb(252, 196, 43);
        --category-color: rgb(69, 247, 194);

        & :global(.tag) {
            margin: 0;
        }
    }

    span.parenthesis {
        margin-left: -0.25rem;
        --l: 0.7;
        &[data-n="1"] {
            color: oklch(from var(--lvl-1) var(--l) c h);
        }
        &[data-n="2"] {
            color: oklch(from var(--lvl-2) var(--l) c h);
        }
        &[data-n="3"] {
            color: oklch(from var(--lvl-3) var(--l) c h);
        }
        &[data-n="4"] {
            color: oklch(from var(--lvl-4) var(--l) c h);
        }
        &[data-n="5"] {
            color: oklch(from var(--lvl-5) var(--l) c h);
        }
        &[data-n="6"] {
            color: oklch(from var(--lvl-6) var(--l) c h);
        }
    }
    span.indent {
        --n: attr(data-n type(<number>));
        --indent: 1.5rem;
        display: inline-block;
        width: calc(var(--indent) * var(--n));
        height: 1.75lh;
        background: linear-gradient(
            to right,
            var(--lvl-1) 0%,
            transparent 2px,
            transparent var(--indent),
            var(--lvl-2) var(--indent),
            transparent calc(var(--indent) + 2px),
            transparent calc(2 * var(--indent)),
            var(--lvl-3) calc(2 * var(--indent)),
            transparent calc(calc(2 * var(--indent)) + 2px),
            transparent calc(3 * var(--indent)),
            var(--lvl-4) calc(3 * var(--indent)),
            transparent calc(calc(3 * var(--indent)) + 2px),
            transparent calc(4 * var(--indent)),
            var(--lvl-5) calc(4 * var(--indent)),
            transparent calc(calc(4 * var(--indent)) + 2px),
            transparent calc(5 * var(--indent)),
            var(--lvl-6) calc(5 * var(--indent)),
            transparent calc(calc(5 * var(--indent)) + 2px),
            transparent calc(6 * var(--indent))
        );
        background-repeat: repeat;
        background-size: calc(6 * var(--indent));
        vertical-align: middle;
    }
    span.function {
        color: rgb(69, 131, 247);
    }
    /* span.tag {
        color: var(--tag-color);
    } */
    span.middle {
        vertical-align: sub;
    }
    span.category {
        color: var(--category-color);
    }
    span.operator {
        color: rgb(253, 109, 169);
    }

    details :global(svg) {
        width: 0.75lh;
        height: 0.75lh;
        vertical-align: middle;

        &:global(.tag-icon) {
            stroke: var(--tag-color);
        }
        &:global(.category-icon) {
            stroke: var(--category-color);
        }
    }
</style>
