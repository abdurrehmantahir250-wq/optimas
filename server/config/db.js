const { connectDatabase } = require('../db/DatabaseFactory');

const connectDB = async () => {
    try {
        await connectDatabase();
    } catch (error) {
        console.error('Database initial connection failure:', error.message);
    }
};

module.exports = connectDB;
