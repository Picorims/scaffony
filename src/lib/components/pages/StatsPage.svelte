<script lang="ts">
    import { getConfig } from "$lib/user_data.svelte";
    /*
    Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.
    
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at https://mozilla.org/MPL/2.0/.
    */

    import { Chart, type Plugin } from "chart.js/auto";
    import { onDestroy, onMount } from "svelte";

    let charts: Chart[] = $state([]);
    let yearHistogramDiv = $state(document.createElement("canvas"));

    onMount(() => {
        const style = window.getComputedStyle(document.body);
        Chart.defaults.borderColor = style.getPropertyValue("--background-lighter-1");
        Chart.defaults.color = style.getPropertyValue("--text-darker-3");
        Chart.defaults.font.family = "Quicksand";
        Chart.defaults.font.size = 14;
        Chart.defaults.datasets.bar.backgroundColor = style.getPropertyValue("--secondary");
        Chart.defaults.datasets.bar.hoverBackgroundColor = style.getPropertyValue("--primary");
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
        const yearHistogramData: Record<number, number> = getConfig().library.reduce<Record<number, number>>((acc, e) => {
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

        charts.push(new Chart(
            // "TS needs as any": https://www.chartjs.org/docs/latest/getting-started/using-from-node-js.html
            yearHistogramDiv as any,
            {
                type: "bar",
                data: {
                    labels: Object.keys(yearHistogramData),
                    datasets: [{
                        label: "Number of tracks",
                        data: Object.values(yearHistogramData),

                    }]
                }
            },
        ));
    }
</script>

<div class="container">
    <h1>Statistics</h1>
    <canvas bind:this={yearHistogramDiv} id="year-histogram"></canvas>
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
