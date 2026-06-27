const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const User = require('../models/User');

const notification = require("../services/notificationService");
// Get notifications for current device
router.get('/', async (req, res) => {
    try {
        const { deviceId, category, limit = 50 } = req.query;
        
        if (!deviceId) {
            return res.status(400).json({ success: false, message: 'deviceId required' });
        }

        const query = { deviceId };
        if (category && category !== 'all') {
            query.category = category;
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .exec();

        res.status(200).json({
            success: true,
            count: notifications.length,
            notifications
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.put('/mark-all-read', async (req, res) => {
    try {
        const { deviceId } = req.body;

        const result = await notification.markAllNotificationsAsRead(deviceId);

        res.json({
            success: true,
            modified: result.modifiedCount
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

// Get notification cou nt by category
router.get('/categories', async (req, res) => {

    console.log("CATEGORIES ROUTE HIT");

    const categories = await Notification.aggregate([
        {
            $group: {
                _id: '$app',
                count: { $sum: 1 }
            }
        }
    ]);

    console.log(categories);

    res.json({
        success: true,
        categories
    });
});
// Create notification (from Rust agent)
router.post('/', async (req, res) => {
    try {
        const { userId, app, title, message, icon, category } = req.body;

        if (!app || !title) {
            return res.status(400).json({ 
                success: false, 
                message: 'app and title are required' 
            });
        }

        const notification = new Notification({
            userId,
            app,
            title,
            message,
            icon,
            category: category || 'other',
            read: false
        });

      await Notification.updateOne(
    {
        deviceId,
        app,
        title,
        message,
    },
    {
        $setOnInsert: {
            userId,
            icon,
            category: category || "toast",
            read: false,
        },
    },
    {
        upsert: true,
    }
);

        res.status(201).json({
            success: true,
            notification
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Bulk create notifications
router.post('/bulk', async (req, res) => {
    try {
        const { notifications } = req.body;

        if (!Array.isArray(notifications)) {
            return res.status(400).json({ 
                success: false, 
                message: 'notifications must be an array' 
            });
        }

        const created = await Notification.insertMany(notifications);

        res.status(201).json({
            success: true,
            count: created.length,
            notifications: created
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Mark notification as read
router.put('/:id/read', async (req, res) => {
    try {
        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            { read: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        res.status(200).json({ success: true, notification });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete notification
router.delete('/:id', async (req, res) => {
    try {
        const notification = await Notification.findByIdAndDelete(req.params.id);

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        res.status(200).json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Clear all notifications
router.post('/clear/all', async (req, res) => {
    try {
        const result = await Notification.deleteMany({});

        res.status(200).json({ 
            success: true, 
            message: `${result.deletedCount} notifications cleared` 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
