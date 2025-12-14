## Project Overview

This project is a simple e-commerce web applicatin designed to demonstrate how insecure coding practices lead to security flaws. The system simulates an online store where customers can brrowse products, place orders and manage their profiles, while administrators can manage products, orders and user accounts.The primary purpuse is to show importance of secure by design development. The application was initialy built with vulnerabilities such as NoSQL injection, XSS, Unauthorized access week session handling and plain text password storage. These were exploited and finally secure coding was applied to mitigate each weakness.

---
## Features and security objectives

The core functional features of the system are:  
 ### 1.	Customer functional requirement
    - login to the system using valid credentials
    - View product lists with price and availability 
    - Place order for available product
    - View existing orders they have already placed 
    - Update profile data (email and physical address) 
 ### 2.	Super Administrator functional requirements
    - Update customer order status 
    - Remove customer orders from the application 
    - Add new product with the appropriate detail (name, price, availability)
    - Edit product detail
    - Remove products from the system
    - Register new administrator and customer to access the system
    - Edit administrator and customer detail
    - Delete customer and administrator account from the system.
### 3.	Administrator Functional requirements 
    - Update customer’s order status 
    - Remove customer orders from the application 
    - Add new product with the appropriate detail (name, price, availability)
    - Edit product detail
    - Remove product from the system
### 4.	System Functional Requirement
    - Update stock levels after customers place orders.
    - Verify the availability of product before an order is processed by a customer
    
 #### Security Objectives of the system are:
        1.	Prevent NoSQL injection
        2.	Enforce secure session management 
        3.	Implement strong password hashing
        4.	Prevent XSS attacks
        5.	Enforce server-side authorization
        6.	Validate and sanitise all user input
        7.	Prevent cookie manipulation and privilege escalation
        8.	Enforce rate limiting for authentication process
        9.	Use strong password generation algorithm
        
## Project Structure
The repository contains set of folders and javascript files that separate the application's core responsibility

### /models/

Contains the database models or schemas used by the application. Each file in this folder defines the fields in a collection and structure of data stored in the database.

### /Views

This folder stores the frontend templates rendered by the web application. It includes pages for login, product browsing, admin dashboards, order addition, user account management.

### server.js

This is the main entry point of the application.It configures Express, connects to the database. It sets up all middleware and load all modules 

### auth.js

This handles role based access control controls for the entire application by validating user session and role. 

### adminSeeder.js

This is a databse sedder file for initializing the application for first time deployment. It creates a superadmin user.

## Setup and Installation Instructions

### Clone the repository

git clone https://github.com/bezamesfin/Secure-Web.git

### Environment Installtion

    - The application uses MongoDB, you need to install MongoDB version 7.0.25
    - Install Node.js runtime environment
    -  Install the following libraries using NPM package manager
        - mongoose, cookie-parser, bcrypt, joi, express-rate-limit, express-session, method-override
    - After successful installation run the adminSeeder.js
    - Successful execution of the seeder will give you the super admin credential on the console
    - Start the server using the server.js file

## Usage guidlines

### Customer Feature
    - Register a new account
    - Login securely
    - Browse products 
    - Order items from product list
    - Update profile information

### Admin Features
    - Login with admin credential
    - Manage products (view, add, edit, delete)
    - Manage orders (view, add, edit, delete)

### Super Admin Feature
    - Login with Superadmin credential
    - Manage products (view, add, edit, delete)
    - Manage orders (view, add, edit, delete)
    - Manage users (view, add, edit, delete)

## Security improvements

The following secure coding were implemented to mitigate vulnerabilities

### Input Validation

Validation done using Joi library prevents malicious data from reaching database and cause NOSql Injection

### Password Hashing
Replaces plaintext password to one way hash using bcrypt
### XSS mitigation
Html output escaping restricted unescaped user content that causes XSS from bieng rendered
### Secure Session Management
- HttpOnly cookie Implemented
- Secure Session ID
- Invalidate Session upon Logout
- Set Fixed session time
### Role Based Access Control
Server side Enforcement of user roles to prevent privilage escalation
### Rate limiting
Specific login trials to minimize brute force 

## Testing Process

### Functional Testing
- Manual testing using Browser and Burp Suite
- Testing authenticaation, authorization and input validation
- Attempted to exploit known vulnerabilities like NoSQL and XSS via payloads

### Static Application Security Testing
- Reviewing codebase for insecure coding patterns
- Ensure all security controls are applied in all components
- Verify role control middleware implementaion on all routes

### Key Findings
- NoSQL injections were blocked
- XSS payload treated as normal data
- Unauthorized access returned error responses
- Password stored as hash values in database
- Session reusing rejected

## Contribution and References
### Frameworks and Libraries used
- Express.js
- MongoDB
- Joi Vlaidation
- bcrypt
- express-session
- epress-rate-limit
### Tools Used
- Burp Suite
- Node.js
- Visual studio code
    










    
    

        
    
