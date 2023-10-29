import express from "express";
const router = express.Router();
import User from "../model/User.js";

// Getting All
router.get("/", async (req, res) => {
  try {
    const user = await User.find();
    res.send(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Getting One
router.get("/:id", getUser, (req, res) => {
  res.send(res.user);
});

// Creating one
router.post("/", (req, res) => {});
// Updating one
router.patch("/:id", getUser, async (req, res) => {
  if (req.body.email !== null) {
    res.user.email = req.body.email;
  }

  try {
    const updatedUser = await res.user.save();
    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
// Deleting one
router.delete("/:id", getUser, async (req, res) => {
  try {
    await res.user.deleteOne();
    res.json({ message: "Deleted User" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/ayaya", async (req, res) => {
  const user1 = new User({
    email: req.body.email,
    password: req.body.password,
  });

  try {
    const newUser = await user1.save();
    res.status(201).json(newUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

async function getUser(req, res, next) {
  let user2;
  try {
    user2 = await User.findById(req.params.id);
    if (!user2) return res.status(404).json({ message: "Cannot find user" });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }

  res.user = user2;
  next();
}

export default router;
