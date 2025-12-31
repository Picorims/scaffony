<script lang="ts">
    /*
    Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.
    
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at https://mozilla.org/MPL/2.0/.
    */

    import { appState } from "$lib/app_state.svelte";
    import {
        Disc3,
        Icon,
        Pause,
        Play,
        SkipBack,
        SkipForward,
        Square,
        StepBack,
        StepForward,
        Volume,
        Volume1,
        Volume2,
        VolumeX,
    } from "@lucide/svelte";
    import IconButton from "../atoms/IconButton.svelte";
    import { convertFileSrc } from "@tauri-apps/api/core";
    import type { LibraryEntry } from "$lib/user_data.svelte";
    import { onMount } from "svelte";
    import { getNextWaitListEntry, getPreviousWaitListEntry, onRequestPlay } from "$lib/playback";

    let paused = $state(true);
    let audioElement = $state<HTMLAudioElement | null>(null);
    let rangePositionElement = $state<HTMLInputElement | null>(null);
    let rangeVolumeElement = $state<HTMLInputElement | null>(null);
    let volume = $state(1);
    let imageOnError = $state(false);
    let activeTrack = $state<LibraryEntry | null>(null);

    const POSITION_REFRESH_INTERVAL_MS = 500;

    $effect(() => {
        if (audioElement) {
            audioElement.volume = volume;
        }
    });

    $effect(() => {
        imageOnError = false;
        if (audioElement && activeTrack !== null) {
            audioElement.src = convertFileSrc(activeTrack.path);
            audioElement.load();
            audioElement.play();
            paused = false;
        } else {
            paused = true;
        }
    });

    $effect(() => {
        let interval: number;
        if (audioElement && rangePositionElement) {
            interval = setInterval(() => {
                if (audioElement && rangePositionElement) {
                    const duration = audioElement.duration;
                    if (!isNaN(duration) && duration > 0) {
                        rangePositionElement.max = duration.toString();
                        rangePositionElement.value =
                            audioElement.currentTime.toString();
                    }
                }
            }, POSITION_REFRESH_INTERVAL_MS);
        }
        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    });

    function togglePause() {
        paused = !paused;
        if (audioElement) {
            if (paused) {
                audioElement.pause();
            } else {
                audioElement.play();
            }
        }
    }

    function stopAudio() {
        paused = true;
        if (audioElement) {
            audioElement.pause();
            audioElement.currentTime = 0;
        }
    }

    function seekToStart() {
        if (audioElement) {
            audioElement.currentTime = 0;
        }
    }
    function seekToEnd() {
        if (audioElement) {
            audioElement.currentTime = audioElement.duration;
        }
    }

    function playNextTrack() {
        const newTrack = getNextWaitListEntry();
        if (newTrack !== null) {
            activeTrack = newTrack;
        }
    }
    function playPreviousTrack() {
        const newTrack = getPreviousWaitListEntry();
        if (newTrack !== null) {
            activeTrack = newTrack;
        }
    }

    function updatePosition() {
        if (audioElement && rangePositionElement) {
            audioElement.currentTime = rangePositionElement.valueAsNumber;
        }
    }

    onMount(() => {
        const unsubscribe = onRequestPlay(() => {
            activeTrack = getNextWaitListEntry();
        });
        return () => {
            unsubscribe();
        };
    });
</script>

<div class="container">
    <div class="meta">
        <div class="cover">
            {#if imageOnError}
                <Disc3 stroke="var(--text-darker-1)" width="48" height="48" />
            {:else}
                <img
                    src={activeTrack?.coverPath
                        ? convertFileSrc(activeTrack?.coverPath)
                        : ""}
                    alt={`${activeTrack?.name} by ${activeTrack?.artist} - cover`}
                    onerror={() => (imageOnError = true)}
                />
            {/if}
        </div>
        <div class="meta-text">
            <span class="title">{activeTrack?.name ?? "-"}</span>
            <span class="artist">{activeTrack?.artist ?? "-"}</span>
        </div>
    </div>
    <div class="controls-middle">
        <div class="controls-m-buttons">
            <IconButton onClick={togglePause}>
                {#if paused}
                    <Play />
                {:else}
                    <Pause />
                {/if}
            </IconButton>
            <IconButton onClick={stopAudio}>
                <Square />
            </IconButton>
            <IconButton onClick={playPreviousTrack}>
                <StepBack />
            </IconButton>
            <IconButton onClick={seekToStart}>
                <SkipBack />
            </IconButton>
            <IconButton onClick={seekToEnd}>
                <SkipForward />
            </IconButton>
            <IconButton onClick={playNextTrack}>
                <StepForward />
            </IconButton>
        </div>
        <input
            bind:this={rangePositionElement}
            id="player-position"
            type="range"
            min="0"
            max="100"
            value="0.001"
            oninput={updatePosition}
        />
    </div>
    <div class="controls-side">
        {#if volume === 0}
            <VolumeX />
        {:else if volume < 0.25}
            <Volume />
        {:else if volume < 0.5}
            <Volume1 />
        {:else}
            <Volume2 />
        {/if}
        <input
            bind:this={rangeVolumeElement}
            id="player-volume"
            type="range"
            min="0"
            max="1"
            value="1"
            step="0.001"
            oninput={(e) => {
                volume = rangeVolumeElement?.valueAsNumber ?? 0.5;
            }}
        />
    </div>
</div>
<audio
    bind:this={audioElement}
    src=""
    onended={() => {
        const newTrack = getNextWaitListEntry();
        if (newTrack !== null) {
            activeTrack = newTrack;
        } else {
            paused = true;
        }
    }}
></audio>

<style>
    div.container {
        width: 100%;
        flex: 0 0 auto;
        background-color: var(--background-darker-1);
        border-top: 1px solid var(--background-lighter-2);

        display: grid;
        grid-template-columns: repeat(2, 1fr) 128px;
        gap: 4em;
        padding: 0.5em;
    }

    @media screen and (max-width: 600px) {
        div.container {
            grid-template-columns: 1fr;
            grid-template-rows: auto auto auto;
            gap: 1em;
            padding: 0.5em 1em;
        }
    }

    div.meta {
        min-width: 256px;
        height: 100%;
        display: flex;
        align-items: center;
        gap: 1em;
    }

    div.cover {
        border: 1px solid var(--background-lighter-2);
        width: 48px;
        height: 48px;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    img {
        width: 48px;
        height: 48px;
        object-fit: cover;
        min-width: 50px;
        min-height: 50px;
        background-color: var(--background-lighter-0);
    }

    div.meta-text {
        flex: 1 1 auto;
        min-width: 0;
        display: flex;
        flex-direction: column;
    }
    span.title,
    span.artist {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    span.title {
        font-weight: bold;
        color: var(--text);
    }
    span.artist {
        color: var(--text-darker-1);
        font-size: 0.9em;
    }

    div.controls-middle {
        display: flex;
        min-width: 256px;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.5em;
    }

    div.controls-m-buttons,
    div.controls-side {
        display: flex;
        align-items: center;
        gap: 1em;
        margin-right: 1em;
    }

    div.controls-m-buttons {
        display: flex;
        align-items: center;
        gap: 1em;
    }
</style>
