Project Overview
    This project is a simple e-commerce web applicatin designed to demonstrate 
    how insecure coding practices lead to security flaws. The system simulates an
    online store where customers can brrowse products, place orders and manage their 
    profiles, while administrators can manage products, orders and user accounts.
    The primary purpuse is to show importance of secure by design development. The application 
    was initialy built with vulnerabilities such as NoSQL injection, XSS, Unauthorized access
    week session handling and plain text password storage. These were exploited using manual 
    testing and interception tools such as Burp Suite. Finally secure coding was applied
    to mitigate each weakness.

Features and security objectives
    The core functional features of the system are:  
        1.	Customer functional requirement
            a.	login to the system using valid credentials
            b.	View product lists with price and availability 
            c.	Place order for available product
            d.	View existing orders they have already placed 
            e.	Update profile data (email and physical address) 
        2.	Super Administrator functional requirements
            a.	Update customer order status 
            b.	Remove customer orders from the application 
            c.	Add new product with the appropriate detail (name, price, availability)
            d.	Edit product detail
            e.	Remove products from the system
            f.	Register new administrator and customer to access the system
            g.	Edit administrator and customer detail
            h.	Delete customer and administrator account from the system.
        3.	Administrator Functional requirements 
            a.	Update customer’s order status 
            b.	Remove customer orders from the application 
            c.	Add new product with the appropriate detail (name, price, availability)
            d.	Edit product detail
            e.	Remove product from the system
        4.	System Functional Requirement
            a.	Update stock levels after customers place orders.
            b.	Verify the availability of product before an order is processed by a customer
    Security Objectives of the system are:
        1.	Prevent NoSQL injection
        2.	Enforce secure session management 
        3.	Implement strong password hashing
        4.	Prevent XSS attacks
        5.	Enforce server-side authorization
        6.	Validate and sanitise all user input
        7.	Prevent cookie manipulation and privilege escalation
        8.	Enforce rate limiting for authentication process
        9.	Use strong password generation algorithm
        
Project Structure


    
    

        
    
