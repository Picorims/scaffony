<script lang="ts">
    /*
    Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.
    
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at https://mozilla.org/MPL/2.0/.
    */
    import { fromKebabToPascalCase } from "$lib/string";
    import {
        getCategoryIcon,
        getCategoryTags,
        getConfig,
        getFilteredEntries,
        getTag,
        getTagCategories,
        getTagCategory,
        type Filter,
    } from "$lib/user_data.svelte";

    import { Chart } from "chart.js/auto";
    import { onDestroy, onMount } from "svelte";
    import LucideIcon from "../atoms/LucideIcon.svelte";
    import { Funnel } from "@lucide/svelte";
    import Modal from "../atoms/Modal.svelte";
    import Button from "../atoms/Button.svelte";
    import Filters from "../molecules/Filters.svelte";
    import FilterPreview from "../atoms/FilterPreview.svelte";

    let charts: Chart[] = $state([]);
    let yearHistogramCanvas = $state(document.createElement("canvas"));
    let artistsHistogramCanvas = $state(document.createElement("canvas"));
    let genresHistogramCanvas = $state(document.createElement("canvas"));
    let tagHistogramCanvases: HTMLCanvasElement[] = $state(
        getTagCategories().map((_v) => document.createElement("canvas")),
    );
    let filterDialog = $state(document.createElement("dialog"));
    let sourceTracks = $state(getConfig().library);
    let filter: Filter[] = $state([]);
    let tracks = $derived(getFilteredEntries(sourceTracks, filter));

    onMount(() => {
        const style = window.getComputedStyle(document.body);
        Chart.defaults.borderColor = style.getPropertyValue(
            "--background-lighter-1",
        );
        Chart.defaults.color = style.getPropertyValue("--text-darker-3");
        Chart.defaults.font.family = "Quicksand";
        Chart.defaults.font.size = 16;
        Chart.defaults.datasets.bar.backgroundColor =
            style.getPropertyValue("--secondary");
        Chart.defaults.datasets.bar.hoverBackgroundColor =
            style.getPropertyValue("--primary");
        Chart.defaults.responsive = true;
        createCharts();
    });

    onDestroy(() => {
        clearCharts();
    });

    function clearCharts() {
        for (const chart of charts) {
            chart.destroy();
        }
        charts = [];
    }

    function createCharts() {
        const style = window.getComputedStyle(document.body);

        const yearHistogramData: Record<number, number> =
            getConfig().library.reduce<Record<number, number>>((acc, e) => {
                if (e.metadata === undefined) {
                    return acc;
                }
                if (e.metadata.year === null) {
                    if (acc[0] === undefined) {
                        acc[0] = 0;
                    }
                    acc[0]++;
                    return acc;
                }

                const year = e.metadata.year;
                if (acc[year] === undefined) {
                    acc[year] = 0;
                }
                acc[year]++;

                return acc;
            }, {});

        charts.push(
            new Chart(
                // "TS needs as any": https://www.chartjs.org/docs/latest/getting-started/using-from-node-js.html
                yearHistogramCanvas as any,
                {
                    type: "bar",
                    data: {
                        labels: Object.keys(yearHistogramData),
                        datasets: [
                            {
                                label: "Number of tracks",
                                data: Object.values(yearHistogramData),
                            },
                        ],
                    },
                },
            ),
        );

        const artistsHistogram: Record<string, number> =
            tracks.reduce<Record<string, number>>((acc, e) => {
                if (e.metadata === undefined || e.metadata.artist === null) {
                    return acc;
                }
                const artists = e.metadata.artist
                    .split(",")
                    .map((a) => a.trim());
                for (const artist of artists) {
                    if (acc[artist] === undefined) {
                        acc[artist] = 0;
                    }
                    acc[artist]++;
                }

                return acc;
            }, {});
        const artistsHistogramData: [string, number][] = Object.entries(
            artistsHistogram,
        )
            .sort(([_ka, va], [_kb, vb]) => vb - va)
            .slice(0, 20);

        charts.push(
            new Chart(
                // "TS needs as any": https://www.chartjs.org/docs/latest/getting-started/using-from-node-js.html
                artistsHistogramCanvas as any,
                {
                    type: "bar",
                    data: {
                        labels: artistsHistogramData.map((v) => v[0]),
                        datasets: [
                            {
                                label: "Number of tracks",
                                data: artistsHistogramData.map((v) => v[1]),
                            },
                        ],
                    },
                },
            ),
        );

        const genresHistogram: Record<string, number> =
            tracks.reduce<Record<string, number>>((acc, e) => {
                if (e.metadata === undefined || e.metadata.genre === null) {
                    return acc;
                }
                const genres = e.metadata.genre.split(",").map((a) => a.trim());
                for (const genre of genres) {
                    if (acc[genre] === undefined) {
                        acc[genre] = 0;
                    }
                    acc[genre]++;
                }

                return acc;
            }, {});
        const genresHistogramData: [string, number][] = Object.entries(
            genresHistogram,
        )
            .sort(([_ka, va], [_kb, vb]) => vb - va)
            .slice(0, 20);

        charts.push(
            new Chart(
                // "TS needs as any": https://www.chartjs.org/docs/latest/getting-started/using-from-node-js.html
                genresHistogramCanvas as any,
                {
                    type: "bar",
                    data: {
                        labels: genresHistogramData.map((v) => v[0]),
                        datasets: [
                            {
                                label: "Number of tracks",
                                data: genresHistogramData.map((v) => v[1]),
                            },
                        ],
                    },
                },
            ),
        );

        type TagDataDict = Record<string, {yes: number, maybe: number}>;

        const categories = getTagCategories()
        for (let i = 0; i < categories.length; i++) {
            const category = categories[i];
            const tagData = getCategoryTags(category)
                .reduce<TagDataDict>((acc, tag) => {
                    acc[tag.name] = {yes: 0, maybe: 0};
                    return acc;
                }, {});

            for (const track of tracks) {
                const tags = Object.keys(track.tags);
                for (const tag of tags) {
                    if (getTagCategory(tag) === category) {
                        if (track.tags[tag] === true) {
                            tagData[tag].yes++;
                        }
                    }
                }
                for (const {name} of getCategoryTags(category)) {
                    if (!tags.includes(name)) {
                        tagData[name].maybe++;
                    }
                }
            }

            charts.push(
                new Chart(
                    // "TS needs as any": https://www.chartjs.org/docs/latest/getting-started/using-from-node-js.html
                    tagHistogramCanvases[i] as any,
                    {
                        type: "bar",
                        data: {
                            labels: Object.keys(tagData),
                            datasets: [
                                {
                                    label: "Yes",
                                    data: Object.values(tagData).map(d => d.yes),
                                    backgroundColor: Object.keys(tagData).map(t => getTag(t)?.colorHex + "55"),
                                    borderColor: Object.keys(tagData).map(t => getTag(t)?.colorHex),
                                    borderWidth: 1,
                                    hoverBackgroundColor: Object.keys(tagData).map(t => getTag(t)?.colorHex),
                                    stack: "stack",
                                },
                                {
                                    label: "Maybe",
                                    data: Object.values(tagData).map(d => d.maybe),
                                    stack: "stack",
                                    backgroundColor: "#55555511",
                                    hoverBackgroundColor: "#555555",
                                    borderColor: "#555555",
                                    borderWidth: 1,
                                },
                            ],
                        },
                    },
                ),
            );
        }
    }

    function applyFilter() {
        filterDialog.close();
        clearCharts();
        createCharts();
    }
</script>

<Modal bind:dialog={filterDialog} title="Filter">
    <Filters selectId="stats-filter" mutableFiltersList={filter} />
    {#snippet buttons()}
        <Button variant="primary" text="OK" onclick={applyFilter} />
        <Button variant="secondary" text="Clear" onclick={() => filter = []} />
    {/snippet}
</Modal>

<div class="container">
    <h1>Statistics</h1>

    <div class="header">
        <Button className="filter-button" variant="secondary" text="Filter" onclick={() => filterDialog.showModal()} />
        <Funnel class="filter-icon" />
        <FilterPreview {filter} />
    </div>

    <h2>Tracks by year</h2>
    <canvas bind:this={yearHistogramCanvas} id="year-histogram"></canvas>

    <h2>Most represented artists</h2>
    <canvas bind:this={artistsHistogramCanvas} id="artists-histogram"></canvas>

    <h2>
        Most represented genres (default platforms metadata is not accurate)
    </h2>
    <canvas bind:this={genresHistogramCanvas} id="genres-histogram"></canvas>

    <h2>Tags</h2>
    {#each getTagCategories() as category, i}
        <h3>
            <LucideIcon
                class="category-icon"
                name={fromKebabToPascalCase(getCategoryIcon(category))}
            />
            {category}
        </h3>
        <canvas bind:this={tagHistogramCanvases[i]} id="genres-histogram"
        ></canvas>
    {/each}
</div>

<style>
    div.container {
        padding-top: 1rem;
        display: flex;
        flex-direction: column;
        flex-wrap: nowrap;
        width: 100%;
        height: 100%;
        overflow-y: scroll;
        padding-left: 1rem;
    }

    div.header {
        margin-top: 1rem;
        border: 1px solid var(--background-lighter-3);
        padding: 0.25rem;
        border-radius: 4px;
        width: min-content;
        display: flex;
        align-items: center;
        gap: 0.5rem;

        & :global(svg.filter-icon) {
            stroke: var(--text-darker-6);
        }
    }

    h2, h3 {
        margin-top: 1rem;
    }

    h3 :global(svg.category-icon) {
        vertical-align: middle;
        stroke: var(--text-darker-6);
    }

    canvas {
        max-height: 50vh;
    }

    @media screen and (width <= 600px) {
        div.container {
            padding-top: 0.5rem;
            padding-left: 0.5rem;
        }
    }
</style>
