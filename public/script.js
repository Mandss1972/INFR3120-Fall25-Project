// ===== FRONTEND SCRIPT =====

const addTaskBtn = document.getElementById("addTaskBtn");
const taskFormSection = document.getElementById("taskFormSection");

addTaskBtn.addEventListener("click", () => {
  taskFormSection.classList.toggle("hidden");
});


// Backend API base URL (Render backend link)
const baseUrl = "https://infr3120-fall25-project-noted-backend.onrender.com";

// HTML element references
const taskForm = document.getElementById("taskForm");
const taskTableBody = document.querySelector("#taskTable tbody");

// ===== Fetch all tasks from backend =====
async function fetchTasks() {
  try {
    const res = await fetch(`${baseUrl}/api/tasks`);
    const tasks = await res.json();

    // Clear the table
    taskTableBody.innerHTML = "";

    // Render tasks
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
console.log("Add Assignment button clicked — form submitted");
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
  console.log("📤 Sending POST request to:", `${baseUrl}/api/tasks`, {
    title, description, dueDate
  });
  
    const res = await fetch(`${baseUrl}/api/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, dueDate }),
    });

    if (res.ok) {
      taskForm.reset();
      fetchTasks();
    } else {
      console.error(`❌ Failed to add task: ${res.status}`);
      alert("Could not add task. Please check your connection.");
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
    const res = await fetch(`${baseUrl}/api/tasks/${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchTasks();
    } else {
      console.error(`❌ Failed to delete task: ${res.status}`);
    }
  } catch (err) {
    console.error("⚠️ Error deleting task:", err);
  }
}

// ===== Initial Load =====
fetchTasks();
