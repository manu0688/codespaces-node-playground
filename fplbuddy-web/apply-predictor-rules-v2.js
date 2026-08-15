#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const target = path.resolve(process.argv[2] || 'fplbuddy.html');
if (!fs.existsSync(target)) throw new Error(`Cannot find ${target}`);
let html = fs.readFileSync(target, 'utf8');
if (!/<!doctype html/i.test(html) || !/<\/html>\s*$/i.test(html)) throw new Error('Target is not a complete HTML document.');
if (!/renderPredictorLeague|predictorleague-content/.test(html)) throw new Error('Predictor League markers were not found; no changes were made.');
const marker = 'FPLBuddy Predictor League rules v2 — no red cards, first scorer one point';
if (html.includes(marker)) {
  console.log('Predictor League rules v2 are already applied. No duplicate changes were made.');
  process.exit(0);
}

function replaceRequired(source, from, to, label) {
  if (!source.includes(from)) throw new Error(`Could not find expected ${label}. No changes were written.`);
  return source.split(from).join(to);
}

let updated = html;
updated = replaceRequired(updated, 'First scorer <b>2 points</b>', 'First scorer <b>1 point</b>', 'Predictor League first-scorer rules text');
updated = replaceRequired(updated, 'label for="pred-scorer-${fixture.id}">First scorer <b>2</b></label>', 'label for="pred-scorer-${fixture.id}">First scorer <b>1</b></label>', 'first-scorer field label');
updated = replaceRequired(updated, ", redCardCall: red", '', 'red-card draft payload field');
updated = replaceRequired(updated, "const red = document.getElementById('pred-red-' + fixture.id)?.value || null;\n", '', 'red-card draft control lookup');
updated = replaceRequired(updated, "const red savedPrediction?.redcardcall ?? savedPrediction?.redCardCall ?? '';\n", '', 'saved red-card value lookup');
updated = replaceRequired(updated, " div class=\"pred-bonus-field\" label for=\"pred-red-${fixture.id}\">Red card <b>1</b></label> select id=\"pred-red-${fixture.id}\" ${disabled ? 'disabled' : ''} option value=\"\">No pick</option> option value=\"no\" ${red === 'no' ? 'selected' : ''}>No</option> option value=\"yes\" ${red === 'yes' ? 'selected' : ''}>Yes</option> /select /div", '', 'red-card selector');
updated = replaceRequired(updated, "if(Number(prediction.redcardpoints || 0)) parts.push(`Red card +${prediction.redcardpoints}`);\n", '', 'red-card result display');

if (/Red card <b>1 point<\/b>/.test(updated)) updated = updated.replace(/\s*Red card <b>1 point<\/b>\.?/g, '');
if (/Red-card call <b>1 point<\/b>/.test(updated)) updated = updated.replace(/\s*Red-card call <b>1 point<\/b>\.?/g, '');
if (/Red card <b>1<\/b>/.test(updated)) updated = updated.replace(/\s*Red card <b>1<\/b>/g, '');

if (/pred-red-/.test(updated) || /redCardCall/.test(updated) || /redcardcall/.test(updated)) {
  throw new Error('Red-card markers remain after the planned transformations. No changes were written.');
}

const styleAt = updated.lastIndexOf('</style>');
if (styleAt < 0) throw new Error('Closing style tag was not found. No changes were written.');
const cleanupCss = `\n/* ${marker} */\n.pred-bonus-grid{grid-template-columns:minmax(160px,2fr) minmax(105px,1fr)!important}\n@media(max-width:560px){.pred-bonus-grid{grid-template-columns:1fr!important}}\n`;
updated = updated.slice(0, styleAt) + cleanupCss + updated.slice(styleAt);

const backup = target + '.before-predictor-rules-v2.bak';
fs.copyFileSync(target, backup);
fs.writeFileSync(target, updated, 'utf8');
const verified = fs.readFileSync(target, 'utf8');
if (!/<!doctype html/i.test(verified) || !/<\/html>\s*$/i.test(verified) || !verified.includes(marker) || /pred-red-|redCardCall|redcardcall/.test(verified)) {
  fs.copyFileSync(backup, target);
  throw new Error(`Verification failed. Original restored from ${backup}`);
}
console.log(`Updated ${target}`);
console.log(`Backup created: ${backup}`);
console.log('Verified: complete HTML, red-card UI/payload/result references removed, first scorer now awards 1 point in the UI.');
