// Утилиты даты
function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay(); // 0 = воскресенье, 1 = понедельник, ..., 6 = суббота
    const diff = (day === 0 ? -6 : 1 - day); // сдвиг к понедельнику
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

let currentMonday = getMonday(new Date());
let isRendering = false;

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
const body = document.body;

// === Тема с динамическим значком ===
const savedTheme = localStorage.getItem('theme') || 'light';
if (savedTheme === 'dark') {
    body.classList.add('dark-theme');
    themeToggle.textContent = '☀️';
} else {
    themeToggle.textContent = '🌙';
}

themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-theme');
    const isDark = body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    themeToggle.textContent = isDark ? '☀️' : '🌙';
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

// === Заметки ===
const savedNotes = localStorage.getItem('todoNotes');
if (savedNotes) notesTextarea.value = savedNotes;
notesTextarea.addEventListener('input', () => {
    localStorage.setItem('todoNotes', notesTextarea.value);
});

// === Мини-календарь ===
function renderMiniCalendar(viewMonday) {
    const miniCal = document.getElementById('miniCalendar');
    if (!miniCal) return;

    const viewWeekStart = new Date(viewMonday);
    const viewWeekEnd = addDays(viewWeekStart, 6);

    // Парсим месяц из monthYearLabel
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

    // Начало: ближайший понедельник до/на 1-е число
    const startDay = new Date(firstDay);
    const firstDayOfWeek = firstDay.getDay(); // 0 = вс, 1 = пн, ..., 6 = сб
    let daysToSubtract = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    startDay.setDate(firstDay.getDate() - daysToSubtract);

    // Конец: ближайшее воскресенье после/на последнее число
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
        const dayDate = new Date(currentDate); // ← фиксируем копию даты

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

        // 👇 Используем dayDate, а не currentDate!
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
function renderWeek(monday) {
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

    weekDates.forEach(date => {
        const dateStr = formatDate(date);
        renderTasks(dateStr);
    });

    // Обновляем мини-календарь
    renderMiniCalendar(monday);

    setTimeout(() => {
        isRendering = false;
    }, 50);
}

// === Сворачивание заметок ===
const toggleNotesBtn = document.getElementById('toggleNotesBtn');
const notesContent = document.getElementById('notesContent');

// Загрузка состояния
const isCollapsed = localStorage.getItem('notesCollapsed') === 'true';
if (isCollapsed) {
    notesContent.classList.add('collapsed');
    toggleNotesBtn.textContent = '📂'; // развернуть
} else {
    toggleNotesBtn.textContent = '📁'; // свернуть
}

toggleNotesBtn.addEventListener('click', () => {
    const isNowCollapsed = notesContent.classList.contains('collapsed');
    if (isNowCollapsed) {
        notesContent.classList.remove('collapsed');
        toggleNotesBtn.textContent = '📁';
        localStorage.setItem('notesCollapsed', 'false');
    } else {
        notesContent.classList.add('collapsed');
        toggleNotesBtn.textContent = '📂';
        localStorage.setItem('notesCollapsed', 'true');
    }
});

function addTask(dateStr, text) {
    const tasks = getTasksForDate(dateStr);
    tasks.push({ text, completed: false, bgColor: null });
    saveTasksForDate(dateStr, tasks);
    renderTasks(dateStr);
}

function getTasksForDate(dateStr) {
    const data = localStorage.getItem(`todoTasks_${dateStr}`);
    return data ? JSON.parse(data) : [];
}

function saveTasksForDate(dateStr, tasks) {
    localStorage.setItem(`todoTasks_${dateStr}`, JSON.stringify(tasks));
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

function renderTasks(dateStr) {
    const container = document.querySelector(`.tasks-container[data-date="${dateStr}"]`);
    if (!container) return;

    container.innerHTML = '';
    const tasks = getTasksForDate(dateStr);

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

        // Цветовые опции
        Object.entries(COLORS).forEach(([name, hex]) => {
            const colorOption = document.createElement('div');
            colorOption.className = 'color-option';
            colorOption.style.backgroundColor = hex;
            colorOption.addEventListener('click', () => {
                task.bgColor = name;
                saveTasksForDate(dateStr, tasks);
                renderTasks(dateStr);
                colorPicker.style.display = 'none';
            });
            colorPicker.appendChild(colorOption);
        });

        // === Кнопка удаления (корзина) ===
        const deleteOption = document.createElement('div');
        deleteOption.className = 'color-option';
        deleteOption.title = 'Удалить задачу';
        deleteOption.innerHTML = '🗑️';
        deleteOption.style.backgroundColor = '#ffdddd';
        deleteOption.style.color = '#d32f2f';
        deleteOption.style.border = '1px solid #ffcdd2';
        deleteOption.addEventListener('click', () => {
            const tasks = getTasksForDate(dateStr);
            tasks.splice(index, 1);
            saveTasksForDate(dateStr, tasks);
            renderTasks(dateStr);
            colorPicker.style.display = 'none';
        });
        colorPicker.appendChild(deleteOption);

        colorBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.color-picker').forEach(p => p.style.display = 'none');
            colorPicker.style.display = colorPicker.style.display === 'block' ? 'none' : 'block';
        });

        document.addEventListener('click', (e) => {
            if (!colorPicker.contains(e.target) && e.target !== colorBtn) {
                colorPicker.style.display = 'none';
            }
        });

        colorBtn.appendChild(colorPicker);
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

        const sourceTasks = getTasksForDate(sourceDate);
        const taskToMove = { ...sourceTasks[sourceIndex] };

        if (!taskToMove) return;

        sourceTasks.splice(sourceIndex, 1);
        saveTasksForDate(sourceDate, sourceTasks);

        const allRows = Array.from(container.querySelectorAll('.task-row'));
        const newIndex = allRows.indexOf(draggingElement);
        const targetTasks = getTasksForDate(targetDate);

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