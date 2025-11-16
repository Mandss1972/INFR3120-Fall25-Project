// ===== FRONTEND SCRIPT =====

const baseUrl = "https://infr3120-fall25-project-noted-backend.onrender.com";

// ===== DOM ELEMENTS =====
const taskForm = document.getElementById("taskForm");
const taskTableBody = document.querySelector("#taskTable tbody");

// ===== FETCH ALL TASKS =====
async function fetchTasks() {
  try {
    const res = await fetch(`${baseUrl}/api/tasks`);
    if (!res.ok) throw new Error("Failed to fetch tasks");

    const tasks = await res.json();

    if (!Array.isArray(tasks)) {
      console.error("Invalid data format from backend:", tasks);
      return;
    }

    // Render tasks into table rows
    taskTableBody.innerHTML = tasks
      .map(
        (task) => `
        <tr>
          <td>${task.title}</td>
          <td>${task.description || "—"}</td>
          <td>${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "—"}</td>
          <td>
            <button onclick="deleteTask('${task._id}')">🗑 Delete</button>
          </td>
        </tr>
      `
      )
      .join("");
  } catch (err) {
    console.error("⚠️ Failed to load tasks:", err);
    taskTableBody.innerHTML =
      "<tr><td colspan='4' style='color:red;'>Failed to load tasks.</td></tr>";
  }
}

// ===== ADD A NEW TASK =====
taskForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("title").value.trim();
  const description = document.getElementById("description").value.trim();
  const dueDate = document.getElementById("dueDate").value;

  if (!title || !dueDate) {
    alert("⚠️ Please fill in all required fields.");
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
      const errorMsg = await res.text();
      alert(`❌ Failed to add task: ${errorMsg}`);
    }
  } catch (err) {
    console.error("❌ Error adding task:", err);
  }
});

// ===== DELETE A TASK =====
async function deleteTask(id) {
  const confirmDelete = confirm("🗑 Are you sure you want to delete this assignment?");
  if (!confirmDelete) return;

  try {
    const res = await fetch(`${baseUrl}/api/tasks/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      fetchTasks();
    } else {
      console.error("Failed to delete task");
    }
  } catch (err) {
    console.error("❌ Error deleting task:", err);
  }
}

// ===== INITIAL LOAD =====
fetchTasks();
