const mongoose = require('mongoose');

const socialSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    icon: { type: String, required: true },
    url: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Social', socialSchema);