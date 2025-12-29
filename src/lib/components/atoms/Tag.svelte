<script lang="ts">
    import type { TagEntry } from "$lib/user_data.svelte";
    import { Icon } from "@lucide/svelte";
    import LucideIcon from "./LucideIcon.svelte";
    import { fromKebabToPascalCase } from "$lib/string";

    /*
    Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.
    
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at https://mozilla.org/MPL/2.0/.
    */

    interface Props {
        tag: TagEntry
    }

    let { tag }: Props = $props();
</script>

<div class="tag" style:--color={tag.colorHex}>
    <div class="icon"><LucideIcon name={fromKebabToPascalCase(tag.lucideIcon)} width="0.5em" height="0.5em" stroke={tag.colorHex} /></div>
    <span class="label">{tag.name}</span>
</div>

<style>
    div.tag {
        display: inline-flex;
        align-items: center;
        padding: 0.2em 0.5em;
        border: 1px solid var(--color);
        border-radius: 1em;
        font-size: 0.875em;
        color: var(--text);
        background-color: var(--background-lighter-2);
        margin: 0.2em;
    }
</style>