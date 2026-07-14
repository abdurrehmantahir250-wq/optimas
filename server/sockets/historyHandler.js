const { persistHistoryPayload } = require('../services/historySyncService');

const HISTORY_COMMANDS = new Set([
    'FETCH_BROWSER_HISTORY',
    'FETCH_APP_HISTORY',
    'FETCH_SYSTEM_NOTIFICATIONS',
    'STOP_HISTORY_COLLECTION'
]);

function isHistoryCommand(action) {
    return HISTORY_COMMANDS.has(String(action || ''));
}

function isHistoryAgentResponse(packet) {
    if (!packet || typeof packet !== 'object') return false;
    const command = String(packet.command || '');
    if (!HISTORY_COMMANDS.has(command)) return false;
    return packet.success === true || packet.success === 'true';
}

function extractDeviceIdFromAgentSocket(ws) {
    const key = String(ws?.connectionKey || '');
    if (key.startsWith('AGENT_')) return key.slice('AGENT_'.length);
    if (key.startsWith('DEVICE_')) return key.slice('DEVICE_'.length);
    return '';
}

function broadcastHistoryTelemetry(deviceId, payload, activeConnections, ownerUserId = null) {
    const message = JSON.stringify({
        type: 'history_telemetry',
        deviceId,
        data: payload.entries,
        ...payload
    });

    activeConnections.forEach((clientSocket, key) => {
        if (!(key.startsWith('DASHBOARD_') && clientSocket.readyState === 1)) return;
        if (ownerUserId) {
            const dashUserId = clientSocket?.authContext?.user?.id || clientSocket?.authContext?.userId;
            if (String(dashUserId || '') !== String(ownerUserId)) return;
        }
        clientSocket.send(message);
    });
}

async function handleHistoryAgentResponse(ws, packet, activeConnections) {
    const deviceId = extractDeviceIdFromAgentSocket(ws);
    const userId = ws?.authContext?.userId || ws?.authContext?.user?.id || null;
    if (!deviceId) {
        console.warn('[HISTORY] Agent response ignored — missing device id');
        return;
    }
    if (!userId) {
        console.warn(`[HISTORY] Agent response ignored for ${deviceId} — missing userId (multi-user isolation)`);
        return;
    }

    try {
        const result = await persistHistoryPayload(deviceId, { ...packet, userId });
        console.log(`[HISTORY] Synced ${result.command} for ${deviceId}: ${result.count} entries`);

        broadcastHistoryTelemetry(deviceId, {
            command: result.command,
            count: result.count,
            entries: Array.isArray(packet.data) ? packet.data : Array.isArray(packet.entries) ? packet.entries : [],
            syncedAt: new Date().toISOString()
        }, activeConnections, userId);
    } catch (error) {
        console.error('[HISTORY] Persist failed:', error.message);
        broadcastHistoryTelemetry(deviceId, {
            command: packet.command,
            error: error.message,
            success: false
        }, activeConnections, userId);
    }
}

module.exports = {
    HISTORY_COMMANDS,
    isHistoryCommand,
    isHistoryAgentResponse,
    handleHistoryAgentResponse,
    extractDeviceIdFromAgentSocket
};
