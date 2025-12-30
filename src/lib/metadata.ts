/*
Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import { invoke } from "@tauri-apps/api/core";

export interface Metadata {
    title: string | null,
    artist: string | null,
    album_name: string | null,
    year: number | null,
    track_number: number | null,
    genre: string | null,
    comment: string | null,
}

let cache: Record<string, Metadata> = {};

export async function getMetadata(path: string): Promise<Metadata> {
    try {
        return cache[path] ?? await invoke<Metadata>("get_audio_metadata", { path }).then((metadata) => {
            cache[path] = metadata;
            return metadata;
        });
    } catch {
        return {
            title: null,
            artist: null,
            album_name: null,
            year: null,
            track_number:null,
            genre: null,
            comment: null,
        }
    }
}