// ===== FRONTEND SCRIPT====

//  backend API base URL (replaced with Render backend link)
const baseUrl = "https://infr3120-fall25-project-noted-backend.onrender.com";

// HTML element references
const taskForm = document.getElementById("taskForm");
const taskTableBody = document.querySelector("#taskTable tbody");

// Fetch all tasks from backend
async function fetchTasks() {
  try {
    const res = await fetch(`${baseUrl}/api/tasks`);
    const tasks = await res.json();

    // Render rows
    taskTableBody.innerHTML = tasks
      .map(
        (task) => `
        <tr>
          <td>${task.title}</td>
          <td>${task.description}</td>
          <td>${task.dueDate}</td>
          <td>
            <button onclick="deleteTask('${task._id}')">🗑️ Delete</button>
          </td>
        </tr>
      `
      )
      .join("");
  } catch (err) {
    console.error("❌ Failed to load tasks:", err);
  }
}

// Add a new task
taskForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("title").value.trim();
  const description = document.getElementById("description").value.trim();
  const dueDate = document.getElementById("dueDate").value;

  if (!title || !dueDate) return alert("Please fill all fields!");

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
      alert("⚠️ Failed to add task.");
    }
  } catch (err) {
    console.error("Error adding task:", err);
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
    if (res.ok) fetchTasks();
  } catch (err) {
    console.error("Error deleting task:", err);
  }
}

// Initial load
fetchTasks();
