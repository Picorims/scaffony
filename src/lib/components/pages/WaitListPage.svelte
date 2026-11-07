<script lang="ts">
    /*
    Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.
    
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at https://mozilla.org/MPL/2.0/.
    */

    import { getConfig } from "$lib/user_data.svelte";
    import TrackList from "../molecules/track_list/TrackList.svelte";

    let waitListTracks = $derived(getConfig().waitList.currentList.map(uuid => getConfig().library.find(e => e.uuid === uuid)).filter(e => e !== undefined));
</script>

<div class="container">
    <h1>Wait List</h1>
    <TrackList tracks={waitListTracks} notPlayable />
</div>

<style>
    div.container {
        padding-top: 1rem;
        display: flex;
        flex-direction: column;
        flex-wrap: nowrap;
        width: 100%;
        height: 100%;
    }

    h1 {
        margin-left: 1rem;
    }

    @media screen and (width <= 600px) {
        div.container {
            padding-top: 0.5rem;
        }
    }
</style>