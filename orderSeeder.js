const mongoose = require("mongoose");
const Order = require("./models/order");
const Customer = require("./models/shopper");
const Product = require("./models/product");

// Connect to MongoDB

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/simple_crud_roles';
const PORT = process.env.PORT || 3000;

// --- DB ---

mongoose.connect(MONGODB_URI, { dbName: 'simple_crud_roles' })



const seedOrders = async () => {
  try {
    // Optional: Clear existing orders
    await Order.deleteMany({});

    // Fetch some existing customers and products
    const customers = await Customer.find({});
    const products = await Product.find({});

    if (customers.length === 0 || products.length === 0) {
      console.log("No customers or products found. Seed them first!");
      process.exit();
    }

    // Create orders
    const orders = [
      {
        customerId: customers[0]._id,
        productId: products[0]._id,
        productName: products[0].itemName,
        quantity: 1,
        status: "Pending",
      }
    ];

    await Order.insertMany(orders);

    console.log("Orders seeded successfully!");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedOrders();
