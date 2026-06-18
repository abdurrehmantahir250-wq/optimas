"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, Filter, MoreVertical, Smartphone, AlertCircle, Power, Settings, Trash2 } from "lucide-react";
import { useState } from "react";

export default function AdminDevicesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const devices = [
    {
      id: 1,
      name: "Samsung Galaxy S24",
      owner: "Alice Johnson",
      model: "SM-S9110",
      status: "online",
      battery: 87,
      storage: 56,
      lastSeen: "2 mins ago",
      os: "Android 14",
    },
    {
      id: 2,
      name: "iPhone 15 Pro",
      owner: "Bob Smith",
      model: "A2847",
      status: "online",
      battery: 42,
      storage: 78,
      lastSeen: "5 mins ago",
      os: "iOS 18",
    },
    {
      id: 3,
      name: "Pixel 8",
      owner: "Carol Williams",
      model: "G4S9Q",
      status: "offline",
      battery: 12,
      storage: 34,
      lastSeen: "2 hours ago",
      os: "Android 14",
    },
    {
      id: 4,
      name: "OnePlus 12",
      owner: "David Brown",
      model: "CPH2467",
      status: "online",
      battery: 65,
      storage: 45,
      lastSeen: "15 mins ago",
      os: "Android 14",
    },
    {
      id: 5,
      name: "Xiaomi 14",
      owner: "Eve Martinez",
      model: "2404CPE",
      status: "offline",
      battery: 5,
      storage: 88,
      lastSeen: "1 day ago",
      os: "Android 14",
    },
  ];

  const filteredDevices =
    filterStatus === "all"
      ? devices
      : devices.filter((d) => d.status === filterStatus);

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />

      {/* Main content */}
      <main className="flex-1 lg:ml-64 overflow-auto">
        <div className="p-6 lg:p-12">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-end justify-between mb-4">
              <div>
                <h1 className="text-4xl lg:text-5xl font-display tracking-tight mb-2">
                  Device Management
                </h1>
                <p className="text-muted-foreground">Monitor and manage all connected devices</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-4 border border-border bg-card">
              <p className="text-xs text-muted-foreground mb-1">Total Devices</p>
              <p className="text-2xl font-display">856</p>
            </Card>
            <Card className="p-4 border border-border bg-card">
              <p className="text-xs text-muted-foreground mb-1">Online</p>
              <p className="text-2xl font-display text-green-600">734</p>
            </Card>
            <Card className="p-4 border border-border bg-card">
              <p className="text-xs text-muted-foreground mb-1">Offline</p>
              <p className="text-2xl font-display text-gray-600">98</p>
            </Card>
            <Card className="p-4 border border-border bg-card">
              <p className="text-xs text-muted-foreground mb-1">Issues</p>
              <p className="text-2xl font-display text-orange-600">24</p>
            </Card>
          </div>

          {/* Search and filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search devices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
              />
            </div>
            <Button variant="outline" className="border-border hover:bg-accent/10 gap-2 whitespace-nowrap">
              <Filter className="w-4 h-4" />
              More Filters
            </Button>
          </div>

          {/* Status filter */}
          <div className="flex gap-2 mb-8 flex-wrap">
            {[
              { id: "all", label: "All Devices" },
              { id: "online", label: "Online" },
              { id: "offline", label: "Offline" },
            ].map((status) => (
              <button
                key={status.id}
                onClick={() => setFilterStatus(status.id)}
                className={`px-4 py-2 rounded-full text-sm transition-colors ${
                  filterStatus === status.id
                    ? "bg-foreground text-background"
                    : "bg-secondary text-foreground hover:bg-secondary/80"
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>

          {/* Devices list */}
          <div className="space-y-3">
            {filteredDevices.map((device) => (
              <Card
                key={device.id}
                className="p-4 border border-border bg-card hover:bg-accent/5 transition-colors group"
              >
                <div className="flex items-start gap-4">
                  {/* Device info */}
                  <div className="w-12 h-12 bg-sidebar rounded-lg flex items-center justify-center flex-shrink-0">
                    <Smartphone className="w-6 h-6" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-semibold">{device.name}</h3>
                        <p className="text-sm text-muted-foreground">{device.owner}</p>
                      </div>
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

                    {/* Device details grid */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Model</p>
                        <p className="text-sm font-mono">{device.model}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">OS</p>
                        <p className="text-sm">{device.os}</p>
                      </div>
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
                          <span className="text-xs font-mono w-6">{device.battery}%</span>
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
                          <span className="text-xs font-mono w-6">{device.storage}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Last Seen</p>
                        <p className="text-xs font-mono">{device.lastSeen}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      className="p-2 hover:bg-accent/10 rounded transition-colors"
                      title="Remote control"
                    >
                      <Power className="w-4 h-4" />
                    </button>
                    <button
                      className="p-2 hover:bg-accent/10 rounded transition-colors"
                      title="Settings"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    <button
                      className="p-2 hover:bg-red-500/10 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                    <button className="p-2 hover:bg-accent/10 rounded transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-8 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredDevices.length} of {devices.length} devices
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="border-border hover:bg-accent/10">
                Previous
              </Button>
              <Button variant="outline" className="border-border hover:bg-accent/10">
                Next
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
