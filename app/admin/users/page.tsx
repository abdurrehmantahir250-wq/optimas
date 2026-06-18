"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, Filter, MoreVertical, Shield, Trash2, Edit2, Lock, Unlock } from "lucide-react";
import { useState } from "react";

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const users = [
    {
      id: 1,
      name: "Alice Johnson",
      email: "alice@example.com",
      role: "user",
      status: "active",
      devicesCount: 3,
      lastLogin: "2 mins ago",
    },
    {
      id: 2,
      name: "Bob Smith",
      email: "bob@example.com",
      role: "user",
      status: "active",
      devicesCount: 2,
      lastLogin: "1 hour ago",
    },
    {
      id: 3,
      name: "Carol Williams",
      email: "carol@example.com",
      role: "admin",
      status: "active",
      devicesCount: 5,
      lastLogin: "5 mins ago",
    },
    {
      id: 4,
      name: "David Brown",
      email: "david@example.com",
      role: "user",
      status: "inactive",
      devicesCount: 1,
      lastLogin: "3 days ago",
    },
    {
      id: 5,
      name: "Eve Martinez",
      email: "eve@example.com",
      role: "user",
      status: "suspended",
      devicesCount: 0,
      lastLogin: "2 weeks ago",
    },
    {
      id: 6,
      name: "Frank Wilson",
      email: "frank@example.com",
      role: "user",
      status: "active",
      devicesCount: 4,
      lastLogin: "30 mins ago",
    },
  ];

  const filteredUsers =
    filterStatus === "all"
      ? users
      : users.filter((u) => u.status === filterStatus);

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
                <h1 className="text-4xl lg:text-5xl font-display tracking-tight mb-2">User Management</h1>
                <p className="text-muted-foreground">Manage all system users and permissions</p>
              </div>
              <Button className="bg-foreground hover:bg-foreground/90 text-background px-6 rounded-lg">
                Add User
              </Button>
            </div>
          </div>

          {/* Search and filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search users..."
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
              { id: "all", label: "All Users" },
              { id: "active", label: "Active" },
              { id: "inactive", label: "Inactive" },
              { id: "suspended", label: "Suspended" },
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

          {/* Users table */}
          <div className="space-y-3">
            {filteredUsers.map((user) => (
              <Card
                key={user.id}
                className="p-4 border border-border bg-card hover:bg-accent/5 transition-colors group"
              >
                <div className="flex items-center justify-between gap-4">
                  {/* User info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-sidebar rounded-full flex items-center justify-center flex-shrink-0">
                        {user.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{user.name}</h3>
                          {user.role === "admin" && (
                            <Shield className="w-4 h-4 text-orange-600" title="Admin" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="hidden md:flex items-center gap-8 text-sm">
                    <div className="text-right">
                      <p className="text-muted-foreground text-xs">Devices</p>
                      <p className="font-mono font-semibold">{user.devicesCount}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground text-xs">Last Login</p>
                      <p className="font-mono text-xs">{user.lastLogin}</p>
                    </div>
                  </div>

                  {/* Status */}
                  <div className={`px-3 py-1 rounded-full text-xs font-mono whitespace-nowrap ${
                    user.status === "active"
                      ? "bg-green-500/20 text-green-700"
                      : user.status === "inactive"
                      ? "bg-gray-500/20 text-gray-700"
                      : "bg-red-500/20 text-red-700"
                  }`}>
                    {user.status}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    {user.status === "suspended" ? (
                      <button className="p-2 hover:bg-green-500/10 rounded transition-colors" title="Unsuspend">
                        <Unlock className="w-4 h-4 text-green-600" />
                      </button>
                    ) : (
                      <button className="p-2 hover:bg-orange-500/10 rounded transition-colors" title="Suspend">
                        <Lock className="w-4 h-4 text-orange-600" />
                      </button>
                    )}
                    <button className="p-2 hover:bg-accent/10 rounded transition-colors" title="Edit">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-red-500/10 rounded transition-colors" title="Delete">
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
              Showing {filteredUsers.length} of {users.length} users
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
