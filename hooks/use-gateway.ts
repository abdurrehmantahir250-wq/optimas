"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gatewayClient, type DeviceOption } from "@/lib/gateway-client";

export function useGateway() {
  const [isConnected, setIsConnected] = useState(false);
  const [devices, setDevices] = useState<DeviceOption[]>([]);
  const [socket, setSocket] = useState<WebSocket | null>(gatewayClient.getSocket());
  const devicesRef = useRef(devices);
  devicesRef.current = devices;

  useEffect(() => {
    setIsConnected(gatewayClient.isOpen());
    setDevices(gatewayClient.getDevices());
    setSocket(gatewayClient.getSocket());

    return gatewayClient.subscribe((event) => {
      if (event.type === "connected") {
        setIsConnected(true);
        setSocket(gatewayClient.getSocket());
      }
      if (event.type === "disconnected") {
        setIsConnected(false);
        setSocket(null);
      }
      if (event.type === "devices") setDevices(event.devices);
    });
  }, []);

  useEffect(() => {
    if (!isConnected) return;
    const poll = setInterval(() => {
      void gatewayClient.refreshDevices();
    }, 3000);
    return () => clearInterval(poll);
  }, [isConnected]);

  const resolveTarget = useCallback(
    (override?: string) => override || devicesRef.current[0]?.value || "",
    []
  );

  const dispatch = useCallback(
    (action: string, payload: Record<string, unknown> = {}, targetOverride?: string) => {
      const target = resolveTarget(targetOverride);
      if (!target) return { ok: false as const, reason: "no-agent" as const };
      if (!gatewayClient.dispatch(action, target, payload)) {
        return { ok: false as const, reason: "offline" as const };
      }
      return { ok: true as const, target };
    },
    [resolveTarget]
  );

  const getSocket = useCallback(() => gatewayClient.getSocket(), []);

  const sendCommand = useCallback(
    (deviceId: string, command: string) => {
      return dispatch(command, { command }, deviceId);
    },
    [dispatch]
  );

  const refreshDevices = useCallback(() => gatewayClient.refreshDevices(), []);

  return {
    isConnected,
    devices,
    dispatch,
    sendCommand,
    refreshDevices,
    resolveTarget,
    getSocket,
    socket,
    subscribe: gatewayClient.subscribe.bind(gatewayClient),
  };
}
