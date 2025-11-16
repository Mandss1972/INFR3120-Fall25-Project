// ====== IMPORTS ======
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// ====== PATH SETUP ======
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ====== MIDDLEWARE ======
app.use(cors({
  origin: "*", // allow all origins for testing
  methods: ["GET", "POST", "DELETE"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json());

// ✅ Serve static files from /public
app.use(express.static(path.join(__dirname, "public")));

// ====== MONGODB CONNECTION ======
const uri = "mongodb+srv://amanda1972:Alma2024@cluster0.tythvow.mongodb.net/notedDB?retryWrites=true&w=majority";
mongoose.connect(uri)
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch(err => console.error("❌ MongoDB connection failed:", err));

// ====== SCHEMA & MODEL ======
const taskSchema = new mongoose.Schema({
  title: String,
  description: String,
  dueDate: String
});
const Task = mongoose.model("Task", taskSchema);

// ====== API ROUTES ======

// Get all tasks
app.get("/api/tasks", async (req, res) => {
  try {
    const tasks = await Task.find();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: "Server error fetching tasks" });
  }
});

// Add a new task
app.post("/api/tasks", async (req, res) => {
  try {
    const { title, description, dueDate } = req.body;
    const newTask = new Task({ title, description, dueDate });
    await newTask.save();
    res.json(newTask);
  } catch (err) {
    res.status(400).json({ message: "Error creating task" });
  }
});

// Delete a task
app.delete("/api/tasks/:id", async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.sendStatus(204);
  } catch (err) {
    res.status(400).json({ message: "Error deleting task" });
  }
});

// ====== SERVE FRONTEND ======
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ====== START SERVER ======
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
