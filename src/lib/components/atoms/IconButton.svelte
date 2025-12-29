<script lang="ts">
	/*
    Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.
    
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at https://mozilla.org/MPL/2.0/.
    */

	import type { Snippet } from 'svelte';

	interface Props {
		onClick?: () => void;
		variant?: 'primary' | 'secondary' | 'accent';
		children?: Snippet;
		togglable?: boolean;
		toggled?: boolean;
		onToggle?: (value: boolean) => void;
		alt?: string;
	}

	let {
		onClick = () => {},
		variant = 'primary',
		children,
		togglable = false,
		toggled = false,
		onToggle = () => {},
		alt = ''
	}: Props = $props();

	function handleClick() {
		onClick();
		if (togglable) {
			toggled = !toggled;
			onToggle(toggled);
		}
	}
</script>

<button
	onclick={() => handleClick()}
	type="button"
	role={togglable ? 'switch' : 'button'}
	aria-checked={togglable ? toggled : undefined}
	aria-label={alt}
	class={`icon-button ${variant}`}
	class:toggled={togglable && toggled}
>
	{@render children?.()}
</button>

<style>
	button.icon-button {
		width: 1.5rem;
		height: 1.5rem;
		background: none;
		border: none;
		display: flex;
		justify-content: center;
		align-items: center;
		cursor: pointer;
		transition: 0.1s;
	}

	button.icon-button.accent > :global(svg) {
		stroke: var(--acent);
	}

	button.icon-button:hover > :global(svg) {
		transition: 0.1s;
	}
	button.icon-button.primary:hover > :global(svg),
	button.icon-button.toggled.primary > :global(svg) {
		stroke: var(--primary);
	}
	button.icon-button.secondary:hover > :global(svg),
	button.icon-button.toggled.secondary > :global(svg) {
		stroke: var(--secondary);
	}
	button.icon-button.accent:hover > :global(svg),
	button.icon-button.toggled.accent > :global(svg) {
		stroke: var(--accent);
	}

	button.icon-button:active,
	button.icon-button.toggled {
		transform: scale(0.95);
	}
	button.icon-button.primary.toggled {
		border: 2px solid var(--primary);
	}
	button.icon-button.secondary.toggled {
		border: 2px solid var(--secondary);
	}
	button.icon-button.accent.toggled {
		border: 2px solid var(--accent);
	}
	button.icon-button.toggled:focus-visible {
		border-width: 4px;
	}

	button.icon-button > :global(svg) {
		width: 24px;
		height: 24px;
		stroke: var(--text);
	}
</style>
