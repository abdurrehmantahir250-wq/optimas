"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CustomSlider } from "@/components/custom-slider";
import { Camera, Video, Download, RefreshCw, Smartphone, Play, Square } from "lucide-react";
import { useState } from "react";

export default function CameraPage() {
  const [selectedDevice, setSelectedDevice] = useState("device-1");
  const [activeCamera, setActiveCamera] = useState("front");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const cameras = [
    { id: "front", label: "Front Camera", resolution: "12MP", fps: 60 },
    { id: "back", label: "Rear Camera", resolution: "48MP", fps: 30 },
  ];

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />

      {/* Main content */}
      <main className="flex-1 lg:ml-64 overflow-auto">
        <div className="p-6 lg:p-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl lg:text-5xl font-display tracking-tight mb-2">Camera Access</h1>
            <p className="text-muted-foreground">Stream front and rear camera feeds</p>
          </div>

          {/* Device selector */}
          <div className="mb-8 flex gap-4">
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="flex-1 px-4 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
            >
              <option value="device-1">Samsung Galaxy S24</option>
              <option value="device-2">iPhone 15 Pro</option>
              <option value="device-3">Pixel 8</option>
            </select>
          </div>

          {/* Camera selection */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {cameras.map((cam) => (
              <button
                key={cam.id}
                onClick={() => setActiveCamera(cam.id)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  activeCamera === cam.id
                    ? "border-foreground bg-accent/10"
                    : "border-border bg-card hover:border-foreground/50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{cam.label}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{cam.resolution}</p>
                  </div>
                  <Camera className="w-4 h-4" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">{cam.fps} FPS</p>
              </button>
            ))}
          </div>

          {/* Main camera stream */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <div className="lg:col-span-2">
              <Card className="border border-border bg-black overflow-hidden aspect-video flex items-center justify-center relative">
                <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black flex flex-col items-center justify-center p-6">
                  <Camera className="w-16 h-16 mb-4 text-white/30" />
                  <p className="text-white/70 mb-1">Live Camera Feed</p>
                  <p className="text-xs text-white/50">
                    {activeCamera === "front" ? "Front Camera" : "Rear Camera"}
                  </p>

                  {/* Recording indicator */}
                  {isRecording && (
                    <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600/90 px-3 py-2 rounded-full">
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      <span className="text-white text-xs font-mono">REC</span>
                      <span className="text-white text-xs font-mono">{String(Math.floor(recordingTime / 60)).padStart(2, '0')}:{String(recordingTime % 60).padStart(2, '0')}</span>
                    </div>
                  )}
                </div>
              </Card>

              {/* Controls */}
              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  onClick={() => setIsRecording(!isRecording)}
                  className={`gap-2 ${
                    isRecording
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-foreground hover:bg-foreground/90 text-background"
                  }`}
                >
                  {isRecording ? (
                    <>
                      <Square className="w-4 h-4" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Video className="w-4 h-4" />
                      Start Recording
                    </>
                  )}
                </Button>

                <Button variant="outline" className="border-border hover:bg-accent/10 gap-2">
                  <Camera className="w-4 h-4" />
                  Capture Photo
                </Button>

                <Button variant="outline" className="border-border hover:bg-accent/10 gap-2">
                  <Download className="w-4 h-4" />
                  Download
                </Button>

                <Button variant="outline" className="border-border hover:bg-accent/10 gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Camera stats and settings */}
            <div className="space-y-4">
              <Card className="p-6 border border-border bg-card">
                <h3 className="font-semibold mb-4">Camera Details</h3>

                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Resolution</p>
                    <p className="font-mono text-base">{activeCamera === "front" ? "12MP" : "48MP"}</p>
                  </div>

                  <div>
                    <p className="text-muted-foreground mb-1">Frame Rate</p>
                    <p className="font-mono text-base">{activeCamera === "front" ? "60" : "30"} FPS</p>
                  </div>

                  <div>
                    <p className="text-muted-foreground mb-1">Bitrate</p>
                    <p className="font-mono text-base">{activeCamera === "front" ? "4.2" : "8.5"} Mbps</p>
                  </div>

                  <div>
                    <p className="text-muted-foreground mb-1">Latency</p>
                    <p className="font-mono text-base">32ms</p>
                  </div>
                </div>
              </Card>

              {/* Camera settings */}
              <Card className="p-6 border border-border bg-card">
                <h3 className="font-semibold mb-4">Settings</h3>

                <div className="space-y-6">
                  <CustomSlider
                    label="Brightness"
                    min={0}
                    max={100}
                    value={50}
                    showValue={true}
                    unit="%"
                  />

                  <CustomSlider
                    label="Contrast"
                    min={0}
                    max={100}
                    value={50}
                    showValue={true}
                    unit="%"
                  />

                  <CustomSlider
                    label="Zoom"
                    min={1}
                    max={10}
                    step={0.1}
                    value={1}
                    showValue={true}
                    unit="x"
                  />

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Flash</span>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-border">
                      <span className="inline-block h-4 w-4 translate-x-1 transform rounded-full bg-background transition" />
                    </button>
                  </div>
                </div>
              </Card>

              {/* Recent captures */}
              <Card className="p-4 border border-border bg-card">
                <h3 className="font-semibold mb-3">Recent Captures</h3>
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 hover:bg-accent/10 rounded transition-colors cursor-pointer"
                    >
                      <span className="text-sm text-muted-foreground">capture_{i}.jpg</span>
                      <Download className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
