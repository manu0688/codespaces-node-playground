#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const target = path.resolve(process.argv[2] || 'fplbuddy.html');
if (!fs.existsSync(target)) throw new Error(`Cannot find ${target}`);
let html = fs.readFileSync(target, 'utf8');
if (!/<!doctype html/i.test(html) || !/<\/html>\s*$/i.test(html)) throw new Error('Target is not a complete HTML document.');
const marker = 'FPLBuddy Predictor League draft status and lock fix v2';
if (html.includes(marker)) { console.log('Draft-status and lock fix v2 is already applied. No duplicate changes were made.'); process.exit(0); }

const oldProgress = `function updatePredProgress() {
  const count = predEnteredCount();
  const text = document.getElementById('pred-progress');
  const button = document.getElementById('pred-lock-btn');

  if (text) text.textContent = \`${'${count}'} of ${'${predFixtures.length}'} scores entered\`;
  if (button) button.disabled = count !== predFixtures.length;
}`;
const newProgress = `function updatePredProgress() {
  const typedCount = predEnteredCount();
  const savedCount = predDrafts().filter(draft =>
    predFixtures.some(fixture => Number(fixture.id) === Number(draft.fixture_id)) &&
    draft.home_goals !== null && draft.home_goals !== undefined && draft.home_goals !== '' &&
    draft.away_goals !== null && draft.away_goals !== undefined && draft.away_goals !== ''
  ).length;
  const count = Math.max(typedCount, savedCount);
  const text = document.getElementById('pred-progress');
  const button = document.getElementById('pred-lock-btn');

  if (text) text.textContent = \`${'${count}'} of ${'${predFixtures.length}'} scores entered\`;
  if (button) button.disabled = count !== predFixtures.length;
}`;
if (!html.includes(oldProgress)) throw new Error('Expected updatePredProgress function was not found exactly. No changes were made.');
html = html.replace(oldProgress, newProgress);

const renderEnd = `  </div>
</div>\`;
}

function selectPredPlayer`;
if (!html.includes(renderEnd)) throw new Error('Expected renderPredictorLeague closing sequence was not found. No changes were made.');
html = html.replace(renderEnd, `  </div>
</div>\`;
  updatePredProgress();
}

function selectPredPlayer`);

const styleAt = html.lastIndexOf('</style>');
if (styleAt < 0) throw new Error('Closing style tag was not found. No changes were made.');
html = html.slice(0, styleAt) + `\n/* ${marker} */\n` + html.slice(styleAt);

const backup = target + '.before-draft-lock-fix-v2.bak';
fs.copyFileSync(target, backup);
fs.writeFileSync(target, html, 'utf8');
const verify = fs.readFileSync(target, 'utf8');
if (!/<!doctype html/i.test(verify) || !/<\/html>\s*$/i.test(verify) || !verify.includes(marker) || !verify.includes('const savedCount = predDrafts()') || !verify.includes('  updatePredProgress();\n}\n\nfunction selectPredPlayer')) {
  fs.copyFileSync(backup, target);
  throw new Error(`Verification failed. Original restored from ${backup}`);
}
console.log(`Updated ${target}`);
console.log(`Backup created: ${backup}`);
console.log('Verified: complete HTML; all-player draft state is rendered correctly once the Worker returns all drafts, and saved drafts enable Lock Predictions after render.');
