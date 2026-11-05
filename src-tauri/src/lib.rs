use std::io::{Read, Write};
use std::net::TcpListener;
use std::sync::Mutex;
use std::time::{Duration, Instant};
use tauri::Manager;

#[derive(Default)]
struct AuthState {
  pending: Mutex<Option<(String, String)>>,
  spawning: Mutex<()>,
}

const AUTH_PORT: u16 = 49112;

#[tauri::command]
fn spotify_start_auth(
  state: tauri::State<AuthState>,
  app: tauri::AppHandle,
  csrf_state: String,
) -> Result<u16, String> {
  let _guard = state.spawning.lock().map_err(|_| "auth lock".to_string())?;
  let listener = TcpListener::bind(("127.0.0.1", AUTH_PORT))
    .map_err(|e| format!("Could not start the local login listener: {e}"))?;
  let port = listener.local_addr().map_err(|e| e.to_string())?.port();
  *state.pending.lock().unwrap() = Some((csrf_state.clone(), String::new()));

  std::thread::spawn(move || {
    listener.set_nonblocking(true).ok();
    let start = Instant::now();
    loop {
      match listener.accept() {
        Ok((mut stream, _)) => {
          let mut buf = [0u8; 8192];
          let n = stream.read(&mut buf).unwrap_or(0);
          let req = String::from_utf8_lossy(&buf[..n]).to_string();
          let line = req.lines().next().unwrap_or("");
          let mut code: Option<String> = None;
          let mut st: Option<String> = None;
          if let Some(q) = line.split(' ').nth(1) {
            if let Some(q) = q.split('?').nth(1) {
              for pair in q.split('&') {
                let mut it = pair.splitn(2, '=');
                let k = it.next().unwrap_or("");
                let v = it.next().unwrap_or("");
                if k == "code" {
                  code = Some(v.to_string());
                }
                if k == "state" {
                  st = Some(v.to_string());
                }
              }
            }
          }
          let ok = match (&code, &st) {
            (Some(c), Some(s)) => !c.is_empty() && *s == csrf_state,
            _ => false,
          };
          if ok {
            if let Some(c) = code {
              if let Ok(mut g) = app.state::<AuthState>().pending.lock() {
                *g = Some((csrf_state.clone(), c));
              }
            }
          }
          let msg = if ok {
            "You can close this tab and go back to the app ⭐"
          } else {
            "Hmm, that didn't match. Close this tab and try again."
          };
          let body = format!(
            "<!doctype html><html><body style='font-family:system-ui;text-align:center;padding-top:48px;color:#333'><p>{msg}</p><script>window.close()</script></body></html>"
          );
          let resp = format!(
            "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
            body.len(),
            body
          );
          let _ = stream.write_all(resp.as_bytes());
          break;
        }
        Err(e) if e.kind() == std::io::ErrorKind::WouldBlock => {
          if start.elapsed() > Duration::from_secs(180) {
            break;
          }
          std::thread::sleep(Duration::from_millis(120));
        }
        Err(_) => break,
      }
    }
  });

  Ok(port)
}

#[tauri::command]
fn spotify_fetch_auth_code(state: tauri::State<AuthState>) -> Result<Option<String>, String> {
  let mut g = state.pending.lock().map_err(|e| e.to_string())?;
  if let Some((_, c)) = g.as_ref() {
    if c.is_empty() {
      return Ok(None);
    }
  }
  Ok(g.take().map(|(_, c)| c))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_opener::init())
    .plugin(tauri_plugin_updater::Builder::new().build())
    .plugin(tauri_plugin_process::init())
    .manage(AuthState::default())
    .invoke_handler(tauri::generate_handler![
      spotify_start_auth,
      spotify_fetch_auth_code
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while building tauri application");
}
