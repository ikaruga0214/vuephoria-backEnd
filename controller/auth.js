import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../model/User.js";

export async function auth1(req, res, next) {
  try {
    const token = await req.headers.authorization.split(" ")[1];

    const decodedToken = jwt.verify(token, "secrets");

    const user = decodedToken;

    req.user = user;

    next();
  } catch (err) {
    res.status(401).json({ err: new Error("Invalid request") });
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json("不存在的信箱");
    }
    const isMatched = await bcrypt.compare(password, user.password);

    if (!isMatched) {
      return res.status(400).json("密碼不正確");
    }

    const token = jwt.sign(
      { userId: user._id, userEmail: user.email },
      "secrets"
    );

    delete user.password;

    res.status(200).json({
      user: { email, id: user._id },
      token,
    });
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};
