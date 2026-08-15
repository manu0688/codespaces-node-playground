#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const target = path.resolve(process.argv[2] || 'fplbuddy.html');
if (!fs.existsSync(target)) throw new Error(`Cannot find ${target}`);
let html = fs.readFileSync(target, 'utf8');
if (!/<!doctype html/i.test(html) || !/<\/html>\s*$/i.test(html)) throw new Error('Target is not a complete HTML document.');
if (!/renderPredictorLeague|predictorleague-content/.test(html)) throw new Error('Predictor League markers were not found; no changes were made.');
const marker = 'FPLBuddy Predictor League rules v2 — no red cards, first scorer one point';
if (html.includes(marker)) { console.log('Predictor League rules v2 are already applied. No duplicate changes were made.'); process.exit(0); }

let updated = html;
const remove = (pattern, label) => {
  const before = updated;
  updated = updated.replace(pattern, '');
  if (updated === before) console.log(`Note: ${label} was not found in this version; continuing safely.`);
};

updated = updated.replace(/First scorer\s*<b>\s*2\s*points?<\/b>/gi, 'First scorer <b>1 point</b>');
updated = updated.replace(/First scorer\s*<b>\s*2\s*<\/b>/gi, 'First scorer <b>1</b>');
updated = updated.replace(/First scorer\s*\+?2\s*points?/gi, 'First scorer 1 point');

remove(/\s*,?\s*redCardCall\s*:\s*red\s*/g, 'red-card payload property');
remove(/\s*const\s+red\s*=\s*document\.getElementById\(['"`]pred-red-['"`]\s*\+\s*fixture\.id\)\?\.value\s*\|\|\s*null\s*;?/g, 'red-card control lookup');
remove(/\s*const\s+red\s*=\s*savedPrediction\?\.redcardcall\s*\?\?\s*savedPrediction\?\.redCardCall\s*\?\?\s*['"`]\s*;?/g, 'saved red-card lookup');
remove(/\s*if\s*\(\s*Number\(prediction\.redcardpoints\s*\|\|\s*0\)\s*\)\s*parts\.push\([^;]+;?/g, 'red-card result display');
remove(/\s*Red\s*-?card(?:\s+call)?\s*<b>\s*1\s*points?\s*<\/b>\.?/gi, 'red-card rules text');
remove(/\s*Red\s*-?card(?:\s+call)?\s*<b>\s*1\s*<\/b>/gi, 'red-card bonus label');

const bonusStart = updated.indexOf('function predBonusControls');
const bonusEnd = bonusStart >= 0 ? updated.indexOf('function ', bonusStart + 25) : -1;
if (bonusStart < 0 || bonusEnd < 0) throw new Error('Could not isolate predBonusControls. No changes were written.');
let bonus = updated.slice(bonusStart, bonusEnd);
bonus = bonus.replace(/\s*const\s+red\s*=\s*[^;]+;?/g, '');
bonus = bonus.replace(/\s*<div\s+class=['"]pred-bonus-field['"]>\s*<label[^>]*>\s*Red\s*-?card[\s\S]*?<\/select>\s*<\/div>/gi, '');
bonus = bonus.replace(/\s*div\s+class=pred-bonus-field\s+label\s+forpred-red-[\s\S]*?\/select\s*\/div/gi, '');
updated = updated.slice(0, bonusStart) + bonus + updated.slice(bonusEnd);

if (/pred-red-|redCardCall|redcardcall|redcardpoints/i.test(updated)) throw new Error('Red-card code remains after transformation. No changes were written.');
const styleAt = updated.lastIndexOf('</style>');
if (styleAt < 0) throw new Error('Closing style tag was not found. No changes were written.');
const css = `\n/* ${marker} */\n.pred-bonus-grid{grid-template-columns:minmax(160px,2fr) minmax(105px,1fr)!important}\n@media(max-width:560px){.pred-bonus-grid{grid-template-columns:1fr!important}}\n`;
updated = updated.slice(0, styleAt) + css + updated.slice(styleAt);

const backup = target + '.before-predictor-rules-v2.bak';
fs.copyFileSync(target, backup);
fs.writeFileSync(target, updated, 'utf8');
const verify = fs.readFileSync(target, 'utf8');
if (!/<!doctype html/i.test(verify) || !/<\/html>\s*$/i.test(verify) || !verify.includes(marker) || /pred-red-|redCardCall|redcardcall|redcardpoints/i.test(verify)) {
  fs.copyFileSync(backup, target);
  throw new Error(`Verification failed. Original restored from ${backup}`);
}
console.log(`Updated ${target}`);
console.log(`Backup created: ${backup}`);
console.log('Verified: complete HTML; red-card UI, payload and points references removed; first scorer is 1 point.');
