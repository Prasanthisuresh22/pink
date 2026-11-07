
const $ = (selector) => document.querySelector(selector);

const STORAGE_KEY = "studybloom_data_v1";

function loadData() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
        return {};
    }
}

let data = loadData();

data.profile ||= {};
data.profile.interests ||= [];
data.profile.favorites ||= [];
data.profile.moodboard ||= [];
data.reminders ||= {};
data.tasks ||= {};
data.notes ||= {};
data.reviews ||= {};
data.birthdays ||= [];

function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        if (typeof renderMyMonth === "function") renderMyMonth();
    } catch {
        alert("Your browser could not save the changes. Please check your browser storage.");
    }
}

function localDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatDate(date) {
    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

// Today's heading and date

function updateToday() {
    const today = new Date();
    const hour = today.getHours();

    let greeting = "Make today lovely.";

    if (hour < 12) greeting = "Good morning, beautiful.";
    else if (hour < 17) greeting = "Good afternoon, beautiful.";
    else greeting = "Good evening, beautiful.";

    $("#greetingTitle").textContent = greeting;
    $("#dateSubtitle").textContent =
        today.toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long"
        }) + " · One day at a time, one dream at a time.";

    $("#todayChip").textContent = today.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

// Profile

function renderProfile() {
    const profile = data.profile;

    $("#profileName").value = profile.name || "";
    $("#profileAbout").value = profile.about || "";
    $("#profileGoal").value = profile.goal || "";
    $("#profileColors").value = profile.colors || "";
    $("#profileMoments").value = profile.moments || "";

    const name = profile.name?.trim();

    $(".profile-label strong").textContent =
        name ? name : "My profile";

    $(".profile-label small").textContent =
        profile.goal?.trim() || "A little about me";

    $(".avatar").textContent = name ? name.charAt(0).toUpperCase() : "P";
    $("#profileDisplayName").textContent = name || "A little about me ♡";
    $("#profileBioPreview").textContent =
        profile.about?.trim() || "Your space, your story.";
    $("#profileColorsDisplay").textContent =
        profile.colors?.trim() || "Blush, cream, lavender";
    $("#profileMomentsDisplay").textContent =
        profile.moments?.trim() || "Coffee, sunsets, slow mornings";

    if (profile.photo) {
        $("#profilePhoto").src = profile.photo;
        $("#profilePhoto").classList.remove("hidden");
        $("#profileAvatar").classList.add("hidden");
    } else {
        $("#profilePhoto").classList.add("hidden");
        $("#profileAvatar").classList.remove("hidden");
    }

    renderProfileList("interests", "interestList", "interestEmpty");
    renderProfileList("favorites", "favoriteList", "favoriteEmpty");
    renderProfileMoodboard();
}

function renderProfileList(type, listId, emptyId) {
    const items = data.profile[type] || [];
    $(`#${listId}`).innerHTML = items.map((item, index) => `
        <span class="profile-chip">
            ${escapeHTML(item)}
            <button type="button" data-profile-edit="${type}" data-profile-index="${index}" aria-label="Edit ${escapeHTML(item)}">✎</button>
            <button type="button" data-profile-remove="${type}" data-profile-index="${index}" aria-label="Remove ${escapeHTML(item)}">×</button>
        </span>
    `).join("");
    $(`#${emptyId}`).classList.toggle("hidden", items.length > 0);
}

function renderProfileMoodboard() {
    const items = data.profile.moodboard || [];
    $("#moodboardGrid").innerHTML = items.map(item => `
        <article class="profile-board-item">
            ${item.image
                ? `<img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.title)}">`
                : '<div class="profile-board-placeholder" aria-hidden="true">✿</div>'}
            <div class="profile-board-caption">
                <strong>${escapeHTML(item.title)}</strong>
                <button type="button" data-profile-board-remove="${item.id}">Delete</button>
            </div>
        </article>
    `).join("");
    $("#moodboardEmpty").classList.toggle("hidden", items.length > 0);
}

$("#profileButton").addEventListener("click", () => {
    $("#profilePanel").classList.toggle("hidden");
    if (!$("#profilePanel").classList.contains("hidden")) {
        renderProfile();
        $("#profilePanel").scrollTop = 0;
    }
});

$("#closeProfile").addEventListener("click", () => {
    $("#profilePanel").classList.add("hidden");
});

$("#saveProfile").addEventListener("click", () => {
    data.profile = {
        name: $("#profileName").value.trim(),
        about: $("#profileAbout").value.trim(),
        goal: $("#profileGoal").value.trim(),
        colors: $("#profileColors").value.trim(),
        moments: $("#profileMoments").value.trim(),
        photo: data.profile.photo || "",
        interests: data.profile.interests || [],
        favorites: data.profile.favorites || [],
        moodboard: data.profile.moodboard || []
    };

    saveData();
    renderProfile();
    $("#profileSaveStatus").textContent = "Your little profile is saved. ♡";
});

$("#profilePhotoFile").addEventListener("change", event => {
    const file = event.target.files[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        alert("Please choose a JPG, PNG, or WebP image.");
        event.target.value = "";
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        alert("Please choose a profile image smaller than 5 MB.");
        event.target.value = "";
        return;
    }
    const reader = new FileReader();
    reader.onload = () => {
        data.profile.photo = reader.result;
        saveData();
        renderProfile();
        $("#profileSaveStatus").textContent = "Your profile photo is saved. ♡";
        event.target.value = "";
    };
    reader.onerror = () => alert("This image could not be read. Please try another photo.");
    reader.readAsDataURL(file);
});

function addProfileListItem(type, inputId) {
    const input = $(`#${inputId}`);
    const value = input.value.trim();
    if (!value) return;
    if ((data.profile[type] || []).some(item => item.toLowerCase() === value.toLowerCase())) {
        input.value = "";
        return;
    }
    data.profile[type] ||= [];
    data.profile[type].push(value);
    input.value = "";
    saveData();
    renderProfile();
}

$("#interestForm").addEventListener("submit", event => {
    event.preventDefault();
    addProfileListItem("interests", "interestInput");
});

$("#favoriteForm").addEventListener("submit", event => {
    event.preventDefault();
    addProfileListItem("favorites", "favoriteInput");
});

$("#profilePanel").addEventListener("click", event => {
    const editButton = event.target.closest("[data-profile-edit]");
    if (editButton) {
        const type = editButton.dataset.profileEdit;
        const index = Number(editButton.dataset.profileIndex);
        const current = data.profile[type][index];
        const updated = prompt("Update this little favourite:", current);
        if (updated?.trim()) {
            data.profile[type][index] = updated.trim();
            saveData();
            renderProfile();
        }
        return;
    }

    const removeButton = event.target.closest("[data-profile-remove]");
    if (removeButton) {
        const type = removeButton.dataset.profileRemove;
        const index = Number(removeButton.dataset.profileIndex);
        data.profile[type].splice(index, 1);
        saveData();
        renderProfile();
        return;
    }

    const boardButton = event.target.closest("[data-profile-board-remove]");
    if (boardButton) {
        data.profile.moodboard = data.profile.moodboard.filter(
            item => String(item.id) !== boardButton.dataset.profileBoardRemove
        );
        saveData();
        renderProfile();
    }
});

let pendingMoodboardImage = "";

$("#moodboardFile").addEventListener("change", event => {
    const file = event.target.files[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        alert("Please choose a JPG, PNG, or WebP image.");
        event.target.value = "";
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        alert("Please choose an image smaller than 5 MB.");
        event.target.value = "";
        return;
    }
    const reader = new FileReader();
    reader.onload = () => {
        pendingMoodboardImage = reader.result;
        $("#moodboardStatus").textContent = "Photo selected. Add it to your board when ready. ♡";
    };
    reader.onerror = () => alert("This image could not be read. Please try another photo.");
    reader.readAsDataURL(file);
});

$("#moodboardForm").addEventListener("submit", event => {
    event.preventDefault();
    const title = $("#moodboardTitle").value.trim();
    const image = pendingMoodboardImage || $("#moodboardUrl").value.trim();
    if (!title || !image) {
        $("#moodboardStatus").textContent = "Add a title and an image URL or photo.";
        return;
    }
    data.profile.moodboard.unshift({
        id: String(Date.now()),
        title,
        image,
        createdAt: new Date().toISOString()
    });
    saveData();
    renderProfile();
    event.target.reset();
    pendingMoodboardImage = "";
    $("#moodboardStatus").textContent = "A pretty little memory joined your board. ♡";
});

// Important reminders

function renderReminders() {
    const reminders = data.reminders[localDateKey()] || [];
    const list = $("#reminderList");

    list.innerHTML = reminders.map((reminder, index) => `
        <li>
            <span class="reminder-bullet">♡</span>
            <span>${escapeHTML(reminder)}</span>
            <button class="remove-button"
                    data-remove-reminder="${index}"
                    aria-label="Remove reminder">×</button>
        </li>
    `).join("");

    $("#reminderEmpty").classList.toggle("hidden", reminders.length > 0);
}

$("#reminderForm").addEventListener("submit", (event) => {
    event.preventDefault();

    const input = $("#reminderInput");
    const value = input.value.trim();

    if (!value) return;

    const key = localDateKey();
    data.reminders[key] ||= [];
    data.reminders[key].push(value);

    saveData();
    renderReminders();

    input.value = "";
    input.focus();
});

$("#reminderList").addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-reminder]");
    if (!button) return;

    const index = Number(button.dataset.removeReminder);
    const reminders = data.reminders[localDateKey()] || [];

    reminders.splice(index, 1);

    saveData();
    renderReminders();
});

// Birthday reminders

function getNextBirthday(birthday) {
    const today = new Date();
    const currentYear = today.getFullYear();
    let next = new Date(currentYear, birthday.month - 1, birthday.day);
    if (next < new Date(currentYear, today.getMonth(), today.getDate())) {
        next = new Date(currentYear + 1, birthday.month - 1, birthday.day);
    }
    return next;
}

function renderBirthdays() {
    const today = new Date();
    const birthdays = data.birthdays
        .map(birthday => ({ ...birthday, next: getNextBirthday(birthday) }))
        .sort((a, b) => a.next - b.next);
    const todaysBirthdays = birthdays.filter(birthday =>
        birthday.next.getMonth() === today.getMonth() &&
        birthday.next.getDate() === today.getDate()
    );

    $("#birthdayTodayHeading").textContent = todaysBirthdays.length
        ? `Today is ${todaysBirthdays.map(birthday => birthday.name).join(" and ")}'s day ♡`
        : "Your birthday reminders";
    $("#birthdayCount").textContent = birthdays.length ? `${birthdays.length} saved` : "";
    $("#birthdayList").innerHTML = birthdays.map(birthday => {
        const isToday = birthday.next.getMonth() === today.getMonth() &&
            birthday.next.getDate() === today.getDate();
        const dateLabel = birthday.next.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long"
        });
        return `
            <article class="birthday-item ${isToday ? "birthday-today" : ""}">
                <span class="birthday-emoji">${isToday ? "🎉" : "🎈"}</span>
                <div>
                    <strong>${escapeHTML(birthday.name)}</strong>
                    <p>${isToday ? "Today — send a little love!" : dateLabel}</p>
                </div>
                <button class="remove-button" type="button" data-remove-birthday="${birthday.id}" aria-label="Remove ${escapeHTML(birthday.name)}">×</button>
            </article>
        `;
    }).join("");
    $("#birthdayEmpty").classList.toggle("hidden", birthdays.length > 0);
}

$("#birthdayForm").addEventListener("submit", event => {
    event.preventDefault();
    const name = $("#birthdayName").value.trim();
    const date = $("#birthdayDate").value;
    if (!name || !date) return;

    const birthdayDate = new Date(`${date}T12:00:00`);
    if (Number.isNaN(birthdayDate.getTime())) {
        $("#birthdayStatus").textContent = "Please choose a valid birthday.";
        return;
    }

    data.birthdays.push({
        id: String(Date.now()),
        name,
        month: birthdayDate.getMonth() + 1,
        day: birthdayDate.getDate()
    });
    saveData();
    renderBirthdays();
    event.target.reset();
    $("#birthdayStatus").textContent = `${name}'s birthday is saved. ♡`;
});

$("#birthdayList").addEventListener("click", event => {
    const button = event.target.closest("[data-remove-birthday]");
    if (!button) return;
    data.birthdays = data.birthdays.filter(birthday => birthday.id !== button.dataset.removeBirthday);
    saveData();
    renderBirthdays();
});

// Today's tasks

function getTodayTasks() {
    return data.tasks[localDateKey()] || [];
}

function renderTasks() {
    const tasks = getTodayTasks();
    const completed = tasks.filter(task => task.done).length;
    const percentage = tasks.length
        ? Math.round((completed / tasks.length) * 100)
        : 0;

    $("#taskCount").textContent =
        `${completed} of ${tasks.length} tasks completed`;

    $("#progressPercent").textContent = `${percentage}%`;
    $("#progressFill").style.width = `${percentage}%`;

    $("#taskList").innerHTML = tasks.map((task, index) => `
        <div class="task-item ${task.done ? "completed" : ""}">
            <input type="checkbox"
                   data-task-check="${index}"
                   aria-label="Mark ${escapeHTML(task.title)} as complete"
                   ${task.done ? "checked" : ""}>

            <span class="task-title">${escapeHTML(task.title)}</span>

            <button class="remove-button"
                    data-task-remove="${index}"
                    aria-label="Delete task">×</button>
        </div>
    `).join("");

    $("#taskEmpty").classList.toggle("hidden", tasks.length > 0);
}

$("#taskForm").addEventListener("submit", (event) => {
    event.preventDefault();

    const input = $("#taskInput");
    const title = input.value.trim();

    if (!title) return;

    const key = localDateKey();
    data.tasks[key] ||= [];
    data.tasks[key].push({
        title,
        done: false
    });

    saveData();
    renderTasks();

    input.value = "";
    input.focus();
});

$("#taskList").addEventListener("change", (event) => {
    const checkbox = event.target.closest("[data-task-check]");
    if (!checkbox) return;

    const tasks = getTodayTasks();
    const index = Number(checkbox.dataset.taskCheck);

    if (!tasks[index]) return;

    tasks[index].done = checkbox.checked;

    saveData();
    renderTasks();
});

$("#taskList").addEventListener("click", (event) => {
    const button = event.target.closest("[data-task-remove]");
    if (!button) return;

    const index = Number(button.dataset.taskRemove);
    const tasks = getTodayTasks();

    tasks.splice(index, 1);

    saveData();
    renderTasks();
});

// Calendar

let displayedMonth = new Date();
displayedMonth.setDate(1);

let selectedDate = localDateKey();

function renderCalendar() {
    const year = displayedMonth.getFullYear();
    const month = displayedMonth.getMonth();

    const todayKey = localDateKey();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    $("#monthTitle").textContent =
        displayedMonth.toLocaleDateString("en-IN", {
            month: "long",
            year: "numeric"
        });

    let html = "";

    for (let i = 0; i < firstDay; i++) {
        html += `<span class="calendar-day outside" aria-hidden="true"></span>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const key = localDateKey(date);

        const isToday = key === todayKey;
        const isSelected = key === selectedDate;
        const hasNote = Boolean(data.notes[key]?.trim());

        const classes = [
            "calendar-day",
            isToday ? "today" : "",
            isSelected ? "selected" : "",
            hasNote ? "has-note" : ""
        ].filter(Boolean).join(" ");

        html += `
            <button class="${classes}"
                    data-date="${key}"
                    aria-label="${formatDate(date)}${hasNote ? ", has a note" : ""}"
                    ${isSelected ? 'aria-pressed="true"' : 'aria-pressed="false"'}>
                ${day}
            </button>
        `;
    }

    $("#calendarGrid").innerHTML = html;
    renderSelectedNote();
}

function renderSelectedNote() {
    const date = new Date(`${selectedDate}T12:00:00`);

    $("#selectedDateTitle").textContent = formatDate(date);
    $("#selectedDateHint").textContent =
        selectedDate === localDateKey()
            ? "Today is yours. Make it count. ♡"
            : "Save a little reminder for this day.";

    $("#calendarNote").value = data.notes[selectedDate] || "";
}

$("#calendarGrid").addEventListener("click", (event) => {
    const button = event.target.closest("[data-date]");
    if (!button) return;

    selectedDate = button.dataset.date;
    renderCalendar();
});

$("#prevMonth").addEventListener("click", () => {
    displayedMonth = new Date(
        displayedMonth.getFullYear(),
        displayedMonth.getMonth() - 1,
        1
    );

    renderCalendar();
    renderHabits();
});

$("#nextMonth").addEventListener("click", () => {
    displayedMonth = new Date(
        displayedMonth.getFullYear(),
        displayedMonth.getMonth() + 1,
        1
    );

    renderCalendar();
    renderHabits();
});

$("#saveNote").addEventListener("click", () => {
    const note = $("#calendarNote").value.trim();

    if (note) {
        data.notes[selectedDate] = note;
    } else {
        delete data.notes[selectedDate];
    }

    saveData();
    renderCalendar();
});

$("#deleteNote").addEventListener("click", () => {
    delete data.notes[selectedDate];

    saveData();
    renderCalendar();
});

// Daily review

function renderReview() {
    const review = data.reviews[localDateKey()] || {};

    $("#dayMood").value = review.mood || "";
    $("#dayReflection").value = review.reflection || "";
    $("#dayTomorrow").value = review.tomorrow || "";
    $("#reviewStatus").textContent = review.saved
        ? "Your reflection is saved for today. ♡"
        : "";
}

$("#reviewButton").addEventListener("click", () => {
    renderReview();
    $("#reviewModal").classList.remove("hidden");
});

$("#closeReview").addEventListener("click", () => {
    $("#reviewModal").classList.add("hidden");
});

$("#reviewModal").addEventListener("click", (event) => {
    if (event.target === $("#reviewModal")) {
        $("#reviewModal").classList.add("hidden");
    }
});

$("#saveReview").addEventListener("click", () => {
    data.reviews[localDateKey()] = {
        mood: $("#dayMood").value,
        reflection: $("#dayReflection").value.trim(),
        tomorrow: $("#dayTomorrow").value.trim(),
        saved: true
    };

    saveData();

    $("#reviewStatus").textContent = "Your day, your thoughts, saved with love. ♡";
});

// Initialize the website

function initializeStudyBloom() {
    updateToday();
    renderProfile();
    renderReminders();
    renderTasks();
    renderCalendar();
}

initializeStudyBloom();

/* WATER TRACKER */

data.water ||= {};

const WATER_GOAL = 8;

function getWaterCount() {
    return data.water[localDateKey()] || 0;
}

function renderWater() {
    const count = getWaterCount();

    $("#waterCount").textContent = `${count} / ${WATER_GOAL}`;

    $("#waterGlasses").innerHTML = Array.from(
        { length: WATER_GOAL },
        (_, index) => `
            <button type="button"
                class="water-glass ${index < count ? "filled" : ""}"
                aria-label="Glass ${index + 1}${index < count ? ", completed" : ""}"
                title="Glass ${index + 1}">
                ${index < count ? "💧" : "♡"}
            </button>
        `
    ).join("");

    $("#waterMessage").textContent =
        count >= WATER_GOAL
            ? "Lovely! You've reached your personal water goal. 💗"
            : `${WATER_GOAL - count} more glasses to reach your daily goal. Take it at your own pace. ♡`;
}

$("#addWater").addEventListener("click", () => {
    data.water[localDateKey()] = Math.min(
        WATER_GOAL,
        getWaterCount() + 1
    );

    saveData();
    renderWater();
});

$("#resetWater").addEventListener("click", () => {
    data.water[localDateKey()] = 0;
    saveData();
    renderWater();
});

/* DAILY MOOD TRACKER */

data.moods ||= {};

const MOODS = {
    happy: { emoji: "😊", label: "Happy" },
    okay: { emoji: "😌", label: "Okay" },
    sad: { emoji: "😔", label: "Sad" },
    stressed: { emoji: "🥹", label: "Overwhelmed" },
    excited: { emoji: "🤩", label: "Excited" }
};

function renderMood() {
    const mood = data.moods[localDateKey()];

    document.querySelectorAll(".mood-option").forEach(button => {
        const selected = button.dataset.mood === mood;
        button.classList.toggle("selected", selected);
        button.setAttribute("aria-pressed", String(selected));
    });

    $("#moodFeedback").textContent = mood
        ? `Today, you feel ${MOODS[mood].label.toLowerCase()}. Thanks for checking in with yourself. ♡`
        : "Every feeling is welcome here. Choose one emoji for today. ♡";

    renderMoodStats();
}

$("#moodOptions").addEventListener("click", event => {
    const button = event.target.closest("[data-mood]");
    if (!button) return;

    data.moods[localDateKey()] = button.dataset.mood;

    saveData();
    renderMood();
    renderCalendar();
});

function renderMoodStats() {
    const year = displayedMonth.getFullYear();
    const month = displayedMonth.getMonth();

    const counts = {};

    Object.entries(data.moods).forEach(([dateKey, mood]) => {
        const date = new Date(`${dateKey}T12:00:00`);

        if (
            date.getFullYear() === year &&
            date.getMonth() === month &&
            MOODS[mood]
        ) {
            counts[mood] = (counts[mood] || 0) + 1;
        }
    });

    const stats = Object.entries(MOODS)
        .filter(([mood]) => counts[mood])
        .map(([mood, details]) => `
            <div class="mood-stat">
                <span>${details.emoji}</span>
                <span>${details.label}</span>
                <strong>${counts[mood]} ${counts[mood] === 1 ? "day" : "days"}</strong>
            </div>
        `);

    $("#moodStats").innerHTML = stats.length
        ? stats.join("")
        : '<p class="muted">Your mood story for this month will appear here. ♡</p>';
}

/* CALENDAR MOOD EMOJIS */

const originalRenderCalendar = renderCalendar;

renderCalendar = function () {
    originalRenderCalendar();

    document.querySelectorAll("#calendarGrid [data-date]").forEach(button => {
        const mood = data.moods[button.dataset.date];

        if (mood && MOODS[mood]) {
            const symbol = document.createElement("span");
            symbol.className = "mood-symbol";
            symbol.textContent = MOODS[mood].emoji;
            button.appendChild(symbol);
        }
    });

    renderMoodStats();
};

/* DAILY THOUGHTS */

data.thoughts ||= {};

function renderThought() {
    $("#dailyThought").value =
        data.thoughts[localDateKey()] || "";

    $("#thoughtStatus").textContent = "";
}

$("#saveThought").addEventListener("click", () => {
    const thought = $("#dailyThought").value.trim();
    const key = localDateKey();

    if (thought) {
        data.thoughts[key] = thought;
    } else {
        delete data.thoughts[key];
    }

    saveData();
    $("#thoughtStatus").textContent =
        "Your little thoughts are saved. ♡";
});

/* SHOW OR HIDE PRIVATE JOURNAL */

const toggleThought = document.querySelector("#toggleThought");
const thoughtContent = document.querySelector("#thoughtContent");

toggleThought.addEventListener("click", () => {
    const isHidden = thoughtContent.classList.contains("hidden");

    thoughtContent.classList.toggle("hidden");

    toggleThought.textContent = isHidden
        ? "🔓 Close my private journal"
        : "🔒 Open my private journal";
});

renderThought();

/* OPTIONAL DAILY PHOTO MEMORY */

data.memories ||= {};

let pendingMemory = null;

function showMemoryPreview(imageData) {
    $("#memoryPhoto").src = imageData;
    $("#memoryPreview").classList.remove("hidden");
}

function renderMemory() {
    pendingMemory = null;

    const savedImage = data.memories[localDateKey()];

    if (savedImage) {
        showMemoryPreview(savedImage);
    } else {
        $("#memoryPreview").classList.add("hidden");
        $("#memoryPhoto").removeAttribute("src");
    }

    $("#memoryImage").value = "";
    $("#memoryStatus").textContent = "";
}

$("#memoryImage").addEventListener("change", event => {
    const file = event.target.files[0];

    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        alert("Please choose a JPG, PNG, or WebP image.");
        event.target.value = "";
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        alert("Please choose an image smaller than 10 MB.");
        event.target.value = "";
        return;
    }

    const reader = new FileReader();

    reader.onload = () => {
        const image = new Image();

        image.onload = () => {
            const maxDimension = 900;
            const scale = Math.min(
                1,
                maxDimension / Math.max(image.width, image.height)
            );

            const canvas = document.createElement("canvas");
            canvas.width = Math.round(image.width * scale);
            canvas.height = Math.round(image.height * scale);

            const context = canvas.getContext("2d");
            context.drawImage(image, 0, 0, canvas.width, canvas.height);

            pendingMemory = canvas.toDataURL("image/jpeg", 0.78);

            showMemoryPreview(pendingMemory);
            $("#memoryStatus").textContent =
                "Photo selected! Save it to keep this memory. ♡";
        };

        image.onerror = () => {
            alert("This image could not be opened. Please try another photo.");
        };

        image.src = reader.result;
    };

    reader.readAsDataURL(file);
});

$("#saveMemory").addEventListener("click", () => {
    const key = localDateKey();

    if (pendingMemory) {
        data.memories[key] = pendingMemory;
    }

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

        $("#memoryStatus").textContent =
            data.memories[key]
                ? "A little memory saved with love. ♡"
                : "No photo selected. That's perfectly okay. ♡";
    } catch {
        alert("Your browser storage is full. Try removing an older photo.");
    }
});

$("#removeMemory").addEventListener("click", () => {
    pendingMemory = null;
    delete data.memories[localDateKey()];

    saveData();
    renderMemory();
    $("#memoryStatus").textContent = "Photo removed.";
});

/* INITIALIZE THE NEW FEATURES */

renderWater();
renderMood();
renderThought();
renderMemory();

/* DAILY INSPIRATION */

const inspirationQuotes = [
    "You don't have to have it all figured out. Just take the next little step. ♡",
    "Little progress is still progress. 🌷",
    "You deserve the same kindness you give to others. 💗",
    "Your pace is valid. Keep growing in your own time. 🌸",
    "A fresh day is another chance to begin again. ✨",
    "You are allowed to rest without feeling guilty. 🩷",
    "Believe in the little things you do every day. 🌼",
    "You are becoming the person you dream of being. ♡",
    "Done is better than perfect. Start where you are. 🌷",
    "Make room for things that make your heart happy. 💕"
];

const quoteElement = document.querySelector("#inspirationQuote");
const quoteButton = document.querySelector("#newQuoteButton");

quoteButton.addEventListener("click", () => {
    const currentQuote = quoteElement.textContent.trim();

    const availableQuotes = inspirationQuotes.filter(
        quote => quote !== currentQuote
    );

    const randomIndex = Math.floor(
        Math.random() * availableQuotes.length
    );

    quoteElement.textContent = availableQuotes[randomIndex];
});

const homepageDailyQuotes = [
    "Be gentle with the person you are becoming.",
    "Your softness is a quiet kind of strength.",
    "You are allowed to take up beautiful space.",
    "Small steps still carry you forward.",
    "Let your own pace be enough today.",
    "There is no rush to bloom all at once.",
    "You make ordinary moments feel special.",
    "Trust the little voice that says keep going.",
    "Rest is part of the journey, not a detour.",
    "You deserve a life that feels like home.",
    "Your dreams are worth making room for.",
    "A calm heart can hold a hopeful dream.",
    "You are more capable than yesterday's doubt.",
    "Celebrate the progress only you can see.",
    "Kindness toward yourself changes everything.",
    "Let today be light, lovely, and yours.",
    "You do not need permission to begin again.",
    "Your happiness can be made of tiny things.",
    "Keep the promises you make to your own heart.",
    "You are growing in ways that cannot be hurried.",
    "A little courage is enough for the next step.",
    "Your presence is already a gift.",
    "Choose peace wherever you can find it.",
    "You can be a work in progress and still wonderful.",
    "There is beauty in the way you keep trying.",
    "Make space for what makes you feel alive.",
    "You are worthy on productive days and quiet ones.",
    "Let your hopes be bigger than your fears.",
    "Every new morning carries a small beginning.",
    "You have permission to change your mind and grow.",
    "Notice one lovely thing, then let it stay with you.",
    "You are not behind; you are on your own path.",
    "Your best can look different each day.",
    "Keep choosing the life that feels honest.",
    "A peaceful life is a beautiful achievement.",
    "You bring your own kind of light.",
    "The little things are not little when they make you happy.",
    "Your heart knows how to find its way home.",
    "You can start softly and still go far.",
    "Dreams grow well when cared for patiently.",
    "You are becoming someone your younger self would love.",
    "Let joy arrive without needing to earn it.",
    "You are brave for trying again.",
    "A quiet win is still a win.",
    "Your story is allowed to unfold slowly.",
    "Take the next kind step, not every step at once.",
    "You deserve moments that ask nothing from you.",
    "Confidence can begin with one small yes.",
    "You are enough before you accomplish anything.",
    "Keep a little wonder in your day.",
    "Your life does not have to look like anyone else's.",
    "There is strength in choosing what brings you peace.",
    "Let your heart be curious about what comes next.",
    "You are allowed to be proud of yourself.",
    "A fresh chapter can start with one gentle choice.",
    "Your effort matters, even when the result is still growing.",
    "You can hold both hope and uncertainty.",
    "Make today a place where you can breathe.",
    "The way you care is one of your superpowers.",
    "You are closer than you think.",
    "Little rituals can make a life feel beautiful.",
    "Let yourself enjoy the good while it is here.",
    "Your future self is cheering for today's small effort.",
    "You do not have to shine loudly to be radiant.",
    "Every season of you deserves tenderness.",
    "There is magic in showing up for yourself.",
    "You are learning, and that is a lovely thing.",
    "A soft heart can still have strong boundaries.",
    "Keep your dreams close, but let them breathe.",
    "Today is not a test; it is a moment to live.",
    "You are creating beauty with every thoughtful choice.",
    "Your calm is worth protecting.",
    "Begin where you are, with what you have.",
    "You can make room for more joy.",
    "The smallest spark can guide a whole beginning.",
    "You are deserving of the care you give away.",
    "Let progress be personal, not perfect.",
    "Your courage may look like simply continuing.",
    "There is no wrong way to grow.",
    "You make the world warmer by being yourself.",
    "A dream becomes possible when you give it a day.",
    "Be proud of every time you chose yourself.",
    "You can pause without losing your place.",
    "The quiet days are making you strong too.",
    "Your life is filled with more possibilities than you can see.",
    "Keep a gentle promise to yourself today.",
    "You are allowed to want beautiful things.",
    "Hope is a small light that knows how to stay.",
    "Let your happiness be wonderfully ordinary.",
    "You have already survived every difficult day before this one.",
    "A little patience can make room for a lot of growth.",
    "You are not too much; you are fully here.",
    "Choose the thought that helps you take one more step.",
    "Your dreams do not need to be explained to be real.",
    "There is something lovely about beginning again.",
    "You are building a life from many meaningful little choices.",
    "Let today meet you gently.",
    "Your kindness to yourself is never wasted.",
    "You are becoming, and becoming is beautiful.",
    "Keep going; your small light is enough."
];

function renderHomepageDailyQuote() {
    const [year, month, day] = localDateKey().split("-").map(Number);
    const dayNumber = Math.floor(Date.UTC(year, month - 1, day) / 86400000);
    const quote = homepageDailyQuotes[((dayNumber % homepageDailyQuotes.length) + homepageDailyQuotes.length) % homepageDailyQuotes.length];
    $("#homepageDailyQuote").textContent = quote;
}

function scheduleHomepageQuoteRefresh() {
    const now = new Date();
    const nextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    window.setTimeout(() => {
        renderHomepageDailyQuote();
        scheduleHomepageQuoteRefresh();
    }, Math.max(1000, nextDay.getTime() - now.getTime() + 100));
}

renderHomepageDailyQuote();
scheduleHomepageQuoteRefresh();

/* HAPPINESS WALL */

data.happinessWall ||= [];
let happinessImage = "";

function readFeatureImage(file, callback) {
    if (!file) {
        callback("");
        return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        alert("Please choose a JPG, PNG, or WebP image.");
        callback(null);
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        alert("Please choose an image smaller than 5 MB.");
        callback(null);
        return;
    }

    const reader = new FileReader();
    reader.onload = () => callback(reader.result);
    reader.onerror = () => {
        alert("This image could not be read. Please try another photo.");
        callback(null);
    };
    reader.readAsDataURL(file);
}

$("#happinessImage").addEventListener("change", event => {
    readFeatureImage(event.target.files[0], imageData => {
        happinessImage = imageData || "";
    });
});

function renderHappinessWall() {
    const grid = $("#happinessGrid");
    grid.innerHTML = data.happinessWall.map(item => `
        <article class="happiness-item">
            ${item.image ? `<img src="${item.image}" alt="">` : '<div class="happiness-placeholder">♡</div>'}
            <div class="happiness-item-content">
                <h3>${escapeHTML(item.title)}</h3>
                ${item.description ? `<p>${escapeHTML(item.description)}</p>` : ""}
                <button class="remove-button" type="button" data-remove-happiness="${item.id}">Delete ×</button>
            </div>
        </article>
    `).join("");
    $("#happinessEmpty").classList.toggle("hidden", data.happinessWall.length > 0);
}

$("#happinessForm").addEventListener("submit", event => {
    event.preventDefault();
    data.happinessWall.unshift({
        id: Date.now(),
        createdAt: new Date().toISOString(),
        title: $("#happinessTitle").value.trim(),
        description: $("#happinessDescription").value.trim(),
        image: happinessImage
    });
    saveData();
    renderHappinessWall();
    event.target.reset();
    happinessImage = "";
    $("#happinessStatus").textContent = "A happy little moment was added. ♡";
});

$("#happinessGrid").addEventListener("click", event => {
    const button = event.target.closest("[data-remove-happiness]");
    if (!button) return;
    data.happinessWall = data.happinessWall.filter(
        item => String(item.id) !== button.dataset.removeHappiness
    );
    saveData();
    renderHappinessWall();
});

/* STUDY FOCUS TIMER */

data.focus ||= {};
const STUDY_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;
let timerSeconds = STUDY_SECONDS;
let timerMode = "study";
let timerInterval = null;

function getFocusToday() {
    const key = localDateKey();
    data.focus[key] ||= { minutes: 0, sessions: 0 };
    return data.focus[key];
}

function renderFocusTimer() {
    const minutes = Math.floor(timerSeconds / 60);
    const seconds = timerSeconds % 60;
    $("#timerDisplay").textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    $("#focusMode").textContent = timerMode === "study" ? "Study time" : "Break time";

    const focus = getFocusToday();
    $("#focusMinutes").textContent = `${focus.minutes} min`;
    $("#focusSessions").textContent =
        `${focus.sessions} completed ${focus.sessions === 1 ? "session" : "sessions"}`;
}

function finishTimerPhase() {
    if (timerMode === "study") {
        const focus = getFocusToday();
        focus.minutes += 25;
        focus.sessions += 1;
        saveData();
        $("#timerStatus").textContent = "Focus session complete. Time for a little break! ♡";
        timerMode = "break";
        timerSeconds = BREAK_SECONDS;
    } else {
        $("#timerStatus").textContent = "Break complete. Ready for another little focus moment? ♡";
        timerMode = "study";
        timerSeconds = STUDY_SECONDS;
    }
    renderFocusTimer();
}

$("#startTimer").addEventListener("click", () => {
    if (timerInterval) return;
    $("#timerStatus").textContent = "";
    timerInterval = setInterval(() => {
        timerSeconds -= 1;
        if (timerSeconds <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            finishTimerPhase();
            return;
        }
        renderFocusTimer();
    }, 1000);
});

$("#pauseTimer").addEventListener("click", () => {
    clearInterval(timerInterval);
    timerInterval = null;
    $("#timerStatus").textContent = "Timer paused. Come back when you're ready. ♡";
});

$("#resetTimer").addEventListener("click", () => {
    clearInterval(timerInterval);
    timerInterval = null;
    timerMode = "study";
    timerSeconds = STUDY_SECONDS;
    $("#timerStatus").textContent = "";
    renderFocusTimer();
});

/* HABIT TRACKER */

data.habits ||= [];

function habitCompletionStats(habit) {
    const year = displayedMonth.getFullYear();
    const month = displayedMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const completed = Object.keys(habit.completions).filter(dateKey => {
        const date = new Date(`${dateKey}T12:00:00`);
        return date.getFullYear() === year &&
            date.getMonth() === month &&
            habit.completions[dateKey];
    }).length;
    return { completed, daysInMonth };
}

function getHabitStreak(habit) {
    let streak = 0;
    const date = new Date();
    while (habit.completions[localDateKey(date)]) {
        streak += 1;
        date.setDate(date.getDate() - 1);
    }
    return streak;
}

function renderHabits() {
    const today = localDateKey();
    $("#habitList").innerHTML = data.habits.map(habit => {
        const stats = habitCompletionStats(habit);
        const percentage = Math.round((stats.completed / stats.daysInMonth) * 100);
        return `
            <div class="habit-row">
                <label>
                    <input type="checkbox" data-habit-check="${habit.id}"
                        ${habit.completions[today] ? "checked" : ""}>
                    <span>${escapeHTML(habit.name)}</span>
                </label>
                <span class="habit-meta">${getHabitStreak(habit)} day streak · ${percentage}%</span>
                <button class="remove-button" type="button" data-remove-habit="${habit.id}">×</button>
            </div>
        `;
    }).join("");
    $("#habitEmpty").classList.toggle("hidden", data.habits.length > 0);
    renderHabitHeatmap();
}

function renderHabitHeatmap() {
    const year = displayedMonth.getFullYear();
    const month = displayedMonth.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    $("#habitMonthTitle").textContent = displayedMonth.toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric"
    }).toUpperCase();
    $("#habitHeatmap").innerHTML = Array.from({ length: days }, (_, index) => {
        const date = new Date(year, month, index + 1);
        const key = localDateKey(date);
        const count = data.habits.filter(habit => habit.completions[key]).length;
        const level = count ? Math.min(4, Math.ceil((count / data.habits.length) * 4)) : 0;
        return `<span class="habit-day level-${level}" title="${key}: ${count} completed">${index + 1}</span>`;
    }).join("");
}

$("#habitForm").addEventListener("submit", event => {
    event.preventDefault();
    data.habits.push({
        id: Date.now(),
        name: $("#habitInput").value.trim(),
        completions: {}
    });
    saveData();
    renderHabits();
    event.target.reset();
});

$("#habitList").addEventListener("change", event => {
    const checkbox = event.target.closest("[data-habit-check]");
    if (!checkbox) return;
    const habit = data.habits.find(item => String(item.id) === checkbox.dataset.habitCheck);
    if (!habit) return;
    const key = localDateKey();
    if (checkbox.checked) habit.completions[key] = true;
    else delete habit.completions[key];
    saveData();
    renderHabits();
});

$("#habitList").addEventListener("click", event => {
    const button = event.target.closest("[data-remove-habit]");
    if (!button) return;
    data.habits = data.habits.filter(item => String(item.id) !== button.dataset.removeHabit);
    saveData();
    renderHabits();
});

/* CURRENTLY LOVING */

data.loving ||= {
    books: [], movies: [], songs: [], recipes: [], places: []
};
let activeCollection = "books";
let lovingImage = "";

$("#lovingImage").addEventListener("change", event => {
    readFeatureImage(event.target.files[0], imageData => {
        lovingImage = imageData || "";
    });
});

function renderLoving() {
    const items = data.loving[activeCollection] || [];
    $("#lovingGrid").innerHTML = items.map(item => `
        <article class="loving-item ${item.favorite ? "is-favorite" : ""}">
            ${item.image ? `<img src="${item.image}" alt="">` : '<div class="loving-placeholder">♡</div>'}
            <div class="loving-item-content">
                <h3>${escapeHTML(item.title)}</h3>
                ${item.note ? `<p>${escapeHTML(item.note)}</p>` : ""}
                <div class="loving-item-actions">
                    <button type="button" data-favorite-loving="${item.id}">
                        ${item.favorite ? "♥ Loved" : "♡ Favorite"}
                    </button>
                    <button type="button" data-complete-loving="${item.id}">
                        ${item.completed ? "✓ Completed" : "Mark complete"}
                    </button>
                    <button type="button" data-remove-loving="${item.id}">Delete</button>
                </div>
            </div>
        </article>
    `).join("");
    $("#lovingEmpty").classList.toggle("hidden", items.length > 0);
}

$("#collectionTabs").addEventListener("click", event => {
    const tab = event.target.closest("[data-collection]");
    if (!tab) return;
    activeCollection = tab.dataset.collection;
    document.querySelectorAll(".collection-tab").forEach(button => {
        button.classList.toggle("active", button === tab);
    });
    renderLoving();
});

$("#lovingForm").addEventListener("submit", event => {
    event.preventDefault();
    data.loving[activeCollection].unshift({
        id: Date.now(),
        createdAt: new Date().toISOString(),
        title: $("#lovingTitle").value.trim(),
        note: $("#lovingNote").value.trim(),
        image: lovingImage,
        favorite: false,
        completed: false
    });
    saveData();
    renderLoving();
    event.target.reset();
    lovingImage = "";
});

$("#lovingGrid").addEventListener("click", event => {
    const button = event.target.closest("button[data-favorite-loving], button[data-complete-loving], button[data-remove-loving]");
    if (!button) return;
    const items = data.loving[activeCollection];
    const item = items.find(entry => String(entry.id) === (
        button.dataset.favoriteLoving ||
        button.dataset.completeLoving ||
        button.dataset.removeLoving
    ));
    if (!item) return;
    if (button.dataset.favoriteLoving) item.favorite = !item.favorite;
    else if (button.dataset.completeLoving) item.completed = !item.completed;
    else data.loving[activeCollection] = items.filter(entry => entry !== item);
    saveData();
    renderLoving();
});

/* INITIALIZE DASHBOARD ADDITIONS */

renderHappinessWall();
renderFocusTimer();
renderHabits();
renderLoving();

/* PERIOD TRACKER
   Kept in separate localStorage keys so it never changes the existing app data. */

const PERIOD_RECORDS_KEY = "beautiful_period_tracker_records_v1";
const PERIOD_SETTINGS_KEY = "beautiful_period_tracker_settings_v1";
const PERIOD_CHECKINS_KEY = "beautiful_period_tracker_checkins_v1";

const periodTracker = {
    records: readPeriodStorage(PERIOD_RECORDS_KEY, []),
    settings: readPeriodStorage(PERIOD_SETTINGS_KEY, { cycleLength: 28, periodDuration: 5 }),
    checkIns: readPeriodStorage(PERIOD_CHECKINS_KEY, {})
};

let trackerMonth = new Date();
trackerMonth.setDate(1);
let trackerSelectedDate = localDateKey();
let editingPeriodId = null;

function readPeriodStorage(key, fallback) {
    try {
        const value = JSON.parse(localStorage.getItem(key));
        return value ?? fallback;
    } catch {
        return fallback;
    }
}

function trackerDate(dateKey) {
    const date = new Date(`${dateKey}T12:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
}

function trackerDateKey(date) {
    return localDateKey(date);
}

function addTrackerDays(dateKey, days) {
    const date = trackerDate(dateKey);
    if (!date) return "";
    date.setDate(date.getDate() + days);
    return trackerDateKey(date);
}

function trackerDaysBetween(startKey, endKey) {
    const start = trackerDate(startKey);
    const end = trackerDate(endKey);
    return start && end ? Math.round((end - start) / 86400000) : 0;
}

function formatTrackerDate(dateKey) {
    const date = trackerDate(dateKey);
    return date ? formatDate(date) : "—";
}

function savePeriodStorage() {
    try {
        localStorage.setItem(PERIOD_RECORDS_KEY, JSON.stringify(periodTracker.records));
        localStorage.setItem(PERIOD_SETTINGS_KEY, JSON.stringify(periodTracker.settings));
        localStorage.setItem(PERIOD_CHECKINS_KEY, JSON.stringify(periodTracker.checkIns));
        if (typeof renderMyMonth === "function") renderMyMonth();
    } catch {
        $("#periodFormStatus").textContent = "Your browser could not save tracker data.";
    }
}

function sortedPeriodRecords() {
    return [...periodTracker.records].sort((a, b) => b.start.localeCompare(a.start));
}

function trackerAverages() {
    const records = [...periodTracker.records].sort((a, b) => a.start.localeCompare(b.start));
    const configuredCycle = Number(periodTracker.settings.cycleLength) || 28;
    const configuredDuration = Number(periodTracker.settings.periodDuration) || 5;
    const cycleLengths = records.slice(1).map((record, index) =>
        trackerDaysBetween(records[index].start, record.start)
    ).filter(length => length >= 15 && length <= 90);
    const durations = records.map(record =>
        trackerDaysBetween(record.start, record.end) + 1
    ).filter(duration => duration >= 1 && duration <= 14);

    return {
        cycleLength: cycleLengths.length >= 1
            ? Math.round(cycleLengths.reduce((sum, length) => sum + length, 0) / cycleLengths.length)
            : configuredCycle,
        periodDuration: durations.length >= 1
            ? Math.round(durations.reduce((sum, duration) => sum + duration, 0) / durations.length)
            : configuredDuration
    };
}

function trackerPrediction() {
    const latest = sortedPeriodRecords()[0];
    if (!latest) return null;
    const averages = trackerAverages();
    const nextStart = addTrackerDays(latest.start, averages.cycleLength);
    const nextEnd = addTrackerDays(nextStart, averages.periodDuration - 1);
    const ovulation = addTrackerDays(nextStart, -14);
    return {
        latest,
        nextStart,
        nextEnd,
        ovulation,
        fertileStart: addTrackerDays(ovulation, -5),
        fertileEnd: addTrackerDays(ovulation, 1),
        ...averages
    };
}

function isTrackerPeriodDay(key, record) {
    return key >= record.start && key <= record.end;
}

function isTrackerPredictedDay(key, prediction) {
    return prediction && key >= prediction.nextStart && key <= prediction.nextEnd;
}

function renderTrackerCalendar() {
    const year = trackerMonth.getFullYear();
    const month = trackerMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prediction = trackerPrediction();
    const today = localDateKey();
    let html = "";

    $("#trackerMonthTitle").textContent = trackerMonth.toLocaleDateString("en-IN", {
        month: "long", year: "numeric"
    });

    for (let index = 0; index < firstDay; index += 1) {
        html += '<span class="calendar-day outside" aria-hidden="true"></span>';
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
        const key = trackerDateKey(new Date(year, month, day));
        const record = periodTracker.records.find(item => isTrackerPeriodDay(key, item));
        const classes = [
            "calendar-day",
            key === today ? "today" : "",
            key === trackerSelectedDate ? "selected" : "",
            record ? "period-day" : "",
            isTrackerPredictedDay(key, prediction) && !record ? "predicted-day" : ""
        ].filter(Boolean).join(" ");
        html += `<button type="button" class="${classes}" data-tracker-date="${key}" aria-label="${formatTrackerDate(key)}">${day}</button>`;
    }
    $("#trackerCalendarGrid").innerHTML = html;
    $("#trackerSelectedDateHint").textContent = `Selected ${formatTrackerDate(trackerSelectedDate)} · Choose a date to update its check-in.`;
    renderTrackerCheckIn();
}

function renderTrackerDashboard() {
    const prediction = trackerPrediction();
    const averages = trackerAverages();
    const today = localDateKey();
    $("#trackerCycleLength").textContent = `${averages.cycleLength} days`;
    $("#trackerPeriodDuration").textContent = `${averages.periodDuration} days`;

    if (!prediction) {
        $("#trackerNextPeriod").textContent = "Add a period";
        $("#trackerDaysRemaining").textContent = "Start with your last period below.";
        $("#trackerCycleDay").textContent = "—";
        ["trackerNextEnd", "trackerOvulation", "trackerFertileWindow", "trackerLastStart"].forEach(id => {
            $(`#${id}`).textContent = "—";
        });
        return;
    }

    const remaining = trackerDaysBetween(today, prediction.nextStart);
    $("#trackerNextPeriod").textContent = formatTrackerDate(prediction.nextStart);
    $("#trackerDaysRemaining").textContent = remaining >= 0
        ? `${remaining} day${remaining === 1 ? "" : "s"} remaining`
        : `${Math.abs(remaining)} days past estimate`;
    $("#trackerCycleDay").textContent = `${Math.max(1, trackerDaysBetween(prediction.latest.start, today) + 1)}`;
    $("#trackerNextEnd").textContent = formatTrackerDate(prediction.nextEnd);
    $("#trackerOvulation").textContent = formatTrackerDate(prediction.ovulation);
    $("#trackerFertileWindow").textContent = `${formatTrackerDate(prediction.fertileStart)} – ${formatTrackerDate(prediction.fertileEnd)}`;
    $("#trackerLastStart").textContent = formatTrackerDate(prediction.latest.start);
}

function renderTrackerHistory() {
    const records = sortedPeriodRecords();
    const chronologicalRecords = [...records].sort((a, b) => a.start.localeCompare(b.start));
    $("#trackerHistoryList").innerHTML = records.map(record => {
        const recordIndex = chronologicalRecords.findIndex(item => item.id === record.id);
        const previousRecord = chronologicalRecords[recordIndex - 1];
        const cycle = previousRecord
            ? trackerDaysBetween(previousRecord.start, record.start)
            : "—";
        const duration = trackerDaysBetween(record.start, record.end) + 1;
        const checkIns = Object.entries(periodTracker.checkIns).filter(([dateKey, checkIn]) =>
            dateKey >= record.start && dateKey <= record.end &&
            (checkIn.symptoms?.length || checkIn.mood || checkIn.notes)
        );
        const checkInDetails = [...new Set(checkIns.flatMap(([, checkIn]) => [
            ...(checkIn.symptoms || []),
            ...(checkIn.mood ? [checkIn.mood] : [])
        ]))];
        const checkInSummary = checkIns.length
            ? ` · ${checkIns.length} check-in${checkIns.length === 1 ? "" : "s"}${checkInDetails.length ? `: ${escapeHTML(checkInDetails.join(", "))}` : ""}`
            : "";
        return `
            <article class="tracker-history-row">
                <div><strong>${formatTrackerDate(record.start)}</strong><span>Ended ${formatTrackerDate(record.end)}</span></div>
                <span>${cycle === "—" ? "First record" : `${cycle}-day cycle`}</span>
                <span>${duration} day period${checkInSummary}</span>
                <div class="tracker-row-actions">
                    <button type="button" class="secondary-button" data-edit-period="${record.id}">Edit</button>
                    <button type="button" class="text-button tracker-delete-button" data-delete-period="${record.id}">Delete</button>
                </div>
            </article>
        `;
    }).join("");
    $("#trackerHistoryEmpty").classList.toggle("hidden", records.length > 0);
}

function renderTrackerCheckIn() {
    const checkIn = periodTracker.checkIns[trackerSelectedDate] || {};
    $("#symptomDateTitle").textContent = `Symptoms for ${formatTrackerDate(trackerSelectedDate)}`;
    document.querySelectorAll("#symptomOptions input").forEach(input => {
        input.checked = (checkIn.symptoms || []).includes(input.value);
    });
    $("#trackerMood").value = checkIn.mood || "";
    $("#trackerNotes").value = checkIn.notes || "";
}

function renderTrackerSettings() {
    $("#trackerCycleSetting").value = periodTracker.settings.cycleLength || 28;
    $("#trackerDurationSetting").value = periodTracker.settings.periodDuration || 5;
}

function renderPeriodTracker() {
    renderTrackerSettings();
    renderTrackerDashboard();
    renderTrackerCalendar();
    renderTrackerHistory();
}

$("#periodRecordForm").addEventListener("submit", event => {
    event.preventDefault();
    const start = $("#periodStartDate").value;
    const end = $("#periodEndDate").value;
    if (!trackerDate(start) || !trackerDate(end) || end < start) {
        $("#periodFormStatus").textContent = "Please choose valid dates, with the end date on or after the start date.";
        return;
    }
    const duplicate = periodTracker.records.some(record =>
        record.id !== editingPeriodId && record.start === start
    );
    if (duplicate) {
        $("#periodFormStatus").textContent = "A period with that start date is already recorded.";
        return;
    }
    if (editingPeriodId) {
        const record = periodTracker.records.find(item => item.id === editingPeriodId);
        if (record) Object.assign(record, { start, end });
    } else {
        periodTracker.records.push({ id: String(Date.now()), start, end });
    }
    periodTracker.records.sort((a, b) => a.start.localeCompare(b.start));
    editingPeriodId = null;
    $("#periodRecordForm").reset();
    $("#cancelPeriodEdit").classList.add("hidden");
    $("#trackerFormTitle").textContent = "Add a period";
    $("#periodFormStatus").textContent = "Your period record is saved privately on this device. ♡";
    savePeriodStorage();
    renderPeriodTracker();
});

    /* MY MONTH
       This is a read-only archive assembled from the existing feature data. */

    const MY_MONTH_STATE_KEY = "beautiful_my_month_view_v1";
    const MY_MONTH_MOOD_EMOJIS = {
        happy: "😊", okay: "😌", sad: "😔", stressed: "🥹", excited: "🤩",
        Happy: "😊", Sad: "😔", Anxious: "😟", Irritated: "😤", Calm: "😌", Tired: "😴"
    };
    const MY_MONTH_CATEGORIES = [
        "Mood", "Happiness Wall", "Journal", "Notes", "Study Focus",
        "Currently Loving", "Period Tracker", "Reminders", "Tasks", "Water", "Habits", "Memory"
    ];

    let myMonthState = readPeriodStorage(MY_MONTH_STATE_KEY, {
        month: localDateKey().slice(0, 7),
        selectedDate: localDateKey(),
        category: "all",
        search: ""
    });
    let myMonthDate = new Date(`${myMonthState.month}-01T12:00:00`);

    function saveMyMonthState() {
        try {
            localStorage.setItem(MY_MONTH_STATE_KEY, JSON.stringify(myMonthState));
        } catch {
            // View preferences are optional and should never interrupt existing features.
        }
    }

    function myMonthDateFromTimestamp(value) {
        if (!value) return null;
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    function myMonthDateFromId(id) {
        const numericId = Number(id);
        const date = Number.isFinite(numericId) && numericId > 0 ? new Date(numericId) : null;
        return date && !Number.isNaN(date.getTime()) ? date : null;
    }

    function addMyMonthMemory(items, details) {
        if (!details.date || !trackerDate(details.date)) return;
        items.push({
            id: details.id || `${details.category}-${details.date}-${items.length}`,
            date: details.date,
            timestamp: details.timestamp || `${details.date}T12:00:00`,
            category: details.category,
            title: details.title,
            text: details.text || "",
            image: details.image || "",
            emoji: details.emoji || ""
        });
    }

    function collectMyMonthMemories() {
        const items = [];
        const addDailyMap = (source, category, getDetails) => {
            Object.entries(source || {}).forEach(([date, value]) => {
                const details = getDetails(value, date);
                if (details) addMyMonthMemory(items, { ...details, date, category });
            });
        };

        addDailyMap(data.moods, "Mood", mood => ({
            title: MY_MONTH_MOOD_EMOJIS[mood] ? `${MY_MONTH_MOOD_EMOJIS[mood]} ${mood}` : "Mood check-in",
            text: "A mood was recorded for this day.",
            emoji: MY_MONTH_MOOD_EMOJIS[mood] || "♡"
        }));
        addDailyMap(data.notes, "Notes", note => note?.trim() ? {
            title: "Calendar note", text: note
        } : null);
        addDailyMap(data.thoughts, "Journal", thought => thought?.trim() ? {
            title: "Private journal", text: thought
        } : null);
        addDailyMap(data.reviews, "Journal", review => review?.saved ? {
            title: "Daily review",
            text: [review.reflection, review.tomorrow].filter(Boolean).join(" · "),
            emoji: MY_MONTH_MOOD_EMOJIS[review.mood] || ""
        } : null);
        addDailyMap(data.water, "Water", count => count ? {
            title: "Water check", text: `${count} of 8 glasses`
        } : null);
        addDailyMap(data.focus, "Study Focus", focus => focus?.minutes || focus?.sessions ? {
            title: "Study focus", text: `${focus.minutes || 0} minutes · ${focus.sessions || 0} sessions`
        } : null);

        Object.entries(data.reminders || {}).forEach(([date, reminders]) => {
            (reminders || []).forEach((reminder, index) => addMyMonthMemory(items, {
                id: `reminder-${date}-${index}`, date, category: "Reminders",
                title: "Little reminder", text: reminder
            }));
        });
        Object.entries(data.tasks || {}).forEach(([date, tasks]) => {
            (tasks || []).forEach((task, index) => addMyMonthMemory(items, {
                id: `task-${date}-${index}`, date, category: "Tasks",
                title: task.done ? "Completed task" : "Task", text: task.title
            }));
        });
        Object.entries(data.memories || {}).forEach(([date, image]) => addMyMonthMemory(items, {
            id: `memory-${date}`, date, category: "Memory", title: "A cute memory", image
        }));
        (data.happinessWall || []).forEach(item => {
            const timestamp = myMonthDateFromTimestamp(item.createdAt) || myMonthDateFromId(item.id);
            addMyMonthMemory(items, {
                id: `wall-${item.id}`, date: timestamp ? localDateKey(timestamp) : "",
                timestamp: timestamp?.toISOString(), category: "Happiness Wall",
                title: item.title || "Happy little moment", text: item.description, image: item.image
            });
        });
        Object.entries(data.habits || []).forEach(([index, habit]) => {
            Object.entries(habit.completions || {}).forEach(([date, completed]) => {
                if (completed) addMyMonthMemory(items, {
                    id: `habit-${habit.id || index}-${date}`, date, category: "Habits",
                    title: "Habit garden", text: habit.name
                });
            });
        });
        Object.entries(data.loving || {}).forEach(([collection, entries]) => {
            (entries || []).forEach(item => {
                const timestamp = myMonthDateFromTimestamp(item.createdAt) || myMonthDateFromId(item.id);
                addMyMonthMemory(items, {
                    id: `loving-${item.id}`, date: timestamp ? localDateKey(timestamp) : "",
                    timestamp: timestamp?.toISOString(), category: "Currently Loving",
                    title: item.title || collection, text: item.note, image: item.image
                });
            });
        });

        periodTracker.records.forEach(record => addMyMonthMemory(items, {
            id: `period-${record.id}`, date: record.start, category: "Period Tracker",
            title: "Period recorded", text: `Started ${formatTrackerDate(record.start)} · ended ${formatTrackerDate(record.end)}`,
            emoji: "🌷"
        }));
        Object.entries(periodTracker.checkIns).forEach(([date, checkIn]) => {
            const text = [
                ...(checkIn.symptoms || []),
                checkIn.mood ? `Mood: ${checkIn.mood}` : "",
                checkIn.notes || ""
            ].filter(Boolean).join(" · ");
            if (text) addMyMonthMemory(items, {
                id: `period-checkin-${date}`, date, category: "Period Tracker",
                title: "Body check-in", text, emoji: MY_MONTH_MOOD_EMOJIS[checkIn.mood] || "♡"
            });
        });

        return items.sort((a, b) =>
            `${b.date}${b.timestamp}`.localeCompare(`${a.date}${a.timestamp}`)
        );
    }

    function myMonthFormatTime(timestamp) {
        const date = myMonthDateFromTimestamp(timestamp);
        return date && timestamp.slice(11, 16) !== "12:00"
            ? date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })
            : "";
    }

    function myMonthMatchesSearch(memory, search) {
        if (!search) return true;
        return [memory.category, memory.title, memory.text].join(" ").toLowerCase().includes(search);
    }

    function renderMyMonthSummary(memories) {
        const counts = {
            Mood: memories.filter(item => item.category === "Mood").length,
            "Happiness Wall": memories.filter(item => item.category === "Happiness Wall").length,
            Notes: memories.filter(item => ["Notes", "Journal"].includes(item.category)).length,
            "Period Tracker": memories.filter(item => item.category === "Period Tracker").length,
            Other: memories.filter(item => !["Mood", "Happiness Wall", "Notes", "Journal", "Period Tracker"].includes(item.category)).length
        };
        $("#myMonthSummary").innerHTML = [
            ["♡", counts.Mood, "Moods"], ["✿", counts["Happiness Wall"], "Wall posts"],
            ["☁", counts.Notes, "Notes & journal"], ["🌷", counts["Period Tracker"], "Period notes"],
            ["✨", counts.Other, "Other memories"]
        ].map(([icon, count, label]) => `
            <div class="my-month-summary-card"><span>${icon}</span><strong>${count}</strong><small>${label}</small></div>
        `).join("");
    }

    function renderMyMonthDay(memories) {
        const selectedDate = myMonthState.selectedDate;
        const selected = memories.filter(memory => memory.date === selectedDate);
        $("#myMonthSelectedDate").textContent = formatTrackerDate(selectedDate);
        $("#myMonthDayMemories").innerHTML = selected.map(memory => `
            <article class="my-month-day-memory">
                <div class="my-month-memory-meta">${memory.emoji || "♡"} ${escapeHTML(memory.category)}${myMonthFormatTime(memory.timestamp) ? ` · ${myMonthFormatTime(memory.timestamp)}` : ""}</div>
                <strong>${escapeHTML(memory.title)}</strong>
                ${memory.text ? `<p>${escapeHTML(memory.text)}</p>` : ""}
                ${memory.image ? `<img src="${escapeHTML(memory.image)}" alt="">` : ""}
            </article>
        `).join("");
        $("#myMonthDayEmpty").classList.toggle("hidden", selected.length > 0);
    }

    function renderMyMonthTimeline(memories) {
        const search = (myMonthState.search || "").trim().toLowerCase();
        const category = myMonthState.category || "all";
        const monthKey = myMonthState.month;
        const monthMemories = memories.filter(memory =>
            memory.date.startsWith(monthKey) &&
            (category === "all" || memory.category === category) &&
            myMonthMatchesSearch(memory, search)
        );
        $("#myMonthTimelineCount").textContent = `${monthMemories.length} saved`;
        $("#myMonthTimeline").innerHTML = monthMemories.map(memory => {
            const date = trackerDate(memory.date);
            return `
                <article class="my-month-timeline-entry">
                    <div class="my-month-timeline-date">${date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}<small>${myMonthFormatTime(memory.timestamp)}</small></div>
                    <div>
                        <div class="my-month-memory-meta">${memory.emoji || "♡"} ${escapeHTML(memory.category)}</div>
                        <h4>${escapeHTML(memory.title)}</h4>
                        ${memory.text ? `<p>${escapeHTML(memory.text)}</p>` : ""}
                        ${memory.image ? `<img src="${escapeHTML(memory.image)}" alt="">` : ""}
                    </div>
                </article>
            `;
        }).join("");
        $("#myMonthTimelineEmpty").classList.toggle("hidden", monthMemories.length > 0);
    }

    function renderMyMonthCalendar(memories) {
        const year = myMonthDate.getFullYear();
        const month = myMonthDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = localDateKey();
        const byDate = memories.reduce((map, memory) => {
            (map[memory.date] ||= []).push(memory);
            return map;
        }, {});
        let html = "";
        $("#myMonthTitle").textContent = myMonthDate.toLocaleDateString("en-IN", {
            month: "long", year: "numeric"
        });
        for (let index = 0; index < firstDay; index += 1) {
            html += '<span class="calendar-day outside" aria-hidden="true"></span>';
        }
        for (let day = 1; day <= daysInMonth; day += 1) {
            const key = trackerDateKey(new Date(year, month, day));
            const dayMemories = byDate[key] || [];
            const mood = dayMemories.find(memory => memory.category === "Mood")?.emoji || "";
            const classes = ["calendar-day", key === today ? "today" : "", key === myMonthState.selectedDate ? "selected" : "", dayMemories.length ? "memory-day" : ""].filter(Boolean).join(" ");
            html += `<button type="button" class="${classes}" data-my-month-date="${key}" aria-label="${formatTrackerDate(key)}, ${dayMemories.length} saved memories">${day}${mood ? `<span class="mood-symbol">${mood}</span>` : dayMemories.length ? `<span class="memory-count">${dayMemories.length}</span>` : ""}</button>`;
        }
        $("#myMonthCalendarGrid").innerHTML = html;
    }

    function renderMyMonth() {
        const memories = collectMyMonthMemories();
        renderMyMonthSummary(memories.filter(memory => memory.date.startsWith(myMonthState.month)));
        renderMyMonthCalendar(memories);
        renderMyMonthDay(memories);
        renderMyMonthTimeline(memories);
    }

    $("#myMonthPrev").addEventListener("click", () => {
        myMonthDate = new Date(myMonthDate.getFullYear(), myMonthDate.getMonth() - 1, 1);
        myMonthState.month = `${myMonthDate.getFullYear()}-${String(myMonthDate.getMonth() + 1).padStart(2, "0")}`;
        myMonthState.selectedDate = `${myMonthState.month}-01`;
        saveMyMonthState();
        renderMyMonth();

    });

    $("#myMonthNext").addEventListener("click", () => {
        myMonthDate = new Date(myMonthDate.getFullYear(), myMonthDate.getMonth() + 1, 1);
        myMonthState.month = `${myMonthDate.getFullYear()}-${String(myMonthDate.getMonth() + 1).padStart(2, "0")}`;
        myMonthState.selectedDate = `${myMonthState.month}-01`;
        saveMyMonthState();
        renderMyMonth();
    });

    $("#myMonthCalendarGrid").addEventListener("click", event => {
        const button = event.target.closest("[data-my-month-date]");
        if (!button) return;
        myMonthState.selectedDate = button.dataset.myMonthDate;
        saveMyMonthState();
        renderMyMonth();
    });

    $("#myMonthCategoryFilter").addEventListener("change", event => {
        myMonthState.category = event.target.value;
        saveMyMonthState();
        renderMyMonth();
    });

    $("#myMonthSearch").addEventListener("input", event => {
        myMonthState.search = event.target.value;
        saveMyMonthState();
        renderMyMonth();
    });

    $("#myMonthCategoryFilter").innerHTML += MY_MONTH_CATEGORIES.map(category =>
        `<option value="${category}">${category}</option>`
    ).join("");
    $("#myMonthCategoryFilter").value = myMonthState.category || "all";
    $("#myMonthSearch").value = myMonthState.search || "";
    renderMyMonth();

renderBirthdays();

/* COMPACT ICON DASHBOARD NAVIGATION */

const featureViewSelectors = {
    inspiration: "main > section:nth-of-type(3)",
    important: "main > section:nth-of-type(4)",
    tasks: "main > section:nth-of-type(5)",
    water: "main > section:nth-of-type(6)",
    mood: "main > section:nth-of-type(7)",
    journal: "main > section:nth-of-type(8)",
    happiness: "main > section:nth-of-type(9)",
    focus: "main > section:nth-of-type(10)",
    habits: "main > section:nth-of-type(11)",
    loving: "main > section:nth-of-type(12)",
    myMonth: "#myMonth",
    periodTracker: "#periodTracker",
    calendar: "main > section.calendar-section",
    birthdays: "#birthdays"
};

const featureViewLabels = {
    inspiration: "Daily Inspiration",
    important: "Daily Lists",
    tasks: "Today's Tasks",
    water: "Water Check",
    mood: "Mood Diary",
    journal: "My Journal",
    happiness: "Happiness Wall",
    focus: "Study Focus",
    habits: "Habit Garden",
    loving: "Currently Loving",
    myMonth: "My Month",
    periodTracker: "Period Tracker",
    calendar: "My Calendar",
    birthdays: "Birthdays"
};

function setupFeatureViews() {
    const dashboard = $("#dashboardHome");
    const featureSections = {};

    Object.entries(featureViewSelectors).forEach(([key, selector]) => {
        const section = document.querySelector(selector);
        if (!section) return;
        featureSections[key] = section;
        section.classList.add("feature-view", "app-feature-hidden");
        section.dataset.featureView = key;
        section.insertAdjacentHTML("afterbegin", `
            <div class="feature-backbar">
                <button type="button" class="home-button" data-go-home aria-label="Back to Beautiful home">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"></path></svg>
                    <span>Home</span>
                </button>
                <span class="feature-page-label">${featureViewLabels[key]}</span>
            </div>
        `);
    });

    document.querySelectorAll("main > section:not(#dashboardHome)").forEach(section => {
        if (!section.classList.contains("feature-view")) section.classList.add("app-feature-hidden");
    });

    function openFeature(key, updateHash = true) {
        const selected = featureSections[key];
        if (!selected) return;
        dashboard.classList.add("app-feature-hidden");
        Object.values(featureSections).forEach(section => {
            section.classList.toggle("app-feature-hidden", section !== selected);
            section.setAttribute("aria-hidden", section !== selected ? "true" : "false");
        });
        if (updateHash) history.replaceState(null, "", `#feature-${key}`);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function goHome(updateHash = true) {
        dashboard.classList.remove("app-feature-hidden");
        Object.values(featureSections).forEach(section => {
            section.classList.add("app-feature-hidden");
            section.setAttribute("aria-hidden", "true");
        });
        if (updateHash) history.replaceState(null, "", "#home");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    document.querySelectorAll("[data-feature-target]").forEach(button => {
        button.addEventListener("click", () => openFeature(button.dataset.featureTarget));
    });

    document.addEventListener("click", event => {
        if (event.target.closest("[data-go-home]")) goHome();
    });

    window.addEventListener("hashchange", () => {
        const nextKey = window.location.hash.startsWith("#feature-")
            ? window.location.hash.slice("#feature-".length)
            : "";
        nextKey && featureSections[nextKey] ? openFeature(nextKey, false) : goHome(false);
    });

    const search = $("#featureSearch");
    const searchEmpty = $("#featureSearchEmpty");
    search.addEventListener("input", () => {
        const query = search.value.trim().toLowerCase();
        let visibleCount = 0;
        document.querySelectorAll("[data-feature-target]").forEach(tile => {
            const matches = !query || tile.dataset.featureName.includes(query);
            tile.classList.toggle("search-hidden", !matches);
            if (matches) visibleCount += 1;
        });
        searchEmpty.classList.toggle("hidden", visibleCount > 0);
    });

    const hashKey = window.location.hash.startsWith("#feature-")
        ? window.location.hash.slice("#feature-".length)
        : "";
    hashKey && featureSections[hashKey] ? openFeature(hashKey, false) : goHome(false);
}

setupFeatureViews();

$("#trackerCalendarGrid").addEventListener("click", event => {
    const button = event.target.closest("[data-tracker-date]");
    if (!button) return;
    trackerSelectedDate = button.dataset.trackerDate;
    renderTrackerCalendar();
});

$("#trackerPrevMonth").addEventListener("click", () => {
    trackerMonth = new Date(trackerMonth.getFullYear(), trackerMonth.getMonth() - 1, 1);
    renderTrackerCalendar();
});

$("#trackerNextMonth").addEventListener("click", () => {
    trackerMonth = new Date(trackerMonth.getFullYear(), trackerMonth.getMonth() + 1, 1);
    renderTrackerCalendar();
});

$("#saveTrackerSettings").addEventListener("click", () => {
    const cycleLength = Number($("#trackerCycleSetting").value);
    const periodDuration = Number($("#trackerDurationSetting").value);
    if (cycleLength < 15 || cycleLength > 90 || periodDuration < 1 || periodDuration > 14) {
        $("#periodFormStatus").textContent = "Cycle length must be 15–90 days and period duration must be 1–14 days.";
        return;
    }
    periodTracker.settings = { cycleLength, periodDuration };
    savePeriodStorage();
    renderTrackerDashboard();
    $("#periodFormStatus").textContent = "Your tracker settings are saved. ♡";
});

$("#saveTrackerCheckIn").addEventListener("click", () => {
    const symptoms = [...document.querySelectorAll("#symptomOptions input:checked")].map(input => input.value);
    const mood = $("#trackerMood").value;
    const notes = $("#trackerNotes").value.trim();
    if (symptoms.length || mood || notes) {
        periodTracker.checkIns[trackerSelectedDate] = { symptoms, mood, notes };
    } else {
        delete periodTracker.checkIns[trackerSelectedDate];
    }
    savePeriodStorage();
    renderTrackerHistory();
    $("#trackerCheckInStatus").textContent = "Your check-in is saved privately. ♡";
});

$("#trackerHistoryList").addEventListener("click", event => {
    const editButton = event.target.closest("[data-edit-period]");
    const deleteButton = event.target.closest("[data-delete-period]");
    if (editButton) {
        const record = periodTracker.records.find(item => item.id === editButton.dataset.editPeriod);
        if (!record) return;
        editingPeriodId = record.id;
        $("#periodStartDate").value = record.start;
        $("#periodEndDate").value = record.end;
        $("#trackerFormTitle").textContent = "Edit period";
        $("#cancelPeriodEdit").classList.remove("hidden");
        $("#periodStartDate").focus();
    }
    if (deleteButton) {
        const record = periodTracker.records.find(item => item.id === deleteButton.dataset.deletePeriod);
        if (!record || !confirm(`Delete the period starting ${formatTrackerDate(record.start)}?`)) return;
        periodTracker.records = periodTracker.records.filter(item => item.id !== record.id);
        savePeriodStorage();
        renderPeriodTracker();
    }
});

$("#cancelPeriodEdit").addEventListener("click", () => {
    editingPeriodId = null;
    $("#periodRecordForm").reset();
    $("#trackerFormTitle").textContent = "Add a period";
    $("#cancelPeriodEdit").classList.add("hidden");
    $("#periodFormStatus").textContent = "";
});

$("#exportTrackerData").addEventListener("click", () => {
    const exportData = {
        exportedAt: new Date().toISOString(),
        records: periodTracker.records,
        settings: periodTracker.settings,
        checkIns: periodTracker.checkIns
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "beautiful-period-tracker.json";
    link.click();
    URL.revokeObjectURL(link.href);
});

$("#deleteTrackerData").addEventListener("click", () => {
    if (!confirm("Delete all period tracker records, settings, and check-ins from this device?")) return;
    periodTracker.records = [];
    periodTracker.settings = { cycleLength: 28, periodDuration: 5 };
    periodTracker.checkIns = {};
    localStorage.removeItem(PERIOD_RECORDS_KEY);
    localStorage.removeItem(PERIOD_SETTINGS_KEY);
    localStorage.removeItem(PERIOD_CHECKINS_KEY);
    editingPeriodId = null;
    $("#periodFormStatus").textContent = "Your period tracker data has been deleted.";
    renderPeriodTracker();
});

renderPeriodTracker();
