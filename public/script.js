// ===============================
// BACKEND URL
// ===============================
const baseUrl = "https://infr3120-fall25-project-noted-backend.onrender.com";

let editTaskId = null;

// ===============================
// CHECK AUTH STATUS
// ===============================
async function checkAuth() {
  try {
    const res = await fetch(`${baseUrl}/auth/status`, {
      credentials: "include",
    });

    const data = await res.json();

    const loginLink = document.getElementById("loginLink");
    const logoutLink = document.getElementById("logoutLink");

    if (data.loggedIn) {
      // Show logout, hide login
      loginLink.style.display = "none";
      logoutLink.style.display = "inline-block";

      // Now load tasks ONLY after confirmed login
      await fetchTasks();

    } else {
      // Show login only
      logoutLink.style.display = "none";
      loginLink.style.display = "inline-block";

      // Hide planner UI
      document.querySelector(".task-form").style.display = "none";
      document.querySelector(".task-list").style.display = "none";
    }
  } catch (err) {
    console.error("Auth check error:", err);
  }
}

document.getElementById("logoutLink").addEventListener("click", async () => {
  await fetch(`${baseUrl}/auth/logout`, { credentials: "include" });
  window.location.href = "login.html"; // FULL redirect avoids state issues
});

checkAuth();

// ===============================
// UI ELEMENTS
// ===============================
const addTaskBtn = document.getElementById("addTaskBtn");
const taskFormSection = document.getElementById("taskFormSection");
const taskForm = document.getElementById("taskForm");
const taskTableBody = document.querySelector("#taskTable tbody");

// Open Create Form
addTaskBtn.addEventListener("click", () => {
  editTaskId = null;
  taskForm.reset();
  taskFormSection.classList.remove("hidden");
});

// ===============================
// LOAD TASKS
// ===============================
async function fetchTasks() {
  try {
    const res = await fetch(`${baseUrl}/api/tasks`, {
      credentials: "include",
    });

    if (res.status === 401) {
      console.warn("Not authorized.");
      return;
    }

    const tasks = await res.json();

    // Show UI since user is logged in
    document.querySelector(".task-form").style.display = "block";
    document.querySelector(".task-list").style.display = "block";

    taskTableBody.innerHTML = "";

    tasks.forEach((task) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${task.title}</td>
        <td>${task.description || "—"}</td>
        <td>${task.dueDate}</td>
        <td>
          <button onclick="startEdit('${task._id}', '${task.title}', '${task.description}', '${task.dueDate}')">✏️ Edit</button>
          <button onclick="deleteTask('${task._id}')">🗑️ Delete</button>
        </td>
      `;
      taskTableBody.appendChild(row);
    });

  } catch (err) {
    console.error("Failed to load tasks:", err);
  }
}

// ===============================
// START EDIT
// ===============================
function startEdit(id, title, description, dueDate) {
  editTaskId = id;

  document.getElementById("title").value = title;
  document.getElementById("description").value =
    description === "—" ? "" : description;
  document.getElementById("dueDate").value = dueDate;

  taskFormSection.classList.remove("hidden");
  addTaskBtn.scrollIntoView({ behavior: "smooth" });
}

// ===============================
// SUBMIT (CREATE + UPDATE)
// ===============================
taskForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("title").value.trim();
  const description = document.getElementById("description").value.trim();
  const dueDate = document.getElementById("dueDate").value;

  if (!title || !dueDate) {
    alert("Please fill in all fields.");
    return;
  }

  const payload = { title, description, dueDate };

  try {
    let res;

    if (editTaskId) {
      res = await fetch(`${baseUrl}/api/tasks/${editTaskId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      alert("Task updated!");
    } else {
      res = await fetch(`${baseUrl}/api/tasks`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      alert("Task added!");
    }

    // Hide form & refresh tasks
    taskFormSection.classList.add("hidden");
    editTaskId = null;
    taskForm.reset();
    fetchTasks();

  } catch (err) {
    console.error("Error submitting task:", err);
  }
});

// ===============================
// DELETE
// ===============================
async function deleteTask(id) {
  if (!confirm("Are you sure you want to delete this task?")) return;

  try {
    await fetch(`${baseUrl}/api/tasks/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    fetchTasks();
  } catch (err) {
    console.error("Error deleting task:", err);
  }
}
