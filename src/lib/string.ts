/*
Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

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
                    "0",
                ].includes(char)) &&
            i !== 0
        ) {
            result += "-";
        }
        result += char.toLowerCase();
    }
    return result;
}
