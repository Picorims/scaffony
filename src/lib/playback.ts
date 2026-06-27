/*
Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import { getConfig, setDataWaitList, type LibraryEntry } from "./user_data.svelte";

let waitList: LibraryEntry[] = [];
let position = -1;
let requestPlayHandlers: (() => void)[] = [];
let waitListUpdatedHandlers: (() => void)[] = [];

export function setWaitList(list: LibraryEntry[]) {
    waitList = [...list];
    position = -1;
    updateDataWaitList();
    waitListUpdated();
    console.log(`Wait list set with ${list.length} entries.`);
}

export function setWaitListFromData() {
    console.log(`Setting Wait list from data... (${waitList.length} entries)`);
    const config = getConfig();
    waitList = [...config.waitList.currentList.map(uuid => config.library.find(e => e.uuid === uuid)).filter(v => v !== undefined)]
    position = config.waitList.position ?? -1;
    waitListUpdated();
    console.log(`Wait list set from data with ${waitList.length} entries.`);
}

function updateDataWaitList() {
    setDataWaitList({
        currentList: waitList.map(e => e.uuid),
        position: position,
    })
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

export function onWaitListUpdated(handler: () => void) {
    waitListUpdatedHandlers.push(handler);
    return () => {
        waitListUpdatedHandlers = waitListUpdatedHandlers.filter(h => h !== handler);
    };
}

function waitListUpdated() {
    for (const handler of waitListUpdatedHandlers) {
        handler();
    }
}

export function getNextWaitListEntry(): LibraryEntry | null {
    if (position + 1 < waitList.length) {
        position += 1;
        console.log(`Advancing to wait list position ${position} with track ${waitList[position].name}.`);
        updateDataWaitList();
        return waitList[position];
    } else {
        console.log(`End of wait list reached at position ${position}.`);
        return null;
    }
}

export function getCurrentWaitListEntry(): LibraryEntry | null {
    let isFirst = false;
    if (position === -1) {
        console.log("Wait list not started, returning the first entry.");
        isFirst = true;
    }
    if (position >= waitList.length) {
        console.log("Cannot return first track of empty waitlist, returning null instead.");
        return null;
    } else if (isFirst) {
        return waitList[0];
    } else {
        return waitList[position];
    }
}

export function getPreviousWaitListEntry(): LibraryEntry | null {
    if (position - 1 >= 0) {
        position -= 1;
        console.log(`Rewinding to wait list position ${position} with track ${waitList[position].name}.`);
        updateDataWaitList();
        return waitList[position];
    } else {
        console.log(`Start of wait list reached at position ${position}.`);
        return null;
    }
}