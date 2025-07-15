// Select Date field
const dueDateInput = document.getElementById("due-date-input");

// Select input field
const taskInput = document.getElementById("task-input");

// Select Add Task button
const addTaskBtn = document.getElementById("add-task-btn");

// Select task list container
const taskList = document.getElementById("task-list");

// Listen for button click
addTaskBtn.addEventListener("click", () => {
    const taskText = taskInput.value.trim(); // Get the text
    const dueDate = dueDateInput.value; // Get due date

    if (taskText === "") {
        alert("Please enter a task!");
        return;
    }

    addTask(taskText, false, dueDate);      // Add task to DOM
    saveTaskToLocal(taskText, false, dueDate);    // Save to localStorage
    taskInput.value = "";         // Clear the input
});

// Function to create and show task in the list
function addTask(taskText, isCompleted = false, dueDate = "") {
    // Create <li> element
    const li = document.createElement("li");
    li.className = "task-item";

    li.setAttribute("draggable", "true"); // Make the <li> draggable
    li.dataset.index = taskList.children.length; // Assign index for later use

    // Create due date element
    const dateLabel = document.createElement("small");
    if (dueDate) {
        // Strip time and compare date only
        const todayDateOnly = new Date();
        todayDateOnly.setHours(0, 0, 0, 0); // Reset time

        const dueDateOnly = new Date(dueDate);
        dueDateOnly.setHours(0, 0, 0, 0); // Reset time

        if (dueDateOnly < todayDateOnly && !isCompleted) {
            dateLabel.style.color = "red"; // Overdue
        }
        else if (dueDateOnly.getTime() === todayDateOnly.getTime() && !isCompleted) {
            dateLabel.style.color = "#007bff"; // Today
        }


        dateLabel.textContent = `Due: ${dueDateOnly.toLocaleDateString()}`;
    }

    // Create <span> for task text
    const span = document.createElement("span");
    span.textContent = taskText;
    if (isCompleted) span.classList.add("completed");

    // Create Complete Button
    const completeBtn = document.createElement("button");
    completeBtn.textContent = "✔";
    completeBtn.className = "complete-btn";

    // Create Delete Button
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑";
    deleteBtn.className = "delete-btn";

    // Append elements to <li>
    li.appendChild(span);
    if (dueDate) li.appendChild(dateLabel); // Attach date
    li.appendChild(completeBtn);
    li.appendChild(deleteBtn);

    // Append <li> to task list
    taskList.appendChild(li);

    // Event: Mark as complete
    completeBtn.addEventListener("click", () => {
        span.classList.toggle("completed");
        updateLocalStorage();
    });

    // Event: Delete task
    deleteBtn.addEventListener("click", () => {
        li.classList.add("fade-out");
        li.addEventListener("animationend", () => {
            li.remove();
            updateLocalStorage();
        });
    });
}

// Re-save all current tasks to localStorage
function updateLocalStorage() {
    const allTasks = [];

    taskList.querySelectorAll("li").forEach(li => {
        const text = li.querySelector("span").textContent;
        const isDone = li.querySelector("span").classList.contains("completed");
        const dateEl = li.querySelector("small");
        const dueDate = dateEl ? dateEl.textContent.replace("Due: ", "") : "";
        // Convert "MM/DD/YYYY" to "YYYY-MM-DD" format
        const isoDate = dueDate ? new Date(dueDate).toISOString().substring(0, 10) : "";

        allTasks.push({ text, completed: isDone, dueDate: isoDate });
    });

    localStorage.setItem("tasks", JSON.stringify(allTasks));
}


// Save a task to localStorage
function saveTaskToLocal(taskText, completed = false, dueDate = "") {
    const tasks = JSON.parse(localStorage.getItem("tasks")) || []; // JS array in tasks
    tasks.push({ text: taskText, completed: false, dueDate });
    localStorage.setItem("tasks", JSON.stringify(tasks)); // Back to string, then saved
}

// Load tasks when page opens
function loadTasksFromLocal() {
    const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    tasks.forEach(task => {
        addTask(task.text, task.completed, task.dueDate);
    });
}
// Run this immediately
loadTasksFromLocal();


// Filtering tasks by status
document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const filterType = btn.getAttribute("data-filter");

        document.querySelectorAll("#task-list li").forEach(li => {
            const span = li.querySelector("span");
            const isDone = span.classList.contains("completed");

            if (filterType === "all") {
                li.style.display = "flex";
            } else if (filterType === "completed" && isDone) {
                li.style.display = "flex";
            } else if (filterType === "pending" && !isDone) {
                li.style.display = "flex";
            } else {
                li.style.display = "none";
            }
        });
    });
});


// Dark/Light Mode Toggle
const themeToggle = document.getElementById("theme-toggle");
// Load theme preference from localStorage
if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
    themeToggle.textContent = "☀️ Light Mode";
}

themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");

    const isDark = document.body.classList.contains("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");

    themeToggle.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
});

// Clear All Completed Tasks
const clearCompletedBtn = document.getElementById("clear-completed-btn");

clearCompletedBtn.addEventListener("click", () => {
    document.querySelectorAll("#task-list li").forEach(li => {
        const span = li.querySelector("span");
        if (span.classList.contains("completed")) {
            li.remove();
        }
    });
    updateLocalStorage(); // Save changes to localStorage
});



// Drag-and-Drop Reordering

let draggedItem = null;

taskList.addEventListener("dragstart", e => {
    if (e.target.tagName === "LI") {
        draggedItem = e.target;
        e.dataTransfer.effectAllowed = "move";
        setTimeout(() => {
            e.target.style.display = "none"; // Hide while dragging
        }, 0);
    }
});

taskList.addEventListener("dragend", e => {
    if (draggedItem) {
        draggedItem.style.display = "flex"; // Show it back
        draggedItem = null;
    }
});

taskList.addEventListener("dragover", e => {
    e.preventDefault(); // Allow drop
    const afterElement = getDragAfterElement(taskList, e.clientY);
    if (afterElement == null) {
        taskList.appendChild(draggedItem);
    } else {
        taskList.insertBefore(draggedItem, afterElement);
    }
});

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll("li:not(.dragging)")];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}
