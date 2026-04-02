#!/usr/bin/env node
const axios = require('axios');

const BOOTSTRAP_URL = 'https://fantasy.premierleague.com/api/bootstrap-static/';
const FIXTURES_URL = 'https://fantasy.premierleague.com/api/fixtures/';

async function fetchBootstrap() {
  const response = await axios.get(BOOTSTRAP_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  return response.data;
}

async function fetchFixtures() {
  const response = await axios.get(FIXTURES_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  return response.data;
}

function getTeamName(teamId, teams) {
  const team = teams.find(t => t.id === teamId);
  return team ? team.name : 'Unknown';
}

function getTeamByName(name, teams) {
  return teams.find(team =>
    team.name.toLowerCase() === name.toLowerCase() ||
    team.short_name.toLowerCase() === name.toLowerCase()
  );
}

function getPositionName(elementTypeId, elementTypes) {
  const found = elementTypes.find(t => t.id === elementTypeId);
  return found ? found.singular_name_short : 'UNK';
}

function getUpcomingFixturesForTeam(teamId, fixtures, teams, limit = 5) {
  const upcoming = fixtures
    .filter(f => !f.finished && (f.team_h === teamId || f.team_a === teamId))
    .sort((a, b) => (a.event || 999) - (b.event || 999))
    .slice(0, limit)
    .map(f => {
      const isHome = f.team_h === teamId;
      const opponentId = isHome ? f.team_a : f.team_h;
      const difficulty = isHome ? f.team_h_difficulty : f.team_a_difficulty;

      return {
        event: f.event,
        opponent: getTeamName(opponentId, teams),
        homeAway: isHome ? 'H' : 'A',
        difficulty
      };
    });

  return upcoming;
}

async function showFixtures(teamName) {
  if (!teamName) {
    console.log('Usage: fplbuddy fixtures Arsenal');
    return;
  }

  const bootstrap = await fetchBootstrap();
  const fixtures = await fetchFixtures();

  const team = getTeamByName(teamName, bootstrap.teams);
  if (!team) {
    console.log('Team not found.');
    return;
  }

  const upcoming = getUpcomingFixturesForTeam(team.id, fixtures, bootstrap.teams, 5);
  if (upcoming.length === 0) {
    console.log('No upcoming fixtures found.');
    return;
  }

  console.log(`Next fixtures for ${team.name}:\n`);
  upcoming.forEach(f => {
    console.log(`GW${f.event}: ${f.opponent} (${f.homeAway}) | difficulty ${f.difficulty}`);
  });
}

async function showTicker() {
  const bootstrap = await fetchBootstrap();
  const fixtures = await fetchFixtures();

  const teamRuns = bootstrap.teams.map(team => {
    const upcoming = getUpcomingFixturesForTeam(team.id, fixtures, bootstrap.teams, 5);
    const avgDifficulty =
      upcoming.length > 0
        ? upcoming.reduce((sum, f) => sum + f.difficulty, 0) / upcoming.length
        : 99;

    return {
      team: team.name,
      avgDifficulty: avgDifficulty.toFixed(2),
      run: upcoming.map(f => `${f.opponent}(${f.homeAway})[${f.difficulty}]`).join(', ')
    };
  });

  teamRuns.sort((a, b) => Number(a.avgDifficulty) - Number(b.avgDifficulty));

  console.log('Best 10 fixture runs over next 5 matches:\n');
  teamRuns.slice(0, 10).forEach((team, i) => {
    console.log(`#${i + 1} ${team.team}`);
    console.log(`avg difficulty: ${team.avgDifficulty}`);
    console.log(`run: ${team.run}\n`);
  });
}

function isAvailable(player) {
  return player.status === 'a' && (
    player.chance_of_playing_next_round === null ||
    player.chance_of_playing_next_round >= 75
  );
}

function getBuyHoldSellLabel(form, fixtureScore) {
  const f = Number(form || 0);
  const fix = Number(fixtureScore || 5);

  if (f >= 7 && fix <= 3) return 'buy';
  if (f <= 3 && fix >= 3.5) return 'sell';
  return 'hold';
}

function parseBudget(raw) {
  if (!raw) return null;
  const n = Number(raw);
  return Number.isNaN(n) ? null : n;
}

async function suggestTransfers(positionFilter, budgetRaw) {
  if (!positionFilter) {
    console.log('Usage: fplbuddy suggest MID [maxPrice]');
    return;
  }

  const maxBudget = parseBudget(budgetRaw);
  const bootstrap = await fetchBootstrap();
  const fixtures = await fetchFixtures();

  let players = bootstrap.elements.filter(player =>
    getPositionName(player.element_type, bootstrap.element_types) === positionFilter.toUpperCase()
  );

  players = players.map(player => {
    const upcoming = getUpcomingFixturesForTeam(player.team, fixtures, bootstrap.teams, 3);
    const fixtureScore =
      upcoming.length > 0
        ? upcoming.reduce((sum, f) => sum + f.difficulty, 0) / upcoming.length
        : 5;

    const formScore = Number(player.form || 0);
    const pointsScore = Number(player.total_points || 0) / 20;
    const finalScore = (formScore * 0.6) + (pointsScore * 0.3) + ((6 - fixtureScore) * 0.8);

    const price = player.now_cost / 10;

    return {
      raw: player,
      name: `${player.first_name} ${player.second_name}`,
      team: getTeamName(player.team, bootstrap.teams),
      price: price.toFixed(1),
      numericPrice: price,
      form: player.form,
      totalPoints: player.total_points,
      selectedBy: player.selected_by_percent,
      status: player.status,
      chanceNext: player.chance_of_playing_next_round,
      fixtureScore: fixtureScore.toFixed(2),
      finalScore: finalScore.toFixed(2)
    };
  });

  players = players.filter(p => isAvailable(p.raw));

  if (maxBudget !== null) {
    players = players.filter(p => p.numericPrice <= maxBudget);
  }

  players = players
    .sort((a, b) => Number(b.finalScore) - Number(a.finalScore))
    .slice(0, 10);

  console.log(`Top transfer suggestions for ${positionFilter.toUpperCase()}${maxBudget ? ` (≤ £${maxBudget.toFixed(1)}m)` : ''}:\n`);
  players.forEach((player, i) => {
    const label = getBuyHoldSellLabel(player.form, player.fixtureScore);

    const chance =
      player.chanceNext !== null && player.chanceNext !== undefined
        ? player.chanceNext
        : 'n/a';

    console.log(`#${i + 1} ${player.name} (${player.team})`);
    console.log(`price: £${player.price}m`);
    console.log(`form: ${player.form}`);
    console.log(`total points: ${player.totalPoints}`);
    console.log(`selected by: ${player.selectedBy}%`);
    console.log(`next 3 avg difficulty: ${player.fixtureScore}`);
    console.log(`status: ${player.status} (chance next: ${chance}%)`);
    console.log(`suggestion score: ${player.finalScore}`);
    console.log(`label: ${label}\n`);
  });
}

async function captainSuggestions() {
  const bootstrap = await fetchBootstrap();
  const fixtures = await fetchFixtures();

  const attackingPositions = ['MID', 'FWD'];
  let players = bootstrap.elements.filter(player =>
    attackingPositions.includes(
      getPositionName(player.element_type, bootstrap.element_types)
    )
  );

  players = players.map(player => {
    const upcoming = getUpcomingFixturesForTeam(player.team, fixtures, bootstrap.teams, 1);
    const fixtureScore =
      upcoming.length > 0 ? upcoming[0].difficulty : 3;

    const formScore = Number(player.form || 0);
    const pointsScore = Number(player.total_points || 0) / 20;
    const finalScore = (formScore * 0.7) + (pointsScore * 0.2) + ((6 - fixtureScore) * 1.0);

    return {
      raw: player,
      name: `${player.first_name} ${player.second_name}`,
      team: getTeamName(player.team, bootstrap.teams),
      position: getPositionName(player.element_type, bootstrap.element_types),
      price: (player.now_cost / 10).toFixed(1),
      form: player.form,
      totalPoints: player.total_points,
      selectedBy: player.selected_by_percent,
      status: player.status,
      chanceNext: player.chance_of_playing_next_round,
      fixtureScore,
      finalScore: finalScore.toFixed(2)
    };
  });

  players = players.filter(p => isAvailable(p.raw));

  players.sort((a, b) => Number(b.finalScore) - Number(a.finalScore));

  const top5 = players.slice(0, 5);

  console.log('Captain suggestions for next GW (form + fixture + availability):\n');
  top5.forEach((p, i) => {
    const chance =
      p.chanceNext !== null && p.chanceNext !== undefined
        ? p.chanceNext
        : 'n/a';

    console.log(`#${i + 1} ${p.name} (${p.team}) - ${p.position}`);
    console.log(`price: £${p.price}m`);
    console.log(`form: ${p.form}`);
    console.log(`total points: ${p.totalPoints}`);
    console.log(`selected by: ${p.selectedBy}%`);
    console.log(`next fixture difficulty: ${p.fixtureScore}`);
    console.log(`status: ${p.status} (chance next: ${chance}%)`);
    console.log(`captain score: ${p.finalScore}\n`);
  });
}

function showHelp() {
  console.log(`
FPLBuddy v4 commands:

Fixtures & ticker
  fplbuddy fixtures Arsenal
  fplbuddy ticker

Transfer suggestions
  fplbuddy suggest MID
  fplbuddy suggest MID 8.5
  fplbuddy suggest FWD 11.0

Captain picks
  fplbuddy captain

Help
  fplbuddy help
`);
}

async function main() {
  const command = process.argv[2];

  try {
    if (!command || command === 'help') {
      showHelp();
    } else if (command === 'fixtures') {
      const arg = process.argv.slice(3).join(' ');
      await showFixtures(arg);
    } else if (command === 'ticker') {
      await showTicker();
    } else if (command === 'suggest') {
      const position = process.argv[3];
      const budget = process.argv[4];
      await suggestTransfers(position, budget);
    } else if (command === 'captain') {
      await captainSuggestions();
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