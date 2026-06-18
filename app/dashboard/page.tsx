"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QrCode, Plus, Smartphone, Battery, Zap, Wifi, Eye, Trash2, MoreVertical, FileText } from "lucide-react";
import { useState } from "react";

export default function DashboardPage() {
  const [showQRModal, setShowQRModal] = useState(false);

  const devices = [
    {
      id: 1,
      name: "Samsung Galaxy S24",
      model: "SM-S9110",
      status: "online",
      battery: 87,
      storage: 56,
      lastSeen: "2 minutes ago",
      network: "5G",
    },
    {
      id: 2,
      name: "iPhone 15 Pro",
      model: "A2847",
      status: "online",
      battery: 42,
      storage: 78,
      lastSeen: "5 minutes ago",
      network: "WiFi",
    },
    {
      id: 3,
      name: "Pixel 8",
      model: "G4S9Q",
      status: "offline",
      battery: 12,
      storage: 34,
      lastSeen: "2 hours ago",
      network: "None",
    },
  ];

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
                  <p className="text-3xl font-display">2</p>
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
                  <p className="text-3xl font-display">3</p>
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
                  <p className="text-3xl font-display">47%</p>
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
                          <Smartphone className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{device.name}</h3>
                          <p className="text-sm text-muted-foreground">{device.model}</p>
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
                                  device.battery > 50
                                    ? "bg-green-600"
                                    : device.battery > 20
                                    ? "bg-orange-600"
                                    : "bg-red-600"
                                }`}
                                style={{ width: `${device.battery}%` }}
                              />
                            </div>
                            <span className="text-sm font-mono">{device.battery}%</span>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Storage</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-border rounded-full h-2">
                              <div
                                className="h-full rounded-full bg-blue-600"
                                style={{ width: `${device.storage}%` }}
                              />
                            </div>
                            <span className="text-sm font-mono">{device.storage}%</span>
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
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-border hover:bg-accent/10"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Control
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-border hover:bg-accent/10"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Files
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-border hover:bg-accent/10"
                        >
                          Screenshot
                        </Button>
                      </div>
                    </div>

                    <button className="p-2 hover:bg-accent/10 rounded-lg transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
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
