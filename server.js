// ====== IMPORTS ======
import dotenv from "dotenv";
dotenv.config();
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import bcrypt from "bcrypt";

// ====== PATH SETUP ======
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ====== MIDDLEWARE ======
app.use(express.json());
app.use(
  session({
    secret: "noted-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, 
  })
);

// Allow frontend to communicate with backend
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// ====== DATABASE CONNECTION ======
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection failed:", err));

// ====== USER SCHEMA ======
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

const User = mongoose.model("User", userSchema);

// ====== TASK SCHEMA ======
const taskSchema = new mongoose.Schema({
  title: String,
  description: String,
  dueDate: String,
  userId: String,
});
const Task = mongoose.model("Task", taskSchema);

// ===== AUTH MIDDLEWARE =====
function ensureAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authorized" });
  }
  next();
}

// ====== AUTH ROUTES ======

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

// CHECK LOGIN STATUS
app.get("/auth/status", (req, res) => {
  res.json({ loggedIn: !!req.session.userId });
});

// ===== TASK ROUTES (Protected) =====

// Get tasks
app.get("/api/tasks", ensureAuth, async (req, res) => {
  const tasks = await Task.find({ userId: req.session.userId });
  res.json(tasks);
});

// Add task
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

// UPDATE a task
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

// Delete task
app.delete("/api/tasks/:id", ensureAuth, async (req, res) => {
  await Task.findOneAndDelete({
    _id: req.params.id,
    userId: req.session.userId,
  });

  res.sendStatus(204);
});

// ====== SERVE FRONTEND ======
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ====== START SERVER ======
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

