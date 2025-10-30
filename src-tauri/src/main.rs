/*
Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // TODO demander dossier depuis front, utiliser scope persistent.
    // + pas de libraries mais librarY dans laquelle la config est stockée + éventuellement lié à d'autre dossiers externes.
    
    // from there, the web part will be launched.
    scaffony_lib::run();
}
