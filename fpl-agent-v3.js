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

function getTeamByName(name, teams) {
  return teams.find(team =>
    team.name.toLowerCase() === name.toLowerCase() ||
    team.short_name.toLowerCase() === name.toLowerCase()
  );
}

function getTeamName(teamId, teams) {
  const team = teams.find(t => t.id === teamId);
  return team ? team.name : 'Unknown';
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
    console.log('Usage: node fpl-agent-v3.js fixtures Arsenal');
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

async function suggestTransfers(positionFilter) {
  if (!positionFilter) {
    console.log('Usage: node fpl-agent-v3.js suggest MID');
    return;
  }

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

    return {
      name: `${player.first_name} ${player.second_name}`,
      team: getTeamName(player.team, bootstrap.teams),
      price: (player.now_cost / 10).toFixed(1),
      form: player.form,
      totalPoints: player.total_points,
      selectedBy: player.selected_by_percent,
      status: player.status,
      fixtureScore: fixtureScore.toFixed(2),
      finalScore: finalScore.toFixed(2)
    };
  });

  players = players
    .filter(player => player.status === 'a')
    .sort((a, b) => Number(b.finalScore) - Number(a.finalScore))
    .slice(0, 10);

  console.log(`Top transfer suggestions for ${positionFilter.toUpperCase()}:\n`);
  players.forEach((player, i) => {
    console.log(`#${i + 1} ${player.name} (${player.team})`);
    console.log(`price: £${player.price}m`);
    console.log(`form: ${player.form}`);
    console.log(`total points: ${player.totalPoints}`);
    console.log(`selected by: ${player.selectedBy}%`);
    console.log(`next 3 avg difficulty: ${player.fixtureScore}`);
    console.log(`suggestion score: ${player.finalScore}\n`);
  });
}

function showHelp() {
  console.log(`
FPLBuddy v3 commands:

node fpl-agent-v3.js fixtures Arsenal
node fpl-agent-v3.js fixtures LIV
node fpl-agent-v3.js ticker
node fpl-agent-v3.js suggest MID
node fpl-agent-v3.js suggest FWD
node fpl-agent-v3.js help
`);
}

async function main() {
  const command = process.argv[2];
  const arg = process.argv.slice(3).join(' ');

  try {
    if (!command || command === 'help') {
      showHelp();
    } else if (command === 'fixtures') {
      await showFixtures(arg);
    } else if (command === 'ticker') {
      await showTicker();
    } else if (command === 'suggest') {
      await suggestTransfers(process.argv[3]);
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
