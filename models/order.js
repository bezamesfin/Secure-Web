const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
    item: {type: String, required: true},
    itemId: {type: Number, required: true},
    price: {type: Number, required: true}
});

module.exports = mongoose.model("order", OrderSchema);