/*
Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import * as icons from "@lucide/svelte";
import { fromPascalToKebabCase } from "./string";

export const CUSTOM_ICON_NAMES = [
    "scaffony-lucide-draft-harmonica",
    "scaffony-lucide-draft-saxophone",
    "scaffony-lucide-draft-harp",
    "scaffony-lucide-draft-maracas",
    "scaffony-lucide-draft-drum-kit",
    "scaffony-lucide-draft-clarinet",
    "scaffony-lucide-draft-flute",
    "scaffony-lucide-draft-guitar-amp",
    "scaffony-lucide-draft-trumpet",
    "scaffony-lucide-draft-banjo",
    "scaffony-lucide-draft-violin",
    "scaffony-lucide-draft-xylophone",
    "scaffony-lucide-draft-lyre",
] as const;

export const ICON_NAMES_KEBAB: string[] = Object.keys(icons)
    .map((name) => fromPascalToKebabCase(name))
    .concat(CUSTOM_ICON_NAMES) as unknown as string[];

export function getRandomIcon(): string {
    const randomIndex = Math.floor(Math.random() * ICON_NAMES_KEBAB.length);
    return ICON_NAMES_KEBAB[randomIndex];
}
