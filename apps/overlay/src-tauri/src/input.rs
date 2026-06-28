//! Passive global keyboard listener (rdev) → canonical keybind strings emitted to the frontend.
//!
//! This only *listens* (never `grab`s/blocks input) and never reads game memory, so it is
//! EAC-safe — it observes the player's own key presses exactly like any hotkey utility.
use rdev::{Event, EventType, Key};
use tauri::{AppHandle, Emitter};

enum Mod {
    Shift,
    Ctrl,
    Alt,
}

fn modifier_of(key: Key) -> Option<Mod> {
    match key {
        Key::ShiftLeft | Key::ShiftRight => Some(Mod::Shift),
        Key::ControlLeft | Key::ControlRight => Some(Mod::Ctrl),
        Key::Alt | Key::AltGr => Some(Mod::Alt),
        _ => None,
    }
}

/// rdev physical key → the editor's canonical base string ("Q", "1", "F3", "Tab", …).
fn base_key(key: Key) -> Option<&'static str> {
    let s = match key {
        Key::KeyA => "A", Key::KeyB => "B", Key::KeyC => "C", Key::KeyD => "D",
        Key::KeyE => "E", Key::KeyF => "F", Key::KeyG => "G", Key::KeyH => "H",
        Key::KeyI => "I", Key::KeyJ => "J", Key::KeyK => "K", Key::KeyL => "L",
        Key::KeyM => "M", Key::KeyN => "N", Key::KeyO => "O", Key::KeyP => "P",
        Key::KeyQ => "Q", Key::KeyR => "R", Key::KeyS => "S", Key::KeyT => "T",
        Key::KeyU => "U", Key::KeyV => "V", Key::KeyW => "W", Key::KeyX => "X",
        Key::KeyY => "Y", Key::KeyZ => "Z",
        Key::Num0 => "0", Key::Num1 => "1", Key::Num2 => "2", Key::Num3 => "3",
        Key::Num4 => "4", Key::Num5 => "5", Key::Num6 => "6", Key::Num7 => "7",
        Key::Num8 => "8", Key::Num9 => "9",
        Key::F1 => "F1", Key::F2 => "F2", Key::F3 => "F3", Key::F4 => "F4",
        Key::F5 => "F5", Key::F6 => "F6", Key::F7 => "F7", Key::F8 => "F8",
        Key::F9 => "F9", Key::F10 => "F10", Key::F11 => "F11", Key::F12 => "F12",
        Key::Tab => "Tab",
        Key::Space => "Space",
        Key::Return => "Enter",
        Key::Escape => "Escape",
        Key::UpArrow => "ArrowUp",
        Key::DownArrow => "ArrowDown",
        Key::LeftArrow => "ArrowLeft",
        Key::RightArrow => "ArrowRight",
        _ => return None,
    };
    Some(s)
}

/// Build the canonical keybind string, matching the editor's `formatKeybind`
/// (modifier order Ctrl+Alt+Shift). Returns None for unmapped keys.
pub fn keybind_string(key: Key, ctrl: bool, alt: bool, shift: bool) -> Option<String> {
    let base = base_key(key)?;
    let mut s = String::new();
    if ctrl {
        s.push_str("Ctrl+");
    }
    if alt {
        s.push_str("Alt+");
    }
    if shift {
        s.push_str("Shift+");
    }
    s.push_str(base);
    Some(s)
}

/// Spawn the rdev listener on a dedicated thread; emits "keydown" with the canonical string.
pub fn spawn_listener(app: AppHandle) {
    std::thread::spawn(move || {
        let mut ctrl = false;
        let mut alt = false;
        let mut shift = false;
        let callback = move |event: Event| match event.event_type {
            EventType::KeyPress(key) => match modifier_of(key) {
                Some(Mod::Shift) => shift = true,
                Some(Mod::Ctrl) => ctrl = true,
                Some(Mod::Alt) => alt = true,
                None => {
                    if let Some(kb) = keybind_string(key, ctrl, alt, shift) {
                        let _ = app.emit("keydown", kb);
                    }
                }
            },
            EventType::KeyRelease(key) => match modifier_of(key) {
                Some(Mod::Shift) => shift = false,
                Some(Mod::Ctrl) => ctrl = false,
                Some(Mod::Alt) => alt = false,
                None => {}
            },
            _ => {}
        };
        if let Err(error) = rdev::listen(callback) {
            eprintln!("[overlay] rdev listen error: {error:?}");
        }
    });
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn matches_editor_format() {
        assert_eq!(keybind_string(Key::KeyQ, false, false, false).as_deref(), Some("Q"));
        assert_eq!(keybind_string(Key::Num1, false, false, false).as_deref(), Some("1"));
        assert_eq!(keybind_string(Key::F3, false, false, false).as_deref(), Some("F3"));
        assert_eq!(keybind_string(Key::KeyZ, false, false, true).as_deref(), Some("Shift+Z"));
        assert_eq!(
            keybind_string(Key::KeyF, true, true, true).as_deref(),
            Some("Ctrl+Alt+Shift+F"),
        );
        assert_eq!(keybind_string(Key::Tab, false, false, false).as_deref(), Some("Tab"));
    }

    #[test]
    fn unmapped_keys_are_none() {
        assert_eq!(keybind_string(Key::PrintScreen, false, false, false), None);
    }
}
