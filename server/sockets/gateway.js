const WebSocket = require('ws');
const { handleSocketMessage, handleSocketClose } = require('./handler');

function initWebSocketGateway(server, nextUpgradeHandler) {
    const wss = new WebSocket.Server({ noServer: true });

    server.on('upgrade', (req, socket, head) => {
        if (req.url?.startsWith('/ws/gateway')) {
            wss.handleUpgrade(req, socket, head, (ws) => {
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
        console.log(`[GATEWAY] WebSocket client connected: ${req.url || '/ws/gateway'}`);
        ws.on('message', (message) => handleSocketMessage(ws, message));
        ws.on('close', () => handleSocketClose(ws));
    });

    return wss;
}

module.exports = { initWebSocketGateway };