const fs = require('fs');

const WATCHLIST_FILE = './fpl-watchlist.json';

function loadPlayers() {
  try {
    const data = fs.readFileSync(WATCHLIST_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function savePlayers(players) {
  fs.writeFileSync(WATCHLIST_FILE, JSON.stringify(players, null, 2));
}

function normalizePosition(position) {
  const p = position.toUpperCase();

  if (['GK', 'DEF', 'MID', 'FWD'].includes(p)) return p;
  return 'UNK';
}

function addPlayer(name, team, position, note) {
  if (!name || !team || !position) {
    console.log('Usage: node fpl-agent.js add "Player Name" "Team" "Position" "Optional note"');
    return;
  }

  const players = loadPlayers();

  const newPlayer = {
    id: Date.now(),
    name: name.trim(),
    team: team.trim(),
    position: normalizePosition(position),
    note: note ? note.trim() : '',
    status: 'watchlist',
    createdAt: new Date().toISOString()
  };

  players.push(newPlayer);
  savePlayers(players);

  console.log('Player added to watchlist:\n');
  console.log(`#${players.length} ${newPlayer.name} (${newPlayer.team})`);
  console.log(`position: ${newPlayer.position}`);
  console.log(`status: ${newPlayer.status}`);
  console.log(`note: ${newPlayer.note || 'none'}`);
}

function listPlayers(filter) {
  const players = loadPlayers();

  let filtered = players;

  if (filter) {
    const f = filter.toUpperCase();

    if (['GK', 'DEF', 'MID', 'FWD'].includes(f)) {
      filtered = players.filter(player => player.position === f);
    } else {
      filtered = players.filter(
        player =>
          player.status.toLowerCase() === filter.toLowerCase() ||
          player.team.toLowerCase() === filter.toLowerCase()
      );
    }
  }

  if (filtered.length === 0) {
    console.log('No players found.');
    return;
  }

  console.log('FPL watchlist:\n');
  filtered.forEach((player) => {
    const originalIndex = players.findIndex(p => p.id === player.id) + 1;

    console.log(`#${originalIndex} ${player.name} (${player.team})`);
    console.log(`position: ${player.position}`);
    console.log(`status: ${player.status}`);
    console.log(`note: ${player.note || 'none'}`);
    console.log(`added: ${player.createdAt}\n`);
  });
}

function updateNote(playerNumber, newNote) {
  const players = loadPlayers();
  const index = Number(playerNumber) - 1;

  if (Number.isNaN(index) || index < 0 || index >= players.length) {
    console.log('Invalid player number.');
    return;
  }

  players[index].note = newNote.trim();
  savePlayers(players);

  console.log(`Updated note for #${playerNumber}: ${players[index].name}`);
}

function setStatus(playerNumber, newStatus) {
  const players = loadPlayers();
  const index = Number(playerNumber) - 1;

  if (Number.isNaN(index) || index < 0 || index >= players.length) {
    console.log('Invalid player number.');
    return;
  }

  players[index].status = newStatus;
  savePlayers(players);

  console.log(`Updated status for #${playerNumber}: ${players[index].name} -> ${newStatus}`);
}

function showHelp() {
  console.log(`
FPLBuddy v1 commands:

node fpl-agent.js add "Bukayo Saka" "Arsenal" "MID" "Monitor fixtures"
node fpl-agent.js add "Erling Haaland" "Man City" "FWD" "Captain option"
node fpl-agent.js list
node fpl-agent.js list MID
node fpl-agent.js list Arsenal
node fpl-agent.js list watchlist
node fpl-agent.js note 1 "Great next 3 fixtures"
node fpl-agent.js status 1 bought
node fpl-agent.js status 2 avoid
node fpl-agent.js help
`);
}

const command = process.argv[2];

if (!command || command === 'help') {
  showHelp();
} else if (command === 'add') {
  const name = process.argv[3];
  const team = process.argv[4];
  const position = process.argv[5];
  const note = process.argv.slice(6).join(' ');
  addPlayer(name, team, position, note);
} else if (command === 'list') {
  const filter = process.argv[3];
  listPlayers(filter);
} else if (command === 'note') {
  const playerNumber = process.argv[3];
  const newNote = process.argv.slice(4).join(' ');
  updateNote(playerNumber, newNote);
} else if (command === 'status') {
  const playerNumber = process.argv[3];
  const newStatus = process.argv[4];
  setStatus(playerNumber, newStatus);
} else {
  console.log('Unknown command.');
  showHelp();
}
