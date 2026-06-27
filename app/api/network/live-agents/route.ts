import { NextResponse } from "next/server";

export const runtime = "nodejs";

type DeviceOption = {
  value: string;
  label?: string;
  role?: string;
};

type DeviceRecord = {
  deviceId: string;
  localIp?: string;
  publicIp?: string;
  platform?: string;
  status?: string;
  lastSeen?: Date;
  battery?: number | null;
  storage?: number | null;
};

export async function GET() {
  try {
    const { getConnectionRegistry } = require("../../../../server/sockets/registry");
    const { getLiveDeviceOptions } = require("../../../../server/sockets/handler");
    const Device = require("../../../../server/models/Device");
    getConnectionRegistry();

    const liveDevices = getLiveDeviceOptions() as DeviceOption[];
    const deviceIds = liveDevices.map((device) => device.value);
    const deviceRecords = (await Device.find({ deviceId: { $in: deviceIds } }).lean()) as DeviceRecord[];

    const devices = liveDevices.map((device) => {
      const record = deviceRecords.find((doc) => doc.deviceId === device.value) || ({} as DeviceRecord);
      return {
        ...device,
        localIp: record.localIp || null,
        publicIp: record.publicIp || null,
        platform: record.platform || null,
        status: record.status || (device.role === "AGENT" ? "online" : "offline"),
        battery: typeof record.battery === 'number' ? record.battery : null,
        storage: typeof record.storage === 'number' ? record.storage : null,
        lastSeen: record.lastSeen ? record.lastSeen.toISOString() : null,
      };
    });

    return NextResponse.json({ success: true, devices });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list live agents.";
    return NextResponse.json({ success: false, devices: [], message }, { status: 500 });
  }
}
