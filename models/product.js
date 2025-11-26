const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
    itemName: {type: String, required: true},
    itemId: {type: Number, required: true},
    price: {type: Number, required: true},
    quantity: {type: Number, required: true}
});

module.exports = mongoose.model("product", OrderSchema);