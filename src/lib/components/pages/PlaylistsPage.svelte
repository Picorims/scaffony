<script lang="ts">
    /*
    Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.
    
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at https://mozilla.org/MPL/2.0/.
    */

    import { addPlaylist, deletePlaylist, editPlaylist, getConfig, getTagCategories, type Filter, type FilterExcludesCategory, type FilterExcludesTag, type FilterIncludesCategory, type FilterIncludesTag, type PlaylistEntry } from "$lib/user_data.svelte";
    import { ListVideo, Pencil, Trash2 } from "@lucide/svelte";
    import IconButton from "../atoms/IconButton.svelte";
    import Modal from "../atoms/Modal.svelte";
    import { getRandomIcon, ICON_NAMES_KEBAB } from "$lib/lucide";
    import Button from "../atoms/Button.svelte";
    import LucideIcon from "../atoms/LucideIcon.svelte";
    import { fromKebabToPascalCase } from "$lib/string";
    import { navigateTo } from "$lib/app_state.svelte";

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
                    navigateTo("playlist", playlist.name);
                }}>
                    <ListVideo />
                </IconButton>
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

<Modal bind:dialog title={dialogMode === "add" ? "Add Playlist" : editedPlaylist ? `Edit Playlist: ${editedPlaylist.name}` : "Edit Playlist"}>
    {#if editedPlaylist}
        <label class="modal-field">
            Name:
            <input id="playlist-dialog-text" type="text" value={editedPlaylist.name ?? ""} />
        </label>
            <label class="modal-field">
            Color:
            <input id="playlist-dialog-color" type="color" value={editedPlaylist.colorHex ?? "#000000"} />
        </label>
        <label class="modal-field">
            Icon:
            <input id="playlist-dialog-icon" type="text" value={editedPlaylist.lucideIcon ?? getRandomIcon()} list="playlist-dialog-icons-list" />
        </label>
        <datalist id="playlist-dialog-icons-list">
            {#each ICON_NAMES_KEBAB as iconName}
                <option value={iconName}></option>
            {/each}
        </datalist>

        <fieldset class="filters">
            <legend>
                <h3>Filters</h3>
            </legend>
            <div>

                <select id="">
                    <option value="" disabled selected>Add filter...</option>
                    <option value="includes_tag">Includes Tag</option>
                    <option value="excludes_tag">Excludes Tag</option>
                    <option value="includes_category">Includes Category</option>
                    <option value="excludes_category">Excludes Category</option>
                </select>
                <Button variant="secondary" text="Add Filter" onclick={() => {
                    const select = document.querySelector("fieldset.filters select") as HTMLSelectElement;
                    const selectedValue = select.value;
                    if (selectedValue && editedPlaylist) {
                        let newFilter: unknown; // HACK find a more type-safe way
                        switch (selectedValue) {
                            case "includes_tag":
                                newFilter = { type: "includes_tag", tagName: "" };
                                break;
                            case "excludes_tag":
                                newFilter = { type: "excludes_tag", tagName: "" };
                                break;
                            case "includes_category":
                                newFilter = { type: "includes_category", categoryName: "" };
                                break;
                            case "excludes_category":
                                newFilter = { type: "excludes_category", categoryName: "" };
                                break;
                        }
                        if (newFilter) {
                            editedPlaylist.filters.push(newFilter as Filter); // HACK find a more type-safe way
                        }
                    }
                }} />
            </div>

            {#each editedPlaylist?.filters as filter, index}
                <div class="filter-entry">
                    <h4>{filter.type}</h4>

                    {#if filter.type === "includes_tag" || filter.type === "excludes_tag"}
                        <label
                            >Tag Name:
                            <input
                                type="text"
                                bind:value={(editedPlaylist.filters[index] as FilterIncludesTag | FilterExcludesTag).tag}
                                list="tag-names-list"
                            />
                        </label>
                    {/if}

                    {#if filter.type === "includes_category" || filter.type === "excludes_category"}
                        <label
                            >Category Name:
                            <input
                                type="text"
                                bind:value={(editedPlaylist.filters[index] as FilterIncludesCategory | FilterExcludesCategory).category}
                                list="tag-categories-list"
                            />
                        </label>
                    {/if}

                    <IconButton onClick={() => {
                        editedPlaylist?.filters.splice(index, 1);
                    }}>
                        <Trash2 />
                    </IconButton>
                </div>
                
            {/each}

            <datalist id="tag-names-list">
                {#each getConfig().tags as tag}
                    <option value={tag.name}></option>
                {/each}
            </datalist>

            <datalist id="tag-categories-list">
                {#each getTagCategories() as category}
                    <option value={category}></option>
                {/each}
            </datalist>
        </fieldset>
    {/if}

    {#snippet buttons()}
        <Button variant="secondary" text="Cancel" onclick={() => {
            editedPlaylist = null;
            dialog.close();
        }} />
        <Button variant="primary" text="Save" onclick={() => {
            const oldName = editedPlaylist?.name;
            const nameInput = document.getElementById("playlist-dialog-text") as HTMLInputElement;
            const colorInput = document.getElementById("playlist-dialog-color") as HTMLInputElement
            const iconInput = document.getElementById("playlist-dialog-icon") as HTMLInputElement;

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

    fieldset.filters {
        display: flex;
        flex-direction: column;
        gap: 0.5em;
    }
    div.filter-entry {
        padding: 0.5em;
        background-color: var(--background);
        border-radius: 4px;
        border: 1px solid var(--background-lighter-2);
    }
    div.filter-entry h4 {
        margin-bottom: 0.5em;
    }
</style>