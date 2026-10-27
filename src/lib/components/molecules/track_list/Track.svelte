<script lang="ts">
    /*
    Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.
    
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at https://mozilla.org/MPL/2.0/.
    */

    import { appState } from "$lib/app_state.svelte";
    import IconButton from "$lib/components/atoms/IconButton.svelte";
    import {
    getActiveTagKeysWithCategorySeparators,
        getConfig,
        getEntryAudioPathWithBestExtension,
        getTag,
        getTagCategory,
        setTagState,
        type LibraryEntry,
    } from "$lib/user_data.svelte";
    import { Disc3, Play } from "@lucide/svelte";
    import Tag from "$lib/components/atoms/Tag.svelte";
    import { convertFileSrc } from "@tauri-apps/api/core";
    import { getMetadata, type Metadata } from "$lib/metadata";
    import { onDestroy } from "svelte";
    import { requestPlay, setWaitList } from "$lib/playback";
    import { join } from "@tauri-apps/api/path";
    import ShrunkTagsByCategory from "../ShrunkTagsByCategory.svelte";

    interface Props {
        entry: LibraryEntry;
        index: number;
        mode: "playback" | "classify";
        classifyFilter?: string;
    }

    const { entry, index, mode, classifyFilter }: Props = $props();
    let imageInError = $state(false);
    let metadataDefault = $state<Metadata>({
        title: entry.name,
        artist: entry.artist,
        album_name: "",
        comment: "",
        genre: "",
        track_number: 0,
        disc_number: 0,
        year: 0,
    });
    let metadataPromise = $state<Promise<Metadata>>();
    let scrollObserver = new IntersectionObserver(async (e) => {
        const event = e[0];
        let intersecting = event.isIntersecting;
        if (visible !== intersecting) {
            if (intersecting && event.intersectionRatio > 0) {
                visible = event.isIntersecting;
                if (
                    appState.libraryPath !== null &&
                    metadataPromise === undefined &&
                    visible
                ) {
                    metadataPromise = getMetadata(
                        await getEntryAudioPathWithBestExtension(entry),
                    );
                }
            } else if (!intersecting && event.intersectionRatio < 0.01) {
                // avoid flicker by making out condition smaller
                // than in condition (observer threshold)
                visible = event.isIntersecting;
            }
        } 
    }, {
        root: null,
        threshold: 0.5,
    });
    let visible = $state(false);
    let container = $state<HTMLDivElement | null>(null);
    $effect(() => {
        if (container !== null) {
            scrollObserver.observe(container);
        }
    });

    function play() {
        setWaitList([entry]);
        requestPlay();
    }

    function onStatusChange(newStatus: "yes" | "no" | "unknown", name: string) {
        setTagState(entry, name, newStatus);
    }

    onDestroy(() => {
        scrollObserver.disconnect();
    });
</script>

<div
    bind:this={container}
    class="container"
    class:odd={index % 2 === 1}
    class:classify={mode === "classify"}
    style:--cover-color={entry.color}
>
    <div class="gradient"></div>
    {#if visible}
        {#if imageInError || entry.coverPath === null || appState.libraryPath === null}
            <Disc3 class="placeholder" stroke="var(--text-darker-1)" />
        {:else}
            {#await join(appState.libraryPath, entry.coverPath)}
                <div class="cover"></div>
            {:then fullPath}
                <img
                class="cover"
                class:error={imageInError}
                src={convertFileSrc(fullPath)}
                alt={`${entry.name} by ${entry.artist} - cover`}
                onerror={() => (imageInError = true)}
                    />
            {/await}
        {/if}

        {#if metadataPromise}
            {#await metadataPromise}
                <span class="name">...</span>
                <span class="artist">...</span>
                {:then metadata}
                <span class="name"
                    >{metadata?.title ?? metadataDefault.title ?? "-"}</span
                >
                <span class="artist"
                    >{metadata?.artist ?? metadataDefault.artist ?? "-"}</span
                >
            {/await}
        {:else}
            <span class="name">...</span>
            <span class="artist">...</span>
        {/if}
        <div class="tags" class:classify={mode === "classify"}>
            {#if mode === "classify"}
                {#each getConfig().tags.filter( (v) => v.name.startsWith(classifyFilter ?? ""), ) as tag}
                    <Tag
                        {tag}
                        mode="classify"
                        status={Object.keys(entry.tags).includes(tag.name)
                            ? entry.tags[tag.name]
                                ? "yes"
                                : "no"
                            : "unknown"}
                        onStatusChange={(newStatus) =>
                            onStatusChange(newStatus, tag.name)}
                        size="normal"
                        shrinkable={false}
                    />
                {/each}
            {:else if mode === "playback"}
                <ShrunkTagsByCategory {entry} />
            {/if}
        </div>
        {#if entry.missing}
            <span>Missing</span>
        {:else if entry.virtual}
            <span>Virtual</span>
        {:else}
            <div class="actions">
                <IconButton onClick={play}>
                    <Play />
                </IconButton>
            </div>
        {/if}
    {/if}
</div>

<style>
    img.cover {
        /* width: 1.75rem; */
        /* height: 1.75rem; */
        width: calc(var(--height) - 2px);
        height: calc(var(--height) - 2px);
        margin: 0.05rem 0;
        object-fit: cover;
        box-shadow: 0 0 4px var(--cover-color, #00000000);
    }
    :global(svg.placeholder) {
        width: calc(var(--height) - 2px);
        height: calc(var(--height) - 2px);
    }

    div.container {
        --base-height: 1.85rem;
        --height: var(--base-height);
        position: relative;
        height: var(--height);
        border-bottom: 1px solid var(--background-lighter-2);
        color: var(--text);
        grid-column: span 5;

        display: grid;
        grid-template-columns: subgrid;
        align-items: center;
    }
    div.container.classify {
        --height: calc(3 * var(--base-height));
    }
    div.container.odd {
        background-color: var(--background-lighter-0);
    }

    div.container > :not(.gradient) {
        z-index: 1;
    }

    div.gradient {
        --altered-color: oklch(
                from var(--cover-color, #00000000)
                    min(max(calc(l - 0.3), 0.3), 0.5) c h
            );
        --background: var(--altered-color);
        position: absolute;
        width: 100%;
        height: 100%;
        background: linear-gradient(
            to right,
            var(--background),
            oklch(from var(--background) calc(l - 0.1) calc(c - 0.02) calc(h - 30))
        );
        box-shadow: 0 0 4px var(--cover-color, #00000000);
    }
    div.container.odd div.gradient {
        --background: oklch(from var(--altered-color) calc(l - 0.05) calc(c - 0.02) h);
    }

    span.artist,
    span.name {
        padding: 0 0.5rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    span.artist {
        font-size: 0.875rem;
        color: var(--text-darker-1);
    }

    div.tags {
        padding: 0 0.5rem;
        padding-left: 0.75rem;
        text-wrap: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
    }
    div.tags.classify {
        margin: 0.5rem;
        padding: 0.5rem;
        text-wrap: initial;
        max-height: calc(var(--height) - 1rem);
        overflow-y: auto;
        border-radius: 4px;
        box-shadow: inset 0 0 8px var(--background-darker-2);
    }

    div.actions {
        display: flex;
        align-items: center;
        justify-content: center;
        height: calc(var(--height) - 2px);
        width: min-content;
    }

    @media screen and (width <= 600px) {
        div.container {
            --base-height: 1rem;
            --height: calc(var(--base-height) * 3);
        }
        div.container.classify {
            --base-height: 1.85rem;
            --height: calc(var(--base-height) * 8);
        }
        span.name {
            font-size: 0.875rem;
            grid-row: 1;
            grid-column: 2 / span 2;
        }
        span.artist {
            font-size: 0.8rem;
            grid-row: 1;
            grid-column: 4 / span 1;
            min-width: 8rem;
        }
        div.tags {
            grid-column: 2 / span 3;
            grid-row: 2 / span 2;
            height: calc(1.75 * var(--base-height));
            padding-left: 1rem;
        }
        div.tags.classify {
            height: calc(var(--base-height) * 6.1);
            grid-row: 2 / span;
        }
        img.cover, :global(svg.placeholder), div.actions {
            grid-row: 1 / span 3;
        }
        div.container.classify img.cover, div.container.classify :global(svg.placeholder) {
            max-width: calc(var(--base-height) * 3);
            max-height: calc(var(--base-height) * 3);
        }
        div.actions {
            grid-column: 5;
        }
    }
</style>
