/*
Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import type { LibraryEntry } from "./user_data.svelte";

let waitList: LibraryEntry[] = [];
let position = -1;
let requestPlayHandlers: (() => void)[] = [];

export function setWaitList(list: LibraryEntry[]) {
    waitList = [...list];
    position = -1;
    console.log(`Wait list set with ${list.length} entries.`);
}

export function onRequestPlay(handler: () => void) {
    requestPlayHandlers.push(handler);
    return () => {
        requestPlayHandlers = requestPlayHandlers.filter(h => h !== handler);
    };
}

export function requestPlay() {
    for (const handler of requestPlayHandlers) {
        handler();
    }
}

export function getNextWaitListEntry(): LibraryEntry | null {
    if (position + 1 < waitList.length) {
        position += 1;
        console.log(`Advancing to wait list position ${position} with track ${waitList[position].name}.`);
        return waitList[position];
    } else {
        console.log(`End of wait list reached at position ${position}.`);
        return null;
    }
}

export function getPreviousWaitListEntry(): LibraryEntry | null {
    if (position - 1 >= 0) {
        position -= 1;
        console.log(`Rewinding to wait list position ${position} with track ${waitList[position].name}.`);
        return waitList[position];
    } else {
        console.log(`Start of wait list reached at position ${position}.`);
        return null;
    }
}