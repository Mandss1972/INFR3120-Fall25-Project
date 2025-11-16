// ======= FRONTEND SCRIPT =======

// Backend API base URL
const baseUrl = "https://infr3120-fall25-project-noted-backend.onrender.com";

// DOM element references
const taskForm = document.getElementById("taskForm");
const taskTableBody = document.querySelector("#taskTable tbody");

// Fetch and render tasks from backend
async function fetchTasks() {
  try {
    const res = await fetch(`${baseUrl}/api/tasks`);
    const tasks = await res.json();

    // Clear current table
    taskTableBody.innerHTML = "";

    // Render each task row
    tasks.forEach((task) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${task.title}</td>
        <td>${task.description}</td>
        <td>${task.dueDate}</td>
        <td><button onclick="deleteTask('${task._id}')">🗑 Delete</button></td>
      `;
      taskTableBody.appendChild(row);
    });
  } catch (err) {
    console.error("⚠️ Failed to load tasks:", err);
  }
}

// Add a new task
taskForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("title").value.trim();
  const description = document.getElementById("description").value.trim();
  const dueDate = document.getElementById("dueDate").value;

  if (!title || !description || !dueDate) {
    alert("Please fill in all fields before saving!");
    return;
  }

  try {
    const res = await fetch(`${baseUrl}/api/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, dueDate }),
    });

    if (res.ok) {
      taskForm.reset();
      fetchTasks();
    } else {
      console.error("❌ Failed to add task:", res.status);
      alert("Failed to add task. Check backend connection.");
    }
  } catch (err) {
    console.error("⚠️ Error adding task:", err);
  }
});

// Delete a task
async function deleteTask(id) {
  const confirmDelete = confirm("Are you sure you want to delete this task?");
  if (!confirmDelete) return;

  try {
    const res = await fetch(`${baseUrl}/api/tasks/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      fetchTasks();
    } else {
      console.error("❌ Failed to delete task:", res.status);
    }
  } catch (err) {
    console.error("⚠️ Error deleting task:", err);
  }
}

// Initial load
fetchTasks();