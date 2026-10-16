<script lang="ts">
    /*
    Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.
    
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at https://mozilla.org/MPL/2.0/.
    */

    import { appState } from "$lib/app_state.svelte";
    import {
        ActivitySquare,
        Disc3,
        Icon,
        Pause,
        Play,
        SkipBack,
        SkipForward,
        Square,
        StepBack,
        StepForward,
        Tags,
        Volume,
        Volume1,
        Volume2,
        VolumeX,
    } from "@lucide/svelte";
    import IconButton from "../atoms/IconButton.svelte";
    import { convertFileSrc } from "@tauri-apps/api/core";
    import {
        getConfig,
        getEntryAudioPathWithBestExtension,
        getTagCategory,
        setTagState,
        type LibraryEntry,
    } from "$lib/user_data.svelte";
    import { onMount } from "svelte";
    import {
        getCurrentWaitListEntry,
        getNextWaitListEntry,
        getPreviousWaitListEntry,
        onRequestPlay,
        onWaitListUpdated,
    } from "$lib/playback";
    import { platform } from "@tauri-apps/plugin-os";
    import { readFile } from "@tauri-apps/plugin-fs";
    import { join } from "@tauri-apps/api/path";
    import Modal from "../atoms/Modal.svelte";
    import Tag from "../atoms/Tag.svelte";
    import Button from "../atoms/Button.svelte";
    import { getMetadata } from "$lib/metadata";
    import { minutesSeconds } from "$lib/string";

    let paused = $state(true);
    let audioElement = $state<HTMLAudioElement | null>(null);
    let rangePositionElement = $state<HTMLInputElement | null>(null);
    let rangeVolumeElement = $state<HTMLInputElement | null>(null);
    let volume = $state(1);
    let imageOnError = $state(false);
    let activeTrack = $state<LibraryEntry | null>(null);
    let unknownTagsCount = $derived(() => {
        const activeTagsSet = new Set(Object.keys(activeTrack?.tags ?? {}));
        const allTagsSet = new Set(getConfig().tags.map((e) => e.name));
        const unknownTagsSet = allTagsSet.difference(activeTagsSet);
        return unknownTagsSet.size;
    });
    let editTagsDialog = $state<HTMLDialogElement>(
        document.createElement("dialog"),
    );
    let titleSpan = $state<HTMLSpanElement>(document.createElement("span"));

    let currentTimeDisplay = $state("00 : 00");
    let durationDisplay = $state("00 : 00");

    const POSITION_REFRESH_INTERVAL_MS = 500;

    $effect(() => {
        if (audioElement) {
            audioElement.volume = volume;
        }
    });

    $effect(() => {
        imageOnError = false;
        if (audioElement && activeTrack !== null) {
            const loadAudio = async () => {
                // FIXME idk why activeTrack can be undefined.
                if (activeTrack === null || activeTrack === undefined || audioElement === null) {
                    return;
                }
                try {
                    if (appState.libraryPath === null) {
                        paused = true;
                        console.warn("Cannot load audio: library path is null");
                        return;
                    }
                    const audioPath = await getEntryAudioPathWithBestExtension(activeTrack);
                    if (audioPath === "") {
                        return;
                    }
                    if (platform() === "android") {
                        // On Android, if using convertFileSrc directly, it fails to play the audio.
                        // (HTTP 206 on first packet, subsequent packets fail, leading to playback error
                        // "Audio playback error: PipelineStatus::PIPELINE_ERROR_READ: FFmpegDemuxer: data source error")
                        const fileData = await readFile(audioPath);
                        const blob = new Blob([fileData], {
                            type: "audio/mpeg",
                        }); //FIXME mime type
                        const blobUrl = URL.createObjectURL(blob);
                        audioElement.src = blobUrl;
                    } else {
                        audioElement.src = convertFileSrc(audioPath);
                    }
                    audioElement.load();
                    if (!paused) {
                        audioElement.play();
                    }
                } catch (error) {
                    const errorStr =
                        error instanceof Error ? error.message : String(error);
                    console.error("Failed to load audio:" + errorStr);
                    paused = true;
                }
            };
            loadAudio();
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
                        currentTimeDisplay = minutesSeconds(audioElement.currentTime);
                        durationDisplay = minutesSeconds(duration);
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

    function requestTagEdit() {
        if (activeTrack !== null) {
            editTagsDialog.showModal();
        }
    }

    async function getTrackMetadata(track: LibraryEntry | null) {
        console.log(`Looking for track ${track?.name} metadata.`);
        if (appState.libraryPath === null || track === null || track === undefined) {
            return;
        }
        const path = await getEntryAudioPathWithBestExtension(track);
        const meta = await getMetadata(path);
        console.log("got", meta);
        return meta;
    }

    onMount(() => {
        activeTrack = getCurrentWaitListEntry();
        const unsubscribePlay = onRequestPlay(() => {
            console.log("Player - request play");
            activeTrack = getNextWaitListEntry();
            if (paused) {
                togglePause();
            }
        });
        const unsubscribeWaitList = onWaitListUpdated(() => {
            console.log("Player - wait list updated");
            activeTrack = getCurrentWaitListEntry();
        });
        return () => {
            unsubscribePlay();
            unsubscribeWaitList();
        };
    });
</script>

{#snippet editTagButtons()}
    <Button
        text="OK"
        variant="primary"
        onclick={() => editTagsDialog.close()}
    />
{/snippet}
<Modal bind:dialog={editTagsDialog} title="Edit tags" buttons={editTagButtons}>
    {@const tags = getConfig().tags}
    {#each tags as tag, i}
        {@const state = activeTrack?.tags[tag.name]}
        <Tag
            {tag}
            mode="classify"
            size="normal"
            shrinkable={false}
            status={state === undefined ? "unknown" : state ? "yes" : "no"}
            onStatusChange={(s) => {
                if (activeTrack !== null) {
                    setTagState(activeTrack, tag.name, s);
                }
            }}
        />
        <br />
        {#if i + 1 < tags.length && getTagCategory(tags[i + 1].name) !== getTagCategory(tag.name)}
            <br />
        {/if}
    {/each}
</Modal>

<div class="container" class:mobile={platform() === "android"} style:--cover-color={activeTrack?.color}>
    <div class="gradient"></div>
    <div class="meta">
        <div class="cover">
        <!-- FIXME Idk why activeTrack can be undefined -->
            {#if imageOnError || activeTrack === null || activeTrack === undefined || activeTrack?.coverPath === null || appState.libraryPath === null}
                <Disc3 stroke="var(--text-darker-1)" width="48" height="48" />
            {:else}
                {#await join(appState.libraryPath, activeTrack?.coverPath) then fullPath}
                    <img
                        src={activeTrack?.coverPath
                            ? convertFileSrc(fullPath)
                            : ""}
                        alt={`${activeTrack?.name} by ${activeTrack?.artist} - cover`}
                        onerror={() => (imageOnError = true)}
                    />
                {/await}
            {/if}
        </div>
        <div class="meta-text">
            {#if appState.libraryPath !== null && activeTrack !== null}
                {#await getTrackMetadata(activeTrack) then metadata}
                    {@const disc = metadata?.disc_number}
                    {@const track = metadata?.track_number}
                    {@const title = `${metadata?.title ?? activeTrack?.name ?? "-"}`}
                    {@const artist = `by ${metadata?.artist ?? activeTrack?.artist ?? "-"}`}
                    {@const year = metadata?.year ? `${metadata.year}` : ""}
                    {@const album = metadata?.album_name}
                    {@const genre = metadata?.genre
                        ? `, ${metadata?.genre}`
                        : ""}
                    {@const comment = metadata?.comment
                        ? `, ${metadata?.comment}`
                        : ""}
                    <span class="disc-and-title">
                        {#if disc || track}
                            <span class="disc-number">
                                <span class="disc-v">
                                    {disc ?? 1}
                                </span>
                                <span class="track-v">
                                    {track ?? "-"}
                                </span>
                            </span>
                        {/if}

                        <span bind:this={titleSpan} class="title">
                            <span
                                class:scrolling={titleSpan
                                    ? titleSpan.offsetWidth < titleSpan.scrollWidth
                                    : false}>{title}</span
                            >
                        </span>
                    </span>
                    <span class="metadata"><strong>{artist}</strong></span>
                    <span class="metadata">
                        {#if album}
                            from album: {album}
                        {/if}
                    </span>
                    <span class="metadata">
                        {year}{genre}{comment}
                    </span>
                {/await}
            {/if}
        </div>
    </div>
    <div class="controls-middle">
        <div class="controls-m-buttons">
            <IconButton onClick={playPreviousTrack}>
                <StepBack />
            </IconButton>
            <IconButton onClick={seekToStart}>
                <SkipBack />
            </IconButton>
            <div class="emphasis-player-buttons">
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
            </div>
            <IconButton onClick={seekToEnd}>
                <SkipForward />
            </IconButton>
            <IconButton onClick={playNextTrack}>
                <StepForward />
            </IconButton>
            <div class="gap"></div>
            {#if activeTrack !== null}
                <IconButton onClick={requestTagEdit}>
                    <Tags />
                </IconButton>
                <span>{unknownTagsCount()}</span>
            {/if}
        </div>
        <div class="player-range-container">
            <span>{currentTimeDisplay}</span>
            <input
                bind:this={rangePositionElement}
                id="player-position"
                type="range"
                min="0"
                max="100"
                value="0.001"
                oninput={updatePosition}
                class={"monochrome"}
            />
            <span>{durationDisplay}</span>
        </div>
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
            class={"monochrome"}
        />
    </div>
</div>
<audio
    bind:this={audioElement}
    src=""
    crossorigin="anonymous"
    onerror={(e) => {
        console.error(
            `Audio playback error on ${activeTrack?.path} (${audioElement?.src}): ${audioElement?.error?.message}`,
        );
        // Chromium is known to struggle with some FLAC files. Adjusting file metadata may fix it:
        // https://github.com/Sandakan/Nora/issues/280
    }}
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
        position: relative;
        width: 100%;
        flex: 0 0 auto;
        background-color: var(--background-darker-1);
        border-top: 1px solid var(--background-lighter-2);

        display: grid;
        grid-template-columns: repeat(2, 1fr) 128px;
        gap: 4rem;
        box-shadow: 0 0 4px var(--cover-color, #00000000);
    }
    div.container.mobile {
        grid-template-columns: 1fr;
        grid-template-rows: auto auto auto;
        gap: 1rem;
        padding: 0.5rem 1rem;
        padding-bottom: 8vh;
    }

    @media screen and (max-width: 800px) {
        div.container {
            grid-template-columns: 1fr;
            grid-template-rows: auto auto auto;
            gap: 1rem;
            padding: 0.5rem 1rem;
        }
        div.gradient {
            width: 100%;
        }
    }

    div.gradient {
        position: absolute;
        z-index: 0;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
        --background: oklch(from var(--cover-color, #00000000) min(max(calc(l - 0.3), 0.3), 0.5) c h);
        background: linear-gradient(
            to right,
            var(--background),
            oklch(from var(--background) calc(l - 0.3) calc(c - 0.02) calc(h - 30))
        );
    }
    div.container > :not(.gradient) {
        z-index: 1;
    }

    div.meta {
        min-width: 256px;
        height: 100%;
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    div.cover {
        border: 1px solid var(--background-lighter-2);
        width: 6rem;
        height: 6rem;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    img {
        width: 6rem;
        height: 6rem;
        object-fit: cover;
        min-width: 50px;
        min-height: 50px;
        background-color: var(--background-lighter-0);
        box-shadow: 0 0 8px oklch(from var(--cover-color, #00000000) calc(l + 0.5) c h);
    }

    div.meta-text {
        flex: 1 1 auto;
        min-width: 0;
        padding: 0.25rem 0;
        display: flex;
        flex-direction: column;
    }
    span.scrolling {
        position: relative;
        display: inline-block;
        width: min-content;
        animation: 25s linear 0s scrolling infinite;
    }
    @keyframes scrolling {
        0% {
            transform: translateX(0);
        }
        20% {
            transform: translateX(0);
        }
        85% {
            transform: translateX(-100%);
            opacity: 1;
        }
        86% {
            transform: translateX(-100%);
            opacity: 0;
        }
        87% {
            opacity: 0;
            transform: translateX(0);
        }
        99% {
            opacity: 0;
        }
        100% {
            opacity: 1;
        }
    }
    span.disc-and-title {
        display: flex;
        width: 100%;
        gap: 0.5rem;
    }
    span.title {
        flex: 1 1 auto;
    }
    span.title,
    span.metadata {
        white-space: nowrap;
        overflow: hidden;
        /* text-overflow: ellipsis; */
    }
    span.disc-number {
        flex: 0 0 auto;
        display: inline-flex;
        gap: 0.75em;
        border: 1px solid var(--background-lighter-3);
        padding: 0 0.5em;
        border-radius: 1rem;
        background-color: var(--background);
        overflow: hidden;
    }
    span.disc-v {
        position: relative;
        z-index: 10;
    }
    span.disc-v::after {
        content: "";
        position: absolute;
        background-color: var(--background-lighter-3);
        width: 500%;
        height: 500%;
        top: -50%;
        right: 70%;
        z-index: -1;
        transform: rotate(20deg);
    }
    span.title {
        font-weight: bold;
        color: var(--text);
    }
    span.metadata {
        color: var(--text-darker-1);
        font-size: 0.8em;
    }

    div.controls-middle {
        display: flex;
        min-width: 256px;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
    }

    div.controls-m-buttons,
    div.controls-side {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-right: 1rem;
    }

    div.controls-m-buttons {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    div.gap {
        width: 1rem;
    }

    div.emphasis-player-buttons {
        display: flex;
        padding: 0.2rem 0.5rem;
        gap: 1rem;
        border-radius: 6rem;
        background-color: rgb(from var(--text) r g b / 0.25);
        border: 1px solid rgb(from var(--text) r g b / 0.5);
    }

    div.player-range-container {
        display: flex;
        gap: 1rem;
        align-items: center;
        justify-content: center;
        width: 100%;

        & input {
            flex: 1 1 auto;
        }
        & span {
            flex: 0 0 auto;
        }
    }
</style>
