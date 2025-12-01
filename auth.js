// Function used for checking if user is logged in befor a page is accessed
function isLogedIn (req, res, next){ 
    if(req.session.user == null){   //check if there is session created
      return  res.status(403).send("Unauthorized")
    }
    next()
}

//Function used for checking user role is among allowedroles for an endpoint 
function roleAuth(role){
    const allowedRoles =Array.isArray(role)? role: [role]  // ensures that role is array and change it to array if not
    return (req, res, next) => {
    if (!allowedRoles.includes(req.session.user.role)){   //check if user role is part of the allowed role 
        return  res.status(401).send("Insuffcient Privelage")
    }
    next()
    }
}

// export functions for external use
module.exports={
    isLogedIn,
    roleAuth
}