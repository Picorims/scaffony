<script lang="ts">
    import {
        clearTrackEnd,
        clearTrackStart,
        setTrackEnd,
        setTrackStart,
        type LibraryEntry,
    } from "$lib/user_data.svelte";
    import { audioDir } from "@tauri-apps/api/path";
    /*
    Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.

    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at https://mozilla.org/MPL/2.0/.
    */

    import Button from "../atoms/Button.svelte";
    import Modal from "../atoms/Modal.svelte";

    interface Props {
        dialog: HTMLDialogElement;
        playerPosition: number;
        track: LibraryEntry;
    }

    let { dialog = $bindable(), playerPosition, track }: Props = $props();

    let start = $derived(track.audio?.start ?? undefined);
    let end = $derived(track.audio?.end ?? undefined);
</script>

<Modal bind:dialog title="Edit audio boundaries">
    <div class="edit-audio-container">
        <div>
            <span>Start:</span>
            <span>{start}</span>
            <Button
                variant="secondary"
                text="Now"
                onclick={() => setTrackStart(track, playerPosition)}
            />
            <Button
                variant="secondary"
                text="Clear"
                onclick={() => clearTrackStart(track)}
            />
        </div>
        <div>
            <span>End:</span>
            <span>{end}</span>
            <Button
                variant="secondary"
                text="Now"
                onclick={() => setTrackEnd(track, playerPosition)}
            />
            <Button
                variant="secondary"
                text="Clear"
                onclick={() => clearTrackEnd(track)}
            />
        </div>
        {#if track.metadata !== undefined && track.metadata.duration !== undefined && track.metadata.duration !== null}
            <div
                class="preview"
                data-start={((start ?? 0) / track.metadata.duration)}
                data-end={((end ?? track.metadata.duration) /
                    track.metadata.duration)}
            >
                <div class="pre"></div>
                <div class="mid"></div>
                <div class="end"></div>
            </div>
        {/if}
    </div>

    {#snippet buttons()}
        <Button
            variant="primary"
            text="OK"
            onclick={() => {
                dialog.close();
            }}
        />
    {/snippet}
</Modal>

<style>
    div.edit-audio-container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin-top: 1rem;

        & > div:not(.preview) {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
    }

    div.preview {
        position: relative;
        display: grid;
        width: 100%;
        height: 1rem;
        --start: attr(data-start type(<number>));
        --end: attr(data-end type(<number>));
        grid-template-columns: calc(var(--start) * 100%) calc((var(--end) - var(--start)) * 100%) 1fr;
        

        & div.pre,
        div.end {
            background-color: var(--background-lighter-3);
        }
        & div.mid {
            background-color: var(--text);
        }
    }
</style>
