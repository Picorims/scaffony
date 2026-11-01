<script lang="ts">
    import { appState } from '$lib/app_state.svelte';
    import type { Metadata } from '$lib/metadata';
    import { getActiveTagKeysWithCategorySeparators, getCategoryByName, getTag, getTagCategory, type LibraryEntry } from '$lib/user_data.svelte';
    import { convertFileSrc } from '@tauri-apps/api/core';
    import Button from '../atoms/Button.svelte';
    import Modal from '../atoms/Modal.svelte';
    import Tag from '../atoms/Tag.svelte';
    import { join } from '@tauri-apps/api/path';
    import { Disc3 } from '@lucide/svelte';

    /*
    Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.
    
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at https://mozilla.org/MPL/2.0/.
    */

    interface Props {
        dialog: HTMLDialogElement;
        entry: LibraryEntry;
        metadataPromise?: Promise<Metadata>;
    }

    let { dialog = $bindable(), metadataPromise, entry }: Props = $props();

    let imageInError = $state(false);
    let metadataDefault = $derived<Metadata>({
        title: entry.name,
        artist: entry.artist,
        album_name: "",
        comment: "",
        genre: "",
        track_number: 0,
        disc_number: 0,
        year: 0,
    });
    let tagKeys = $derived(getActiveTagKeysWithCategorySeparators(entry));

    async function copyTitleAndArtist() {
        const metadata = await metadataPromise;
        let text = `${metadata?.title ?? "?"} by ${metadata?.artist ?? "?"}`;
        if (metadata?.album_name && metadata.album_name !== "") {
            text += ` from album ${metadata.album_name}`;
        }
        await navigator.clipboard.writeText(text);
        alert("Copied to clipboard:\n" + text);
    }
</script>

{#snippet buttons()}
    <Button variant="secondary" text="Copy title & artist" onclick={copyTitleAndArtist} />
    <Button variant="primary" text="OK" onclick={() => dialog.close()} />
{/snippet}

{#snippet metadataRow(title: string, info: number | string | null | undefined )}
    <span>{title}:</span>
    {#if info && info !== ""}
        <span>
            {info}
        </span>
    {:else}
        <span>-</span>
    {/if}
{/snippet}

<Modal bind:dialog={dialog} title="About" buttons={buttons}>
    <div class="about-album-row">
        {#if imageInError || entry.coverPath === null || appState.libraryPath === null}
            <Disc3 class="placeholder" stroke="var(--text-darker-1)" />
        {:else}
            {#await join(appState.libraryPath, entry.coverPath)}
                <div class="cover big"></div>
            {:then fullPath}
                <img
                class="cover-big"
                class:error={imageInError}
                src={convertFileSrc(fullPath)}
                alt={`${entry.name} by ${entry.artist} - cover`}
                onerror={() => (imageInError = true)}
                    />
            {/await}
        {/if}
        <div>
            {#await metadataPromise}
                <span>Loading...</span>
            {:then metadata}
                <p class="about-name"
                    >{metadata?.title ?? metadataDefault.title ?? "-"}</p
                >
                <p class="about-artist"
                    >{metadata?.artist ?? metadataDefault.artist ?? "-"}</p
                >
                <div class="about-meta-list">
                    {@render metadataRow("Album", metadata?.album_name)}
                    {@render metadataRow("Disc number", metadata?.disc_number)}
                    {@render metadataRow("Track number", metadata?.track_number)}
                    {@render metadataRow("Year", metadata?.year)}
                    {@render metadataRow("Genre", metadata?.genre)}
                    {@render metadataRow("Comment", metadata?.comment)}
                </div>
            {/await}
        </div>
    </div>
    <div class="about-tag-row">
        {#each tagKeys as tagKey, index (tagKey === " " ? index : tagKey)}
            {#if index === 0}
                {@const category = getCategoryByName(getTagCategory(tagKey))}
                <span class="about-category">{category.name}</span>
                {/if}
            {#if tagKey === " "}
                {@const category = getCategoryByName(getTagCategory(tagKeys[index + 1]))}
                <br>
                <span class="about-category">{category.name}</span>
            {:else}
                {@const tag = getTag(tagKey)}
                {#if tag !== null}
                    <Tag {tag} shrinkable={false} size="normal" hideCategory />
                {/if}
            {/if}
        {/each}
    </div>
</Modal>

<style>
    div.about-album-row {
        margin-top: 1rem;
        display: flex;
        gap: 1.5rem;
    }
    img.cover-big {
        flex: 0 0 auto;
        width: 16rem;
        height: 16rem;
        border-radius: 8px;
    }
    p.about-name {
        font-size: 2rem;
        margin-bottom: 0.25rem;
        font-weight: 600;
    }
    p.about-artist {
        font-size: 1.5rem;
        margin-bottom: 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid var(--background-lighter-3);
    }
    div.about-meta-list {
        display: grid;
        grid-template-columns: min-content 1fr;
        gap: 0.5rem;

        & span:nth-child(odd) {
            /* label */
            color: var(--text-darker-3);
            text-align: right;
            text-wrap: nowrap;
        }
    }
    div.about-tag-row {
        margin-top: 1rem;
    }
    span.about-category {
        display: inline-block;
        width: 100%;
        border-top: 1px solid var(--background-lighter-3);
        margin: 0.25rem 0;
    }

    @media screen and (width <= 600px) {
        div.about-album-row {
            flex-direction: column;
            align-items: center;
        }
        p.about-name {
            font-size: 1.3rem;
        }
        p.about-artist {
            font-size: 1.1rem;
        }
    }
</style>