// === Supabase Config ===
const SUPABASE_URL = 'https://ваш-проект.supabase.co'; // ← ЗАМЕНИТЕ!
const SUPABASE_ANON_KEY = 'ваш-public-anon-key';       // ← ЗАМЕНИТЕ!

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// === Глобальные переменные ===
let currentMonday = getMonday(new Date());
let currentUser = null;

// === Утилиты даты ===
function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1 - day);
    d.setDate(d.getDate() + diff);
    return d;
}

function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatWeekLabel(monday) {
    const sunday = addDays(monday, 6);
    const opts = { day: 'numeric', month: 'short' };
    const start = monday.toLocaleDateString('ru-RU', opts);
    const end = sunday.toLocaleDateString('ru-RU', opts);
    return `${start} – ${end}`;
}

function formatDayLabel(date) {
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const weekday = days[date.getDay()];
    return `${weekday}, ${day} ${month}`;
}

function formatMonthYear(date) {
    const monthNames = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${month} ${year}`;
}

const COLORS = {
    red: '#f8d7da',
    green: '#d1e7dd',
    yellow: '#fff3cd',
    purple: '#e2d9f3',
    blue: '#d1ecf1'
};

let isRendering = false;

// === Экран входа ===
function showLoginScreen() {
    document.body.innerHTML = `
        <div style="max-width: 400px; margin: 50px auto; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f7fa; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <h2 style="text-align: center; color: #d84d4d; margin-bottom: 20px;">ToDo Calendar</h2>
            <input type="email" id="email" placeholder="Email" style="width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
            <input type="password" id="password" placeholder="Пароль" style="width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
            <button onclick="handleLogin()" style="width: 100%; padding: 12px; background: #d84d4d; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 10px;">Войти</button>
            <button onclick="handleSignup()" style="width: 100%; padding: 12px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 10px;">Регистрация</button>
            <p id="authMessage" style="margin-top: 15px; text-align: center; color: #d32f2f;"></p>
        </div>
    `;
}

async function handleLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const msgEl = document.getElementById('authMessage');
    
    if (!email || !password) {
        msgEl.textContent = 'Введите email и пароль';
        return;
    }

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
        msgEl.textContent = error.message;
    } else {
        checkAuth();
    }
}

async function handleSignup() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const msgEl = document.getElementById('authMessage');
    
    if (!email || !password) {
        msgEl.textContent = 'Введите email и пароль';
        return;
    }

    const { error } = await supabaseClient.auth.signUp({ email, password });
    if (error) {
        msgEl.textContent = error.message;
    } else {
        msgEl.textContent = 'Проверьте email для подтверждения!';
        msgEl.style.color = '#2e7d32';
    }
}

// === Работа с данными ===
async function saveTasksForDate(dateStr, tasks) {
    if (!currentUser) return;
    
    // Удаляем старые задачи пользователя на эту дату
    await supabaseClient
        .from('tasks')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('date', dateStr);
    
    // Добавляем новые
    if (tasks.length > 0) {
        const tasksToInsert = tasks.map(task => ({
            user_id: currentUser.id,
            date: dateStr,
            text: task.text,
            completed: task.completed,
            bg_color: task.bgColor
        }));
        await supabaseClient.from('tasks').insert(tasksToInsert);
    }
}

async function getTasksForDate(dateStr) {
    if (!currentUser) return [];
    const { data, error } = await supabaseClient
        .from('tasks')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('date', dateStr)
        .order('id', { ascending: true });
    if (error) return [];
    return data.map(t => ({
        text: t.text,
        completed: t.completed,
        bgColor: t.bg_color
    }));
}

async function saveNotes(content) {
    if (!currentUser) return;
    await supabaseClient
        .from('notes')
        .upsert(
            { user_id: currentUser.id, content },
            { onConflict: 'user_id' }
        );
}

async function loadNotes() {
    if (!currentUser) return '';
    const { data } = await supabaseClient
        .from('notes')
        .select('content')
        .eq('user_id', currentUser.id)
        .single();
    return data?.content || '';
}

async function loadNotesTitle() {
    if (!currentUser) return 'Заметки';
    const { data } = await supabaseClient
        .from('notes')
        .select('title')
        .eq('user_id', currentUser.id)
        .single();
    return data?.title || 'Заметки';
}

async function saveNotesTitle(title) {
    if (!currentUser) return;
    await supabaseClient
        .from('notes')
        .upsert(
            { user_id: currentUser.id, title },
            { onConflict: 'user_id' }
        );
}

// === Проверка авторизации ===
async function checkAuth() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        currentUser = session.user;
        initApp();
    } else {
        showLoginScreen();
    }
}

// === Инициализация приложения ===
async function initApp() {
    // Восстанавливаем оригинальную разметку
    document.body.innerHTML = `
        <!-- Левая панель заметок -->
        <div class="notes-panel" id="notesPanel">
            <div id="monthYearLabel">Январь 2026</div>
            <div id="miniCalendar"></div>
            <h2 id="notesTitle" class="editable-title">Заметки</h2>
            <textarea class="notes-textarea" id="notes"></textarea>
        </div>

        <!-- Ресайзер -->
        <div class="resizer" id="resizer"></div>

        <!-- Календарь -->
        <div class="calendar-container">
            <div class="week-nav">
                <button class="nav-btn" id="prevWeek">⭠</button>
                <div class="week-label" id="weekLabel">Неделя</div>
                <button class="nav-btn" id="nextWeek">⭢</button>
                <button class="nav-btn" id="todayBtn" title="Текущая неделя">📅</button>
                <button class="theme-toggle" id="themeToggle" title="Сменить тему">🌙</button>
                <button class="nav-btn" id="logoutBtn" title="Выйти">🚪</button>
            </div>
            <div class="week-header" id="weekHeader"></div>
            <div class="week-grid" id="weekGrid"></div>
        </div>
    `;

    // Инициализация элементов
    const notesPanel = document.getElementById('notesPanel');
    const resizer = document.getElementById('resizer');
    const weekHeader = document.getElementById('weekHeader');
    const weekGrid = document.getElementById('weekGrid');
    const weekLabelEl = document.getElementById('weekLabel');
    const monthYearLabel = document.getElementById('monthYearLabel');
    const prevBtn = document.getElementById('prevWeek');
    const nextBtn = document.getElementById('nextWeek');
    const todayBtn = document.getElementById('todayBtn');
    const notesTextarea = document.getElementById('notes');
    const themeToggle = document.getElementById('themeToggle');
    const logoutBtn = document.getElementById('logoutBtn');
    const notesTitleEl = document.getElementById('notesTitle');

    // === Тема ===
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        themeToggle.textContent = '☀️';
    } else {
        themeToggle.textContent = '🌙';
    }

    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        themeToggle.textContent = isDark ? '☀️' : '🌙';
    });

    // === Выход ===
    logoutBtn.addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        currentUser = null;
        showLoginScreen();
    });

    // === Ресайзер ===
    let isResizing = false;
    resizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        const containerRect = document.body.getBoundingClientRect();
        let newWidth = e.clientX - containerRect.left;
        newWidth = Math.max(180, Math.min(500, newWidth));
        notesPanel.style.width = newWidth + 'px';
    });

    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            const width = parseInt(getComputedStyle(notesPanel).width);
            localStorage.setItem('notesPanelWidth', width);
        }
    });

    // === Загрузка заметок ===
    notesTextarea.value = await loadNotes();
    notesTextarea.addEventListener('input', () => {
        saveNotes(notesTextarea.value);
    });

    // === Заголовок заметок ===
    notesTitleEl.textContent = await loadNotesTitle();
    notesTitleEl.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'text';
        input.value = notesTitleEl.textContent;
        input.placeholder = 'Название...';
        input.className = 'notes-title-input';
        notesTitleEl.replaceWith(input);
        input.focus();

        const finishEditing = () => {
            let newTitle = input.value.trim();
            if (!newTitle) newTitle = 'Заметки';
            saveNotesTitle(newTitle);

            const newTitleEl = document.createElement('h2');
            newTitleEl.id = 'notesTitle';
            newTitleEl.className = 'editable-title';
            newTitleEl.textContent = newTitle;
            input.replaceWith(newTitleEl);
            newTitleEl.addEventListener('click', () => {
                const el = document.getElementById('notesTitle');
                if (el) el.click();
            });
        };

        input.addEventListener('blur', finishEditing);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') finishEditing();
        });
    });

    // === Мини-календарь ===
    function renderMiniCalendar(viewMonday) {
        const miniCal = document.getElementById('miniCalendar');
        if (!miniCal) return;

        const viewWeekStart = new Date(viewMonday);
        const viewWeekEnd = addDays(viewWeekStart, 6);

        const labelText = monthYearLabel.textContent.trim();
        const match = labelText.match(/([А-Яа-я]+)\s+(\d{4})/);
        if (!match) return;

        const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
            'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
        const monthIndex = monthNames.indexOf(match[1]);
        const year = parseInt(match[2], 10);

        if (monthIndex === -1) return;

        const firstDay = new Date(year, monthIndex, 1);
        const lastDay = new Date(year, monthIndex + 1, 0);

        const startDay = new Date(firstDay);
        const firstDayOfWeek = firstDay.getDay();
        let daysToSubtract = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
        startDay.setDate(firstDay.getDate() - daysToSubtract);

        const endDay = new Date(lastDay);
        const lastDayOfWeek = lastDay.getDay();
        let daysToAdd = lastDayOfWeek === 0 ? 0 : 7 - lastDayOfWeek;
        endDay.setDate(lastDay.getDate() + daysToAdd);

        const header = document.createElement('div');
        header.className = 'mini-cal-header';
        header.innerHTML = `
            <button class="mini-cal-nav" id="miniPrev">&lt;</button>
            <span>${match[1]} ${year}</span>
            <button class="mini-cal-nav" id="miniNext">&gt;</button>
        `;

        const grid = document.createElement('div');
        grid.className = 'mini-cal-grid';

        let currentDate = new Date(startDay);
        while (currentDate <= endDay) {
            const dayDate = new Date(currentDate);
            const dayElem = document.createElement('div');
            dayElem.className = 'mini-cal-day';
            dayElem.textContent = dayDate.getDate();

            const dateStr = formatDate(dayDate);
            const todayStr = formatDate(new Date());

            if (dayDate.getMonth() !== monthIndex) {
                dayElem.classList.add('other-month');
            }

            if (dateStr === todayStr) {
                dayElem.classList.add('today');
            }

            if (dayDate >= viewWeekStart && dayDate <= viewWeekEnd) {
                dayElem.classList.add('in-view-week');
            }

            dayElem.addEventListener('click', () => {
                const monday = getMonday(dayDate);
                renderWeek(monday);
            });

            grid.appendChild(dayElem);
            currentDate.setDate(currentDate.getDate() + 1);
        }

        miniCal.innerHTML = '';
        miniCal.appendChild(header);
        miniCal.appendChild(grid);

        document.getElementById('miniPrev').addEventListener('click', () => {
            const prevMonth = new Date(year, monthIndex - 1, 1);
            monthYearLabel.textContent = formatMonthYear(prevMonth);
            renderMiniCalendar(viewMonday);
        });

        document.getElementById('miniNext').addEventListener('click', () => {
            const nextMonth = new Date(year, monthIndex + 1, 1);
            monthYearLabel.textContent = formatMonthYear(nextMonth);
            renderMiniCalendar(viewMonday);
        });
    }

    // === Календарь ===
    async function renderWeek(monday) {
        if (isRendering) return;
        isRendering = true;

        weekHeader.innerHTML = '';
        weekGrid.innerHTML = '';

        currentMonday = monday;
        weekLabelEl.textContent = formatWeekLabel(monday);
        monthYearLabel.textContent = formatMonthYear(monday);

        const weekDates = [];
        for (let i = 0; i < 7; i++) {
            weekDates.push(addDays(monday, i));
        }

        const today = new Date();
        const todayStr = formatDate(today);

        weekDates.forEach((date) => {
            const dateStr = formatDate(date);
            const dayLabelFull = formatDayLabel(date);

            const headerElement = document.createElement('div');
            headerElement.textContent = dayLabelFull;
            if (dateStr === todayStr) {
                headerElement.classList.add('today-day');
            }
            weekHeader.appendChild(headerElement);

            const dayCol = document.createElement('div');
            dayCol.className = 'day-column';
            dayCol.dataset.date = dateStr;

            const dayLabel = document.createElement('div');
            dayLabel.className = 'day-label';
            dayLabel.textContent = dayLabelFull;
            dayCol.appendChild(dayLabel);

            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'task-input';
            input.placeholder = 'Новая задача...';
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && input.value.trim()) {
                    addTask(dateStr, input.value.trim());
                    input.value = '';
                }
            });
            dayCol.appendChild(input);

            const tasksContainer = document.createElement('div');
            tasksContainer.className = 'tasks-container';
            tasksContainer.dataset.date = dateStr;
            dayCol.appendChild(tasksContainer);

            weekGrid.appendChild(dayCol);
        });

        for (const date of weekDates) {
            const dateStr = formatDate(date);
            renderTasks(dateStr);
        }

        renderMiniCalendar(monday);

        setTimeout(() => {
            isRendering = false;
        }, 50);
    }

    async function addTask(dateStr, text) {
        const tasks = await getTasksForDate(dateStr);
        tasks.push({ text, completed: false, bgColor: null });
        saveTasksForDate(dateStr, tasks);
        renderTasks(dateStr);
    }

    // === Drag & Drop логика ===
    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.task-row:not(.dragging)')];
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

    async function renderTasks(dateStr) {
        const container = document.querySelector(`.tasks-container[data-date="${dateStr}"]`);
        if (!container) return;

        container.innerHTML = '';
        const tasks = await getTasksForDate(dateStr);

        tasks.forEach((task, index) => {
            const row = document.createElement('div');
            row.className = 'task-row';
            if (task.bgColor) {
                row.classList.add(`task-${task.bgColor}`);
            }
            row.draggable = true;
            row.dataset.taskIndex = index;
            row.dataset.date = dateStr;

            row.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', JSON.stringify({
                    date: dateStr,
                    index: index
                }));
                row.classList.add('dragging');
            });

            row.addEventListener('dragend', () => {
                row.classList.remove('dragging');
                document.querySelectorAll('.day-column.drag-over').forEach(el => {
                    el.classList.remove('drag-over');
                });
            });

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'task-checkbox';
            checkbox.checked = task.completed;
            checkbox.addEventListener('change', () => {
                task.completed = checkbox.checked;
                saveTasksForDate(dateStr, tasks);
                renderTasks(dateStr);
            });

            const textSpan = document.createElement('span');
            textSpan.className = `task-text ${task.completed ? 'completed' : ''}`;
            textSpan.textContent = task.text;

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'task-actions';

            const colorBtn = document.createElement('button');
            colorBtn.className = 'task-btn';
            colorBtn.innerHTML = '✏️';
            colorBtn.title = 'Цвет и удалить';
            const colorPicker = document.createElement('div');
            colorPicker.className = 'color-picker';
            colorPicker.style.position = 'fixed';
            colorPicker.style.zIndex = '1000';

            Object.entries(COLORS).forEach(([name, hex]) => {
                const colorOption = document.createElement('div');
                colorOption.className = 'color-option';
                colorOption.style.backgroundColor = hex;
                colorOption.addEventListener('click', () => {
                    task.bgColor = name;
                    saveTasksForDate(dateStr, tasks);
                    renderTasks(dateStr);
                    colorPicker.remove();
                });
                colorPicker.appendChild(colorOption);
            });

            const deleteOption = document.createElement('div');
            deleteOption.className = 'color-option';
            deleteOption.title = 'Удалить задачу';
            deleteOption.innerHTML = '🗑️';
            deleteOption.style.backgroundColor = '#ffdddd';
            deleteOption.style.color = '#d32f2f';
            deleteOption.style.border = '1px solid #ffcdd2';
            deleteOption.addEventListener('click', () => {
                tasks.splice(index, 1);
                saveTasksForDate(dateStr, tasks);
                renderTasks(dateStr);
                colorPicker.remove();
            });
            colorPicker.appendChild(deleteOption);

            colorBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.color-picker').forEach(p => p.remove());
                document.body.appendChild(colorPicker);
                const rect = colorBtn.getBoundingClientRect();
                colorPicker.style.top = (rect.bottom + window.scrollY) + 'px';
                colorPicker.style.left = (rect.left + window.scrollX) + 'px';
                colorPicker.style.display = 'flex';
                colorPicker.style.flexDirection = 'column';
            });

            document.addEventListener('click', (e) => {
                if (!colorPicker.contains(e.target) && e.target !== colorBtn) {
                    colorPicker.remove();
                }
            });

            actionsDiv.appendChild(colorBtn);
            row.appendChild(checkbox);
            row.appendChild(textSpan);
            row.appendChild(actionsDiv);
            container.appendChild(row);
        });

        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';

            const draggingElement = document.querySelector('.task-row.dragging');
            if (!draggingElement) return;

            const afterElement = getDragAfterElement(container, e.clientY);
            if (afterElement == null) {
                container.appendChild(draggingElement);
            } else {
                container.insertBefore(draggingElement, afterElement);
            }
        });

        container.addEventListener('drop', (e) => {
            e.preventDefault();
            const draggingElement = document.querySelector('.task-row.dragging');
            if (!draggingElement) return;

            const sourceData = JSON.parse(e.dataTransfer.getData('text/plain'));
            const sourceDate = sourceData.date;
            const sourceIndex = sourceData.index;
            const targetDate = container.dataset.date;

            const sourceTasks = [...tasks]; // текущие задачи
            const taskToMove = { ...sourceTasks[sourceIndex] };

            if (!taskToMove) return;

            // Удаляем из исходного дня
            sourceTasks.splice(sourceIndex, 1);
            saveTasksForDate(sourceDate, sourceTasks);

            // Определяем новую позицию в целевом дне
            const allRows = Array.from(container.querySelectorAll('.task-row'));
            const newIndex = allRows.indexOf(draggingElement);
            const targetTasks = [...tasks]; // копия

            if (newIndex === -1 || newIndex >= targetTasks.length) {
                targetTasks.push(taskToMove);
            } else {
                targetTasks.splice(newIndex, 0, taskToMove);
            }

            saveTasksForDate(targetDate, targetTasks);
            renderTasks(sourceDate);
            renderTasks(targetDate);
        });
    }

    // Глобальные обработчики для подсветки дней
    document.addEventListener('dragover', (e) => {
        const dayColumn = e.target.closest('.day-column');
        if (!dayColumn) return;

        document.querySelectorAll('.day-column.drag-over').forEach(el => {
            el.classList.remove('drag-over');
        });
        dayColumn.classList.add('drag-over');
    });

    document.addEventListener('dragleave', (e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
            document.querySelectorAll('.day-column.drag-over').forEach(el => {
                el.classList.remove('drag-over');
            });
        }
    });

    document.addEventListener('drop', () => {
        document.querySelectorAll('.day-column.drag-over').forEach(el => {
            el.classList.remove('drag-over');
        });
    });

    // === Кнопки навигации ===
    prevBtn.addEventListener('click', () => {
        const newMonday = addDays(currentMonday, -7);
        if (formatDate(newMonday) !== formatDate(currentMonday)) {
            renderWeek(newMonday);
        }
    });

    nextBtn.addEventListener('click', () => {
        const newMonday = addDays(currentMonday, 7);
        if (formatDate(newMonday) !== formatDate(currentMonday)) {
            renderWeek(newMonday);
        }
    });

    todayBtn.addEventListener('click', () => {
        const newMonday = getMonday(new Date());
        if (formatDate(newMonday) !== formatDate(currentMonday)) {
            renderWeek(newMonday);
        }
    });

    renderWeek(currentMonday);
}

// === Запуск ===
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});