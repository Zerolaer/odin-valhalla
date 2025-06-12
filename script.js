document.addEventListener('DOMContentLoaded', () => {
    // --- Global Variables & Constants ---
    let characters = [];
    let selectedCharacterId = null;
    const characterClasses = ["Warrior", "Mage", "Archer", "Rogue", "Paladin", "Berserker", "Sorceress", "Ranger", "Priest", "Monk"];

    // --- DOM Element References ---
    const addCharacterBtn = document.getElementById('add-character-btn');
    const refreshDayBtn = document.getElementById('refresh-day-btn');
    const refreshWeekBtn = document.getElementById('refresh-week-btn');

    const characterModal = document.getElementById('character-modal');
    const closeModalBtn = characterModal.querySelector('.close-modal-btn');
    const modalCreateCharacterForm = document.getElementById('modal-create-character-form');
    const modalCharNameInput = document.getElementById('modal-char-name');
    const modalCharLevelInput = document.getElementById('modal-char-level');
    const modalCharClassSelect = document.getElementById('modal-char-class');
    const modalCharIsMainCheckbox = document.getElementById('modal-char-is-main');

    const sidebarCharacterList = document.getElementById('sidebar-character-list');
    const selectedCharacterTasksTitle = document.getElementById('selected-character-tasks-title');

    const dailyTasksListUl = document.getElementById('daily-tasks-list-ul');
    const weeklyTasksListUl = document.getElementById('weekly-tasks-list-ul');
    const createDailyTaskForm = document.getElementById('create-daily-task-form');
    const dailyTaskDescInput = document.getElementById('daily-task-desc');
    const createWeeklyTaskForm = document.getElementById('create-weekly-task-form');
    const weeklyTaskDescInput = document.getElementById('weekly-task-desc');


    // --- ID Generation ---
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    // --- Local Storage Functions ---
    function saveCharacters() {
        localStorage.setItem('odinValhallaTasks_characters', JSON.stringify(characters));
    }

    function loadCharacters() {
        const storedCharacters = localStorage.getItem('odinValhallaTasks_characters');
        if (storedCharacters) {
            try {
                characters = JSON.parse(storedCharacters);
                let mainCharFound = false;
                let changesMade = false;
                characters.forEach(char => {
                    if (char.isMain === undefined) { char.isMain = false; changesMade = true; }
                    if (char.isMain) {
                        if (mainCharFound) { char.isMain = false; changesMade = true; }
                        else { mainCharFound = true; }
                    }
                    if (!char.tasks) { char.tasks = { daily: [], weekly: [] }; changesMade = true; }
                    if (!char.tasks.daily) { char.tasks.daily = []; changesMade = true; }
                    if (!char.tasks.weekly) { char.tasks.weekly = []; changesMade = true; }
                    char.tasks.daily.forEach(task => { if(!task.id) { task.id = generateId(); changesMade = true; } });
                    char.tasks.weekly.forEach(task => { if(!task.id) { task.id = generateId(); changesMade = true; } });
                });
                if (changesMade) { saveCharacters(); }
            } catch (error) {
                console.error("Error parsing characters from local storage: ", error);
                localStorage.removeItem('odinValhallaTasks_characters');
                characters = [];
                alert('Could not load saved data. It might be corrupted. Starting fresh.');
            }
        }
    }

    // --- Populate Class Dropdown ---
    function populateClassDropdown() {
        modalCharClassSelect.innerHTML = '';
        const defaultOption = document.createElement('option');
        defaultOption.value = "";
        defaultOption.textContent = "-- Select Class --";
        defaultOption.disabled = true;
        defaultOption.selected = true;
        modalCharClassSelect.appendChild(defaultOption);
        characterClasses.forEach(className => {
            const option = document.createElement('option');
            option.value = className;
            option.textContent = className;
            modalCharClassSelect.appendChild(option);
        });
    }

    // --- Modal Show/Hide Logic ---
    if (addCharacterBtn) {
        addCharacterBtn.addEventListener('click', () => {
            populateClassDropdown();
            modalCreateCharacterForm.reset();
            modalCharLevelInput.value = 1;
            modalCharClassSelect.value = "";
            modalCharIsMainCheckbox.checked = (characters.length === 0);
            characterModal.style.display = 'block';
            modalCharNameInput.focus();
        });
    }
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            characterModal.style.display = 'none';
        });
    }
    window.addEventListener('click', (event) => {
        if (event.target == characterModal) {
            characterModal.style.display = 'none';
        }
    });

    // --- Character Helper ---
    function getSelectedCharacter() {
        if (!selectedCharacterId) return null;
        return characters.find(char => char.id === selectedCharacterId);
    }

    // --- Task Management ---
    function renderTaskList(tasksArray, listUlElement, taskType) {
        listUlElement.innerHTML = '';

        if (tasksArray.length === 0) {
            listUlElement.innerHTML = `<li class="empty-list-msg">No ${taskType} tasks yet. Add one above!</li>`;
            return;
        }

        tasksArray.forEach(task => {
            const li = document.createElement('li');
            li.dataset.taskId = task.id;

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = task.completed;
            checkbox.addEventListener('change', () => {
                task.completed = checkbox.checked;
                saveCharacters();
                displayTasksForSelectedCharacter();
            });

            const descriptionSpan = document.createElement('span');
            descriptionSpan.classList.add('task-description');
            descriptionSpan.textContent = task.description;
            if (task.completed) {
                descriptionSpan.classList.add('completed');
            }
            li.style.textDecoration = task.completed ? 'line-through' : 'none';
            li.style.opacity = task.completed ? '0.7' : '1';

            const actionsDiv = document.createElement('div');
            actionsDiv.classList.add('task-actions');

            const renameButton = document.createElement('button');
            renameButton.textContent = 'Rename';
            renameButton.classList.add('rename-btn');
            renameButton.type = 'button';
            renameButton.addEventListener('click', () => {
                const newDescription = prompt('Enter new task description:', task.description);
                if (newDescription && newDescription.trim() !== '') {
                    task.description = newDescription.trim();
                    saveCharacters();
                    displayTasksForSelectedCharacter();
                }
            });

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.classList.add('delete-btn');
            deleteButton.type = 'button';
            deleteButton.addEventListener('click', () => {
                if (confirm(`Are you sure you want to delete task: "${task.description}"?`)) {
                    const selectedChar = getSelectedCharacter();
                    if (selectedChar) {
                        if (selectedChar.tasks && selectedChar.tasks[taskType]) {
                            const currentTasks = selectedChar.tasks[taskType];
                            const index = currentTasks.findIndex(t => t.id === task.id);
                            if (index > -1) {
                                currentTasks.splice(index, 1);
                                saveCharacters();
                                displayTasksForSelectedCharacter();
                            }
                        }
                    }
                }
            });

            actionsDiv.appendChild(renameButton);
            actionsDiv.appendChild(deleteButton);

            li.appendChild(checkbox);
            li.appendChild(descriptionSpan);
            li.appendChild(actionsDiv);
            listUlElement.appendChild(li);
        });
    }

    function displayTasksForSelectedCharacter() {
        const selectedChar = getSelectedCharacter();
        const dailySubmitButton = createDailyTaskForm.querySelector('button[type="submit"]');
        const weeklySubmitButton = createWeeklyTaskForm.querySelector('button[type="submit"]');

        if (selectedChar) {
            selectedCharacterTasksTitle.textContent = `Tasks for ${selectedChar.name}`;
            // Enable forms
            dailyTaskDescInput.disabled = false;
            if (dailySubmitButton) dailySubmitButton.disabled = false;
            weeklyTaskDescInput.disabled = false;
            if (weeklySubmitButton) weeklySubmitButton.disabled = false;

            if (!selectedChar.tasks) selectedChar.tasks = { daily: [], weekly: [] };
            if (!selectedChar.tasks.daily) selectedChar.tasks.daily = [];
            if (!selectedChar.tasks.weekly) selectedChar.tasks.weekly = [];

            renderTaskList(selectedChar.tasks.daily, dailyTasksListUl, 'daily');
            renderTaskList(selectedChar.tasks.weekly, weeklyTasksListUl, 'weekly');
        } else {
            selectedCharacterTasksTitle.textContent = 'Select a Character';
            dailyTasksListUl.innerHTML = '<li class="empty-list-msg">Select a character to see daily tasks.</li>';
            weeklyTasksListUl.innerHTML = '<li class="empty-list-msg">Select a character to see weekly tasks.</li>';
            // Disable forms
            dailyTaskDescInput.disabled = true;
            if (dailySubmitButton) dailySubmitButton.disabled = true;
            weeklyTaskDescInput.disabled = true;
            if (weeklySubmitButton) weeklySubmitButton.disabled = true;
        }
    }

    // --- Inline Task Creation Event Listeners ---
    if (createDailyTaskForm) {
        createDailyTaskForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const selectedChar = getSelectedCharacter();
            if (!selectedChar) {
                alert('Please select a character first!');
                return;
            }
            const description = dailyTaskDescInput.value.trim();
            if (description) {
                const newTask = { id: generateId(), description, completed: false };
                if (!selectedChar.tasks.daily) selectedChar.tasks.daily = [];
                selectedChar.tasks.daily.push(newTask);
                saveCharacters();
                displayTasksForSelectedCharacter();
                dailyTaskDescInput.value = '';
                dailyTaskDescInput.focus();
            } else {
                alert('Please enter a task description.');
            }
        });
    }

    if (createWeeklyTaskForm) {
        createWeeklyTaskForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const selectedChar = getSelectedCharacter();
            if (!selectedChar) {
                alert('Please select a character first!');
                return;
            }
            const description = weeklyTaskDescInput.value.trim();
            if (description) {
                const newTask = { id: generateId(), description, completed: false };
                if (!selectedChar.tasks.weekly) selectedChar.tasks.weekly = [];
                selectedChar.tasks.weekly.push(newTask);
                saveCharacters();
                displayTasksForSelectedCharacter();
                weeklyTaskDescInput.value = '';
                weeklyTaskDescInput.focus();
            } else {
                alert('Please enter a task description.');
            }
        });
    }

    // --- Character Rendering & Selection for Sidebar ---
    function renderCharactersInSidebar() {
        sidebarCharacterList.innerHTML = '';

        if (characters.length === 0) {
            sidebarCharacterList.innerHTML = '<p class="empty-list-msg">No characters yet. Click "Add New Character"!</p>';
            selectedCharacterId = null;
        } else {
            let currentCharacterStillExists = characters.some(c => c.id === selectedCharacterId);
            if (!selectedCharacterId || !currentCharacterStillExists) {
                const mainChar = characters.find(c => c.isMain);
                if (mainChar) {
                    selectedCharacterId = mainChar.id;
                } else {
                    selectedCharacterId = characters[0].id;
                }
            }

            characters.forEach(char => {
                const charDiv = document.createElement('div');
                charDiv.classList.add('sidebar-char-item');
                charDiv.dataset.id = char.id;

                const nameSpan = document.createElement('span');
                nameSpan.textContent = char.name;
                charDiv.appendChild(nameSpan);

                if (char.isMain) {
                    const mainIndicator = document.createElement('span');
                    mainIndicator.className = 'main-char-indicator';
                    mainIndicator.textContent = ' (Main)';
                    charDiv.appendChild(mainIndicator);
                }

                if (char.id === selectedCharacterId) {
                    charDiv.classList.add('selected');
                }

                charDiv.addEventListener('click', () => {
                    if (selectedCharacterId !== char.id) {
                        selectedCharacterId = char.id;
                        renderCharactersInSidebar();
                    }
                });
                sidebarCharacterList.appendChild(charDiv);
            });
        }
        displayTasksForSelectedCharacter();
    }

    // --- Modal Form Submission ---
    if (modalCreateCharacterForm) {
        modalCreateCharacterForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const name = modalCharNameInput.value.trim();
            const level = parseInt(modalCharLevelInput.value);
            const selectedClassValue = modalCharClassSelect.value;
            const isMain = modalCharIsMainCheckbox.checked;

            if (!name) { alert('Please enter a character name.'); modalCharNameInput.focus(); return; }
            if (isNaN(level) || level <= 0) { alert('Please enter a valid positive level.'); modalCharLevelInput.focus(); return; }
            if (!selectedClassValue) { alert('Please select a character class.'); modalCharClassSelect.focus(); return; }

            if (isMain) {
                characters.forEach(char => char.isMain = false);
            }

            const newCharacter = {
                id: generateId(), name, level, class: selectedClassValue, isMain,
                tasks: { daily: [], weekly: [] }
            };
            characters.push(newCharacter);

            if (isMain || characters.length === 1) {
                selectedCharacterId = newCharacter.id;
            }

            saveCharacters();
            renderCharactersInSidebar();
            characterModal.style.display = 'none';
        });
    }

    // --- Refresh Day/Week Button Logic ---
    if (refreshDayBtn) {
        refreshDayBtn.addEventListener('click', () => {
            const selectedChar = getSelectedCharacter();
            if (!selectedChar) {
                alert('Please select a character first.');
                return;
            }

            if (confirm(`Are you sure you want to uncheck all DAILY tasks for ${selectedChar.name}?`)) {
                // Ensure tasks and tasks.daily exist before trying to iterate
                if (selectedChar.tasks && selectedChar.tasks.daily && selectedChar.tasks.daily.length > 0) {
                    selectedChar.tasks.daily.forEach(task => {
                        task.completed = false;
                    });
                    saveCharacters();
                    displayTasksForSelectedCharacter();
                    alert(`Daily tasks for ${selectedChar.name} have been refreshed.`);
                } else {
                    alert(`${selectedChar.name} has no daily tasks to refresh.`);
                }
            }
        });
    }

    if (refreshWeekBtn) {
        refreshWeekBtn.addEventListener('click', () => {
            const selectedChar = getSelectedCharacter();
            if (!selectedChar) {
                alert('Please select a character first.');
                return;
            }

            if (confirm(`Are you sure you want to uncheck all WEEKLY tasks for ${selectedChar.name}?`)) {
                // Ensure tasks and tasks.weekly exist
                if (selectedChar.tasks && selectedChar.tasks.weekly && selectedChar.tasks.weekly.length > 0) {
                    selectedChar.tasks.weekly.forEach(task => {
                        task.completed = false;
                    });
                    saveCharacters();
                    displayTasksForSelectedCharacter();
                    alert(`Weekly tasks for ${selectedChar.name} have been refreshed.`);
                } else {
                    alert(`${selectedChar.name} has no weekly tasks to refresh.`);
                }
            }
        });
    }

    // --- Initial Application Load ---
    loadCharacters();
    renderCharactersInSidebar();
});
```
