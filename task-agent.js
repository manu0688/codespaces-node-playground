const fs = require('fs');
const readline = require('readline');

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

function splitTasks(input) {
  return input
    .split(',')
    .map(task => task.trim())
    .filter(Boolean);
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

function createTaskObjects(rawInput) {
  const items = splitTasks(rawInput);

  return items.map((text, index) => {
    const category = detectCategory(text);
    const priority = detectPriority(text);

    return {
      id: Date.now() + index,
      text,
      category,
      priority,
      nextStep: suggestNextStep(text, category),
      createdAt: new Date().toISOString(),
      done: false
    };
  });
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('TaskBuddy is ready.');
console.log('Type a messy list of tasks separated by commas.\n');

rl.question('Your tasks: ', (input) => {
  const existingTasks = loadTasks();
  const newTasks = createTaskObjects(input);
  const allTasks = [...existingTasks, ...newTasks];

  saveTasks(allTasks);

  console.log('\nSaved tasks:\n');
  newTasks.forEach(task => {
    console.log(`- ${task.text}`);
    console.log(`  category: ${task.category}`);
    console.log(`  priority: ${task.priority}`);
    console.log(`  next step: ${task.nextStep}\n`);
  });

  console.log(`Total tasks stored: ${allTasks.length}`);
  rl.close();
});
