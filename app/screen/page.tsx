"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CustomSlider } from "@/components/custom-slider";
import {
  Download,
  Monitor,
  Maximize2,
  RotateCw,
  Settings,
  Volume2,
  Lock,
  Power,
  Radar,
  RefreshCw,
  Cpu,
  Trash2,
  Image as ImageIcon,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import Select from "react-select";
import { useGateway } from "@/hooks/use-gateway";
import { gatewayClient } from "@/lib/gateway-client";
import type { DeviceOption } from "@/lib/gateway-client";

function b64ToBlob(b64: string, mimeType: string): Blob {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

type ScreenTelemetry = {
  resolution: string;
  fps: string;
  bitrate: string;
  latency: string;
  status: string;
  displayName: string;
};

type DetectedDisplay = {
  id: string;
  index: number;
  label: string;
  status: string;
  resolution: string;
  is_primary?: boolean;
};

const FRAME_SCREEN_STREAM = 0x04;
const FRAME_SCREEN_SNAPSHOT = 0x05;

export default function ScreenPage() {
  const {
    isConnected,
    devices: deviceOptions,
    dispatch: gatewayDispatch,
    refreshDevices,
    resolveTarget,
    subscribe,
  } = useGateway();

  const [selectedDevice, setSelectedDevice] = useState("");
  const [commandStatus, setCommandStatus] = useState("Waiting for live agent...");
  const [isStreaming, setIsStreaming] = useState(() => {
    if (gatewayClient.isScreenStreaming()) return true;
    try {
      return sessionStorage.getItem("zenvora_screen_streaming") === "1";
    } catch {
      return false;
    }
  });
  const [hasLiveFrame, setHasLiveFrame] = useState(false);
  const [liveFrameCount, setLiveFrameCount] = useState(0);
  const [scanningDisplays, setScanningDisplays] = useState(false);
const [capturingScreenshot, setCapturingScreenshot] = useState(false);
  const [capturedScreenshots, setCapturedScreenshots] = useState<
    Array<{ id: string; url: string; time: string }>
  >([]);
  const [detectedDisplays, setDetectedDisplays] = useState<DetectedDisplay[]>([]);
  const [activeDisplay, setActiveDisplay] = useState("");
  const [brightness, setBrightness] = useState(100);
  const [volume, setVolume] = useState(100);
  const [inputText, setInputText] = useState("");
  const [sentInputs, setSentInputs] = useState<string[]>([]);
  const [typingPreview, setTypingPreview] = useState("");
  const [telemetry, setTelemetry] = useState<ScreenTelemetry>({
    resolution: "---",
    fps: "---",
    bitrate: "---",
    latency: "Connecting...",
    status: "STANDBY",
    displayName: "---",
  });

  const selectedDeviceRef = useRef("");
  const liveImgRef = useRef<HTMLImageElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const lastBlobUrlRef = useRef<string | null>(null);
  const lastFrameBlobRef = useRef<Blob | null>(null);
  const framesReceivedRef = useRef(0);
  const sliderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fpsTimerRef = useRef<{ last: number; count: number }>({ last: Date.now(), count: 0 });
  const latestFrameRef = useRef<Blob | null>(null);
  const paintScheduledRef = useRef(false);
  const hasLiveFrameRef = useRef(false);
  const [measuredFps, setMeasuredFps] = useState("---");

  const selectedDeviceOption = deviceOptions.find((opt) => opt.value === selectedDevice) || null;
  const canControl = isConnected;
  const activeDisplayMeta = detectedDisplays.find((d) => d.id === activeDisplay) || null;

  const activeDisplayRef = useRef("");

  useEffect(() => {
    activeDisplayRef.current = activeDisplay;
  }, [activeDisplay]);

  useEffect(() => {
    if (deviceOptions.length === 0) return;
    const knownIds = deviceOptions.map((d) => d.value);
    if (!selectedDeviceRef.current || !knownIds.includes(selectedDeviceRef.current)) {
      const first = deviceOptions[0].value;
      selectedDeviceRef.current = first;
      setSelectedDevice(first);
      setCommandStatus(`Connected to agent: ${first}`);
    }
  }, [deviceOptions]);

  const uploadMediaToVault = async (blob: Blob) => {
    const deviceId = selectedDeviceRef.current;
    if (!deviceId) {
      throw new Error("Select a live agent device before saving to cloud vault.");
    }

    const formData = new FormData();
    formData.append("file", blob, `screen_${Date.now()}.jpg`);
    formData.append("type", "image");
    formData.append("deviceId", deviceId);
    formData.append("source", "screen");

    const response = await fetch("/api/media/upload", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || "Database media save failed.");
    }

    await loadServerGallery(deviceId);
    return result;
  };

  const saveScreenshotToGallery = async (blob: Blob) => {
    setCommandStatus("Saving screenshot to database vault...");

    try {
      await uploadMediaToVault(blob);
      setCommandStatus("Screenshot saved to database vault.");
    } catch (error) {
      console.error("Screenshot upload failed:", error);
      setCommandStatus(
        error instanceof Error ? error.message : "Screenshot save failed — check agent and database."
      );
    }
  };

  const loadServerGallery = async (deviceId?: string) => {
    const targetId = deviceId || selectedDeviceRef.current;
    if (!targetId) return;

    try {
      const response = await fetch(
        `/api/media/list?deviceId=${encodeURIComponent(targetId)}&source=screen`
      );
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) return;

      const data = await response.json();
      if (!response.ok || !data.success || !Array.isArray(data.items)) return;

      const serverPhotos = data.items
        .filter((item: { type: string; id?: string }) => item.type === "image" && item.id && !String(item.id).includes("/"))
        .map((item: { id: string; url: string; timestamp?: string }) => ({
          id: String(item.id),
          url: item.url,
          time: item.timestamp
            ? new Date(item.timestamp).toLocaleTimeString()
            : new Date().toLocaleTimeString(),
        }));

      setCapturedScreenshots(serverPhotos);
    } catch (error) {
      console.warn("Failed to load screen gallery:", error);
    }
  };

  const downloadAsset = (assetUrl: string, fileName: string) => {
    const downloadLink = document.createElement("a");
    downloadLink.href = assetUrl;
    downloadLink.download = fileName;
    downloadLink.target = "_blank";
    downloadLink.rel = "noopener noreferrer";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const clearGalleryItem = async (id: string) => {
    if (!id || id.includes("/")) {
      setCommandStatus("Invalid media id — refresh gallery from database.");
      return;
    }
    try {
      const response = await fetch(`/api/media/${encodeURIComponent(id)}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Delete failed");
      }
      setCapturedScreenshots((prev) => prev.filter((item) => item.id !== id));
      setCommandStatus("Moved to trash. Restore from File Manager → Trash.");
    } catch (error) {
      console.error("Gallery delete failed:", error);
      setCommandStatus(error instanceof Error ? error.message : "Could not delete — refresh and try again.");
    }
  };

  useEffect(() => {
    if (!isConnected) return;
    const target =
      selectedDeviceRef.current ||
      gatewayClient.getScreenStreamingAgentId() ||
      deviceOptions[0]?.value;
    if (!target) return;
    selectedDeviceRef.current = target;
    setSelectedDevice((prev) => prev || target);
    gatewayDispatch("FETCH_SCREEN_TELEMETRY", {}, target);
    void loadServerGallery(target);
  }, [isConnected, deviceOptions.length, gatewayDispatch]);

  useEffect(() => {
    if (!selectedDevice) return;
    void loadServerGallery(selectedDevice);
  }, [selectedDevice]);

  useEffect(() => {
    if (isConnected && deviceOptions.length === 0) {
      setCommandStatus("Gateway connected — waiting for Rust agent...");
    }
    if (isConnected && deviceOptions.length > 0) {
      setCommandStatus((prev) =>
        prev.startsWith("Gateway disconnected") ? `Connected to agent: ${deviceOptions[0].value}` : prev
      );
    }
    if (!isConnected) {
      setCommandStatus("Connecting to gateway... (run npm run dev)");
    }
  }, [isConnected, deviceOptions.length, deviceOptions]);

  const dispatchControl = (
    action: string,
    payload: Record<string, unknown> = {},
    targetOverride?: string
  ) => {
    const target = targetOverride || selectedDeviceRef.current || resolveTarget(deviceOptions[0]?.value);
    if (!target) {
      setCommandStatus("No live agent. Run: cd zenvora_agent && cargo run");
      void refreshDevices();
      return;
    }

    if (!selectedDeviceRef.current) {
      selectedDeviceRef.current = target;
      setSelectedDevice(target);
    }

    const result = gatewayDispatch(action, payload, target);
    if (!result.ok) {
      setCommandStatus(
        result.reason === "offline"
          ? "Gateway not connected — wait for green dot."
          : "No live agent found. Run: cd zenvora_agent && cargo run"
      );
      return;
    }
    setCommandStatus(`Sent ${action} → ${result.target}`);
  
  };

  const probeDisplays = async () => {
  if (scanningDisplays) return;

  setScanningDisplays(true);

  try {
    await refreshDevices();

    const target = selectedDeviceRef.current || resolveTarget();

    if (!target) {
      setCommandStatus("No live agent. Start agent: cd zenvora_agent && cargo run");
      return;
    }

    setDetectedDisplays([]);
    setActiveDisplay("");

    dispatchControl("PROBE_DISPLAYS", {}, target);
    dispatchControl("LIST_DISPLAYS", {}, target);

    setCommandStatus("Scanning displays on agent...");
  } finally {
    // thora delay taake ack aajaye
    setTimeout(() => setScanningDisplays(false), 1500);
  }
};

  const startScreenStream = async () => {
    await refreshDevices();
    const target = selectedDeviceRef.current || resolveTarget();
    if (!target) {
      setCommandStatus("No live agent. Start agent: cd zenvora_agent && cargo run");
      return;
    }
    resetLivePreview();
    setIsStreaming(true);
    try {
      sessionStorage.setItem("zenvora_screen_streaming", "1");
    } catch {
      // ignore storage errors
    }
    dispatchControl("START_SCREEN_STREAM", {}, target);
    setCommandStatus("Starting screen stream...");
  };

  const resetLivePreview = () => {
    framesReceivedRef.current = 0;
    lastFrameBlobRef.current = null;
    setHasLiveFrame(false);
    hasLiveFrameRef.current = false;
    setLiveFrameCount(0);
    setMeasuredFps("---");
    if (lastBlobUrlRef.current) {
      URL.revokeObjectURL(lastBlobUrlRef.current);
      lastBlobUrlRef.current = null;
    }
    if (liveImgRef.current) liveImgRef.current.removeAttribute("src");
  };

  const showLiveFrame = useCallback((blob: Blob) => {
    if (blob.size < 100) return;

    latestFrameRef.current = blob;
    framesReceivedRef.current += 1;

    const now = Date.now();
    fpsTimerRef.current.count += 1;
    if (now - fpsTimerRef.current.last >= 1000) {
      setMeasuredFps(String(fpsTimerRef.current.count));
      setLiveFrameCount(framesReceivedRef.current);
      fpsTimerRef.current = { last: now, count: 0 };
    }

    if (paintScheduledRef.current) return;
    paintScheduledRef.current = true;

    requestAnimationFrame(() => {
      paintScheduledRef.current = false;
      const frame = latestFrameRef.current;
      if (!frame || !liveImgRef.current) return;

      lastFrameBlobRef.current = frame;
      const url = URL.createObjectURL(frame);
      if (lastBlobUrlRef.current) URL.revokeObjectURL(lastBlobUrlRef.current);
      lastBlobUrlRef.current = url;
      liveImgRef.current.src = url;

      if (!hasLiveFrameRef.current) {
        hasLiveFrameRef.current = true;
        setHasLiveFrame(true);
        setCommandStatus("Live screen stream active.");
      }
    });
  }, []);

  const processBinaryPayload = useCallback(
    (payload: ArrayBuffer | Blob) => {
      const bytes =
        payload instanceof Blob
          ? null
          : new Uint8Array(payload);

      const decodeAndPaint = (buffer: Uint8Array) => {
        if (buffer.length < 4) return;

        const frameType = buffer[0];
        if (frameType !== FRAME_SCREEN_STREAM && frameType !== FRAME_SCREEN_SNAPSHOT) return;

        const jpegBlob = new Blob([buffer.slice(1)], { type: "image/jpeg" });
        showLiveFrame(jpegBlob);
      };

      if (bytes) {
        decodeAndPaint(bytes);
        return;
      }

      void (payload as Blob).arrayBuffer().then((raw) => decodeAndPaint(new Uint8Array(raw)));
    },
    [showLiveFrame]
  );

  const processBinaryRef = useRef(processBinaryPayload);
  processBinaryRef.current = processBinaryPayload;

  const showLiveFrameRef = useRef(showLiveFrame);
  showLiveFrameRef.current = showLiveFrame;

  const stopScreenStream = () => {
    dispatchControl("STOP_SCREEN_STREAM", {});
    resetLivePreview();
    setIsStreaming(false);
    try {
      sessionStorage.setItem("zenvora_screen_streaming", "0");
    } catch {
      // ignore storage errors
    }
    setCommandStatus("Screen stream stopped.");
  };

  const handleDisplaySwitch = (display: DetectedDisplay) => {
    setActiveDisplay(display.id);
    activeDisplayRef.current = display.id;
    dispatchControl("SWITCH_DISPLAY", {
      display: display.id,
      display_index: display.index,
    });
    if (isStreaming) {
      resetLivePreview();
      setTimeout(() => dispatchControl("START_SCREEN_STREAM", {}), 250);
    }
  };

 const handleScreenshot = async () => {
  if (capturingScreenshot) return;

  setCapturingScreenshot(true);

  try {
    if (lastFrameBlobRef.current) {
      await saveScreenshotToGallery(lastFrameBlobRef.current);
      return;
    }

    dispatchControl("CAPTURE_SCREENSHOT", {
      display: activeDisplayRef.current,
    });

    setCommandStatus("Capturing screenshot...");
  } finally {
    setTimeout(() => setCapturingScreenshot(false), 1500);
  }
};

  const handleFullscreen = () => {
    const stage = stageRef.current;
    if (!stage) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void stage.requestFullscreen();
    }
  };

  const handleSliderChange = (param: "SET_DISPLAY_BRIGHTNESS" | "SET_SYSTEM_VOLUME", value: number) => {
    if (param === "SET_DISPLAY_BRIGHTNESS") setBrightness(value);
    else setVolume(value);

    if (sliderTimerRef.current) clearTimeout(sliderTimerRef.current);
    sliderTimerRef.current = setTimeout(() => {
      dispatchControl(param, { degree_value: value });
    }, 180);
  };

  const handleSendInput = () => {
    if (!inputText.trim()) return;
    const text = inputText.trim();
    dispatchControl("SEND_TEXT_INPUT", { text });
    setSentInputs((prev) => [...prev.slice(-4), text]);
    setTypingPreview("");
    setInputText("");
    setCommandStatus(`Input sent: "${text}"`);
  };

  useEffect(() => {
    selectedDeviceRef.current = selectedDevice;
  }, [selectedDevice]);

  useEffect(() => {
    return subscribe((event) => {
      if (event.type === "binary") {
        processBinaryRef.current(event.data);
        return;
      }

      if (event.type !== "json") return;

      const packet = event.packet;

      if (packet.type === "sys_error") {
        setCommandStatus(String(packet.message || "Command failed."));
        return;
      }

      if (packet.type === "screen_telemetry_stream") {
        const metrics = (packet.metrics || {}) as Record<string, unknown>;
        const sender = packet.senderAgentId as string | undefined;

        if (selectedDeviceRef.current && sender && sender !== selectedDeviceRef.current) return;

        if (Array.isArray(metrics.available_displays)) {
          setDetectedDisplays(metrics.available_displays as DetectedDisplay[]);
          if (!activeDisplayRef.current && metrics.available_displays.length > 0) {
            const first = metrics.available_displays[0] as DetectedDisplay;
            setActiveDisplay(first.id);
            activeDisplayRef.current = first.id;
          }
        }

        setTelemetry((prev) => ({
          resolution: (metrics.resolution as string) || prev.resolution,
          fps: (metrics.fps as string) || prev.fps,
          bitrate: (metrics.bitrate as string) || prev.bitrate,
          latency: metrics.latency_ms ? `${metrics.latency_ms}ms` : prev.latency,
          status: (packet.status as string) || (metrics.status as string) || prev.status,
          displayName: (metrics.display_name as string) || prev.displayName,
        }));

        const action = packet.action as string | undefined;
        if (typeof metrics.brightness === "number" && (
          action === "SET_DISPLAY_BRIGHTNESS" ||
          action === "PROBE_DISPLAYS" ||
          action === "LIST_DISPLAYS"
        )) {
          setBrightness(metrics.brightness as number);
        }
        if (typeof metrics.volume === "number" && (
          action === "SET_SYSTEM_VOLUME" ||
          action === "PROBE_DISPLAYS" ||
          action === "LIST_DISPLAYS"
        )) {
          setVolume(metrics.volume as number);
        }
        if (typeof metrics.streaming_active === "boolean") {
          setIsStreaming(metrics.streaming_active as boolean);
          try {
            sessionStorage.setItem(
              "zenvora_screen_streaming",
              metrics.streaming_active ? "1" : "0"
            );
          } catch {
            // ignore storage errors
          }
        }

        const embeddedFrame =
          (typeof packet.live_frame_b64 === "string" && packet.live_frame_b64) ||
          (typeof metrics.live_frame_b64 === "string" && metrics.live_frame_b64);

        if (typeof embeddedFrame === "string" && embeddedFrame.length > 100) {
          try {
            const blob = b64ToBlob(embeddedFrame, "image/jpeg");
            showLiveFrameRef.current(blob);
            if (action === "CAPTURE_SCREENSHOT") {
              void saveScreenshotToGallery(blob);
            }
          } catch (error) {
            console.warn("live_frame_b64 decode failed:", error);
          }
        }

        if (packet.message) setCommandStatus(String(packet.message));

        if (
          action === "SEND_TEXT_INPUT" &&
          typeof metrics.last_sent_text === "string" &&
          metrics.last_sent_text
        ) {
          setSentInputs((prev) => {
            if (prev[prev.length - 1] === metrics.last_sent_text) return prev;
            return [...prev.slice(-4), metrics.last_sent_text as string];
          });
        }
        return;
      }

      if (packet.type === "sys_ack" && typeof packet.message === "string" && packet.message) {
        setCommandStatus(packet.message);
      }
    });
  }, [subscribe]);

  useEffect(() => {
    return () => {
      if (sliderTimerRef.current) clearTimeout(sliderTimerRef.current);
      if (lastBlobUrlRef.current) URL.revokeObjectURL(lastBlobUrlRef.current);
    };
  }, []);

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />

      <main className="flex-1 lg:ml-64 overflow-auto">
        <div className="p-6 lg:p-12">
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-4xl lg:text-5xl font-display tracking-tight mb-2 flex items-center gap-3">
                Screen Monitor
                <span
                  className={`w-3 h-3 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`}
                />
              </h1>
              <p className="text-muted-foreground">
                High-clarity remote desktop stream from the Rust agent
              </p>
            </div>
            <Button
              variant="outline"
              size="icon"
              disabled={!canControl}
              onClick={() => dispatchControl("FETCH_SCREEN_TELEMETRY", {})}
              className="border-border hover:bg-accent/10"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <Select<DeviceOption, false>
              instanceId="screen-device-dropdown"
              value={selectedDeviceOption}
              onChange={(option) => {
                if (option) {
                  setSelectedDevice(option.value);
                  selectedDeviceRef.current = option.value;
                  resetLivePreview();
                  setDetectedDisplays([]);
                  setActiveDisplay("");
                  setIsStreaming(false);
                }
              }}
              options={deviceOptions}
              className="flex-1"
              classNamePrefix="react-select"
              placeholder={isConnected ? "Select live Rust agent..." : "Connecting..."}
              isDisabled={!isConnected || deviceOptions.length === 0}
            />
          </div>

          <div className="mb-6 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
            {commandStatus}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mb-8">
            <div className="xl:col-span-8 flex flex-col gap-6">
              <div className="flex flex-wrap gap-3">
                <Button
  onClick={probeDisplays}
  disabled={!canControl || scanningDisplays}
  variant="outline"
  className="gap-2 border-border hover:bg-accent/10"
>
  <RefreshCw
    className={`w-4 h-4 ${scanningDisplays ? "animate-spin" : ""}`}
  />
  {scanningDisplays ? "Scanning..." : "Scan Displays"}
</Button>
                
               
                <Button
                  onClick={startScreenStream}
                  disabled={!canControl || isStreaming}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Power className="w-4 h-4" /> Start Stream
                </Button>
                <Button
                  onClick={stopScreenStream}
                  disabled={!canControl || !isStreaming}
                  variant="outline"
                  className="gap-2 border-border hover:bg-accent/10"
                >
                  <Power className="w-4 h-4" /> Stop Stream
                </Button>
              </div>

              {detectedDisplays.length === 0 ? (
                <Card className="border border-dashed border-border bg-card/40 p-6 text-sm text-muted-foreground">
                  No displays scanned yet. Select your agent and click <strong>Scan Displays</strong>.
                </Card>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {detectedDisplays.map((display) => (
                    <button
                      key={display.id}
                      onClick={() => handleDisplaySwitch(display)}
                      disabled={!canControl}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        activeDisplay === display.id
                          ? "border-foreground bg-accent/10"
                          : "border-border bg-card hover:border-foreground/50"
                      } disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold">{display.label}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{display.resolution}</p>
                        </div>
                        <Monitor className="w-4 h-4 shrink-0" />
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{display.is_primary ? "Primary" : "Secondary"}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 ${
                            display.status === "ACTIVE"
                              ? "bg-emerald-500/15 text-emerald-600"
                              : "bg-accent/20"
                          }`}
                        >
                          {display.status}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div
                ref={stageRef}
                className="relative h-[62vh] min-h-[420px] w-full overflow-hidden rounded-2xl border border-border bg-black shadow-2xl"
              >
                <div className="absolute inset-0 z-10 flex h-full w-full items-center justify-center">
                  <img
                    ref={liveImgRef}
                    alt="Live screen feed"
                    className="max-h-full max-w-full object-contain"
                    style={{ opacity: hasLiveFrame ? 1 : 0, imageRendering: "auto" }}
                  />
                </div>

                {!hasLiveFrame && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black p-6 text-center">
                    <Monitor className="w-16 h-16 mb-4 text-white/30 animate-pulse" />
                    <p className="text-white/70 mb-1">
                      {isStreaming ? "Waiting for screen frames..." : "Stream off — click Start Stream"}
                    </p>
                    <p className="text-xs text-white/50 bg-white/10 px-3 py-1 rounded-full flex items-center gap-2 mt-2">
                      <Cpu className="w-3 h-3" /> {selectedDevice || "No agent"} •{" "}
                      {activeDisplayMeta?.label || "No display"} • Frames: {liveFrameCount}
                    </p>
                  </div>
                )}

                {hasLiveFrame && (
                  <div className="absolute top-4 right-4 z-30 rounded-full bg-red-600/90 px-3 py-1 text-xs font-mono font-bold text-white">
                    LIVE • {measuredFps !== "---" ? `${measuredFps} FPS` : liveFrameCount}
                  </div>
                )}

                <div className="absolute bottom-4 left-4 z-30 rounded-full bg-black/60 px-3 py-1 text-xs font-mono text-white backdrop-blur-sm">
                  {telemetry.resolution} • {telemetry.displayName}
                </div>

                {(typingPreview || sentInputs.length > 0) && (
                  <div className="absolute bottom-14 left-4 right-4 z-30 space-y-2 pointer-events-none">
                    {typingPreview && (
                      <div className="rounded-xl border border-white/20 bg-black/75 px-4 py-3 text-white backdrop-blur-md shadow-lg">
                        <p className="text-[10px] uppercase tracking-widest text-emerald-300 mb-1">
                          Typing on remote screen
                        </p>
                        <p className="font-mono text-sm break-all">
                          {typingPreview}
                          <span className="ml-1 inline-block h-4 w-0.5 animate-pulse bg-emerald-400 align-middle" />
                        </p>
                      </div>
                    )}
                    {sentInputs.slice(-3).map((line, index) => (
                      <div
                        key={`${line}-${index}`}
                        className="rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-white/90 backdrop-blur-sm"
                      >
                        <p className="text-[10px] uppercase tracking-widest text-white/50 mb-0.5">Sent</p>
                        <p className="font-mono text-xs break-all">{line}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
  variant="outline"
  disabled={!canControl || capturingScreenshot}
  onClick={handleScreenshot}
  className="border-border hover:bg-accent/10 gap-2"
>
  <Download
    className={`w-4 h-4 ${capturingScreenshot ? "animate-spin" : ""}`}
  />
  {capturingScreenshot ? "Capturing..." : "Screenshot"}
</Button>
                <Button
                  variant="outline"
                  disabled={!canControl || !isStreaming}
                  onClick={() => {
                    resetLivePreview();
                    dispatchControl("START_SCREEN_STREAM", {});
                  }}
                  className="border-border hover:bg-accent/10 gap-2"
                >
                  <RotateCw className="w-4 h-4" /> Refresh
                </Button>
                <Button
                  variant="outline"
                  disabled={!hasLiveFrame}
                  onClick={handleFullscreen}
                  className="border-border hover:bg-accent/10 gap-2"
                >
                  <Maximize2 className="w-4 h-4" /> Fullscreen
                </Button>
              </div>
            </div>

            <div className="xl:col-span-4 grid gap-4 content-start">
              <Card className="p-6 border border-border bg-card">
                <h3 className="font-semibold mb-4 flex items-center justify-between">
                  Stream Metrics
                  <span className="text-xs font-mono bg-accent/20 text-muted-foreground px-2 py-0.5 rounded">
                    {telemetry.status}
                  </span>
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between border-b border-border/40 pb-2">
                    <span className="text-muted-foreground">Resolution</span>
                    <span className="font-mono font-semibold">{telemetry.resolution}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/40 pb-2">
                    <span className="text-muted-foreground">Target FPS</span>
                    <span className="font-mono font-semibold">{telemetry.fps}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/40 pb-2">
                    <span className="text-muted-foreground">Measured FPS</span>
                    <span className="font-mono font-semibold text-emerald-500">{measuredFps}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/40 pb-2">
                    <span className="text-muted-foreground">Bitrate</span>
                    <span className="font-mono font-semibold">{telemetry.bitrate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Latency</span>
                    <span className="font-mono font-semibold">{telemetry.latency}</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border border-border bg-card">
                <h3 className="font-semibold mb-4">Device Controls</h3>
                <div className="space-y-6">
                  <CustomSlider
                    label="Brightness"
                    min={0}
                    max={100}
                    value={brightness}
                    onChange={(val) => handleSliderChange("SET_DISPLAY_BRIGHTNESS", val)}
                    showValue
                    unit="%"
                  />
                  <CustomSlider
                    label="Volume"
                    min={0}
                    max={100}
                    value={volume}
                    onChange={(val) => handleSliderChange("SET_SYSTEM_VOLUME", val)}
                    showValue
                    unit="%"
                  />

                  <div className="border-t border-border pt-4 space-y-2">
                    <Button
                      variant="outline"
                      disabled={!canControl}
                      className="w-full border-border hover:bg-accent/10 justify-start gap-2"
                      onClick={() => dispatchControl("LOCK_SCREEN", {})}
                    >
                      <Lock className="w-4 h-4" /> Lock Screen
                    </Button>
                    <Button
                      variant="outline"
                      disabled={!canControl}
                      className="w-full border-border hover:bg-accent/10 justify-start gap-2"
                      onClick={() => dispatchControl("OPEN_SETTINGS", {})}
                    >
                      <Settings className="w-4 h-4" /> Settings
                    </Button>
                    <Button
                      variant="outline"
                      disabled={!canControl}
                      className="w-full border-border hover:bg-accent/10 justify-start gap-2"
                      onClick={() =>
                        setCommandStatus("Reboot is disabled on desktop agent for safety.")
                      }
                    >
                      <RotateCw className="w-4 h-4" /> Reboot
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <Card className="p-6 border border-border bg-card">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Volume2 className="w-4 h-4" /> Send Input
            </h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  setTypingPreview(e.target.value);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSendInput()}
                placeholder="Type text to send to device..."
                className="flex-1 px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
              />
              <Button
                disabled={!canControl || !inputText.trim()}
                onClick={handleSendInput}
                className="bg-foreground hover:bg-foreground/90 text-background px-6"
              >
                Send
              </Button>
            </div>
          </Card>

          <div className="mt-12 border-t border-border pt-10">
            <h2 className="text-2xl font-semibold tracking-tight mb-6 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-muted-foreground" /> Captured Media Buffer Gallery
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Loaded from database for agent <span className="font-mono">{selectedDevice || "—"}</span>. New screenshots appear here only after DB save.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="p-6 border border-border bg-card/40 md:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Monitor className="w-4 h-4" /> Screen Screenshots ({capturedScreenshots.length})
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!canControl}
                    onClick={() => loadServerGallery()}
                    className="border-border hover:bg-accent/10 gap-2"
                  >
                    <Download className="w-4 h-4" /> Refresh Gallery
                  </Button>
                </div>
                {capturedScreenshots.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic bg-accent/5 p-4 rounded-lg text-center">
                    No screenshots in database for this agent yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[360px] overflow-auto pr-1">
                    {capturedScreenshots.map((photo) => (
                      <div
                        key={photo.id}
                        className="group relative border border-border rounded-md overflow-hidden bg-black aspect-video flex items-center justify-center"
                      >
                        <img
                          src={photo.url}
                          alt="Screen capture"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-8 w-8"
                            onClick={() => downloadAsset(photo.url, `screen_${photo.id}.jpg`)}
                          >
                            <Download className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="destructive"
                            className="h-8 w-8"
                            onClick={() => clearGalleryItem(photo.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        <span className="absolute bottom-1 right-1 text-[10px] font-mono bg-black/70 px-1.5 py-0.5 rounded text-white">
                          {photo.time}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
