const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
    customerName: {type: String, required: true},
    customerId: {type: Number, required: true},
    email: {type: String, required: true}
    
});

module.exports = mongoose.model("shopper", OrderSchema);