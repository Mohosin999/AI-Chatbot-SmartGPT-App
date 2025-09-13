import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./db/db.js";
import userRouter from "./routes/userRoutes.js";
import chatRouter from "./routes/chatRoutes.js";

const app = express();

await connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get("/", (_req, res) => res.send("Hello World!"));
app.use("/api/user", userRouter);
app.use("/api/chat", chatRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
