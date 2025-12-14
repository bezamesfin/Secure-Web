const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const methodOverride = require('method-override');
const path = require('path');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');

const Joi=require('joi');
const crypto= require("crypto");
const Admin = require("./models/admin");
const Shopper = require("./models/shopper");
const Product = require("./models/product");
const Order = require("./models/order");
const {isLogedIn, roleAuth} = require("./auth");

const rateLimit = require('express-rate-limit')
const loginTrial = rateLimit({max:3,windowMs: 5 * 60 * 1000,message:"Too many Login Attempt!"}) // limit user login to 3 attampts and reset counter after 5 minute

const app = express();

// Define the connection string to the MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/Ecommerce_Data';
const PORT = process.env.PORT || 3000;

// Establish Connection with the database
mongoose.connect(MONGODB_URI, { dbName: 'Ecommerce_Data' })
  .then(() => console.log('Connected to Database'))
  .catch(err => console.error('Connection error:', err));


// Application middlewares for json parsing, view engine, readin cookie, Http methods support
app.use(express.urlencoded({ extended: true }));  
app.use(express.json()); 
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(methodOverride('_method'));
app.use(cookieParser());

// Session management configuration
app.use(session({
  secret: crypto.randomBytes(64).toString("hex"), //Generate a strong secret value, this can be stores as env variable for more security 
  resave: false,
  saveUninitialized: false,
  cookie: {httpOnly: true, maxAge: 10*60*1000} 
}));

// This redirects the root webpage access to login
app.get('/', (req, res) => {
res.redirect('/customer/login');
 
});
// Displays the login page
app.get("/login", (req, res) => {
  res.render("login", { error: null });
});

// This is responsible for handling login process
app.post("/login",loginTrial, async (req,res) =>{
    try{
     const signup=Joi.object({  // use Joi validation library
            username: Joi.string().alphanum().min(4).max(30).required(), //validate username supplied 
            password: Joi.string().min(6).required() //validate password supplied 
        })
    const{error}= signup.validate(req.body);
    if (error) return res.status(400).send(error.details[0].message)
    
    const {username,password}= req.body
    const user = await Admin.findOne({adminName:username})
    if (!user) return res.render ("login", {error: "Invalid username/password"})
 
    const match=await bcrypt.compare(password, user.password) // check if supplied password match stored hash password
    if (!match) return res.render ("login", {error: "Invalid username/password"})
    
    res.cookie("role", user.role); // kept this for test purpose only
    req.session.user={UserId:user._id, role:user.role}

    // Render dashboard based on role
    if(user.role === "superadmin") return res.redirect("/dashboard/superadmin");
    if(user.role === "admin") return res.redirect("/dashboard/admin");
    }
    catch(err){
        console.log(err)
    }
});

// This displays dashboard for superadmin user after session validation
app.get("/dashboard/superadmin", isLogedIn, roleAuth("superadmin"), async (req,res) =>{
    try{
    const orders = await Order.find().lean(); // retrieve orders from DB
    res.render("superadmin-dash", { orders }); // view page
    }
    catch (error){
        res.send("Error loading orders")
    }  
})
// Display dashboard for admin user after session validation
app.get("/dashboard/admin", isLogedIn, roleAuth("admin"), async (req,res) =>{
    try{
        const orders = await Order.find().lean(); // retrieve orders from DB
        res.render("admin-dash",{ orders }) // view page
    }
    catch (error){
        res.send("Error loading orders")
    }
})

//Edit order endpoint with session and role validation
app.put("/orders/:id", isLogedIn, roleAuth(["superadmin","admin"]), async (req, res) =>{
    try{
    const { customerId, productId,productName, quantity, status } = req.body // extract fields from request body
    await Order.findByIdAndUpdate(req.params.id, {customerId,productId,productName,quantity,status}); //edit data in DB
    const orders = await Order.find().lean();

    // check role for loading page
    if (req.session.user.role === "superadmin"){
        res.render("superadmin-dash", { orders });
    }
    else{
        res.render("admin-dash", { orders });
    }
    }
    catch (error){
        res.send("Error editing orders")
    }
});

//Delete orders endpoint with session and role validation
app.get("/orders/:id/delete", isLogedIn, roleAuth(["superadmin","admin"]), async (req, res) =>{
    try{    
    await Order.findByIdAndDelete (req.params.id); // delete record with the specified ID
    const orders = await Order.find().lean();

    // check role for loading page
    if (req.session.user.role === "superadmin"){
        res.render("superadmin-dash", { orders });
    }
    else {
        res.render("admin-dash", { orders });
    }
    }
    catch(err){
        res.send("Error Deleting Order")
    }
});

//Retrieve product endpoint with session and role validation
app.get("/products", isLogedIn,roleAuth(["superadmin","admin"]), async (req,res) =>{
    try{
        const role =req.session.user.role;
        const products = await Product.find().lean(); // get products from DB
        res.render("products",{ products,role })
    }
    catch (error){
        res.send("Error loading Products")
    }
});

// Add new product endpoint with session and role validation
app.post("/products", isLogedIn,roleAuth(["superadmin","admin"]), async (req, res) =>{
    try{
    const signup=Joi.object({  // use Joi validation library
        itemName: Joi.string().pattern(/^[A-Za-z]+$/).max(30).required(), // validate if product name is string
        itemId: Joi.number().integer().positive().required(),  // validate if product ID is numeric
        price: Joi.number().positive().required(),  // validate if product price is numeric
        quantity: Joi.number().integer().positive().required()  // validate if product quantity is numeric
        })
    const{error}= signup.validate(req.body);
    if (error) return res.status(400).send(error.details[0].message) // return error if validation fails

    const role =req.session.user.role; //get user role from session 
    const { itemName, itemId, price, quantity } = req.body // get data from request body
    await Product.create({itemName,itemId,price,quantity}); // register product to DB
    const products = await Product.find().lean(); // get products from DB
    res.render("products", { products, role}); // render product page with the new data
    }
    catch (error){
       res.send("Error Adding Products")
    }
});

//Edit products endpoint with session and role validation
app.put("/products/:id", isLogedIn,roleAuth(["superadmin","admin"]), async (req, res) =>{
    try{
    const signup=Joi.object({  // use Joi validation library
        itemName: Joi.string().pattern(/^[A-Za-z]+$/).max(30).required(),
        itemId: Joi.number().integer().positive().required(),
        price: Joi.number().positive().required(),
        quantity: Joi.number().integer().positive().required()
        })
    const{error}= signup.validate(req.body);
    if (error) return res.status(400).send(error.details[0].message) // return error if validation fails

    const role =req.session.user.role; //get user role from session 
    const { itemName, itemId, price, quantity } = req.body
    await Product.findByIdAndUpdate(req.params.id, {itemName,itemId,price,quantity}); // edit product detail
    const products = await Product.find().lean();
    res.render("products", { products,role }); // render product page with the updated data
    }
    catch(error){
        res.send("Error Editing Products")
    }
});
//Delete products endpoint with session and role validation
app.get("/products/:id/delete", isLogedIn,roleAuth(["superadmin","admin"]), async (req, res) =>{
    try{
    const role =req.session.user.role; //get user role from session 
    await Product.findByIdAndDelete (req.params.id); // delete selected product
    const products = await Product.find().lean();
    res.render("products", { products, role });
    }
    catch(err){
    res.send("Error Deleting Order")
    }
});

// Retrieve admins endpoint with session and role validation
app.get("/admins",isLogedIn,roleAuth("superadmin"), async (req,res) =>{
    try{
        const roles =req.session.user.role; //get user role from session
        const admins = await Admin.find().lean(); //Get admins from DB
        res.render("admin",{ admins,roles }) // view admins listing page
    }
    catch (error){
        res.send("Error Fetching Admins")
    }   
})
// Add new admin endpoint with session and role validation
app.post("/admins", isLogedIn, roleAuth("superadmin"), async (req, res) =>{
    try{
        const signup=Joi.object({  // use Joi validation library
        adminName: Joi.string().alphanum().min(4).max(30).required(), // validate admin name data
        adminId: Joi.number().integer().positive().required() // validate admin ID
    }).unknown(true); // ignore missing fields from request body for validation 
        const{error}= signup.validate(req.body);
        if (error) return res.status(400).send(error.details[0].message)
    
        const roles =req.session.user.role; // get user roles from session 
        const roleAllowed=["admin","superadmin"]; // role list that can be used while registering admin
        const { adminName, adminId, role, password } = req.body  // get data from request body
    if(!roleAllowed.includes(role)){ // check incoming role data is allowed
        return res.status(400).send("Invalid role")
    }
    const saltRounds=10   //rounds of hashing performed on password
    const hash= await bcrypt.hash(password, saltRounds)  //hash password

    await Admin.create({adminName,adminId,role,password:hash});  //register admin with hashed password
    const admins = await Admin.find().lean();
    res.render("admin", { admins,roles });
    }
    catch (error){
       res.send("Error Registering Admin")
    }
});
//Edit admin endpoint with session and role validation
app.put("/admins/:id", isLogedIn,roleAuth("superadmin"), async (req, res) =>{
    try{   
        const signup=Joi.object({   //use Joi validation library
        adminName: Joi.string().alphanum().min(4).max(30).required(),
        adminId: Joi.number().integer().positive().required()       
    }).unknown(true);  //ignore missing fields from request body for validation 
        const{error}= signup.validate(req.body);
        if (error) return res.status(400).send(error.details[0].message) //return error if validation fail

        const roles =req.session.user.role;
        const { adminName, adminId, role } = req.body  //get data from request body
        await Admin.findByIdAndUpdate(req.params.id, {adminName,adminId,role});  //edit admin detail 
        const admins = await Admin.find().lean();
        res.render("admin", { admins, roles});
    }
    catch(error){
        res.send("Error Editing Admin")
    }
});
//Delete admins endpoint with session and role validation
app.get("/admins/:id/delete", isLogedIn,roleAuth("superadmin"), async (req, res) =>{
    try{
        const roles =req.session.user.role;  // get user role from session
        await Admin.findByIdAndDelete (req.params.id);  //delete user from db 
        const admins = await Admin.find().lean();
        res.render("admin", { admins,roles }); // view page with updated data list
    }
    catch(err){
        res.send("Error Deleting Admin")
    }
});

//Get customer list endpoint with session and role validation
app.get("/shoppers",isLogedIn,roleAuth("superadmin"), async (req,res) =>{
    try{
        const role =req.session.user.role; // get user role from session
        const customers = await Shopper.find().lean(); // retrieve customers from DB
        res.render("shopper",{ customers, role })
    }
    catch (error){
        res.send("Error loading Customers")
    }
})
// Add new Customer endpoint with session and role validation
app.post("/shoppers",isLogedIn,roleAuth("superadmin"), async (req, res) =>{
    try{
    const signup=Joi.object({   //use Joi validation library
            customerName: Joi.string().alphanum().min(4).max(30).required(),   //validate customer name data
            customerId: Joi.number().integer().positive().required(),   //validate customer ID data
            email: Joi.string().email().required(),   //validate email data format
            address: Joi.string().max(30).required()  //validate address format
        }).unknown(true); //ignore missing fields from request body for validation 
    const{error}= signup.validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);  //return error message if validation fail

    const role =req.session.user.role; // get user role from session
    const { customerName, customerId, email, address, password } = req.body;    //get data from request body
    const saltRounds=10  //rounds of hashing performed on password
    const hash= await bcrypt.hash(password, saltRounds)   //hash password
    await Shopper.create({customerName,customerId,email,address,password:hash});  //register customer with hashed password
    const customers = await Shopper.find().lean();
    res.render("shopper", { customers,role });  // view page with the new data
    }
    catch (error){
       res.send("Error registerin Customers")
    }

});
//Edit customers endpoint with session and role validation
app.put("/shoppers/:id",isLogedIn,roleAuth("superadmin"), async (req, res) =>{
    try{
    const signup=Joi.object({    //use Joi validation library
            customerName: Joi.string().alphanum().min(4).max(30).required(),
            customerId: Joi.number().integer().positive().required(),
            email: Joi.string().email().required(),
            address: Joi.string().max(30).required()
        }).unknown(true);    //ignore missing fields from request body for validation
    const{error}= signup.validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);   //return error message if validation fails
    const role =req.session.user.role;  //get user role from session
    const { customerName, customerId, email, address} = req.body   //get data from request body
    await Shopper.findByIdAndUpdate(req.params.id, {customerName,customerId,email,address});    //edit customer detail with new data
    const customers = await Shopper.find().lean();
    res.render("shopper", { customers,role });  //view page with updated data
    }
    catch(error){
        res.send("Error editing customer")
    }
});

//Delete customers endpoint with session and role validation
app.get("/shoppers/:id/delete",isLogedIn,roleAuth("superadmin"), async (req, res) =>{
    try{
    const role =req.session.user.role;   //get user role from session
    await Shopper.findByIdAndDelete (req.params.id);  // delete customer from DB
    const customers = await Shopper.find().lean();
    res.render("shopper", { customers,role });  //view page with updated data list
    }
    catch(err){
    res.send("Error Deleting customer")
    }
});

// View Customer login page
app.get("/customer/login", (req, res) => {
  res.render("customer-login", { error: null });
});

//View customer dashboard endpoint with session and role validation
app.get("/customer/dashboard",isLogedIn,roleAuth("customer"), async (req,res) =>{
    try{
        const products = await Product.find({});  // get products from DB
        const orders = await Order.aggregate([
            {
                $match: {
                    customerId: new mongoose.Types.ObjectId(req.session.user.id)  // get orders only belonging to current customer
                }
            },
            {
            // join statement to get product detail for products in orders
            $lookup:{     
                from:"products",
                localField:"productId",
                foreignField: "_id",
                as: "productData"
            }
        },
        {
            $unwind: "$productData"   // change array creted by $lookup to object 
        },
        {
        // fields to be returned on the order object
            $project:{
                productName: "$productData.itemName",
                quantity: 1,
                status:1
            }
        }
        ]);
        const customer= req.session.user;
        res.render("customers", {products,orders,customer});  // view customer page
    }
    catch (error){
        res.send("Error loading products")
    }
});

//customer login endpoint with session and role validation
app.post("/customer/login", loginTrial, async (req,res) =>{
    try{
    const signup=Joi.object({    //use Joi validation library
            username: Joi.string().alphanum().min(4).max(30).required(),   //validate username
            password: Joi.string().min(6).required()        //validate password
        })
    const{error}= signup.validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);   //return error if validation fails
    
    const {username, password} = req.body;    //load data from request body
    const shopper = await Shopper.findOne({customerName: username})   //find customer data based on username
    if (!shopper) return res.render ("customer-login", {error: "Invalid username/password"})
     
    const match=await bcrypt.compare(password,shopper.password);    //match if supplied password hash and stored hashed password is similar
    if(!match) return res.render ("customer-login", {error: "Invalid username/password"});   //return error if match fails
    // store user in session
    req.session.user={id:shopper._id,
                     name: shopper.customerName,
                     email: shopper.email,
                     address: shopper.address,
                     role: shopper.role};
    res.redirect("/customer/dashboard");   //redirect to customers dashboard
    }
    catch(err){
        res.send("Error authenticating customer")
    }
});

//create order endpoint with session and role validation
app.post("/customer/order",isLogedIn,roleAuth("customer"), async (req,res) =>{
    try{  
     const product= await Product.findById(req.body.productId)
      if(req.body.quantity > product.quantity){
        return res.status(400).send("Not Enough stock");
      }
        await Order.create({
            customerId: req.session.user.id,
            productId: req.body.productId,
            productName: req.body.productName,
            quantity: req.body.quantity
        })
    product.quantity -= req.body.quantity;
    await product.save();

     res.redirect("/customer/dashboard")
    }
    catch(err){
        res.send("Error creating order")
    }
});

//edit profile endpoint with session and role validation
app.put("/profile/:id", isLogedIn,roleAuth("customer"),async (req, res) =>{
    try{  //use Joi validation library
    const signup=Joi.object({ 
            email: Joi.string().email().required(),      //validate username data
            address: Joi.string().max(30).required()    //validate address data
           
        }).unknown(true);    //ignore missing fields from request body for validation
    const{error}= signup.validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);    //return error if data validation fails

    const idTrim =req.params.id.trim();
    const custId = new mongoose.Types.ObjectId(idTrim);
    const{email,address}= req.body    //get data from request body
    await Shopper.findByIdAndUpdate(custId, {email,address});  //update profile detail
    const updateCust = await Shopper.findById(custId);
    req.session.user={id:updateCust._id,
                     name: updateCust.customerName,
                     email: updateCust.email,
                     address: updateCust.address,
                     role: updateCust.role};
   res.redirect("/customer/dashboard")
    }
    catch(error){   
        res.send("Error updating profile")
    }
});

// admin logout endpoint
app.get("/logout", async (req,res) =>{
    req.session.destroy(err =>{     //destroy session
        if (err){
            console.error(err)
            return res.status(500).send("Error Logging out")
        }
    res.clearCookie("connect.sid")    //clear cookie
     res.redirect("/login");
    });
  
});

//customer logout endpoint
app.get("/customer/logout", async (req,res) =>{
        req.session.destroy(err =>{    //destroy session
        if (err){
            console.error(err)
            return res.status(500).send("Error Logging out")
        }
    res.clearCookie("connect.sid")    //clear cookie
    res.redirect("/customer/login")
    });
})

// setting server running port
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});