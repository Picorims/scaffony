<script lang="ts">
    /*
    Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.
    
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at https://mozilla.org/MPL/2.0/.
    */

    interface IProps {
        text: string;
        onclick?: () => void;
        variant: "primary" | "secondary" | "accent";
        disabled?: boolean
    }

    let { text, onclick, variant, disabled = false }: IProps = $props();
</script>

<button
    {onclick}
    class:primary={variant === "primary"}
    class:secondary={variant === "secondary"}
    class:accent={variant === "accent"}
    {disabled}
>
    {text}
</button>

<style>
    button {
        padding: 0.5em 1em;
        color: var(--text);
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1rem;
        font-weight: bold;
        transition: 0.1s;
    }
    button:active {
        transform: scale(0.98);
    }
    button:disabled {
        cursor: not-allowed;
        opacity: 0.5;
    }

    button.primary {
        background-color: var(--primary);
        color: var(--on-primary);
        box-shadow: 0 2px 4px var(--primary), 0 0 24px rgb(from var(--primary) r g b / 0.5);
    }
    button.primary:hover {
        background-color: var(--primary-darker-1);
    }
    button.primary:active {
        background-color: var(--primary-darker-2);
    }

    button.secondary {
        background-color: var(--secondary);
        box-shadow: 0 1px 2px var(--secondary), 0 0 8px rgb(from var(--secondary) r g b / 0.5);
    }
    button.secondary:hover {
        background-color: var(--secondary-darker-1);
    }
    button.secondary:active {
        background-color: var(--secondary-darker-2);
    }

    button.accent {
        background-color: var(--accent);
        color: var(--on-accent);
        box-shadow: 0 2px 4px var(--accent), 0 0 24px rgb(from var(--accent) r g b / 0.5);
    }
    button.accent:hover {
        background-color: var(--accent-darker-1);
    }
    button.accent:active {
        background-color: var(--accent-darker-2);
    }

    @media screen and (width <= 600px) {
        button {
            padding: 0.4em 0.5em;
        }
    }
</style>
