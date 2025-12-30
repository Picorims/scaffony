<script lang="ts">
    /*
    Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.
    
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at https://mozilla.org/MPL/2.0/.
    */

    import { addPlaylist, deletePlaylist, editPlaylist, getConfig, type PlaylistEntry } from "$lib/user_data.svelte";
    import { Pencil, Trash2 } from "@lucide/svelte";
    import IconButton from "../atoms/IconButton.svelte";
    import Modal from "../atoms/Modal.svelte";
    import { getRandomIcon, ICON_NAMES_KEBAB } from "$lib/lucide";
    import Button from "../atoms/Button.svelte";
    import LucideIcon from "../atoms/LucideIcon.svelte";
    import { fromKebabToPascalCase } from "$lib/string";

    let dialog = $state<HTMLDialogElement>(document.createElement('dialog'));
    let dialogMode = $state<"add" | "edit">("add");
    let editedPlaylist = $state<PlaylistEntry | null>(null);
</script>

<div class="container">
    <div class="header">
        <Button variant="accent" text="Add Playlist" onclick={() => {
            editedPlaylist = {
                name: "",
                colorHex: "#000000",
                lucideIcon: getRandomIcon(),
                filters: [],
            };
            dialogMode = "add";
            dialog.showModal();
        }} />
    </div>

    {#each getConfig().playlists as playlist}
        <div class="playlist-entry">
            <div class="meta">
                <div class="cover" style:--color={playlist.colorHex}>
                    <LucideIcon name={fromKebabToPascalCase(playlist.lucideIcon)} />
                </div>
                <span>{playlist.name}</span>
            </div>
            <div class="playlist-actions">
                <IconButton onClick={() => {
                    // global search ISSUE_PLAYLIST_SPREAD_OPERATOR
                    editedPlaylist = {...playlist};
                    editedPlaylist.filters = [...playlist.filters];
                    dialogMode = "edit";
                    dialog.showModal();
                }}>
                    <Pencil />
                </IconButton>
                <IconButton onClick={async () => {
                    // In Tauri, native box functions are asynchronous (return a Promise):
                    // https://github.com/tauri-apps/tauri/issues/12576
                    if (await confirm(`Are you sure you want to delete the playlist "${playlist.name}"? This action cannot be undone.`)) {
                        deletePlaylist(playlist.name);
                    }
                }}>
                    <Trash2 />
                </IconButton>
            </div>
        </div>
    {/each}
</div>

<Modal bind:dialog title={editedPlaylist ? `Edit Tag: ${editedPlaylist.name}` : "Edit Tag"}>
    <label class="modal-field">
        Name:
        <input id="tag-dialog-text" type="text" value={editedPlaylist?.name ?? ""} />
    </label>
        <label class="modal-field">
        Color:
        <input id="tag-dialog-color" type="color" value={editedPlaylist?.colorHex ?? "#000000"} />
    </label>
    <label class="modal-field">
        Icon:
        <input id="tag-dialog-icon" type="text" value={editedPlaylist?.lucideIcon ?? getRandomIcon()} list="tag-dialog-icons-list" />
    </label>
    <datalist id="tag-dialog-icons-list">
        {#each ICON_NAMES_KEBAB as iconName}
            <option value={iconName}></option>
        {/each}
    </datalist>

    {#snippet buttons()}
        <Button variant="secondary" text="Cancel" onclick={() => {
            editedPlaylist = null;
            dialog.close();
        }} />
        <Button variant="primary" text="Save" onclick={() => {
            const oldName = editedPlaylist?.name;
            const nameInput = document.getElementById("tag-dialog-text") as HTMLInputElement;
            const colorInput = document.getElementById("tag-dialog-color") as HTMLInputElement
            const iconInput = document.getElementById("tag-dialog-icon") as HTMLInputElement;

            if (oldName !== undefined) {
                const newPlaylist: PlaylistEntry = {
                    name: nameInput.value,
                    colorHex: colorInput.value,
                    lucideIcon: iconInput.value,
                    filters: editedPlaylist?.filters ?? [],
                };
                if (dialogMode === "add") {
                    addPlaylist(newPlaylist);
                } else if (dialogMode === "edit") {
                    editPlaylist(oldName, newPlaylist);
                }
            }
            editedPlaylist = null;
            dialog.close();
        }} />
    {/snippet}
</Modal>

<style>
    div.container {
        padding: 1em;
        display: flex;
        flex-direction: column;
        flex-wrap: nowrap;
        width: 100%;
        min-width: 0;
        height: 100%;
        overflow-x: hidden;
        overflow-y: auto;
    }

    div.header {
        flex: 0 0 auto;
        margin-bottom: 1em;
    }

    div.playlist-entry {
        padding: 0.25em;
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        gap: 0.5em;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid var(--background-lighter-2);
    }
    div.playlist-entry:nth-child(odd) {
        background-color: var(--background-lighter-1);
    }

    div.meta {
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        gap: 0.5em;
        align-items: center;
    }
    div.cover {
        width: 2rem;
        height: 2rem;
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: var(--background-darker-2);
        border-radius: 2px;
    }
    div.cover > :global(svg) {
        width: 1.5rem;
        height: 1.5rem;
        stroke: var(--color);
    }

    div.playlist-actions {
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        gap: 0.5rem;
    }

    label.modal-field {
        display: flex;
        flex-direction: column;
        margin-bottom: 1em;
        gap: 0.25em;
    }
</style>