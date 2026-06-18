"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Users, Smartphone, Activity, AlertCircle, TrendingUp, Clock } from "lucide-react";

export default function AdminPage() {
  const stats = [
    {
      title: "Total Users",
      value: "1,234",
      change: "+12%",
      icon: Users,
      color: "bg-blue-500",
    },
    {
      title: "Active Devices",
      value: "856",
      change: "+8%",
      icon: Smartphone,
      color: "bg-green-500",
    },
    {
      title: "System Health",
      value: "99.8%",
      change: "↑ 0.5%",
      icon: Activity,
      color: "bg-purple-500",
    },
    {
      title: "Alerts",
      value: "23",
      change: "↑ 3 new",
      icon: AlertCircle,
      color: "bg-orange-500",
    },
  ];

  const recentActivity = [
    {
      user: "Alice Johnson",
      action: "Paired new device",
      time: "5 mins ago",
      status: "success",
    },
    {
      user: "Bob Smith",
      action: "Accessed screen monitoring",
      time: "12 mins ago",
      status: "success",
    },
    {
      user: "System",
      action: "Backup completed",
      time: "1 hour ago",
      status: "success",
    },
    {
      user: "Carol Williams",
      action: "Failed login attempt",
      time: "2 hours ago",
      status: "warning",
    },
    {
      user: "David Brown",
      action: "Disabled account",
      time: "3 hours ago",
      status: "warning",
    },
  ];

  const userStats = [
    { label: "Active Users", value: 892, percentage: 72 },
    { label: "Inactive Users", value: 245, percentage: 20 },
    { label: "Suspended Users", value: 97, percentage: 8 },
  ];

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />

      {/* Main content */}
      <main className="flex-1 lg:ml-64 overflow-auto">
        <div className="p-6 lg:p-12">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl lg:text-5xl font-display tracking-tight mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">System overview and management</p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="p-6 border border-border bg-card hover-lift">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 ${stat.color}/20 rounded-lg flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${stat.color.replace("bg-", "text-")}`} />
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-700 text-xs rounded">
                      <TrendingUp className="w-3 h-3" />
                      {stat.change}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                  <p className="text-3xl font-display">{stat.value}</p>
                </Card>
              );
            })}
          </div>

          {/* Main content grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Recent Activity */}
            <div className="lg:col-span-2">
              <Card className="p-6 border border-border bg-card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-display">Recent Activity</h2>
                  <Button variant="outline" className="border-border hover:bg-accent/10 text-xs">
                    View all
                  </Button>
                </div>

                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start justify-between pb-4 border-b border-border last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium text-sm">{activity.user}</p>
                        <p className="text-xs text-muted-foreground">{activity.action}</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-xs font-mono mb-1 ${
                          activity.status === "success" 
                            ? "text-green-600 bg-green-500/20 px-2 py-1 rounded" 
                            : "text-orange-600 bg-orange-500/20 px-2 py-1 rounded"
                        }`}>
                          {activity.status === "success" ? "✓" : "⚠"}
                        </div>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* User Status */}
            <div>
              <Card className="p-6 border border-border bg-card">
                <h2 className="text-xl font-display mb-6">User Status</h2>

                <div className="space-y-4">
                  {userStats.map((stat, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">{stat.label}</span>
                        <span className="font-mono text-sm font-semibold">{stat.value}</span>
                      </div>
                      <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            index === 0 ? "bg-blue-600" : index === 1 ? "bg-gray-600" : "bg-red-600"
                          }`}
                          style={{ width: `${stat.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>

          {/* Quick Actions */}
          <Card className="p-6 border border-border bg-card">
            <h2 className="text-xl font-display mb-6">System Controls</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button className="bg-foreground hover:bg-foreground/90 text-background justify-center">
                Generate Report
              </Button>
              <Button variant="outline" className="border-border hover:bg-accent/10">
                System Settings
              </Button>
              <Button variant="outline" className="border-border hover:bg-accent/10 border-orange-500/50 text-orange-600 hover:bg-orange-500/10">
                Emergency Stop
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
