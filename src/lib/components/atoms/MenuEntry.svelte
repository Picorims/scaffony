<script lang="ts">
    /*
    Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.
    
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at https://mozilla.org/MPL/2.0/.
    */

    import { type Icon as IconType } from "@lucide/svelte";

    interface IProps {
        text: string;
        Icon: typeof IconType;
        active: boolean;
        onclick: () => void;
    }

    const { text, Icon, active, onclick }: IProps = $props();
</script>

<button class:active {onclick}>
    <Icon />
    <span class="text">
        {text}
    </span>
</button>

<style>
    button {
        --border-size: 4px;
        border: none;
        background: none;
        display: flex;
        align-items: center;
        padding: 0.75rem 1rem;
        color: var(--text);
        border-right: var(--border-size) solid transparent;
        transition: 0.1s;
    }
    button:hover {
        background-color: var(--background-lighter-2);
        cursor: pointer;
    }
    button:active {
        background-color: var(--background-lighter-0);
    }
    button.active {
        border-right: var(--border-size) solid var(--primary);
        color: var(--primary);
    }

    span.text {
        margin-left: 0.75rem;
        font-size: 1rem;
    }
</style>