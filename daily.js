// daily.js

const SCORE_ITEMS = ['Hind step length','Tracking up','Leads (clean/easy)','Transitions','Circle balance','Back feel'];
const FLAG_ITEMS  = ['Short stepping behind','Uneven both directions','Sticky leads','Tight back'];

const SUPPLEMENTS = [
  { id:'sup_vite',    label:'Vitamin E',        dose:'Per weight — daily, non-negotiable',      critical:true  },
  { id:'sup_amino',   label:'Amino acids',       dose:'Lysine / threonine / methionine — topline + SI support', critical:true  },
  { id:'sup_omega',   label:'Omega-3 / flax',    dose:'Ground flax or flax oil — anti-inflammatory',            critical:true  },
  { id:'sup_electro', label:'Electrolytes',       dose:'Show days, hard work days, and hot weather',            critical:false },
  { id:'sup_water',   label:'Fresh water check',  dose:'Full bucket, clean — verify every day',                  critical:true  },
];

const TASK_DEFS = {
  morning: [
    { id:'t_walk_check',    label:'Walk in hand — check hind step',         critical:true,  note:'First thing every day' },
    { id:'t_back_check',    label:'Run hand down topline for tightness',     critical:false, note:'5 seconds tells you a lot' },
    { id:'t_feed_obs',      label:'Observed at morning feed — eating well',  critical:false, note:'' },
  ],
  therapy: [
    { id:'t_p3_main',       label:'P3 session — back + SI + glutes',        critical:true,  note:'15–25 min depending on day type' },
    { id:'t_equipod',       label:'Equipod — bilateral asymmetry check',     critical:false, note:'Target tighter/shorter side' },
    { id:'t_sheet',         label:'Therapy sheet on (20–45 min post-ride)',  critical:false, note:'While muscles still warm' },
    { id:'t_handwalk_cool', label:'Hand walk cool-down after ride',          critical:true,  note:'10–15 min minimum' },
  ],
  show: [
    { id:'t_warmup_short',  label:'Warm-up kept short — stopped when loose', critical:true,  note:'Do not over warm-up at shows' },
    { id:'t_postrun_walk',  label:'Hand walked 10–15 min after run',          critical:true,  note:'Watch every hind step' },
    { id:'t_show_sheet',    label:'Therapy sheet on within 30 min of run',    critical:false, note:'' },
    { id:'t_between_runs',  label:'Kept moving between runs (no long stall)', critical:false, note:'SI horses stiffen fast when standing' },
    { id:'t_p3_show',       label:'P3 session this evening',                  critical:true,  note:'20 min — SI + glutes focused' },
    { id:'t_equipod_show',  label:'Equipod on reactive spots post-show',      critical:false, note:'' },
  ],
  hard: [
    { id:'t_hard_quality',  label:'Session kept short and quality-focused',  critical:false, note:'Quit while he feels good' },
    { id:'t_p3_hard',       label:'P3 within 1 hour post-ride',              critical:true,  note:'Full back + SI + glutes' },
    { id:'t_equipod_hard',  label:'Equipod — check both sides',              critical:false, note:'' },
    { id:'t_sheet_hard',    label:'Therapy sheet after tools',               critical:false, note:'30–45 min' },
  ],
  foundation: [
    { id:'t_longlow',       label:'Long & low work included',                critical:false, note:'True back lift, not just head down' },
    { id:'t_backing',       label:'Straight backing done',                   critical:true,  note:'Even 5 min — biggest SI tool at home' },
    { id:'t_transitions',   label:'Lots of transitions — push from behind',  critical:false, note:'' },
    { id:'t_p3_found',      label:'P3 session post-ride',                    critical:true,  note:'15–20 min maintenance' },
    { id:'t_equipod_found', label:'Equipod spot check',                      critical:false, note:'' },
  ],
  stretch: [
    { id:'t_stretch_only',  label:'Kept to walk/easy trot, no pressure',    critical:false, note:'' },
    { id:'t_p3_stretch',    label:'P3 short session (15 min)',               critical:false, note:'Maintenance' },
  ],
  rest: [
    { id:'t_p3_rest',       label:'P3 optional — 15 min light session',     critical:false, note:'Especially if tight yesterday' },
    { id:'t_turnout',       label:'Turnout / movement time',                 critical:false, note:'' },
  ],
};

const DAY_TASK_MAP = {
  show:       ['morning','show'],
  hard:       ['morning','hard'],
  foundation: ['morning','foundation'],
  stretch:    ['morning','stretch','therapy'],
  light:      ['morning','rest','therapy'],
  off:        ['morning','rest'],
};

const PROTOCOLS = {
  show: {
    green:{ color:'green', badge:'On track', title:'Show day — feeling good',
      warmup:['Walk → trot → lope, keep it short and purposeful','Check: even behind, soft back, clean leads','If he feels good — STOP early'],
      postrun:['Hand walk 10–15 min after run — watch every step','Therapy sheet on within 30 min'],
      evening:['P3: full back + SI, 15–20 min','Equipod: check both sides for asymmetry','Electrolytes if hot day']},
    amber:{ color:'amber', badge:'Watch him', title:'Show day — monitor closely',
      warmup:['Minimal warm-up — forward and soft only','No extra stops or rollbacks'],
      postrun:['Hand walk 15 min — watch every step','Therapy sheet on immediately'],
      evening:['P3: SI + glutes, 20–25 min','Equipod: tighter side specifically','Schedule chiro within 48 hours']},
    red:{ color:'red', badge:'Protect him', title:'Show day — back off',
      warmup:['Walk and trot only — no stops','Make the call: if uneven, scratch'],
      postrun:['Hand walk 20 min','P3 immediately after walk-out','Therapy sheet on for haul home'],
      evening:['P3 second session if still tight','Call chiro — book next available immediately','Tomorrow: hand walk only']}
  },
  hard: {
    green:{ color:'green', badge:'Go', title:'Hard work — good baseline',
      ride:['Quality over quantity — short intentional session','Quit while he feels good'],
      post:['Hand walk 10–15 min cool-down','P3: full session within 1 hour','Equipod: both sides','Therapy sheet 30–45 min after therapy']},
    amber:{ color:'amber', badge:'Lighten up', title:'Hard work — cut it back',
      ride:['Half session — quality not volume','No repetitive stops'],
      post:['P3: 25 min focused on SI','Equipod: weaker side','Therapy sheet after tools'],
      evening:['Schedule chiro this week','Tomorrow: stretch or foundation only']},
    red:{ color:'red', badge:'Stand down', title:'Hard work — do not proceed',
      ride:['Do NOT do hard work — switch to hand walk only'],
      post:['P3: 25–30 min full session','Equipod both sides','Therapy sheet 45 min'],
      evening:['Call chiro — book immediately','Tomorrow: stretch only']}
  },
  foundation: {
    green:{ color:'green', badge:'Build', title:'Foundation — ideal day',
      ride:['Long and low — true back lift','Slow trot, big circles, both directions','Lots of transitions — push from behind','Straight backing — correct and slow (key for SI)','Quit when lifted and engaged'],
      post:['Hand walk 10 min','P3: 15–20 min routine','Equipod: spot check both sides']},
    amber:{ color:'amber', badge:'Easy does it', title:'Foundation — go easy',
      ride:['20–25 min max, long and low only','Walk it out if he stiffens — do not push'],
      post:['P3: 20–25 min focused on SI + back','Equipod on tighter side','Therapy sheet after']},
    red:{ color:'red', badge:'Stretch only', title:'Foundation — drop to stretch only',
      ride:['Walk and trot only, 10–15 min max'],
      post:['P3: 25–30 min thorough','Equipod both sides','Call chiro — do not wait']}
  },
  stretch: {
    green:{ color:'green', badge:'Maintain', title:'Stretch day',
      ride:['20 min max, walk and easy trot, long rein'],
      post:['P3: 15 min topline + SI','Equipod: quick bilateral check']},
    amber:{ color:'amber', badge:'Extra easy', title:'Stretch — go lighter',
      ride:['Walk only or very easy trot — 15 min max'],
      post:['P3: 20–25 min','Equipod on reactive side']},
    red:{ color:'red', badge:'No ride', title:'Stretch — hand walk only',
      ride:['Do not ride today — hand walk 15–20 min only'],
      post:['P3: 25–30 min','Equipod both sides','Call chiro immediately']}
  },
  light: {
    green:{ color:'blue', badge:'Recovery', title:'Hand walk day',
      tasks:['Hand walk 15–20 min — watch hind step throughout','P3: 15 min maintenance','Equipod: quick bilateral check']},
    amber:{ color:'amber', badge:'Monitor', title:'Hand walk — watch him',
      tasks:['Hand walk 20 min — note if step improves as he warms','P3: 20–25 min SI + glutes','Consider scheduling chiro sooner']},
    red:{ color:'red', badge:'Act now', title:'Hand walk — needs attention',
      tasks:['Hand walk 15 min — slow and forward','P3: 25–30 min full session','Call chiro today','Do not ride tomorrow until hind step normalizes']}
  },
  off: {
    any:{ color:'off', badge:'Rest', title:'Day off — not at a show',
      tasks:['Check hind step and topline visually at feed','P3 optional — 15 min if tight yesterday','Turnout if possible']}
  }
};

const SECTION_LABELS = { morning:'Morning check', warmup:'Warm-up', ride:'Ride plan', tasks:'Tasks', post:'Immediately after', postrun:'After your run', evening:'Evening' };

const PLACEMENT_GUIDE_HTML = `
<div class="placement-guide">
  <button class="placement-toggle" onclick="togglePlacementGuide(this)" aria-expanded="false">
    <span>⚡ P3 + Equipod placement guide</span>
    <span class="placement-chevron">▼</span>
  </button>
  <div class="placement-body" style="display:none">

    <div class="placement-section">
      <div class="placement-hdr placement-hdr-p3">P3 (PEMF) — SI → glutes → hamstrings → back</div>
      <div class="placement-step">
        <div class="placement-step-title"><span class="pdot pdot-red"></span>1. SI joint — PRIMARY <span class="placement-badge">5 min</span></div>
        <div class="placement-detail">Top of croup, just either side of spine where pelvis meets spine. 2–3 min per side, slow passes or hold. <strong>Most important spot.</strong></div>
      </div>
      <div class="placement-step">
        <div class="placement-step-title"><span class="pdot pdot-orange"></span>2. Glutes — power muscle <span class="placement-badge">8 min</span></div>
        <div class="placement-detail">Large muscle mass behind SI, upper hindquarter. 2–4 min each side, cover full muscle. Protects the SI.</div>
      </div>
      <div class="placement-step">
        <div class="placement-step-title"><span class="pdot pdot-yellow"></span>3. Hamstrings — engagement <span class="placement-badge">per need</span></div>
        <div class="placement-detail">Back of hind leg below glute. 1–2 min each side. Use when stepping short or lacking push and reach.</div>
      </div>
      <div class="placement-step">
        <div class="placement-step-title"><span class="pdot pdot-blue"></span>4. Longissimus — back line <span class="placement-badge">5 min</span></div>
        <div class="placement-detail">Along both sides of spine, mid-back to loin. Light passes down each side, 3–5 min total. Prevents back tightening after SI compensation.</div>
      </div>
    </div>

    <div class="placement-section">
      <div class="placement-hdr placement-hdr-equipod">Equipod (microcurrent) — after P3, target the asymmetry</div>
      <div class="placement-step">
        <div class="placement-step-title"><span class="pdot pdot-red"></span>1. SI support points <span class="placement-badge">not on spine</span></div>
        <div class="placement-detail">Just OFF the SI joint, slightly lower into muscle. You're treating the support system, not the joint itself.</div>
      </div>
      <div class="placement-step">
        <div class="placement-step-title"><span class="pdot pdot-orange"></span>2. Gluteal trigger points <span class="placement-badge">15–20 min/side</span></div>
        <div class="placement-detail">Middle of glute where it feels tight or hard. Palpate first — treat what you find.</div>
      </div>
      <div class="placement-step">
        <div class="placement-step-title"><span class="pdot pdot-yellow"></span>3. Weaker side — CRITICAL <span class="placement-badge">focus here</span></div>
        <div class="placement-detail">Identify which side is shorter, stiffer, less engaged. Put most Equipod time here. This is how you fix asymmetry.</div>
      </div>
      <div class="placement-step">
        <div class="placement-step-title"><span class="pdot pdot-blue"></span>4. Hamstring insertion <span class="placement-badge">10–15 min</span></div>
        <div class="placement-detail">Top of gaskin where muscle ties into body. Helps push, reach, and engagement.</div>
      </div>
    </div>

    <div class="placement-section placement-adjust">
      <div class="placement-hdr placement-hdr-adjust">🚨 Adjust based on what you see today</div>
      <div class="placement-step"><div class="placement-detail"><strong>Stepping short behind →</strong> increase hamstrings + glutes on P3</div></div>
      <div class="placement-step"><div class="placement-detail"><strong>One direction worse →</strong> hammer weaker side with Equipod</div></div>
      <div class="placement-step"><div class="placement-detail"><strong>Back tight after work →</strong> add more longissimus on P3</div></div>
    </div>

  </div>
</div>`;

let dScores  = {};
let dFlags   = {};
let dDayType = null;
let dMode    = 'assistant';
let taskState = {};

function initDaily() {
  document.getElementById('screen-daily').innerHTML = buildDailyHTML();
  wireDailyEvents();
  loadTodayState();
}

function buildDailyHTML() {
  return `
<div style="display:flex;gap:8px;margin-bottom:16px">
  <button id="btn-asst" class="mode-btn mode-active" onclick="setMode('assistant')">Assistant</button>
  <button id="btn-owner" class="mode-btn" onclick="setMode('owner')">Owner summary</button>
</div>

<div id="d-asst">
  <div class="sec">
    <div class="sec-label">Daily supplements</div>
    <div id="d-supps-top"></div>
  </div>

  <div class="sec">
    ${PLACEMENT_GUIDE_HTML}
  </div>

  <div class="sec">
    <div class="sec-label">Day type</div>
    <div class="day-type-grid">
      <button class="dtype-btn" data-type="show">🏆 Show day</button>
      <button class="dtype-btn" data-type="hard">💪 Hard work</button>
      <button class="dtype-btn" data-type="foundation">🔧 Foundation</button>
      <button class="dtype-btn" data-type="stretch">🌿 Stretch</button>
      <button class="dtype-btn" data-type="light">🚶 Hand walk</button>
      <button class="dtype-btn dtype-btn-off" data-type="off">🏠 Home / off</button>
    </div>
    <div class="dtype-hint" id="d-dtype-hint">Tap a day type to load the task list ↑</div>
  </div>

  <div class="sec">
    <div class="sec-label">Movement check — rate 1–5</div>
    <table class="score-tbl" id="d-score-tbl"></table>
  </div>

  <div class="sec">
    <div class="sec-label">Red flags</div>
    <div class="flag-grid" id="d-flag-grid"></div>
  </div>

  <div class="divider"></div>

  <div class="stats-row">
    <div class="stat-chip"><div class="sv" id="d-avg">—</div><div class="sl">avg score</div></div>
    <div class="stat-chip"><div class="sv" id="d-low" style="color:#e03030">0</div><div class="sl">at 1–2</div></div>
    <div class="stat-chip"><div class="sv" id="d-chiro" style="font-size:13px">—</div><div class="sl">chiro flag</div></div>
  </div>

  <div id="d-chiro-alert"></div>

  <div id="d-proto-sec" style="display:none">
    <div id="d-protocol"></div>
    <div class="divider"></div>
    <div class="sec">
      <div class="sec-label">Task checklist</div>
      <div id="d-tasklist"></div>
    </div>
  </div>

  <div class="sec">
    <div class="sec-label">Notes</div>
    <textarea class="notes-area" id="d-notes" rows="3" placeholder="Anything notable — sticky lead, skipped P3, chiro was Tuesday..."></textarea>
  </div>
  <button class="action-btn" onclick="saveTodayRide()">Save today's record</button>
</div>

<div id="d-owner" style="display:none">
  <div id="d-owner-content"></div>
</div>`;
}

function togglePlacementGuide(btn) {
  const body = btn.nextElementSibling;
  const chevron = btn.querySelector('.placement-chevron');
  const isOpen = body.style.display !== 'none';
  body.style.display = isOpen ? 'none' : 'block';
  chevron.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
  btn.setAttribute('aria-expanded', String(!isOpen));
}

function wireDailyEvents() {
  renderSupplementsTop();

  const tbl = document.getElementById('d-score-tbl');
  SCORE_ITEMS.forEach((item, i) => {
    dScores[i] = 0;
    const tr = document.createElement('tr');
    const td1 = document.createElement('td'); td1.textContent = item;
    const td2 = document.createElement('td');
    const dots = document.createElement('div'); dots.className = 'sdots';
    for (let v = 1; v <= 5; v++) {
      const d = document.createElement('button'); d.className = 'sd';
      d.textContent = v; d.dataset.row = i; d.dataset.val = v;
      d.addEventListener('click', () => {
        dScores[i] = v;
        tbl.querySelectorAll('.sd[data-row="'+i+'"]').forEach(el => el.className = 'sd');
        d.classList.add(v >= 4 ? 'g' : v === 3 ? 'a' : 'r');
        updateDailyOutput(); persistTodayState();
      });
      dots.appendChild(d);
    }
    td2.appendChild(dots); tr.appendChild(td1); tr.appendChild(td2); tbl.appendChild(tr);
  });

  const fg = document.getElementById('d-flag-grid');
  FLAG_ITEMS.forEach((f, i) => {
    dFlags[i] = false;
    const div = document.createElement('div'); div.className = 'frow';
    const cb = document.createElement('input'); cb.type = 'checkbox'; cb.id = 'df'+i;
    cb.addEventListener('change', () => { dFlags[i] = cb.checked; updateDailyOutput(); persistTodayState(); });
    const lbl = document.createElement('label'); lbl.htmlFor = 'df'+i; lbl.textContent = f;
    div.appendChild(cb); div.appendChild(lbl); fg.appendChild(div);
  });

  document.querySelectorAll('.dtype-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.dtype-btn').forEach(b => {
        b.className = b.dataset.type === 'off' ? 'dtype-btn dtype-btn-off' : 'dtype-btn';
      });
      btn.classList.add('sel-'+btn.dataset.type);
      dDayType = btn.dataset.type;
      const hint = document.getElementById('d-dtype-hint');
      if (hint) hint.style.display = 'none';
      updateDailyOutput(); persistTodayState();
    });
  });

  document.getElementById('d-notes').addEventListener('input', () => persistTodayState());
}

function getDailyTier() {
  const vals = Object.values(dScores).filter(v => v > 0);
  const avg = vals.length ? vals.reduce((a,b) => a+b,0)/vals.length : null;
  const low = vals.filter(v => v <= 2).length;
  const anyFlag = Object.values(dFlags).some(Boolean);
  let tier = 'green';
  if (low >= 3 || (anyFlag && avg < 3) || avg < 2.5) tier = 'red';
  else if (low >= 1 || anyFlag || avg < 3.5) tier = 'amber';
  return { tier, avg, low, anyFlag };
}

function updateDailyOutput() {
  const { tier, avg, low, anyFlag } = getDailyTier();
  document.getElementById('d-avg').textContent = avg !== null ? avg.toFixed(1) : '—';
  document.getElementById('d-low').textContent = low;
  const chiroNeeded = low >= 2 || anyFlag;
  document.getElementById('d-chiro').textContent = chiroNeeded ? 'Yes' : 'No';
  document.getElementById('d-chiro').style.color = chiroNeeded ? '#e03030' : '#2d6a4f';
  document.getElementById('d-chiro-alert').innerHTML = chiroNeeded && dDayType !== 'off'
    ? '<div class="chiro-alert">Chiro flag: 2+ low scores or red flags. Schedule within 48 hours.</div>' : '';

  const ps = document.getElementById('d-proto-sec');
  if (!dDayType) { ps.style.display = 'none'; return; }
  ps.style.display = 'block';
  renderDailyProtocol(tier);
  renderTaskChecklist();
  renderSupplementsTop();
  if (dMode === 'owner') renderOwnerView();
}

function renderDailyProtocol(tier) {
  const dp = PROTOCOLS[dDayType];
  if (!dp) { document.getElementById('d-protocol').innerHTML = ''; return; }
  const t = dDayType === 'off' ? 'any' : tier;
  const proto = dp[t] || dp['green'] || dp['any'];
  if (!proto) return;
  const secs = ['morning','warmup','ride','tasks','post','postrun','evening'];
  let h = `<div class="proto-card"><div class="proto-hdr proto-hdr-${proto.color}">
    <span class="proto-badge badge-${proto.color}">${proto.badge}</span>
    <span class="proto-title title-${proto.color}">${proto.title}</span>
  </div><div class="proto-body">`;
  secs.forEach(s => {
    if (!proto[s]) return;
    h += `<div class="proto-sec-label">${SECTION_LABELS[s]}</div><ul class="proto-items">`;
    proto[s].forEach(i => { h += `<li>${i}</li>`; });
    h += '</ul>';
  });
  h += '</div></div>';
  document.getElementById('d-protocol').innerHTML = h;
}

function renderTaskChecklist() {
  const groups = DAY_TASK_MAP[dDayType] || ['morning'];
  const tasks = [];
  groups.forEach(g => { if (TASK_DEFS[g]) tasks.push(...TASK_DEFS[g]); });
  document.getElementById('d-tasklist').innerHTML = tasks.map(t => taskRowHTML(t)).join('');
  document.getElementById('d-tasklist').querySelectorAll('.task-cb').forEach(cb => cb.addEventListener('change', () => handleTaskToggle(cb)));
}

function renderSupplementsTop() {
  const el = document.getElementById('d-supps-top');
  if (!el) return;
  const tasks = SUPPLEMENTS.map(s => ({ id:s.id, label:s.label, critical:s.critical, note:s.dose }));
  el.innerHTML = tasks.map(t => taskRowHTML(t)).join('');
  el.querySelectorAll('.task-cb').forEach(cb => cb.addEventListener('change', () => handleTaskToggle(cb)));
}

function taskRowHTML(task) {
  const done = taskState[task.id] && taskState[task.id].done;
  const time = taskState[task.id] && taskState[task.id].time ? taskState[task.id].time : '';
  const isCrit = task.critical && !done;
  return `<div class="task-row${isCrit?' task-row-critical':''}${done?' task-row-done':''}" id="row_${task.id}">
    <input type="checkbox" class="task-cb" id="cb_${task.id}" data-id="${task.id}"${done?' checked':''}>
    <div class="task-row-body">
      <label for="cb_${task.id}" class="task-label">${task.label}${isCrit?' <span class="task-critical-badge">Required</span>':''}</label>
      ${task.note ? `<div class="task-note">${task.note}</div>` : ''}
    </div>
    ${time ? `<span class="task-time">${time}</span>` : ''}
  </div>`;
}

function handleTaskToggle(cb) {
  const id = cb.dataset.id;
  const done = cb.checked;
  const now  = done ? new Date().toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}) : '';
  taskState[id] = { done, time: now };
  const task = findTaskDef(id);
  document.querySelectorAll('[id="row_'+id+'"]').forEach(row => {
    if (row && task) {
      const isCrit = task.critical && !done;
      row.className = 'task-row'+(isCrit?' task-row-critical':'')+(done?' task-row-done':'');
      const lbl = row.querySelector('.task-label');
      if (lbl) {
        const existing = lbl.querySelector('.task-critical-badge');
        if (existing) existing.remove();
        if (isCrit) lbl.insertAdjacentHTML('beforeend',' <span class="task-critical-badge">Required</span>');
      }
      let timeEl = row.querySelector('.task-time');
      if (done && now) {
        if (!timeEl) { timeEl = document.createElement('span'); timeEl.className='task-time'; row.appendChild(timeEl); }
        timeEl.textContent = now;
      } else if (timeEl) timeEl.remove();
    }
  });
  persistTodayState();
  if (dMode === 'owner') renderOwnerView();
}

function findTaskDef(id) {
  for (const g of Object.values(TASK_DEFS)) {
    const t = g.find(t => t.id === id);
    if (t) return t;
  }
  return SUPPLEMENTS.find(s => s.id === id) || null;
}

function setMode(mode) {
  dMode = mode;
  document.getElementById('btn-asst').className  = 'mode-btn'+(mode==='assistant'?' mode-active':'');
  document.getElementById('btn-owner').className = 'mode-btn'+(mode==='owner'?' mode-active':'');
  document.getElementById('d-asst').style.display  = mode==='assistant' ? 'block' : 'none';
  document.getElementById('d-owner').style.display = mode==='owner'     ? 'block' : 'none';
  if (mode === 'owner') renderOwnerView();
}

function renderOwnerView() {
  const el = document.getElementById('d-owner-content');
  const { tier, avg, low, anyFlag } = getDailyTier();
  const today = new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});
  const dayLabel = {show:'Show day',hard:'Hard work',foundation:'Foundation',stretch:'Stretch',light:'Hand walk',off:'Home / off'}[dDayType]||'Not set';
  const tierColor = tier==='red'?'#e03030':tier==='amber'?'#e8a020':'#2d6a4f';

  const groups = dDayType ? (DAY_TASK_MAP[dDayType]||['morning']) : ['morning'];
  const allTasks = [];
  groups.forEach(g => { if(TASK_DEFS[g]) allTasks.push(...TASK_DEFS[g]); });
  const allWithSupps = [...allTasks, ...SUPPLEMENTS.map(s=>({id:s.id,label:s.label,critical:s.critical}))];
  const done      = allWithSupps.filter(t => taskState[t.id]&&taskState[t.id].done);
  const notDone   = allWithSupps.filter(t => !taskState[t.id]||!taskState[t.id].done);
  const critMiss  = notDone.filter(t => t.critical);
  const pct       = allWithSupps.length ? Math.round(done.length/allWithSupps.length*100) : 0;

  let h = `<div style="background:#f5f5f0;border-radius:12px;padding:14px;margin-bottom:14px">
    <div style="font-size:12px;color:#888;margin-bottom:4px">${today}</div>
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
      <span style="font-size:16px;font-weight:600;color:#1a1a1a">${dayLabel}</span>
      <span style="font-size:13px;font-weight:700;color:${tierColor}">${tier==='red'?'Red day':tier==='amber'?'Amber day':'Green day'}</span>
      ${avg!==null?`<span style="font-size:13px;color:#555">Avg <strong>${avg.toFixed(1)}</strong></span>`:''}
    </div>
  </div>`;

  h += `<div style="margin-bottom:16px">
    <div style="display:flex;justify-content:space-between;margin-bottom:5px">
      <span style="font-size:13px;font-weight:600">Tasks completed</span>
      <span style="font-size:13px;font-weight:600;color:${pct===100?'#2d6a4f':'#888'}">${done.length} / ${allWithSupps.length}</span>
    </div>
    <div style="height:9px;background:#eee;border-radius:5px;overflow:hidden">
      <div style="height:100%;width:${pct}%;background:${pct===100?'#7dc863':pct>60?'#e8a020':'#e87070'};border-radius:5px;transition:width .3s"></div>
    </div>
  </div>`;

  if (critMiss.length) {
    h += `<div class="chiro-alert" style="margin-bottom:14px"><strong>Still required — not done yet:</strong>`;
    critMiss.forEach(t => { h += `<div style="margin-top:5px;display:flex;align-items:center;gap:7px"><span style="width:7px;height:7px;border-radius:50%;background:#e03030;display:inline-block;flex-shrink:0"></span><span>${t.label}</span></div>`; });
    h += '</div>';
  }

  if (done.length) {
    h += `<div style="margin-bottom:14px"><div class="sec-label" style="margin-bottom:8px">Done</div>`;
    done.forEach(t => {
      const tm = taskState[t.id]&&taskState[t.id].time ? taskState[t.id].time : '';
      h += `<div style="display:flex;align-items:center;justify-content:space-between;padding:7px 0;border-bottom:0.5px solid #eee">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="color:#2d6a4f;font-size:15px;line-height:1">✓</span>
          <span style="font-size:13px;color:#1a1a1a">${t.label}</span>
        </div>
        ${tm?`<span style="font-size:12px;color:#aaa;white-space:nowrap">${tm}</span>`:''}
      </div>`;
    });
    h += '</div>';
  }

  const optMiss = notDone.filter(t => !t.critical);
  if (optMiss.length) {
    h += `<div style="margin-bottom:14px"><div class="sec-label" style="margin-bottom:8px">Not done / optional</div>`;
    optMiss.forEach(t => { h += `<div style="padding:7px 0;border-bottom:0.5px solid #eee;font-size:13px;color:#aaa">${t.label}</div>`; });
    h += '</div>';
  }

  const notes = document.getElementById('d-notes') ? document.getElementById('d-notes').value.trim() : '';
  if (notes) h += `<div style="background:#faeeda;border-radius:10px;padding:10px 13px;font-size:13px;color:#7a4410;margin-top:4px"><strong>Notes:</strong> ${notes}</div>`;

  el.innerHTML = h;
}

function persistTodayState() {
  const log = {
    dayType: dDayType, scores:{...dScores}, flags:{...dFlags},
    tasks:{...taskState},
    notes: document.getElementById('d-notes') ? document.getElementById('d-notes').value : ''
  };
  saveTasks(todayKey(), log);
}

function saveTodayRide() {
  const {tier,avg,low,anyFlag} = getDailyTier();
  saveRide({
    date: todayKey(), dayType:dDayType, scores:{...dScores}, flags:{...dFlags},
    avg: avg?parseFloat(avg.toFixed(1)):null, low, anyFlag, tier,
    notes: document.getElementById('d-notes').value.trim(),
    tasksDone: Object.keys(taskState).filter(k=>taskState[k]&&taskState[k].done).length,
    taskStates:{...taskState}
  });
  persistTodayState();
  const btn = document.querySelector('#d-asst .action-btn');
  btn.textContent='Saved ✓'; btn.style.background='#bde89a';
  setTimeout(()=>{btn.textContent="Save today's record";btn.style.background='';},2000);
  if(typeof refreshHistory==='function') refreshHistory();
}

function loadTodayState() {
  const log = getTaskLog(todayKey());
  taskState = log && log.tasks ? {...log.tasks} : {};
  renderSupplementsTop();
  if (!log||!log.dayType) return;
  dDayType = log.dayType;
  const btn = document.querySelector(`.dtype-btn[data-type="${dDayType}"]`);
  if (btn) btn.classList.add('sel-'+dDayType);
  const hint = document.getElementById('d-dtype-hint');
  if (hint) hint.style.display = 'none';
  if (log.scores) Object.keys(log.scores).forEach(i => {
    const v = log.scores[i];
    if (v>0) {
      dScores[i]=v;
      const d = document.getElementById('d-score-tbl').querySelector(`.sd[data-row="${i}"][data-val="${v}"]`);
      if(d) d.classList.add(v>=4?'g':v===3?'a':'r');
    }
  });
  if (log.flags) Object.keys(log.flags).forEach(i => {
    if(log.flags[i]){dFlags[i]=true; const c=document.getElementById('df'+i); if(c)c.checked=true;}
  });
  if (log.notes && document.getElementById('d-notes')) document.getElementById('d-notes').value=log.notes;
  updateDailyOutput();
}
