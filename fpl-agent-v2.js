const fs = require('fs');
const axios = require('axios');

const WATCHLIST_FILE = './fpl-watchlist.json';
const FPL_API = 'https://fantasy.premierleague.com/api/bootstrap-static/';

function loadWatchlist() {
  try {
    const data = fs.readFileSync(WATCHLIST_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function fetchFplData() {
  const response = await axios.get(FPL_API, {
    headers: {
      'User-Agent': 'Mozilla/5.0'
    }
  });
  return response.data;
}

function getPositionName(elementTypeId, elementTypes) {
  const found = elementTypes.find(t => t.id === elementTypeId);
  return found ? found.singular_name_short : 'UNK';
}

function getTeamName(teamId, teams) {
  const found = teams.find(t => t.id === teamId);
  return found ? found.name : 'Unknown';
}

function printPlayer(player, teams, elementTypes, index = null) {
  const position = getPositionName(player.element_type, elementTypes);
  const team = getTeamName(player.team, teams);
  const numberLabel = index !== null ? `#${index} ` : '';

  console.log(`${numberLabel}${player.first_name} ${player.second_name} (${team})`);
  console.log(`position: ${position}`);
  console.log(`price: £${(player.now_cost / 10).toFixed(1)}m`);
  console.log(`form: ${player.form}`);
  console.log(`total points: ${player.total_points}`);
  console.log(`minutes: ${player.minutes}`);
  console.log(`goals: ${player.goals_scored}`);
  console.log(`assists: ${player.assists}`);
  console.log(`selected by: ${player.selected_by_percent}%`);
  console.log(`status: ${player.status}`);
  console.log('');
}

async function listTopByForm(positionFilter = null) {
  const data = await fetchFplData();

  let players = data.elements;

  if (positionFilter) {
    const positionUpper = positionFilter.toUpperCase();
    players = players.filter(player =>
      getPositionName(player.element_type, data.element_types) === positionUpper
    );
  }

  players.sort((a, b) => Number(b.form) - Number(a.form));

  const top10 = players.slice(0, 10);

  console.log(`Top players by form${positionFilter ? ` (${positionFilter.toUpperCase()})` : ''}:\n`);
  top10.forEach((player, i) => printPlayer(player, data.teams, data.element_types, i + 1));
}

async function searchPlayer(nameQuery) {
  if (!nameQuery || !nameQuery.trim()) {
    console.log('Usage: node fpl-agent-v2.js search "saka"');
    return;
  }

  const data = await fetchFplData();
  const q = nameQuery.toLowerCase();

  const matches = data.elements.filter(player => {
    const fullName = `${player.first_name} ${player.second_name}`.toLowerCase();
    return fullName.includes(q) || player.second_name.toLowerCase().includes(q);
  });

  if (matches.length === 0) {
    console.log('No matching players found.');
    return;
  }

  console.log(`Search results for "${nameQuery}":\n`);
  matches.slice(0, 10).forEach((player, i) => printPlayer(player, data.teams, data.element_types, i + 1));
}

async function topPoints(positionFilter = null) {
  const data = await fetchFplData();

  let players = data.elements;

  if (positionFilter) {
    const positionUpper = positionFilter.toUpperCase();
    players = players.filter(player =>
      getPositionName(player.element_type, data.element_types) === positionUpper
    );
  }

  players.sort((a, b) => b.total_points - a.total_points);

  const top10 = players.slice(0, 10);

  console.log(`Top players by total points${positionFilter ? ` (${positionFilter.toUpperCase()})` : ''}:\n`);
  top10.forEach((player, i) => printPlayer(player, data.teams, data.element_types, i + 1));
}

async function showWatchlistWithLiveData() {
  const watchlist = loadWatchlist();

  if (watchlist.length === 0) {
    console.log('Your watchlist is empty.');
    return;
  }

  const data = await fetchFplData();

  console.log('Your watchlist with live FPL data:\n');

  watchlist.forEach((savedPlayer, i) => {
    const livePlayer = data.elements.find(player => {
      const fullName = `${player.first_name} ${player.second_name}`.toLowerCase();
      return fullName === savedPlayer.name.toLowerCase();
    });

    console.log(`#${i + 1} ${savedPlayer.name} (${savedPlayer.team})`);
    console.log(`watchlist status: ${savedPlayer.status}`);
    console.log(`your note: ${savedPlayer.note || 'none'}`);

    if (livePlayer) {
      console.log(`live price: £${(livePlayer.now_cost / 10).toFixed(1)}m`);
      console.log(`live form: ${livePlayer.form}`);
      console.log(`live total points: ${livePlayer.total_points}`);
      console.log(`live goals: ${livePlayer.goals_scored}`);
      console.log(`live assists: ${livePlayer.assists}`);
      console.log(`live selected by: ${livePlayer.selected_by_percent}%`);
      console.log(`live status: ${livePlayer.status}`);
    } else {
      console.log('live data: not found');
    }

    console.log('');
  });
}

function showHelp() {
  console.log(`
FPLBuddy v2 commands:

node fpl-agent-v2.js search "saka"
node fpl-agent-v2.js form
node fpl-agent-v2.js form MID
node fpl-agent-v2.js points
node fpl-agent-v2.js points FWD
node fpl-agent-v2.js watchlist
node fpl-agent-v2.js help
`);
}

async function main() {
  const command = process.argv[2];
  const arg1 = process.argv.slice(3).join(' ');

  try {
    if (!command || command === 'help') {
      showHelp();
    } else if (command === 'search') {
      await searchPlayer(arg1);
    } else if (command === 'form') {
      await listTopByForm(process.argv[3] || null);
    } else if (command === 'points') {
      await topPoints(process.argv[3] || null);
    } else if (command === 'watchlist') {
      await showWatchlistWithLiveData();
    } else {
      console.log('Unknown command.');
      showHelp();
    }
  } catch (error) {
    console.log('Something went wrong while calling the FPL API.');
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
    } else {
      console.log(error.message);
    }
  }
}

main();
