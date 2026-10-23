<script lang="ts">
    import { onDestroy, onMount } from "svelte";

    interface Props {
        text: string;
        cssClass?: string;
    }
    const { text, cssClass }: Props = $props();
    let containerSpan = $state<HTMLSpanElement>(document.createElement("span"));
    let scrolling = $state(false);
    let interval = $state(0);
    
    onMount(() => {
        scrolling = shouldScroll();
        setInterval(() => {
            scrolling = shouldScroll();
        }, 1000);
    });

    onDestroy(() => {
        clearInterval(interval);
    });

    function shouldScroll() {
        return containerSpan
            ? containerSpan.offsetWidth < containerSpan.scrollWidth
            : false;
    }
</script>

<span bind:this={containerSpan} class={`container ${cssClass ?? ""}`}>
    <span
        class:scrolling>{text}</span
    >
</span>

<style>
    span.container {
        white-space: nowrap;
        overflow: hidden;
    }
    span.scrolling {
        position: relative;
        display: inline-block;
        width: min-content;
        animation: 25s linear 0s scrolling infinite;
    }
    @keyframes scrolling {
        0% {
            transform: translateX(0);
        }
        20% {
            transform: translateX(0);
        }
        85% {
            transform: translateX(-100%);
            opacity: 1;
        }
        86% {
            transform: translateX(-100%);
            opacity: 0;
        }
        87% {
            opacity: 0;
            transform: translateX(0);
        }
        99% {
            opacity: 0;
        }
        100% {
            opacity: 1;
        }
    }
</style>