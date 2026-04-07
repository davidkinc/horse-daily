// history.js

function initHistory() {
  const el = document.getElementById('screen-history');
  el.innerHTML = buildHistoryHTML();
  refreshHistory();
}

function buildHistoryHTML() {
  return `
<div class="sec">
  <div class="sec-label">30-day trends</div>
  <div id="h-trends"></div>
</div>
<div class="sec">
  <div class="sec-label">Pattern alerts</div>
  <div id="h-alerts"></div>
</div>
<div class="sec">
  <div class="sec-label">Ride log</div>
  <div id="h-log"></div>
</div>
<button class="ghost-btn" onclick="if(confirm('Clear all ride history?')){clearHistory()}">Clear all history</button>
`;
}

function refreshHistory() {
  const rides = getRides(30);
  renderTrends(rides);
  renderAlerts(rides);
  renderLog(rides);
}

function renderTrends(rides) {
  const el = document.getElementById('h-trends');
  if (rides.length < 2) {
    el.innerHTML = '<div class="empty-state">Save a few rides to see trends here.</div>'; return;
  }
  const ridden = rides.filter(r => r.scores && r.dayType !== 'off');
  if (ridden.length < 2) { el.innerHTML = '<div class="empty-state">Need at least 2 scored rides to show trends.</div>'; return; }

  const SCORE_SHORT = ['Hind step','Tracking up','Leads','Transitions','Circles','Back feel'];
  // Build per-area averages over time
  let html = '<div class="trend-card"><div class="trend-card-title">Score trends — last 30 days</div><div class="sparkline-wrap">';
  for (let i = 0; i < 6; i++) {
    const vals = ridden.map(r => r.scores ? parseInt(r.scores[i]) || 0 : 0).filter(v => v > 0);
    if (!vals.length) continue;
    const avg = vals.reduce((a,b) => a+b, 0) / vals.length;
    const max = 5;
    const recentVals = ridden.slice(-14).map(r => r.scores ? parseInt(r.scores[i]) || 0 : 0);
    html += `<div class="spark-row">
      <div class="spark-lbl">${SCORE_SHORT[i]}</div>
      <div class="spark-bar-wrap">`;
    recentVals.forEach(v => {
      const pct = v > 0 ? Math.round((v / max) * 100) : 8;
      const color = v >= 4 ? '#7dc863' : v === 3 ? '#e8a020' : v > 0 ? '#e87070' : '#eee';
      html += `<div class="spark-bar" style="height:${pct}%;background:${color}"></div>`;
    });
    html += `</div><div class="spark-avg">${avg.toFixed(1)}</div></div>`;
  }
  html += '</div></div>';

  // Overall avg trend
  const weeklyAvgs = [];
  for (let w = 3; w >= 0; w--) {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - (w+1)*7);
    const end = new Date(); end.setDate(end.getDate() - w*7);
    const cs = cutoff.toISOString().split('T')[0]; const es = end.toISOString().split('T')[0];
    const weekRides = ridden.filter(r => r.date >= cs && r.date < es && r.avg);
    if (weekRides.length) {
      const wa = weekRides.reduce((a,b) => a + b.avg, 0) / weekRides.length;
      weeklyAvgs.push({ label: `W${4-w}`, avg: parseFloat(wa.toFixed(1)) });
    }
  }
  if (weeklyAvgs.length >= 2) {
    html += '<div class="trend-card" style="margin-top:10px"><div class="trend-card-title">Weekly average score</div><div style="display:flex;gap:12px;align-items:flex-end;height:60px;padding:8px 0">';
    const maxAvg = Math.max(...weeklyAvgs.map(w => w.avg));
    weeklyAvgs.forEach(w => {
      const pct = Math.round((w.avg / 5) * 100);
      const color = w.avg >= 4 ? '#7dc863' : w.avg >= 3 ? '#e8a020' : '#e87070';
      html += `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
        <div style="font-size:11px;font-weight:600;color:#555">${w.avg}</div>
        <div style="width:100%;height:${pct}%;background:${color};border-radius:3px;min-height:4px"></div>
        <div style="font-size:10px;color:#aaa">${w.label}</div>
      </div>`;
    });
    html += '</div></div>';
  }
  el.innerHTML = html;
}

function renderAlerts(rides) {
  const el = document.getElementById('h-alerts');
  const alerts = [];
  const recent = rides.slice(-7);
  // Flag frequency
  const flagCount = recent.filter(r => r.anyFlag).length;
  if (flagCount >= 2) alerts.push({ type:'red', msg:`Red flags in ${flagCount} of last ${recent.length} rides — chiro overdue, do not wait.` });
  // Hind step trend
  const hindScores = recent.filter(r => r.scores && r.scores[0] > 0).map(r => parseInt(r.scores[0]));
  if (hindScores.length >= 3) {
    const recent3 = hindScores.slice(-3);
    const avg3 = recent3.reduce((a,b) => a+b, 0) / 3;
    if (avg3 < 3) alerts.push({ type:'red', msg:`Hind step averaging ${avg3.toFixed(1)} over last 3 scored rides — this is your primary warning sign. Book chiro now.` });
    else if (avg3 < 3.5) alerts.push({ type:'amber', msg:`Hind step trending down (avg ${avg3.toFixed(1)}) — monitor closely and consider pulling chiro forward.` });
  }
  // Improving trend
  if (rides.length >= 6) {
    const first3 = rides.slice(0,3).filter(r => r.avg).map(r => r.avg);
    const last3  = rides.slice(-3).filter(r => r.avg).map(r => r.avg);
    if (first3.length && last3.length) {
      const f = first3.reduce((a,b) => a+b, 0)/first3.length;
      const l = last3.reduce((a,b) => a+b, 0)/last3.length;
      if (l - f >= 0.5) alerts.push({ type:'green', msg:`Overall scores improving — up ${(l-f).toFixed(1)} points. The program is working.` });
    }
  }
  // Chiro check
  const s = getSettings();
  if (s.lastChiro) {
    const ld = new Date(s.lastChiro); const today = new Date();
    const days = Math.round((today - ld) / (1000*60*60*24));
    if (days >= 28) alerts.push({ type:'red', msg:`Chiro is ${days} days overdue — schedule immediately.` });
    else if (days >= 21) alerts.push({ type:'amber', msg:`Chiro due soon — last was ${days} days ago.` });
  }
  if (!alerts.length) {
    el.innerHTML = '<div style="font-size:13px;color:#aaa;padding:8px 0">No pattern alerts right now — looking good.</div>'; return;
  }
  el.innerHTML = alerts.map(a =>
    `<div class="${a.type==='red'?'chiro-alert':a.type==='amber'?'chiro-alert':'chiro-alert'}" style="${a.type==='green'?'background:#eaf3de;border-color:#7dc863;color:#1e5c35':a.type==='amber'?'background:#faeeda;border-color:#e8a020;color:#7a4410':''}margin-bottom:8px">${a.msg}</div>`
  ).join('');
}

function renderLog(rides) {
  const el = document.getElementById('h-log');
  if (!rides.length) { el.innerHTML = '<div class="empty-state">No rides saved yet.<br>Save your first ride on the Today tab.</div>'; return; }
  const sorted = [...rides].reverse();
  const SCORE_SHORT = ['Hind','Track','Leads','Trans','Circle','Back'];
  const FLAG_SHORT  = ['Short step','Uneven','Sticky leads','Tight back'];
  let html = '<div class="history-log">';
  sorted.forEach(r => {
    const d = new Date(r.date + 'T12:00:00');
    const dateStr = d.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' });
    const dayLabel = { show:'Show', hard:'Hard', foundation:'Found.', stretch:'Stretch', light:'Walk', off:'Off' }[r.dayType] || r.dayType || '—';
    const tierColor = r.tier === 'red' ? 'r' : r.tier === 'amber' ? 'a' : 'g';
    const flags = r.flags ? Object.keys(r.flags).filter(k => r.flags[k]).map(k => FLAG_SHORT[k]).join(', ') : '';
    html += `<div class="log-entry">
      <div class="log-entry-hdr">
        <div class="log-date">${dateStr} · ${dayLabel}</div>
        ${r.avg ? `<span class="log-score ${tierColor}">${r.avg}</span>` : ''}
      </div>
      <div class="log-scores">`;
    if (r.scores) {
      SCORE_SHORT.forEach((s, i) => {
        const v = parseInt(r.scores[i]);
        if (v > 0) html += `<span class="log-score ${v>=4?'g':v===3?'a':'r'}">${s} ${v}</span>`;
      });
    }
    html += '</div>';
    if (flags) html += `<div class="log-flags">${flags}</div>`;
    if (r.notes) html += `<div class="log-notes">${r.notes}</div>`;
    html += '</div>';
  });
  html += '</div>';
  el.innerHTML = html;
}

function clearHistory() {
  const store = loadStore();
  store.rides = [];
  saveStore(store);
  refreshHistory();
}
