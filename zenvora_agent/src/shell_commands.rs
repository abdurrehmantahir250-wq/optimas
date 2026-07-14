use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

#[cfg(windows)]
use std::os::windows::process::CommandExt;

use serde_json::json;

use crate::commands::{CommandResponse, IncomingPacket};

#[derive(Debug, Default, Clone)]
pub struct ShellState {
    current_dir: Option<PathBuf>,
}

impl ShellState {
    pub fn new() -> Self {
        Self::default()
    }

    fn resolve_current_dir(&self) -> PathBuf {
        self.current_dir.clone().unwrap_or_else(|| {
            std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."))
        })
    }

    fn set_current_dir(&mut self, dir: PathBuf) {
        self.current_dir = Some(dir);
    }
}

pub fn is_shell_action(action: &str) -> bool {
    matches!(action, "SHELL_EXECUTE" | "SHELL_EXECUTE_RAW")
}

pub fn handle_shell_command(packet: IncomingPacket, shell_state: &mut ShellState) -> Option<CommandResponse> {
    let command = packet
        .payload
        .get("command")
        .and_then(|value| value.as_str())
        .unwrap_or("")
        .trim()
        .to_string();

    if command.is_empty() {
        return Some(CommandResponse {
            json: json!({
                "type": "shell_output",
                "action": packet.action,
                "status": "error",
                "message": "No shell command provided.",
                "shell": {
                    "command": "",
                    "exit_code": 1,
                    "stdout": "",
                    "stderr": "No shell command provided."
                }
            }),
            frame: None,
            frame_kind: 0,
        });
    }

    let output = run_shell_command(&command, shell_state);

    Some(CommandResponse {
        json: json!({
            "type": "shell_output",
            "action": packet.action,
            "status": if output.exit_code == 0 { "success" } else { "error" },
            "message": if output.exit_code == 0 { "Shell command completed." } else { "Shell command failed." },
            "shell": {
                "command": command,
                "exit_code": output.exit_code,
                "stdout": output.stdout,
                "stderr": output.stderr,
                "timed_out": output.timed_out
            }
        }),
        frame: None,
        frame_kind: 0,
    })
}

struct ShellExecutionResult {
    exit_code: i32,
    stdout: String,
    stderr: String,
    timed_out: bool,
}

fn run_shell_command(command_text: &str, shell_state: &mut ShellState) -> ShellExecutionResult {
    if let Some(result) = try_handle_cd_command(command_text, shell_state) {
        return result;
    }

    #[cfg(windows)]
    let mut command = Command::new("cmd");
    #[cfg(windows)]
    {
        command.args(["/D", "/Q", "/C", command_text]);
        #[cfg(windows)]
        command.creation_flags(0x08000000);
    }

    #[cfg(not(windows))]
    let mut command = Command::new("/bin/sh");
    #[cfg(not(windows))]
    {
        command.arg("-c").arg(command_text);
    }

    let current_dir = shell_state.resolve_current_dir();
    command.current_dir(&current_dir);

    match command.output() {
        Ok(output) => ShellExecutionResult {
            exit_code: output.status.code().unwrap_or(-1),
            stdout: String::from_utf8_lossy(&output.stdout).trim().to_string(),
            stderr: String::from_utf8_lossy(&output.stderr).trim().to_string(),
            timed_out: false,
        },
        Err(err) => ShellExecutionResult {
            exit_code: 1,
            stdout: String::new(),
            stderr: format!("Failed to launch shell: {err}"),
            timed_out: false,
        },
    }
}

fn try_handle_cd_command(command_text: &str, shell_state: &mut ShellState) -> Option<ShellExecutionResult> {
    let trimmed = command_text.trim();
    if trimmed.is_empty() {
        return None;
    }

    let mut parts = trimmed.split_whitespace();
    let command_name = parts.next().unwrap_or("");
    let is_cd = command_name.eq_ignore_ascii_case("cd") || command_name.eq_ignore_ascii_case("chdir");
    if !is_cd {
        return None;
    }

    let mut target_parts = parts.collect::<Vec<_>>();
    let mut use_d = false;
    if target_parts.first().is_some_and(|part| part.eq_ignore_ascii_case("/d")) {
        use_d = true;
        target_parts.remove(0);
    }

    let target = target_parts.join(" ");
    let base_dir = shell_state.resolve_current_dir();

    let resolved = if target.is_empty() {
        base_dir.clone()
    } else {
        let candidate = if Path::new(&target).is_absolute() {
            PathBuf::from(&target)
        } else {
            base_dir.join(&target)
        };
        if candidate.exists() {
            match fs::canonicalize(&candidate) {
                Ok(path) => path,
                Err(_) => candidate,
            }
        } else {
            return Some(ShellExecutionResult {
                exit_code: 1,
                stdout: String::new(),
                stderr: format!("Directory not found: {}", target),
                timed_out: false,
            });
        }
    };

    let mut final_dir = resolved;
    if use_d && final_dir.is_file() {
        final_dir = final_dir.parent().unwrap_or(&base_dir).to_path_buf();
    }

    shell_state.set_current_dir(final_dir.clone());
    Some(ShellExecutionResult {
        exit_code: 0,
        stdout: final_dir.to_string_lossy().to_string(),
        stderr: String::new(),
        timed_out: false,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn cd_command_updates_shell_state() {
        let mut shell_state = ShellState::new();
        let result = try_handle_cd_command("cd ..", &mut shell_state).unwrap();

        assert_eq!(result.exit_code, 0);
        assert!(result.stdout.contains("\\") || result.stdout.contains("/"));
    }
}
