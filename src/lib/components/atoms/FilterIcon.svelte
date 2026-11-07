<script lang="ts">
    /*
    Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.
    
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at https://mozilla.org/MPL/2.0/.
    */
   
    import type { Filter } from '$lib/user_data.svelte';
    import { TagPlus, TagX, FolderCheck, FolderX, SquaresIntersect, SquaresUnite } from '@lucide/svelte';

    interface Props {
        type: Filter["type"]
    }

    const { type }: Props = $props();
</script>

{@render filterIcon(type)}

{#snippet filterIcon(type: Filter["type"])}
    {#if type === "includes_tag"}
        <TagPlus data-type={type} class="filter-icon" />
    {:else if type === "excludes_tag"}
        <TagX data-type={type} class="filter-icon" />
    {:else if type === "includes_category"}
        <FolderCheck data-type={type} class="filter-icon" />
    {:else if type === "excludes_category"}
        <FolderX data-type={type} class="filter-icon" />
    {:else if type === "all"}
        <SquaresIntersect data-type={type} class="filter-icon" />
    {:else if type === "any"}
        <SquaresUnite data-type={type} class="filter-icon" />
    {/if}
{/snippet}
