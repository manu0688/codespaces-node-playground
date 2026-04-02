const readline = require('readline');

const AGENT_ROLE = `
You are CodeBuddy, a beginner-friendly coding helper.
Your job is to explain programming questions in simple language.
Rules:
- Be short and clear
- Avoid jargon unless you explain it
- Give one example when useful
- If the user asks about an error, explain likely cause and first fix
`;

function generateReply(question) {
  const q = question.toLowerCase();

  if (q.includes('variable')) {
    return `A variable is a named container for a value. Example: in JavaScript, "let age = 25" stores the number 25 in a variable called age.`;
  }

  if (q.includes('function')) {
    return `A function is a reusable block of code. You give it a job, and it runs that job when called. Example: a function can add two numbers or format text.`;
  }

  if (q.includes('loop')) {
    return `A loop repeats code until a condition changes. Use it when you want to process many items or repeat a task without copying code.`;
  }

  if (q.includes('error')) {
    return `An error usually means the program hit something it could not understand or execute. First read the exact error message, then check the line it points to.`;
  }

  if (q.includes('array')) {
    return `An array is a list of values stored in one variable. Example: ["apple", "banana", "orange"] is an array of strings.`;
  }

  return `I am CodeBuddy. I explain coding in simple terms. Try asking about variables, functions, loops, arrays, or errors.`;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('CodeBuddy agent is ready.');
console.log('Ask a beginner coding question.\n');

rl.question('Your question: ', (question) => {
  console.log('\nAgent role:');
  console.log(AGENT_ROLE.trim());
  console.log('\nAnswer:');
  console.log(generateReply(question));
  rl.close();
});
