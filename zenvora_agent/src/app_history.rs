use winreg::RegKey;
use chrono::Local;
use serde_json::json;
use serde::{Serialize, Deserialize};

#[cfg(windows)]
use std::os::windows::process::CommandExt;
#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x08000000;

use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppHistory {
    pub app_name: String,
    pub executable_path: String,
    pub last_opened: String,
    pub app_type: String, // "app" or "file"
}

pub struct AppHistoryCollector;

impl AppHistoryCollector {
    pub fn collect_all_app_history() -> Vec<AppHistory> {
        let mut history = Vec::new();

        // Get recently opened files from Recent folder
        history.extend(Self::collect_recent_files());

        // Get running processes (current state)
        history.extend(Self::collect_running_processes());

        // Get recently launched apps from registry
        history.extend(Self::collect_registry_recent_apps());

        history
    }

    fn collect_recent_files() -> Vec<AppHistory> {
        let mut recent = Vec::new();

        if let Some(home) = dirs::home_dir() {
            let recent_path = home.join(r"AppData\Roaming\Microsoft\Windows\Recent");
            
            if let Ok(entries) = std::fs::read_dir(&recent_path) {
                for entry in entries.flatten() {
                    let path = entry.path();
                    if path.is_file() {
                        if let Ok(metadata) = std::fs::metadata(&path) {
                            if let Ok(modified) = metadata.modified() {
                                let last_opened = match std::time::SystemTime::now().duration_since(modified) {
                                    Ok(_) => Local::now().format("%Y-%m-%d %H:%M:%S").to_string(),
                                    Err(_) => "Unknown".to_string(),
                                };
                                
                                let file_name = path
                                    .file_name()
                                    .and_then(|n| n.to_str())
                                    .unwrap_or("Unknown")
                                    .to_string();

                                recent.push(AppHistory {
                                    app_name: file_name,
                                    executable_path: path.to_string_lossy().to_string(),
                                    last_opened,
                                    app_type: "file".to_string(),
                                });
                            }
                        }
                    }
                }
            }
        }

        recent
    }

    fn collect_running_processes() -> Vec<AppHistory> {
        let mut processes = Vec::new();
        let now = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();

        #[cfg(target_os = "windows")]
        {
            if let Ok(output) = Command::new("tasklist")
                .creation_flags(CREATE_NO_WINDOW)
                .arg("/v")
                .arg("/fo")
                .arg("csv")
                .output()
            {
                if let Ok(stdout) = String::from_utf8(output.stdout) {
                    for line in stdout.lines().skip(1) {
                        let parts: Vec<&str> = line.split(',').collect();
                        if parts.len() > 0 {
                            let app_name = parts[0].trim_matches('"').to_string();
                            if !app_name.is_empty() {
                                processes.push(AppHistory {
                                    app_name,
                                    executable_path: String::new(),
                                    last_opened: now.clone(),
                                    app_type: "process".to_string(),
                                });
                            }
                        }
                    }
                }
            }
        }

        processes
    }

    fn collect_registry_recent_apps() -> Vec<AppHistory> {
        let mut apps = Vec::new();

        // Access Windows registry for recently used applications
        if let Ok(hklm) = RegKey::predef(winreg::enums::HKEY_CURRENT_USER)
            .open_subkey(r"Software\Microsoft\Windows\CurrentVersion\Explorer\RunMRU")
        {
            let now = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
            
            for (name, _) in hklm.enum_values().flatten() {
                if let Ok(val) = hklm.get_value::<String, _>(&name) {
                    if !val.is_empty() && name != "HRZR_PGYFRFFAT" {
                        let app_path = val.split('\0').next().unwrap_or(&val).to_string();
                        
                        let app_name = app_path
                            .split('\\')
                            .last()
                            .unwrap_or(&app_path)
                            .to_string();

                        apps.push(AppHistory {
                            app_name,
                            executable_path: app_path,
                            last_opened: now.clone(),
                            app_type: "app".to_string(),
                        });
                    }
                }
            }
        }

        apps
    }

    pub fn to_json_array(apps: &[AppHistory]) -> serde_json::Value {
        json!(apps.iter().map(|a| json!({
            "appName": a.app_name,
            "executablePath": a.executable_path,
            "lastOpened": a.last_opened,
            "appType": a.app_type,
        })).collect::<Vec<_>>())
    }
}
