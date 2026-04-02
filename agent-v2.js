const fs = require('fs');
const readline = require('readline');

const AGENT_ROLE = `
You are CodeBuddy v2, a beginner-friendly coding helper.
Your job is to explain programming concepts simply.
Rules:
- Be clear and short
- Use beginner language
- Ask a follow-up question if the user is vague
- Remember the recent conversation
`;

const knowledge = JSON.parse(fs.readFileSync('./knowledge.json', 'utf8'));
const memory = [];

function findTopic(question) {
  const q = question.toLowerCase();

  for (const key of Object.keys(knowledge)) {
    if (q.includes(key)) {
      return key;
    }
  }

  return null;
}

function generateReply(question) {
  const topic = findTopic(question);

  if (!topic) {
    return {
      answer: "I’m not fully sure what topic you mean yet. Are you asking about variables, functions, loops, arrays, objects, or an error message?",
      topic: null
    };
  }

  return {
    answer: knowledge[topic],
    topic
  };
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask() {
  rl.question('\nYour question (or type exit): ', (question) => {
    const clean = question.trim();

    if (clean.toLowerCase() === 'exit') {
      console.log('\nGoodbye from CodeBuddy v2.');
      console.log('Recent memory:', memory);
      rl.close();
      return;
    }

    const result = generateReply(clean);

    memory.push(clean);
    if (memory.length > 5) {
      memory.shift();
    }

    console.log('\nAgent role:');
    console.log(AGENT_ROLE.trim());

    console.log('\nAnswer:');
    console.log(result.answer);

    if (result.topic) {
      console.log(`\nDetected topic: ${result.topic}`);
    }

    console.log('\nMemory so far:');
    console.log(memory);

    ask();
  });
}

console.log('CodeBuddy v2 is ready.');
console.log('It can remember recent questions and use a knowledge file.');
ask();
