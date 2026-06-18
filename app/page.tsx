"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Smartphone, Zap, Lock, Users, Shield, ArrowRight, Check } from "lucide-react";
import { useEffect, useState } from "react";

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

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
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Header */}
      <header className={`border-b border-border sticky top-0 z-50 bg-background/95 backdrop-blur transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
      }`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-foreground rounded-lg flex items-center justify-center hover-lift">
              <Smartphone className="w-5 h-5 text-background" />
            </div>
            <span className="font-display text-xl font-semibold">DeviceGuard</span>
          </div>
          <Link href="/dashboard">
            <Button className="bg-foreground hover:bg-foreground/90 text-background px-6 rounded-full gap-2 group transition-all hover:shadow-lg">
              Launch App
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Animated background */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-foreground/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-foreground/5 rounded-full blur-3xl -z-10" />

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-20 lg:py-40 relative">
        <div className="text-center mb-16">
          <div className={`transition-all duration-700 delay-100 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}>
            <span className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-6 px-4 py-2 bg-accent/50 rounded-full border border-border/50">
              <Check className="w-4 h-4" />
              Enterprise-grade Mobile Device Management
            </span>
          </div>

          <h1 className={`text-5xl lg:text-7xl font-display tracking-tight mb-6 leading-[1.1] transition-all duration-700 delay-200 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}>
            Remote Device{" "}
            <span className="relative inline-block">
              Management
              <span className="absolute -bottom-4 left-0 right-0 h-3 bg-foreground/10 rounded-full" />
            </span>
          </h1>
          
          <p className={`text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed transition-all duration-700 delay-300 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}>
            Monitor, control, and manage Android devices remotely with enterprise-grade security. Built for teams that demand reliability and security.
          </p>

          <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-700 delay-400 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}>
            <Link href="/dashboard">
              <Button size="lg" className="bg-foreground hover:bg-foreground/90 text-background px-8 h-14 text-base rounded-full gap-2 group transition-all hover:shadow-xl">
                Get Started Now
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-border hover:bg-accent/10 px-8 h-14 text-base rounded-full">
              View Demo
            </Button>
          </div>
        </div>

        {/* Demo area with animation */}
        <div className={`transition-all duration-700 delay-500 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}>
          <div className="bg-gradient-to-b from-card to-sidebar rounded-2xl border border-border p-8 lg:p-12 aspect-video flex items-center justify-center text-muted-foreground relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-foreground/0 via-foreground/5 to-foreground/0 animate-pulse" />
            <div className="relative z-10 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-accent rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Smartphone className="w-10 h-10 text-foreground" />
              </div>
              <p className="text-lg font-semibold mb-2">Live Device Management</p>
              <p className="text-sm">Real-time monitoring and control capabilities</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-20 lg:py-32 border-t border-border">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-display tracking-tight mb-6">
            Powerful Features
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to manage devices securely and efficiently
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className={`p-8 bg-card border border-border rounded-xl hover:bg-accent/10 hover:border-foreground/20 transition-all duration-300 group hover-lift opacity-0 animate-[fadeInUp_0.6s_ease-out_forwards]`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Icon className="w-6 h-6 text-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* User Capabilities */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-20 lg:py-32 border-t border-border">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-display tracking-tight mb-6">
            What You Can Do
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Comprehensive capabilities for users and administrators
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-gradient-to-br from-card to-accent/5 border border-border rounded-xl p-8 hover:border-foreground/20 transition-all hover-lift group">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-3 rounded-full bg-foreground" />
              <h3 className="text-2xl font-display">User Features</h3>
            </div>
            <ul className="space-y-3">
              {[
                "Manage paired devices with QR code pairing",
                "Monitor live device status, battery, storage",
                "Browse and manage files on devices",
                "View live screen and capture screenshots",
                "Access front and rear cameras",
                "Receive and manage notifications",
                "View complete activity history",
              ].map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3 group/item">
                  <Check className="w-5 h-5 text-foreground flex-shrink-0 mt-0.5 group-hover/item:scale-110 transition-transform" />
                  <span className="text-muted-foreground group-hover/item:text-foreground transition-colors">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-gradient-to-br from-card to-accent/5 border border-border rounded-xl p-8 hover:border-foreground/20 transition-all hover-lift group">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-3 rounded-full bg-foreground" />
              <h3 className="text-2xl font-display">Admin Features</h3>
            </div>
            <ul className="space-y-3">
              {[
                "Manage all users with ban/unblock controls",
                "Monitor global device health and status",
                "Force disconnect any device remotely",
                "Full audit logs and security tracking",
                "IP blocklist and security controls",
                "API key management and rate limiting",
                "System-wide feature enable/disable",
              ].map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3 group/item">
                  <Shield className="w-5 h-5 text-foreground flex-shrink-0 mt-0.5 group-hover/item:scale-110 transition-transform" />
                  <span className="text-muted-foreground group-hover/item:text-foreground transition-colors">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-20 lg:py-32 border-t border-border">
        <div className="bg-gradient-to-r from-card to-accent/20 border border-border rounded-2xl p-12 lg:p-16 text-center hover:border-foreground/20 transition-all">
          <h2 className="text-4xl lg:text-5xl font-display tracking-tight mb-6">
            Ready to get started?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            Join enterprise teams that trust DeviceGuard for secure device management
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard">
              <Button
                size="lg"
                className="bg-foreground hover:bg-foreground/90 text-background px-8 h-14 text-base rounded-full gap-2 group transition-all hover:shadow-xl"
              >
                Launch Dashboard
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="border-border hover:bg-accent/10 px-8 h-14 text-base rounded-full"
            >
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Smartphone className="w-5 h-5" />
                <span className="font-display font-semibold">DeviceGuard</span>
              </div>
              <p className="text-sm text-muted-foreground">Enterprise Mobile Device Management Platform</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Support</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">© 2025 DeviceGuard. All rights reserved.</p>
            <p className="text-sm text-muted-foreground">Enterprise-grade security & management</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
