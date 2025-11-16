import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ====== Middleware ======
app.use(cors({
  origin: "*", // allow all origins for testing
  methods: ["GET", "POST", "DELETE"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json());
app.use(express.static("public")); // serve frontend files from /public

// ====== MongoDB Connection ======
const uri = "mongodb+srv://<amanda1972>:<7ipVMymPRAzyDp@
>@cluster0.tythvow.mongodb.net/?appName=Cluster0/notedDB";
mongoose.connect(uri)
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch(err => console.error("❌ MongoDB connection failed:", err));

// ====== Schema & Model ======
const taskSchema = new mongoose.Schema({
  title: String,
  description: String,
  dueDate: String
});
const Task = mongoose.model("Task", taskSchema);

// ====== API Routes ======

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

// ====== Serve Frontend ======
app.get("/", (req, res) => {
  res.send("Noted backend is running. Visit /public for the frontend.");
});

// ====== Start Server ======
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
