<script lang="ts">
    import Menu from "$lib/components/molecules/Menu.svelte";
    import type { PageType } from "$lib/components/molecules/Page.svelte";
    import Header from "../lib/components/molecules/Header.svelte";
    import Page from "$lib/components/molecules/Page.svelte";
    import { onMount } from "svelte";
    import { readData, scan } from "$lib/user_data.svelte";
    import { forwardConsoleToLogs } from "$lib/log";
    import Player from "$lib/components/molecules/Player.svelte";

    let activePage = $state<PageType>("library");
    let mounted: boolean = $state<boolean>(false);

    onMount(() => {
        if (mounted) return;
        mounted = true;
        console.log("initializing front...");
        
        forwardConsoleToLogs();
        readData();
        scan();
    });
</script>

<div class="root">
    <Header />
    <main>
        <Menu onnavigate={(p) => activePage = p} />
        <Page {activePage} />
    </main>
    <Player />
</div>

<style>
    :global(body) {
        margin: 0;
        padding: 0;
        width: 100vw;
        max-width: 100vw;
        min-width: 100vw;
        height: 100vh;
        max-height: 100vh;
        min-height: 100vh;
        overflow: hidden;
        font-family: "Quicksand", sans-serif;
    }

    .root {
        display: flex;
        flex-direction: column;
        width: 100vw;
        height: 100vh;
    }

    main {
        flex: 1;
        width: 100%;
        height: 100%;
        min-height: 0;

        display: flex;
    }
</style>
