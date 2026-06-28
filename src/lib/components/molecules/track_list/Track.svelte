<script lang="ts">
    /*
    Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.
    
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at https://mozilla.org/MPL/2.0/.
    */

    import { appState } from "$lib/app_state.svelte";
    import IconButton from "$lib/components/atoms/IconButton.svelte";
    import { getConfig, getTag, setTagState, type LibraryEntry } from "$lib/user_data.svelte";
    import { Disc3, Play } from "@lucide/svelte";
    import Tag from "$lib/components/atoms/Tag.svelte";
    import { convertFileSrc } from "@tauri-apps/api/core";
    import { getMetadata, type Metadata } from "$lib/metadata";
    import { onMount } from "svelte";
    import { requestPlay, setWaitList } from "$lib/playback";
    import { join } from "@tauri-apps/api/path";

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

    function play() {
        setWaitList([entry]);
        requestPlay();
    }

    function onStatusChange(newStatus: "yes" | "no" | "unknown", name: string) {
        setTagState(entry, name, newStatus);
    }

    onMount(async () => {
        if (appState.libraryPath !== null) {
            metadataPromise = getMetadata(await join(appState.libraryPath, entry.path));
        }
    });
</script>

<div class="container" class:odd={index % 2 === 1} style:--cover-color={entry.color}>
    <div class="gradient"></div>
    {#if imageInError || entry.coverPath === null || appState.libraryPath === null}
        <Disc3 stroke="var(--text-darker-1)" width="1rem" height="1rem" />
    {:else}
        {#await join(appState.libraryPath, entry.coverPath) then fullPath}
            <img
                class="cover"
                class:error={imageInError}
                src={convertFileSrc(fullPath)}
                alt={`${entry.name} by ${entry.artist} - cover`}
                onerror={() => (imageInError = true)}
            />
        {/await}
    {/if}
    
    {#await metadataPromise then metadata}
        <span class="name">{metadata?.title ?? metadataDefault.title ?? "-"}</span>
        <span class="artist">{metadata?.artist ?? metadataDefault.artist ?? "-"}</span>
    {/await}
    <div class="tags">
        {#if mode === "classify"}
            {#each getConfig().tags.filter(v => v.name.startsWith(classifyFilter ?? "")) as tag}
                <Tag
                    {tag}
                    mode="classify"
                    status={Object.keys(entry.tags).includes(tag.name)
                        ? entry.tags[tag.name]
                            ? "yes"
                            : "no"
                        : "unknown"}
                    onStatusChange={(newStatus) => onStatusChange(newStatus, tag.name)}
                    size="normal"
                    shrinkable={false}
                />
            {/each}
        {:else if mode === "playback"}
            {#each Object.keys(entry.tags) as tagName}
                {#if entry.tags[tagName] === true}
                    {@const tagEntry = getTag(tagName)}
                    {#if tagEntry !== null}
                        <Tag tag={tagEntry} size="normal" shrinkable />
                    {/if}
                {/if}
            {/each}
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
</div>

<style>
    img.cover {
        width: 1.75rem;
        height: 1.75rem;
        margin: 0.05rem 0;
        object-fit: cover;
        box-shadow: 0 0 4px var(--cover-color, #00000000);
    }

    div.container {
        position: relative;
        padding: 0 1em;
        border-bottom: 1px solid var(--background-lighter-2);
        color: var(--text);
        grid-column: span 5;

        display: grid;
        grid-template-columns: subgrid;
        align-items: center;
    }
    div.container.odd {
        background-color: var(--background-lighter-0);
    }

    div.container > :not(.gradient) {
        z-index: 1;
    }

    div.gradient {
        position: absolute;
        width: 100%;
        height: 100%;
        background: linear-gradient(0.25turn, oklch(from var(--cover-color, #00000000) calc(l - 0.3) c h), #00000000);
        box-shadow: 0 0 4px var(--cover-color, #00000000);
    }

    span.artist,
    span.name {
        padding: 0 0.5em;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    span.artist {
        font-size: 0.875rem;
        color: var(--text-darker-1);
    }

    @media screen and (width <= 600px) {
        span.artist,
        span.name {
            font-size: 0.875rem;
        }
        span.name {
            grid-column: span 4;
        }
        span.artist {
            grid-column: span 5;
            margin-left: 1rem;
        }
        div.tags {
            grid-column: span 4;
        }
    }
</style>
