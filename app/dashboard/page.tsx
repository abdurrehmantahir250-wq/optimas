"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QrCode, Plus, Smartphone, Laptop, Battery, Zap, Wifi, Eye, Trash2, MoreVertical, FileText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useGateway } from "@/hooks/use-gateway";

interface DashboardDevice {
  id: string;
  name: string;
  model: string;
  status: "online" | "offline";
  battery: number | null;
  storage: number | null;
  lastSeen: string;
  network: string;
  role: string;
  platform?: string;
  localIp?: string;
  publicIp?: string;
}

const fallbackDevices: DashboardDevice[] = [

];

export default function DashboardPage() {
  const { devices: gatewayDevices, refreshDevices, socket } = useGateway();
  const router = useRouter();
  const [backendDevices, setBackendDevices] = useState<any[]>([]);
  const [showQRModal, setShowQRModal] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [openControlMenu, setOpenControlMenu] = useState<string | null>(null);

  const fetchDeviceMetadata = async () => {
    try {
      const response = await fetch("/api/network/live-agents");
      if (!response.ok) return;
      const payload = await response.json();
      if (payload.success && Array.isArray(payload.devices)) {
        setBackendDevices(payload.devices);
      }
    } catch (error) {
      console.warn("Unable to fetch device metadata:", error);
    }
  };

  useEffect(() => {
    void refreshDevices();
    void fetchDeviceMetadata();
  }, [refreshDevices]);

  useEffect(() => {
    if (!gatewayDevices) return;
    void fetchDeviceMetadata();
  }, [gatewayDevices.length]);

  useEffect(() => {
    if (!socket) return;

    const handleSocketMessage = (event: MessageEvent) => {
      if (typeof event.data !== "string") return;
      try {
        const packet = JSON.parse(event.data);
        if (packet.type === "device_status_update") {
          void fetchDeviceMetadata();
        }
      } catch {
        // ignore malformed messages
      }
    };

    socket.addEventListener("message", handleSocketMessage);
    return () => socket.removeEventListener("message", handleSocketMessage);
  }, [socket]);

  const devices = useMemo(() => {
    if (!gatewayDevices || gatewayDevices.length === 0) {
      return fallbackDevices;
    }

    return gatewayDevices.map((device) => {
      const metadata = backendDevices.find((item) => item.value === device.value) || {};
      const battery = typeof metadata.battery === "number" ? metadata.battery : null;
      const storage = typeof metadata.storage === "number" ? metadata.storage : null;
      return {
        id: device.value,
        name: metadata.label || device.label || device.value,
        model: metadata.platform || device.role || "Unknown",
        status: metadata.status || "online",
        battery,
        storage,
        lastSeen: metadata.lastSeen ? new Date(metadata.lastSeen).toLocaleString() : "now",
        network: metadata.localIp ? "LAN" : metadata.publicIp ? "WAN" : "Unknown",
        role: device.role || "AGENT",
        localIp: metadata.localIp || "",
        publicIp: metadata.publicIp || "",
      } as DashboardDevice;
    });
  }, [backendDevices, gatewayDevices]);

  const onlineCount = devices.filter((device) => device.status === "online").length;
  const totalCount = devices.length;
  const averageBattery = Math.round(
    devices.filter((device) => typeof device.battery === "number").reduce((sum, device) => sum + (device.battery || 0), 0) /
      Math.max(1, devices.filter((device) => typeof device.battery === "number").length)
  );

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />

      {/* Main content */}
      <main className="flex-1 lg:ml-64 overflow-auto">
        <div className="p-6 lg:p-12">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-end justify-between mb-4">
              <div>
                <h1 className="text-4xl lg:text-5xl font-display tracking-tight mb-2">
                  Device Dashboard
                </h1>
                <p className="text-muted-foreground">
                  Monitor and manage your connected Android devices
                </p>
              </div>
              <Button
                onClick={() => setShowQRModal(true)}
                className="bg-foreground hover:bg-foreground/90 text-background px-6 h-12 rounded-full group inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Pair Device
              </Button>
            </div>
          </div>

          {/* Stats overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="p-6 border border-border bg-card hover-lift">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Online Devices</p>
                  <p className="text-3xl font-display">{onlineCount}</p>
                </div>
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6 border border-border bg-card hover-lift">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Total Devices</p>
                  <p className="text-3xl font-display">{totalCount}</p>
                </div>
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6 border border-border bg-card hover-lift">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Avg Battery</p>
                  <p className="text-3xl font-display">{Number.isNaN(averageBattery) ? "—" : `${averageBattery}%`}</p>
                </div>
                <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                  <Battery className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </Card>
          </div>

          {/* Devices list */}
          <div>
            <h2 className="text-xl font-display mb-6">Paired Devices</h2>
            <div className="space-y-4">
              {devices.map((device) => (
                <Card
                  key={device.id}
                  className="p-6 border border-border bg-card hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-sidebar rounded-lg flex items-center justify-center">
                          {device.platform && (device.platform === 'android' || device.platform === 'android') ? (
                            <Smartphone className="w-6 h-6" />
                          ) : (device.platform && ['windows','mac','linux'].includes(String(device.platform).toLowerCase()) ? (
                            <Laptop className="w-6 h-6" />
                          ) : (
                            <Smartphone className="w-6 h-6" />
                          ))}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{device.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {device.model} · {device.role}
                          </p>
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                          <div
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono ${
                              device.status === "online"
                                ? "bg-green-500/20 text-green-700"
                                : "bg-gray-500/20 text-gray-700"
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                device.status === "online" ? "bg-green-600" : "bg-gray-600"
                              }`}
                            />
                            {device.status === "online" ? "Online" : "Offline"}
                          </div>
                        </div>
                      </div>

                      {/* Device info grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Battery</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-border rounded-full h-2">
                              <div
                                className={`h-full rounded-full ${
                                  typeof device.battery === "number"
                                    ? device.battery > 50
                                      ? "bg-green-600"
                                      : device.battery > 20
                                      ? "bg-orange-600"
                                      : "bg-red-600"
                                    : "bg-gray-400"
                                }`}
                                style={{ width: `${typeof device.battery === "number" ? device.battery : 0}%` }}
                              />
                            </div>
                            <span className="text-sm font-mono">
                              {typeof device.battery === "number" ? `${device.battery}%` : "N/A"}
                            </span>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Storage</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-border rounded-full h-2">
                              <div
                                className="h-full rounded-full bg-blue-600"
                                style={{ width: `${typeof device.storage === "number" ? device.storage : 0}%` }}
                              />
                            </div>
                            <span className="text-sm font-mono">
                              {typeof device.storage === "number" ? `${device.storage}%` : "N/A"}
                            </span>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Network</p>
                          <div className="flex items-center gap-1.5">
                            <Wifi className="w-4 h-4" />
                            <span className="text-sm font-mono">{device.network}</span>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Last Seen</p>
                          <p className="text-sm font-mono">{device.lastSeen}</p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap gap-2">
                        <div className="relative">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-border hover:bg-accent/10"
                            onClick={() => setOpenControlMenu(openControlMenu === device.id ? null : device.id)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Control
                          </Button>
                          {openControlMenu === device.id && (
                            <div className="absolute right-0 mt-2 w-40 bg-card border border-border rounded shadow-sm z-40">
                              <button className="w-full text-left px-3 py-2 hover:bg-accent/10" onClick={() => { setOpenControlMenu(null); router.push(`/camera?device=${device.id}`); }}>
                                Camera
                              </button>
                              <button className="w-full text-left px-3 py-2 hover:bg-accent/10" onClick={() => { setOpenControlMenu(null); router.push(`/screen?device=${device.id}`); }}>
                                Screen
                              </button>
                            </div>
                          )}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="border-border hover:bg-accent/10"
                          onClick={() => router.push(`/files?device=${device.id}`)}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Files
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          className="border-border hover:bg-accent/10"
                          onClick={() => router.push(`/screenshot?device=${device.id}`)}
                        >
                          Screenshot
                        </Button>
                      </div>
                    </div>

                    <div className="relative">
                      <button className="p-2 hover:bg-accent/10 rounded-lg transition-colors" onClick={() => setOpenMenu(openMenu === device.id ? null : device.id)}>
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {openMenu === device.id && (
                        <div className="absolute right-0 mt-2 w-44 bg-card border border-border rounded shadow-sm z-50">
                          <button className="w-full text-left px-3 py-2 hover:bg-accent/10" onClick={() => { setOpenMenu(null); router.push(`/files?device=${device.id}`); }}>Files</button>
                          <button className="w-full text-left px-3 py-2 hover:bg-accent/10" onClick={() => { setOpenMenu(null); router.push(`/camera?device=${device.id}`); }}>Camera</button>
                          <button className="w-full text-left px-3 py-2 hover:bg-accent/10" onClick={() => { setOpenMenu(null); router.push(`/screen?device=${device.id}`); }}>Screen</button>
                          <button className="w-full text-left px-3 py-2 hover:bg-accent/10" onClick={() => { setOpenMenu(null); router.push(`/logs?device=${device.id}`); }}>Activity</button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* QR Modal */}
          {showQRModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="max-w-md w-full p-8 bg-card border border-border">
                <h3 className="text-xl font-display mb-4">Pair New Device</h3>

                <div className="space-y-6">
                  {/* QR Code placeholder */}
                  <div className="flex justify-center">
                    <div className="w-64 h-64 bg-muted rounded-lg flex items-center justify-center border-2 border-border">
                      <QrCode className="w-24 h-24 text-muted-foreground/50" />
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Or use pairing code:</p>
                    <input
                      type="text"
                      placeholder="Enter pairing code"
                      className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 border-border"
                      onClick={() => setShowQRModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button className="flex-1 bg-foreground hover:bg-foreground/90 text-background">
                      Pair
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}