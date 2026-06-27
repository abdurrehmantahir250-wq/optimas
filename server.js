const express = require('express');
const http = require('http');
require('dotenv').config();

const connectDB = require('./server/config/db');
const { nextApp, nextHandler } = require('./server/config/next');
const networkRoutes = require('./server/routes/network');
const mediaRoutes = require('./server/routes/media');
const virtualFileRoutes = require('./server/routes/virtual-files');
const fileRoutes = require('./server/routes/files');
const notificationRoutes = require('./server/routes/notifications');
const logsRoutes = require('./server/routes/logs');
const { initWebSocketGateway } = require('./server/sockets/gateway');
const { lookupShareToken, serviceErrorResponse } = require('./server/services/virtualFileService');

const PORT = process.env.PORT || 3000;

nextApp.prepare().then(async () => {
    await connectDB();

    const app = express();

    const server = http.createServer(app);
    const nextUpgradeHandler = nextApp.getUpgradeHandler();

    initWebSocketGateway(server, nextUpgradeHandler);

    const { broadcastDeviceList } = require('./server/sockets/handler');
    setInterval(() => broadcastDeviceList(), 5000);

    app.use('/api/network', express.json(), networkRoutes);
    app.use('/api/media', express.json(), mediaRoutes);
    app.use('/api/virtual-files', express.json(), virtualFileRoutes);
    app.use('/api/files', express.json(), fileRoutes);
    app.use('/api/notifications', express.json(), notificationRoutes);
    app.use('/api/logs', express.json(), logsRoutes);

    app.get('/api/virtual-files/share/:token', async (req, res) => {
        try {
            const payload = await lookupShareToken(req, req.params.token);
            return res.status(200).json(payload);
        } catch (error) {
            const err = serviceErrorResponse(error, 'Share lookup failed.');
            return res.status(err.status).json(err);
        }
    });

    app.get('/api/network/live-agents', (req, res) => {
        const { getConnectionRegistry } = require('./server/sockets/registry');
        const { getLiveDeviceOptions } = require('./server/sockets/handler');
        getConnectionRegistry();
        res.status(200).json({ success: true, devices: getLiveDeviceOptions() });
    });

    app.use((req, res) => nextHandler(req, res));

    server.listen(PORT, (err) => {
        if (err) throw err;
        console.log(`> Integrated Structural Application Core Engine live on http://localhost:${PORT}`);
    });
});
