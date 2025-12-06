// ===================== IMPORTS =====================
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import bcrypt from "bcrypt";
import passport from "passport";
import GoogleStrategy from "passport-google-oauth20";
import GitHubStrategy from "passport-github2";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ===================== MIDDLEWARE =====================
app.use(express.json());

// ⭐ REQUIRED FOR COOKIES ON RENDER ⭐
app.set("trust proxy", 1);

// ===================== SESSION CONFIG =====================
app.use(
  session({
    secret: "noted-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,           // HTTPS only
      httpOnly: true,         // prevents JS access
      sameSite: "none",       // REQUIRED for cross-site cookies
    },
  })
);

// ===================== CORS CONFIG =====================
app.use(
  cors({
    origin: "https://noted-planner.netlify.app", // Your frontend
    credentials: true,
  })
);

// ===================== PASSPORT INIT =====================
app.use(passport.initialize());
app.use(passport.session());

// ===================== MONGO CONNECTION =====================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// ===================== USER SCHEMA =====================
const userSchema = new mongoose.Schema({
  email: String,
  password: String, // local-only
  googleId: String,
  githubId: String,
});
const User = mongoose.model("User", userSchema);

// ===================== TASK SCHEMA =====================
const taskSchema = new mongoose.Schema({
  title: String,
  description: String,
  dueDate: String,
  userId: String,
});
const Task = mongoose.model("Task", taskSchema);

// ===================== AUTH CHECK =====================
function ensureAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authorized" });
  }
  next();
}

// ===================== PASSPORT SERIALIZE =====================
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

// ===================== GOOGLE STRATEGY =====================
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        "https://infr3120-fall25-project-noted-backend.onrender.com/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      let user = await User.findOne({ googleId: profile.id });

      if (!user) {
        user = new User({
          email: profile.emails[0].value,
          googleId: profile.id,
        });
        await user.save();
      }

      done(null, user);
    }
  )
);

// ===================== GITHUB STRATEGY =====================
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL:
        "https://infr3120-fall25-project-noted-backend.onrender.com/auth/github/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      let user = await User.findOne({ githubId: profile.id });

      if (!user) {
        user = new User({
          email: profile.username + "@github.user",
          githubId: profile.id,
        });
        await user.save();
      }

      done(null, user);
    }
  )
);

// ===================== LOCAL AUTH ROUTES =====================
app.post("/auth/register", async (req, res) => {
  const { email, password } = req.body;

  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ error: "Email already exists" });

  const hashed = await bcrypt.hash(password, 10);

  const newUser = new User({ email, password: hashed });
  await newUser.save();

  res.json({ message: "User registered" });
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: "Invalid login" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ error: "Invalid login" });

  req.session.userId = user._id;
  res.json({ message: "Logged in" });
});

// ===================== LOGOUT =====================
app.get("/auth/logout", (req, res) => {
  req.session.destroy();
  res.json({ message: "Logged out" });
});

// ===================== LOGIN STATUS =====================
app.get("/auth/status", (req, res) => {
  res.json({ loggedIn: !!req.session.userId });
});

// ===================== GOOGLE ROUTES =====================
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["email", "profile"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "https://noted-planner.netlify.app/login.html",
  }),
  (req, res) => {
    req.session.userId = req.user._id;
    res.redirect("https://noted-planner.netlify.app/index.html");
  }
);

// ===================== GITHUB ROUTES =====================
app.get("/auth/github", passport.authenticate("github"));

app.get(
  "/auth/github/callback",
  passport.authenticate("github", {
    failureRedirect: "https://noted-planner.netlify.app/login.html",
  }),
  (req, res) => {
    req.session.userId = req.user._id;
    res.redirect("https://noted-planner.netlify.app/index.html");
  }
);

// ===================== TASK ROUTES =====================
app.get("/api/tasks", ensureAuth, async (req, res) => {
  const tasks = await Task.find({ userId: req.session.userId });
  res.json(tasks);
});

app.post("/api/tasks", ensureAuth, async (req, res) => {
  const { title, description, dueDate } = req.body;

  const task = new Task({
    title,
    description,
    dueDate,
    userId: req.session.userId,
  });

  await task.save();
  res.json(task);
});

app.put("/api/tasks/:id", ensureAuth, async (req, res) => {
  const updated = await Task.findOneAndUpdate(
    { _id: req.params.id, userId: req.session.userId },
    req.body,
    { new: true }
  );

  res.json(updated);
});

app.delete("/api/tasks/:id", ensureAuth, async (req, res) => {
  await Task.findOneAndDelete({
    _id: req.params.id,
    userId: req.session.userId,
  });

  res.sendStatus(204);
});

// ===================== SERVE STATIC FILES =====================
app.use(express.static(path.join(__dirname, "public")));

// ===================== START SERVER =====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT} (Render-ready)`)
);
