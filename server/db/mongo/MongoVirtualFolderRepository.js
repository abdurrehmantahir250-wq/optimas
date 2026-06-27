const mongoose = require('mongoose');
const VirtualFolder = require('../../models/VirtualFolder');
const { BaseVirtualFolderRepository } = require('../BaseVirtualFolderRepository');

class MongoVirtualFolderRepository extends BaseVirtualFolderRepository {
    async connect() {
        if (mongoose.connection.readyState === 1) return;
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is missing. Set it or choose another DATABASE_PROVIDER.');
        }
        await mongoose.connect(process.env.MONGODB_URI);
    }

    async findByParent(deviceId, parentPath) {
        return VirtualFolder.find({ deviceId, parentPath }).sort({ name: 1 }).lean();
    }

    async findAll(deviceId) {
        return VirtualFolder.find({ deviceId }).sort({ path: 1 }).lean();
    }

    async findOneByPath(deviceId, path) {
        return VirtualFolder.findOne({ deviceId, path });
    }

    async findById(id) {
        return VirtualFolder.findById(id);
    }

    async findChildFolder(deviceId, parentPath) {
        return VirtualFolder.findOne({ deviceId, parentPath });
    }

    async create(data) {
        return VirtualFolder.create(data);
    }

    async deleteById(id) {
        return VirtualFolder.findByIdAndDelete(id);
    }
}

module.exports = { MongoVirtualFolderRepository };
