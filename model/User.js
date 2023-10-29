import { Timestamp } from "mongodb";
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      max: 50,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      min: 5,
    },
    avatar: {
      type: String,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("user", UserSchema);

export default User;
