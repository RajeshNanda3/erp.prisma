import jwt from "jsonwebtoken";
import {prisma} from '../prismaClient.js';
import bcrypt from "bcryptjs";

// Helper to sign JWT token
const signToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

// Register Controller
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    console.log(req.body)
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required." });
    }

    // Check if the user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: "Email already registered." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || "user", // Default role is "user" if not provided
      },
    });

    // Generate JWT token
    const token = signToken(newUser);

    // Set token in HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    // Respond with the created user (excluding the password)
    res.status(201).json({
      user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
    });
  } catch (err) {
    console.error("Error during registration:", err);
    res.status(500).json({ error: "Registration failed.", details: err.message });
  }
};


// Login Controller
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    // Check if the user exists
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password1." });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password2." });
    }

    // Generate JWT token
    const token = signToken(user);

    // Set token in HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    // Respond with the logged-in user (excluding the password)
    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ error: "Login failed.", details: err.message });
  }
};
// Logout Controller (optional)
export const logoutUser = (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0, // Immediately expire the cookie
  });
  res.json({ message: "Logged out successfully." });
};