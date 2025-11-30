const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const methodOverride = require('method-override');
const path = require('path');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit')
const Joi=require('joi');
const Admin = require("./models/admin");
const Shopper = require("./models/shopper");
const Product = require("./models/product");
const Order = require("./models/order");
const {isLogedIn, roleAuth} = require("./auth");
const { error } = require('console');
const loginTrial = rateLimit({max:3,windowMS: 5 * 60 * 1000,message:"Too many Login Attempt!"})


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
app.use(cookieParser());
app.use(session({
  secret: 'no-security-secret',
  resave: false,
  saveUninitialized: true,
  cookie: {httpOnly: true, maxAge: 10*60*1000} 
}));

/* This redirects the root webpage access to login */
app.get('/', (req, res) => {
res.redirect('/customer/login');
 
});
/* This displays the login page*/
app.get("/login", (req, res) => {
  res.render("login", { error: null });
});

/* This is responsible for handling login process and roles*/
app.post("/login",loginTrial, async (req,res) =>{
    try{
     const signup=Joi.object({
            username: Joi.string().alphanum().min(4).max(30).required(),
            password: Joi.string().min(6).required()
        })
    const{error}= signup.validate(req.body);
    if (error) return res.status(400).send(error.details[0].message)
    
   const {username,password}= req.body
    const user = await Admin.findOne({adminName:username})
    if (!user) return res.render ("login", {error: "Invalid username/password"})
 
    const match=await bcrypt.compare(password, user.password)

    if (!match) return res.render ("login", {error: "Invalid username/password"})
    
    res.cookie("role", user.role); // kept this for test purpose only
    req.session.user={UserId:user._id, role:user.role}
                        console.log(req.session.user)

    if(user.role === "superadmin") return res.redirect("/dashboard/superadmin");
    if(user.role === "admin") return res.redirect("/dashboard/admin");
    

    }
    catch(err){
        console.log(err)
    }
   
   

});


/* This displays the superadmin dashboard*/
app.get("/dashboard/superadmin", isLogedIn, roleAuth("superadmin"), async (req,res) =>{

    const orders = await Order.find().lean();
    res.render("superadmin-dash", { orders });
  
    
})
app.get("/dashboard/admin", isLogedIn, roleAuth("admin"), async (req,res) =>{
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
app.put("/orders/:id", isLogedIn, roleAuth(["superadmin","admin"]), async (req, res) =>{
    const { customerId, productId,productName, quantity, status } = req.body
    await Order.findByIdAndUpdate(req.params.id, {customerId,productId,productName,quantity,status});
    const orders = await Order.find().lean();
    if (req.session.user.role === "superadmin"){
     res.render("superadmin-dash", { orders });
    }
    else{
        res.render("admin-dash", { orders });
    }

});

//delete orders for superadmin
app.get("/orders/:id/delete", isLogedIn, roleAuth(["superadmin","admin"]), async (req, res) =>{
    try{
        
    await Order.findByIdAndDelete (req.params.id);
    const orders = await Order.find().lean();
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

app.get("/products", isLogedIn,roleAuth(["superadmin","admin"]), async (req,res) =>{
    try{
        const role =req.session.user.role;
        const products = await Product.find().lean();
        res.render("products",{ products,role })
    }
    catch (error){
        res.send("Error loading orders")

    }
    //const role= req.cookies.role || "guest";
    
})
// Add new product
app.post("/products", isLogedIn,roleAuth(["superadmin","admin"]), async (req, res) =>{
    try{

    const signup=Joi.object({
        itemName: Joi.string().pattern(/^[A-Za-z]+$/).max(30).required(),
        itemId: Joi.number().integer().positive().required(),
        price: Joi.number().positive().required(),
        quantity: Joi.number().integer().positive().required()
        })
    const{error}= signup.validate(req.body);
    if (error) return res.status(400).send(error.details[0].message)

    const role =req.session.user.role;
    const { itemName, itemId, price, quantity } = req.body
    await Product.create({itemName,itemId,price,quantity});
    const products = await Product.find().lean();
    res.render("products", { products, role});
    }
    catch (error){
       res.send("Error loading orders")
    }

});
//Edit products
app.put("/products/:id", isLogedIn,roleAuth(["superadmin","admin"]), async (req, res) =>{
    try{
    const signup=Joi.object({
        itemName: Joi.string().pattern(/^[A-Za-z]+$/).max(30).required(),
        itemId: Joi.number().integer().positive().required(),
        price: Joi.number().positive().required(),
        quantity: Joi.number().integer().positive().required()
        })
    const{error}= signup.validate(req.body);
    if (error) return res.status(400).send(error.details[0].message)

    const role =req.session.user.role;
    const { itemName, itemId, price, quantity } = req.body
    await Product.findByIdAndUpdate(req.params.id, {itemName,itemId,price,quantity});
    const products = await Product.find().lean();
     res.render("products", { products,role });
    }
    catch(error){
        res.send("Error loading orders")
    }
 

});
//Delete products
app.get("/products/:id/delete", isLogedIn,roleAuth(["superadmin","admin"]), async (req, res) =>{
    try{
    const role =req.session.user.role;
    await Product.findByIdAndDelete (req.params.id);
    const products = await Product.find().lean();
     res.render("products", { products, role });
    }
    catch(err){
   res.send("Error Deleting Order")
    }
});

//get admin info
app.get("/admins",isLogedIn,roleAuth("superadmin"), async (req,res) =>{
    try{
        const roles =req.session.user.role;
        const admins = await Admin.find().lean();
        res.render("admin",{ admins,roles })

}
    catch (error){
        console.log(req)
        console.log(error)
        res.send("Error loading admins")

    }
    //const role= req.cookies.role || "guest";
    
})
// Add new admin
app.post("/admins", isLogedIn, roleAuth("superadmin"), async (req, res) =>{
    try{
    const signup=Joi.object({
            adminName: Joi.string().alphanum().min(4).max(30).required(),
            adminId: Joi.number().integer().positive().required()
        }).unknown(true);
    const{error}= signup.validate(req.body);
    if (error) return res.status(400).send(error.details[0].message)
    
    const roles =req.session.user.role;
    const { adminName, adminId, role, password } = req.body    
    const saltRounds=10
    const hash= await bcrypt.hash(password, saltRounds)
    await Admin.create({adminName,adminId,role,password:hash});

    const admins = await Admin.find().lean();
    res.render("admin", { admins,roles });
    }
    catch (error){
        console.log(error)
       res.send("Error loading orders")
    }

});
//Edit admins
app.put("/admins/:id", isLogedIn,roleAuth("superadmin"), async (req, res) =>{
    try{
    
    const signup=Joi.object({
            adminName: Joi.string().alphanum().min(4).max(30).required(),
            adminId: Joi.number().integer().positive().required()
           
        }).unknown(true);
    const{error}= signup.validate(req.body);
    if (error) return res.status(400).send(error.details[0].message)

    const roles =req.session.user.role;
    const { adminName, adminId, role } = req.body
    await Admin.findByIdAndUpdate(req.params.id, {adminName,adminId,role});
    const admins = await Admin.find().lean();
     res.render("admin", { admins, roles});
    }
    catch(error){
        res.send("Error loading orders")
    }
 

});
//Delete admins
app.get("/admins/:id/delete", isLogedIn,roleAuth("superadmin"), async (req, res) =>{
    try{
        const roles =req.session.user.role;
    await Admin.findByIdAndDelete (req.params.id);
    const admins = await Admin.find().lean();
     res.render("admin", { admins,roles });
    }
    catch(err){
   res.send("Error Deleting Order")
    }
});

//get customer dashboard
app.get("/shoppers",isLogedIn,roleAuth("superadmin"), async (req,res) =>{
    try{
        const role =req.session.user.role;
        const customers = await Shopper.find().lean();
        res.render("shopper",{ customers, role })
    }
    catch (error){
        res.send("Error loading orders")

    }
    //const role= req.cookies.role || "guest";
    
})
// Add new Customer
app.post("/shoppers",isLogedIn,roleAuth("superadmin"), async (req, res) =>{
    try{
    const signup=Joi.object({
            customerName: Joi.string().alphanum().min(4).max(30).required(),
            customerId: Joi.number().integer().positive().required(),
            email: Joi.string().email().required(),
            address: Joi.string().max(30).required()
           
        }).unknown(true);
    const{error}= signup.validate(req.body);
    if (error) return res.status(400).send(error.details[0].message)

    const role =req.session.user.role;
    const { customerName, customerId, email, address, password } = req.body
    const saltRounds=10
    const hash= await bcrypt.hash(password, saltRounds)
    await Shopper.create({customerName,customerId,email,address,password:hash});
    const customers = await Shopper.find().lean();
    res.render("shopper", { customers,role });
    }
    catch (error){
      
        console.log(error)
       res.send("Error loading Customers")
    }

});
//Edit customers
app.put("/shoppers/:id",isLogedIn,roleAuth("superadmin"), async (req, res) =>{
    try{
    const signup=Joi.object({
            customerName: Joi.string().alphanum().min(4).max(30).required(),
            customerId: Joi.number().integer().positive().required(),
            email: Joi.string().email().required(),
            address: Joi.string().max(30).required()
           
        }).unknown(true);
    const{error}= signup.validate(req.body);
    if (error) return res.status(400).send(error.details[0].message)

    const role =req.session.user.role;
   const { customerName, customerId, email, address} = req.body

    await Shopper.findByIdAndUpdate(req.params.id, {customerName,customerId,email,address});
    const customers = await Shopper.find().lean();
     res.render("shopper", { customers,role });
    }
    catch(error){
        res.send("Error loading orders")
    }
 

});
//Delete customers
app.get("/shoppers/:id/delete",isLogedIn,roleAuth("superadmin"), async (req, res) =>{
    try{
    const role =req.session.user.role;
    await Shopper.findByIdAndDelete (req.params.id);
    const customers = await Shopper.find().lean();
     res.render("shopper", { customers,role });
    }
    catch(err){
   res.send("Error Deleting Order")
    }
});
app.get("/customer/login", (req, res) => {
  res.render("customer-login", { error: null });
});

//get customer dashboard
app.get("/customer/dashboard",isLogedIn,roleAuth("customer"), async (req,res) =>{
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
app.post("/customer/login", loginTrial, async (req,res) =>{
    try{
    const signup=Joi.object({
            username: Joi.string().alphanum().min(4).max(30).required(),
            password: Joi.string().min(6).required()
        })
    const{error}= signup.validate(req.body);
    if (error) return res.status(400).send(error.details[0].message)
    
   const {username, password} = req.body;
    //console.log(req.body.password)
    const shopper = await Shopper.findOne({customerName: username})
    if (!shopper) return res.render ("customer-login", {error: "Invalid username/password"})
     
    const match=await bcrypt.compare(password,shopper.password)
    if(!match) return res.render ("customer-login", {error: "Invalid username/password"})
    req.session.user={id:shopper._id,
                     name: shopper.customerName,
                     email: shopper.email,
                     address: shopper.address,
                     role: shopper.role};
                    console.log(req.session.user)
    
    res.cookie("role", "customer");
    res.redirect("/customer/dashboard");
    

    }
    catch(err){
        console.log(err)
    }

});

app.post("/customer/order",isLogedIn,roleAuth("customer"), async (req,res) =>{
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

app.put("/profile/:id", isLogedIn,roleAuth("customer"),async (req, res) =>{
    try{
    const signup=Joi.object({
            email: Joi.string().email().required(),
            address: Joi.string().max(30).required()
           
        }).unknown(true);
    const{error}= signup.validate(req.body);
    if (error) return res.status(400).send(error.details[0].message)

    const test =req.params.id.trim();
    const custId = new mongoose.Types.ObjectId(test); 
    const{email,address}= req.body
    await Shopper.findByIdAndUpdate(custId, {email,address});
    const updateCust = await Shopper.findById(custId);
    req.session.user={id:updateCust._id,
                     name: updateCust.customerName,
                     email: updateCust.email,
                     address: updateCust.address,
                     role: updateCust.role};

   res.redirect("/customer/dashboard")
    }
    catch(error){
        
        res.send("Error loading orders")
    }
 

});

app.get("/logout", async (req,res) =>{
    req.session.destroy(err =>{
        if (err){
            console.error(err)
            return res.status(500).send("Error Logging out")
        }
    res.clearCookie("connect.sid")
     res.redirect("/login")
    });
  
});
app.get("/customer/logout", async (req,res) =>{
        req.session.destroy(err =>{
        if (err){
            console.error(err)
            return res.status(500).send("Error Logging out")
        }
    res.clearCookie("connect.sid")
     res.redirect("/customer/login")
    });

})

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});