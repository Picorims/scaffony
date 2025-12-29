<script lang="ts">
	/*
    Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.
    
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at https://mozilla.org/MPL/2.0/.
    */
	import { onMount, type Snippet } from 'svelte';

	interface Props {
		title?: string;
		children?: Snippet;
		buttons?: Snippet;
		/**
		 * Use bind:dialog to get the dialog element reference.
		 */
		dialog: HTMLDialogElement;
		onOpen?: () => void;
	}

	let {
		title = 'Default Title',
		children,
		buttons,
		dialog = $bindable(),
		onOpen = () => {}
	}: Props = $props();

	function onToggle() {
		if (dialog.open) {
			onOpen();
		}
	}

	onMount(() => {
		dialog.addEventListener('toggle', onToggle);
		return () => {
			dialog.removeEventListener('toggle', onToggle);
		};
	});
</script>

<dialog bind:this={dialog} class="modal">
	<h2 class="title">{title}</h2>

	{@render children?.()}

	<div class="buttons-container">
		{@render buttons?.()}
	</div>
</dialog>

<style>
	dialog.modal::backdrop {
		background-color: rgba(0, 0, 0, 0.5);
		transition: background-color 0.25s ease;
	}

	@starting-style {
		dialog.modal::backdrop {
			background-color: rgba(0, 0, 0, 0);
		}
	}

	dialog.modal {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		padding: 1em;
		margin: 0;
		min-width: 300px;
		color: var(--text);
        background-color: var(--background);
		border: none;
        border-radius: 4px;
	}

	.title {
		text-align: center;
	}

	.buttons-container {
		width: 100%;
		display: flex;
		justify-content: center;
		margin-top: 1em;
        gap: 0.5rem;
	}
</style>
