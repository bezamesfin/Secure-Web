const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
    adminName: {type: String, required: true},
    adminId: {type: Number, required: true},
    role: {type: String, required: true},
    password: {type: String, required: true}
});

module.exports = mongoose.model("admin", OrderSchema);