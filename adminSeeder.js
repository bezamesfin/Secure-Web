const mongoose = require("mongoose");
const User = require("./models/admin");
const bcrypt = require("bcrypt");
const crypto= require("crypto");


// Define the connection string to the MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/Ecommerce_Data';
const PORT = process.env.PORT || 3000;

// Establish Connection with the database
mongoose.connect(MONGODB_URI, { dbName: 'Ecommerce_Data' })

// Function for adding the first super admin user to the database
const seedAdmins = async () => {
  try {

    const length=8 // Password Length
    const chars= 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz123456789!@#$%^&*' // the character set used for generating the password was smaller 
    let password= ''
    const array= new Uint32Array(length) // Create 32 bit array of unsigned integers equal to 8
    crypto.randomFillSync(array) // Generates random values and fills the array
    for(let i=0; i<length; i++){
      password += chars[array[i]% chars.length] // convert the random numbers to chars based on the defined charset
    }
    const hash= await bcrypt.hash(password, 10) // hash the generate random password

    const admin = [
      {
        adminName: "superAdmin",
        adminId: 0001,
        role: "superadmin",
        password: hash
      }
    ];
    await User.insertMany(admin); // add the new user to the DB

    // Display the generate user's credential
    console.log("Use this user name to login: " + admin[0].adminName)
    console.log("Use this password to login: " + password)
    console.log("Admin added successfully");
    process.exit();
    
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedAdmins();
