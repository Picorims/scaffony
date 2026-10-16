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
		variant?: 'primary' | 'secondary' | 'accent' | "correct" | "warning" | "error";
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
		alt = '',
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
		--icon-btn-dominant-color: #ffffff;
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
	button.icon-button.primary {
		--icon-btn-dominant-color: var(--primary);
	}
	button.icon-button.secondary {
		--icon-btn-dominant-color: var(--secondary);
	}
	button.icon-button.accent {
		--icon-btn-dominant-color: var(--accent);
	}
	button.icon-button.correct {
		--icon-btn-dominant-color: var(--correct);
	}
	button.icon-button.error {
		--icon-btn-dominant-color: var(--error);
	}
	button.icon-button.warning {
		--icon-btn-dominant-color: var(--warning);
	}

	@media screen and (width <= 600px) {
		button.icon-button {
			width: 1.3rem;
			height: 1.3rem;
		}
	}

	button.icon-button.accent > :global(svg) {
		stroke: var(--acent);
	}

	button.icon-button:hover > :global(svg) {
		transition: 0.1s;
	}

	button.icon-button:hover > :global(svg),
	button.icon-button.toggled > :global(svg) {
		stroke: var(--icon-btn-dominant-color);
	}

	button.icon-button:active,
	button.icon-button.toggled {
		transform: scale(0.95);
		border: 2px solid var(--icon-btn-dominant-color);
	}

	button.icon-button.toggled:focus-visible {
		border-width: 4px;
	}

	button.icon-button > :global(svg) {
		width: 90%;
		height: 90%;
		stroke: var(--text);
	}
</style>
