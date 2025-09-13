import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Chat from "./../models/Chat.js";

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// API to register user
export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExist = await User.findOne({ email });

    if (userExist) {
      return res.status(400).json({
        success: false,
        message: "User already exist",
      });
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// API to login user
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);

      if (isMatch) {
        const token = generateToken(user._id);
        res.status(200).json({
          success: true,
          token,
        });
      }
    }

    res.status(400).json({
      success: false,
      message: "Invalid credentials",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// API to get user data
export const getUser = async (req, res) => {
  try {
    const user = req.user;

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// API to get published images
export const getPublishedImages = async (req, res) => {
  try {
    const publishedImageMessages = await Chat.aggregate([
      { $unwind: "$messages" },
      {
        $match: {
          "messages.isImage": true,
          "messages.isPublished": true,
        },
      },
      {
        $project: {
          _id: 0,
          imageUrl: "$messages.content",
          userName: "$userName",
        },
      },
    ]);

    res.status(200).json({
      success: true,
      images: publishedImageMessages.reverse(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
