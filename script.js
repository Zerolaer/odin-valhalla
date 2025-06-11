document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const characterForm = document.getElementById('create-character-form');
    const charNameInput = document.getElementById('char-name');
    const charLevelInput = document.getElementById('char-level');
    const charClassInput = document.getElementById('char-class');
    const charactersListDiv = document.getElementById('characters-list');

    const tasksSectionDiv = document.getElementById('tasks-section');
    // Ensure this h2 exists in index.html with this ID for the title like "Tasks for X"
    const tasksSectionTitle = document.getElementById('tasks-section-title');

    const createTaskForm = document.getElementById('create-task-form');
    const taskDescInput = document.getElementById('task-desc');
    const taskTypeSelect = document.getElementById('task-type');
    const dailyTasksListUl = document.querySelector('#daily-tasks-list ul');
    const weeklyTasksListUl = document.querySelector('#weekly-tasks-list ul');

    let characters = [];
    let selectedCharacterId = null;

    // --- ID Generation ---
    function generateId() {
        // More robust ID generation
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    // --- Local Storage ---
    function saveCharacters() {
        localStorage.setItem('odinValhallaTasks_characters', JSON.stringify(characters));
    }

    function loadCharacters() {
        const storedCharacters = localStorage.getItem('odinValhallaTasks_characters');
        if (storedCharacters) {
            try {
                characters = JSON.parse(storedCharacters);
                // Data migration/ensure structure integrity for older data
                characters.forEach(char => {
                    if (!char.tasks) {
                        char.tasks = { daily: [], weekly: [] };
                    }
                    if (!char.tasks.daily) char.tasks.daily = [];
                    if (!char.tasks.weekly) char.tasks.weekly = [];
                    char.tasks.daily.forEach(task => { if(!task.id) task.id = generateId(); });
                    char.tasks.weekly.forEach(task => { if(!task.id) task.id = generateId(); });
                });
            } catch (error) {
                console.error("Error parsing characters from local storage: ", error);
                localStorage.removeItem('odinValhallaTasks_characters'); // Clear corrupted data
                characters = []; // Start fresh
                alert('Could not load saved data. It might be corrupted. Starting fresh.');
            }
        }
    }

    // --- Character Rendering & Selection ---
    function renderCharacters() {
        charactersListDiv.innerHTML = ''; // Clear existing list
        if (characters.length === 0) {
            charactersListDiv.innerHTML = '<p>No characters created yet. Create one above!</p>';
            tasksSectionDiv.style.display = 'none'; // Hide tasks section
            selectedCharacterId = null; // Reset selected ID
            displayTasksForSelectedCharacter(); // Clear task display just in case
            return;
        }

        characters.forEach(char => {
            const charDiv = document.createElement('div');
            charDiv.classList.add('character-item');
            charDiv.dataset.id = char.id;
            charDiv.textContent = `${char.name} (Lvl: ${char.level}, Class: ${char.class})`;

            if (char.id === selectedCharacterId) {
                charDiv.classList.add('selected');
            }

            charDiv.addEventListener('click', () => {
                selectedCharacterId = char.id;
                // Re-render all characters to update selection style AND
                // this will trigger task display update in the logic below
                renderCharacters();
            });
            charactersListDiv.appendChild(charDiv);
        });

        // Update task display based on current selection
        const currentSelectedChar = getSelectedCharacter();
        if (currentSelectedChar) {
            tasksSectionDiv.style.display = 'block';
            if(tasksSectionTitle) tasksSectionTitle.textContent = `Tasks for ${currentSelectedChar.name}`;
            else console.warn("tasks-section-title element not found for updating.");
            displayTasksForSelectedCharacter();
        } else {
            tasksSectionDiv.style.display = 'none';
            if(tasksSectionTitle) tasksSectionTitle.textContent = 'Tasks'; // Reset title
            else console.warn("tasks-section-title element not found for resetting.");
            displayTasksForSelectedCharacter(); // This will clear the task lists
        }
    }

    function getSelectedCharacter() {
        if (!selectedCharacterId) return null;
        return characters.find(char => char.id === selectedCharacterId);
    }

    // --- Character Creation ---
    characterForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const name = charNameInput.value.trim();
        const level = parseInt(charLevelInput.value);
        const charClass = charClassInput.value.trim();

        if (name && !isNaN(level) && level > 0 && charClass) {
            const newCharacter = {
                id: generateId(),
                name: name,
                level: level,
                class: charClass,
                tasks: { daily: [], weekly: [] } // Initialize tasks structure
            };
            characters.push(newCharacter);
            selectedCharacterId = newCharacter.id; // Auto-select new character
            saveCharacters();
            renderCharacters(); // This will re-render characters and update task display
            characterForm.reset(); // Clear form
        } else {
            alert('Please fill in all character fields correctly (Level must be a positive number).');
        }
    });

    // --- Task Rendering ---
    function displayTasksForSelectedCharacter() {
        const selectedChar = getSelectedCharacter();

        // Always clear task lists first
        dailyTasksListUl.innerHTML = '';
        weeklyTasksListUl.innerHTML = '';

        if (!selectedChar) {
            // Update title and show placeholder messages in task lists
            if(tasksSectionTitle) tasksSectionTitle.textContent = 'Select a Character';
            dailyTasksListUl.innerHTML = '<li>Select a character to view daily tasks.</li>';
            weeklyTasksListUl.innerHTML = '<li>Select a character to view weekly tasks.</li>';
            return;
        }

        // Update task section title for the selected character
         if(tasksSectionTitle) tasksSectionTitle.textContent = `Tasks for ${selectedChar.name}`;


        // Helper to create task LI element
        const createTaskElement = (task, taskListArray) => { // taskListArray is the actual array (e.g. selectedChar.tasks.daily)
            const li = document.createElement('li');
            li.dataset.taskId = task.id;

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = task.completed;
            checkbox.addEventListener('change', () => {
                task.completed = checkbox.checked;
                saveCharacters();
                // Apply/remove strikethrough style directly
                li.style.textDecoration = task.completed ? 'line-through' : 'none';
                li.style.opacity = task.completed ? '0.7' : '1';
                descriptionSpan.classList.toggle('completed', task.completed);
            });
            // Initial style for completed tasks
            if (task.completed) {
                li.style.textDecoration = 'line-through';
                li.style.opacity = '0.7';
            }

            const descriptionSpan = document.createElement('span');
            descriptionSpan.textContent = task.description;
            descriptionSpan.classList.add('task-description');
            if (task.completed) descriptionSpan.classList.add('completed');


            const actionsDiv = document.createElement('div');
            actionsDiv.classList.add('task-actions');

            const renameButton = document.createElement('button');
            renameButton.textContent = 'Rename';
            renameButton.classList.add('rename-btn');
            renameButton.type = 'button'; // Important for forms
            renameButton.addEventListener('click', () => {
                const newDescription = prompt('Enter new task description:', task.description);
                if (newDescription && newDescription.trim() !== '') {
                    task.description = newDescription.trim();
                    saveCharacters();
                    displayTasksForSelectedCharacter(); // Re-render tasks for this character
                }
            });

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.classList.add('delete-btn');
            deleteButton.type = 'button'; // Important for forms
            deleteButton.addEventListener('click', () => {
                if (confirm(`Are you sure you want to delete task: "${task.description}"?`)) {
                    // Remove task from the specific array (daily or weekly)
                    const index = taskListArray.findIndex(t => t.id === task.id);
                    if (index > -1) {
                        taskListArray.splice(index, 1);
                        saveCharacters();
                        displayTasksForSelectedCharacter(); // Re-render tasks
                    }
                }
            });

            actionsDiv.appendChild(renameButton);
            actionsDiv.appendChild(deleteButton);

            li.appendChild(checkbox);
            li.appendChild(descriptionSpan);
            li.appendChild(actionsDiv);
            return li;
        };

        // Populate Daily Tasks
        if (selectedChar.tasks.daily.length === 0) {
            dailyTasksListUl.innerHTML = '<li>No daily tasks yet. Add one below!</li>';
        } else {
            selectedChar.tasks.daily.forEach(task => {
                dailyTasksListUl.appendChild(createTaskElement(task, selectedChar.tasks.daily));
            });
        }

        // Populate Weekly Tasks
        if (selectedChar.tasks.weekly.length === 0) {
            weeklyTasksListUl.innerHTML = '<li>No weekly tasks yet. Add one below!</li>';
        } else {
            selectedChar.tasks.weekly.forEach(task => {
                weeklyTasksListUl.appendChild(createTaskElement(task, selectedChar.tasks.weekly));
            });
        }
    }

    // --- Task Creation ---
    createTaskForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const selectedChar = getSelectedCharacter();
        if (!selectedChar) {
            alert('Please select a character before adding tasks.');
            return;
        }

        const description = taskDescInput.value.trim();
        const type = taskTypeSelect.value; // 'daily' or 'weekly'

        if (description) {
            const newTask = {
                id: generateId(),
                description: description,
                completed: false
            };

            if (type === 'daily') {
                selectedChar.tasks.daily.push(newTask);
            } else { // weekly
                selectedChar.tasks.weekly.push(newTask);
            }
            saveCharacters();
            displayTasksForSelectedCharacter(); // Update the task list display
            taskDescInput.value = ''; // Clear only the description input
            taskDescInput.focus();
        } else {
            alert('Please enter a task description.');
        }
    });

    // --- Initial Setup ---
    // Basic check for critical elements to prevent silent failures
    if (!characterForm || !charactersListDiv || !tasksSectionDiv || !createTaskForm || !dailyTasksListUl || !weeklyTasksListUl) {
        console.error("One or more critical HTML elements are missing. Application might not work as expected. Please check your index.html structure and element IDs.");
        alert("Error: Essential page elements seem to be missing. The application may not function correctly.");
        // Depending on how critical, you might choose to return here and not initialize further.
    }
    if (!tasksSectionTitle) {
         console.warn("Element with ID 'tasks-section-title' not found. Task section titles will not be updated.");
    }


    loadCharacters(); // Load characters (and their tasks)
    renderCharacters(); // Render characters and tasks for initially selected char (if any)

});
