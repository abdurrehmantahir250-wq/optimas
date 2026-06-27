const express = require('express');
const router = express.Router();
const Device = require('../models/Device');
const { getLiveDeviceOptions } = require('../sockets/handler');

router.get('/devices', async (req, res) => {
    try {
        const allDevices = await Device.find().sort({ lastSeen: -1 }).lean();
        const liveDevices = getLiveDeviceOptions();
        const liveDeviceIds = new Set(liveDevices.map((device) => device.value));

        const devices = allDevices.map((device) => {
            const isLive = liveDeviceIds.has(device.deviceId);
            return {
                ...device,
                status: isLive ? 'online' : 'offline',
                label: device.hostname || device.deviceId,
                value: device.deviceId
            };
        });

        res.status(200).json({ success: true, devices });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/devices/:deviceId', async (req, res) => {
    try {
        const device = await Device.findOne({ deviceId: req.params.deviceId }).lean();
        if (!device) {
            return res.status(404).json({ success: false, message: 'Device not found' });
        }

        const liveDevices = getLiveDeviceOptions();
        const isLive = liveDevices.some((d) => d.value === device.deviceId);

        res.status(200).json({
            success: true,
            device: {
                ...device,
                status: isLive ? 'online' : 'offline'
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});


router.get('/live-agents', async (req, res) => {
    try {
        const liveDevices = getLiveDeviceOptions();
        const deviceIds = liveDevices.map((device) => device.value);
        const deviceRecords = await Device.find({ deviceId: { $in: deviceIds } }).lean();

       const devices = liveDevices.map((device) => {
    const record = deviceRecords.find((doc) => doc.deviceId === device.value) || {};

    return {
        ...device,

        platform: record.platform || "unknown",
        status: record.status || (device.role === "AGENT" ? "online" : "offline"),

        localIp: record.localIp || "",
        publicIp: record.publicIp || "",

        battery: record.battery,
        storage: record.storage,
        network: record.network || "",

        latitude: record.latitude,
        longitude: record.longitude,

        country: record.country || "",
        region: record.region || "",
        city: record.city || "",
        isp: record.isp || "",

        timezone: record.timezone || "",
        hostname: record.hostname || "",
        username: record.username || "",

        osVersion: record.osVersion || "",
        architecture: record.architecture || "",
        cpu: record.cpu || "",
        ram: record.ram,

        lastSeen: record.lastSeen
            ? record.lastSeen.toISOString()
            : null,
    };
});

        res.status(200).json({ success: true, devices });
    } catch (error) {
        res.status(500).json({ success: false, devices: [], message: error.message });
    }
});

router.post('/heartbeat', async (req, res) => {
    try {
        const { deviceId, localIp, clientPort, platform } = req.body;
        const publicIp = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;

        if (!deviceId || !localIp) return res.status(400).json({ success: false });

        const updatedDevice = await Device.findOneAndUpdate(
            { deviceId },
            {
                platform, localIp, publicIp, clientPort,
                status: 'online', lastSeen: new Date()
            },
            { new: true, upsert: true }
        );

        res.status(200).json({ success: true, data: updatedDevice });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
