// ======== BACKEND BASE URL ========
const baseUrl = "https://infr3120-fall25-project-noted-backend.onrender.com";

let editTaskId = null; // NEW: track which task is being edited

// ======== AUTHENTICATION CHECK ========
async function checkAuth() {
  const res = await fetch(`${baseUrl}/auth/status`, { credentials: "include" });
  const data = await res.json();

  const loginLink = document.getElementById("loginLink");
  const logoutLink = document.getElementById("logoutLink");

  if (data.loggedIn) {
    loginLink.style.display = "none";
    logoutLink.style.display = "inline-block";
  } else {
    logoutLink.style.display = "none";
    loginLink.style.display = "inline-block";

    document.querySelector(".task-form").style.display = "none";
    document.querySelector(".task-list").style.display = "none";
  }
}

document.getElementById("logoutLink").addEventListener("click", async () => {
  await fetch(`${baseUrl}/auth/logout`, { credentials: "include" });
  window.location.reload();
});

async function changePassword() {
  const oldPassword = document.getElementById("oldPassword").value;
  const newPassword = document.getElementById("newPassword").value;

  const res = await fetch(`${API_BASE}/auth/change-password`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ oldPassword, newPassword }),
  });

  const data = await res.json();

  const pwStatus = document.getElementById("pwStatus");

  if (res.ok) {
    pwStatus.innerText = "Password updated successfully!";
    pwStatus.style.color = "green";
  } else {
    pwStatus.innerText = data.error;
    pwStatus.style.color = "red";
  }
}


checkAuth();


// ======== UI ELEMENTS ========
const addTaskBtn = document.getElementById("addTaskBtn");
const taskFormSection = document.getElementById("taskFormSection");
const taskForm = document.getElementById("taskForm");
const taskTableBody = document.querySelector("#taskTable tbody");

addTaskBtn.addEventListener("click", () => {
  editTaskId = null; // NEW: reset edit mode
  taskForm.reset();
  taskFormSection.classList.toggle("hidden");
});

// ======== LOAD TASKS ========
async function fetchTasks() {
  try {
    const res = await fetch(`${baseUrl}/api/tasks`, { credentials: "include" });
    if (res.status === 401) return;

    const tasks = await res.json();
    taskTableBody.innerHTML = "";

    tasks.forEach(task => {
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
    console.error("❌ Failed to load tasks:", err);
  }
}


// ======== START EDIT MODE ========
function startEdit(id, title, description, dueDate) {
  editTaskId = id;

  document.getElementById("title").value = title;
  document.getElementById("description").value = description === "—" ? "" : description;
  document.getElementById("dueDate").value = dueDate;

  taskFormSection.classList.remove("hidden");
  addTaskBtn.scrollIntoView({ behavior: "smooth" });
}


// ======== SAVE OR UPDATE TASK ========
taskForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("title").value.trim();
  const description = document.getElementById("description").value.trim();
  const dueDate = document.getElementById("dueDate").value;

  if (!title || !dueDate) {
    alert("Please fill in all fields!");
    return;
  }

  const payload = { title, description, dueDate };

  try {
    let res;

    if (editTaskId) {
      // ---- UPDATE TASK ----
      res = await fetch(`${baseUrl}/api/tasks/${editTaskId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      alert("Task updated!");

    } else {
      // ---- ADD NEW TASK ----
      res = await fetch(`${baseUrl}/api/tasks`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      alert("Task added!");
    }

    taskForm.reset();
    editTaskId = null; // clear edit mode
    fetchTasks();

  } catch (err) {
    console.error("⚠️ Error submitting task:", err);
  }
});


// ======== DELETE TASK ========
async function deleteTask(id) {
  const confirmDelete = confirm("Delete this task?");
  if (!confirmDelete) return;

  try {
    const res = await fetch(`${baseUrl}/api/tasks/${id}`, {
      method: "DELETE",
      credentials: "include"
    });

    if (res.ok) fetchTasks();

  } catch (err) {
    console.error("⚠️ Error deleting task:", err);
  }
}


// ======== INITIAL LOAD ========
fetchTasks();
