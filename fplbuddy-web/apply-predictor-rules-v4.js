#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const target = path.resolve(process.argv[2] || 'fplbuddy.html');
if (!fs.existsSync(target)) throw new Error(`Cannot find ${target}`);
let html = fs.readFileSync(target, 'utf8');
if (!/<!doctype html/i.test(html) || !/<\/html>\s*$/i.test(html)) throw new Error('Target is not a complete HTML document.');
const marker = 'FPLBuddy Predictor League rules v4 — red-card prediction removed, first scorer one point';
if (html.includes(marker)) { console.log('Predictor League rules v4 are already applied. No duplicate changes were made.'); process.exit(0); }

const required = [
  "const red = savedPrediction?.red_card_call ?? savedPrediction?.redCardCall ?? '';",
  "const red = document.getElementById('pred-red-' + fixture.id)?.value || null;",
  'redCardCall: red',
  'prediction.red_card_points',
  'Red-card call: <b>1 point</b>'
];
for (const text of required) if (!html.includes(text)) throw new Error(`Expected Predictor League source was not found: ${text}. No changes were made.`);

const original = html;
html = html.replace("const red = savedPrediction?.red_card_call ?? savedPrediction?.redCardCall ?? '';\n", '');
html = html.replace("const red = document.getElementById('pred-red-' + fixture.id)?.value || null;\n", '');
html = html.replace(/\s*redCardCall:\s*red\s*,?\n/g, '\n');
html = html.replace("  if (Number(prediction.red_card_points || 0)) {\n    parts.push(`Red card +${prediction.red_card_points}`);\n  }\n", '');
html = html.replace('First scorer: <b>2 points</b>', 'First scorer: <b>1 point</b>');
html = html.replace('Red-card call: <b>1 point</b>.', '');

const redFieldStart = html.indexOf("      <div class=\"pred-bonus-field\">\n        <label for=\"pred-red-${fixture.id}\">");
if (redFieldStart < 0) throw new Error('Could not find the red-card selector start. No changes were written.');
const redFieldEnd = html.indexOf('      </div>', redFieldStart);
if (redFieldEnd < 0) throw new Error('Could not find the red-card selector end. No changes were written.');
html = html.slice(0, redFieldStart) + html.slice(redFieldEnd + '      </div>'.length);

const bonusStart = html.indexOf('function predBonusControls(');
const bonusEnd = html.indexOf('function closePredScorerPicker', bonusStart);
if (bonusStart < 0 || bonusEnd < 0) throw new Error('Could not isolate predBonusControls for validation. No changes were written.');
const collectStart = html.indexOf('function collectPredictions(');
const collectEnd = html.indexOf('async function savePredictionDraft', collectStart);
if (collectStart < 0 || collectEnd < 0) throw new Error('Could not isolate collectPredictions for validation. No changes were written.');
const bonusTextStart = html.indexOf('function predBonusText(');
const bonusTextEnd = html.indexOf('async function loadPredictorLeague', bonusTextStart);
if (bonusTextStart < 0 || bonusTextEnd < 0) throw new Error('Could not isolate predBonusText for validation. No changes were written.');
const predictorBlocks = html.slice(bonusStart, bonusEnd) + html.slice(collectStart, collectEnd) + html.slice(bonusTextStart, bonusTextEnd);
if (/pred-red-|redCardCall|red_card_call|red_card_points/i.test(predictorBlocks)) throw new Error('Red-card prediction code remains inside Predictor League functions. No changes were written.');

const styleAt = html.lastIndexOf('</style>');
if (styleAt < 0) throw new Error('Closing style tag was not found. No changes were written.');
const css = `\n/* ${marker} */\n.pred-bonus-grid{grid-template-columns:minmax(160px,2fr) minmax(105px,1fr)!important}\n@media(max-width:560px){.pred-bonus-grid{grid-template-columns:1fr!important}}\n`;
html = html.slice(0, styleAt) + css + html.slice(styleAt);

const backup = target + '.before-predictor-rules-v4.bak';
fs.copyFileSync(target, backup);
fs.writeFileSync(target, html, 'utf8');
const verify = fs.readFileSync(target, 'utf8');
if (!/<!doctype html/i.test(verify) || !/<\/html>\s*$/i.test(verify) || !verify.includes(marker) || !verify.includes('First scorer: <b>1 point</b>')) {
  fs.copyFileSync(backup, target);
  throw new Error(`Verification failed. Original restored from ${backup}`);
}
console.log(`Updated ${target}`);
console.log(`Backup created: ${backup}`);
console.log('Verified: complete HTML; Predictor League red-card picker, payload, rule text and points display removed; first scorer is 1 point; referee red-card statistics remain untouched.');
