require("dotenv").config();
const userModel = require("../models/UserModel.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

const signup = async (req , res)=>{
    try{
        
        const { name, email, password, role, department } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const existingUser = await userModel.findOne({ email: email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const createdUser = await userModel.create({
            name,
            email,
            password : hashedPassword,
            role: role || "viewer",
            department,
        });

        res.status(201).json({
            message:"user created",
            data:createdUser,
        });
    }
    catch(err){
        console.log(err)
        res.status(500).json({
            message:"error",
            data:err,
        });
        
    }
}


const login = async(req,res)=>{
    try{

        
        const { email, password } = req.body;
        const olduser = await userModel.findOne({email:email});
        if(olduser!=null){
            const isMatch = await bcrypt.compare(password, olduser.password);

            if(isMatch){
                const token = jwt.sign({email:olduser.email}, JWT_SECRET);
                res.status(200).json({
                    message:"login successful",
                    token:token,
                });
            }
            else{
                return res.status(401).json({
                    message:"invalid credentials",
                });
            }
        }
        else{
            res.status(404).json({
                message:"Email not found",
            });
        }
    }
    catch(err){
        console.log(err);
        res.status(500).json({
            message:"error",
            data:err,
        });
    }
    


}

const getUserData = async(req,res)=>{
    try{
        const {token} = req.body;
        const user = jwt.verify(token, JWT_SECRET);
        const email = user.email;
        const userData = await userModel.findOne({email:email}).select("-password");
        if(userData){
            res.status(200).json({
                message:"user found",
                data:userData,
            });
        }
        else{
            res.status(404).json({
                message:"user not found",
            });
        }
    }
    catch(err){
        console.log(err);
        res.status(401).json({
            message:"Invalid or expired token",
            data:err,
        });
    }
    
}

module.exports = {
    signup,login,getUserData
}

