import express from "express";
import { auth1 } from "../controller/auth.js";
const router = express.Router();

router.get("/free-endpoint", (req, res) => {
  res.json({ message: "You are free to access me anytime!" });
});

router.get("/auth-endpoint", auth1, (req, res) => {
  res.json({ message: "You are authorized to access me!" });
});

export default router;
