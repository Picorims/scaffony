<script lang="ts">
  import * as icons from '@lucide/svelte';
  import {type IconProps, type Icon as IconType} from '@lucide/svelte';

  interface Props {
    name: string;
  }
  let { name, ...props }: Props & IconProps = $props();

  const Icon = (icons as unknown as Record<string, unknown>)[name] as unknown as typeof IconType;
</script>

<Icon {...props} />