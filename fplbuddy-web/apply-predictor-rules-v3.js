#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const target = path.resolve(process.argv[2] || 'fplbuddy.html');
if (!fs.existsSync(target)) throw new Error(`Cannot find ${target}`);
let html = fs.readFileSync(target, 'utf8');
if (!/<!doctype html/i.test(html) || !/<\/html>\s*$/i.test(html)) throw new Error('Target is not a complete HTML document.');
if (!/function predBonusControls|function collectPredictions|function predBonusText/.test(html)) throw new Error('Expected Predictor League functions were not found. No changes were made.');
const marker = 'FPLBuddy Predictor League rules v3 — red-card prediction removed, first scorer one point';
if (html.includes(marker)) { console.log('Predictor League rules v3 are already applied. No duplicate changes were made.'); process.exit(0); }

const original = html;
const ranges = {};
function isolate(name, startToken, endToken) {
  const start = html.indexOf(startToken);
  if (start < 0) throw new Error(`Could not find ${name} start marker. No changes were made.`);
  const end = html.indexOf(endToken, start + startToken.length);
  if (end < 0) throw new Error(`Could not find ${name} end marker. No changes were made.`);
  ranges[name] = {start, end};
  return html.slice(start, end);
}
function replaceRange(name, value) {
  const r = ranges[name];
  html = html.slice(0, r.start) + value + html.slice(r.end);
  const delta = value.length - (r.end - r.start);
  for (const key of Object.keys(ranges)) {
    if (ranges[key].start > r.start) { ranges[key].start += delta; ranges[key].end += delta; }
  }
  ranges[name].end = ranges[name].start + value.length;
}

let rules = isolate('Predictor League render block', 'function renderPredictorLeague', 'function selectPredPlayer');
rules = rules.replace(/First scorer\s*<b>\s*2\s*points?\s*<\/b>/gi, 'First scorer <b>1 point</b>');
rules = rules.replace(/\s*Red\s*-?card(?:\s+call)?\s*<b>\s*1\s*points?\s*<\/b>\.?/gi, '');
replaceRange('Predictor League render block', rules);

let result = isolate('predBonusText', 'function predBonusText', 'async function loadPredictorLeague');
result = result.replace(/\s*if\s*\(\s*Number\(prediction\.redcardpoints\s*\|\|\s*0\)\s*\)\s*parts\.push\([^;]+;?/g, '');
replaceRange('predBonusText', result);

let controls = isolate('predBonusControls', 'function predBonusControls', 'function closePredScorerPicker');
controls = controls.replace(/\s*const\s+red\s*=\s*savedPrediction\?\.redcardcall\s*\?\?\s*savedPrediction\?\.redCardCall\s*\?\?\s*['"][^;]*;?/g, '');
controls = controls.replace(/\s*<div\s+class="pred-bonus-field">\s*<label\s+for="pred-red-[\s\S]*?<\/select>\s*<\/div>/gi, '');
controls = controls.replace(/\s*div\s+class=pred-bonus-field\s+label\s+forpred-red-[\s\S]*?\/select\s*\/div/gi, '');
controls = controls.replace(/First scorer\s*<b>\s*2\s*<\/b>/gi, 'First scorer <b>1</b>');
replaceRange('predBonusControls', controls);

let collect = isolate('collectPredictions', 'function collectPredictions', 'async function savePredictionDraft');
collect = collect.replace(/\s*const\s+red\s*=\s*document\.getElementById\(['"]pred-red-['"]\s*\+\s*fixture\.id\)\?\.value\s*\|\|\s*null;?/g, '');
collect = collect.replace(/\s*,\s*redCardCall\s*:\s*red\s*(?=\}|,)/g, '');
replaceRange('collectPredictions', collect);

if (/pred-red-|redCardCall|redcardcall|redcardpoints/i.test(html)) {
  fs.writeFileSync(target + '.predictor-rules-v3-debug.txt', [
    'Updater aborted before changing fplbuddy.html.',
    'The following remaining red-card matches need review:',
    ...html.split(/\r?\n/).map((line, index) => /pred-red-|redCardCall|redcardcall|redcardpoints/i.test(line) ? `${index + 1}: ${line}` : null).filter(Boolean)
  ].join('\n'), 'utf8');
  throw new Error('Unexpected red-card prediction code remains. fplbuddy.html was not changed. Review predictor-rules-v3-debug.txt.');
}

const styleAt = html.lastIndexOf('</style>');
if (styleAt < 0) throw new Error('Closing style tag was not found. No changes were made.');
const css = `\n/* ${marker} */\n.pred-bonus-grid{grid-template-columns:minmax(160px,2fr) minmax(105px,1fr)!important}\n@media(max-width:560px){.pred-bonus-grid{grid-template-columns:1fr!important}}\n`;
html = html.slice(0, styleAt) + css + html.slice(styleAt);
const backup = target + '.before-predictor-rules-v3.bak';
fs.copyFileSync(target, backup);
fs.writeFileSync(target, html, 'utf8');
const verify = fs.readFileSync(target, 'utf8');
if (!/<!doctype html/i.test(verify) || !/<\/html>\s*$/i.test(verify) || !verify.includes(marker) || /pred-red-|redCardCall|redcardcall|redcardpoints/i.test(verify)) {
  fs.copyFileSync(backup, target);
  throw new Error(`Verification failed. Original restored from ${backup}`);
}
console.log(`Updated ${target}`);
console.log(`Backup created: ${backup}`);
console.log('Verified: complete HTML; Predictor League red-card prediction UI/payload/scoring display removed; referee red-card statistics remain untouched; first scorer is 1 point.');
