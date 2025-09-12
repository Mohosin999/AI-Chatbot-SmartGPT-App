import express from "express";
const userRouter = express.Router();
import {
  getUser,
  loginUser,
  registerUser,
} from "../controllers/userController.js";
import { protect } from "../middlewares/auth.js";

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.get("/data", protect, getUser);

export default userRouter;
