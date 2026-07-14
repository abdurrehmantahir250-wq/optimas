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

        for local_app_data in Self::local_app_data_roots() {
            all_history.extend(Self::collect_chrome_history_from(&local_app_data));
            all_history.extend(Self::collect_edge_history_from(&local_app_data));
        }

        for app_data in Self::roaming_app_data_roots() {
            all_history.extend(Self::collect_firefox_history_from(&app_data));
        }

        // Sort by visit time descending and de-dupe exact url+time pairs.
        all_history.sort_by(|a, b| b.visit_time.cmp(&a.visit_time));
        all_history.dedup_by(|a, b| a.url == b.url && a.visit_time == b.visit_time && a.browser == b.browser);
        if all_history.len() > 2000 {
            all_history.truncate(2000);
        }

        all_history
    }

    /// Current-user env vars plus every Windows profile under C:\Users.
    fn local_app_data_roots() -> Vec<PathBuf> {
        let mut roots = Vec::new();
        if let Ok(path) = std::env::var("LOCALAPPDATA") {
            let p = PathBuf::from(path);
            if p.is_dir() {
                roots.push(p);
            }
        }
        for user_home in Self::windows_user_homes() {
            let candidate = user_home.join(r"AppData\Local");
            if candidate.is_dir() && !roots.iter().any(|r| r == &candidate) {
                roots.push(candidate);
            }
        }
        roots
    }

    fn roaming_app_data_roots() -> Vec<PathBuf> {
        let mut roots = Vec::new();
        if let Ok(path) = std::env::var("APPDATA") {
            let p = PathBuf::from(path);
            if p.is_dir() {
                roots.push(p);
            }
        }
        for user_home in Self::windows_user_homes() {
            let candidate = user_home.join(r"AppData\Roaming");
            if candidate.is_dir() && !roots.iter().any(|r| r == &candidate) {
                roots.push(candidate);
            }
        }
        roots
    }

    fn windows_user_homes() -> Vec<PathBuf> {
        let mut homes = Vec::new();
        let users_dir = PathBuf::from(r"C:\Users");
        if let Ok(entries) = fs::read_dir(&users_dir) {
            for entry in entries.flatten() {
                let name = entry.file_name().to_string_lossy().to_string();
                if matches!(
                    name.as_str(),
                    "Public" | "Default" | "Default User" | "All Users" | "desktop.ini"
                ) {
                    continue;
                }
                let path = entry.path();
                if path.is_dir() {
                    homes.push(path);
                }
            }
        }
        homes
    }

    fn open_unlocked_sqlite(db_path: &Path, prefix: &str) -> SqliteResult<Connection> {
        let temp_path = std::env::temp_dir().join(format!(
            "zenvora_tmp_history_{}_{}.sqlite",
            prefix,
            std::process::id()
        ));

        if fs::copy(db_path, &temp_path).is_ok() {
            Connection::open(&temp_path)
        } else {
            Connection::open(db_path)
        }
    }

    fn chromium_profile_history_paths(user_data: &Path) -> Vec<PathBuf> {
        let mut paths = Vec::new();
        let default = user_data.join(r"Default\History");
        if default.exists() {
            paths.push(default);
        }
        if let Ok(entries) = fs::read_dir(user_data) {
            for entry in entries.flatten() {
                let name = entry.file_name().to_string_lossy().to_string();
                if name.starts_with("Profile ") {
                    let history = entry.path().join("History");
                    if history.exists() {
                        paths.push(history);
                    }
                }
            }
        }
        paths
    }

    fn collect_chrome_history_from(local_app_data: &Path) -> Vec<BrowserHistory> {
        let mut history = Vec::new();
        let user_data = local_app_data.join(r"Google\Chrome\User Data");
        for path in Self::chromium_profile_history_paths(&user_data) {
            if let Ok(entries) = Self::read_chromium_history(&path, "Chrome") {
                history.extend(entries);
            }
        }
        history
    }

    fn collect_edge_history_from(local_app_data: &Path) -> Vec<BrowserHistory> {
        let mut history = Vec::new();
        let user_data = local_app_data.join(r"Microsoft\Edge\User Data");
        for path in Self::chromium_profile_history_paths(&user_data) {
            if let Ok(entries) = Self::read_chromium_history(&path, "Edge") {
                history.extend(entries);
            }
        }
        history
    }

    fn collect_firefox_history_from(app_data: &Path) -> Vec<BrowserHistory> {
        let mut history = Vec::new();
        let firefox_path = app_data.join(r"Mozilla\Firefox\Profiles");
        if !firefox_path.exists() {
            return history;
        }
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
        history
    }

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
