// ============================================================
// The Centurion® — Backend API Layer v2
// ============================================================
const BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

async function api(path, opts = {}) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...opts.headers },
      ...opts,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`[API] ${path} failed:`, err.message);
    throw err;
  }
}

export const checkHealth   = ()                    => api('/health');
export const identifyFace  = (imageBase64)         => api('/api/identify', { method:'POST', body: JSON.stringify({ image: imageBase64 }) });
export const enrollFace    = (userId, imageBase64) => api('/api/enroll',   { method:'POST', body: JSON.stringify({ userId, image: imageBase64 }) });
export const getLogs       = (limit = 50)          => api(`/api/logs?limit=${limit}`);
export const getAnalytics  = ()                    => api('/api/analytics');
export const getIoTStatus  = ()                    => api('/api/iot/status');

// ── Pending registration approval (stored in sessionStorage) ─
const PENDING_KEY = 'centurion_pending_registrations';

export function getPendingRegistrations() {
  try { return JSON.parse(sessionStorage.getItem(PENDING_KEY) || '[]'); }
  catch { return []; }
}

export function savePendingRegistration(reg) {
  const list = getPendingRegistrations();
  const updated = [...list.filter(r => r.email !== reg.email), reg];
  sessionStorage.setItem(PENDING_KEY, JSON.stringify(updated));
}

export function approvePendingRegistration(email) {
  const list = getPendingRegistrations();
  const updated = list.map(r => r.email === email ? { ...r, approved: true, approvedAt: new Date().toISOString() } : r);
  sessionStorage.setItem(PENDING_KEY, JSON.stringify(updated));
}

export function rejectPendingRegistration(email) {
  const list = getPendingRegistrations();
  const updated = list.filter(r => r.email !== email);
  sessionStorage.setItem(PENDING_KEY, JSON.stringify(updated));
}

export function isRegistrationApproved(email) {
  const list = getPendingRegistrations();
  const reg = list.find(r => r.email === email);
  return reg?.approved === true;
}

// ── HN news feed ──────────────────────────────────────────────
export const getHackerNews = async (count = 8) => {
  try { return await api(`/api/news?count=${count}`); }
  catch {
    const ids = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json').then(r=>r.json());
    const items = await Promise.all(ids.slice(0,count).map(id=>fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(r=>r.json())));
    return items.filter(i=>i&&i.title);
  }
};

export function pollLogs(cb, ms=4000) {
  const id=setInterval(async()=>{ try{ cb(await getLogs(100)); }catch{} },ms);
  return ()=>clearInterval(id);
}
export function pollIoT(cb, ms=1500) {
  const id=setInterval(async()=>{ try{ cb(await getIoTStatus()); }catch{} },ms);
  return ()=>clearInterval(id);
}
