/*
Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import type { Filter, FilterByType } from "./user_data.svelte";

export function fromKebabToPascalCase(str: string) {
    return str
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join("");
}

export function fromPascalToKebabCase(str: string) {
    const chars = str.split("");
    let result = "";
    for (let i = 0; i < chars.length; i++) {
        const char = chars[i];
        // if it is not a letter
        if (
            (char === char.toUpperCase() ||
                [
                    "0",
                    "1",
                    "2",
                    "3",
                    "4",
                    "5",
                    "6",
                    "7",
                    "8",
                    "9",
                ].includes(char)) &&
            i !== 0
        ) {
            result += "-";
        }
        result += char.toLowerCase();
    }
    return result;
}

export function toHex(rgb: [number, number, number]) {
    return `#${twoDigitHex(rgb[0])}${twoDigitHex(rgb[1])}${twoDigitHex(rgb[2])}`;
}

function twoDigitHex(number: number) {
    let str = number.toString(16);
    if (str.length === 1) {
        str = "0" + str;
    }
    return str;
}

export function minutesSeconds(durationSeconds: number): string {
    let minutes = Math.floor(durationSeconds / 60);
    let seconds = Math.floor(durationSeconds % 60);
    return `${withLeadingZero(minutes)} : ${withLeadingZero(seconds)}`;
}

export function withLeadingZero(value: number): string {
    if (value < 10) {
        return `0${value}`;
    } else {
        return `${value}`;
    }
}

export function hourMinutesLetters(durationSeconds: number): string {
    let hours = Math.floor(durationSeconds / 3600);
    let minutes = Math.floor((durationSeconds / 60) % 60);
    return `${hours}h ${minutes}m`;
}


type ToStringFilterDict = {[P in Filter["type"]]: (filter: FilterByType[P]) => string}

const singleFilterToString: ToStringFilterDict = {
    includes_category: function (f) {
        return `includes_category(${f.category})`;
    },
    includes_tag: function (f) {
        return `includes_tag(${f.tag})`;
    },
    excludes_category: function (f) {
        return `excludes_category(${f.category})`;
    },
    excludes_tag: function (f) {
        return `excludes_tag(${f.tag})`;
    },
    any: function (f) {
        return `(${f.children.map(v => singleFilterToString[v.type](v as unknown as never)).join(" OR ")})`;
    },
    all: function (f) {
        return `(${f.children.map(v => singleFilterToString[v.type](v as unknown as never)).join(" AND ")})`;
    }
}

export function filterToString(filter: Filter[]) {
    return singleFilterToString["all"]({type: "all", children: filter});
}
