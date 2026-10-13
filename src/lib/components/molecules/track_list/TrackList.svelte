<script lang="ts">
    /*
    Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.
    
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at https://mozilla.org/MPL/2.0/.
    */

    import IconButton from "$lib/components/atoms/IconButton.svelte";
    import type { LibraryEntry } from "$lib/user_data.svelte";
    import { ListVideo, Shuffle } from "@lucide/svelte";
    import Track from "./Track.svelte";
    import { setWaitList, requestPlay } from "$lib/playback";

    interface Props {
        tracks: LibraryEntry[];
        mode?: "playback" | "classify";
        classifyFilter?: string;
    }
    const { tracks, mode = "playback", classifyFilter }: Props = $props();

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
    </div>
    <div class="track-list" class:classify={mode === "classify"}>
        {#each tracks as track, index}
            <Track entry={track} {index} {mode} {classifyFilter} />
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
        flex-wrap: nowrap;
        align-items: center;
        gap: 1rem;
    }
    div.track-list {
        overflow-x: hidden;
        overflow-y: scroll;
        background-color: var(--background-darker-0);
        width: 100%;
        height: 100%;
        border-radius: 4px;

        display: grid;
        grid-template-columns: 2rem 1.5fr 0.5fr 1fr 3rem;
        grid-auto-rows: min-content;
    }
    div.track-list.classify {
        grid-template-columns: 5.5rem 1fr 0.5fr 1.5fr 3rem;
    }
    @media screen and (width <= 600px) {
        div.track-list {
            grid-template-columns: 5.5rem repeat(3, 1fr) 2rem;
        }
    }
</style>
