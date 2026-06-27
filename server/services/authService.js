const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AgentCredential = require('../models/AgentCredential');

const JWT_SECRET = process.env.JWT_SECRET || 'zenvora-dev-secret-change-in-production';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';
const AUTH_COOKIE = 'auth_token';

function getJwtSecret() {
    return JWT_SECRET;
}

function signUserToken(user) {
    return jwt.sign(
        {
            sub: String(user._id),
            email: user.email,
            role: user.role,
            name: user.name
        },
        getJwtSecret(),
        { expiresIn: JWT_EXPIRES }
    );
}

function verifyUserToken(token) {
    if (!token) return null;
    try {
        return jwt.verify(token, getJwtSecret());
    } catch {
        return null;
    }
}

function authCookieOptions() {
    const secure = process.env.NODE_ENV === 'production';
    return {
        httpOnly: true,
        secure,
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000
    };
}

async function registerUser({ email, password, name }) {
    const normalized = String(email || '').trim().toLowerCase();
    const plain = String(password || '');

    if (!normalized || plain.length < 6) {
        const error = new Error('Email and password (min 6 chars) are required.');
        error.status = 400;
        throw error;
    }

    const existing = await User.findOne({ email: normalized });
    if (existing) {
        const error = new Error('Email already registered.');
        error.status = 409;
        throw error;
    }

    const passwordHash = await bcrypt.hash(plain, 12);
    const userCount = await User.countDocuments();
    const user = await User.create({
        email: normalized,
        passwordHash,
        name: String(name || normalized.split('@')[0] || 'User').trim(),
        role: userCount === 0 ? 'admin' : 'user'
    });

    return user;
}

async function loginUser({ email, password }) {
    const normalized = String(email || '').trim().toLowerCase();
    const user = await User.findOne({ email: normalized });
    if (!user) {
        const error = new Error('Invalid email or password.');
        error.status = 401;
        throw error;
    }

    const ok = await bcrypt.compare(String(password || ''), user.passwordHash);
    if (!ok) {
        const error = new Error('Invalid email or password.');
        error.status = 401;
        throw error;
    }

    return user;
}

function generateAgentToken() {
    return crypto.randomBytes(32).toString('hex');
}

async function createAgentCredential(userId, deviceId, label = 'My Agent') {
    const cleanDeviceId = String(deviceId || '').trim();
    if (!cleanDeviceId) {
        const error = new Error('deviceId is required.');
        error.status = 400;
        throw error;
    }

    const existing = await AgentCredential.findOne({ deviceId: cleanDeviceId });
    if (existing && String(existing.userId) !== String(userId)) {
        const error = new Error('This device is already registered to another account.');
        error.status = 409;
        throw error;
    }

    const agentToken = generateAgentToken();
    const tokenHash = await bcrypt.hash(agentToken, 12);

    const doc = await AgentCredential.findOneAndUpdate(
        { deviceId: cleanDeviceId },
        {
            userId,
            deviceId: cleanDeviceId,
            label: String(label || 'My Agent').trim(),
            tokenHash
        },
        { upsert: true, new: true }
    );

    return { credential: doc, agentToken };
}

async function verifyAgentToken(deviceId, agentToken) {
    const cred = await AgentCredential.findOne({ deviceId: String(deviceId || '').trim() });
    if (!cred || !agentToken) return null;
    const ok = await bcrypt.compare(String(agentToken), cred.tokenHash);
    if (!ok) return null;
    cred.lastConnectedAt = new Date();
    await cred.save();
    return cred;
}

async function userOwnsDevice(userId, deviceId) {
    if (!userId || !deviceId) return false;
    const cred = await AgentCredential.findOne({
        userId,
        deviceId: String(deviceId).trim()
    }).lean();
    return !!cred;
}

async function listUserDevices(userId) {
    return AgentCredential.find({ userId }).sort({ updatedAt: -1 }).lean();
}

async function ensureDefaultAdmin() {
    const count = await User.countDocuments();
    if (count > 0) return null;

    const user = await registerUser({
        email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@zenvora.local',
        password: process.env.DEFAULT_ADMIN_PASSWORD || 'admin123',
        name: 'Admin'
    });

    console.log('=> Default admin account created.');
    console.log(`=> Email: ${user.email}`);
    console.log('=> Password: (see DEFAULT_ADMIN_PASSWORD or admin123) — change after first login.');
    return user;
}

module.exports = {
    AUTH_COOKIE,
    authCookieOptions,
    signUserToken,
    verifyUserToken,
    registerUser,
    loginUser,
    createAgentCredential,
    verifyAgentToken,
    userOwnsDevice,
    listUserDevices,
    ensureDefaultAdmin
};
