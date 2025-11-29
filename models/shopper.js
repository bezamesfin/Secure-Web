const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
    customerName: {type: String, required: true},
    customerId: {type: Number, required: true},
    password: {type: String, required: true},
    email: {type: String, required: true},
    address: {type: String, required: true},
    role: {type: String, default:"customer"}
    
});

module.exports = mongoose.model("shopper", OrderSchema);