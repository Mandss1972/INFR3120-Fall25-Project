// ======================= IMPORTS =======================
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import bcrypt from "bcrypt";

// OAuth imports
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";

// ======================= PATH SETUP =======================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// ====== SESSION CONFIG ======
app.use(
  session({
    secret: "noted-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,       // Render uses HTTPS → MUST be true
      httpOnly: true,
      sameSite: "none",   // REQUIRED for cross-site cookies (Netlify ↔ Render)
    },
  })
);

// ====== CORS CONFIG ======
app.use(
  cors({
    origin: "https://noted-planner.netlify.app", // your Netlify domain
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true, // allow cookies to be included
  })
);


// ======================= PASSPORT INIT =======================
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

// ======================= CORS =======================
app.use(
  cors({
    origin: "https://noted-planner.netlify.app",
    credentials: true,
  })
);

// Static files for deployment
app.use(express.static(path.join(__dirname, "public")));

// ======================= DATABASE =======================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection failed:", err));

// ======================= SCHEMAS =======================
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});
const User = mongoose.model("User", userSchema);

const taskSchema = new mongoose.Schema({
  title: String,
  description: String,
  dueDate: String,
  userId: String,
});
const Task = mongoose.model("Task", taskSchema);

// ======================= AUTH MIDDLEWARE =======================
function ensureAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authorized" });
  }
  next();
}

// ======================= GOOGLE STRATEGY =======================
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;

        let user = await User.findOne({ email });
        if (!user) {
          user = new User({ email, password: "google-oauth" });
          await user.save();
        }

        return done(null, user);
      } catch (err) {
        console.error("Google Auth Error:", err);
        return done(err, null);
      }
    }
  )
);

// ======================= GITHUB STRATEGY =======================
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email =
          profile.emails?.[0]?.value ||
          `${profile.username}@githubuser.com`; // fallback if GitHub hides email

        let user = await User.findOne({ email });
        if (!user) {
          user = new User({ email, password: "github-oauth" });
          await user.save();
        }

        return done(null, user);
      } catch (err) {
        console.error("GitHub Auth Error:", err);
        return done(err, null);
      }
    }
  )
);

// ======================= OAUTH ROUTES =======================

// --- GOOGLE ---
app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login.html" }),
  (req, res) => {
    req.session.userId = req.user._id;
    res.redirect("https://noted-planner.netlify.app");
  }
);

// --- GITHUB ---
app.get("/auth/github",
  passport.authenticate("github", { scope: ["user:email"] })
);

app.get(
  "/auth/github/callback",
  passport.authenticate("github", { failureRedirect: "/login.html" }),
  (req, res) => {
    req.session.userId = req.user._id;
    res.redirect("https://noted-planner.netlify.app");
  }
);

// ======================= STANDARD AUTH =======================

// REGISTER
app.post("/auth/register", async (req, res) => {
  const { email, password } = req.body;

  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ error: "Email already exists" });

  const hashed = await bcrypt.hash(password, 10);
  const newUser = new User({ email, password: hashed });
  await newUser.save();

  res.json({ message: "User registered successfully" });
});

// LOGIN
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: "Invalid login" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ error: "Wrong password" });

  req.session.userId = user._id;
  res.json({ message: "Logged in", userId: user._id });
});

// LOGOUT
app.get("/auth/logout", (req, res) => {
  req.session.destroy();
  res.json({ message: "Logged out" });
});

// LOGIN STATUS
app.get("/auth/status", (req, res) => {
  res.json({ loggedIn: !!req.session.userId });
});

// ====== TASK ROUTES (Protected) ======

// Get all tasks
app.get("/api/tasks", ensureAuth, async (req, res) => {
  const tasks = await Task.find({ userId: req.session.userId });
  res.json(tasks);
});

app.post("/api/tasks", ensureAuth, async (req, res) => {
  const { title, description, dueDate } = req.body;

  const newTask = new Task({
    title,
    description,
    dueDate,
    userId: req.session.userId,
  });

  await newTask.save();
  res.json(newTask);
});

app.put("/api/tasks/:id", ensureAuth, async (req, res) => {
  const { title, description, dueDate } = req.body;

  const updated = await Task.findOneAndUpdate(
    { _id: req.params.id, userId: req.session.userId },
    { title, description, dueDate },
    { new: true }
  );

  if (!updated) return res.status(404).json({ error: "Task not found" });

  res.json(updated);
});

app.delete("/api/tasks/:id", ensureAuth, async (req, res) => {
  await Task.findOneAndDelete({
    _id: req.params.id,
    userId: req.session.userId,
  });

  res.sendStatus(204);
});

// ======================= SERVE FRONTEND =======================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ======================= START SERVER =======================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT} with OAuth enabled`)
);
