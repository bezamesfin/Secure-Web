const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const methodOverride = require('method-override');
const path = require('path');
const Admin = require("./models/admin");
const Shopper = require("./models/shopper");
const Product = require("./models/product");
const Order = require("./models/order");
const { error } = require('console');


const app = express();

// --- Config ---
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/simple_crud_roles';
const PORT = process.env.PORT || 3000;

// --- DB ---

mongoose.connect(MONGODB_URI, { dbName: 'simple_crud_roles' })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));


// --- View engine ---
app.use(express.urlencoded({ extended: true }));  //enabled this to bypass mongoose from blocking nosql injections
app.use(express.json()); //this is also added for the nosql injection

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


app.use(express.static(path.join(__dirname, 'public'))); // optional if you add assets


app.use(methodOverride('_method'));
app.use(session({
  secret: 'no-security-secret',
  resave: false,
  saveUninitialized: true
  //cookie: {httpOnly: false, secure: false} 
}));

/* This redirects the root webpage access to login */
app.get('/', (req, res) => {
res.redirect('/login');
 
});
/* This displays the login page*/
app.get("/login", (req, res) => {
  res.render("login", { error: null });
});

/* This is responsible for handling login process and roles*/
app.post("/login", async (req,res) =>{
    try{
   // const {adminName, password} = req.body;
 
    //console.log(req.body.password)
    const user = await Admin.findOne({adminName: req.body.username, password: req.body.password})
    if (!user) return res.render ("login", {error: "Invalid username/password"})
    res.cookie("role", user.role, {httpOnly: false});
    const orders = await Order.find().lean();
    if(user.role === "superadmin") return res.render("superadmin-dash", {orders});
    if(user.role === "admin") return res.render("admin-dash", {orders});
    

    }
    catch(err){
        console.log(err)
    }
   
   

});


/* This displays the superadmin dashboard*/
app.get("/dashboard/superadmin", async (req,res) =>{
    //const role= req.cookies.role || "guest";
    const orders = await Order.find().lean();
    res.render("superadmin-dash", { orders });
    
})
app.get("/dashboard/admin", async (req,res) =>{
    try{
        const orders = await Order.find().lean();
        res.render("admin-dash",{ orders })
    }
    catch (error){
        res.send("Error loading orders")

    }
    //const role= req.cookies.role || "guest";
    
})

//Edit orders for superadmin
app.put("/orders/:id", async (req, res) =>{
    const { customerId, productId,productName, quantity, status } = req.body
    await Order.findByIdAndUpdate(req.params.id, {customerId,productId,productName,quantity,status});
    const orders = await Order.find().lean();
     res.render("superadmin-dash", { orders });

});
//edit order for admin
app.put("/ordersAdmin/:id", async (req, res) =>{
    const { customerId, productId,productName, quantity, status } = req.body
    await Order.findByIdAndUpdate(req.params.id, {customerId,productId,productName,quantity,status});
    const orders = await Order.find().lean();
     res.render("admin-dash", { orders });

});

//delete orders for superadmin
app.get("/orders/:id/delete", async (req, res) =>{
    try{
        
    await Order.findByIdAndDelete (req.params.id);
    const orders = await Order.find().lean();
     res.render("superadmin-dash", { orders });
    }
    catch(err){
   res.send("Error Deleting Order")
    }
});
// delete route for admin
app.get("/ordersAdmin/:id/delete", async (req, res) =>{
    try{
        
    await Order.findByIdAndDelete (req.params.id);
    const orders = await Order.find().lean();
     res.render("admin-dash", { orders });
    }
    catch(err){
   res.send("Error Deleting Order")
    }
});
app.get("/products", async (req,res) =>{
    try{
        const products = await Product.find().lean();
        res.render("products",{ products })
    }
    catch (error){
        res.send("Error loading orders")

    }
    //const role= req.cookies.role || "guest";
    
})
// Add new product
app.post("/products", async (req, res) =>{
    try{
    const { itemName, itemId, price, quantity } = req.body
    await Product.create({itemName,itemId,price,quantity});
    const products = await Product.find().lean();
    res.render("products", { products });
    }
    catch (error){
       res.send("Error loading orders")
    }

});
//Edit products
app.put("/products/:id", async (req, res) =>{
    try{
   const { itemName, itemId, price, quantity } = req.body
    await Product.findByIdAndUpdate(req.params.id, {itemName,itemId,price,quantity});
    const products = await Product.find().lean();
     res.render("products", { products });
    }
    catch(error){
        res.send("Error loading orders")
    }
 

});
//Delete products
app.get("/products/:id/delete", async (req, res) =>{
    try{
    await Product.findByIdAndDelete (req.params.id);
    const products = await Product.find().lean();
     res.render("products", { products });
    }
    catch(err){
   res.send("Error Deleting Order")
    }
});

//get admin info
app.get("/admins", async (req,res) =>{
    try{
        const admins = await Admin.find().lean();
        res.render("admin",{ admins })
    }
    catch (error){
        res.send("Error loading orders")

    }
    //const role= req.cookies.role || "guest";
    
})
// Add new admin
app.post("/admins", async (req, res) =>{
    try{
    const { adminName, adminId, role, password } = req.body
    await Admin.create({adminName,adminId,role,password});
    const admins = await Admin.find().lean();
    res.render("admin", { admins });
    }
    catch (error){
       res.send("Error loading orders")
    }

});
//Edit admins
app.put("/admins/:id", async (req, res) =>{
    try{
   const { adminName, adminId, role, password } = req.body

    await Admin.findByIdAndUpdate(req.params.id, {adminName,adminId,role,password});
    const admins = await Admin.find().lean();
     res.render("admin", { admins });
    }
    catch(error){
        res.send("Error loading orders")
    }
 

});
//Delete admins
app.get("/admins/:id/delete", async (req, res) =>{
    try{
    await Admin.findByIdAndDelete (req.params.id);
    const admins = await Admin.find().lean();
     res.render("admin", { admins });
    }
    catch(err){
   res.send("Error Deleting Order")
    }
});

//get customer dashboard
app.get("/shoppers", async (req,res) =>{
    try{
        const customers = await Shopper.find().lean();
        res.render("shopper",{ customers })
    }
    catch (error){
        res.send("Error loading orders")

    }
    //const role= req.cookies.role || "guest";
    
})
// Add new Customer
app.post("/shoppers", async (req, res) =>{
    try{
    const { customerName, customerId, email, address, password } = req.body
    await Shopper.create({customerName,customerId,email,address,password});
    const customers = await Shopper.find().lean();
    res.render("shopper", { customers });
    }
    catch (error){
      
        console.log(error)
       res.send("Error loading Customers")
    }

});
//Edit customers
app.put("/shoppers/:id", async (req, res) =>{
    try{
   const { customerName, customerId, email, address, password} = req.body
    await Shopper.findByIdAndUpdate(req.params.id, {customerName,customerId,email,address,password});
    const customers = await Shopper.find().lean();
     res.render("shopper", { customers });
    }
    catch(error){
        res.send("Error loading orders")
    }
 

});
//Delete customers
app.get("/shoppers/:id/delete", async (req, res) =>{
    try{
    await Shopper.findByIdAndDelete (req.params.id);
    const customers = await Shopper.find().lean();
     res.render("shopper", { customers });
    }
    catch(err){
   res.send("Error Deleting Order")
    }
});
app.get("/customer/login", (req, res) => {
  res.render("customer-login", { error: null });
});

//get customer dashboard
app.get("/customer/dashboard", async (req,res) =>{
    try{
        const products = await Product.find({});
        const orders = await Order.aggregate([
            {
                $match: {
                    customerId: new mongoose.Types.ObjectId(req.session.user.id)
                }
            },
            {
            $lookup:{
                from:"products",
                localField:"productId",
                foreignField: "_id",
                as: "productData"

            }
        },
        {
            $unwind: "$productData"
        },
        {
            $project:{
                productName: "$productData.itemName",
                quantity: 1,
                status:1
            
            }
        }
        ]);
        const customer= req.session.user;
        res.render("customers", {products,orders,customer})
    }
    catch (error){
        console.log(error)
        res.send("Error loading orders")

    }
    //const role= req.cookies.role || "guest";
    
});
app.post("/customer/login", async (req,res) =>{
    try{
   // const {adminName, password} = req.body;

    //console.log(req.body.password)
    const shopper = await Shopper.findOne({customerName: req.body.username, password: req.body.password})
    if (!shopper) return res.render ("customer-login", {error: "Invalid username/password"})
    req.session.user={id:shopper._id,
                     name: shopper.customerName,
                     email: shopper.email,
                     address: shopper.address};
    res.cookie("role", shopper.role, {httpOnly: false});
    res.redirect("/customer/dashboard");
    

    }
    catch(err){
        console.log(err)
    }

});

app.post("/customer/order", async (req,res) =>{
    try{
       
        await Order.create({
            customerId: req.session.user.id,
            productId: req.body.productId,
            productName: req.body.productName,
            quantity: req.body.quantity
        })
     res.redirect("/customer/dashboard")

    }
    catch(err){
        console.log(err)
    }

});

app.put("/profile/:id", async (req, res) =>{
    try{
    const test =req.params.id.trim();
    const custId = new mongoose.Types.ObjectId(test); 
    const{email,address}= req.body
    await Shopper.findByIdAndUpdate(custId, {email,address});
    const updateCust = await Shopper.findById(custId);
    req.session.user={id:updateCust._id,
                     name: updateCust.customerName,
                     email: updateCust.email,
                     address: updateCust.address};

   res.redirect("/customer/dashboard")
    }
    catch(error){
        res.send("Error loading orders")
    }
 

});

app.get("/logout", async (req,res) =>{
     res.clearCookie("connect.sid")
     res.redirect("/login")
    //const role= req.cookies.role || "guest";
    
});
app.get("/customer/logout", async (req,res) =>{
     res.clearCookie("connect.sid")
     res.redirect("/customer/login")
    //const role= req.cookies.role || "guest";
    
})

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});