/*
Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import type { LibraryEntry } from "./user_data.svelte"

export interface AppState {
    activeTrack: LibraryEntry | null;
}

export let appState = $state<AppState>({
    activeTrack: null,
});