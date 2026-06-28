//! Persisted overlay settings (config.json in the app config dir).
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

/// Global-shortcut accelerators (Code-based, e.g. "Ctrl+Alt+KeyR") — both user-configurable.
#[derive(Serialize, Deserialize, Clone)]
#[serde(default)]
pub struct Hotkeys {
    pub toggle: String,
    pub reset: String,
}

impl Default for Hotkeys {
    fn default() -> Self {
        Self {
            toggle: "Ctrl+Alt+KeyO".into(),
            reset: "Ctrl+Alt+KeyR".into(),
        }
    }
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(default)]
pub struct Config {
    pub hotkeys: Hotkeys,
    pub opacity: f64,
    pub last_rotation_path: Option<String>,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            hotkeys: Hotkeys::default(),
            opacity: 1.0,
            last_rotation_path: None,
        }
    }
}

fn config_path(app: &AppHandle) -> Option<PathBuf> {
    Some(app.path().app_config_dir().ok()?.join("config.json"))
}

pub fn load(app: &AppHandle) -> Config {
    config_path(app)
        .and_then(|p| std::fs::read_to_string(p).ok())
        .and_then(|text| serde_json::from_str(&text).ok())
        .unwrap_or_default()
}

pub fn save(app: &AppHandle, cfg: &Config) {
    let Some(path) = config_path(app) else { return };
    if let Some(dir) = path.parent() {
        let _ = std::fs::create_dir_all(dir);
    }
    if let Ok(text) = serde_json::to_string_pretty(cfg) {
        let _ = std::fs::write(path, text);
    }
}
