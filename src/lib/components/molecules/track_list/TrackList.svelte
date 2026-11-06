<script lang="ts">
    /*
    Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.
    
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at https://mozilla.org/MPL/2.0/.
    */

    import IconButton from "$lib/components/atoms/IconButton.svelte";
    import type { LibraryEntry } from "$lib/user_data.svelte";
    import { ArrowDownWideNarrow, ListVideo, Shuffle, TagX } from "@lucide/svelte";
    import Track from "./Track.svelte";
    import { setWaitList, requestPlay } from "$lib/playback";

    interface Props {
        tracks: LibraryEntry[];
        mode?: "playback" | "classify";
        classifyFilter?: string;
        excludeFilter?: string;
    }

    type SortingOption = "by_missing_tag" | "no_sort";

    const { tracks, mode = "playback", classifyFilter, excludeFilter }: Props = $props();
    let sortingOption: SortingOption = $state("no_sort");
    let visibleTracks = $derived((() => {
        if (sortingOption === "by_missing_tag") {
            return [...tracks].sort((a, b) => Object.keys(a.tags).length - Object.keys(b.tags).length);
        } else {
            return tracks;
        }
    })());

    function playAll() {
        setWaitList(tracks);
        requestPlay();
    }
    function playRandom() {
        const shuffled = tracks
            .map(value => ({ value, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ value }) => value);
        setWaitList(shuffled);
        requestPlay();
    }
</script>

<div class="container">
    <div class="track-list-header">
        <IconButton onClick={playAll}>
            <ListVideo />
        </IconButton>
        <IconButton onClick={playRandom}>
            <Shuffle />
        </IconButton>
        <div class="header-separator"></div>
        <ArrowDownWideNarrow class="darker-icon" />
        <select bind:value={sortingOption} >
            <option value="no_sort" selected>No sort</option>
            <option value="by_missing_tag">
                <TagX />
                <span>by missing tag count</span>
            </option>
        </select>
        <div class="header-separator"></div>
        {#if excludeFilter !== undefined}
            <span>{tracks.filter(track => Object.keys(track.tags).filter(t => track.tags[t] === true).find(v => v.startsWith(excludeFilter)) === undefined).length} tracks</span>
        {:else}
            <span>{tracks.length} tracks</span>
        {/if}
    </div>
    <div class="track-list" class:classify={mode === "classify"}>
        {#each visibleTracks as track, index (track.uuid)}
            {@const toExclude = excludeFilter !== undefined && Object.keys(track.tags).filter(t => track.tags[t] === true).find(v => v.startsWith(excludeFilter)) !== undefined}
            {#if !toExclude}
                <Track entry={track} {index} {mode} {classifyFilter} />
            {/if}
        {/each}
    </div>
</div>

<style>
    div.container {
        flex: 1 1 auto;
        min-height: 5rem;
        display: flex;
        flex-direction: column;
        flex-wrap: nowrap;
        width: 100%;
        height: 100%;
        gap: 0.5rem;
    }
    div.track-list-header {
        margin-left: 1rem;
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        align-items: center;
        gap: 1rem;
    }
    div.header-separator {
        width: 0;
        height: 2rem;
        border-left: 1px solid var(--background-lighter-3)
    }
    div.track-list-header :global(svg.darker-icon) {
        stroke: var(--text-darker-6);
    }
    div.track-list {
        overflow-x: hidden;
        overflow-y: scroll;
        background-color: var(--background-darker-0);
        width: 100%;
        height: 100%;
        border-radius: 4px;

        display: grid;
        grid-template-columns: 2rem 1.25fr 10rem 1.25fr 3.5rem;
        grid-auto-rows: min-content;
    }
    div.track-list.classify {
        grid-template-columns: 5.5rem 1fr 0.5fr 1.5fr 3.5rem;
    }
    @media screen and (width <= 600px) {
        div.track-list {
            grid-template-columns: 3.25rem repeat(3, 1fr) 3rem;
        }
        div.track-list.classify {
            grid-template-columns: 3rem 1fr 0.5fr 1.5fr 3rem;
        }
    }
</style>
