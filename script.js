const addTaskBtn = document.getElementById('addTaskBtn');
const taskFormSection = document.getElementById('taskFormSection');
const cancelBtn = document.getElementById('cancelBtn');
const taskForm = document.getElementById('taskForm');
const taskTableBody = document.querySelector('#taskTable tbody');

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let editIndex = null;

addTaskBtn.addEventListener('click', () => {
  taskFormSection.classList.remove('hidden');
});

cancelBtn.addEventListener('click', () => {
  taskFormSection.classList.add('hidden');
  taskForm.reset();
  editIndex = null;
});

function renderTasks() {
  taskTableBody.innerHTML = '';
  tasks.forEach((task, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${task.title}</td>
      <td>${task.description}</td>
      <td>${task.dueDate}</td>
      <td class="actions">
        <button onclick="editTask(${index})">Edit</button>
        <button class="delete" onclick="deleteTask(${index})">Delete</button>
      </td>
    `;
    taskTableBody.appendChild(row);
  });
}

taskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const newTask = {
    title: document.getElementById('title').value,
    description: document.getElementById('description').value,
    dueDate: document.getElementById('dueDate').value
  };
  if (editIndex !== null) {
    tasks[editIndex] = newTask;
  } else {
    tasks.push(newTask);
  }
  localStorage.setItem('tasks', JSON.stringify(tasks));
  renderTasks();
  taskForm.reset();
  taskFormSection.classList.add('hidden');
  editIndex = null;
});

function editTask(index) {
  const task = tasks[index];
  document.getElementById('title').value = task.title;
  document.getElementById('description').value = task.description;
  document.getElementById('dueDate').value = task.dueDate;
  taskFormSection.classList.remove('hidden');
  editIndex = index;
}

function deleteTask(index) {
  if (confirm('Are you sure you want to delete this assignment?')) {
    tasks.splice(index, 1);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    renderTasks();
  }
}

renderTasks();