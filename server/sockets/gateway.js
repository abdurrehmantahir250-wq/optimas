const WebSocket = require('ws');
const { handleSocketMessage, handleSocketClose } = require('./handler');
const { verifyUserToken, AUTH_COOKIE } = require('../services/authService');
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

function withTimeout(promise, ms, label) {
    return Promise.race([
        promise,
        new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
        })
    ]);
}

function clientIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
        return forwarded.split(',')[0].trim();
    }
    return req.socket?.remoteAddress || 'unknown';
}

/**
 * Upgrade auth is intentionally lightweight.
 * Agents authenticate AFTER connect via register_channel (avoids Mongo hang during HTTP upgrade).
 * Dashboards still authenticate via cookie here.
 */
async function authenticateGatewayRequest(req) {
    const authHeader = req.headers?.authorization || req.headers?.get?.('authorization');
    const cookieHeader = req.headers?.cookie || req.headers?.get?.('cookie');
    const cookies = parseCookies(cookieHeader);

    const tokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    const tokenFromCookie = cookies[AUTH_COOKIE] || null;
    const token = tokenFromHeader || tokenFromCookie;

    if (token) {
        const user = await verifyUserToken(token);
        if (user?.sub) {
            return {
                ok: true,
                kind: 'user',
                user: { id: user.sub, email: user.email, role: user.role, name: user.name }
            };
        }
    }

    // Pending peer (agent). Real auth happens on register_channel.
    return { ok: true, kind: 'pending', ip: clientIp(req) };
}

function rejectUpgrade(socket, statusCode, message) {
    try {
        socket.write(
            `HTTP/1.1 ${statusCode} ${message}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`
        );
    } catch (_) {
        // ignore
    }
    try {
        socket.destroy();
    } catch (_) {
        // ignore
    }
}

function initWebSocketGateway(server, nextUpgradeHandler) {
    const wss = new WebSocket.Server({ noServer: true });
    const gatewayRateLimiter = createConnectionRateLimiter(40, 60 * 1000);
    const auditLogger = createAuditLogger();

    server.on('upgrade', (req, socket, head) => {
        if (!req.url?.startsWith('/ws/gateway')) {
            if (typeof nextUpgradeHandler === 'function') {
                nextUpgradeHandler(req, socket, head);
            } else {
                socket.destroy();
            }
            return;
        }

        socket.setTimeout(20000);
        socket.on('error', () => {
            try { socket.destroy(); } catch (_) {}
        });

        (async () => {
            let auth;
            try {
                auth = await withTimeout(authenticateGatewayRequest(req), 5000, 'gateway auth');
            } catch (error) {
                auditLogger.log({
                    event: 'gateway_auth_failed',
                    url: String(req.url || '').split('?')[0],
                    message: error?.message || String(error)
                });
                rejectUpgrade(socket, 503, 'Service Unavailable');
                return;
            }

            if (!auth?.ok) {
                auditLogger.log({ event: 'gateway_unauthorized', url: String(req.url || '').split('?')[0] });
                rejectUpgrade(socket, 401, 'Unauthorized');
                return;
            }

            const clientKey = auth.kind === 'user'
                ? `user:${auth.user.id}`
                : `pending:${auth.ip || clientIp(req)}`;

            if (!gatewayRateLimiter.allow(clientKey)) {
                auditLogger.log({ event: 'gateway_rate_limited', clientKey });
                rejectUpgrade(socket, 429, 'Too Many Requests');
                return;
            }

            try {
                wss.handleUpgrade(req, socket, head, (ws) => {
                    ws.authContext = auth;
                    auditLogger.log({ event: 'gateway_connected', clientKey, kind: auth.kind });
                    wss.emit('connection', ws, req);
                });
            } catch (error) {
                auditLogger.log({
                    event: 'gateway_upgrade_failed',
                    clientKey,
                    message: error?.message || String(error)
                });
                rejectUpgrade(socket, 500, 'Internal Server Error');
            }
        })();
    });

    wss.on('connection', (ws, req) => {
        ws.upgradeReq = req;
        console.log(`[GATEWAY] WebSocket client connected: ${String(req.url || '/ws/gateway').split('?')[0]} kind=${ws.authContext?.kind || 'unknown'}`);

        // Pending peers must register quickly or get dropped.
        if (ws.authContext?.kind === 'pending') {
            ws.registrationTimer = setTimeout(() => {
                if (ws.authContext?.kind === 'pending' && ws.readyState === WebSocket.OPEN) {
                    try {
                        ws.send(JSON.stringify({
                            type: 'sys_ack',
                            status: 'auth_timeout',
                            message: 'register_channel required'
                        }));
                    } catch (_) {}
                    ws.close();
                }
            }, 15000);
        }

        ws.on('message', (message) => {
            const clientKey = ws.authContext?.kind === 'user'
                ? `user:${ws.authContext.user.id}`
                : ws.authContext?.kind === 'agent'
                    ? `device:${ws.authContext.deviceId}`
                    : `pending:${ws.authContext?.ip || 'unknown'}`;
            auditLogger.log({
                event: 'gateway_message',
                clientKey,
                size: Buffer.byteLength(message || '', 'utf8')
            });
            void handleSocketMessage(ws, message);
        });

        ws.on('close', () => {
            if (ws.registrationTimer) {
                clearTimeout(ws.registrationTimer);
                ws.registrationTimer = null;
            }
            auditLogger.log({
                event: 'gateway_disconnected',
                clientKey: ws.authContext?.kind === 'user'
                    ? `user:${ws.authContext.user.id}`
                    : ws.authContext?.kind === 'agent'
                        ? `device:${ws.authContext.deviceId}`
                        : `pending:${ws.authContext?.ip || 'unknown'}`
            });
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
