let tasks = [];
let currentFilter = "all";

const STORAGE_KEY = "creme_todo_tasks";

const input = document.getElementById("task-input");
const addBtn = document.getElementById("add-btn");
const list = document.getElementById("task-list");
const clearBtn = document.getElementById("clear-btn");
const filterBtns = document.querySelectorAll(".filter-btn");
const totalEl = document.getElementById("total-count");
const doneEl = document.getElementById("done-count");
const remainEl = document.getElementById("remaining-count");
const liveRegion = document.getElementById("live-region");

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    tasks = raw ? JSON.parse(raw) : [];
  } catch {
    tasks = [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function announce(msg) {
  liveRegion.textContent = "";
  requestAnimationFrame(() => {
    liveRegion.textContent = msg;
  });
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function addTask() {
  const text = input.value.trim();
  if (!text) {
    input.focus();
    announce("Please enter a task first.");
    input.setAttribute("aria-invalid", "true");
    setTimeout(() => input.removeAttribute("aria-invalid"), 1500);
    return;
  }
  const task = {
    id: uid(),
    text,
    completed: false,
    createdAt: Date.now(),
  };
  tasks.unshift(task);
  saveTasks();
  input.value = "";
  input.focus();
  render();
  announce(`Task added: ${text}`);
}

function toggleTask(id) {
  const t = tasks.find((t) => t.id === id);
  if (!t) return;
  t.completed = !t.completed;
  saveTasks();
  render();
  announce(
    t.completed ? `Marked complete: ${t.text}` : `Marked active: ${t.text}`,
  );
}

function deleteTask(id) {
  const t = tasks.find((t) => t.id === id);
  const el = document.querySelector(`[data-id="${id}"]`);
  if (el) {
    el.classList.add("removing");
    el.addEventListener(
      "transitionend",
      () => {
        tasks = tasks.filter((t) => t.id !== id);
        saveTasks();
        render();
      },
      { once: true },
    );
  } else {
    tasks = tasks.filter((t) => t.id !== id);
    saveTasks();
    render();
  }
  if (t) announce(`Deleted task: ${t.text}`);
}

function clearCompleted() {
  const count = tasks.filter((t) => t.completed).length;
  tasks = tasks.filter((t) => !t.completed);
  saveTasks();
  render();
  announce(`Cleared ${count} completed task${count !== 1 ? "s" : ""}.`);
}

function filtered() {
  if (currentFilter === "active") return tasks.filter((t) => !t.completed);
  if (currentFilter === "completed") return tasks.filter((t) => t.completed);
  return tasks;
}

function buildItem(task) {
  const li = document.createElement("li");
  li.className = "task-item" + (task.completed ? " completed" : "");
  li.setAttribute("data-id", task.id);

  const cbId = `cb-${task.id}`;

  li.innerHTML = `
        <div class="checkbox-wrap">
          <input
            class="task-checkbox"
            type="checkbox"
            id="${cbId}"
            ${task.completed ? "checked" : ""}
            aria-label="${task.completed ? "Mark as active" : "Mark as complete"}: ${task.text.replace(/"/g, "&quot;")}"
          />
          <div class="checkbox-visual" aria-hidden="true">
            <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
              <path d="M1 5l3.5 3.5L11 1" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
        <span class="task-text" id="text-${task.id}">${escapeHTML(task.text)}</span>
        <button
          class="delete-btn"
          aria-label="Delete task: ${task.text.replace(/"/g, "&quot;")}"
          title="Delete task"
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
            <path d="M2 2l11 11M13 2L2 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </button>
      `;

  li.querySelector(".task-checkbox").addEventListener("change", () =>
    toggleTask(task.id),
  );
  li.querySelector(".delete-btn").addEventListener("click", () =>
    deleteTask(task.id),
  );

  return li;
}

function escapeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function render() {
  const visible = filtered();

  const done = tasks.filter((t) => t.completed).length;
  const remaining = tasks.length - done;
  totalEl.textContent = tasks.length;
  doneEl.textContent = done;
  remainEl.textContent = remaining;
  clearBtn.disabled = done === 0;

  list.innerHTML = "";

  if (visible.length === 0) {
    const li = document.createElement("li");
    li.innerHTML = `
          <div class="empty-state" role="status" aria-label="No tasks to show">
            <span class="empty-icon" aria-hidden="true">${currentFilter === "completed" ? "✓" : currentFilter === "active" ? "☀︎" : ""}</span>
            <p>${
              currentFilter === "completed"
                ? "No completed tasks yet."
                : currentFilter === "active"
                  ? "All tasks are done — great job!"
                  : "Nothing here yet.<br>Add your first task above."
            }</p>
          </div>`;
    list.appendChild(li);
  } else {
    visible.forEach((t) => list.appendChild(buildItem(t)));
  }

  filterBtns.forEach((btn) => {
    const active = btn.dataset.filter === currentFilter;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-pressed", active);
  });
}

addBtn.addEventListener("click", addTask);

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addTask();
});

clearBtn.addEventListener("click", clearCompleted);

filterBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    currentFilter = btn.dataset.filter;
    render();
    announce(`Showing ${currentFilter} tasks.`);
  });
});

loadTasks();
render();
