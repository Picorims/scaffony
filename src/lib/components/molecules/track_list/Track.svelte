<script lang="ts">
    import { appState } from "$lib/app_state.svelte";
    import IconButton from "$lib/components/atoms/IconButton.svelte";
    import type { LibraryEntry } from "$lib/user_data.svelte";
    import { Play } from "@lucide/svelte";

    /*
    Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.
    
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at https://mozilla.org/MPL/2.0/.
    */

    interface Props {
        entry: LibraryEntry;
        index: number;
    }

    const {entry, index}: Props = $props();

    function play() {
        appState.activeTrack = entry;
    }
</script>

<div class="container" class:odd={index % 2 === 1}>
    <span class="name">{entry.name}</span>
    <span class="artist">{entry.artist}</span>
    <div class="tags"></div>
    <div class="actions">
        <IconButton onClick={play}>
            <Play />
        </IconButton>
    </div>
</div>

<style>
    div.container {
        padding: 0.25em 1em;
        border-bottom: 1px solid var(--background-lighter-2);
        color: var(--text);
        grid-column: span 4;

        display: grid;
        grid-template-columns: subgrid;
    }
    div.container.odd {
        background-color: var(--background-lighter-0);
    }
</style>