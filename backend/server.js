import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./db/db.js";

const app = express();

await connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get("/", (req, res) => res.send("Hello World!"));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
