const express = require('express');
const {
    registerUser,
    loginUser,
    signUserToken,
    verifyUserToken,
    createAgentCredential,
    listUserDevices,
    AUTH_COOKIE,
    authCookieOptions
} = require('../services/authService');
const { attachUser } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const user = await registerUser(req.body || {});
        const token = signUserToken(user);
        res.cookie(AUTH_COOKIE, token, authCookieOptions());
        return res.status(200).json({
            success: true,
            user: {
                id: String(user._id),
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    } catch (error) {
        return res.status(error.status || 500).json({
            success: false,
            message: error.message || 'Registration failed.'
        });
    }
});

router.post('/login', async (req, res) => {
    try {
        const user = await loginUser(req.body || {});
        const token = signUserToken(user);
        res.cookie(AUTH_COOKIE, token, authCookieOptions());
        return res.status(200).json({
            success: true,
            user: {
                id: String(user._id),
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    } catch (error) {
        return res.status(error.status || 500).json({
            success: false,
            message: error.message || 'Login failed.'
        });
    }
});

router.post('/logout', (_req, res) => {
    res.clearCookie(AUTH_COOKIE, { path: '/' });
    return res.status(200).json({ success: true });
});

router.get('/me', attachUser, async (req, res) => {
    const devices = await listUserDevices(req.user.id);
    return res.status(200).json({
        success: true,
        user: req.user,
        devices: devices.map((d) => ({
            deviceId: d.deviceId,
            label: d.label,
            lastConnectedAt: d.lastConnectedAt
        }))
    });
});

router.get('/agents', attachUser, async (req, res) => {
    const devices = await listUserDevices(req.user.id);
    return res.status(200).json({
        success: true,
        devices: devices.map((d) => ({
            deviceId: d.deviceId,
            label: d.label,
            lastConnectedAt: d.lastConnectedAt
        }))
    });
});

router.post('/agents', attachUser, async (req, res) => {
    try {
        const { deviceId, label } = req.body || {};
        const { credential, agentToken } = await createAgentCredential(
            req.user.id,
            deviceId,
            label
        );
        return res.status(200).json({
            success: true,
            device: {
                deviceId: credential.deviceId,
                label: credential.label
            },
            agentToken
        });
    } catch (error) {
        return res.status(error.status || 500).json({
            success: false,
            message: error.message || 'Could not register agent.'
        });
    }
});

router.get('/session', (req, res) => {
    const token = req.cookies?.[AUTH_COOKIE];
    const payload = verifyUserToken(token);
    if (!payload?.sub) {
        return res.status(401).json({ success: false, authenticated: false });
    }
    return res.status(200).json({
        success: true,
        authenticated: true,
        user: {
            id: payload.sub,
            email: payload.email,
            name: payload.name,
            role: payload.role
        }
    });
});

module.exports = router;
