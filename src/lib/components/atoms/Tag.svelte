<script lang="ts">
    import type { TagEntry } from "$lib/user_data.svelte";
    import { Check, CircleQuestionMark, Icon, X } from "@lucide/svelte";
    import LucideIcon from "./LucideIcon.svelte";
    import { fromKebabToPascalCase } from "$lib/string";
    import IconButton from "./IconButton.svelte";

    /*
    Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.
    
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at https://mozilla.org/MPL/2.0/.
    */

    interface Props {
        tag: TagEntry;
        mode?: "display" | "classify";
        status?: "yes" | "no" | "unknown";
        onStatusChange?: (newStatus: "yes" | "no" | "unknown") => void;
        size: "header" | "normal";
    }

    let {
        tag,
        mode = "display",
        status = "yes",
        onStatusChange = () => {},
        size = "normal",
    }: Props = $props();
</script>

<div
    class="tag"
    style:--color={tag.colorHex}
    class:header={size === "header"}
    class:normal={size === "normal"}
>
    <LucideIcon name={fromKebabToPascalCase(tag.lucideIcon)} />
    <span class="label">{tag.name.replace(":", " / ")}</span>
    {#if mode === "classify"}
        <span class="buttons">
            <span class="icon-toggled yes" class:active={status === "yes"}>
                <IconButton
                    variant="correct"
                    onClick={() => onStatusChange("yes")}
                >
                    <Check />
                </IconButton>
            </span>
            <span class="icon-toggled no" class:active={status === "no"}>
                <IconButton
                    variant="error"
                    onClick={() => onStatusChange("no")}
                >
                    <X />
                </IconButton>
            </span>
            <span
                class="icon-toggled unknown"
                class:active={status === "unknown"}
            >
                <IconButton
                    variant="warning"
                    onClick={() => onStatusChange("unknown")}
                >
                    <CircleQuestionMark />
                </IconButton>
            </span>
        </span>
    {/if}
</div>

<style>
    div.tag {
        display: inline-flex;
        align-items: center;
        padding: 0.2em 0.5em;
        border: 1px solid var(--color);
        border-radius: 1em;
        font-size: 0.875em;
        letter-spacing: 0.05em;
        color: var(--text);
        background-color: oklch(from var(--color) calc(l - 0.7) c h);
        margin: 0.2em;
    }
    div.tag.header {
        font-size: 1.25em;
        padding: 0.4em 0.8em;
    }

    div.tag > :global(svg) {
        stroke: var(--color);
        min-width: 1.2em;
        width: 1.2em;
        min-height: 1.2em;
        height: 1.2em;
        margin-right: 0.3em;
    }

    span.label {
        overflow: hidden;
        display: -webkit-box;
        min-width: 5em;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        text-overflow: ellipsis;
    }

    span.buttons {
        flex: 0;
        margin-left: 0.5em;
        padding-left: 0.5em;
        border-left: 1px solid var(--color);
        display: flex;
    }

    span.icon-toggled.active {
        border: 1px solid;
        border-radius: 2px;
    }
    span.icon-toggled.yes.active {
        border-color: oklch(from var(--correct) calc(l - 0.3) c h);
        background-color: oklch(from var(--correct) calc(l - 0.5) c h);
    }
    span.icon-toggled.no.active {
        border-color: oklch(from var(--error) calc(l - 0.3) c h);
        background-color: oklch(from var(--error) calc(l - 0.5) c h);
    }
    span.icon-toggled.unknown.active {
        border-color: oklch(from var(--warning) calc(l - 0.3) c h);
        background-color: oklch(from var(--warning) calc(l - 0.5) c h);
    }

    @media screen and (width <= 600px) {
        div.tag {
            font-size: 0.75em;
            flex-wrap: wrap;
        }
        div.tag.normal {
            width: min-content;
        }
        span.buttons {
            border-left: 0px;
            margin-left: 0;
            padding-left: 0;
            margin-top: 0.3em;
            padding-top: 0.3em;
            border-top: 1px solid var(--color);
        }
    }
</style>
