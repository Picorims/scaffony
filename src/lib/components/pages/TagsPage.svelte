<script lang="ts">
    import { deleteTag, editTag, getConfig, getTagCategories, type TagEntry } from "$lib/user_data.svelte";
    import { Pencil, Trash2 } from "@lucide/svelte";
    import IconButton from "../atoms/IconButton.svelte";
    import Tag from "../atoms/Tag.svelte";
    import Modal from "../atoms/Modal.svelte";
    import { getRandomIcon, ICON_NAMES_KEBAB } from "$lib/lucide";
    import Button from "../atoms/Button.svelte";

    /*
    Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.
    
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at https://mozilla.org/MPL/2.0/.
    */

    let categories = $state<string[]>([]);
    let tags = $state<TagEntry[]>([]);
    let dialog = $state<HTMLDialogElement>(document.createElement('dialog'));
    let editedTag: TagEntry | null = $state<TagEntry | null>(null);

    $effect(() => {
        categories = getTagCategories();
        tags = getConfig().tags;
    });
</script>

<div class="container">
    {#each categories as category}
        <h2>{category}</h2>
        <div class="tag-category">
            {@render tagCategory(category)}
        </div>
    {/each}
</div>

{#snippet tagCategory(category: string)}
    {#each tags.filter(tag => tag.name.startsWith(category + ":")) as tag}
        <div class="tag-entry">
            <!-- force refresh when edited tag value changes -->
            {#key editedTag} 
                <Tag tag={tag} />
            {/key}
            <div class="tag-actions">
                <IconButton onClick={() => {
                    // global search ISSUE_TAG_SPREAD_OPERATOR
                    editedTag = {...tag};
                    dialog.showModal();
                }}>
                    <Pencil />
                </IconButton>
                <IconButton onClick={async () => {
                    // In Tauri, native box functions are asynchronous (return a Promise):
                    // https://github.com/tauri-apps/tauri/issues/12576
                    if (await confirm(`Are you sure you want to delete the tag "${tag.name}"? This action cannot be undone.`)) {
                        deleteTag(tag.name);
                    }
                }}>
                    <Trash2 />
                </IconButton>
            </div>
        </div>
    {/each}
{/snippet}

<Modal bind:dialog title={editedTag ? `Edit Tag: ${editedTag.name}` : "Edit Tag"}>
    <label class="modal-field">
        Name:
        <input id="tag-dialog-text" type="text" value={editedTag?.name ?? ""} />
    </label>
    <label class="modal-field">
        Color:
        <input id="tag-dialog-color" type="color" value={editedTag?.colorHex ?? "#000000"} />
    </label>
    <label class="modal-field">
        Icon:
        <input id="tag-dialog-icon" type="text" value={editedTag?.lucideIcon ?? getRandomIcon()} list="tag-dialog-icons-list" />
    </label>
    <datalist id="tag-dialog-icons-list">
        {#each ICON_NAMES_KEBAB as iconName}
            <option value={iconName}></option>
        {/each}
    </datalist>

    {#snippet buttons()}
        <Button variant="secondary" text="Cancel" onclick={() => {
            editedTag = null;
            dialog.close();
        }} />
        <Button variant="primary" text="Save" onclick={() => {
            const oldName = editedTag?.name;
            const nameInput = document.getElementById("tag-dialog-text") as HTMLInputElement;
            const colorInput = document.getElementById("tag-dialog-color") as HTMLInputElement
            const iconInput = document.getElementById("tag-dialog-icon") as HTMLInputElement;
            if (oldName) {
                const newTag: TagEntry = {
                    name: nameInput.value,
                    colorHex: colorInput.value,
                    lucideIcon: iconInput.value,
                };

                editTag(oldName, newTag);
            }
            editedTag = null;
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

    h2 {
        margin-top: 1em;
        margin-bottom: 0.5em;
        border-top: 1px solid var(--text-darker-1);
    }

    div.tag-entry {
        padding: 0.25em;
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        gap: 0.5em;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid var(--background-lighter-2);
    }
    div.tag-entry:nth-child(odd) {
        background-color: var(--background-lighter-1);
    }

    div.tag-actions {
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