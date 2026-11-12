/*
Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import { invoke } from "@tauri-apps/api/core";
import { getEntryAudioPathWithBestExtension, setTrackMetadata, type LibraryEntry } from "./user_data.svelte";

export interface Metadata {
    title: string | null,
    artist: string | null,
    album_name: string | null,
    year: number | null,
    track_number: number | null,
    disc_number: number | null,
    genre: string | null,
    comment: string | null,
    duration: number | null,
}

/**
 * Returns `track.metadata` if defined, or fetch it from best quality audio file,
 * cache it, and return it otherwise.
 * @param track 
 * @returns 
 */
export async function getMetadata(track: LibraryEntry): Promise<Metadata> {
    try {
        if (track.metadata) {
            return track.metadata;
        } else {
            const fullPath = await getEntryAudioPathWithBestExtension(track);
            return await invoke<Metadata>("get_audio_metadata", { path: fullPath }).then((metadata) => {
                metadata.duration = null;
                setTrackMetadata(track, metadata);
                return metadata;
            });
        }
    } catch (e) {
        console.error(`failed to get metadata for ${track.name} (${track.uuid})`, e);
        return {
            title: null,
            artist: null,
            album_name: null,
            year: null,
            track_number: null,
            disc_number: null,
            genre: null,
            comment: null,
            duration: null,
        }
    }
}