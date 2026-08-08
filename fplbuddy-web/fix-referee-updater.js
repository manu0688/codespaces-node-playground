#!/usr/bin/env node
const fs = require('fs');
const { execFileSync } = require('child_process');

const updater = 'apply-referee-panel.js';
if (!fs.existsSync(updater)) throw new Error(`Cannot find ${updater} in this folder.`);
let source = fs.readFileSync(updater, 'utf8');
const tick = String.fromCharCode(96);
const broken = "const contextFor = fixture => " + tick + "${teamName(fixture && fixture.teamh) || 'Home'} vs ${teamName(fixture && fixture.teama) || 'Away'}" + tick + ";";
const fixed = "const contextFor = fixture => (teamName(fixture && fixture.teamh) || 'Home') + ' vs ' + (teamName(fixture && fixture.teama) || 'Away');";
if (source.includes(broken)) {
  fs.copyFileSync(updater, updater + '.buggy.bak');
  source = source.replace(broken, fixed);
  fs.writeFileSync(updater, source, 'utf8');
  console.log('Fixed the updater syntax error. Backup created: apply-referee-panel.js.buggy.bak');
} else if (!source.includes(fixed)) {
  throw new Error('The expected updater line was not found. Do not continue with this copy.');
} else {
  console.log('Updater is already fixed.');
}
execFileSync(process.execPath, [updater, 'fplbuddy.html'], { stdio: 'inherit' });
