use std::sync::Mutex;

use tauri::{Emitter, Manager, State};
use tauri_plugin_fs::FsExt;

/// Extensions that MarkNotes treats as openable documents.
/// Keep this in sync with MARKDOWN_EXTENSIONS in the frontend (App.jsx)
/// and with the "fileAssociations" list in tauri.conf.json.
const MARKDOWN_EXTENSIONS: [&str; 3] = ["md", "markdown", "txt"];

/// Holds the file path (if any) the app was launched with, so the frontend
/// can pick it up once it has mounted.
struct PendingFile(Mutex<Option<String>>);

/// Picks the first CLI argument that looks like a markdown file path.
/// The very first argument is always the path to the executable itself,
/// so it is always skipped.
fn extract_markdown_arg(args: &[String]) -> Option<String> {
    args.iter()
        .skip(1)
        .find(|arg| {
            let lower = arg.to_lowercase();
            MARKDOWN_EXTENSIONS
                .iter()
                .any(|extension| lower.ends_with(&format!(".{extension}")))
        })
        .cloned()
}

/// Called once by the frontend right after it mounts, to retrieve the file
/// (if any) that was used to launch the app, e.g. via "Open with" or a
/// double-click on a .md file. Returns None on ordinary launches.
#[tauri::command]
fn get_startup_file(app: tauri::AppHandle, state: State<PendingFile>) -> Option<String> {
    let path = state.0.lock().unwrap().take();

    // This file was passed in on the command line (double-click / "Open
    // with"), so it never went through the file dialog — which is what
    // normally grants read access on a picked path. Without this, fs::
    // readTextFile on the frontend gets rejected with "forbidden path".
    if let Some(path) = &path {
        let _ = app.fs_scope().allow_file(path);
    }

    path
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let startup_file = extract_markdown_arg(&std::env::args().collect::<Vec<_>>());

    let mut builder = tauri::Builder::default();

    // The single-instance plugin must be registered before any other plugin.
    // It is desktop-only, hence the cfg guard.
    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            // A second process was launched, e.g. the user double-clicked
            // another .md file while MarkNotes was already running. Forward
            // that file to this (already running) instance and focus it,
            // instead of silently exiting.
            if let Some(path) = extract_markdown_arg(&argv) {
                let _ = app.fs_scope().allow_file(&path);
                let _ = app.emit("open-file", path);
            }

            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_focus();
            }
        }));
    }

    builder
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(PendingFile(Mutex::new(startup_file)))
        .invoke_handler(tauri::generate_handler![get_startup_file])
        .run(tauri::generate_context!())
        .expect("error while running MarkNotes");
}
