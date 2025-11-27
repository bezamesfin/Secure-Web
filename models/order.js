const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
    customerId: mongoose.Schema.Types.ObjectId,
    productId: mongoose.Schema.Types.ObjectId,
    productName: {type: String, required: true},
    quantity: {type: Number, required: true},
    status: {type: String, required: true, default:"Pending"}
});

module.exports = mongoose.model("order", OrderSchema);