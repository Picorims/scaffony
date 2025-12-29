<script lang="ts">
    /*
    Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.
    
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at https://mozilla.org/MPL/2.0/.
    */

    import type { LibraryEntry } from "$lib/user_data.svelte";
    import Track from "./Track.svelte";

    interface Props {
        tracks: LibraryEntry[]
    }
    const {tracks}: Props = $props();
</script>

<div class="container">
{#each tracks as track, index}
    <Track entry={track} {index} />
{/each}
</div>

<style>
    div.container {
        overflow-x: hidden;
        overflow-y: scroll;
        background-color: var(--background-darker-0);
        width: 100%;
        height: 100%;
        border-radius: 4px;

        display: grid;
        grid-template-columns: repeat(3, 1fr) 3rem;
        grid-auto-rows: min-content;
    }
</style>