import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";
import Stripe from "stripe";
import { fileURLToPath } from "url";
import User from "./model/User.js";
import Item from "./model/Item.js";
import { login } from "./controller/auth.js";
import admin from "firebase-admin";

import subscriberRouter from "./routes/subscribers.js";
import protectRouter from "./routes/protect.js";

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
app.use(express.json());
app.use(cors());

const config = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_X509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
};

admin.initializeApp({
  credential: admin.credential.cert(config),
  storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
});

const bucket = admin.storage().bucket();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({});

app.post("/newimage", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const blob = bucket.file(file.originalname);
    const blobStream = blob.createWriteStream();

    blobStream.on("finish", () => {
      res.send("SUCCESS!!!");
    });

    blobStream.on("error", () => {
      res.status(500).send("FAILURE...");
    });
    blobStream.end(file.buffer);
  } catch (err) {
    res.status(500).send("NOOO");
  }
});

app.post("/users/:id/avatar", upload.single("avatar"), async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id });
    user.avatar = req.file.path;
    await user.save();
    res.status(200).send();
  } catch (err) {
    res.status(400).send({ error: err });
  }
});

app.get("/users/:id/avatar", async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.id });
    if (!user || !user.avatar) {
      throw new Error();
    }

    const imgPath = path.join(__dirname, user.avatar);
    fs.readFile(imgPath, (err, data) => {
      if (err) {
        return next(err);
      }
      res.set("Content-Type", "image/jpg");
      res.send(data);
    });
  } catch (err) {
    res.status(404).send();
  }
});

app.post("/create-checkout-session", async (req, res) => {
  try {
    const needId = req.body.userItems.map((item) => item.id);
    const needItems = await Item.find({ _id: needId });

    const agb = req.body.userItems.map((item) => {
      return {
        price_data: {
          currency: "usd",
          product_data: { name: item.name },
          unit_amount: item.cost,
        },
        quantity: item.quantity,
      };
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: req.body.userItems.map((item) => {
        return {
          price_data: {
            currency: "twd",
            product_data: { name: item.name },
            unit_amount: item.cost * 100,
          },
          quantity: item.quantity,
        };
      }),
      success_url: "https://vuephoria.onrender.com/",
      cancel_url: "https://vuephoria.onrender.com/",
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    res.status(404).send();
  }
});

app.post("/buy", async (req, res) => {
  try {
    const Id = req.body.userItems.map((item) => item.id);
    const newA = await Item.find({ _id: Id });

    res.status(200).json(newA);
  } catch (err) {
    res.status(404).send(err);
  }
});

// const storage = multer.diskStorage({
//   destination: (req, file, callback) => {
//     callback(null, "/images");
//   },
//   filename: (req, file, callback) => {
//     callback(null, file.originalname);
//   },
// });

// const uploadFilter = (req, file, callback) => {
//   if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
//     callback(new Error("不接受您輸入的檔案格式"));
//   }
//   callback(null, true);
// };

// const upload = multer({ fileFilter: uploadFilter, storage });

mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true }).then(() => {
  // Item.insertMany(data1);
});
const db = mongoose.connection;

db.on("error", (error) => console.error(error));

db.once("open", () => console.log("Connected to Database"));

app.use(express.json());

app.use("/subscribers", subscriberRouter);

app.use("/register", async (req, res) => {
  try {
    const isUserExisted = await User.findOne({ email: req.body.email });
    if (isUserExisted) return res.status(404).json("已被註冊的信箱");

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = new User({
      email: req.body.email,
      password: hashedPassword,
    });
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.use("/protect", protectRouter);

// app.use("/login", async (req, res) => {
//   try {
//     const user = await User.findOne({ email: req.body.email });
//     const deUser = await bcrypt.compare(req.body.password, user.password);
//     if (!deUser) {
//       return res.status(400).json({ message: "Passwords does not match" });
//     }

//     const token = jwt.sign(
//       { userId: user._id, userEmail: user.email },
//       "secrets"
//     );

//     res
//       .status(200)
//       .send({ message: "Login successful", email: user.email, token });
//   } catch (err) {
//     res.status(404).json({ message: err.message });
//   }
// });

app.use("/login", login);

// app.post("/login", async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const user = await User.findOne({ email });
//     if (!user) {
//       res.status(404).json({ message: "找不到使用者" });
//     }
//     const isMatched = await bcrypt.compare(password, user.password);

//     if (!isMatched) {
//       return res.status(400).json("密碼不正確");
//     }

//     const token = jwt.sign(
//       { userId: user._id, userEmail: user.email },
//       "secrets"
//     );

//     delete user.password;

//     res.status(200).json({
//       user,
//       token,
//     });
//   } catch (err) {
//     res.status(404).json({ message: err.message });
//   }
// });

app.use("/users/:id/avatar", upload.single("avatar"), async (req, res) => {
  try {
    req.user.avatar = req.file.path;
    await req.user.save();
    res.status(200).send();
  } catch (err) {}
});

const verifytoken = async (req, res, next) => {
  try {
    let token = req.header("Authorization");

    if (!token) {
      req.status(403).send("Access denied");
    }

    if (token.startWith("Bearer ")) {
      token = token.slice(7, token.length).trimLeft();
    }

    const verified = jwt.verify(token, "secrets");
    req.user = verified;
  } catch (err) {}
};

app.get("*", (req, res) => {
  if (!res.ok) res.redirect("/");
});

app.get("/items/", async (req, res) => {
  try {
    const itemCollections = await Item.find();
    res.status(200).json(itemCollections);
  } catch (err) {
    console.log(err);
  }
});

app.listen(3001, () => console.log("Server is started!"));

// app.get("/", (req, res) => {
//   res.send("HELLO WORLD!");
// });

// app.get("/go", (req, res) => {
//   res.send("GOOOO!!!!");
// });

// app.use(express.static("public"));
