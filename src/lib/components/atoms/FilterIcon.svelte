<script lang="ts">
    /*
    Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.
    
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at https://mozilla.org/MPL/2.0/.
    */
   
    import type { Filter } from '$lib/user_data.svelte';
    import { TagPlus, TagX, FolderCheck, FolderX, SquaresIntersect, SquaresUnite, Icon, ListPlus } from '@lucide/svelte';

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
    {:else if type === "tag_undefined"}
        <Icon data-type={type} class="filter-icon">
            <path d="M2 15.265c.2-.4.5-.8.9-1a2.1 2.1 0 012.6.4c.3.4.5.8.5 1.3 0 1.3-2 2-2 2" />
            <path d="M4 21.985h.01" />
            <path d="m8.974 18.974 2.316 2.316a2.426 2.426 0 003.42 0l6.58-6.58a2.426 2.426 0 000-3.42l-8.704-8.704A2 2 0 0011.172 2H4a2 2 0 00-2 2v6.323" />
            <circle cx="7.5" cy="7.5" r="0.5" fill="currentColor" />
        </Icon>
    {:else if type === "includes_category"}
        <FolderCheck data-type={type} class="filter-icon" />
    {:else if type === "excludes_category"}
        <FolderX data-type={type} class="filter-icon" />
    {:else if type === "includes_playlist"}
        <ListPlus data-type={type} class="filter-icon" />
    {:else if type === "all"}
        <SquaresIntersect data-type={type} class="filter-icon" />
    {:else if type === "any"}
        <SquaresUnite data-type={type} class="filter-icon" />
    {/if}
{/snippet}
