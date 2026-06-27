"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type AgentDevice = {
  deviceId: string;
  label: string;
  lastConnectedAt?: string | null;
};

export default function AgentSettingsPage() {
  const [devices, setDevices] = useState<AgentDevice[]>([]);
  const [deviceId, setDeviceId] = useState("WIN-NODE-DESKTOP-V8QQQRT");
  const [label, setLabel] = useState("My PC Agent");
  const [agentToken, setAgentToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadDevices = async () => {
    const res = await fetch("/api/auth/agents", { credentials: "include" });
    const data = await res.json();
    if (data.success && Array.isArray(data.devices)) {
      setDevices(data.devices);
    }
  };

  useEffect(() => {
    void loadDevices();
  }, []);

  const pairAgent = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setAgentToken(null);
    try {
      const res = await fetch("/api/auth/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ deviceId: deviceId.trim(), label: label.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Pairing failed");
      setAgentToken(data.agentToken);
      toast.success("Agent paired. Copy the token now — it is shown once.");
      await loadDevices();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Pairing failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-display">Agent pairing</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Register each Rust agent device to your account. Only paired devices can connect and access cloud data.
          </p>
        </div>

        <Card className="p-5 max-w-2xl space-y-4">
          <form onSubmit={pairAgent} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deviceId">Agent device ID</Label>
              <Input
                id="deviceId"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                placeholder="WIN-NODE-YOUR-PC-NAME"
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="label">Label</Label>
              <Input id="label" value={label} onChange={(e) => setLabel(e.target.value)} />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Pairing…" : "Generate agent token"}
            </Button>
          </form>

          {agentToken && (
            <div className="rounded-md border border-primary/30 bg-primary/5 p-4 space-y-2">
              <p className="text-sm font-medium">Agent token (copy now)</p>
              <code className="block text-xs break-all font-mono">{agentToken}</code>
              <p className="text-xs text-muted-foreground">
                Set on the agent machine before `cargo run`:
              </p>
              <code className="block text-xs font-mono bg-muted p-2 rounded">
                $env:ZENVORA_AGENT_TOKEN="{agentToken}"
              </code>
            </div>
          )}
        </Card>

        <Card className="p-5 max-w-2xl">
          <h2 className="font-medium mb-3">Your paired devices</h2>
          {devices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No agents paired yet.</p>
          ) : (
            <ul className="space-y-2">
              {devices.map((device) => (
                <li key={device.deviceId} className="text-sm font-mono border rounded-md px-3 py-2">
                  {device.label} — {device.deviceId}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Link href="/files" className="text-sm underline text-muted-foreground">
          Back to file manager
        </Link>
      </main>
    </div>
  );
}
