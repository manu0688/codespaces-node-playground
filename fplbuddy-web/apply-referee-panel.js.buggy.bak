#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const target = path.resolve(process.argv[2] || 'fplbuddy-web/fplbuddy.html');
if (!fs.existsSync(target)) throw new Error(`Cannot find ${target}`);
let html = fs.readFileSync(target, 'utf8');
if (!/<!doctype html/i.test(html) || !/<\/html>/i.test(html)) throw new Error('Target is not a complete HTML document.');
if (!/renderPredictorLeague|predictorleague-content/.test(html)) throw new Error('Predictor League markers were not found; no changes were made.');

const css = String.raw`
/* FPLBuddy referee panel — injected by apply-referee-panel.js */
.pred-ref-chip{width:100%;display:flex;align-items:center;gap:8px;margin:8px 0 10px;padding:8px 10px;border:1px solid rgba(114,144,255,.24);border-radius:10px;background:linear-gradient(135deg,rgba(79,142,247,.11),rgba(167,139,250,.055));color:var(--text);font:700 .72rem Outfit,sans-serif;text-align:left;cursor:pointer;transition:.18s ease;box-shadow:inset 0 1px 0 rgba(255,255,255,.035)}
.pred-ref-chip:hover,.pred-ref-chip:focus-visible{border-color:rgba(0,212,170,.6);background:linear-gradient(135deg,rgba(0,212,170,.13),rgba(79,142,247,.09));outline:none;box-shadow:0 0 0 3px rgba(0,212,170,.075)}
.pred-ref-chip[disabled]{cursor:default;opacity:.8}.pred-ref-icon{width:25px;height:25px;display:grid;place-items:center;border-radius:8px;background:rgba(79,142,247,.15);font-size:.95rem;flex:0 0 auto}.pred-ref-copy{display:flex;min-width:0;flex:1;flex-direction:column;gap:1px}.pred-ref-copy b{font-size:.61rem;letter-spacing:.65px;text-transform:uppercase;color:#aebcea}.pred-ref-copy span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text)}.pred-ref-copy span.muted{color:var(--text-muted)}.pred-ref-view{color:var(--green);font-size:.64rem;white-space:nowrap}.pred-ref-chev{font-size:1rem;color:#9ca8c7;line-height:1}
.pred-ref-modal{position:fixed;inset:0;z-index:10050;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(2,5,12,.72);backdrop-filter:blur(9px);-webkit-backdrop-filter:blur(9px)}
.pred-ref-sheet{position:relative;width:min(535px,100%);max-height:min(680px,88vh);overflow:auto;padding:18px;background:linear-gradient(145deg,rgba(20,29,48,.99),rgba(7,11,20,.995));border:1px solid rgba(161,179,255,.2);border-radius:18px;box-shadow:0 26px 75px rgba(0,0,0,.58);animation:predRefIn .22s ease}.pred-ref-sheet:before{content:'';position:absolute;inset:0 0 auto;height:2px;background:linear-gradient(90deg,transparent,var(--green),#6f7cff,transparent);opacity:.85}.pred-ref-head{display:flex;gap:12px;align-items:flex-start;padding-bottom:14px;border-bottom:1px solid rgba(255,255,255,.075)}.pred-ref-head-icon{width:42px;height:42px;display:grid;place-items:center;border-radius:12px;background:linear-gradient(135deg,rgba(0,212,170,.2),rgba(79,142,247,.19));font-size:1.35rem}.pred-ref-title{min-width:0;flex:1}.pred-ref-title small{display:block;color:var(--text-muted);font-size:.67rem;letter-spacing:.55px;text-transform:uppercase;margin-bottom:3px}.pred-ref-title h3{margin:0;font-size:1.08rem}.pred-ref-title p{margin:4px 0 0;color:#b3bfd4;font-size:.76rem}.pred-ref-close{width:31px;height:31px;border:1px solid rgba(255,255,255,.12);border-radius:50%;background:rgba(255,255,255,.06);color:var(--text);font:400 1.3rem/1 Outfit,sans-serif;cursor:pointer}.pred-ref-close:hover{background:rgba(255,255,255,.13)}.pred-ref-role{display:inline-flex;margin:14px 0 10px;padding:4px 9px;border-radius:999px;border:1px solid rgba(0,212,170,.25);background:rgba(0,212,170,.08);color:var(--green);font-size:.66rem;font-weight:800;letter-spacing:.45px;text-transform:uppercase}.pred-ref-stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.pred-ref-stat{padding:10px;border:1px solid rgba(255,255,255,.075);border-radius:10px;background:rgba(255,255,255,.035)}.pred-ref-stat span{display:block;color:var(--text-muted);font-size:.61rem;font-weight:700;letter-spacing:.5px;text-transform:uppercase;line-height:1.25}.pred-ref-stat b{display:block;margin-top:4px;color:var(--text);font-size:1rem}.pred-ref-stat b.green{color:var(--green)}.pred-ref-unavailable{margin-top:5px;padding:15px;border:1px dashed rgba(167,139,250,.36);border-radius:11px;background:rgba(167,139,250,.06);color:#c3c9da;font-size:.78rem;line-height:1.55}.pred-ref-foot{margin:12px 0 0;color:var(--text-muted);font-size:.65rem;line-height:1.4}@keyframes predRefIn{from{opacity:0;transform:translateY(14px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}
@media(max-width:560px){.pred-ref-modal{align-items:flex-end;padding:0}.pred-ref-sheet{width:100%;max-height:82vh;border-radius:20px 20px 0 0;padding:18px 16px 19px;animation:predRefUp .25s ease}.pred-ref-stat{padding:9px}.pred-ref-view{display:none}@keyframes predRefUp{from{transform:translateY(100%)}to{transform:translateY(0)}}}
`;

const js = String.raw`
/* FPLBuddy referee panel — injected by apply-referee-panel.js */
(function(){
  if(window.__fplBuddyRefereePanel) return;
  window.__fplBuddyRefereePanel = true;
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const first = (...values) => values.find(v => v !== undefined && v !== null && String(v).trim() !== '');
  const fixtures = () => typeof predFixtures !== 'undefined' && Array.isArray(predFixtures) ? predFixtures : [];
  const findFixture = id => fixtures().find(f => String(f.id) === String(id));
  const officialFor = fixture => {
    const candidates = [fixture && fixture.referee, fixture && fixture.refereeName, fixture && fixture.official, fixture && fixture.officials, fixture && fixture.matchOfficials, fixture && fixture.referees];
    for(const candidate of candidates){
      if(Array.isArray(candidate)){
        const choice = candidate.find(x => /referee|main/i.test(String(x && (x.role || x.type || x.position || '')))) || candidate[0];
        if(choice) return typeof choice === 'object' ? choice : {name:choice};
      }
      if(candidate) return typeof candidate === 'object' ? candidate : {name:candidate};
    }
    return null;
  };
  const nameFor = fixture => {
    const official = officialFor(fixture);
    return official && first(official.name, official.fullName, official.displayName, official.refereeName, official.officialName) || '';
  };
  const statsFor = fixture => {
    const official = officialFor(fixture) || {};
    const raw = first(fixture && fixture.refereeStats, fixture && fixture.referee_stats, official.stats, official.statistics, official.refereeStats);
    if(!raw || typeof raw !== 'object') return null;
    const read = keys => { for(const key of keys){ const value = raw[key]; if(value !== undefined && value !== null && value !== '' && Number.isFinite(Number(value))) return Number(value); } return null; };
    const stats = {matches:read(['matches','matchesOfficiated','games','appearances']),yellow:read(['avgYellowCards','yellowCardsPerMatch','yellow_per_match','averageYellowCards']),red:read(['avgRedCards','redCardsPerMatch','red_per_match','averageRedCards']),penalties:read(['avgPenalties','penaltiesPerMatch','penalties_awarded_per_match','averagePenalties']),fouls:read(['avgFouls','foulsPerMatch','fouls_per_match','averageFouls'])};
    return Object.values(stats).some(v => v !== null) ? stats : null;
  };
  const teamName = id => { try { const team = typeof predTeam === 'function' ? predTeam(id) : null; return team && (team.name || team.short_name || team.shortname); } catch(_) { return ''; } };
  const contextFor = fixture => `${teamName(fixture && fixture.teamh) || 'Home'} vs ${teamName(fixture && fixture.teama) || 'Away'}`;
  const close = () => document.getElementById('pred-referee-modal')?.remove();
  const stat = (label, value, decimals, tone) => value === null || value === undefined ? '' : '<div class="pred-ref-stat"><span>'+esc(label)+'</span><b class="'+(tone || '')+'">'+esc(decimals == null ? String(value) : Number(value).toFixed(decimals))+'</b></div>';
  const open = id => {
    close();
    const fixture = findFixture(id); if(!fixture) return;
    const official = officialFor(fixture) || {};
    const name = nameFor(fixture);
    const role = first(official.role, official.type, official.position, name ? 'Match referee' : 'Officials unavailable');
    const stats = statsFor(fixture);
    const modal = document.createElement('div');
    modal.id = 'pred-referee-modal'; modal.className = 'pred-ref-modal';
    const statsHtml = stats ? '<div class="pred-ref-stats">'+stat('Matches officiated',stats.matches,null,'green')+stat('Yellow cards / match',stats.yellow,2,'')+stat('Red cards / match',stats.red,2,'')+stat('Penalties / match',stats.penalties,2,'')+stat('Fouls / match',stats.fouls,1,'')+'</div>' : '<div class="pred-ref-unavailable"><b>Stats unavailable.</b><br>Historical referee statistics were not supplied by the fixture data for this match.</div>';
    modal.innerHTML = '<section class="pred-ref-sheet" role="dialog" aria-modal="true" aria-labelledby="pred-referee-title"><div class="pred-ref-head"><div class="pred-ref-head-icon">⚽</div><div class="pred-ref-title"><small>'+esc(contextFor(fixture))+'</small><h3 id="pred-referee-title">'+esc(name || 'Officials unavailable')+'</h3><p>'+esc(name ? 'Fixture official details' : 'The match official has not been announced yet')+'</p></div><button type="button" class="pred-ref-close" aria-label="Close referee details">×</button></div><div class="pred-ref-role">'+esc(role)+'</div>'+statsHtml+'<p class="pred-ref-foot">Referee information is displayed only when it is provided by the existing fixture data source.</p></section>';
    document.body.appendChild(modal);
    modal.querySelector('.pred-ref-close').addEventListener('click', close);
    modal.addEventListener('click', event => { if(event.target === modal) close(); });
  };
  const mount = () => {
    const root = document.getElementById('predictorleague-content'); if(!root) return;
    root.querySelectorAll('.pred-fixture').forEach(card => {
      const score = card.querySelector('input[id^="pred-h-"]');
      const id = score && score.id.replace(/^pred-h-/, ''); if(!id || card.querySelector('.pred-ref-chip')) return;
      const fixture = findFixture(id); if(!fixture) return;
      const name = nameFor(fixture);
      const kickoff = card.querySelector('.pred-kickoff'); if(!kickoff) return;
      const chip = document.createElement('button'); chip.type = 'button'; chip.className = 'pred-ref-chip'; chip.dataset.fixtureId = id;
      chip.setAttribute('aria-label', 'View referee details for '+contextFor(fixture));
      chip.innerHTML = '<span class="pred-ref-icon" aria-hidden="true">⚽</span><span class="pred-ref-copy"><b>Referee</b><span class="'+(name ? '' : 'muted')+'">'+esc(name || (officialFor(fixture) ? 'TBC' : 'Officials unavailable'))+'</span></span><span class="pred-ref-view">View stats</span><span class="pred-ref-chev" aria-hidden="true">›</span>';
      kickoff.insertAdjacentElement('afterend', chip);
    });
  };
  document.addEventListener('click', event => { const chip = event.target.closest('.pred-ref-chip'); if(chip) open(chip.dataset.fixtureId); });
  document.addEventListener('keydown', event => { if(event.key === 'Escape') close(); });
  const observe = () => { mount(); const root = document.getElementById('predictorleague-content'); if(root && !root.dataset.refObserver){ root.dataset.refObserver = '1'; new MutationObserver(mount).observe(root,{childList:true,subtree:true}); } };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', observe); else observe();
  window.openPredRefereePanel = open;
})();
`;

let changed = false;
if (!html.includes('FPLBuddy referee panel — injected by apply-referee-panel.js')) {
  const styleAt = html.lastIndexOf('</style>');
  const scriptAt = html.lastIndexOf('</script>');
  if (styleAt < 0 || scriptAt < 0) throw new Error('Expected closing style/script tags were not found; no changes were made.');
  html = html.slice(0, styleAt) + '\n' + css + '\n' + html.slice(styleAt);
  const newScriptAt = html.lastIndexOf('</script>');
  html = html.slice(0, newScriptAt) + '\n' + js + '\n' + html.slice(newScriptAt);
  changed = true;
}
if (!changed) {
  console.log('Referee panel marker already exists. No duplicate changes were made.');
  process.exit(0);
}
const backup = target + '.before-referee-panel.bak';
fs.copyFileSync(target, backup);
fs.writeFileSync(target, html, 'utf8');
const verified = fs.readFileSync(target, 'utf8');
if (!/<!doctype html/i.test(verified) || !/<\/html>\s*$/i.test(verified) || !verified.includes('pred-referee-modal')) throw new Error('Verification failed after writing. Restore from: ' + backup);
console.log(`Updated ${target}`);
console.log(`Backup created: ${backup}`);
console.log('Verified: complete HTML document and one idempotent referee-panel injection.');
