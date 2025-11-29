function isLogedIn (req, res, next){
    console.log(req.session)
    
    if(req.session.user == null){
         console.log(req.session.user)
      return  res.status(403).send("Unauthorized")
    }
    next()
}

function roleAuth(role){
    
    const allowedRoles =Array.isArray(role)? role: [role]
    return (req, res, next) => {
    if (!allowedRoles.includes(req.session.user.role)){
        return  res.status(401).send("Insuffcient Privelage")
    }
    next()
    }
}

module.exports={
    isLogedIn,
    roleAuth
}