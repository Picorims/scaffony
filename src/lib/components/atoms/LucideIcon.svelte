<script lang="ts">
  import * as icons from '@lucide/svelte';
  import {type IconProps, type Icon as IconType} from '@lucide/svelte';
    import { onMount } from 'svelte';

  interface Props {
    name: string;
  }
  let { name, ...props }: Props & IconProps = $props();

  const Icon = (icons as unknown as Record<string, unknown>)[name] as unknown as typeof IconType;

  if (!Icon) {
    console.error(`LucideIcon: Icon with name "${name}" does not exist.`);
  }
</script>

{#if Icon}
  <Icon {...props} />
{:else}
  <!-- Icon not found -->
{/if}