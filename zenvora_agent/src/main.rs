// Windowless in release. For debug terminal: leave this commented, or use --console.
#![cfg_attr(all(windows, not(debug_assertions)), windows_subsystem = "windows")]
mod activity;
mod activity_monitor;
mod camera_worker;
mod config;
mod system;
mod audio;
mod screen;
mod agent;
mod commands;
mod screen_commands;
mod file_commands;
mod router;
mod network;
mod windows_controls;
mod com_runtime;
mod notifications;
mod browser_history;
mod app_history;
mod history_commands;
mod shell_commands;
mod service;
mod ui_notify;
mod input;
mod connection_status;
mod session_launch;

use std::env;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::atomic::AtomicBool;
use std::sync::Arc;
use std::thread;

pub async fn run_agent() {
    run_agent_with_stop(None).await;
}

pub async fn run_agent_with_stop(stop_flag: Option<Arc<AtomicBool>>) {
    connection_status::log("Agent worker starting");
    com_runtime::init_process_com();

    let notifier = notifications::global_notifier();
    notifier.start_listening();

    let mut config = config::AgentConfig::load_or_pair().await;
    connection_status::log(format!(
        "Credentials ready for device={}",
        config.device_id
    ));
    let mut agent_state = agent::AgentState::new();

    network::run_network_loop(&mut agent_state, &mut config, stop_flag).await;
}

#[cfg(windows)]
fn system32_dir() -> PathBuf {
    PathBuf::from(env::var("WINDIR").unwrap_or_else(|_| "C:\\Windows".to_string())).join("System32")
}

#[cfg(windows)]
fn is_in_system32(path: &Path) -> bool {
    path.parent()
        .map(|parent| parent == system32_dir().as_path())
        .unwrap_or(false)
}

#[cfg(windows)]
fn relocate_to_system32() -> ! {
    let current_exe = env::current_exe().expect("current exe");
    let target_path = system32_dir().join(current_exe.file_name().expect("exe name"));

    if let Err(err) = fs::copy(&current_exe, &target_path) {
        ui_notify::show_blocking_error(
            "Zenvora Agent",
            &format!("Failed to copy agent to System32:\n{}", err),
        );
        std::process::exit(1);
    }

    let mut args: Vec<String> = env::args().skip(1).collect();
    if !args.iter().any(|arg| arg == "--from-system32") {
        args.push("--from-system32".to_string());
    }

    if Command::new(&target_path).args(&args).spawn().is_err() {
        ui_notify::show_blocking_error(
            "Zenvora Agent",
            "Failed to launch agent from System32.",
        );
        std::process::exit(1);
    }

    std::process::exit(0);
}

#[cfg(windows)]
fn wait_for_connection_report(timeout_secs: u64) -> Option<String> {
    for _ in 0..timeout_secs {
        if let Some(status) = connection_status::read_status() {
            if connection_status::is_final_status(&status) {
                return Some(status);
            }
        }
        thread::sleep(std::time::Duration::from_secs(1));
    }
    connection_status::read_status().filter(|s| connection_status::is_final_status(s))
}

#[cfg(windows)]
fn show_connection_report(status: &str) {
    if let Some(rest) = status.strip_prefix("connected|") {
        let parts: Vec<&str> = rest.splitn(2, '|').collect();
        let device = parts.first().copied().unwrap_or("device");
        let gateway = parts.get(1).copied().unwrap_or("gateway");
        ui_notify::show_blocking_info(
            "Zenvora Agent",
            &format!(
                "Connected successfully!\nDevice: {}\nGateway: {}",
                device, gateway
            ),
        );
        return;
    }

    if let Some(reason) = status.strip_prefix("failed|") {
        ui_notify::show_blocking_error("Zenvora Agent - Connection Failed", reason);
    }
}

#[cfg(windows)]
fn ensure_agent_running() -> Result<(), String> {
    let exe = env::current_exe()
        .map(|p| p.to_string_lossy().into_owned())
        .map_err(|e| e.to_string())?;

    // Prefer Windows service. If anything fails, always fall back to background agent.
    match service::install_service() {
        Ok(()) => {
            let started = if service::service_running() {
                service::restart_service()
            } else {
                service::start_service().and_then(|_| {
                    if service::wait_for_service_running(20) {
                        Ok(())
                    } else {
                        Err(format!("Service did not reach RUNNING ({})", service::service_state()))
                    }
                })
            };

            if started.is_ok() {
                return Ok(());
            }

            // Service installed but start failed → background agent
            service::spawn_background_agent(&exe)
                .map_err(|e| format!("Service start failed and background launch failed: {}", e))?;
            Ok(())
        }
        Err(_install_err) => {
            // Service install failed → still connect via background agent
            service::spawn_background_agent(&exe)
                .map_err(|e| format!("Service install failed and background launch failed: {}", e))?;
            Ok(())
        }
    }
}

#[cfg(windows)]
fn bootstrap_service_and_report() {
    connection_status::mark_bootstrap_waiting();
    connection_status::reset_connect_report();

    if let Err(err) = ensure_agent_running() {
        ui_notify::show_blocking_error("Zenvora Agent", &err);
        return;
    }

    if let Some(status) = wait_for_connection_report(150) {
        show_connection_report(&status);
        return;
    }

    // Keep waiting a bit more if agent is still retrying ("connecting").
    if let Some(status) = connection_status::read_status() {
        if status.starts_with("connecting|") {
            if let Some(final_status) = wait_for_connection_report(60) {
                show_connection_report(&final_status);
                return;
            }
        }
        if connection_status::is_final_status(&status) {
            show_connection_report(&status);
            return;
        }
    }

    ui_notify::show_blocking_warning(
        "Zenvora Agent",
        "Agent is still connecting in background.\nIf this keeps failing, check Railway deployment and internet.",
    );
}

#[cfg(not(windows))]
fn relocate_to_system32() -> ! {
    std::process::exit(0);
}

fn run_async_main(args: &[String]) {
    let runtime = tokio::runtime::Runtime::new().expect("tokio runtime");

    if args.len() > 1 {
        match args[1].as_str() {
            "install" => {
                #[cfg(windows)]
                {
                    if let Ok(current_exe) = env::current_exe() {
                        if !is_in_system32(&current_exe) {
                            relocate_to_system32();
                        }
                    }
                    bootstrap_service_and_report();
                }
                return;
            }
            "uninstall" => {
                service::uninstall_service();
                ui_notify::show_blocking_info("Zenvora Agent", "Service removed.");
                return;
            }
            "start" => {
                if let Err(err) = service::start_service() {
                    ui_notify::show_blocking_error("Zenvora Agent", &err);
                }
                return;
            }
            "stop" => {
                service::stop_service();
                return;
            }
            "restart" => {
                if let Err(err) = service::restart_service() {
                    ui_notify::show_blocking_error("Zenvora Agent", &err);
                }
                return;
            }
            "--console" => {
                connection_status::clear_status();
                runtime.block_on(run_agent());
                return;
            }
            "--run-agent" => {
                // Detached background worker used when service cannot start.
                connection_status::reset_connect_report();
                runtime.block_on(run_agent());
                return;
            }
            "--from-system32" => {
                // Fall through to bootstrap below.
            }
            _ => {}
        }
    }

    #[cfg(windows)]
    if let Ok(current_exe) = env::current_exe() {
        if !is_in_system32(&current_exe) {
            relocate_to_system32();
        }
    }

    #[cfg(windows)]
    {
        bootstrap_service_and_report();
        return;
    }

    #[cfg(not(windows))]
    runtime.block_on(run_agent());
}

fn main() {
    let args: Vec<String> = env::args().collect();

    // Only enter the service dispatcher when Windows SCM launches us with no
    // interactive args. Otherwise StartServiceCtrlDispatcher fails and confuses installs.
    let has_cli_action = args.len() > 1
        && matches!(
            args[1].as_str(),
            "install"
                | "uninstall"
                | "start"
                | "stop"
                | "restart"
                | "--console"
                | "--run-agent"
                | "--from-system32"
        );

    #[cfg(windows)]
    if !has_cli_action && service::try_run_as_service() {
        return;
    }

    run_async_main(&args);
}
