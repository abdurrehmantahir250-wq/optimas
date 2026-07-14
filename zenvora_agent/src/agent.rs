use std::sync::Arc;
use crate::activity::ActivityLogger;
use crate::audio::AudioState;
use crate::file_commands::FileState;
use crate::screen::ScreenState;
use crate::shell_commands::ShellState;
use crate::system::CameraState;

pub struct AgentState {
    pub camera: CameraState,
    pub screen: ScreenState,
    pub files: FileState,
    pub audio: AudioState,
    pub shell: ShellState,
    pub activity_logger: Option<Arc<ActivityLogger>>,
}

impl AgentState {
    pub fn new() -> Self {
        Self {
            camera: CameraState::new(),
            screen: ScreenState::new(),
            files: FileState::new(),
            audio: AudioState::new(),
            shell: ShellState::new(),
            activity_logger: None,
        }
    }
}
