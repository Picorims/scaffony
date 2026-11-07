<script lang="ts">
    /*
    Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.
    
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at https://mozilla.org/MPL/2.0/.
    */

    import IconButton from "$lib/components/atoms/IconButton.svelte";
    import { getFilteredEntries, type Filter, type LibraryEntry } from "$lib/user_data.svelte";
    import { ArrowDownWideNarrow, CalendarDays, Disc3, Funnel, ListVideo, Shuffle, TagX, Type, UserRoundPen } from "@lucide/svelte";
    import Track from "./Track.svelte";
    import { setWaitList, requestPlay } from "$lib/playback";
    import Modal from "$lib/components/atoms/Modal.svelte";
    import Button from "$lib/components/atoms/Button.svelte";
    import Filters from "../Filters.svelte";

    interface Props {
        tracks: LibraryEntry[];
        mode?: "playback" | "classify";
        classifyFilter?: string;
        notPlayable?: boolean;
    }

    type SortingOption = "by_missing_tag" | "by_name" | "by_artist" | "by_year" | "by_album" | "no_sort";

    const { tracks, mode = "playback", classifyFilter, notPlayable = false }: Props = $props();
    let sortingOption: SortingOption = $state("no_sort");
    let filterDialog = $state(document.createElement("dialog"));
    let filters: Filter[] = $state([]);

    let filteredTracks = $derived(getFilteredEntries(tracks, filters)); 
    let visibleTracks = $derived((() => {
        // TS is drunk and think it can only be no_sort, because it doesn't understand the `bind:value` on select.
        // Or there is something I don't understand, Idk. But it works and it's a personal project sooooo....
        const option = sortingOption as SortingOption;
        let adaptedTrackList = filteredTracks;
        if (option === "by_missing_tag") {
            adaptedTrackList = [...adaptedTrackList].sort((a, b) => Object.keys(a.tags).length - Object.keys(b.tags).length);
        } else if (option === "by_name") {
            adaptedTrackList = [...adaptedTrackList].sort((a, b) => a.metadata?.title?.localeCompare(b.metadata?.title ?? "") ?? 0);
        } else if (option === "by_artist") {
            adaptedTrackList = [...adaptedTrackList].sort((a, b) => a.metadata?.artist?.localeCompare(b.metadata?.artist ?? "") ?? 0);
        } else if (option === "by_year") {
            adaptedTrackList = [...adaptedTrackList].sort((a, b) => (a.metadata?.year ?? 0) - (b.metadata?.year ?? 0));
        } else if (option === "by_album") {
            adaptedTrackList = [...adaptedTrackList].sort((a, b) => a.metadata?.album_name?.localeCompare(b.metadata?.album_name ?? "") ?? 0);
        }

        return adaptedTrackList;
    })());

    function playAll() {
        setWaitList(visibleTracks);
        requestPlay();
    }
    function playRandom() {
        const shuffled = visibleTracks
            .map(value => ({ value, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ value }) => value);
        setWaitList(shuffled);
        requestPlay();
    }
</script>

<Modal bind:dialog={filterDialog} title="Filter Track List">
    <Filters selectId="track-list-select" mutableFiltersList={filters} />

    {#snippet buttons()}
        <Button variant="primary" text="OK" onclick={() => filterDialog.close()} />
        <Button variant="secondary" text="Clear" onclick={() => filters = []} />
    {/snippet}
</Modal>

<div class="container">
    <div class="track-list-header">
        <IconButton onClick={playAll}>
            <ListVideo />
        </IconButton>
        <IconButton onClick={playRandom}>
            <Shuffle />
        </IconButton>
        <IconButton onClick={() => filterDialog.showModal()}>
            <Funnel />
        </IconButton>
        <div class="header-separator"></div>
        <ArrowDownWideNarrow class="darker-icon" />
        <select bind:value={sortingOption} >
            <option value="no_sort" selected>No sort</option>
            <option value="by_missing_tag">
                <TagX />
                <span>by missing tag count</span>
            </option>
            <option value="by_name">
                <Type />
                <span>by title</span>
            </option>
            <option value="by_artist">
                <UserRoundPen />
                <span>by artist</span>
            </option>
            <option value="by_album">
                <Disc3 />
                <span>by album</span>
            </option>
            <option value="by_year">
                <CalendarDays />
                <span>by year</span>
            </option>
        </select>
        <div class="header-separator"></div>
        <span>{visibleTracks.length} tracks</span>
    </div>
    <div class="track-list" class:classify={mode === "classify"}>
        {#each visibleTracks as track, index (track.uuid)}
            <Track entry={track} {index} {mode} {classifyFilter} {notPlayable} />
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
