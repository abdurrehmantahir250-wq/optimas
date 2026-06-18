"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Smartphone, Zap, Lock, Users, Shield, ArrowRight } from "lucide-react";

export default function Home() {
  const features = [
    {
      icon: Smartphone,
      title: "Remote Device Control",
      description: "Monitor and control Android devices from anywhere with real-time screen streaming",
    },
    {
      icon: Zap,
      title: "Instant Access",
      description: "Access cameras, files, notifications, and device settings instantly",
    },
    {
      icon: Lock,
      title: "Enterprise Security",
      description: "End-to-end encryption and secure authentication protocols",
    },
    {
      icon: Users,
      title: "User Management",
      description: "Complete user and device management with role-based access control",
    },
    {
      icon: Shield,
      title: "Admin Controls",
      description: "Full audit logs, security monitoring, and system administration",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-foreground rounded-lg flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-background" />
            </div>
            <span className="font-display text-xl font-semibold">DeviceGuard</span>
          </div>
          <Link href="/dashboard">
            <Button className="bg-foreground hover:bg-foreground/90 text-background px-6 rounded-full gap-2">
              Launch App
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-20 lg:py-32">
        <div className="text-center mb-12">
          <h1 className="text-5xl lg:text-7xl font-display tracking-tight mb-6 leading-[1.1]">
            Remote Device{" "}
            <span className="relative inline-block">
              Management
              <span className="absolute -bottom-4 left-0 right-0 h-3 bg-foreground/10" />
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Monitor, control, and manage Android devices remotely with enterprise-grade security
          </p>
          <Link href="/dashboard">
            <Button size="lg" className="bg-foreground hover:bg-foreground/90 text-background px-8 h-14 text-base rounded-full gap-2">
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Demo area */}
        <div className="bg-sidebar rounded-2xl border border-border p-8 lg:p-12 aspect-video flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <Smartphone className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>Interactive Demo</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-20 lg:py-32 border-t border-border">
        <h2 className="text-4xl lg:text-5xl font-display tracking-tight text-center mb-16">
          Powerful Features
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="p-8 bg-card border border-border rounded-xl hover:bg-accent/5 transition-colors"
              >
                <Icon className="w-8 h-8 mb-4 text-foreground" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* User Capabilities */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-20 lg:py-32 border-t border-border">
        <h2 className="text-4xl lg:text-5xl font-display tracking-tight text-center mb-16">
          What You Can Do
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-card border border-border rounded-xl p-8">
            <h3 className="text-2xl font-display mb-6">User Features</h3>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground flex-shrink-0 mt-2" />
                <span>Manage paired devices with QR code pairing</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground flex-shrink-0 mt-2" />
                <span>Monitor live device status, battery, storage</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground flex-shrink-0 mt-2" />
                <span>Browse and manage files on devices</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground flex-shrink-0 mt-2" />
                <span>View live screen and capture screenshots</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground flex-shrink-0 mt-2" />
                <span>Access front and rear cameras</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground flex-shrink-0 mt-2" />
                <span>Receive and manage notifications</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground flex-shrink-0 mt-2" />
                <span>View complete activity history</span>
              </li>
            </ul>
          </div>

          <div className="bg-card border border-border rounded-xl p-8">
            <h3 className="text-2xl font-display mb-6">Admin Features</h3>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground flex-shrink-0 mt-2" />
                <span>Manage all users with ban/unblock controls</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground flex-shrink-0 mt-2" />
                <span>Monitor global device health and status</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground flex-shrink-0 mt-2" />
                <span>Force disconnect any device remotely</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground flex-shrink-0 mt-2" />
                <span>Full audit logs and security tracking</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground flex-shrink-0 mt-2" />
                <span>IP blocklist and security controls</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground flex-shrink-0 mt-2" />
                <span>API key management and rate limiting</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground flex-shrink-0 mt-2" />
                <span>System-wide feature enable/disable</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-20 lg:py-32 border-t border-border text-center">
        <h2 className="text-4xl lg:text-5xl font-display tracking-tight mb-6">
          Ready to get started?
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Experience the power of remote device management
        </p>
        <Link href="/dashboard">
          <Button
            size="lg"
            className="bg-foreground hover:bg-foreground/90 text-background px-8 h-14 text-base rounded-full gap-2"
          >
            Launch Dashboard
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12 text-center text-muted-foreground">
          <p>DeviceGuard - Enterprise Remote Device Management</p>
        </div>
      </footer>
    </div>
  );
}
