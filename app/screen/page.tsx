"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CustomSlider } from "@/components/custom-slider";
import { Download, Smartphone, Maximize2, RotateCw, Settings, Volume2, Lock } from "lucide-react";
import { useState } from "react";

export default function ScreenPage() {
  const [selectedDevice, setSelectedDevice] = useState("device-1");
  const [isStreaming, setIsStreaming] = useState(true);
  const [brightness, setBrightness] = useState(80);
  const [volume, setVolume] = useState(60);

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />

      {/* Main content */}
      <main className="flex-1 lg:ml-64 overflow-auto">
        <div className="p-6 lg:p-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl lg:text-5xl font-display tracking-tight mb-2">Screen Monitor</h1>
            <p className="text-muted-foreground">View and control device screen remotely</p>
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
            <Button
              onClick={() => setIsStreaming(!isStreaming)}
              className="bg-foreground hover:bg-foreground/90 text-background px-6 rounded-lg"
            >
              {isStreaming ? "Stop Stream" : "Start Stream"}
            </Button>
          </div>

          {/* Main screen display */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Screen */}
            <div className="lg:col-span-2">
              <Card className="border border-border bg-black overflow-hidden aspect-video flex items-center justify-center relative">
                {isStreaming ? (
                  <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black flex flex-col items-center justify-center p-6">
                    <div className="text-center">
                      <Smartphone className="w-16 h-16 mx-auto mb-4 text-white/50" />
                      <p className="text-white/70 mb-2">Live Screen Stream</p>
                      <p className="text-xs text-white/50">Samsung Galaxy S24 • Connected</p>
                    </div>

                    {/* Simulated UI elements */}
                    <div className="absolute top-8 left-8 right-8 text-white text-xs">
                      <div className="flex justify-between mb-4">
                        <span>9:41</span>
                        <div className="flex gap-1">
                          <span>📶</span>
                          <span>📡</span>
                          <span>🔋</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-white/50">Stream stopped</p>
                  </div>
                )}
              </Card>

              {/* Screen controls */}
              <div className="mt-6 flex flex-wrap gap-3">
                <Button variant="outline" className="border-border hover:bg-accent/10 gap-2">
                  <Download className="w-4 h-4" />
                  Screenshot
                </Button>
                <Button variant="outline" className="border-border hover:bg-accent/10 gap-2">
                  <RotateCw className="w-4 h-4" />
                  Refresh
                </Button>
                <Button variant="outline" className="border-border hover:bg-accent/10 gap-2">
                  <Maximize2 className="w-4 h-4" />
                  Fullscreen
                </Button>
              </div>
            </div>

            {/* Control panel */}
            <div className="space-y-4">
              <Card className="p-6 border border-border bg-card">
                <h3 className="font-semibold mb-4">Device Controls</h3>

                <div className="space-y-6">
                  {/* Brightness */}
                  <CustomSlider
                    label="Brightness"
                    min={0}
                    max={100}
                    value={brightness}
                    onChange={setBrightness}
                    showValue={true}
                    unit="%"
                  />

                  {/* Volume */}
                  <CustomSlider
                    label="Volume"
                    min={0}
                    max={100}
                    value={volume}
                    onChange={setVolume}
                    showValue={true}
                    unit="%"
                  />

                  <div className="border-t border-border pt-4">
                    <p className="text-xs font-mono text-muted-foreground uppercase tracking-wide mb-3">Actions</p>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full border-border hover:bg-accent/10 justify-start gap-2">
                        <Lock className="w-4 h-4" />
                        Lock Screen
                      </Button>
                      <Button variant="outline" className="w-full border-border hover:bg-accent/10 justify-start gap-2">
                        <RotateCw className="w-4 h-4" />
                        Reboot
                      </Button>
                      <Button variant="outline" className="w-full border-border hover:bg-accent/10 justify-start gap-2">
                        <Settings className="w-4 h-4" />
                        Settings
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Stats */}
              <Card className="p-4 border border-border bg-card/50">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">FPS</span>
                    <span className="font-mono">60</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Latency</span>
                    <span className="font-mono">45ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bitrate</span>
                    <span className="font-mono">8.5 Mbps</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Resolution</span>
                    <span className="font-mono">1440p</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Keyboard input */}
          <Card className="p-6 border border-border bg-card">
            <h3 className="font-semibold mb-4">Send Input</h3>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Type text to send..."
                className="flex-1 px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
              />
              <Button className="bg-foreground hover:bg-foreground/90 text-background px-6">Send</Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
