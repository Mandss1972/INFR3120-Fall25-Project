import express from "express";
import mongoose from "mongoose";
import cors from "cors";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const uri = "mongodb+srv://amanda1972:D0MdYz9rSGbHLK3C@cluster0.tythvow.mongodb.net/notedDB?retryWrites=true&w=majority";

mongoose.connect(uri)
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((error) => console.error("❌ MongoDB connection failed:", error));

// Sample route
app.get("/", (req, res) => {
  res.send("Hello from Noted backend! 🚀");
});

// Start server
const PORT = 5050;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
