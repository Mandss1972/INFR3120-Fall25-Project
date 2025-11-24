// ===== Check Authentication Status =====
async function checkAuth() {
  const res = await fetch("/auth/status");
  const data = await res.json();

  const loginLink = document.getElementById("loginLink");
  const logoutLink = document.getElementById("logoutLink");

  if (data.loggedIn) {
    loginLink.style.display = "none";
    logoutLink.style.display = "inline-block";
  } else {
    logoutLink.style.display = "none";
    loginLink.style.display = "inline-block";

    // Hide task features when logged out
    document.querySelector(".task-form").style.display = "none";
    document.querySelector(".task-list").style.display = "none";
  }
}

// ===== Logout =====
document.getElementById("logoutLink").addEventListener("click", async () => {
  await fetch("/auth/logout");
  window.location.reload();
});

// Run auth check on startup
checkAuth();


// ===== FRONTEND SCRIPT =====

const addTaskBtn = document.getElementById("addTaskBtn");
const taskFormSection = document.getElementById("taskFormSection");

addTaskBtn.addEventListener("click", () => {
  taskFormSection.classList.toggle("hidden");
});

// Backend API base URL (local for sessions)
const baseUrl = "";

// HTML element references
const taskForm = document.getElementById("taskForm");
const taskTableBody = document.querySelector("#taskTable tbody");

// ===== Fetch all tasks from backend =====
async function fetchTasks() {
  try {
    const res = await fetch(`/api/tasks`);
    if (res.status === 401) return; // Not logged in
    const tasks = await res.json();

    taskTableBody.innerHTML = "";

    tasks.forEach(task => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${task.title}</td>
        <td>${task.description || "—"}</td>
        <td>${task.dueDate}</td>
        <td>
          <button onclick="deleteTask('${task._id}')">🗑️ Delete</button>
        </td>
      `;
      taskTableBody.appendChild(row);
    });
  } catch (err) {
    console.error("❌ Failed to load tasks:", err);
  }
}

// ===== Add a new task =====
taskForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("title").value.trim();
  const description = document.getElementById("description").value.trim();
  const dueDate = document.getElementById("dueDate").value;

  if (!title || !dueDate) {
    alert("Please fill in all fields before saving!");
    return;
  }

  try {
    const res = await fetch(`/api/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, dueDate }),
    });

    if (res.ok) {
      taskForm.reset();
      fetchTasks();
    } else {
      alert("Could not add task. Please login first.");
    }
  } catch (err) {
    console.error("⚠️ Error adding task:", err);
  }
});

// ===== Delete a task =====
async function deleteTask(id) {
  const confirmDelete = confirm("Are you sure you want to delete this task?");
  if (!confirmDelete) return;

  try {
    const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchTasks();
    } else {
      alert("Could not delete task. Please login first.");
    }
  } catch (err) {
    console.error("⚠️ Error deleting task:", err);
  }
}

// ===== Initial Load =====
fetchTasks();
