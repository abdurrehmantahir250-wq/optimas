"use client";

export type DeviceOption = {
  value: string;
  label: string;
  role?: string;
};

export type GatewayEvent =
  | { type: "connected" }
  | { type: "disconnected" }
  | { type: "devices"; devices: DeviceOption[] }
  | { type: "json"; packet: Record<string, unknown> }
  | { type: "binary"; data: ArrayBuffer | Blob };

type GatewayListener = (event: GatewayEvent) => void;

/** One WebSocket per browser tab — survives Next.js page navigation. */
class GatewayClient {
  private ws: WebSocket | null = null;
  private listeners = new Set<GatewayListener>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private devices: DeviceOption[] = [];
  private connecting = false;
  private cameraStreaming = false;
  private cameraStreamingAgentId = "";
  private screenStreaming = false;
  private screenStreamingAgentId = "";

  subscribe(listener: GatewayListener): () => void {
    this.listeners.add(listener);
    this.ensureConnected();

    if (this.ws?.readyState === WebSocket.OPEN) {
      listener({ type: "connected" });
      if (this.devices.length > 0) {
        listener({ type: "devices", devices: this.devices });
      }
    }

    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(event: GatewayEvent) {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error("[GATEWAY] listener error:", err);
      }
    });
  }

  ensureConnected() {
    if (typeof window === "undefined") return;
    if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) {
      return;
    }
    if (this.connecting) return;
    this.connect();
  }

  private connect() {
    if (typeof window === "undefined") return;

    this.connecting = true;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/gateway`);
    ws.binaryType = "arraybuffer";
    this.ws = ws;

    ws.onopen = () => {
      this.connecting = false;
      console.log("[GATEWAY] Dashboard connected");
      ws.send(
        JSON.stringify({
          type: "register_channel",
          role: "DASHBOARD",
          id: "UNIFIED_PANEL",
        })
      );
      this.emit({ type: "connected" });
      void this.refreshDevices();
    };

    ws.onmessage = (event) => {
      if (typeof event.data !== "string") {
        this.emit({ type: "binary", data: event.data as ArrayBuffer | Blob });
        return;
      }

      try {
        const packet = JSON.parse(event.data) as Record<string, unknown>;
        this.trackStreamingState(packet);
        if (
          (packet.type === "device_list_update" || packet.type === "sys_ack") &&
          Array.isArray(packet.devices)
        ) {
          this.devices = packet.devices as DeviceOption[];
          this.emit({ type: "devices", devices: this.devices });
        }
        this.emit({ type: "json", packet });
      } catch {
        // ignore malformed packets
      }
    };

    ws.onerror = () => {
      console.warn("[GATEWAY] WebSocket error");
    };

    ws.onclose = () => {
      this.connecting = false;
      this.ws = null;
      this.emit({ type: "disconnected" });
      if (this.listeners.size > 0) {
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => this.connect(), 1500);
      }
    };
  }

  async refreshDevices(): Promise<DeviceOption[]> {
    try {
      const response = await fetch("/api/network/live-agents");
      if (!response.ok) return this.devices;
      const data = await response.json();
      if (data.success && Array.isArray(data.devices)) {
        this.devices = data.devices as DeviceOption[];
        this.emit({ type: "devices", devices: this.devices });
      }
    } catch {
      // REST fallback is optional
    }
    return this.devices;
  }

  dispatch(action: string, targetDeviceId: string, payload: Record<string, unknown> = {}): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn("[GATEWAY] dispatch blocked — socket not open:", action);
      return false;
    }
    if (!targetDeviceId) {
      console.warn("[GATEWAY] dispatch blocked — no target:", action);
      return false;
    }

    console.log(`[GATEWAY] dispatch ${action} -> ${targetDeviceId}`, payload);
    this.ws.send(
      JSON.stringify({
        type: "dispatch_control",
        targetDeviceId,
        action,
        payload,
      })
    );
    return true;
  }

  isOpen(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getDevices(): DeviceOption[] {
    return this.devices;
  }

  getSocket(): WebSocket | null {
    return this.ws;
  }

  isCameraStreaming(): boolean {
    return this.cameraStreaming;
  }

  getCameraStreamingAgentId(): string {
    return this.cameraStreamingAgentId;
  }

  isScreenStreaming(): boolean {
    return this.screenStreaming;
  }

  getScreenStreamingAgentId(): string {
    return this.screenStreamingAgentId;
  }

  private trackStreamingState(packet: Record<string, unknown>) {
    const packetType = String(packet.type || "");
    const isCameraPacket =
      packetType === "camera_telemetry_stream" ||
      (packetType === "sys_ack" && packet.channel === "camera");
    const isScreenPacket =
      packetType === "screen_telemetry_stream" ||
      (packetType === "sys_ack" && packet.channel === "screen");

    const metrics =
      (packet.metrics as Record<string, unknown> | undefined) ||
      (packet.hardware_metrics as Record<string, unknown> | undefined);

    const sender =
      typeof packet.senderAgentId === "string" ? packet.senderAgentId : "";

    if (isCameraPacket && typeof metrics?.streaming_active === "boolean") {
      this.cameraStreaming = metrics.streaming_active;
      if (sender) this.cameraStreamingAgentId = sender;
      try {
        sessionStorage.setItem(
          "zenvora_camera_streaming",
          metrics.streaming_active ? "1" : "0"
        );
      } catch {
        // ignore storage errors
      }
    }

    if (isScreenPacket && typeof metrics?.streaming_active === "boolean") {
      this.screenStreaming = metrics.streaming_active;
      if (sender) this.screenStreamingAgentId = sender;
      try {
        sessionStorage.setItem(
          "zenvora_screen_streaming",
          metrics.streaming_active ? "1" : "0"
        );
      } catch {
        // ignore storage errors
      }
    }

    if (isCameraPacket && metrics?.camera_blocked === true) {
      this.cameraStreaming = false;
      try {
        sessionStorage.setItem("zenvora_camera_streaming", "0");
      } catch {
        // ignore storage errors
      }
    }
  }
}

export const gatewayClient = new GatewayClient();
