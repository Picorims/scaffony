<script lang="ts">
    import { fromKebabToPascalCase } from "$lib/string";
    import { getConfig } from "$lib/user_data.svelte";
    import LucideIcon from "./LucideIcon.svelte";

    /*
    Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.
    
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at https://mozilla.org/MPL/2.0/.
    */
</script>

{#each getConfig().tags as tag}
    <option style:--option-color={tag.colorHex} value={tag.name}>
        <LucideIcon name={fromKebabToPascalCase(tag.lucideIcon)} />
        <span>{tag.name.replace(":", " / ")}</span>
    </option>
{/each}