const WebSocket = require('ws');
const { handleSocketMessage, handleSocketClose } = require('./handler');
const { verifyUserToken, verifyAgentToken, AUTH_COOKIE } = require('../services/authService');
const { createConnectionRateLimiter, createAuditLogger } = require('./abuseControl');

function parseCookies(header) {
    const out = {};
    if (!header) return out;
    String(header).split(';').forEach((part) => {
        const idx = part.indexOf('=');
        if (idx <= 0) return;
        const key = part.slice(0, idx).trim();
        const value = part.slice(idx + 1).trim();
        out[key] = decodeURIComponent(value);
    });
    return out;
}

async function authenticateGatewayRequest(req) {
    const parsedUrl = new URL(req.url || '/', 'http://localhost');
    const query = parsedUrl.searchParams;
    const authHeader = req.headers?.authorization || req.headers?.get?.('authorization');
    const cookieHeader = req.headers?.cookie || req.headers?.get?.('cookie');
    const cookies = parseCookies(cookieHeader);

    const tokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    const tokenFromCookie = cookies[AUTH_COOKIE] || null;
    const token = tokenFromHeader || tokenFromCookie;

    if (token) {
        const user = await verifyUserToken(token);
        if (user?.sub) {
            return { ok: true, kind: 'user', user: { id: user.sub, email: user.email, role: user.role, name: user.name } };
        }
    }

    const deviceId = query.get('deviceId') || query.get('device_id') || null;
    const agentToken = query.get('agentToken') || query.get('agent_token') || null;
    if (deviceId && agentToken) {
        const credential = await verifyAgentToken(deviceId, agentToken);
        if (credential) {
            return { ok: true, kind: 'agent', deviceId, userId: credential.userId };
        }
    }

    return { ok: false };
}

function initWebSocketGateway(server, nextUpgradeHandler) {
    const wss = new WebSocket.Server({ noServer: true });
    const gatewayRateLimiter = createConnectionRateLimiter(20, 60 * 1000);
    const auditLogger = createAuditLogger();

    server.on('upgrade', async (req, socket, head) => {
        if (req.url?.startsWith('/ws/gateway')) {
            const auth = await authenticateGatewayRequest(req);
            if (!auth.ok) {
                auditLogger.log({ event: 'gateway_unauthorized', url: req.url });
                socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                socket.destroy();
                return;
            }

            const clientKey = auth.kind === 'user' ? `user:${auth.user.id}` : `device:${auth.deviceId}`;
            if (!gatewayRateLimiter.allow(clientKey)) {
                auditLogger.log({ event: 'gateway_rate_limited', clientKey });
                socket.write('HTTP/1.1 429 Too Many Requests\r\n\r\n');
                socket.destroy();
                return;
            }

            wss.handleUpgrade(req, socket, head, (ws) => {
                ws.authContext = auth;
                auditLogger.log({ event: 'gateway_connected', clientKey, kind: auth.kind });
                wss.emit('connection', ws, req);
            });
        } else if (typeof nextUpgradeHandler === 'function') {
            nextUpgradeHandler(req, socket, head);
        } else {
            socket.destroy();
        }
    });

    wss.on('connection', (ws, req) => {
        ws.upgradeReq = req;
        console.log(`[GATEWAY] WebSocket client connected: ${String(req.url || '/ws/gateway').split('?')[0]}`);
        ws.on('message', (message) => {
            const clientKey = ws.authContext?.kind === 'user' ? `user:${ws.authContext.user.id}` : `device:${ws.authContext?.deviceId || 'unknown'}`;
            auditLogger.log({ event: 'gateway_message', clientKey, size: Buffer.byteLength(message || '', 'utf8') });
            void handleSocketMessage(ws, message);
        });
        ws.on('close', () => {
            auditLogger.log({ event: 'gateway_disconnected', clientKey: ws.authContext?.kind === 'user' ? `user:${ws.authContext.user.id}` : `device:${ws.authContext?.deviceId || 'unknown'}` });
            handleSocketClose(ws);
        });
    });

    return {
        wss,
        auditLogger,
        gatewayRateLimiter
    };
}

module.exports = { initWebSocketGateway };