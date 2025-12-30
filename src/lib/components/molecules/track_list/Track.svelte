<script lang="ts">
    /*
    Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.
    
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at https://mozilla.org/MPL/2.0/.
    */

    import { appState } from "$lib/app_state.svelte";
    import IconButton from "$lib/components/atoms/IconButton.svelte";
    import { commit, getConfig, type LibraryEntry } from "$lib/user_data.svelte";
    import { Disc3, Play } from "@lucide/svelte";
    import Tag from "$lib/components/atoms/Tag.svelte";
    import { convertFileSrc } from "@tauri-apps/api/core";

    interface Props {
        entry: LibraryEntry;
        index: number;
        mode: "playback" | "classify";
        classifyFilter?: string;
    }

    const { entry = $bindable(), index, mode, classifyFilter }: Props = $props();
    let imageInError = $state(false);

    function play() {
        appState.activeTrack = entry;
    }

    function onStatusChange(newStatus: "yes" | "no" | "unknown", name: string) {
        if (newStatus === "unknown") {
            delete entry.tags[name];
        } else {
            entry.tags[name] = newStatus === "yes";
        }
        commit();
    }
</script>

<div class="container" class:odd={index % 2 === 1}>
    {#if imageInError}
        <Disc3 stroke="var(--text-darker-1)" width="1rem" height="1rem" />
    {:else}
        <img
            class="cover"
            class:error={imageInError}
            src={entry.coverPath ? convertFileSrc(entry.coverPath) : ""}
            alt={`${entry.name} by ${entry.artist} - cover`}
            onerror={() => (imageInError = true)}
        />
    {/if}
    <span class="name">{entry.name}</span>
    <span class="artist">{entry.artist}</span>
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
                />
            {/each}
        {/if}
    </div>
    <div class="actions">
        <IconButton onClick={play}>
            <Play />
        </IconButton>
    </div>
</div>

<style>
    img.cover {
        width: 1rem;
        height: 1rem;
        object-fit: cover;
    }

    div.container {
        padding: 0.25em 1em;
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
</style>
