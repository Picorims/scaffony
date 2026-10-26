/*
Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

/**
 * Return a shallow copy of the provided object
 * with keys sorted by JS `sort()` function.
 * @param obj 
 * @returns 
 */
export function objSortedByKey<T extends Record<string, unknown>>(obj: T): T {
    return Object.keys(obj).sort().reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = obj[key];
        return acc;
    }, {}) as T; //besides key ordering, the object structure remains the exact same.
}