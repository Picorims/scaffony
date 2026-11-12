<script lang="ts">
    import { CUSTOM_ICON_NAMES } from '$lib/lucide';
    import { fromPascalToKebabCase } from '$lib/string';
  import * as icons from '@lucide/svelte';
  import {type IconProps, type Icon as IconType} from '@lucide/svelte';
    import type { Snippet } from 'svelte';

  type CustomIconNames = typeof CUSTOM_ICON_NAMES[number];

  interface Props {
    name: string;
  }
  let { name, ...props }: Props & Omit<IconProps, "iconNode"> = $props();

  // const Icon = (icons as unknown as Record<string, unknown>)[(() => name)()] as unknown as typeof IconType;
  const Icon = $derived((icons as unknown as Record<string, unknown>)[name] as unknown as typeof IconType);
  let nameKebab = $derived(fromPascalToKebabCase(name));

  const customIcons: Record<CustomIconNames, Snippet> = {
    "scaffony-lucide-draft-banjo": scaffonyLucideDraftBanjo,
    "scaffony-lucide-draft-clarinet": scaffonyLucideDraftClarinet,
    "scaffony-lucide-draft-drum-kit": scaffonyLucideDraftDrumKit,
    "scaffony-lucide-draft-flute": scaffonyLucideDraftFlute,
    "scaffony-lucide-draft-guitar-amp": scaffonyLucideDraftGuitarAmp,
    "scaffony-lucide-draft-harmonica": scaffonyLucideDraftHarmonica,
    "scaffony-lucide-draft-harp": scaffonyLucideDraftHarp,
    "scaffony-lucide-draft-lyre": scaffonyLucideDraftLyre,
    "scaffony-lucide-draft-maracas": scaffonyLucideDraftMaracas,
    "scaffony-lucide-draft-saxophone": scaffonyLucideDraftSaxophone,
    "scaffony-lucide-draft-trumpet": scaffonyLucideDraftTrumpet,
    "scaffony-lucide-draft-violin": scaffonyLucideDraftViolin,
    "scaffony-lucide-draft-xylophone": scaffonyLucideDraftXylophone,
  }

  const customIconProps: IconProps = {
    iconNode: [],
    size: 24,
  }

  $effect(() => {
    if (!Icon && name !== "" && !name.startsWith("Scaffony")) {
      console.error(`LucideIcon: Icon with name "${(() => name)()}" does not exist.`);
    }
  });
</script>

{#snippet customIcon(children: Snippet)}
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    {@render children()}
  </svg>
{/snippet}

{#snippet scaffonyLucideDraftBanjo()}
  <!-- https://github.com/lucide-icons/lucide/issues/3227#issuecomment-3102781549 -->  
  <path d="m12.243 20.243-.707-.707" />
  <path d="M14 16h-1" />
  <path d="m17 7-5.464 5.464" />
  <path d="m20 7 1.7-1.7a1 1 0 0 0 0-1.4l-1.6-1.6a1 1 0 0 0-1.4 0L17 4v3z" />
  <path d="M3 16H2" />
  <path d="m4.465 12.465-.708-.708" />
  <path d="m4.465 19.536-.708.707" />
  <path d="m7 16 1 1" />
  <path d="M8 10v1" />
  <path d="M8 21v1" />
  <circle cx="8" cy="16" r="5" />
{/snippet}

{#snippet scaffonyLucideDraftClarinet()}
  <!-- https://github.com/lucide-icons/lucide/issues/3227#issuecomment-6124979091 -->  
  <path d="M12.5 14.5 14 16" />
  <path d="M15.5 11.5 17 13" />
  <path d="m16 5 3 3" />
  <path d="M21.6 2.3a1 1 0 00-1.04-.23l-2.14.78a2 2 0 00-.73.46l-9.57 9.57A7.2 7.2 0 013 15h-.3a.7.7 0 00-.5 1.2l5.6 5.6a.7.7 0 001.2-.5V21a7.24 7.24 0 012.12-5.12l9.57-9.57a2 2 0 00.46-.72l.79-2.14a1 1 0 00-.23-1.05z" />
{/snippet}

{#snippet scaffonyLucideDraftViolin()}
  <!-- https://github.com/lucide-icons/lucide/issues/3227#issuecomment-3102781549 -->  
  <path d="M12 7c2.626 0 5 2.37 5 5 0 1.395-.73 2.546-1.342 3.285a2.5 2.5 0 0 0-2.649 4.218c-.76 1.362-1.88 2.497-4.58 2.497C5.214 22 2 18.786 2 15.571c0-2.7 1.134-3.821 2.496-4.58A2.5 2.5 0 0 0 8.714 8.34C9.453 7.73 10.604 7 12 7" />
  <path d="M19.5 4.5 13 11" />
  <path d="M19.5 4.5h1L22 3l-1-1-1.5 1.5z" />
  <path d="m5 19-3 3" />
{/snippet}

{#snippet scaffonyLucideDraftTrumpet()}
  <!-- https://github.com/lucide-icons/lucide/issues/3227#issuecomment-3102781549 -->  
  <path d="m11 11 1 1" />
  <path d="M14 10 3 21" />
  <path d="M14 10c1-1.5 1.5-5 1-8l7 7c-3-.5-6.5 0-8 1" />
  <path d="m4 22-2-2" />
  <path d="M6.5 17.5a1 1 0 1 0 3 3l6-6a1 1 0 1 0-3-3" />
  <path d="m8 14 1 1" />
{/snippet}

{#snippet scaffonyLucideDraftLyre()}
  <!-- https://github.com/lucide-icons/lucide/issues/3227#issuecomment-3102781549 -->  
  <path d="M12 5v17" />
  <path d="M16 7v14" />
  <path d="M20 2a2 2 0 0 0-2 2c0 3.5 3 4.03 3 9a9 9 0 0 1-18 0c0-4.97 3-5.5 3-9a2 2 0 0 0-2-2" />
  <path d="M5.096 7h13.808" />
  <path d="M8 7v14" />
{/snippet}

{#snippet scaffonyLucideDraftXylophone()}
  <!-- https://github.com/lucide-icons/lucide/issues/3227#issuecomment-2916174242 -->  
  <path d="M10 12a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v9a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1" />
  <path d="M14 4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1" />
  <path d="M17 19H3" />
  <path d="M18 4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1" />
  <path d="M6 4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1" />
  <circle cx="19" cy="19" r="2" />
  <rect x="2" y="3" width="4" height="12" rx="1" />
{/snippet}

{#snippet scaffonyLucideDraftFlute()}
  <!-- https://github.com/lucide-icons/lucide/issues/3227#issuecomment-6124979091 -->  
  <path d="m10 8 1 1" />
  <path d="m11 17 1 1" />
  <path d="M13 7.05 17 11" />
  <path d="m16 4 1 1" />
  <path d="M19.352 2.352a1.205 1.205 0 00-1.704 0L2.352 17.648a1.205 1.205 0 000 1.704l2.296 2.296a1.205 1.205 0 001.704 0L21.648 6.352a1.205 1.205 0 000-1.704z" />
  <path d="m4 14 1 1" />
  <path d="m7 11 1 1" />
  <path d="m8 20 1 1" />
{/snippet}

{#snippet scaffonyLucideDraftGuitarAmp()}
  <!-- https://github.com/lucide-icons/lucide/issues/3227#issuecomment-6124979091 -->  
  <path d="M10 16h.01" />
  <path d="M11.998 12h.01" />
  <path d="M14 16h.01" />
  <path d="M15.995 12h.01" />
  <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
  <path d="M18 16h.01" />
  <path d="M4 5v2" />
  <path d="M6 16h.01" />
  <path d="M8 12h.01" />
  <rect x="2" y="7" width="20" height="14" rx="2" />
{/snippet}


{#snippet scaffonyLucideDraftHarmonica()}
  <!-- https://github.com/lucide-icons/lucide/issues/4809#issuecomment-5560570365 -->  
  <rect width="20" height="10" x="2" y="7" rx="2" />
  <path d="M2 12h20" />
  <path d="M6 10v4" />
  <path d="M10 10v4" />
  <path d="M14 10v4" />
  <path d="M18 10v4" />
{/snippet}

{#snippet scaffonyLucideDraftSaxophone()}
  <!-- https://github.com/lucide-icons/lucide/issues/3227#issuecomment-6152624785 -->
  <path d="M11 17V6a4 4 0 00-4-4H3" />
  <path d="M4 2a3 3 0 013 3v12a5 5 0 0010 0 3 3 0 013-3l-5-5s-4 1.5-4 6" />
  <path d="M7 11H5.5" />
  <path d="M7 15H5.5" />
  <path d="M7 7H5.5" />
{/snippet}

{#snippet scaffonyLucideDraftDrumKit()}
  <!-- https://github.com/lucide-icons/lucide/issues/3227#issuecomment-6152624785 -->
  <path d="M10 5 4 3" />
  <path d="m15 6 6-2" />
  <path d="M15.464 15H20a1 1 0 001-1v-3a1 1 0 00-1-1h-5a1 1 0 00-1 1v2.536" />
  <path d="M18.892 10 18 5.004" />
  <path d="m2 21 1.5-2L5 21" />
  <path d="m20.5 19-.714-4" />
  <path d="m22 21-1.5-2-1.5 2" />
  <path d="m3.497 19 .933-4" />
  <path d="m5.599 10 1.4-6" />
  <path d="M8.536 15H4a1 1 0 01-1-1v-3a1 1 0 011-1h5a1 1 0 011 1v2.536" />
  <circle cx="12" cy="17" r="4" />
{/snippet}

{#snippet scaffonyLucideDraftMaracas()}
  <!-- https://github.com/lucide-icons/lucide/issues/3227#issuecomment-6152624785 -->
  <path d="m16 2-6 6H7.063A3.5 4.444 45 1010 11.063V8" />
  <path d="m20.475 14.475-4.95-4.95" />
  <path d="m3.525 9.525 4.95 4.95" />
  <path d="m8 22 6-6h2.937A3.5 4.444 45 1014 12.938V16" />
{/snippet}

{#snippet scaffonyLucideDraftHarp()}
  <!-- https://github.com/lucide-icons/lucide/issues/3227#issuecomment-6124979091 -->
  <path d="M13 22H3" />
  <path d="M13 4.46v11.749" />
  <path d="M17 3.946v7.306" />
  <path d="M5 22V2.361c5.705-1.964 5.705 4.91 13.31.982 1.902-.982 3.804.982 1.902 3.928L8.328 22" />
  <path d="M9 2.47v18.696" />
{/snippet}

{#if Icon}
  <Icon {...props} />
{:else if (CUSTOM_ICON_NAMES as unknown as string[]).includes(nameKebab)}
  {@render customIcon(customIcons[nameKebab as CustomIconNames])}
{:else}
  <!-- Icon not found -->
{/if}