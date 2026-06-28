<script lang="ts">
    import Menu from "$lib/components/molecules/Menu.svelte";
    import type { PageType } from "$lib/components/molecules/Page.svelte";
    import Header from "../lib/components/molecules/Header.svelte";
    import Page from "$lib/components/molecules/Page.svelte";
    import { onMount } from "svelte";
    import { getCoverColors, readData, scan } from "$lib/user_data.svelte";
    import { forwardConsoleToLogs } from "$lib/log";
    import Player from "$lib/components/molecules/Player.svelte";
    import { appState } from "$lib/app_state.svelte";
    import { setWaitListFromData } from "$lib/playback";

    let mounted: boolean = $state<boolean>(false);

    onMount(async () => {
        if (mounted) return;
        mounted = true;
        console.log("initializing front...");
        
        forwardConsoleToLogs();
        console.log("Reading data...");
        await readData();
        console.log("Reading wait list...");
        setWaitListFromData();
        console.log("Scanning for file system updates...");
        await scan();
        getCoverColors();
    });
</script>

<div class="root">
    <Header />
    <main>
        {#if appState.menuVisible}
            <Menu />
        {/if}
        <Page activePage={appState.activePage} subPage={appState.activeSubPage} />
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
        overflow: hidden;
    }

    main {
        flex: 1;
        width: 100%;
        height: 100%;
        min-height: 0;

        display: flex;
    }
</style>
