"use client";

import { Smartphone, Shield, LogOut, Menu, X, Home, FileText, Eye, Camera, Bell, History } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export function AppSidebar() {
  const [isOpen, setIsOpen] = useState(false);

  const userMenuItems = [
    { icon: Home, label: "Dashboard", href: "/dashboard" },
    { icon: Smartphone, label: "Devices", href: "/devices" },
    { icon: Eye, label: "Screen Monitor", href: "/screen" },
    { icon: Camera, label: "Camera Access", href: "/camera" },
    { icon: FileText, label: "File Manager", href: "/files" },
    { icon: Bell, label: "Notifications", href: "/notifications" },
    { icon: History, label: "Activity Logs", href: "/logs" },
  ];

  const adminMenuItems = [
    { icon: Shield, label: "Admin Dashboard", href: "/admin" },
    { icon: Smartphone, label: "Device Management", href: "/admin/devices" },
    { icon: FileText, label: "Users", href: "/admin/users" },
    { icon: History, label: "System Logs", href: "/admin/logs" },
    { icon: Eye, label: "Security", href: "/admin/security" },
  ];

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 hover:bg-secondary rounded-lg transition-colors"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 ease-in-out z-40 overflow-y-auto custom-scrollbar ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-8">
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-sidebar-primary rounded-lg flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-sidebar-primary-foreground" />
              </div>
              <span className="font-display text-xl font-semibold">DeviceGuard</span>
            </div>
            <p className="text-xs text-sidebar-foreground/60 ml-13">Remote Device Control</p>
          </div>

          {/* User Mode */}
          <div className="mb-10">
            <p className="text-xs font-mono text-sidebar-foreground/50 uppercase tracking-wide mb-4">User Mode</p>
            <nav className="space-y-2">
              {userMenuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors group"
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Admin Mode */}
          <div className="border-t border-sidebar-border pt-8">
            <p className="text-xs font-mono text-sidebar-foreground/50 uppercase tracking-wide mb-4">Admin Mode</p>
            <nav className="space-y-2">
              {adminMenuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors group"
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-sidebar-border">
          <button className="flex items-center gap-3 text-sm text-sidebar-foreground hover:text-sidebar-foreground/70 transition-colors w-full">
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
