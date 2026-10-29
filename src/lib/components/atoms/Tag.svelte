<script lang="ts">
    import { getTagCategory, isCategoryExclusive, type TagEntry } from "$lib/user_data.svelte";
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
        shrinkable: boolean;
        forceShrink?: boolean;
        forceDisplayCategory?: boolean;
        className?: string;
    }

    let {
        tag,
        mode = "display",
        status = "yes",
        onStatusChange = () => {},
        size = "normal",
        shrinkable,
        forceShrink = false,
        forceDisplayCategory = false,
        className = ""
    }: Props = $props();
</script>

<div
    class={`tag ${className}`}
    data-label={tag.name.replace(":", " / ")}
    style:--color={tag.colorHex}
    class:header={size === "header"}
    class:normal={size === "normal"}
    class:classify={mode === "classify"}
    class:shrinkable={shrinkable}
    class:force-shrink={forceShrink}
    class:exclusive={isCategoryExclusive(getTagCategory(tag.name))}
>
    <div class="icon-label">
        <LucideIcon name={fromKebabToPascalCase(tag.lucideIcon)} />
        <span class="label">
            {#if mode === "classify" && !forceDisplayCategory}
                {tag.name.slice(tag.name.indexOf(":") + 1)}
            {:else}
                {tag.name.replace(":", " / ")}
            {/if}
        </span>
    </div>
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
        --background-color: oklch(from var(--color) max(calc(l - 0.7), 0.15) max(calc(c - 0.1), 0.02) h);
        position: relative;
        display: inline-flex;
        align-items: center;
        padding: 0.2em 0.5em;
        border: 1px solid var(--color);
        border-radius: 1em;
        font-size: 0.875rem;
        letter-spacing: 0.05em;
        color: var(--text);
        background-color: var(--background-color);
        margin: 0.2em;
    }
    div.tag.classify {
        padding-top: 0;
        padding-bottom: 0;
    }
    div.tag.exclusive {
        border-style: dashed;
    }
    div.tag.header {
        font-size: 1.25rem;
        padding: 0.4em 0.8em;
    }

    div.icon-label {
        display: flex;
        align-items: center;
    }
    div.icon-label > :global(svg) {
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
    
    div.tag.normal:not(.classify) span.buttons {
        display: none;
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
    div.tag.normal:not(.classify).force-shrink span.label {
            display: none;
    }
    div.tag.normal:not(.classify).force-shrink :global(svg) {
        margin-right: 0;
    }
    div.tag.normal:not(.classify).force-shrink {
        padding: 0.2em;
        margin: 0.2em 0.1em;
    }
    @media screen and (width <= 1000px) {
        div.tag.normal:not(.classify).shrinkable span.label {
            display: none;
        }
        div.tag.normal:not(.classify).shrinkable :global(svg) {
            margin-right: 0;
        }
        div.tag.normal:not(.classify).shrinkable {
            padding: 0.2em;
            margin: 0.2em 0.1em;
        }
    }

    div.tag.shrinkable::after {
        opacity: 0;
        content: attr(data-label);
        position: fixed;
        top: 10%;
        left: 50%;
        transform: translate(-50%, -50%);
        padding: 0.2em 0.5em;
        transform: translate(-50%, 0);
        pointer-events: none;
        font-size: 2rem;
        background-color: var(--background-color);
        border: 2px solid var(--color);
        border-radius: 0.35em;
        /* animation: 0.5s fadeIn; */
        transition: opacity 0.25s;
        box-shadow: 0px 4px 8px rgb(from var(--color) r g b / 0.5),
            0px 4px 48px rgb(from var(--color) r g b / 0.5),
            0px 4px 128px rgb(from var(--color) r g b / 0.5),
            inset 0px 0px 8px rgb(from var(--color) r g b / 0.95);
    }
    div.tag.shrinkable:hover::after {
        opacity: 1;
    }

    /* @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    } */

    @media screen and (width <= 600px) {
        div.tag {
            font-size: 0.75em;
            flex-wrap: wrap;
            overflow: hidden;
        }
        div.tag.classify {
            justify-content: stretch;
            padding: 0;
            padding-top: 0.2em;
            border-radius: 0.25em;
        }
        div.tag.normal {
            width: min-content;
        }
        span.buttons {
            flex: 1;
            border-left: 0px;
            margin-left: 0;
            padding-left: 0;
            margin-top: 0.3em;
            border-top: 1px solid var(--color);
        }
        span.label {
            position: relative;
            min-width: 5em;
            padding-right: 0.2em;
        }
        div.icon-label > :global(svg) {
            margin-left: 0.2em;
        }
        div.tag.classify span.label {
            min-width: 0;
            max-width: calc(100% - 1.2rem);
        }

        div.tag.normal:not(.classify).force-shrink :global(svg) {
            margin-left: 0;
        }
    }
</style>
