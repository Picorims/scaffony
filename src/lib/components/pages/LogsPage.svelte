<script lang="ts">
    /*
    Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.
    
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at https://mozilla.org/MPL/2.0/.
    */

    import { getLogs } from "$lib/user_data.svelte";
    import { onDestroy, onMount } from "svelte";

    let logs: [string, string][] = $state([]);
    let interval = $state(-1);

    onMount(() => {
        interval = setInterval(() => {
            logs = getLogs();
        }, 1000);
    });
    onDestroy(() => {
        clearInterval(interval);
    })
</script>

<div class="container">
    <h1>Logs</h1>

    <div class="logs">
        {#each logs as log, i (i)}
            <span class={log[0]}>
                {log[1]}
            </span>
        {/each}
    </div>
</div>

<style>
    div.container {
        padding-top: 1rem;
        display: flex;
        flex-direction: column;
        flex-wrap: nowrap;
        width: 100%;
        height: 100%;
        padding-left: 1rem;
    }

    div.logs {
        margin-top: 1rem;
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        overflow-y: scroll;

        & :global(span.warn) {
            color: var(--warning);
            background-color: rgb(from var(--warning) r g b / 0.1);
        }
        & :global(span.error) {
            color: var(--error);
            background-color: rgb(from var(--error) r g b / 0.1);
        }
        & :global(span.info) {
            color: var(--primary);
            background-color: rgb(from var(--primary) r g b / 0.1);
        }
    }

    @media screen and (width <= 600px) {
        div.container {
            padding-top: 0.5rem;
            padding-left: 0.5rem;
        }
    }
</style>
