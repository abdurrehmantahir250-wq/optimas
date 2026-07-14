use rusqlite::{Connection, Result as SqliteResult};
use std::fs;
use std::path::{Path, PathBuf};
use chrono::{DateTime, Local};
use serde_json::json;
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BrowserHistory {
    pub browser: String,
    pub url: String,
    pub title: String,
    pub visit_time: String,
    pub visit_count: i32,
}

pub struct BrowserHistoryCollector;

impl BrowserHistoryCollector {
    pub fn collect_all_history() -> Vec<BrowserHistory> {
        let mut all_history = Vec::new();

        // Collect Chrome history
        all_history.extend(Self::collect_chrome_history());

        // Collect Edge history
        all_history.extend(Self::collect_edge_history());

        // Collect Firefox history
        all_history.extend(Self::collect_firefox_history());

        // Sort by visit time descending
        all_history.sort_by(|a, b| b.visit_time.cmp(&a.visit_time));

        all_history
    }

    // YEH FUNCTION FILE LOCKING FIX KARTA HAI
    fn open_unlocked_sqlite(db_path: &Path, prefix: &str) -> SqliteResult<Connection> {
        // Temp file ka naam banayenge browser ke hisaab se
        let temp_path = std::env::temp_dir().join(format!("zenvora_tmp_history_{}.sqlite", prefix));
        
        // Locked file ko temp folder mein copy karte hain
        if fs::copy(db_path, &temp_path).is_ok() {
            Connection::open(&temp_path)
        } else {
            // Agar copy fail ho jaye, toh direct open karne ki koshish (Fallback)
            Connection::open(db_path)
        }
    }

    fn collect_chrome_history() -> Vec<BrowserHistory> {
        let mut history = Vec::new();

        // Safe path detection Windows LOCALAPPDATA ke zariye
        if let Ok(local_app_data) = std::env::var("LOCALAPPDATA") {
            let chrome_path = PathBuf::from(local_app_data)
                .join(r"Google\Chrome\User Data\Default\History");
            
            if chrome_path.exists() {
                if let Ok(entries) = Self::read_chromium_history(&chrome_path, "Chrome") {
                    history.extend(entries);
                }
            }
        }

        history
    }

    fn collect_edge_history() -> Vec<BrowserHistory> {
        let mut history = Vec::new();

        if let Ok(local_app_data) = std::env::var("LOCALAPPDATA") {
            let edge_path = PathBuf::from(local_app_data)
                .join(r"Microsoft\Edge\User Data\Default\History");
            
            if edge_path.exists() {
                if let Ok(entries) = Self::read_chromium_history(&edge_path, "Edge") {
                    history.extend(entries);
                }
            }
        }

        history
    }

    fn collect_firefox_history() -> Vec<BrowserHistory> {
        let mut history = Vec::new();

        if let Ok(app_data) = std::env::var("APPDATA") {
            let firefox_path = PathBuf::from(app_data)
                .join(r"Mozilla\Firefox\Profiles");
            
            if firefox_path.exists() {
                if let Ok(entries) = fs::read_dir(firefox_path) {
                    for entry in entries.flatten() {
                        let profile_path = entry.path().join("places.sqlite");
                        if profile_path.exists() {
                            if let Ok(entries) = Self::read_firefox_history(&profile_path) {
                                history.extend(entries);
                            }
                        }
                    }
                }
            }
        }

        history
    }

    // Chrome aur Edge ka database structure same hota hai
    fn read_chromium_history(db_path: &Path, browser_name: &str) -> SqliteResult<Vec<BrowserHistory>> {
        let conn = Self::open_unlocked_sqlite(db_path, browser_name)?;
        let mut stmt = conn.prepare(
            "SELECT url, title, last_visit_time, visit_count FROM urls ORDER BY last_visit_time DESC LIMIT 500"
        )?;

        let history = stmt
            .query_map([], |row| {
                let url: String = row.get(0)?;
                let title: String = row.get(1)?;
                let timestamp: i64 = row.get(2)?;
                let visit_count: i32 = row.get(3)?;

                let visit_time = if timestamp > 0 {
                    // Chromium browsers ka time 1601 se start hota hai, 11644473600 minus karna zaruri hai
                    let secs = (timestamp / 1_000_000) - 11_644_473_600;
                    DateTime::from_timestamp(secs, 0)
                        .map(|dt| dt.with_timezone(&Local).format("%Y-%m-%d %H:%M:%S").to_string())
                        .unwrap_or_else(|| "Unknown".to_string())
                } else {
                    "Unknown".to_string()
                };

                Ok(BrowserHistory {
                    browser: browser_name.to_string(),
                    url,
                    title,
                    visit_time,
                    visit_count,
                })
            })?
            .filter_map(|r| r.ok())
            .collect();

        Ok(history)
    }

    fn read_firefox_history(db_path: &Path) -> SqliteResult<Vec<BrowserHistory>> {
        let conn = Self::open_unlocked_sqlite(db_path, "Firefox")?;
        let mut stmt = conn.prepare(
            "SELECT url, title, last_visit_date FROM moz_places WHERE last_visit_date IS NOT NULL ORDER BY last_visit_date DESC LIMIT 500"
        )?;

        let history = stmt
            .query_map([], |row| {
                let url: String = row.get(0)?;
                let title: String = row.get(1)?;
                let timestamp: i64 = row.get(2)?;

                let visit_time = if timestamp > 0 {
                    // Firefox seedha 1970 se start hota hai
                    let secs = timestamp / 1_000_000;
                    DateTime::from_timestamp(secs, 0)
                        .map(|dt| dt.with_timezone(&Local).format("%Y-%m-%d %H:%M:%S").to_string())
                        .unwrap_or_else(|| "Unknown".to_string())
                } else {
                    "Unknown".to_string()
                };

                Ok(BrowserHistory {
                    browser: "Firefox".to_string(),
                    url,
                    title,
                    visit_time,
                    visit_count: 0,
                })
            })?
            .filter_map(|r| r.ok())
            .collect();

        Ok(history)
    }

    pub fn to_json_array(history: &[BrowserHistory]) -> serde_json::Value {
        json!(history.iter().map(|h| json!({
            "browser": h.browser,
            "url": h.url,
            "title": h.title,
            "visitTime": h.visit_time,
            "visitCount": h.visit_count,
        })).collect::<Vec<_>>())
    }
}