const axios = require('axios');

async function main() {
  const res = await axios.get('https://api.github.com/rate_limit');
  console.log('GitHub rate limit:', res.data.rate.limit);
}

main().catch(console.error);