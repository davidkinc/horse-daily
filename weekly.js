// weekly.js

const W_DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const W_TYPES = ['show','hard','foundation','stretch','light','off','travel'];
const W_LABELS = { show:'Show', hard:'Hard', foundation:'Found.', stretch:'Stretch', light:'Walk', off:'Off', travel:'Travel' };
const W_COLORS = { show:'cl-show', hard:'cl-hard', foundation:'cl-foundation', stretch:'cl-stretch', light:'cl-light', off:'cl-off', travel:'cl-travel' };

let wWeekType = null;
let wDays = Array(7).fill('off');
let wChiroDay = -1;

function initWeekly() {
  const el = document.getElementById('screen-weekly');
  el.innerHTML = buildWeeklyHTML();
  wireWeeklyEvents();
  const saved = getWeekPlan();
  if (saved) restoreWeekPlan(saved);
  else buildWeekCalendar();
}

function buildWeeklyHTML() {
  return `
<div class="sec">
  <div class="sec-label">Week type</div>
  <div class="week-type-grid">
    <button class="wtype-btn" data-wt="home">Home week</button>
    <button class="wtype-btn" data-wt="show">Show week</button>
    <button class="wtype-btn" data-wt="mixed">Mixed week</button>
  </div>
  <div id="w-show-opts" style="display:none;margin-bottom:10px">
    <div class="setting-row">
      <label>Show starts</label>
      <select id="w-show-start">
        <option value="4">Thursday</option>
        <option value="5">Friday</option>
        <option value="3">Wednesday</option>
        <option value="1">Monday</option>
      </select>
    </div>
    <div class="setting-row">
      <label>Show length</label>
      <select id="w-show-len">
        <option value="4">4 days</option>
        <option value="3">3 days</option>
      </select>
    </div>
  </div>
</div>

<div class="sec">
  <div class="sec-label">Chiropractic</div>
  <div class="setting-row"><label>Last chiro</label><input type="date" id="w-last-chiro" onchange="updateChiroTracking()"></div>
  <div class="setting-row"><label>Next chiro</label><input type="date" id="w-next-chiro" onchange="updateChiroTracking()"></div>
  <div id="w-chiro-alert"></div>
</div>

<div class="sec">
  <div class="sec-label">Weekly plan</div>
  <div class="legend">
    <div class="leg-item"><div class="leg-dot" style="background:#7dc863"></div>Show</div>
    <div class="leg-item"><div class="leg-dot" style="background:#e8a020"></div>Hard</div>
    <div class="leg-item"><div class="leg-dot" style="background:#5ba3e0"></div>Found.</div>
    <div class="leg-item"><div class="leg-dot" style="background:#3dc49a"></div>Stretch</div>
    <div class="leg-item"><div class="leg-dot" style="background:#8f85d8"></div>Walk</div>
    <div class="leg-item"><div class="leg-dot" style="background:#ccc"></div>Off</div>
    <div class="leg-item"><div class="leg-dot" style="background:#e8a080"></div>Travel</div>
  </div>
  <div class="cal-grid" id="w-cal"></div>
</div>

<div id="w-summary-sec" style="display:none">
  <div class="sec-label" style="margin-bottom:10px">Week guidance</div>
  <div id="w-summary"></div>
</div>

<div class="sec">
  <div class="sec-label">Notes</div>
  <textarea class="notes-area" id="w-notes" rows="3" placeholder="Show name, how he felt last week, any concerns..."></textarea>
</div>
<button class="action-btn" onclick="saveWeeklyPlan()">Save week plan</button>
`;
}

function wireWeeklyEvents() {
  document.querySelectorAll('.wtype-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.wtype-btn').forEach(b => b.className = 'wtype-btn');
      btn.classList.add('sel-' + btn.dataset.wt);
      wWeekType = btn.dataset.wt;
      document.getElementById('w-show-opts').style.display = (wWeekType === 'show' || wWeekType === 'mixed') ? 'block' : 'none';
      applyWeekDefault();
      buildWeekCalendar();
    });
  });
  document.getElementById('w-show-start').addEventListener('change', () => { applyWeekDefault(); buildWeekCalendar(); });
  document.getElementById('w-show-len').addEventListener('change', () => { applyWeekDefault(); buildWeekCalendar(); });
  // Restore saved chiro dates
  const s = getSettings();
  if (s.lastChiro) document.getElementById('w-last-chiro').value = s.lastChiro;
  if (s.nextChiro) document.getElementById('w-next-chiro').value = s.nextChiro;
  updateChiroTracking();
}

function applyWeekDefault() {
  const start = parseInt(document.getElementById('w-show-start').value);
  const len   = parseInt(document.getElementById('w-show-len').value);
  if (wWeekType === 'home') {
    wDays = ['off','foundation','hard','foundation','stretch','light','off'];
  } else if (wWeekType === 'show') {
    wDays = Array(7).fill('off');
    for (let i = 0; i < len; i++) wDays[(start + i) % 7] = 'show';
    wDays[(start - 1 + 7) % 7] = 'travel';
    // fill remaining with pre-show prep
    const fills = ['foundation','stretch','light'];
    let fi = 0;
    for (let i = 0; i < 7; i++) {
      if (wDays[i] === 'off' && fi < fills.length) { wDays[i] = fills[fi++]; }
    }
  } else if (wWeekType === 'mixed') {
    wDays = Array(7).fill('off');
    for (let i = 0; i < len; i++) wDays[(start + i) % 7] = 'show';
    if (wDays[(start - 1 + 7) % 7] === 'off') wDays[(start - 1 + 7) % 7] = 'travel';
    const fills = ['foundation','hard','stretch','light'];
    let fi = 0;
    for (let i = 0; i < 7; i++) {
      if (wDays[i] === 'off' && fi < fills.length) { wDays[i] = fills[fi++]; }
    }
  }
}

function buildWeekCalendar() {
  const cal = document.getElementById('w-cal');
  cal.innerHTML = '';
  // Headers
  W_DAYS.forEach(d => {
    const h = document.createElement('div'); h.className = 'cal-day-hdr'; h.textContent = d; cal.appendChild(h);
  });
  const today = new Date();
  const startOfWeek = new Date(today); startOfWeek.setDate(today.getDate() - today.getDay());
  for (let i = 0; i < 7; i++) {
    const cell = document.createElement('div'); cell.className = 'cal-cell';
    const cellDate = new Date(startOfWeek); cellDate.setDate(startOfWeek.getDate() + i);
    if (cellDate.toDateString() === today.toDateString()) cell.classList.add('today');
    const dateDiv = document.createElement('div'); dateDiv.className = 'cal-date'; dateDiv.textContent = cellDate.getDate();
    cell.appendChild(dateDiv);
    const lbl = document.createElement('div'); lbl.className = 'cal-label ' + W_COLORS[wDays[i]]; lbl.textContent = W_LABELS[wDays[i]];
    cell.appendChild(lbl);
    if (wChiroDay === i) {
      const cl = document.createElement('div'); cl.className = 'cal-label cl-chiro'; cl.textContent = 'Chiro'; cell.appendChild(cl);
    }
    const sel = document.createElement('select'); sel.className = 'cal-sel';
    W_TYPES.forEach(t => {
      const opt = document.createElement('option'); opt.value = t; opt.textContent = W_LABELS[t];
      if (t === wDays[i]) opt.selected = true; sel.appendChild(opt);
    });
    const idx = i;
    sel.addEventListener('change', () => { wDays[idx] = sel.value; buildWeekCalendar(); });
    cell.appendChild(sel); cal.appendChild(cell);
  }
  updateWeekSummary();
}

function updateChiroTracking() {
  const last = document.getElementById('w-last-chiro').value;
  const next = document.getElementById('w-next-chiro').value;
  saveSettings({ lastChiro: last, nextChiro: next });
  // Mark chiro day on calendar
  wChiroDay = -1;
  if (next) {
    const nd = new Date(next); const today = new Date();
    const startOfWeek = new Date(today); startOfWeek.setDate(today.getDate() - today.getDay());
    const diff = Math.round((nd - startOfWeek) / (1000*60*60*24));
    if (diff >= 0 && diff < 7) wChiroDay = diff;
  }
  // Chiro overdue alert
  const alert = document.getElementById('w-chiro-alert');
  if (last) {
    const ld = new Date(last); const today = new Date();
    const daysSince = Math.round((today - ld) / (1000*60*60*24));
    if (daysSince >= 21 && wChiroDay < 0) {
      alert.innerHTML = `<div class="chiro-alert" style="margin-top:8px">Chiro is due — last appointment was ${daysSince} days ago. Schedule this week.</div>`;
    } else { alert.innerHTML = ''; }
  } else { alert.innerHTML = ''; }
  buildWeekCalendar();
}

function updateWeekSummary() {
  const sec = document.getElementById('w-summary-sec');
  if (!wWeekType) { sec.style.display = 'none'; return; }
  sec.style.display = 'block';
  const showDays  = wDays.filter(d => d === 'show').length;
  const hardDays  = wDays.filter(d => d === 'hard').length;
  const foundDays = wDays.filter(d => d === 'foundation').length;
  const restDays  = wDays.filter(d => d === 'off' || d === 'light').length;
  const sum = document.getElementById('w-summary');
  let html = `<div class="week-sum-card">
    <div class="week-sum-title">${wWeekType==='home'?'Home week — build the pattern':wWeekType==='show'?'Show week — protect the pattern':'Mixed week — balance performance and recovery'}</div>
    <div class="sum-grid">
      <div class="sum-chip"><div class="sv">${showDays}</div><div class="sl">show days</div></div>
      <div class="sum-chip"><div class="sv">${hardDays+foundDays}</div><div class="sl">work days</div></div>
      <div class="sum-chip"><div class="sv">${restDays}</div><div class="sl">rest days</div></div>
      <div class="sum-chip"><div class="sv">${wChiroDay >= 0 ? W_DAYS[wChiroDay] : '—'}</div><div class="sl">chiro day</div></div>
    </div>
  </div>`;

  // Guidance cards
  const guides = getWeekGuides(showDays, hardDays, foundDays);
  guides.forEach(g => {
    html += `<div class="proto-card"><div class="proto-hdr proto-hdr-${g.color}"><span class="proto-badge badge-${g.color}">${g.badge}</span><span class="proto-title title-${g.color}">${g.title}</span></div><div class="proto-body"><ul class="proto-items">`;
    g.items.forEach(item => { html += `<li>${item}</li>`; });
    html += '</ul></div></div>';
  });
  sum.innerHTML = html;
}

function getWeekGuides(show, hard, found) {
  const guides = [];
  if (wWeekType === 'home') {
    guides.push({ color:'green', badge:'Focus', title:'This week at home',
      items:['Foundation days: long & low, transitions, slow circles — fix the movement pattern','At least one true stretch day between hard sessions — do not skip','Straight backing every ride (even 5 min) — biggest SI tool at home','P2 after every hard or foundation session, 15–20 min','Monitor hind step before and after each ride — note changes'] });
    guides.push({ color:'blue', badge:'P2 + Equipod', title:'Therapy plan this week',
      items:['Hard/foundation days: P2 within 1 hour post-ride, full back + SI + glutes','Stretch days: P2 short session, 15 min, maintenance only','Equipod: bilateral check after P2, target shorter/tighter side','Therapy sheet: on after tools any day he felt tight or uneven'] });
  } else if (wWeekType === 'show') {
    guides.push({ color:'green', badge:'At the show', title:'Show week priorities',
      items:['Pre-show days: light work only — arrive loose, not tired','Warm-up: short and purposeful, stop early if he feels good','After each run: hand walk 10–15 min, therapy sheet within 30 min','Between runs: keep moving, do not let him stiffen in a stall','Do not drill or fix things at the show — protect what you have'] });
    guides.push({ color:'blue', badge:'P2 + Equipod', title:'Therapy at the show',
      items:['Night before first show day: P2 full reset session','After each show day: P2 focused SI + glutes, 20 min; Equipod reactive spots','Travel day home: therapy sheet on during haul','Day after last show day: P2 extended session, 25 min, full recovery'] });
  } else {
    guides.push({ color:'amber', badge:'Mixed week', title:'Balancing home and show days',
      items:['Home days before show: foundation work — do not overdo it, arrive fresh','Show days: protect and perform, minimal warm-up, hand walk after runs','Day after last show day: stretch or hand walk only — mandatory recovery','Watch hind step carefully on transition days between home and show'] });
    guides.push({ color:'blue', badge:'P2 + Equipod', title:'Therapy this week',
      items:['Foundation days: P2 post-ride, standard protocol','Night before first show day: P2 full reset','Each show day evening: P2 + Equipod recovery','Post-show day: P2 extended (25 min) + Equipod bilateral'] });
  }
  if (show >= 3) {
    guides.push({ color:'amber', badge:'Watch for', title:'High show volume — warning signs',
      items:['Hind step shortening by day 2 or 3 of showing — very common at 3–4 day shows','Back tightening mid-show: increase P2 time that evening','Leads getting sticky: early warning, adjust warm-up next day','Two flags at the show: consider scratching last run and prioritizing recovery'] });
  }
  return guides;
}

function saveWeeklyPlan() {
  const plan = {
    weekKey: getWeekKey(), weekType: wWeekType, days: [...wDays],
    chiroDay: wChiroDay, notes: document.getElementById('w-notes').value.trim(),
    savedAt: new Date().toISOString()
  };
  saveWeekPlan(plan);
  const btn = document.querySelector('#screen-weekly .action-btn');
  btn.textContent = 'Saved ✓'; btn.style.background = '#bde89a';
  setTimeout(() => { btn.textContent = 'Save week plan'; btn.style.background = ''; }, 2000);
}

function restoreWeekPlan(plan) {
  if (plan.weekType) {
    wWeekType = plan.weekType;
    const btn = document.querySelector(`.wtype-btn[data-wt="${plan.weekType}"]`);
    if (btn) btn.classList.add('sel-' + plan.weekType);
    document.getElementById('w-show-opts').style.display = (wWeekType === 'show' || wWeekType === 'mixed') ? 'block' : 'none';
  }
  if (plan.days) wDays = plan.days;
  if (plan.notes) document.getElementById('w-notes').value = plan.notes;
  buildWeekCalendar();
}
