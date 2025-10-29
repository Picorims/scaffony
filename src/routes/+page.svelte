<script lang="ts">
    import Header from "../lib/components/molecules/header.svelte";

</script>

<main class="container">
    <Header />
</main>

<style>
    :global(body) {
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        width: 100vw;
        max-width: 100vw;
        min-width: 100vw;
        height: 100vh;
        max-height: 100vh;
        min-height: 100vh;
        overflow: hidden;
        font-family: "Quicksand", sans-serif;
    }
</style>
