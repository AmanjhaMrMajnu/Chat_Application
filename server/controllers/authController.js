const { User: UserModel } = require("../chat/users");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Registering a new User
const registerUser = async(req, res) => {
    try {
        const {name, email, password} = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({message: "Please fill all fields"});
        }

        const oldUser = await UserModel.findOne({email});
        // if email for register already exist in Database
        if(oldUser){
            return res.status(400).json({message : "This Email is already Registered!!"});
        }

        // Amount of encrypting password
        const salt = await bcrypt.genSalt(10);
        const hashedPass = await bcrypt.hash(password, salt);
        
        const newUser = new UserModel({
            name, 
            email, 
            password: hashedPass
        });

        // Saving the user/registering New User
        const user = await newUser.save();

        // Creating jwt Token(Access) for 1 hour only.
        const token = jwt.sign({email: user.email, id: user._id}, process.env.JWT_SECRET, {expiresIn:"1h"});

        // Everything is right - exclude password from response
        const { password: userPassword, ...userWithoutPassword } = user.toObject();
        res.status(200).json({user: userWithoutPassword, token});
    } catch (error) {
        // Error
        console.error("Registration Error:", error);
        res.status(500).json({message: error.message});
    }
}

//  Login User
const loginUser = async (req, res) => {
    try {
        // Email and password from HTTP Request
        const {email, password} = req.body;

        if (!email || !password) {
            return res.status(400).json({message: "Please provide email and password"});
        }

        const user = await UserModel.findOne({email: email});
        // If Email is in Database
        if(user){
            // if Password Hash matches with one in database
            const validity = await bcrypt.compare(password,user.password);
            if(validity){
                // Creating jwt Token(Access) for 1 hour only.
                const token = jwt.sign({email: user.email, id: user._id}, process.env.JWT_SECRET, {expiresIn:"1h"});
                //Successful Login
                const { password: userPassword, ...userWithoutPassword } = user.toObject();
                res.status(200).json({user: userWithoutPassword, token});
            }
            else{
                // Invalid Password
                res.status(400).json({message: "Password does not match!!"});
            }
        }
        else{
            res.status(404).json({message: "User Does not Exist!!"});
        }
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({message: error.message});
    }
}

module.exports = { registerUser, loginUser };
