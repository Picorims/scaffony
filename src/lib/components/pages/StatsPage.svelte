<script lang="ts">
    /*
    Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.
    
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at https://mozilla.org/MPL/2.0/.
    */
    import { fromKebabToPascalCase, minutesSeconds } from "$lib/string";
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
    import ChartDataLabels from 'chartjs-plugin-datalabels';
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
    let tracksDurationHistogramCanvas = $state(document.createElement("canvas"));
    let tagHistogramCanvases: HTMLCanvasElement[] = $state(
        getTagCategories().map((_v) => document.createElement("canvas")),
    );
    let filterDialog = $state(document.createElement("dialog"));
    let sourceTracks = $state(getConfig().library);
    let filter: Filter[] = $state([]);
    let tracks = $derived(getFilteredEntries(sourceTracks, filter));
    let tracksSorted = $derived([...tracks].sort((a, b) => Object.keys(a.tags).length - Object.keys(b.tags).length))
    let tagsCount = $derived(getConfig().tags.length);
    let totalMissingCount = $derived(tracks.reduce<number>((acc, v) => acc + (tagsCount - Object.keys(v.tags).length), 0));

    onMount(() => {
        Chart.register(ChartDataLabels);
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
        if (Chart.defaults.plugins.datalabels) {
            Chart.defaults.plugins.datalabels.anchor = "end";
            Chart.defaults.plugins.datalabels.align = "end";
        }
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

        const durationHistogram: Record<string, number> =
            tracks.reduce<Record<string, number>>((acc, e) => {
                let duration = e.metadata?.duration ?? -1;
                let sectionNumber = duration === -1 ? -1 : Math.floor(duration / 30);
                let section = `${sectionNumber}`;
                if (acc[section] === undefined) {
                    acc[section] = 0;
                }
                acc[section]++;
                return acc;
            }, {});
        const durationHistogramData: [string, number][] = Object.entries(
            durationHistogram,
        ).sort(([ka, _va], [kb, _vb]) => parseInt(ka) - parseInt(kb));

        charts.push(
            new Chart(
                // "TS needs as any": https://www.chartjs.org/docs/latest/getting-started/using-from-node-js.html
                tracksDurationHistogramCanvas as any,
                {
                    type: "bar",
                    data: {
                        labels: durationHistogramData.map((v) => {
                            if (v[0] === "-1") {
                                return "Unknown";
                            }
                            const intSection = parseInt(v[0]);
                            return `[${minutesSeconds(intSection * 30).replaceAll(" ", "")} , ${minutesSeconds(intSection * 30 + 30).replaceAll(" ", "")}]`;
                        }),
                        datasets: [
                            {
                                label: "Number of tracks",
                                data: durationHistogramData.map((v) => v[1]),
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

<Modal bind:dialog={filterDialog} title="Filter" stickyButtons>
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
    
    <h2>
        Track durations
    </h2>
    <canvas bind:this={tracksDurationHistogramCanvas} id="tracks-duration-histogram"></canvas>

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

    <h2>Missing tags per track</h2>
    
    <div class="total-completion">
        <span class="completion-title total-title"><strong>Total</strong></span>
        <progress class="total-progress" max={tagsCount * tracksSorted.length} value={(tagsCount * tracksSorted.length) - totalMissingCount}></progress>
        <span class="completion-count total-count">{totalMissingCount} left</span>
        <span class="completion-count">({(tagsCount * tracksSorted.length) - totalMissingCount} / {tagsCount * tracksSorted.length})</span>
    </div>
    <div class="tracks-completion">
        
        {#each tracksSorted as track (track.uuid)}
            {@const count = Object.keys(track.tags).length}
            <span class="completion-title">{track.name}<span class="artist">by {track.metadata?.artist ?? track.artist}</span></span>
            <progress max={tagsCount} value={count}></progress>
            <span class="completion-count">{tagsCount - count}</span>
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

    div.total-completion {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        font-size: 1.5rem;
        margin: 2rem 0;
        border: 1px solid var(--background-lighter-4);
        background-color: var(--background-lighter-1);
        padding: 1rem;
        border-radius: 8px;

        & progress {
            flex: 1 1 auto;
            max-width: 100%;

            &::-webkit-progress-bar {
                background-color: var(--background-lighter-2);
            }
            &::-webkit-progress-value {
                background-color: var(--accent);
            }
        }

        & .total-count {
            color: var(--accent);
            font-weight: bold;
        }
    }

    div.tracks-completion {
        display: grid;
        grid-template-columns: 1fr min-content 5rem;
        align-items: center;

        
        & progress::-webkit-progress-bar {
            background-color: var(--background-lighter-2);
        }
        & progress::-webkit-progress-value {
            background-color: var(--secondary);

            &:hover {
                background-color: var(--primary);
            }
        }
        & span.completion-title {
            padding: 0.1em 0.5em;
            border-radius: 4px;

            & span.artist {
                color: var(--text-darker-6);

                &::before {
                    content: " - "
                }
            }
        }
        & span.completion-title:hover {
            background-color: var(--background-lighter-2);
            & + progress {
                box-shadow: 0 0 0px 4px var(--background-lighter-2);
                border-radius: 2rem;
            }
            & + progress::-webkit-progress-bar {
                background-color: var(--background-lighter-1);
            }
            & + progress::-webkit-progress-value {
                background-color: var(--primary);
            }

            & + progress + span.completion-count {
                color: var(--primary);
                background-color: var(--background-lighter-2);
                font-weight: bold;
            }
        }

        & span.completion-count {
            padding-left: 0.55rem;
            margin-left: -0.05rem;
            font-size: 1.25rem;
            border-radius: 4px;
        }
    }

    @media screen and (width <= 600px) {
        div.container {
            padding-top: 0.5rem;
            padding-left: 0.5rem;
        }
    }
</style>
