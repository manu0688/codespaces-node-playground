const fs = require('fs');

const TASKS_FILE = './tasks.json';

function loadTasks() {
  try {
    const data = fs.readFileSync(TASKS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveTasks(tasks) {
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));
}

function detectCategory(task) {
  const t = task.toLowerCase();

  if (t.includes('gym') || t.includes('run') || t.includes('workout')) return 'health';
  if (t.includes('buy') || t.includes('shop') || t.includes('grocer')) return 'shopping';
  if (t.includes('call') || t.includes('email') || t.includes('reply')) return 'communication';
  if (t.includes('deck') || t.includes('report') || t.includes('meeting') || t.includes('sql')) return 'work';
  if (t.includes('fpl') || t.includes('football') || t.includes('match')) return 'football';

  return 'general';
}

function detectPriority(task) {
  const t = task.toLowerCase();

  if (t.includes('today') || t.includes('urgent') || t.includes('asap') || t.includes('now')) return 'high';
  if (t.includes('tomorrow') || t.includes('this week')) return 'medium';

  return 'low';
}

function suggestNextStep(task, category) {
  if (category === 'communication') return 'Draft the message or make the call.';
  if (category === 'shopping') return 'Make a short list before buying.';
  if (category === 'health') return 'Schedule a time slot for it.';
  if (category === 'work') return 'Break it into the first concrete work step.';
  if (category === 'football') return 'Check fixtures, deadlines, or player news first.';

  return 'Define the first small action.';
}

function addTask(taskText) {
  if (!taskText || !taskText.trim()) {
    console.log('Please provide a task to add.');
    return;
  }

  const tasks = loadTasks();
  const category = detectCategory(taskText);
  const priority = detectPriority(taskText);

  const newTask = {
    id: Date.now(),
    text: taskText.trim(),
    category,
    priority,
    nextStep: suggestNextStep(taskText, category),
    createdAt: new Date().toISOString(),
    done: false
  };

  tasks.push(newTask);
  saveTasks(tasks);

  console.log('Task added:\n');
  console.log(`#${tasks.length} ${newTask.text}`);
  console.log(`category: ${newTask.category}`);
  console.log(`priority: ${newTask.priority}`);
  console.log(`next step: ${newTask.nextStep}`);
}

function listTasks(filterCategory) {
  const tasks = loadTasks();

  let filteredTasks = tasks;
  if (filterCategory) {
    filteredTasks = tasks.filter(
      task => task.category.toLowerCase() === filterCategory.toLowerCase()
    );
  }

  if (filteredTasks.length === 0) {
    console.log('No tasks found.');
    return;
  }

  console.log('Your tasks:\n');
  filteredTasks.forEach((task, index) => {
    const originalIndex = tasks.findIndex(t => t.id === task.id) + 1;
    const status = task.done ? 'DONE' : 'TODO';

    console.log(`#${originalIndex} [${status}] ${task.text}`);
    console.log(`category: ${task.category}`);
    console.log(`priority: ${task.priority}`);
    console.log(`next step: ${task.nextStep}`);
    console.log(`created: ${task.createdAt}\n`);
  });
}

function markDone(taskNumber) {
  const tasks = loadTasks();
  const index = Number(taskNumber) - 1;

  if (Number.isNaN(index) || index < 0 || index >= tasks.length) {
    console.log('Invalid task number.');
    return;
  }

  tasks[index].done = true;
  saveTasks(tasks);

  console.log(`Marked task #${taskNumber} as done: ${tasks[index].text}`);
}

function showHelp() {
  console.log(`
TaskBuddy v2 commands:

node task-agent-v2.js add "finish sql report today"
node task-agent-v2.js list
node task-agent-v2.js list work
node task-agent-v2.js done 1
node task-agent-v2.js help
`);
}

const command = process.argv[2];
const value = process.argv.slice(3).join(' ');

if (!command || command === 'help') {
  showHelp();
} else if (command === 'add') {
  addTask(value);
} else if (command === 'list') {
  listTasks(value || null);
} else if (command === 'done') {
  markDone(value);
} else {
  console.log('Unknown command.');
  showHelp();
}
