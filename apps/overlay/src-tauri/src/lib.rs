mod config;

use std::str::FromStr;
use std::sync::Mutex;

use config::Config;
use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    AppHandle, Emitter, Manager, State,
};
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

struct AppState {
    config: Mutex<Config>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            get_config,
            set_config,
            pick_rotation,
            open_settings,
            get_initial_rotation
        ])
        .setup(|app| {
            let handle = app.handle().clone();
            let cfg = config::load(&handle);

            // Overlay window: click-through so all mouse input passes to the game underneath.
            if let Some(win) = app.get_webview_window("overlay") {
                let _ = win.set_ignore_cursor_events(true);
            }

            // Closing the settings window hides it so the tray can reopen it.
            if let Some(settings) = app.get_webview_window("settings") {
                let hide_target = settings.clone();
                settings.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        let _ = hide_target.hide();
                    }
                });
            }

            app.manage(AppState {
                config: Mutex::new(cfg.clone()),
            });
            apply_hotkeys(&handle, &cfg);
            setup_tray(&handle)?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// --- commands (called from the settings window) ---------------------------------------

#[tauri::command]
fn get_config(state: State<AppState>) -> Config {
    state.config.lock().unwrap().clone()
}

#[tauri::command]
fn set_config(app: AppHandle, state: State<AppState>, config: Config) {
    *state.config.lock().unwrap() = config.clone();
    config::save(&app, &config);
    apply_hotkeys(&app, &config);
    let _ = app.emit("config-changed", config); // overlay applies opacity
}

#[tauri::command]
fn open_settings(app: AppHandle) {
    show_settings(&app);
}

#[tauri::command]
fn pick_rotation(app: AppHandle) {
    load_rotation(&app);
}

/// The overlay calls this on startup to restore the last-loaded rotation.
#[tauri::command]
fn get_initial_rotation(state: State<AppState>) -> Option<serde_json::Value> {
    let path = state.config.lock().unwrap().last_rotation_path.clone()?;
    let text = std::fs::read_to_string(path).ok()?;
    serde_json::from_str(&text).ok()
}

// --- hotkeys --------------------------------------------------------------------------

/// Register the user-configured global shortcuts, replacing any previously registered.
fn apply_hotkeys(app: &AppHandle, cfg: &Config) {
    let gs = app.global_shortcut();
    let _ = gs.unregister_all();
    if let Ok(sc) = Shortcut::from_str(&cfg.hotkeys.toggle) {
        let _ = gs.on_shortcut(sc, |app, _sc, event| {
            if event.state == ShortcutState::Pressed {
                toggle_overlay(app);
            }
        });
    }
}

// --- tray + windows -------------------------------------------------------------------

fn setup_tray(app: &AppHandle) -> tauri::Result<()> {
    let load = MenuItem::with_id(app, "load", "Load rotation…", true, None::<&str>)?;
    let settings = MenuItem::with_id(app, "settings", "Settings…", true, None::<&str>)?;
    let toggle = MenuItem::with_id(app, "toggle", "Toggle overlay", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&load, &settings, &toggle, &quit])?;

    let _tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .tooltip("Skill Overlay")
        .menu(&menu)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "load" => load_rotation(app),
            "settings" => show_settings(app),
            "toggle" => toggle_overlay(app),
            "quit" => app.exit(0),
            _ => {}
        })
        .build(app)?;
    Ok(())
}

fn show_settings(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("settings") {
        let _ = window.show();
        let _ = window.set_focus();
    }
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

/// Open a file dialog, read the chosen `.overlay.json`, remember it, and forward it to the overlay.
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
                        if let Some(state) = app.try_state::<AppState>() {
                            let mut cfg = state.config.lock().unwrap();
                            cfg.last_rotation_path = Some(path.to_string_lossy().into_owned());
                            config::save(&app, &cfg);
                            let _ = app.emit("config-changed", cfg.clone());
                        }
                        let _ = app.emit("load-rotation", value);
                    }
                    Err(e) => eprintln!("[overlay] invalid JSON: {e}"),
                },
                Err(e) => eprintln!("[overlay] read error: {e}"),
            }
        });
}
