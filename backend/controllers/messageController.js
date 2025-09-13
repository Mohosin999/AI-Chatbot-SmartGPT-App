import axios from "axios";
import Chat from "../models/Chat.js";
import User from "../models/User.js";
import imagekit from "../configs/imageKit.js";
import openai from "../configs/openai.js";

// Text-based AI chat message controller
export const textMessageController = async (req, res) => {
  try {
    const userId = req.user._id;
    // Check credits
    if (req.user.credits < 1) {
      return res.status(400).json({
        success: false,
        message: "Not enough credits",
      });
    }

    const { chatId, prompt } = req.body;

    const chat = await Chat.findOne({ userId, _id: chatId });

    chat.messages.push({
      role: "user",
      content: prompt,
      timestamp: Date.now(),
      isImage: false,
    });

    const { choices } = await openai.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const reply = {
      ...choices[0].message,
      timestamp: Date.now(),
      isImage: false,
    };

    // Send instant response
    res.status(200).json({
      success: true,
      reply,
    });

    // After that, update the database
    chat.messages.push(reply);
    await chat.save();
    // Decrease the credits of the user
    await User.updateOne({ _id: userId }, { $inc: { credits: -1 } });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Image generation message controller
export const imageMessageController = async (req, res) => {
  try {
    const userId = req.user._id;
    // Check credits
    if (req.user.credits < 2) {
      return res.status(400).json({
        success: false,
        message: "Not enough credits",
      });
    }

    const { chatId, prompt, isPublished } = req.body;
    // Find chat
    const chat = await Chat.findOne({ userId, _id: chatId });

    // Push user message
    chat.messages.push({
      role: "user",
      content: prompt,
      timestamp: Date.now(),
      isImage: false,
    });

    // Encode the prompt
    const encodedPrompt = encodeURIComponent(prompt);

    // Construct imageKit AI generation URL
    const generatedImageUrl = `${
      process.env.IMAGEKIT_URL_ENDPOINT
    }/ik-genimg-prompt-${encodedPrompt}/smartgpt/${Date.now()}.png?tr=w-800,h-800`;

    // Trigger generation by fetching from ImageKit
    const aiImageResponse = await axios.get(generatedImageUrl, {
      responseType: "arraybuffer",
    });

    // Convert to base64
    const base64Image = `data:image/png;base64,${Buffer.from(
      aiImageResponse.data,
      "binary"
    ).toString("base64")}`;

    // Upload to imagekit media library
    const uploadResponse = await imagekit.upload({
      file: base64Image,
      fileName: `${Date.now()}.png`,
      folder: "smartgpt",
    });

    const reply = {
      role: "assistant",
      content: uploadResponse.url,
      timestamp: Date.now(),
      isImage: false,
      isPublished,
    };

    res.status(200).json({
      success: true,
      reply,
    });

    // After that, update the database
    chat.messages.push(reply);
    await chat.save();
    // Decrease the credits of the user
    await User.updateOne({ _id: userId }, { $inc: { credits: -2 } });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
