mod input;

use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    AppHandle, Emitter, Manager,
};
use tauri_plugin_dialog::DialogExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            // Overlay window: click-through so all mouse input passes to the game underneath.
            if let Some(win) = app.get_webview_window("overlay") {
                let _ = win.set_ignore_cursor_events(true);
            }
            // Passive global key listener → "keydown" events (EAC-safe; listen-only).
            input::spawn_listener(app.handle().clone());
            // System tray.
            setup_tray(app.handle())?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn setup_tray(app: &AppHandle) -> tauri::Result<()> {
    let load = MenuItem::with_id(app, "load", "Load rotation…", true, None::<&str>)?;
    let reset = MenuItem::with_id(app, "reset", "Reset rotation", true, None::<&str>)?;
    let toggle = MenuItem::with_id(app, "toggle", "Toggle overlay", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&load, &reset, &toggle, &quit])?;

    let _tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .tooltip("Skill Overlay")
        .menu(&menu)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "load" => load_rotation(app),
            "reset" => {
                let _ = app.emit("reset-rotation", ());
            }
            "toggle" => toggle_overlay(app),
            "quit" => app.exit(0),
            _ => {}
        })
        .build(app)?;
    Ok(())
}

fn toggle_overlay(app: &AppHandle) {
    if let Some(win) = app.get_webview_window("overlay") {
        if win.is_visible().unwrap_or(true) {
            let _ = win.hide();
        } else {
            let _ = win.show();
        }
    }
}

/// Open a file dialog, read the chosen `.overlay.json`, and forward it to the overlay window.
fn load_rotation(app: &AppHandle) {
    let app = app.clone();
    app.dialog()
        .file()
        .add_filter("Overlay export", &["json"])
        .pick_file(move |selected| {
            let Some(path) = selected.and_then(|p| p.into_path().ok()) else {
                return;
            };
            match std::fs::read_to_string(&path) {
                Ok(text) => match serde_json::from_str::<serde_json::Value>(&text) {
                    Ok(value) => {
                        let _ = app.emit("load-rotation", value);
                    }
                    Err(e) => eprintln!("[overlay] invalid JSON: {e}"),
                },
                Err(e) => eprintln!("[overlay] read error: {e}"),
            }
        });
}
