"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageCircle, Mail, Smartphone, Settings, Trash2, Archive, MoreVertical, Filter, Search } from "lucide-react";
import { useState } from "react";

export default function NotificationsPage() {
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const notifications = [
    {
      id: 1,
      app: "WhatsApp",
      title: "Sarah sent a message",
      message: "Hey, are you free tomorrow?",
      time: "2 mins ago",
      icon: MessageCircle,
      read: false,
      category: "messaging",
    },
    {
      id: 2,
      app: "Gmail",
      title: "New email from work",
      message: "Project Update: Q4 Planning",
      time: "15 mins ago",
      icon: Mail,
      read: false,
      category: "email",
    },
    {
      id: 3,
      app: "System",
      title: "Battery Low",
      message: "Your device battery is at 15%",
      time: "1 hour ago",
      icon: Smartphone,
      read: true,
      category: "system",
    },
    {
      id: 4,
      app: "Instagram",
      title: "John liked your photo",
      message: "instagram.com/username/photo/12345",
      time: "2 hours ago",
      icon: MessageCircle,
      read: true,
      category: "social",
    },
    {
      id: 5,
      app: "Telegram",
      title: "New message from Team",
      message: "Remember the meeting at 3 PM",
      time: "3 hours ago",
      icon: MessageCircle,
      read: true,
      category: "messaging",
    },
    {
      id: 6,
      app: "System",
      title: "App Update Available",
      message: "Chrome has an update available",
      time: "1 day ago",
      icon: Smartphone,
      read: true,
      category: "system",
    },
  ];

  const categories = [
    { id: "all", label: "All Notifications", count: 6 },
    { id: "messaging", label: "Messages", count: 3 },
    { id: "email", label: "Email", count: 1 },
    { id: "social", label: "Social Media", count: 1 },
    { id: "system", label: "System", count: 2 },
  ];

  const filteredNotifications =
    filter === "all"
      ? notifications
      : notifications.filter((n) => n.category === filter);

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
                <h1 className="text-4xl lg:text-5xl font-display tracking-tight mb-2">Notifications</h1>
                <p className="text-muted-foreground">Real-time alerts from your devices</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="border-border hover:bg-accent/10">
                  Mark all read
                </Button>
                <Button variant="outline" className="border-border hover:bg-accent/10">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Search and filter */}
          <div className="mb-8 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search notifications..."
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

          {/* Category filter */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilter(cat.id)}
                className={`px-4 py-2 rounded-full whitespace-nowrap text-sm transition-colors ${
                  filter === cat.id
                    ? "bg-foreground text-background"
                    : "bg-secondary text-foreground hover:bg-secondary/80"
                }`}
              >
                {cat.label}
                <span className="ml-2 text-xs opacity-70">({cat.count})</span>
              </button>
            ))}
          </div>

          {/* Notifications list */}
          <div className="space-y-3">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification) => {
                const IconComponent = notification.icon;
                return (
                  <Card
                    key={notification.id}
                    className={`p-4 border transition-all cursor-pointer group ${
                      notification.read
                        ? "border-border bg-card hover:bg-accent/5"
                        : "border-foreground/30 bg-accent/10 hover:bg-accent/15"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        notification.read ? "bg-sidebar" : "bg-foreground/20"
                      }`}>
                        <IconComponent className="w-5 h-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className={`font-semibold ${!notification.read ? "text-foreground" : ""}`}>
                            {notification.title}
                          </h3>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {notification.time}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          <span className="font-mono text-xs bg-sidebar/50 px-2 py-1 rounded mr-2">
                            {notification.app}
                          </span>
                        </p>
                        <p className="text-sm text-muted-foreground truncate">{notification.message}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button className="p-2 hover:bg-accent/10 rounded transition-colors" title="Archive">
                          <Archive className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-red-500/10 rounded transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                        <button className="p-2 hover:bg-accent/10 rounded transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Unread indicator */}
                      {!notification.read && (
                        <div className="w-2 h-2 rounded-full bg-foreground flex-shrink-0 mt-2" />
                      )}
                    </div>
                  </Card>
                );
              })
            ) : (
              <div className="text-center py-12">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-muted-foreground mb-4">No notifications found</p>
                <Button variant="outline" className="border-border">
                  Clear filters
                </Button>
              </div>
            )}
          </div>

          {/* Notification settings */}
          <Card className="mt-12 p-6 border border-border bg-card">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-1">Notification Settings</h3>
                <p className="text-sm text-muted-foreground">Customize notification preferences</p>
              </div>
              <Button variant="outline" className="border-border hover:bg-accent/10 gap-2">
                <Settings className="w-4 h-4" />
                Configure
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
