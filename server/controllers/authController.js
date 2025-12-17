const { User: UserModel } = require("../chat/users");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Input validation helpers
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

const validateName = (name) => {
  return name && name.trim().length >= 2 && name.trim().length <= 50;
};

// Registering a new User
const registerUser = async(req, res) => {
    try {
        const { name, email, password } = req.body;

        // Enhanced validation
        if (!name || !email || !password) {
            return res.status(400).json({ message: "Please fill all fields" });
        }

        // Validate name
        if (!validateName(name)) {
            return res.status(400).json({ 
                message: "Name must be between 2 and 50 characters" 
            });
        }

        // Validate email format
        if (!validateEmail(email)) {
            return res.status(400).json({ 
                message: "Please provide a valid email address" 
            });
        }

        // Validate password strength
        if (!validatePassword(password)) {
            return res.status(400).json({ 
                message: "Password must be at least 6 characters long" 
            });
        }

        // Check if user already exists
        const oldUser = await UserModel.findOne({ email: email.toLowerCase().trim() });
        
        if (oldUser) {
            return res.status(400).json({ 
                message: "This Email is already Registered!!" 
            });
        }

        // Amount of encrypting password
        const salt = await bcrypt.genSalt(10);
        const hashedPass = await bcrypt.hash(password, salt);
        
        const newUser = new UserModel({
            name: name.trim(), 
            email: email.toLowerCase().trim(), 
            password: hashedPass
        });

        // Saving the user/registering New User
        const user = await newUser.save();

        // Creating jwt Token(Access) for 1 hour only.
        const token = jwt.sign(
            { email: user.email, id: user._id }, 
            process.env.JWT_SECRET, 
            { expiresIn: "1h" }
        );

        // Everything is right - exclude password from response
        const { password: userPassword, ...userWithoutPassword } = user.toObject();
        
        res.status(200).json({ 
            user: userWithoutPassword, 
            token,
            message: "Registration successful"
        });
    } catch (error) {
        // Enhanced error logging
        console.error("Registration Error:", {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        
        // Handle specific MongoDB errors
        if (error.code === 11000) {
            return res.status(400).json({ 
                message: "Email already exists" 
            });
        }
        
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                message: "Validation error: " + error.message 
            });
        }
        
        // Generic error response
        res.status(500).json({ 
            message: "Registration failed. Please try again later." 
        });
    }
}

//  Login User
const loginUser = async (req, res) => {
    try {
        // Email and password from HTTP Request
        const { email, password } = req.body;

        // Enhanced validation
        if (!email || !password) {
            return res.status(400).json({ 
                message: "Please provide email and password" 
            });
        }

        // Validate email format
        if (!validateEmail(email)) {
            return res.status(400).json({ 
                message: "Please provide a valid email address" 
            });
        }

        // Find user with normalized email
        const user = await UserModel.findOne({ 
            email: email.toLowerCase().trim() 
        });
        
        // If Email is not in Database
        if (!user) {
            return res.status(404).json({ 
                message: "User Does not Exist!!" 
            });
        }

        // Verify password
        const validity = await bcrypt.compare(password, user.password);
        
        if (!validity) {
            return res.status(400).json({ 
                message: "Password does not match!!" 
            });
        }

        // Creating jwt Token(Access) for 1 hour only.
        const token = jwt.sign(
            { email: user.email, id: user._id }, 
            process.env.JWT_SECRET, 
            { expiresIn: "1h" }
        );
        
        // Successful Login - exclude password from response
        const { password: userPassword, ...userWithoutPassword } = user.toObject();
        
        res.status(200).json({ 
            user: userWithoutPassword, 
            token,
            message: "Login successful"
        });
    } catch (error) {
        console.error("Login Error:", {
            message: error.message,
            stack: error.stack
        });
        
        // Handle JWT errors
        if (error.name === 'JsonWebTokenError') {
            return res.status(500).json({ 
                message: "Token generation failed" 
            });
        }
        
        // Generic error response
        res.status(500).json({ 
            message: "Login failed. Please try again later." 
        });
    }
}

module.exports = { registerUser, loginUser };
