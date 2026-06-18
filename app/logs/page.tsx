"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Filter, Search, Eye, Download as DownloadIcon, Lock, Smartphone, FileText, Camera, Settings, MoreVertical } from "lucide-react";
import { useState } from "react";

export default function LogsPage() {
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("7days");

  const activityLogs = [
    {
      id: 1,
      action: "Screen Monitored",
      device: "Samsung Galaxy S24",
      timestamp: "2 mins ago",
      status: "success",
      icon: Eye,
      details: "Live stream started for 15 minutes",
    },
    {
      id: 2,
      action: "File Downloaded",
      device: "iPhone 15 Pro",
      timestamp: "1 hour ago",
      status: "success",
      icon: DownloadIcon,
      details: "Downloaded: vacation.pdf (14.2 MB)",
    },
    {
      id: 3,
      action: "Screen Locked",
      device: "Pixel 8",
      timestamp: "3 hours ago",
      status: "success",
      icon: Lock,
      details: "Remote lock command executed",
    },
    {
      id: 4,
      action: "Camera Accessed",
      device: "Samsung Galaxy S24",
      timestamp: "5 hours ago",
      status: "success",
      icon: Camera,
      details: "Rear camera stream activated",
    },
    {
      id: 5,
      action: "File Uploaded",
      device: "iPhone 15 Pro",
      timestamp: "1 day ago",
      status: "success",
      icon: FileText,
      details: "Uploaded: config.json (2.3 KB)",
    },
    {
      id: 6,
      action: "Settings Changed",
      device: "Pixel 8",
      timestamp: "2 days ago",
      status: "warning",
      icon: Settings,
      details: "Brightness adjusted to 75%",
    },
    {
      id: 7,
      action: "Device Paired",
      device: "Samsung Galaxy S24",
      timestamp: "3 days ago",
      status: "success",
      icon: Smartphone,
      details: "New device added via QR code",
    },
    {
      id: 8,
      action: "File Deleted",
      device: "iPhone 15 Pro",
      timestamp: "1 week ago",
      status: "warning",
      icon: FileText,
      details: "Deleted: old_backup.zip",
    },
  ];

  const filteredLogs =
    filter === "all"
      ? activityLogs
      : activityLogs.filter((log) => log.status === filter);

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />

      {/* Main content */}
      <main className="flex-1 lg:ml-64 overflow-auto">
        <div className="p-6 lg:p-12">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-4xl lg:text-5xl font-display tracking-tight mb-2">Activity Logs</h1>
                <p className="text-muted-foreground">Complete history of all device interactions</p>
              </div>
              <Button className="bg-foreground hover:bg-foreground/90 text-background px-6 rounded-lg gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-8 space-y-4">
            {/* Search and date range */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
                />
              </div>

              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20 whitespace-nowrap"
              >
                <option value="24hours">Last 24 Hours</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>

            {/* Status filter */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-full text-sm transition-colors ${
                  filter === "all"
                    ? "bg-foreground text-background"
                    : "bg-secondary text-foreground hover:bg-secondary/80"
                }`}
              >
                All Activities
              </button>
              <button
                onClick={() => setFilter("success")}
                className={`px-4 py-2 rounded-full text-sm transition-colors ${
                  filter === "success"
                    ? "bg-green-600 text-white"
                    : "bg-green-500/20 text-green-700 hover:bg-green-500/30"
                }`}
              >
                Successful
              </button>
              <button
                onClick={() => setFilter("warning")}
                className={`px-4 py-2 rounded-full text-sm transition-colors ${
                  filter === "warning"
                    ? "bg-orange-600 text-white"
                    : "bg-orange-500/20 text-orange-700 hover:bg-orange-500/30"
                }`}
              >
                Warnings
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-4 border border-border bg-card">
              <p className="text-xs text-muted-foreground mb-1">Total Actions</p>
              <p className="text-2xl font-display">248</p>
            </Card>
            <Card className="p-4 border border-border bg-card">
              <p className="text-xs text-muted-foreground mb-1">Today</p>
              <p className="text-2xl font-display">12</p>
            </Card>
            <Card className="p-4 border border-border bg-card">
              <p className="text-xs text-muted-foreground mb-1">This Week</p>
              <p className="text-2xl font-display">76</p>
            </Card>
            <Card className="p-4 border border-border bg-card">
              <p className="text-xs text-muted-foreground mb-1">Success Rate</p>
              <p className="text-2xl font-display">99.2%</p>
            </Card>
          </div>

          {/* Logs timeline */}
          <div className="space-y-3">
            {filteredLogs.map((log) => {
              const IconComponent = log.icon;
              return (
                <Card
                  key={log.id}
                  className="p-4 border border-border bg-card hover:bg-accent/5 transition-colors group"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        log.status === "success"
                          ? "bg-green-500/20 text-green-600"
                          : "bg-orange-500/20 text-orange-600"
                      }`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold">{log.action}</h3>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {log.timestamp}
                        </span>
                      </div>

                      <p className="text-sm text-muted-foreground mb-2">{log.device}</p>

                      <p className="text-sm text-muted-foreground">{log.details}</p>
                    </div>

                    {/* Status badge and actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-mono ${
                          log.status === "success"
                            ? "bg-green-500/20 text-green-700"
                            : "bg-orange-500/20 text-orange-700"
                        }`}
                      >
                        {log.status === "success" ? "✓ Success" : "⚠ Warning"}
                      </div>
                      <button className="p-2 hover:bg-accent/10 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="mt-8 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredLogs.length} of {activityLogs.length} entries
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
