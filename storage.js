// storage.js — all data lives here, persists in localStorage

const STORE_KEY = 'horseDaily_v2';

function loadStore() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : { rides: [], weekPlans: [], settings: {}, taskLogs: {} };
  } catch(e) { return { rides: [], weekPlans: [], settings: {}, taskLogs: {} }; }
}

function saveStore(data) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch(e) {}
}

function saveRide(ride) {
  const store = loadStore();
  const today = new Date().toISOString().split('T')[0];
  const idx = store.rides.findIndex(r => r.date === today);
  if (idx >= 0) store.rides[idx] = ride;
  else store.rides.push(ride);
  store.rides.sort((a,b) => a.date.localeCompare(b.date));
  if (store.rides.length > 90) store.rides = store.rides.slice(-90);
  saveStore(store);
}

function getRides(days) {
  const store = loadStore();
  if (!days) return store.rides;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutStr = cutoff.toISOString().split('T')[0];
  return store.rides.filter(r => r.date >= cutStr);
}

function saveWeekPlan(plan) {
  const store = loadStore();
  const weekKey = getWeekKey();
  const idx = store.weekPlans.findIndex(w => w.weekKey === weekKey);
  if (idx >= 0) store.weekPlans[idx] = plan;
  else store.weekPlans.push(plan);
  if (store.weekPlans.length > 12) store.weekPlans = store.weekPlans.slice(-12);
  saveStore(store);
}

function getWeekPlan() {
  const store = loadStore();
  const weekKey = getWeekKey();
  return store.weekPlans.find(w => w.weekKey === weekKey) || null;
}

// Task log: keyed by date, stores completed task IDs + timestamps
function saveTasks(date, tasks) {
  const store = loadStore();
  if (!store.taskLogs) store.taskLogs = {};
  store.taskLogs[date] = tasks;
  // Keep 30 days of task logs
  const keys = Object.keys(store.taskLogs).sort();
  if (keys.length > 30) keys.slice(0, keys.length - 30).forEach(k => delete store.taskLogs[k]);
  saveStore(store);
}

function getTaskLog(date) {
  const store = loadStore();
  return (store.taskLogs && store.taskLogs[date]) ? store.taskLogs[date] : {};
}

function getTodayTaskLog() {
  return getTaskLog(new Date().toISOString().split('T')[0]);
}

function getSettings() { return loadStore().settings || {}; }

function saveSettings(s) {
  const store = loadStore();
  store.settings = { ...store.settings, ...s };
  saveStore(store);
}

function getWeekKey() {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split('T')[0];
}

function todayKey() {
  return new Date().toISOString().split('T')[0];
}
