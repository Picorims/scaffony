/*
Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import * as icons from "@lucide/svelte";
import { fromPascalToKebabCase } from "./string";

export const ICON_NAMES_KEBAB: string[] = Object.keys(icons).map((name) => fromPascalToKebabCase(name)) as unknown as string[];

export function getRandomIcon(): string {
    const randomIndex = Math.floor(Math.random() * ICON_NAMES_KEBAB.length);
    return ICON_NAMES_KEBAB[randomIndex];
}