/*
Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
// #[tauri::command]
// fn greet(name: &str) -> String {
//     format!("Hello, {}! You've been greeted from Rust!", name)
// }

use std::path::Path;

use audiotags::Tag;
use serde_json::json;
use serde_json::Value::Null;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(tauri_plugin_log::log::LevelFilter::Info)
                .rotation_strategy(tauri_plugin_log::RotationStrategy::KeepAll)
                .timezone_strategy(tauri_plugin_log::TimezoneStrategy::UseLocal)
                .target(tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::Stdout,
                ))
                .target(tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::LogDir {
                        file_name: Some("logs".to_string()),
                    },
                ))
                .build(),
        )
        .plugin(tauri_plugin_fs::init()) // fs MUST BE before persisted scope!
        .plugin(tauri_plugin_persisted_scope::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_audio_metadata,])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn get_audio_metadata(path: String) -> Result<serde_json::Value, serde_json::Value> {
    println!("Getting audio metadata for file: {}", path);
    let tag = Tag::new()
        .read_from_path(Path::new(&path))
        .map_err(|e| json!({"type": "error", "message": format!("failed to read file {0} - {1}", path, e.to_string())}))?;

    let title = tag.title();
    let artist = tag.artist();
    let album = tag.album();
    let year = tag.year();
    let track_number = tag.track_number();
    let genre = tag.genre();
    let comment = tag.comment();

    let title_json = match title {
        Some(t) if !t.is_empty() => json!(t),
        _ => Null,
    };
    let artist_json = match artist {
        Some(a) if !a.is_empty() => json!(a),
        _ => Null,
    };
    let album_name_json = match album {
        Some(a) => json!(a.title),
        _ => Null,
    };
    let year_json = match year {
        Some(y) => json!(y),
        _ => Null,
    };
    let track_number_json = match track_number {
        Some(tn) => json!(tn),
        _ => Null,
    };
    let genre_json = match genre {
        Some(g) if !g.is_empty() => json!(g),
        _ => Null,
    };
    let comment_json = match comment {
        Some(c) if !c.is_empty() => json!(c),
        _ => Null,
    };

    Ok(json!({
        "title": title_json,
        "artist": artist_json,
        "album_name": album_name_json,
        "year": year_json,
        "track_number": track_number_json,
        "genre": genre_json,
        "comment": comment_json
    }))
}
