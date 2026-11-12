<script lang="ts">
    /*
    Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.
    
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at https://mozilla.org/MPL/2.0/.
    */
    import { type LucideIconNode } from "@lucide/svelte";
    import { appState } from "$lib/app_state.svelte";
    import {
        Disc3,
        Ear,
        Icon,
        Info,
        Pause,
        Play,
        Settings,
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
    getCategoryIcon,
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
        getWaitListPosition,
        getWaitListSize,
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
    import { fromKebabToPascalCase, minutesSeconds } from "$lib/string";
    import ScrollingSpan from "../atoms/ScrollingSpan.svelte";
    import ShrunkTagsByCategory from "./ShrunkTagsByCategory.svelte";
    import AboutModal from "./AboutModal.svelte";
    import LucideIcon from "../atoms/LucideIcon.svelte";

    const DEFAULT_VOLUME = 0.2;
    const POSITION_REFRESH_INTERVAL_MS = 250;

    let aboutDialog: HTMLDialogElement = $state(document.createElement("dialog"));
    let paused = $state(true);
    let audioElement = $state<HTMLAudioElement | null>(null);
    let rangePositionElement = $state<HTMLInputElement | null>(null);
    let rangeVolumeElement = $state<HTMLInputElement | null>(null);
    let volume = $state(DEFAULT_VOLUME);
    let volumeVisible = $state(false);
    let playbackSpeed = $state(1);
    let imageOnError = $state(false);
    let activeTrack = $state<LibraryEntry | null>(null);
    let metadataPromise = $derived(getTrackMetadata(activeTrack));
    let unknownTagsCount = $derived(() => {
        const activeTagsSet = new Set(Object.keys(activeTrack?.tags ?? {}));
        const allTagsSet = new Set(getConfig().tags.map((e) => e.name));
        const unknownTagsSet = allTagsSet.difference(activeTagsSet);
        return unknownTagsSet.size;
    });
    let editTagsDialog = $state<HTMLDialogElement>(
        document.createElement("dialog"),
    );

    let currentTimeDisplay = $state("00 : 00");
    let durationDisplay = $state("00 : 00");


    $effect(() => {
        if (audioElement) {
            audioElement.volume = volume;
            audioElement.playbackRate = playbackSpeed;
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
        const meta = await getMetadata(track);
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

<Modal bind:dialog={editTagsDialog} title="Edit tags" stickyButtons>
    {@const tags = getConfig().tags}
    <div class="edit-tags-container">
        {#each tags as tag, i (tag.name)}
            {#if i === 0 || i > 1 && getTagCategory(tags[i - 1].name) !== getTagCategory(tag.name)}
                <div class="edit-tags-category">
                    <LucideIcon name={fromKebabToPascalCase(getCategoryIcon(getTagCategory(tag.name)))} />
                    <span>{getTagCategory(tag.name)}</span>
                </div>
            {/if}
            {@const state = activeTrack?.tags[tag.name]}
            <Tag
                {tag}
                mode="classify"
                size="normal"
                shrinkable={false}
                expandable
                noMobileView
                forceDisplayCategory
                status={state === undefined ? "unknown" : state ? "yes" : "no"}
                onStatusChange={(s) => {
                    if (activeTrack !== null) {
                        setTagState(activeTrack, tag.name, s);
                    }
                }}
            />
            {#if i + 1 < tags.length && getTagCategory(tags[i + 1].name) !== getTagCategory(tag.name)}
                <div class="edit-tags-gap"></div>
            {/if}
        {/each}
    </div>

    {#snippet buttons()}
        <Button
            text="OK"
            variant="primary"
            onclick={() => editTagsDialog.close()}
        />
    {/snippet}
</Modal>

<div class="container" class:mobile-gap={platform() === "android"} style:--cover-color={activeTrack?.color}>
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
                {#await metadataPromise then metadata}
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

                        <ScrollingSpan cssClass="title" text={title} />
                    </span>
                    <span class="metadata"><strong>{artist}</strong></span>
                    {#if album}
                        <span class="metadata meta-flex">
                            <span>from album: </span>
                            <ScrollingSpan text={album} cssClass="shrinkable" />
                        </span>
                    {/if}
                    <span class="metadata meta-flex">
                        <span>{year}{genre}</span>
                        <ScrollingSpan text={comment} cssClass="shrinkable" />
                    </span>
                {/await}
            {/if}
        </div>
    </div>
    <div class="controls-middle">
        <div class="controls-m-buttons">
            {#key activeTrack}
                {#if getWaitListSize() > 0}
                    <span class="waitlist-pos">{getWaitListPosition()} / {getWaitListSize()}</span>
                {:else}
                    <span class="waitlist-pos">- / -</span>
                {/if}
            {/key}

            <div class="gap"></div>

            <IconButton onClick={playPreviousTrack}>
                <StepBack />
            </IconButton>
            <IconButton onClick={seekToStart}>
                <SkipBack />
            </IconButton>
            <div class="emphasis-player-buttons">
                <IconButton filled onClick={togglePause}>
                    {#if paused}
                        <Play />
                    {:else}
                        <Pause />
                    {/if}
                </IconButton>
                <IconButton filled onClick={stopAudio}>
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
                <div class="volume-button">
                    <IconButton onClick={() => volumeVisible = !volumeVisible}>
                        <Icon>
                            <!-- https://studio.lucide.dev/edit?value=1.LIRgDAdAnAzAHAAgEwggNiiAgjCBWBXAsBMENBEOfUA6vAQxEtNLAFpiA3EBpZViHAIALAFsQeCEiSJyEOHhjtoSZRHgwJUmXKgQQIqCqhqNcLfJEB2SiI1g05pKstPF-JJGvX1m1eIg%2BoZyOkj6miZqEvpKyKgY1irwSFHiXhA%2BMJTuSgHJFmIZWZTBRgHmMMAU9EwsJEIg2STWECIIre0kZCpqlApwaADaQwBEAMYAlgBO4wA2AKajADQA3hMAHqMAXFTLEwCeO1QQYGT70zswAL4AurdAA&name=ear-cog&source=more -->
                            <path d="M10.938 21.691A3.5 3.5 0 016 18.5" />
                            <path d="M15 8.5a1 1 0 00-5 0v1a2 2 0 110 4" />
                            <path d="m15.228 16.853-.923-.383" />
                            <path d="m15.228 19.149-.923.383" />
                            <path d="m16.47 14.306.382.923" />
                            <path d="m16.852 20.773-.383.924" />
                            <path d="m19.148 15.229.383-.923" />
                            <path d="m19.53 21.697-.382-.924" />
                            <path d="m20.773 16.853.924-.383" />
                            <path d="m20.773 19.149.924.383" />
                            <path d="M6 8.5a1 1 0 1113 0 7.4 7.4 0 01-.23 1.886" />
                            <circle cx="18" cy="18.001" r="3" />
                        </Icon>
                    </IconButton>
                </div>
                <IconButton onClick={() => aboutDialog.showModal()}>
                    <Info />
                </IconButton>
                <IconButton onClick={requestTagEdit}>
                    <Tags />
                </IconButton>
                <span>{unknownTagsCount()}</span>
            {/if}
        </div>
        <div class="player-range-container">
            <span class="duration to-right">{currentTimeDisplay}</span>
            <input
                bind:this={rangePositionElement}
                id="player-position"
                type="range"
                min="0"
                max="100"
                value="0.001"
                step="0.01"
                data-ratio={(audioElement?.currentTime ?? 0) / (audioElement?.duration ?? 1)}
                oninput={updatePosition}
                class={"monochrome"}
            />
            <span class="duration">{durationDisplay}</span>
        </div>
        <div class="tags-list">
            {#if activeTrack !== null}
                {#key (activeTrack)}
                    <!-- {#each Object.keys(activeTrack.tags) as tagName (tagName)}
                        {#if activeTrack.tags[tagName] === true}
                            {@const tagEntry = getTag(tagName)}
                            {#if tagEntry !== null}
                                <Tag tag={tagEntry} size="normal" shrinkable forceShrink />
                            {/if}
                        {/if}
                    {/each} -->
                    <ShrunkTagsByCategory entry={activeTrack} />
                {/key}
            {/if}
        </div>
    </div>
    <div class="controls-side" class:hidden={!volumeVisible}>
        <div class="volume-container">
            <span class="volume">{Math.ceil(volume * 100)}</span>
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
                value={DEFAULT_VOLUME}
                data-ratio={volume}
                step="0.001"
                oninput={(e) => {
                    volume = rangeVolumeElement?.valueAsNumber ?? 0.5;
                }}
                class={"monochrome"}
            />
        </div>
        <div class="speed-container">
            <label>
                <span>Speed: </span>
                <select class="speed-select" defaultValue="1" bind:value={playbackSpeed}>
                    <option value="0.25">x0.25</option>
                    <option value="0.5">x0.5</option>
                    <option value="1" selected>x1</option>
                    <option value="1.5">x1.5</option>
                    <option value="2">x2</option>
                    <option value="4">x4</option>
                </select>
            </label>
        </div>
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

{#if activeTrack}
    <AboutModal bind:dialog={aboutDialog} entry={activeTrack} {metadataPromise} />
{/if}

<style>
    div.container {
        --bright-color: oklch(from var(--cover-color, #00000000) max(l, 0.8) c h);
        position: relative;
        width: 100%;
        flex: 0 0 auto;
        background-color: var(--background-darker-1);

        display: grid;
        grid-template-columns: 0.75fr 1.25fr 128px;
        gap: 1.5rem;
        border-top: 2px solid var(--bright-color);
        box-shadow: 0 0 4px rgb(from var(--bright-color) r g b / 0.75),
            0 0 16px rgb(from var(--bright-color, #00000000) r g b / 0.5);
    }
    div.container.mobile-gap {
        grid-template-columns: 1fr;
        grid-template-rows: auto auto auto;
        gap: 1rem;
        padding: 0.5rem 1rem;
        padding-bottom: 8vh;
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
            oklch(from var(--background) max(calc(l - 0.3), 0.1) calc(c - 0.02) calc(h - 30))
        );
        box-shadow: inset 0 0 8px rgb(from var(--bright-color) r g b / 0.75);
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
    span.meta-flex {
        display: inline-flex;
        gap: 1ch;
        & :global(.shrinkable) {
            flex: 1 1 auto;
        }
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
        box-shadow: 0 0 8px var(--bright-color),
            0 0 32px rgb(from var(--bright-color) r g b / 0.45),
            0 0 64px rgb(from var(--bright-color) r g b / 0.25),
            inset 0 0 4px var(--bright-color);
        border: 2px solid var(--bright-color);
        border-top: none;
        border-left: none;
    }

    div.meta-text {
        flex: 1 1 auto;
        min-width: 0;
        padding: 0.25rem 0;
        display: flex;
        flex-direction: column;
    }
    span.disc-and-title {
        display: flex;
        width: 100%;
        gap: 0.5rem;
    }
    span.disc-and-title :global(span.title) {
        flex: 1 1 auto;
    }
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
    span.disc-and-title :global(span.title) {
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
    }

    div.controls-m-buttons {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        margin-right: 1rem;

        & :global(svg) {
            flex: 0 0 auto;
        }
    }

    div.controls-side {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        justify-content: center;
        gap: 0.25rem;
        margin-right: 1rem;

        & :global(svg) {
            flex: 0 0 auto;
        }
    }

    div.volume-container,
    div.speed-container > label {
        display: flex;
        gap: 0.25rem;
        align-items: center;
    }
    select.speed-select {
        flex: 1 1 auto;
        min-width: 3rem;
        height: 1rem;
        padding: 0 0.25rem;
        vertical-align: middle;
    }

    div.controls-m-buttons {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin: 0.2rem 0;
    }

    span.waitlist-pos {
        text-wrap: nowrap;
    }

    div.gap {
        width: 1rem;
    }

    div.emphasis-player-buttons {
        display: flex;
        padding: 0.2rem 0.5rem;
        gap: 1rem;
        border-radius: 6rem;
        background: linear-gradient(125deg, #ffffff22, transparent, #ffffff44, transparent),
            rgb(from var(--text) r g b / 0.25);
        border: 1px solid rgb(from var(--text) r g b / 0.5);
    }

    div.player-range-container {
        display: flex;
        gap: 0.5rem;
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

    span.duration {
        width: 3.5rem;
        &.to-right {
            text-align: right;
        }
    }

    div.tags-list {
        width: 100%;
        text-align: center;
        text-wrap: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
    }

    span.volume {
        width: 2rem;
    }

    div.volume-button {
        display: none;
    }

    div.edit-tags-container {
        display: flex;
        flex-direction: column;
        align-items: stretch;
    }
    div.edit-tags-gap {
        height: 1rem;
    }
    div.edit-tags-category {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        border-top: 1px solid var(--background-lighter-3);
        margin: 0.5rem 0;
        padding-top: 0.5rem;

        & :global(svg) {
            stroke: var(--text-darker-3);
        }
    }

    @media screen and (width <= 1200px) {
        div.controls-m-buttons {
            gap: 0.4rem;
        }
        div.emphasis-player-buttons {
            gap: 0.5rem;
        }
        div.gap {
            width: 0;
        }
        div.controls-side.hidden {
            display: none;
        }
        div.volume-button {
            display: initial;
        }
    }
    
    @media screen and (800px < width <= 1200px) {
        div.container:has(div.controls-side.hidden) {
            grid-template-columns: repeat(2, 1fr) 0;
        }
    }

    @media screen and (width <= 800px) {
        div.container {
            grid-template-columns: 1fr;
            grid-template-rows: auto auto auto;
            gap: 0;
            padding-bottom: 0.25rem;
        }

        div.gradient {
            width: 100%;
        }

        div.meta {
            gap: 0.5rem;
            padding-right: 0.5rem;
        }

        div.cover, img {
            width: 5rem;
            height: 5rem;
        }

        div.controls-side {
            flex-direction: row;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 0.25rem 0.5rem;
            padding-top: 0;
        }

        div.controls-m-buttons {
            gap: 0.4rem;
        }
        div.emphasis-player-buttons {
            gap: 0.5rem;
        }
        div.gap {
            width: 0;
        }
    }
</style>
