use hostname;
use std::fs;
use std::io::{self, Read, Write};
use std::fs::File;
use std::path::PathBuf;
use std::process::Command;
use serde::{Deserialize, Serialize};

use crate::ui_notify;

#[cfg(windows)]
use std::os::windows::process::CommandExt;
#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x08000000;

const CONFIG_FILE: &str = "agent.dat";
const XOR_KEY: u8 = 0x5A;

fn get_config_path() -> PathBuf {
    if let Some(program_data) = std::env::var_os("PROGRAMDATA") {
        let dir = PathBuf::from(program_data).join("WIN_32");
        let _ = fs::create_dir_all(&dir);
        return dir.join(CONFIG_FILE);
    }
    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(dir) = exe_path.parent() {
            return dir.join(CONFIG_FILE);
        }
    }
    PathBuf::from(CONFIG_FILE)
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AgentConfig {
    pub gateway_url: String,
    pub device_id: String,
    pub agent_token: String,
}

fn simple_crypt(data: &[u8]) -> Vec<u8> {
    data.iter().map(|&b| b ^ XOR_KEY).collect()
}

#[cfg(windows)]
fn prompt_input_dialog(title: &str, prompt: &str) -> String {
    let title = title.replace('"', "\\\"");
    let prompt = prompt.replace('"', "\\\"");
    let script = format!(
        "Add-Type -AssemblyName Microsoft.VisualBasic; $result = [Microsoft.VisualBasic.Interaction]::InputBox(\"{}\", \"{}\", \"\"); if ($result -ne $null) {{ Write-Output $result }}",
        prompt,
        title
    );

    let output = Command::new("powershell")
        .creation_flags(CREATE_NO_WINDOW)
        .args([
            "-NoProfile",
            "-STA",
            "-WindowStyle",
            "Hidden",
            "-Command",
            &script,
        ])
        .output();

    if let Ok(output) = output {
        if output.status.success() {
            let value = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if !value.is_empty() {
                return value;
            }
        }
    }
    String::new()
}

#[cfg(not(windows))]
fn prompt_input_dialog(_title: &str, _prompt: &str) -> String {
    String::new()
}

fn request_token_input(label: &str, prompt: &str) -> String {
    let input = prompt_input_dialog(label, prompt);
    if !input.is_empty() {
        return input.trim().to_string();
    }

    // No console/UI available (service Session 0).
    if is_service_session() {
        return String::new();
    }

    let mut fallback = String::new();
    print!("{}", prompt);
    let _ = io::stdout().flush();
    let _ = io::stdin().read_line(&mut fallback);
    fallback.trim().to_string()
}

#[cfg(windows)]
fn is_service_session() -> bool {
    use windows::Win32::System::RemoteDesktop::ProcessIdToSessionId;
    use windows::Win32::System::Threading::GetCurrentProcessId;
    unsafe {
        let mut session_id = 0u32;
        if ProcessIdToSessionId(GetCurrentProcessId(), &mut session_id).is_ok() {
            return session_id == 0;
        }
    }
    false
}

#[cfg(not(windows))]
fn is_service_session() -> bool {
    false
}

impl AgentConfig {
    pub fn load_existing() -> Option<Self> {
        let path = get_config_path();
        if !path.exists() {
            return None;
        }

        let mut file = File::open(&path).ok()?;
        let mut encrypted_data = Vec::new();
        file.read_to_end(&mut encrypted_data).ok()?;
        let decrypted_data = simple_crypt(&encrypted_data);
        serde_json::from_slice::<AgentConfig>(&decrypted_data).ok()
    }

    pub fn save(&self) -> bool {
        let path = get_config_path();
        let serialized = match serde_json::to_vec(self) {
            Ok(data) => data,
            Err(_) => return false,
        };
        let encrypted = simple_crypt(&serialized);
        if let Ok(mut file) = File::create(&path) {
            return file.write_all(&encrypted).is_ok();
        }
        false
    }

    pub fn clear_stored() {
        let path = get_config_path();
        let _ = fs::remove_file(path);
        println!("--> [CONFIG] Cleared stored credentials.");
    }

    pub async fn load_or_pair() -> Self {
        if let Some(config) = Self::load_existing() {
            println!(
                "--> [CONFIG] Loaded existing paired credentials from {}",
                get_config_path().to_string_lossy()
            );
            return config;
        }

        // Windows services cannot show InputBox dialogs (Session 0).
        if is_service_session() {
            crate::connection_status::report_failed(
                "Agent is not paired. Run as Admin: win_32.exe --console and enter Pair Token.",
            );
            // Keep worker alive but stop spinning forever on empty prompts.
            loop {
                tokio::time::sleep(std::time::Duration::from_secs(30)).await;
                if let Some(config) = Self::load_existing() {
                    return config;
                }
            }
        }

        Self::pair_interactive().await
    }

    pub async fn repair_credentials() -> Self {
        ui_notify::show_warning(
            "Zenvora Agent",
            "Connection authentication failed.\nPlease enter your pairing credentials again.",
        );
        Self::clear_stored();
        Self::pair_interactive().await
    }

    pub async fn pair_interactive() -> Self {
        loop {
            match Self::attempt_pairing().await {
                Ok(config) => {
                    ui_notify::show_info(
                        "Zenvora Agent",
                        &format!(
                            "Pairing successful!\nDevice: {}\nConnecting to gateway...",
                            config.device_id
                        ),
                    );
                    return config;
                }
                Err(message) => {
                    ui_notify::show_error(
                        "Zenvora Agent - Pairing Failed",
                        &format!(
                            "{}\n\nPlease check your Pair Token and Pair User ID, then try again.",
                            message
                        ),
                    );
                }
            }
        }
    }

    async fn attempt_pairing() -> Result<Self, String> {
        println!("--> [CONFIG] Machine is unpaired. Starting pairing sequence...");

        let machine_name = hostname::get()
            .map(|h| h.to_string_lossy().to_uppercase())
            .unwrap_or_else(|_| "UNKNOWN-PC".to_string());

        let device_id = std::env::var("ZENVORA_DEVICE_ID")
            .unwrap_or_else(|_| format!("WIN-NODE-{}", machine_name));

        let pairing_token = request_token_input("Pair Token", "Enter Pair Token:");
        if pairing_token.is_empty() {
            return Err("Pair Token is required.".into());
        }

        let pairing_user_id = request_token_input("Pair User ID", "Enter Pair User ID:");
        if pairing_user_id.is_empty() {
            return Err("Pair User ID is required.".into());
        }

        let api_base_url = std::env::var("ZENVORA_API_URL")
            .unwrap_or_else(|_| "https://optimas-production.up.railway.app".to_string());

        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(30))
            .build()
            .map_err(|e| format!("HTTP client error: {}", e))?;

        let pair_endpoint = format!("{}/api/auth/agent/pair", api_base_url);
        let body = serde_json::json!({
            "pairingToken": pairing_token,
            "pairingUserId": pairing_user_id,
            "deviceId": device_id,
            "hostname": machine_name
        });

        println!("--> [CONFIG] Registering against remote control engine API...");

        let response = client
            .post(&pair_endpoint)
            .header("User-Agent", "Zenvora-Agent/1.0")
            .header("Accept", "application/json")
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Network request failed: {}", e))?;

        let status = response.status();
        let text = response
            .text()
            .await
            .unwrap_or_else(|e| format!("Failed to read response body: {}", e));

        if !status.is_success() {
            return Err(format!("Server rejected pairing (HTTP {}). {}", status, text));
        }

        let res_json: serde_json::Value = serde_json::from_str(&text)
            .map_err(|e| format!("Invalid server response: {} | body={}", e, text))?;

        let agent_token = res_json["agentToken"]
            .as_str()
            .filter(|s| !s.is_empty())
            .ok_or_else(|| "Server response missing agentToken.".to_string())?
            .to_string();

        let gateway_url = res_json["gatewayUrl"]
            .as_str()
            .unwrap_or("wss://optimas-production.up.railway.app/ws/gateway")
            .to_string();
            println!("==============================");
println!("Gateway URL: {}", gateway_url);
println!("API URL: {}", api_base_url);
println!("Response JSON: {}", text);
println!("==============================");
        let new_config = Self {
            gateway_url,
            device_id,
            agent_token,
        };

        if !new_config.save() {
            return Err("Pairing succeeded but failed to save encrypted credentials.".into());
        }

        println!(
            "--> [CONFIG] Success! Encrypted credentials written to {}",
            get_config_path().to_string_lossy()
        );
        Ok(new_config)
    }
}
