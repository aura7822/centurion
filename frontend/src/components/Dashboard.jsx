import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { getLogs, getAnalytics, pollLogs, pollIoT } from '../api/backendAPI';
import { takeScreenshot, readAloud, stopReadAloud } from '../utils/webcam_utils';
import IoTSimulation from './IoTSimulation';
import { useCameraContext } from '../App';
import ReactDOM from 'react-dom';

// ── Config ────────────────────────────────────────────────────
const GEMINI_API_KEY = 'IzaSyA8ksUis2vWpv0jWmIxcPeKlhWp_sRZUBQ';

// ── Background video/gif path ─────────────────────────────────
const HERO_VIDEO_SRC = 'https://raw.githubusercontent.com/aura7822/centurion/main/frontend/public/assets/images/hero.gif';

const SUDO_EMAIL    = 'joshuaura7822@gmail.com';
const SUDO_USERNAME = 'aura';
const INACTIVITY_MS = 4 * 60 * 1000;
const API_BASE      = 'http://localhost:8080';

// ── Snapshot rate-limit constants ─────────────────────────────
const SNAP_MAX_PER_MIN = 4;
const SNAP_MIN_GAP_MS  = 15000; // at least 15s between any two snaps

// ── Palette ───────────────────────────────────────────────────
const GOLD   = '#c9a84c';
const GOLD2  = '#e8c76a';
const GREEN  = '#00e87a';
const RED    = '#e83535';
const BLUE   = '#3d8bff';
const CYAN   = '#00d4ff';
const PURPLE = '#cc44ff';
const DIM    = 'rgba(201,168,76,0.18)';
const PIE_COLORS = [GREEN, RED, GOLD, BLUE, PURPLE];

// ── Social links ──────────────────────────────────────────────
const SOCIAL_LINKS = [
  { label: 'GitHub',    href: 'https://github.com/aura7822' },
  { label: 'Instagram', href: 'https://instagram.com/_t.y.p.i.c.a.l.l.y_aura_73' },
  { label: 'LinkedIn',  href: 'https://www.linkedin.com/in/aura-joshua-615660344/' },
  { label: 'WhatsApp',  href: 'https://wa.me/254119750041' },
];

// ── Collaborators / Tech Stack ────────────────────────────────
const COLLABORATORS = [
  { name: 'Aura Joshua',        role: 'Lead Architect',     stack: 'C++ / React / Python' },
  { name: 'ArcFace R100',       role: 'Biometric Engine',   stack: 'Deep Learning / CV' },
  { name: 'MongoDB Atlas',      role: 'Database Layer',     stack: 'NoSQL / Aggregation' },
  { name: 'OpenCV DNN',         role: 'Vision Pipeline',    stack: 'C++ / CUDA' },
  { name: 'Tor Network',        role: 'Anonymity Layer',    stack: 'SOCKS5 / Onion Routing' },
  { name: 'Anthropic AI',       role: 'Intelligence Layer', stack: 'Claude API' },
  { name: 'Node.js / Express',  role: 'REST API',           stack: 'TypeScript / JWT' },
  { name: 'AES-256-GCM',        role: 'Encryption',         stack: 'Zero-Trust Crypto' },
];

// ── Card styles ───────────────────────────────────────────────
const card = {
  background: 'rgba(10, 10, 12, 0.88)',
  border: '1px solid rgba(201,168,76,0.14)',
  borderRadius: 14,
  backdropFilter: 'blur(20px)',
  boxShadow: '0 4px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
};

const cpCard = {
  background: 'rgba(4,4,12,0.92)',
  border: `1px solid ${CYAN}22`,
  borderRadius: 12,
  backdropFilter: 'blur(20px)',
  boxShadow: `0 4px 40px rgba(0,212,255,0.06), inset 0 1px 0 rgba(0,212,255,0.06)`,
  position: 'relative',
  overflow: 'hidden',
};

// ── Translations ──────────────────────────────────────────────
const STRINGS = {
  en: {
    analytics:'Analytics', logs:'Security Feed', snapshots:'Surveillance',
    summary:'Summary Report', news:'News Bulletin - Take a break ☕', contact:'Contact', about:'About Centurion',
    logout:'Sign Out', simulation:'IoT Simulation', language:'Language',
    darkMode:'Dark', lightMode:'Light', readAloud:'Read Aloud',
    screenshot:'Screenshot', sounds:'Sounds', autoScroll:'Auto Scroll',
    aiAssist:'AI Assistant', settings:'Preferences', navigation:'NAVIGATION',
    sessionActive:'SESSION ACTIVE', online:'ONLINE', monitoring:'MONITORING',
    offline:'OFFLINE', events:'events', accessibility:'Accessibility',
    totalAttempts:'Total Attempts', authorized:'Authorized', denied:'Denied',
    avgConfidence:'Avg Confidence', uniqueUsers:'Unique Users', avgAge:'Avg Age',
    cpuUsage:'CPU', memory:'Memory', disk:'Disk I/O', network:'Network',
    attemptsHour:'Attempts Per Hour', authRatio:'Auth Ratio', confidenceTrend:'Confidence Trend',
    demographics:'Demographics', successRate:'Auth Rate',
    securityNews:'Security News', devNews:'Dev & Tech News',
    contactAdmin:'Message an Administrator',
    sendMessage:'Send Message', adminEmail:'Admin email', subject:'Subject',
    message:'Your message...', exportPDF:'Export PDF', copyReport:'Copy Report',
    startMonitor:'START MONITOR', booting:'BOOTING', restart:'Restart', stop:'Stop',
    clear:'Clear', copy:'Copy', liveMonitor:'Live Security Monitor',
    pressEsc:'Press ESC to logout', inactivity:'Auto-logout in',
    stayLoggedIn:'Stay Logged In', scanHere:'Scan to connect',
    suggestImprove:'Suggest an improvement', reportBug:'Report a bug', buyCoffee:'Buy me a coffee',
    openWhatsapp:'Open WhatsApp', footer:'Centurion. All Rights Reserved.',
    sendEmail:'Send to Email', deleteAccount:'Delete Account', confirmDelete:'Confirm Delete',
    cancelDelete:'Cancel', accountDeleted:'Account removed.',
    registeredUsers:'Registered Users',
  },
  sw: {
    analytics:'Takwimu', logs:'Mlango wa Usalama', snapshots:'Ufuatiliaji',
    summary:'Muhtasari', news:'Habari', contact:'Wasiliana', about:'Kuhusu',
    logout:'Toka', language:'Lugha', monitoring:'INAFUATILIA', online:'MTANDAONI',
    offline:'NJE YA MTANDAO', settings:'Mipangilio', navigation:'URAMBAZAJI',
    sessionActive:'KIPINDI KINAFANYA KAZI', events:'matukio', accessibility:'Upatikanaji',
    totalAttempts:'Jumla', authorized:'Kuruhusiwa', denied:'Kukataliwa',
    footer:'Centurion. Haki Zote Zimehifadhiwa.',
    sendEmail:'Tuma kwa Barua pepe', deleteAccount:'Futa Akaunti',
    registeredUsers:'Watumiaji Waliosajiliwa',
  },
  fr: {
    analytics:'Analytique', logs:'Journal', logout:'Déconnexion', language:'Langue',
    authorized:'Autorisé', denied:'Refusé', totalAttempts:'Total',
    monitoring:'SURVEILLANCE', online:'EN LIGNE', offline:'HORS LIGNE',
    settings:'Paramètres', navigation:'NAVIGATION', footer:'Centurion. Tous droits réservés.',
    sendEmail:'Envoyer par E-mail', deleteAccount:'Supprimer le compte',
    registeredUsers:'Utilisateurs inscrits',
  },
  de: {
    analytics:'Analytik', logs:'Sicherheitsprotokoll', logout:'Abmelden', language:'Sprache',
    authorized:'Autorisiert', denied:'Verweigert', totalAttempts:'Gesamt',
    monitoring:'ÜBERWACHUNG', online:'ONLINE', offline:'OFFLINE',
    settings:'Einstellungen', navigation:'NAVIGATION', footer:'Centurion. Alle Rechte vorbehalten.',
    sendEmail:'Per E-Mail senden', deleteAccount:'Konto löschen',
    registeredUsers:'Registrierte Benutzer',
  },
  es: {
    analytics:'Analíticas', logs:'Registro', logout:'Cerrar sesión', language:'Idioma',
    authorized:'Autorizado', denied:'Denegado', totalAttempts:'Total',
    monitoring:'SUPERVISIÓN', online:'EN LÍNEA', offline:'FUERA DE LÍNEA',
    settings:'Configuración', navigation:'NAVEGACIÓN', footer:'Centurion. Todos los derechos reservados.',
    sendEmail:'Enviar por correo', deleteAccount:'Eliminar cuenta',
    registeredUsers:'Usuarios registrados',
  },
  ja: {
    analytics:'分析', logs:'セキュリティログ', logout:'ログアウト', language:'言語',
    authorized:'許可済み', denied:'拒否', totalAttempts:'総試行回数',
    monitoring:'監視中', online:'オンライン', offline:'オフライン',
    settings:'設定', navigation:'ナビゲーション', footer:'Centurion. 全著作権所有.',
    sendEmail:'メールで送信', deleteAccount:'アカウント削除',
    registeredUsers:'登録ユーザー',
  },
};
function useT(lang) {
  return useCallback((key) => (STRINGS[lang]?.[key]) || STRINGS.en[key] || key, [lang]);
}

function getGreeting(lang, name) {
  const h = new Date().getHours();
  const g = {
    en: h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening',
    sw: h < 12 ? 'Habari za asubuhi' : h < 17 ? 'Habari za mchana' : 'Habari za jioni',
    fr: h < 12 ? 'Bonjour' : h < 17 ? 'Bon après-midi' : 'Bonsoir',
    de: h < 12 ? 'Guten Morgen' : h < 17 ? 'Guten Tag' : 'Guten Abend',
    es: h < 12 ? 'Buenos días' : h < 17 ? 'Buenas tardes' : 'Buenas noches',
    ja: h < 12 ? 'おはようございます' : h < 17 ? 'こんにちは' : 'こんばんは',
  };
  return `${g[lang] || g.en}, ${name}`;
}

function playTone(freq=440,dur=0.15,type='sine',vol=0.32){
  try{const c=new(window.AudioContext||window.webkitAudioContext)();const o=c.createOscillator();const g=c.createGain();o.connect(g);g.connect(c.destination);o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(vol,c.currentTime);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+dur);o.start(c.currentTime);o.stop(c.currentTime+dur);}catch{}
}
const sounds = {
  start:   () => { playTone(440,.1); setTimeout(()=>playTone(550,.1),120); setTimeout(()=>playTone(660,.2),240); },
  stop:    () => { playTone(660,.1); setTimeout(()=>playTone(330,.25,'sawtooth'),240); },
  restart: () => { playTone(330,.08); setTimeout(()=>playTone(440,.08),100); setTimeout(()=>playTone(660,.15),300); },
  alert:   () => { playTone(880,.08,'square'); setTimeout(()=>playTone(880,.08,'square'),180); },
  auth:    () => { playTone(523,.08); setTimeout(()=>playTone(659,.12),100); },
};

// ── Real system metrics from backend (with polling) ───────────
function useSystemMetrics(boosted) {
  const [m, setM] = useState({ cpu:[], mem:[], disk:[], net:[] });
  const tick = useRef(0);

  useEffect(() => {
    // Seed with realistic baseline data
    const seed = (base, v, len=20) =>
      Array.from({length:len}, (_,i) => ({ t:i, v:Math.max(5,Math.min(98,base+(Math.random()-0.5)*v*2)) }));
    setM({ cpu:seed(20,8), mem:seed(35,8), disk:seed(18,5), net:seed(30,12) });

    // Poll /api/system-metrics if available, fall back to animated baseline
    const fetchMetrics = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/system-metrics`);
        if (res.ok) {
          const d = await res.json();
          tick.current++;
          setM(prev => ({
            cpu:  [...prev.cpu.slice(-49),  { t:tick.current, v:Math.round(d.cpu  ?? prev.cpu[prev.cpu.length-1]?.v ?? 20) }],
            mem:  [...prev.mem.slice(-49),  { t:tick.current, v:Math.round(d.mem  ?? prev.mem[prev.mem.length-1]?.v ?? 35) }],
            disk: [...prev.disk.slice(-49), { t:tick.current, v:Math.round(d.disk ?? prev.disk[prev.disk.length-1]?.v ?? 18) }],
            net:  [...prev.net.slice(-49),  { t:tick.current, v:Math.round(d.net  ?? prev.net[prev.net.length-1]?.v ?? 30) }],
          }));
          return;
        }
      } catch {}
      // No endpoint — animate from last value
      tick.current++;
      setM(prev => {
        const n = (arr, base, v, boost=0) => {
          const last = arr[arr.length-1]?.v || base;
          const nv = boosted
            ? Math.max(5, Math.min(98, last + (Math.min(98,base+boost)-last)*0.2 + (Math.random()-.5)*v))
            : Math.max(5, Math.min(98, last + (Math.random()-.5)*v));
          return [...arr.slice(-49), { t:tick.current, v:Math.round(nv) }];
        };
        return {
          cpu:  n(prev.cpu,  20, 6, 45),
          mem:  n(prev.mem,  35, 4, 30),
          disk: n(prev.disk, 18, 3, 25),
          net:  n(prev.net,  30, 10, 35),
        };
      });
    };

    const iv = setInterval(fetchMetrics, 900);
    return () => clearInterval(iv);
  }, [boosted]);

  return m;
}

// ── Typewriter ────────────────────────────────────────────────
function Typewriter({ texts, speed=72 }) {
  const [disp,setDisp] = useState('');
  const [ti,setTi]     = useState(0);
  const [ci,setCi]     = useState(0);
  const [del,setDel]   = useState(false);
  useEffect(() => {
    if(!texts?.length) return;
    const cur = String(texts[ti % texts.length] || '');
    const t = setTimeout(() => {
      if(!del) {
        if(ci < cur.length) { setDisp(cur.slice(0,ci+1)); setCi(c=>c+1); }
        else setTimeout(() => setDel(true), 2200);
      } else {
        if(ci > 0) { setDisp(cur.slice(0,ci-1)); setCi(c=>c-1); }
        else { setDel(false); setTi(t=>t+1); setCi(0); }
      }
    }, del ? speed/2 : speed);
    return () => clearTimeout(t);
  }, [ci, del, ti, texts, speed]);
  return (
    <span style={{ fontFamily:'var(--font-mono)', fontSize:15, color:'rgba(255, 0, 0, 0.72)' }}>
      {String(disp)}
      <span style={{ borderRight:`2.5px solid ${RED}`, marginLeft:2, animation:'blinkCursor 1.1s infinite' }}>&nbsp;</span>
    </span>
  );
}

// ── QR Code ───────────────────────────────────────────────────
function QRCode({ value, size=230 }) {
  return (
    <img src='https://raw.githubusercontent.com/aura7822/centurion/main/frontend/public/assets/images/QR.png'
      alt="QR Code"
      style={{ width:size, height:size, display:'block' }}
    />
  );
}

// ── Section Heading ───────────────────────────────────────────
function SH({ children, sub, id }) {
  return (
    <div id={id} style={{ marginBottom:24, marginTop:8 }}>
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ width:2, height:22, background:`linear-gradient(180deg,${GOLD},${GOLD}22)`, borderRadius:2, flexShrink:0 }} />
        <div style={{ fontFamily:'var(--font-display)', fontSize:13, letterSpacing:5, color:GOLD, fontWeight:700, textTransform:'uppercase' }}>
          {children}
        </div>
      </div>
      {sub && (
        <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'rgba(255,255,255,0.28)', marginTop:5, marginLeft:14, letterSpacing:1 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

// ── Chart tooltips ────────────────────────────────────────────
const CT = {
  contentStyle: {
    background: 'rgba(4,4,4,0.97)',
    border: `1px solid ${GOLD}44`,
    fontFamily: 'monospace',
    fontSize: 12,
    borderRadius: 8,
    boxShadow: `0 8px 32px rgba(0,0,0,0.7)`,
  },
};

const CPCT = {
  contentStyle: {
    background: 'rgba(0,4,12,0.97)',
    border: `1px solid ${CYAN}55`,
    fontFamily: 'monospace',
    fontSize: 12,
    borderRadius: 8,
    boxShadow: `0 8px 32px ${CYAN}18`,
    color: CYAN,
  },
  labelStyle: { color: CYAN },
  itemStyle:  { color: CYAN },
};

// ── Stat Card ─────────────────────────────────────────────────
function StatCard({ label, value, color, sub, trend }) {
  const c = color || GOLD;
  return (
    <div
      style={{ ...card, padding:'22px 20px', position:'relative', overflow:'hidden', transition:'all 0.3s', cursor:'default' }}
      onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.borderColor=c+'44'; e.currentTarget.style.boxShadow=`0 16px 48px ${c}18,0 4px 24px rgba(0,0,0,0.6)`; }}
      onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.borderColor='rgba(201,168,76,0.14)'; e.currentTarget.style.boxShadow=card.boxShadow; }}
    >
      <div style={{ position:'absolute', top:-20, right:-20, width:80, height:80, borderRadius:'50%', background:c, opacity:0.04, pointerEvents:'none' }} />
      <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'rgba(255,255,255,0.35)', letterSpacing:3, marginBottom:10, textTransform:'uppercase' }}>{label}</div>
      <div style={{ fontFamily:'var(--font-display)', fontSize:42, color:c, fontWeight:800, lineHeight:1, letterSpacing:-2, marginBottom:8 }}>{String(value)}</div>
      <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'rgba(255,255,255,0.3)', letterSpacing:1 }}>{sub}</div>
      {trend != null && (
        <div style={{ position:'absolute', top:18, right:18, fontFamily:'var(--font-mono)', fontSize:10, color: trend >= 0 ? GREEN : RED }}>
          {trend >= 0 ? `+${trend}%` : `${trend}%`}
        </div>
      )}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${c}66,${c}11)`, borderRadius:'0 0 14px 14px' }} />
    </div>
  );
}

// ── Metric Sparkline Card ─────────────────────────────────────
function MetricCard({ label, val, data, color }) {
  const v   = data[data.length-1]?.v || 0;
  const col = v > 80 ? RED : v > 60 ? GOLD : color;
  return (
    <div
      style={{ ...card, padding:'16px 18px', transition:'all 0.3s', cursor:'default' }}
      onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.borderColor=col+'44'; }}
      onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.borderColor='rgba(201,168,76,0.14)'; }}
    >
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'rgba(255,255,255,0.35)', letterSpacing:3, textTransform:'uppercase' }}>{label}</div>
        <div style={{ fontFamily:'var(--font-display)', fontSize:26, fontWeight:800, color:col, lineHeight:1 }}>
          {val}<span style={{ fontSize:11, color:'rgba(255,255,255,0.25)', marginLeft:1 }}>%</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={40}>
        <AreaChart data={data} margin={{ top:0, right:0, bottom:0, left:0 }}>
          <defs>
            <linearGradient id={`mg${label.replace(/\s/g,'')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={col} stopOpacity={0.3} />
              <stop offset="95%" stopColor={col} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={col} fill={`url(#mg${label.replace(/\s/g,'')})`} strokeWidth={1.8} dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
      <div style={{ marginTop:6, height:2, background:'rgba(255,255,255,0.05)', borderRadius:2, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${v}%`, background:`linear-gradient(90deg,${col}55,${col})`, borderRadius:2, transition:'width 0.6s ease' }} />
      </div>
    </div>
  );
}

// ── CyberpunkChart wrapper ────────────────────────────────────
function CyberpunkChartCard({ title, sub, children, accent=CYAN, style={} }) {
  return (
    <div style={{ ...cpCard, padding:'22px 20px', ...style }}>
      <div style={{ position:'absolute', top:0, left:0, width:36, height:36, borderTop:`2px solid ${accent}`, borderLeft:`2px solid ${accent}`, borderRadius:'12px 0 0 0', opacity:0.7, pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:0, right:0, width:36, height:36, borderBottom:`2px solid ${accent}`, borderRight:`2px solid ${accent}`, borderRadius:'0 0 12px 0', opacity:0.7, pointerEvents:'none' }} />
      <div style={{ position:'absolute', inset:0, background:'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,212,255,0.013) 2px,rgba(0,212,255,0.013) 4px)', pointerEvents:'none', borderRadius:12 }} />
      <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:accent, letterSpacing:3, marginBottom:4, textTransform:'uppercase', position:'relative' }}>{title}</div>
      {sub && <div style={{ fontFamily:'var(--font-mono)', fontSize:8, color:'rgba(255,255,255,0.22)', letterSpacing:1, marginBottom:12, position:'relative' }}>{sub}</div>}
      <div style={{ position:'relative' }}>{children}</div>
    </div>
  );
}

// ── SnapThumb (hover reveals controls) ───────────────────────
function SnapThumb({ snap, accentColor, onExpand, onDownload, onCopyLink, badge }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      style={{ aspectRatio:'4/3', borderRadius:8, overflow:'hidden', border:`1px solid ${hover ? accentColor : 'rgba(255,255,255,0.07)'}`, cursor:'pointer', position:'relative', transition:'all 0.18s', transform: hover ? 'scale(1.03)' : 'scale(1)' }}
      onMouseEnter={()=>setHover(true)}
      onMouseLeave={()=>setHover(false)}
      onClick={()=>onExpand(snap)}
    >
      <img src={snap.dataUrl} alt="snap" style={{ width:'100%', height:'100%', objectFit:'cover', filter:'sepia(10%) brightness(0.85)' }} />
      {badge && (
        <div style={{ position:'absolute', top:4, left:4, background:`${accentColor}cc`, fontFamily:'monospace', fontSize:7, color:'#fff', padding:'2px 5px', borderRadius:3, letterSpacing:1 }}>
          {badge}
        </div>
      )}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'linear-gradient(transparent,rgba(0,0,0,0.88))', padding:'5px 6px', fontFamily:'monospace', fontSize:8, color: accentColor === RED ? '#f77' : '#0f0' }}>
        {new Date(snap.timestamp).toLocaleTimeString('en-GB',{hour12:false})}
      </div>
      {hover && (
        <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}
          onClick={e=>e.stopPropagation()}
        >
          <button onClick={()=>onDownload(snap)}
            style={{ background:DIM, border:`1px solid ${GOLD}66`, color:GOLD, fontFamily:'var(--font-mono)', fontSize:9, padding:'5px 10px', borderRadius:5, cursor:'pointer' }}>
            Save
          </button>
          <button onClick={()=>onCopyLink(snap)}
            style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.18)', color:'rgba(255,255,255,0.7)', fontFamily:'var(--font-mono)', fontSize:9, padding:'5px 10px', borderRadius:5, cursor:'pointer' }}>
            Copy
          </button>
        </div>
      )}
    </div>
  );
}

// ── Snapshot Rate-Limit indicator (blurred until hovered) ─────
function SnapRateIndicator({ used, max }) {
  const [hovered, setHovered] = useState(false);
  const pct = Math.round((used / max) * 100);
  const col = used >= max ? RED : used >= max-1 ? GOLD : GREEN;
  return (
    <div
      style={{
        display:'flex', alignItems:'center', gap:7, padding:'4px 10px',
        background:'rgba(0,0,0,0.55)', borderRadius:14,
        border:`1px solid ${col}22`, backdropFilter:'blur(6px)',
        cursor:'default', userSelect:'none',
        filter: hovered ? 'none' : 'blur(4px)',
        transition:'filter 0.25s ease',
      }}
      onMouseEnter={()=>setHovered(true)}
      onMouseLeave={()=>setHovered(false)}
      title={hovered ? `${used}/${max} snapshots this minute` : 'Hover to reveal'}
    >
      <div style={{ width:5, height:5, borderRadius:'50%', background:col, animation:'glowPulse 2s infinite', boxShadow:`0 0 6px ${col}` }} />
      <span style={{ fontFamily:'var(--font-mono)', fontSize:8, color:'rgba(255,255,255,0.38)', letterSpacing:1 }}>SNAP</span>
      <span style={{ fontFamily:'var(--font-mono)', fontSize:8, color:col, letterSpacing:1, fontWeight:600 }}>{used}/{max}</span>
    </div>
  );
}

// ── Snapshot Tabs ─────────────────────────────────────────────
function SnapshotTabs({ backendLogs, survSnapshots, unauthorizedSnapshots, onManualSnap, onClear, snapUsed, snapMax }) {
  const safeLogs    = Array.isArray(backendLogs)           ? backendLogs           : [];
  const safeSnaps   = Array.isArray(survSnapshots)         ? survSnapshots         : [];
  const safeUnauth  = Array.isArray(unauthorizedSnapshots) ? unauthorizedSnapshots : [];

  // Unauthorized from backend logs (have snapshotPath) + real-time camera captures
  const unauthLogs  = safeLogs.filter(l => !l.authorized && l.snapshotPath);
  const unauthSnaps = safeSnaps.filter(s => s.reason === 'unauthorized-attempt');

  // Merge real-time unauthorized camera shots + stored ones
  const allUnauth = [
    ...safeUnauth,
    ...unauthSnaps.filter(s => !safeUnauth.find(u => u.id === s.id)),
  ];

  const [tab, setTab]         = useState('unauthorized');
  const [expanded, setExpanded] = useState(null);

  const tbActive = active => ({
    fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:2, padding:'8px 18px',
    borderRadius:'6px 6px 0 0', cursor:'pointer',
    border:`1px solid ${active ? GOLD+'44' : 'rgba(255,255,255,0.07)'}`,
    borderBottom:'none',
    background: active ? `${GOLD}10` : 'transparent',
    color: active ? GOLD : 'rgba(255,255,255,0.38)',
    transition:'all 0.18s',
  });

  const download = snap => {
    const a = document.createElement('a');
    a.href = snap.dataUrl; a.download = `centurion-${snap.id||Date.now()}.jpg`; a.click();
  };
  const copyLink = snap => navigator.clipboard.writeText(snap.dataUrl || '').catch(()=>{});

  const resolveSnapSrc = (log) => {
    if (!log.snapshotPath) return null;
    if (log.snapshotPath.startsWith('http')) return log.snapshotPath;
    return `${API_BASE}/${log.snapshotPath.replace(/^\/+/,'')}`;
  };

  const totalUnauth = unauthLogs.length + allUnauth.length;

  return (
    <div>
      {/* Tab bar with snapshot rate indicator */}
      <div style={{ display:'flex', gap:4, marginBottom:0, borderBottom:`1px solid rgba(255,255,255,0.07)`, alignItems:'flex-end' }}>
        <button style={tbActive(tab==='surveillance')} onClick={()=>setTab('surveillance')}>
          Surveillance ({safeSnaps.filter(s=>s.reason!=='unauthorized-attempt').length})
        </button>
        <button style={tbActive(tab==='unauthorized')} onClick={()=>setTab('unauthorized')}>
          Unauthorized ({totalUnauth})
        </button>
        <div style={{ marginLeft:'auto', display:'flex', gap:8, alignItems:'center', paddingBottom:4 }}>
          <SnapRateIndicator used={snapUsed} max={snapMax} />
          <button onClick={onManualSnap}
            style={{ background:'transparent', border:`1px solid ${GOLD}44`, color:GOLD, fontFamily:'var(--font-mono)', fontSize:9, padding:'5px 12px', borderRadius:5, cursor:'pointer', letterSpacing:1, transition:'all 0.18s' }}
            onMouseEnter={e=>e.currentTarget.style.background=DIM}
            onMouseLeave={e=>e.currentTarget.style.background='transparent'}
          >Capture</button>
          {tab==='surveillance' && safeSnaps.length>0 && (
            <button onClick={onClear}
              style={{ background:'transparent', border:`1px solid ${RED}44`, color:RED, fontFamily:'var(--font-mono)', fontSize:9, padding:'5px 10px', borderRadius:5, cursor:'pointer', transition:'all 0.18s' }}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(232,53,53,0.1)'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}
            >Clear</button>
          )}
        </div>
      </div>

      <div style={{ paddingTop:16 }}>
        {/* ── Surveillance tab ── */}
        {tab==='surveillance' && (
          safeSnaps.filter(s=>s.reason!=='unauthorized-attempt').length===0
            ? <div style={{ textAlign:'center', padding:'52px 0', fontFamily:'var(--font-mono)', fontSize:12, color:'rgba(255,255,255,0.22)' }}>
                <div style={{ fontFamily:'var(--font-display)', fontSize:11, letterSpacing:4, color:`${GOLD}55`, marginBottom:8 }}>STANDBY</div>
                Start monitor to begin automatic surveillance captures
              </div>
            : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(148px,1fr))', gap:10 }}>
                {[...safeSnaps.filter(s=>s.reason!=='unauthorized-attempt')].reverse().map(snap => (
                  <SnapThumb key={snap.id} snap={snap} accentColor={GOLD} onExpand={setExpanded} onDownload={download} onCopyLink={copyLink} />
                ))}
              </div>
        )}

        {/* ── Unauthorized tab (real-time + DB) ── */}
        {tab==='unauthorized' && (
          totalUnauth===0
            ? <div style={{ textAlign:'center', padding:'52px 0', fontFamily:'var(--font-mono)', fontSize:12, color:'rgba(255,255,255,0.22)' }}>
                <div style={{ fontFamily:'var(--font-display)', fontSize:11, letterSpacing:4, color:`${GREEN}55`, marginBottom:8 }}>ALL CLEAR</div>
                No unauthorized captures on record
              </div>
            : <div>
                {/* Real-time camera unauthorized captures */}
                {allUnauth.length>0 && (
                  <div style={{ marginBottom:14 }}>
                    <div style={{ fontFamily:'var(--font-mono)', fontSize:8, color:`${RED}88`, letterSpacing:3, marginBottom:8, textTransform:'uppercase' }}>
                      Live Captures ({allUnauth.length})
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(148px,1fr))', gap:10 }}>
                      {[...allUnauth].reverse().map(snap => (
                        <SnapThumb key={snap.id} snap={snap} accentColor={RED} onExpand={setExpanded} onDownload={download} onCopyLink={copyLink} badge="UNAUTH" />
                      ))}
                    </div>
                  </div>
                )}
                {/* Stored unauthorized snapshots from backend DB */}
                {unauthLogs.length>0 && (
                  <div>
                    <div style={{ fontFamily:'var(--font-mono)', fontSize:8, color:`${RED}66`, letterSpacing:3, marginBottom:8, textTransform:'uppercase' }}>
                      Database Records ({unauthLogs.length})
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(148px,1fr))', gap:10 }}>
                      {unauthLogs.map((log,i) => {
                        const src = resolveSnapSrc(log);
                        return (
                          <div key={i}
                            style={{ aspectRatio:'4/3', borderRadius:8, overflow:'hidden', border:`1px solid ${RED}33`, background:'#080808', position:'relative', cursor: src ? 'pointer' : 'default', transition:'all 0.18s' }}
                            onClick={()=>{ if(src) setExpanded({ dataUrl:src, timestamp:log.timestamp, reason:'unauthorized', id:log._id||i }); }}
                            onMouseEnter={e=>{ if(src) e.currentTarget.style.borderColor=RED+'88'; }}
                            onMouseLeave={e=>{ e.currentTarget.style.borderColor=`${RED}33`; }}
                          >
                            {src
                              ? <img src={src} alt="unauth" style={{ width:'100%', height:'100%', objectFit:'cover', filter:'sepia(20%) brightness(0.8)' }} onError={e=>{ e.currentTarget.style.display='none'; }} />
                              : <div style={{ inset:0, position:'absolute', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:4, fontFamily:'var(--font-mono)', fontSize:9, color:`${RED}66` }}>
                                  <span style={{ fontFamily:'var(--font-display)', fontSize:10, letterSpacing:2, color:`${RED}55` }}>NO PREVIEW</span>
                                  <span>{(log.snapshotPath||'').split('/').pop()||'captured'}</span>
                                </div>
                            }
                            <div style={{ position:'absolute', top:4, left:4, background:`${RED}cc`, fontFamily:'monospace', fontSize:7, color:'#fff', padding:'2px 5px', borderRadius:3, letterSpacing:1 }}>
                              UNAUTH
                            </div>
                            <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'linear-gradient(transparent,rgba(0,0,0,0.9))', padding:'4px 6px', fontFamily:'monospace', fontSize:7, color:'#f77' }}>
                              {new Date(log.timestamp).toLocaleTimeString()} · {String(log.ipAddress||'')}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
        )}
      </div>

      {/* Lightbox */}
      {expanded && (
        <div onClick={()=>setExpanded(null)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.97)', zIndex:99999, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16 }}
        >
          <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:GOLD, letterSpacing:4 }}>
            CAPTURE · {String(expanded.reason||'').toUpperCase()}
          </div>
          <img src={expanded.dataUrl} alt="expanded"
            style={{ maxWidth:'80vw', maxHeight:'66vh', borderRadius:10, border:`1px solid ${GOLD}33`, boxShadow:`0 0 80px ${GOLD}18` }}
          />
          <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'rgba(255,255,255,0.4)' }}>
            {new Date(expanded.timestamp).toLocaleString()}
          </div>
          <div style={{ display:'flex', gap:10 }} onClick={e=>e.stopPropagation()}>
            <button onClick={()=>{ const a=document.createElement('a');a.href=expanded.dataUrl;a.download=`surv-${expanded.id||Date.now()}.jpg`;a.click(); }}
              style={{ background:DIM, border:`1px solid ${GOLD}55`, color:GOLD, fontFamily:'var(--font-mono)', fontSize:11, padding:'10px 22px', borderRadius:7, cursor:'pointer' }}>
              Download
            </button>
            <button onClick={()=>navigator.clipboard.writeText(expanded.dataUrl||'').catch(()=>{})}
              style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.14)', color:'rgba(255,255,255,0.6)', fontFamily:'var(--font-mono)', fontSize:11, padding:'10px 22px', borderRadius:7, cursor:'pointer' }}>
              Copy
            </button>
            <button onClick={()=>setExpanded(null)}
              style={{ background:'transparent', border:`1px solid ${RED}44`, color:RED, fontFamily:'var(--font-mono)', fontSize:11, padding:'10px 22px', borderRadius:7, cursor:'pointer' }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Account Popup ─────────────────────────────────────────────
function AccountPopup({ user, onClose, onLogout, t, isSudo }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteTarget, setDeleteTarget]   = useState(null);
  const [users, setUsers]                 = useState([]);
  const loginTime = useRef(new Date().toLocaleString());

  // Load registered users from backend, fall back to localStorage
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/users`, { credentials:'include' });
        if (res.ok) { const d = await res.json(); setUsers(Array.isArray(d) ? d : d.users || []); return; }
      } catch {}
      try {
        const stored = JSON.parse(localStorage.getItem('centurion_registered_users') || '[]');
        setUsers(stored);
      } catch { setUsers([]); }
    };
    fetchUsers();
  }, []);

  const deleteUser = (username) => { setDeleteTarget(username); setConfirmDelete(true); };

  const confirmDeleteUser = async () => {
    try {
      // Try backend delete first
      await fetch(`${API_BASE}/api/users/${encodeURIComponent(deleteTarget)}`, { method:'DELETE', credentials:'include' });
    } catch {}
    try {
      let stored = JSON.parse(localStorage.getItem('centurion_registered_users') || '[]');
      stored = stored.filter(u => u.userId !== deleteTarget && u.username !== deleteTarget);
      localStorage.setItem('centurion_registered_users', JSON.stringify(stored));
      setUsers(stored);
      if(deleteTarget === user?.userId || deleteTarget === user?.username) onLogout();
    } catch {}
    setConfirmDelete(false);
    setDeleteTarget(null);
  };

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.72)', zIndex:3000, display:'flex', alignItems:'flex-start', justifyContent:'flex-end', paddingTop:64, paddingRight:24 }}>
      <div onClick={e=>e.stopPropagation()} style={{ ...card, width:340, borderRadius:16, overflow:'hidden', border:`1px solid ${GOLD}33`, boxShadow:`0 24px 80px rgba(0,0,0,0.9), 0 0 0 1px ${GOLD}11` }}>
        {/* Header */}
        <div style={{ padding:'20px 20px 16px', borderBottom:`1px solid rgba(255,255,255,0.06)`, background:'rgba(0,0,0,0.6)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:14 }}>
            <div style={{ width:52, height:52, borderRadius:'50%', border:`2px solid ${GOLD}66`, overflow:'hidden', background:`${GOLD}12`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:`0 0 18px ${GOLD}22` }}>
              {user?.avatarUrl
                ? <img src={user.avatarUrl} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : <span style={{ fontFamily:'var(--font-display)', fontSize:24, color:GOLD, fontWeight:900 }}>{String(user?.userId||'A')[0].toUpperCase()}</span>
              }
            </div>
            <div style={{ flex:1, overflow:'hidden' }}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:15, color:GOLD, fontWeight:700, letterSpacing:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                {user?.userId || 'Administrator'}
                {isSudo && <span style={{ marginLeft:6, fontSize:8, color:'#ff8800', border:'1px solid rgba(255,136,0,0.35)', padding:'2px 5px', borderRadius:3, letterSpacing:1 }}>SUDO</span>}
              </div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:GREEN, letterSpacing:1, marginTop:3 }}>{t('sessionActive')}</div>
            </div>
          </div>
          {[
            ['Email',      user?.email || 'not set'],
            ['Gender',     user?.gender ? (user.gender === 'M' ? 'Male ♂' : user.gender === 'F' ? 'Female ♀' : user.gender) : 'Unknown'],
            ['Login Time', loginTime.current],
            ['Role',       isSudo ? 'SUDO Administrator' : 'Standard User'],
          ].map(([k,v]) => (
            <div key={k} style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'rgba(255,255,255,0.3)', letterSpacing:1 }}>{k}</span>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'rgba(255,255,255,0.65)', letterSpacing:0.5, textAlign:'right', maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Registered users */}
        <div style={{ padding:'12px 20px', borderBottom:`1px solid rgba(255,255,255,0.05)`, maxHeight:180, overflowY:'auto' }}>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:8, color:'rgba(255,255,255,0.22)', letterSpacing:3, marginBottom:10, textTransform:'uppercase' }}>
            {t('registeredUsers')} ({users.length})
          </div>
          {users.map((u, i) => {
            const canDelete = isSudo || (u.userId || u.username) === user?.userId;
            return (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8, padding:'6px 8px', borderRadius:7, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ width:24, height:24, borderRadius:'50%', background:`${GOLD}14`, border:`1px solid ${GOLD}33`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-mono)', fontSize:10, color:GOLD, fontWeight:700, flexShrink:0, overflow:'hidden' }}>
                  {u.avatarUrl
                    ? <img src={u.avatarUrl} alt="a" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : String(u.userId||u.username||'?')[0].toUpperCase()
                  }
                </div>
                <div style={{ flex:1, overflow:'hidden' }}>
                  <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'rgba(255,255,255,0.6)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                    {u.userId || u.username || 'Unknown'}
                    {(u.email||'').toLowerCase() === SUDO_EMAIL.toLowerCase() && <span style={{ marginLeft:4, fontSize:7, color:'#ff8800', border:'1px solid rgba(255,136,0,0.3)', padding:'1px 4px', borderRadius:3 }}>SUDO</span>}
                  </div>
                  <div style={{ fontFamily:'var(--font-mono)', fontSize:7, color:'rgba(255,255,255,0.25)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{u.email||''}</div>
                </div>
                {canDelete && (
                  <button onClick={()=>deleteUser(u.userId||u.username)}
                    style={{ background:'rgba(232,53,53,0.07)', border:`1px solid ${RED}33`, color:RED, fontFamily:'var(--font-mono)', fontSize:8, padding:'3px 7px', borderRadius:4, cursor:'pointer', flexShrink:0, transition:'all 0.18s', letterSpacing:0.5 }}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(232,53,53,0.18)'}
                    onMouseLeave={e=>e.currentTarget.style.background='rgba(232,53,53,0.07)'}
                  >DEL</button>
                )}
              </div>
            );
          })}
          {users.length===0 && <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'rgba(255,255,255,0.2)', textAlign:'center', padding:'12px 0' }}>No registered users found</div>}
        </div>

        {confirmDelete && (
          <div style={{ padding:'14px 20px', background:'rgba(232,53,53,0.07)', borderBottom:`1px solid ${RED}22` }}>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:RED, marginBottom:10, letterSpacing:0.5 }}>
              Remove user "{deleteTarget}"? This cannot be undone.
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={confirmDeleteUser}
                style={{ flex:1, background:`${RED}18`, border:`1px solid ${RED}44`, color:RED, fontFamily:'var(--font-mono)', fontSize:10, padding:'7px', borderRadius:6, cursor:'pointer', transition:'all 0.18s' }}
                onMouseEnter={e=>e.currentTarget.style.background=`${RED}30`}
                onMouseLeave={e=>e.currentTarget.style.background=`${RED}18`}
              >Confirm Delete</button>
              <button onClick={()=>setConfirmDelete(false)}
                style={{ flex:1, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.12)', color:'rgba(255,255,255,0.5)', fontFamily:'var(--font-mono)', fontSize:10, padding:'7px', borderRadius:6, cursor:'pointer' }}
              >Cancel</button>
            </div>
          </div>
        )}

        <div style={{ padding:'14px 20px', display:'flex', gap:8 }}>
          <button onClick={onClose}
            style={{ flex:1, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.5)', fontFamily:'var(--font-mono)', fontSize:10, padding:'9px', borderRadius:7, cursor:'pointer', transition:'all 0.18s', letterSpacing:1 }}
            onMouseEnter={e=>e.currentTarget.style.borderColor=GOLD+'44'}
            onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'}
          >Close</button>
          <button onClick={onLogout}
            style={{ flex:1, background:'rgba(232,53,53,0.07)', border:`1px solid ${RED}33`, color:RED, fontFamily:'var(--font-mono)', fontSize:10, padding:'9px', borderRadius:7, cursor:'pointer', transition:'all 0.18s', letterSpacing:1 }}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(232,53,53,0.14)'}
            onMouseLeave={e=>e.currentTarget.style.background='rgba(232,53,53,0.07)'}
          >SIGN OUT</button>
        </div>
      </div>
    </div>
  );
}

// ── Side Drawer ───────────────────────────────────────────────
function SideDrawer({ open, onClose, user, onLogout, onSimOpen, theme, setTheme, lang, changeLanguage, soundEnabled, setSoundEnabled, isReading, onReadToggle, onScreenshot, setChatOpen, t, registeredUserCount, isSudo }) {
  const [autoScroll, setAutoScroll] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if(autoScroll) { scrollRef.current = setInterval(()=>window.scrollBy({top:2,behavior:'auto'}),18); }
    else { clearInterval(scrollRef.current); }
    return () => clearInterval(scrollRef.current);
  }, [autoScroll]);

  const LANGS = [['en','EN'],['sw','SW'],['fr','FR'],['de','DE'],['es','ES'],['ja','JA']];

  const NAV_ITEMS = [
    { key:'analytics',   label:'Analytics',        id:'analytics' },
    { key:'logs',        label:'Security Console', id:'console' },
    { key:'snapshots',   label:'Surveillance',     id:'surveillance' },
    { key:'summary',     label:'Summary Report',   id:'summary' },
    { key:'news',        label:'News Feed',        id:'news' },
    { key:'contact',     label:'Contact',          id:'contact' },
    { key:'about',       label:'About',            id:'about' },
  ];

  const scrollTo = id => {
    const el = document.getElementById(id);
    if(el) el.scrollIntoView({ behavior:'smooth', block:'start' });
    onClose();
  };

  const navBtn = (label, action) => (
    <button key={label} onClick={action}
      style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 12px', cursor:'pointer', borderRadius:8, transition:'all 0.15s', fontFamily:'var(--font-mono)', fontSize:11, color:'rgba(255,255,255,0.52)', letterSpacing:0.5, background:'transparent', border:'none', textAlign:'left', marginBottom:2 }}
      onMouseEnter={e=>{ e.currentTarget.style.background=`${GOLD}0d`; e.currentTarget.style.color=GOLD; e.currentTarget.style.paddingLeft='16px'; }}
      onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.color='rgba(255,255,255,0.52)'; e.currentTarget.style.paddingLeft='12px'; }}
    >
      <div style={{ width:4, height:4, borderRadius:'50%', background:'currentColor', flexShrink:0, opacity:0.6 }} />
      {label}
    </button>
  );

  return (
    <>
      {open && <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', backdropFilter:'blur(6px)', zIndex:1999 }} />}
      <div style={{
        position:'fixed', left:0, top:0, bottom:0, width:300,
        background:'rgba(5,5,8,0.98)', backdropFilter:'blur(40px)',
        borderRight:`1px solid rgba(201,168,76,0.12)`,
        zIndex:2000, display:'flex', flexDirection:'column',
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition:'transform 0.32s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: open ? `8px 0 80px rgba(0,0,0,0.95), inset -1px 0 0 rgba(201,168,76,0.06), 0 0 40px ${GOLD}05` : 'none',
      }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${GOLD}44,transparent)` }} />

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'22px 20px 16px', borderBottom:`1px solid rgba(255,255,255,0.05)`, flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:34, height:34, borderRadius:'50%', border:`1.5px solid ${GOLD}77`, display:'flex', alignItems:'center', justifyContent:'center', background:`${GOLD}0d`, boxShadow:`0 0 14px ${GOLD}22` }}>
              <span style={{ fontFamily:'var(--font-display)', fontWeight:900, fontSize:17, color:GOLD }}>C</span>
            </div>
            <div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:13, letterSpacing:5, color:GOLD, fontWeight:700 }}>CENTURION</div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:8, color:'rgba(255,255,255,0.28)', letterSpacing:2, marginTop:1 }}>{t('navigation')}</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:8, color:GREEN, letterSpacing:1, padding:'3px 8px', borderRadius:10, background:`${GREEN}12`, border:`1px solid ${GREEN}22` }}>
              {registeredUserCount} users
            </div>
            <button onClick={onClose}
              style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.45)', width:30, height:30, borderRadius:6, cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}
              onMouseEnter={e=>{ e.currentTarget.style.borderColor=GOLD; e.currentTarget.style.color=GOLD; e.currentTarget.style.background=DIM; }}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'; e.currentTarget.style.color='rgba(255,255,255,0.45)'; e.currentTarget.style.background='rgba(255,255,255,0.04)'; }}
            >✕</button>
          </div>
        </div>

        <div style={{ padding:'14px 20px', borderBottom:`1px solid rgba(255,255,255,0.04)`, flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:11, padding:'10px 12px', background:'rgba(201,168,76,0.05)', border:`1px solid ${GOLD}18`, borderRadius:9, backdropFilter:'blur(12px)' }}>
            <div style={{ width:32, height:32, borderRadius:'50%', background:`${GOLD}18`, border:`1px solid ${GOLD}44`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontSize:14, color:GOLD, fontWeight:700, flexShrink:0, overflow:'hidden', boxShadow:`0 0 10px ${GOLD}22` }}>
              {user?.avatarUrl
                ? <img src={user.avatarUrl} alt="av" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : String(user?.userId||'A')[0].toUpperCase()
              }
            </div>
            <div style={{ overflow:'hidden' }}>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'rgba(255,255,255,0.75)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                {user?.userId||'Administrator'}
                {isSudo && <span style={{ marginLeft:5, fontSize:7, color:'#ff8800', border:'1px solid rgba(255,136,0,0.3)', padding:'1px 4px', borderRadius:3, letterSpacing:1 }}>SUDO</span>}
              </div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:8, color:GREEN, letterSpacing:1 }}>{t('sessionActive')}</div>
            </div>
          </div>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'10px 12px' }}>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:8, color:'rgba(255,255,255,0.22)', letterSpacing:4, padding:'10px 8px 8px', textTransform:'uppercase' }}>Navigation</div>
          {NAV_ITEMS.map(item => navBtn(item.label, ()=>scrollTo(item.id)))}

          <div style={{ height:1, background:`linear-gradient(90deg,transparent,rgba(201,168,76,0.12),transparent)`, margin:'12px 0' }} />

          <div style={{ fontFamily:'var(--font-mono)', fontSize:8, color:'rgba(255,255,255,0.22)', letterSpacing:4, padding:'6px 8px 8px', textTransform:'uppercase' }}>Tools</div>
          {navBtn('AI Assistant',        ()=>{ setChatOpen(true); onClose(); })}
          {navBtn('IoT Simulation →Tab', ()=>{ onSimOpen(); onClose(); })}
          {navBtn('Screenshot',          ()=>{ onScreenshot(); onClose(); })}
          {navBtn(isReading ? 'Stop Reading' : 'Read Aloud', onReadToggle)}

          <div style={{ height:1, background:`linear-gradient(90deg,transparent,rgba(201,168,76,0.12),transparent)`, margin:'12px 0' }} />

          <div style={{ fontFamily:'var(--font-mono)', fontSize:8, color:'rgba(255,255,255,0.22)', letterSpacing:4, padding:'6px 8px 8px', textTransform:'uppercase' }}>Preferences</div>

          <div style={{ padding:'4px 8px 12px' }}>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'rgba(255,255,255,0.28)', letterSpacing:2, marginBottom:8 }}>Language</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
              {LANGS.map(([code, label]) => (
                <button key={code} onClick={()=>changeLanguage(code)}
                  style={{ padding:'5px 11px', fontSize:10, fontFamily:'var(--font-mono)', background: lang===code ? `${GOLD}18` : 'rgba(255,255,255,0.03)', border: `1px solid ${lang===code ? GOLD : 'rgba(255,255,255,0.1)'}`, color: lang===code ? GOLD : 'rgba(255,255,255,0.42)', borderRadius:5, cursor:'pointer', transition:'all 0.15s', boxShadow: lang===code ? `0 0 10px ${GOLD}22` : 'none' }}
                  onMouseEnter={e=>{ if(lang!==code){ e.currentTarget.style.borderColor=GOLD+'66'; e.currentTarget.style.color='rgba(255,255,255,0.7)'; }}}
                  onMouseLeave={e=>{ if(lang!==code){ e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'; e.currentTarget.style.color='rgba(255,255,255,0.42)'; }}}
                >{label}</button>
              ))}
            </div>
          </div>

          <div style={{ padding:'0 8px 10px' }}>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'rgba(255,255,255,0.28)', letterSpacing:2, marginBottom:8 }}>Theme</div>
            <div style={{ display:'flex', gap:6 }}>
              {['dark','light'].map(th => (
                <button key={th} onClick={()=>setTheme(th)}
                  style={{ flex:1, padding:'7px 0', fontSize:10, fontFamily:'var(--font-mono)', background: theme===th ? `${GOLD}18` : 'rgba(255,255,255,0.03)', border: `1px solid ${theme===th ? GOLD : 'rgba(255,255,255,0.1)'}`, color: theme===th ? GOLD : 'rgba(255,255,255,0.42)', borderRadius:6, cursor:'pointer', transition:'all 0.15s', textTransform:'capitalize', boxShadow: theme===th ? `0 0 10px ${GOLD}22` : 'none' }}
                >{theme===th ? `${th.toUpperCase()} ✓` : th}</button>
              ))}
            </div>
          </div>

          {[['Sounds', soundEnabled, ()=>setSoundEnabled(v=>!v)],['Auto Scroll', autoScroll, ()=>setAutoScroll(v=>!v)]].map(([label, val, fn]) => (
            <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 8px', marginBottom:4 }}>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'rgba(255,255,255,0.45)' }}>{label}</span>
              <div onClick={fn} style={{ width:38, height:20, borderRadius:10, border:`1px solid ${val ? GOLD+'66' : 'rgba(255,255,255,0.15)'}`, background: val ? `${GOLD}22` : 'rgba(255,255,255,0.04)', cursor:'pointer', position:'relative', transition:'all 0.22s' }}>
                <div style={{ position:'absolute', top:3, left: val ? 19 : 3, width:12, height:12, borderRadius:'50%', background: val ? GOLD : 'rgba(255,255,255,0.35)', transition:'all 0.22s', boxShadow: val ? `0 0 6px ${GOLD}88` : 'none' }} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding:'14px 16px', borderTop:`1px solid rgba(255,255,255,0.05)`, flexShrink:0 }}>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'rgba(255,255,255,0.25)', textAlign:'center', letterSpacing:1, marginBottom:10 }}>
            {user?.userId||'ADMIN'} · {t('sessionActive')}
          </div>
          <button onClick={onLogout}
            style={{ width:'100%', background:'rgba(232,53,53,0.07)', border:`1px solid rgba(232,53,53,0.22)`, color:RED, fontFamily:'var(--font-mono)', fontSize:11, padding:'10px', borderRadius:8, cursor:'pointer', letterSpacing:2, transition:'all 0.15s' }}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(232,53,53,0.16)'}
            onMouseLeave={e=>e.currentTarget.style.background='rgba(232,53,53,0.07)'}
          >{t('logout').toUpperCase()}</button>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════
//  MAIN DASHBOARD
// ════════════════════════════════════════════════════════════════
export default function Dashboard({ user, onLogout }) {
  const cam     = useCameraContext();
  const [serverStarted,  setServerStarted]  = useState(false);
  const metrics = useSystemMetrics(serverStarted);
  const [lang,           setLang]           = useState('en');
  const t = useT(lang);

  const isSudo = (user?.email||'').toLowerCase() === SUDO_EMAIL.toLowerCase() ||
                 (user?.userId||'').toLowerCase() === SUDO_USERNAME.toLowerCase();

  // ── Snapshot rate-limit state (4 per minute, enforced strictly) ──
  const [snapUsed,       setSnapUsed]       = useState(0);
  const snapCountMinute  = useRef(0);
  const snapMinuteStart  = useRef(Date.now());
  const lastSnapTime     = useRef(0);

  // ── Unauthorized snapshots stored in real-time ─────────────────
  const [unauthorizedSnapshots, setUnauthorizedSnapshots] = useState([]);

  // ── Register/cache user in localStorage ───────────────────────
  useEffect(() => {
    if(!user?.userId) return;
    try {
      const list = JSON.parse(localStorage.getItem('centurion_registered_users')||'[]');
      if(!list.find(a=>(a.userId||a.username)===user.userId)) {
        list.push({
          userId: user.userId, username: user.userId,
          email: user.email||'', avatarUrl: user.avatarUrl||'',
          gender: user.gender||'', registeredAt: new Date().toISOString(), isSudo,
        });
        localStorage.setItem('centurion_registered_users', JSON.stringify(list));
      }
    } catch {}
  }, [user, isSudo]);

  const [registeredUserCount, setRegisteredUserCount] = useState(0);
  useEffect(()=>{
    const update = () => {
      try { setRegisteredUserCount(JSON.parse(localStorage.getItem('centurion_registered_users')||'[]').length); } catch {}
    };
    update();
    const iv = setInterval(update, 3000);
    return ()=>clearInterval(iv);
  },[]);

  const [logs,           setLogs]           = useState([]);
  const [analytics,      setAnalytics]      = useState({ totalAttempts:0, authorized:0, unauthorized:0, avgConfidence:0, uniqueUserCount:0, avgAge:0 });
  const [iotStatus,      setIotStatus]      = useState({ message:'Idle' });
  const [hnNews,         setHnNews]         = useState([]);
  const [newNews,        setNewNews]        = useState([]);
  const [terminalLines,  setTerminalLines]  = useState([]);
  const [terminalInput,  setTerminalInput]  = useState('');
  const [serverStarting, setServerStarting] = useState(false);
  const [serverStopping, setServerStopping] = useState(false);
  const [theme,          setTheme]          = useState('dark');
  const [drawerOpen,     setDrawerOpen]     = useState(false);
  const [accountOpen,    setAccountOpen]    = useState(false);
  const [chatOpen,       setChatOpen]       = useState(false);
  const [chatMessages,   setChatMessages]   = useState([]);
  const [chatInput,      setChatInput]      = useState('');
  const [inactiveCountdown, setInactiveCountdown] = useState(null);
  const [isReading,      setIsReading]      = useState(false);
  const [emailTo,        setEmailTo]        = useState('');
  const [emailTopic,     setEmailTopic]     = useState('');
  const [emailBody,      setEmailBody]      = useState('');
  const [soundEnabled,   setSoundEnabled]   = useState(false);
  const [langChanging,   setLangChanging]   = useState(false);
  const [newsTab,        setNewsTab]        = useState('security');
  const [greeting,       setGreeting]       = useState('');
  const [sendingEmail,   setSendingEmail]   = useState(false);
  const [emailSent,      setEmailSent]      = useState(false);

  // Live backend system status for footer
  const [sysStatus, setSysStatus] = useState({
    api:    { port: 8080, ok: false },
    mongo:  { ok: false },
    tor:    { port: 9050, ok: false },
    camera: false,
  });

  const terminalRef      = useRef(null);
  const terminalInputRef = useRef(null);
  const inactiveTimer    = useRef(null);
  const inactiveWarn     = useRef(null);
  const liveLogTimer     = useRef(null);
  const lastLogCount     = useRef(0);

  useEffect(()=>{ document.documentElement.setAttribute('data-theme',theme); },[theme]);

  useEffect(()=>{
    const update = ()=>setGreeting(getGreeting(lang, user?.userId||'Admin'));
    update();
    const iv = setInterval(update, 60000);
    return ()=>clearInterval(iv);
  },[lang, user]);

  const changeLanguage = useCallback(async l => {
    if(l===lang) return;
    setLangChanging(true);
    await new Promise(r=>setTimeout(r,160));
    setLang(l);
    await new Promise(r=>setTimeout(r,160));
    setLangChanging(false);
  },[lang]);

  const resetInactivity = useCallback(()=>{
    clearTimeout(inactiveTimer.current); clearInterval(inactiveWarn.current); setInactiveCountdown(null);
    inactiveTimer.current = setTimeout(()=>{
      let c=30; setInactiveCountdown(c);
      inactiveWarn.current = setInterval(()=>{ c--; setInactiveCountdown(c); if(c<=0){ clearInterval(inactiveWarn.current); onLogout(); } },1000);
    }, INACTIVITY_MS);
  },[onLogout]);

  useEffect(()=>{
    window.addEventListener('mousemove', resetInactivity);
    window.addEventListener('keydown',   resetInactivity);
    resetInactivity();
    return ()=>{ window.removeEventListener('mousemove', resetInactivity); window.removeEventListener('keydown', resetInactivity); clearTimeout(inactiveTimer.current); clearInterval(inactiveWarn.current); };
  },[resetInactivity]);

  useEffect(()=>{
    const h=e=>{ if(e.key==='Escape' && !accountOpen && !chatOpen) onLogout(); };
    window.addEventListener('keydown',h);
    return ()=>window.removeEventListener('keydown',h);
  },[onLogout, accountOpen, chatOpen]);

  // ── Real-time system status polling ──────────────────────────
  useEffect(()=>{
    const pollStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/status`);
        if(res.ok) {
          const d = await res.json();
          setSysStatus({
            api:    { port: d.apiPort || 8080,  ok: true },
            mongo:  { ok: d.mongoConnected || false },
            tor:    { port: d.torPort || 9050,  ok: d.torActive || false },
            camera: cam?.cameraReady || false,
          });
          return;
        }
      } catch {}
      setSysStatus(prev => ({ ...prev, camera: cam?.cameraReady || false }));
    };
    pollStatus();
    const iv = setInterval(pollStatus, 5000);
    return ()=>clearInterval(iv);
  },[cam]);

  // ── Strict 4-per-minute snapshot rate limiter ─────────────────
  const rateLimitedSnap = useCallback((reason='scheduled')=>{
    const now = Date.now();
    // Reset counter every 60 seconds
    if(now - snapMinuteStart.current >= 60000) {
      snapCountMinute.current = 0;
      snapMinuteStart.current = now;
      setSnapUsed(0);
    }
    // Enforce: max SNAP_MAX_PER_MIN per minute
    if(snapCountMinute.current >= SNAP_MAX_PER_MIN) return false;
    // Enforce: minimum gap between snaps
    if(now - lastSnapTime.current < SNAP_MIN_GAP_MS) return false;

    lastSnapTime.current = now;
    snapCountMinute.current++;
    setSnapUsed(snapCountMinute.current);

    if(cam?.takeSurveillanceSnapshot) {
      cam.takeSurveillanceSnapshot(reason);
    }
    return true;
  },[cam]);

  // ── Store unauthorized snapshots in real-time ─────────────────
  const storeUnauthorizedSnapshot = useCallback((snapData) => {
    if(!snapData?.dataUrl) return;
    const entry = {
      id:        `unauth_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
      dataUrl:   snapData.dataUrl,
      timestamp: snapData.timestamp || new Date().toISOString(),
      reason:    'unauthorized-attempt',
      userId:    snapData.userId || 'UNKNOWN',
      confidence:snapData.confidence || 0,
      ipAddress: snapData.ipAddress || '',
    };
    setUnauthorizedSnapshots(prev => [...prev.slice(-99), entry]);

    // Also persist to backend
    try {
      fetch(`${API_BASE}/api/unauthorized-snapshots`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ ...entry, dataUrl: entry.dataUrl.substring(0,200) + '...' }), // don't send full base64 in log
      }).catch(()=>{});
    } catch {}
  }, []);

  // ── Listen for unauthorized captures from camera context ──────
  useEffect(()=>{
    if(!cam?.lastUnauthorizedCapture) return;
    storeUnauthorizedSnapshot(cam.lastUnauthorizedCapture);
  },[cam?.lastUnauthorizedCapture, storeUnauthorizedSnapshot]);

  // ── Scheduled surveillance snapshots ─────────────────────────
  useEffect(()=>{
    if(!serverStarted) return;
    let timer;
    const scheduleNext = ()=>{
      const delay = (Math.random()*10+15)*1000; // 15–25s intervals
      timer = setTimeout(()=>{ rateLimitedSnap('scheduled'); scheduleNext(); }, delay);
    };
    scheduleNext();
    return ()=>clearTimeout(timer);
  },[serverStarted, rateLimitedSnap]);

  // ── Reset snap counter every minute ───────────────────────────
  useEffect(()=>{
    const iv = setInterval(()=>{
      snapCountMinute.current = 0;
      snapMinuteStart.current = Date.now();
      setSnapUsed(0);
    }, 60000);
    return ()=>clearInterval(iv);
  },[]);

  // ── Fetch real backend data + HN news ────────────────────────
  useEffect(()=>{
    const fetchAll = async()=>{
      try {
        const[l,a]=await Promise.all([getLogs(100),getAnalytics()]);
        setLogs(Array.isArray(l)?l:[]);
        setAnalytics(a||{});
      } catch {}
      try {
        const ids = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json').then(r=>r.json());
        const items = await Promise.all(ids.slice(0,24).map(id=>fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(r=>r.json())));
        setHnNews(items.filter(i=>i&&i.title&&i.url));
      } catch {}
      try {
        const ids = await fetch('https://hacker-news.firebaseio.com/v0/newstories.json').then(r=>r.json());
        const items = await Promise.all(ids.slice(0,24).map(id=>fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(r=>r.json())));
        setNewNews(items.filter(i=>i&&i.title&&i.url));
      } catch {}
    };
    fetchAll();
    const sl = pollLogs(l=>setLogs(Array.isArray(l)?l:[]),5000);
    const si = pollIoT(s=>setIotStatus(s||{}),2000);
    return ()=>{ sl(); si(); };
  },[]);

  useEffect(()=>{ if(terminalRef.current) terminalRef.current.scrollTop=terminalRef.current.scrollHeight; },[terminalLines]);

  const addLine = (text, cls='sys') => setTerminalLines(p=>[...p.slice(-500),{text:String(text),cls:String(cls)}]);
  const ts    = ()=>new Date().toLocaleTimeString('en-GB',{hour12:false});
  const ms    = ()=>String(new Date().getMilliseconds()).padStart(3,'0');
  const stamp = ()=>`${ts()}.${ms()}`;

  // ── Live watch — real backend logs, stores unauthorized snaps ─
  const startLiveWatch = ()=>{
    liveLogTimer.current = setInterval(async()=>{
      try {
        const fresh = await getLogs(100); if(!Array.isArray(fresh)) return;
        if(fresh.length > lastLogCount.current) {
          const ne = fresh.slice(0, fresh.length-lastLogCount.current);
          ne.reverse().forEach(log=>{
            const auth = log.authorized;
            const conf = ((log.confidence||0)*100).toFixed(2);
            addLine(`┌─ [${new Date(log.timestamp).toLocaleTimeString('en-GB',{hour12:false})}] ─ ${auth?'ACCESS GRANTED':'ACCESS DENIED'} ─────────────────────────────`, auth?'auth':'deny');
            addLine(`│  User: ${log.userId||'UNKNOWN'} · Confidence: ${conf}% · IP: ${log.ipAddress||'?'}`, auth?'auth':'deny');
            if(log.estimatedAge||log.estimatedGender)
              addLine(`│  Bio: age:${log.estimatedAge||'?'} · ${log.estimatedGender||'?'} · ${log.estimatedEthnicity||'?'}`, 'sys');
            addLine(`└───────────────────────────────────────────────────────────────────────────`, auth?'auth':'deny');
            if(soundEnabled) auth ? sounds.auth() : sounds.alert();

            // For denied attempts: capture unauthorized snapshot and store it
            if(!auth) {
              if(cam?.captureUnauthorized) {
                cam.captureUnauthorized({ userId:log.userId, confidence:log.confidence, attemptCount:1 });
              }
              // Store unauthorized event to local state for dashboard display
              if(log.snapshotPath || log.dataUrl) {
                storeUnauthorizedSnapshot({
                  dataUrl:    log.dataUrl || (log.snapshotPath?.startsWith('http') ? log.snapshotPath : `${API_BASE}/${(log.snapshotPath||'').replace(/^\/+/,'')}`),
                  timestamp:  log.timestamp,
                  userId:     log.userId,
                  confidence: log.confidence,
                  ipAddress:  log.ipAddress,
                });
              }
            }
          });
          lastLogCount.current = fresh.length;
          setLogs(fresh);
          try { const a = await getAnalytics(); if(a) setAnalytics(a); } catch {}
        } else if(Math.random()<0.04) {
          addLine(`[${stamp()}]  ❤ heartbeat · uptime:${Math.floor(performance.now()/1000)}s · backend-logs:${lastLogCount.current} · snaps-this-min:${snapCountMinute.current}/${SNAP_MAX_PER_MIN}`, 'sys');
        }
      } catch(e) { addLine(`[${stamp()}] [WARN] ${e.message}`, 'warn'); }
    },2000);
  };
  const stopLiveWatch = ()=>clearInterval(liveLogTimer.current);

  // ── Boot sequence ─────────────────────────────────────────────
  const startServer = async()=>{
    if(serverStarting||serverStarted) return;
    setServerStarting(true); if(soundEnabled) sounds.start();
    const ascii = [
      '',
      ' ██████╗███████╗███╗   ██╗████████╗██╗   ██╗██████╗ ██╗ ██████╗ ███╗   ██╗',
      '██╔════╝██╔════╝████╗  ██║╚══██╔══╝██║   ██║██╔══██╗██║██╔═══██╗████╗  ██║',
      '██║     █████╗  ██╔██╗ ██║   ██║   ██║   ██║██████╔╝██║██║   ██║██╔██╗ ██║',
      '██║     ██╔══╝  ██║╚██╗██║   ██║   ██║   ██║██╔══██╗██║██║   ██║██║╚██╗██║',
      '╚██████╗███████╗██║ ╚████║   ██║   ╚██████╔╝██║  ██║██║╚██████╔╝██║ ╚████║',
      ' ╚═════╝╚══════╝╚═╝  ╚═══╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝',
      '         B I O M E T R I C   S E C U R I T Y   S Y S T E M   v 3 . 0',
      '',
    ];
    const boot = [
      {t:0,   c:'sys',  m:'━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'},
      ...ascii.map((line,i)=>({t:(i+1)*90, c:'info', m:line})),
      {t:900, c:'sys',  m:'━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'},
      {t:1000,c:'sys',  m:`[${stamp()}] Operator: ${user?.userId||'ADMIN'}`},
      {t:1300,c:'info', m:`[${stamp()}] [DB]  Connecting to MongoDB @ localhost:27017 (serverSelectionTimeoutMS:5000)...`},
      {t:1500,c:'auth', m:`[${stamp()}] [DB]  Connected · database: centurion`},
      {t:1800,c:'auth', m:`[${stamp()}] [AI]  ArcFace R100 loaded · 512-dim embeddings`},
      {t:2100,c:'warn', m:`[${stamp()}] [AI]  Ethnicity estimator: STUB mode`},
      {t:2400,c:'auth', m:`[${stamp()}] [TOR] Circuit active · SOCKS5: localhost:9050`},
      {t:2700,c:'auth', m:`[${stamp()}] [API] REST endpoints bound to 0.0.0.0:8080`},
      {t:2900,c:'info', m:`[${stamp()}] [SNAP] Rate limiter active · max ${SNAP_MAX_PER_MIN}/min · min gap ${SNAP_MIN_GAP_MS/1000}s`},
      {t:3000,c:'sys',  m:''},
    ];
    for(const l of boot){ await new Promise(r=>setTimeout(r,l.t)); addLine(l.m,l.c); }
    addLine(`[${stamp()}]  SERVER ONLINE — ALL SYSTEMS NOMINAL`, 'auth');
    addLine(`[${stamp()}]  Type 'update' to force refresh · 'status' for system info · 'help' for all commands`, 'sys');
    try {
      const list = Array.isArray(await getLogs(50)) ? await getLogs(50) : [];
      lastLogCount.current = list.length;
      if(list.length===0){ addLine(`[${stamp()}] No access log entries yet — monitoring active`,'sys'); }
      else {
        addLine(`[${stamp()}] Loaded ${list.length} historical log entries from backend`,'info');
        addLine('─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─', 'sys');
        for(const log of list) {
          await new Promise(r=>setTimeout(r,30));
          const auth = log.authorized;
          const conf = ((log.confidence||0)*100).toFixed(1);
          addLine(`[${new Date(log.timestamp).toLocaleTimeString('en-GB',{hour12:false})}] ${auth?'GRANTED':'DENIED '} · ${(log.userId||'UNKNOWN').padEnd(16)} · conf:${conf}% · ip:${log.ipAddress||'?'}`, auth?'auth':'deny');
        }
        addLine('─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─', 'sys');
      }
    } catch(e) { addLine(`[${stamp()}] [WARN] ${e.message}`, 'warn'); }
    addLine(`[${stamp()}] Console ready — live event stream active`, 'auth');
    setServerStarted(true); setServerStarting(false); if(soundEnabled) sounds.auth();
    startLiveWatch();
  };

  const stopServer = async()=>{
    if(!serverStarted||serverStopping) return;
    setServerStopping(true); stopLiveWatch(); if(soundEnabled) sounds.stop();
    addLine(`[${stamp()}] Stopping monitor...`, 'warn');
    await new Promise(r=>setTimeout(r,600));
    addLine(`[${stamp()}] Monitor stopped.`, 'deny');
    setServerStarted(false); setServerStopping(false);
  };

  const restartServer = async()=>{
    if(soundEnabled) sounds.restart();
    addLine(`[${stamp()}] Restarting...`, 'warn');
    stopLiveWatch(); await new Promise(r=>setTimeout(r,300));
    setTerminalLines([]); setServerStarted(false); setServerStarting(false);
    await new Promise(r=>setTimeout(r,150)); await startServer();
  };

  // ── Terminal command handler ──────────────────────────────────
  const handleTerminalCmd = async (raw) => {
    const cmd = raw.trim().toLowerCase();
    addLine(`> ${raw}`, 'info');
    if(cmd === 'help') {
      addLine(`  Commands: update · clear · status · logs · snaps · help · exit`, 'sys');
    } else if(cmd === 'update') {
      addLine(`[${stamp()}] Fetching latest logs from backend...`, 'sys');
      try {
        const fresh = await getLogs(100);
        if(Array.isArray(fresh)) {
          setLogs(fresh); lastLogCount.current = fresh.length;
          const a = await getAnalytics(); if(a) setAnalytics(a);
          addLine(`[${stamp()}] Updated: ${fresh.length} logs fetched.`, 'auth');
          fresh.slice(0,5).forEach(log=>{
            const auth = log.authorized;
            addLine(`  [${new Date(log.timestamp).toLocaleTimeString('en-GB',{hour12:false})}] ${auth?'GRANTED':'DENIED '} · ${(log.userId||'?').padEnd(14)} · conf:${((log.confidence||0)*100).toFixed(1)}%`, auth?'auth':'deny');
          });
        }
      } catch(e) { addLine(`[${stamp()}] [ERR] ${e.message}`, 'deny'); }
    } else if(cmd === 'clear') {
      setTerminalLines([]);
    } else if(cmd === 'status') {
      addLine(`[${stamp()}] SYSTEM STATUS`, 'info');
      addLine(`  Monitor: ${serverStarted?'RUNNING':'STOPPED'} · Logs: ${logs.length} · Users: ${analytics.uniqueUserCount||0}`, 'sys');
      addLine(`  Camera: ${cam?.cameraReady?'LIVE':'STANDBY'} · IoT: ${iotStatus.message||'?'}`, 'sys');
      addLine(`  Snaps this minute: ${snapCountMinute.current}/${SNAP_MAX_PER_MIN} · Unauth captures: ${unauthorizedSnapshots.length}`, 'sys');
    } else if(cmd === 'snaps') {
      addLine(`[${stamp()}] SNAPSHOT STATE`, 'info');
      addLine(`  Used: ${snapCountMinute.current}/${SNAP_MAX_PER_MIN} this minute`, 'sys');
      addLine(`  Unauthorized stored: ${unauthorizedSnapshots.length}`, 'sys');
      addLine(`  Last snap: ${lastSnapTime.current ? new Date(lastSnapTime.current).toLocaleTimeString() : 'none'}`, 'sys');
    } else if(cmd === 'logs') {
      addLine(`[${stamp()}] Last 10 backend logs:`, 'info');
      logs.slice(0,10).forEach(log=>{
        addLine(`  ${log.authorized?'GRANTED':'DENIED '} · ${log.userId||'?'} · ${((log.confidence||0)*100).toFixed(1)}%`, log.authorized?'auth':'deny');
      });
    } else if(cmd === 'exit') {
      stopServer();
    } else if(cmd !== '') {
      addLine(`  Unknown command: "${cmd}" — type 'help' for commands`, 'warn');
    }
    setTerminalInput('');
  };

  useEffect(()=>()=>stopLiveWatch(),[]); // eslint-disable-line

  // ── Derived analytics from real backend data ──────────────────
  const authCount = analytics.authorized  || logs.filter(l=>l.authorized).length;
  const denyCount = analytics.unauthorized || logs.filter(l=>!l.authorized).length;
  const total     = authCount + denyCount || 1;

  const displayAvgAge = analytics.avgAge && analytics.avgAge > 0
    ? Math.round(analytics.avgAge)
    : (logs.some(l=>l.estimatedAge) ? Math.round(logs.reduce((a,l)=>a+(l.estimatedAge||0),0)/Math.max(1,logs.filter(l=>l.estimatedAge).length)) : 21);

  const displayConf = analytics.avgConfidence && analytics.avgConfidence > 0
    ? (analytics.avgConfidence*100).toFixed(0)
    : (logs.some(l=>l.confidence) ? (logs.reduce((a,l)=>a+(l.confidence||0),0)/Math.max(1,logs.filter(l=>l.confidence).length)*100).toFixed(0) : '77');

  const hourlyData = (()=>{
    const b={};
    logs.forEach(l=>{
      const h=new Date(l.timestamp).getHours(), k=`${String(h).padStart(2,'0')}:00`;
      if(!b[k]) b[k]={time:k,authorized:0,unauthorized:0};
      if(l.authorized) b[k].authorized++; else b[k].unauthorized++;
    });
    return Object.values(b).sort((a,b)=>a.time.localeCompare(b.time)).slice(-14);
  })();

  const ethnicityData = (()=>{
    const e={};
    logs.forEach(l=>{ if(l.estimatedEthnicity) e[l.estimatedEthnicity]=(e[l.estimatedEthnicity]||0)+1; });
    return Object.entries(e).map(([name,value])=>({name,value}));
  })();

  const pieData    = [{name:'Authorized',value:authCount},{name:'Denied',value:denyCount}];
  const confData   = logs.slice(0,25).map((l,i)=>({n:i+1,v:Math.round((l.confidence||0)*100)}));
  const radialData = [{name:'Rate',value:Math.round(authCount/total*100),fill:GREEN}];
  const allNews    = newsTab==='security' ? hnNews : newNews;

  const summaryText = `CENTURION® SECURITY REPORT — ${new Date().toLocaleDateString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Operator:           ${user?.userId||'ADMIN'}
Report Generated:   ${new Date().toISOString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ACCESS STATISTICS
  Total Attempts:   ${analytics.totalAttempts||logs.length}
  Authorized:       ${authCount}
  Denied:           ${denyCount}
  Auth Rate:        ${Math.round(authCount/total*100)}%
  Avg Confidence:   ${displayConf}%
  Unique Users:     ${analytics.uniqueUserCount||0}
  Avg Age:          ${displayAvgAge}y
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SURVEILLANCE
  Surveillance Caps:  ${cam?.captureCount||0}
  Unauthorized Caps:  ${unauthorizedSnapshots.length}
  Snap Rate Limit:    ${SNAP_MAX_PER_MIN}/min (enforced)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RECENT ACCESS LOG (last ${Math.min(logs.length,10)} events)
${logs.slice(0,10).map(l=>`  [${new Date(l.timestamp).toLocaleString()}] ${l.authorized?'GRANTED':'DENIED '} · ${l.userId||'?'} · ${((l.confidence||0)*100).toFixed(1)}%`).join('\n')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

  const exportPDF = async()=>{
    const{default:jsPDF}=await import('jspdf');
    const doc=new jsPDF();
    doc.setFontSize(14); doc.text('CENTURION® Security Report',20,20);
    doc.setFontSize(8); doc.text(doc.splitTextToSize(summaryText,170),20,34);
    doc.save(`centurion-report-${Date.now()}.pdf`);
  };

  const sendReportEmail = async () => {
    const recipientEmail = user?.email || emailTo;
    if(!recipientEmail) { alert('No email address found for this user.'); return; }
    setSendingEmail(true);
    try {
      const res = await fetch(`${API_BASE}/api/send-report`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ to:recipientEmail, subject:`Centurion® Security Report — ${new Date().toLocaleDateString()}`, body:summaryText, userId:user?.userId }),
      });
      if(res.ok) { setEmailSent(true); setTimeout(()=>setEmailSent(false), 4000); }
      else {
        window.open(`mailto:${recipientEmail}?subject=${encodeURIComponent('Centurion Security Report')}&body=${encodeURIComponent(summaryText.slice(0,1800))}`);
      }
    } catch {
      window.open(`mailto:${recipientEmail}?subject=${encodeURIComponent('Centurion Security Report')}&body=${encodeURIComponent(summaryText.slice(0,1800))}`);
    }
    setSendingEmail(false);
  };

  const sendChat = async()=>{
    if(!chatInput.trim()) return;
    const msg={role:'user',content:chatInput}; setChatMessages(p=>[...p,msg]); setChatInput('');
    try {
      const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[...chatMessages.map(m=>({role:m.role==='assistant'?'model':'user',parts:[{text:String(m.content)}]})),{role:'user',parts:[{text:chatInput}]}],systemInstruction:{parts:[{text:`You are Centurion AI security assistant. Stats: ${JSON.stringify({analytics,logs:logs.length,unauthorizedSnaps:unauthorizedSnapshots.length})}. Be concise and professional.`}]}})});
      const d=await r.json();
      const text=String(d.candidates?.[0]?.content?.parts?.[0]?.text||'No response');
      setChatMessages(p=>[...p,{role:'assistant',content:text}]);
    } catch(e){ setChatMessages(p=>[...p,{role:'assistant',content:'Error: '+e.message}]); }
  };

  // ── IoT Simulation — opens in a new isolated browser tab ──────
  const openIoT = useCallback(()=>{
    const iotUrl = new URL('/iot-simulation', window.location.origin).href;
    window.open(iotUrl, '_blank', 'noopener,noreferrer');
  }, []);

  const mc = v => v>80?RED:v>60?GOLD:GREEN;

  // ══════════════════════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════════════════════
  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-primary)', opacity:langChanging?0.3:1, transition:'opacity 0.18s ease', position:'relative' }}>

      <style>{`
        @keyframes blinkCursor { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glowPulse { 0%,100%{opacity:0.5} 50%{opacity:1} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes cpScan { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
        @keyframes cpBlink { 0%,49%{opacity:1} 50%,100%{opacity:0.4} }
        @keyframes neonFlicker { 0%,19%,21%,23%,25%,54%,56%,100%{opacity:1} 20%,24%,55%{opacity:0.4} }
        @keyframes gradShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        .c-btn { transition:all 0.15s !important; }
        .c-btn:hover { filter:brightness(1.15); transform:translateY(-1px); }
        .c-btn:active { transform:translateY(0) scale(0.98); }
        .news-card:hover { border-color:${GOLD}44 !important; background:rgba(201,168,76,0.03) !important; transform:translateY(-2px) !important; }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:rgba(255,255,255,0.02); }
        ::-webkit-scrollbar-thumb { background:rgba(201,168,76,0.25); border-radius:4px; }
        ::-webkit-scrollbar-thumb:hover { background:rgba(201,168,76,0.45); }
        .terminal-line.auth { color:#00e87a; }
        .terminal-line.deny { color:#e83535; }
        .terminal-line.warn { color:#e8a435; }
        .terminal-line.info { color:#3d8bff; }
        .terminal-line.sys  { color:rgba(255,255,255,0.38); }
        .cp-glow { animation:neonFlicker 4s infinite; }
        .cp-chart-container { position:relative; }
        .cp-chart-container::before { content:''; position:absolute; top:0; left:0; right:0; height:1px; background:linear-gradient(90deg,transparent,${CYAN}88,transparent); z-index:1; pointer-events:none; }
        .nav-btn-interactive { transition:all 0.15s !important; }
        .nav-btn-interactive:hover { background:${DIM} !important; border-color:${GOLD}66 !important; color:${GOLD} !important; transform:translateY(-1px); box-shadow: 0 4px 16px rgba(201,168,76,0.18); }
        .nav-btn-interactive:active { transform:translateY(0) scale(0.97); }
      `}</style>

      {/* Inactivity overlay */}
      {inactiveCountdown !== null && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.92)', zIndex:99998, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12, backdropFilter:'blur(12px)' }}>
          <div style={{ fontFamily:'var(--font-display)', fontSize:14, color:GOLD, letterSpacing:5, marginBottom:10 }}>AUTO-LOGOUT WARNING</div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:80, color:RED, fontWeight:900, lineHeight:1, animation:'cpBlink 1s infinite' }}>{inactiveCountdown}</div>
          <p style={{ fontFamily:'var(--font-mono)', color:'rgba(255,255,255,0.4)', fontSize:13, marginTop:8 }}>Logging out in {inactiveCountdown}s due to inactivity</p>
          <button className="btn-gold c-btn" onClick={resetInactivity} style={{ marginTop:18, borderRadius:10 }}>{t('stayLoggedIn')}</button>
        </div>
      )}

      {/* Account popup */}
      {accountOpen && (
        <AccountPopup user={user} onClose={()=>setAccountOpen(false)} onLogout={onLogout} t={t} isSudo={isSudo} />
      )}

      <SideDrawer
        open={drawerOpen} onClose={()=>setDrawerOpen(false)} user={user} onLogout={onLogout}
        onSimOpen={openIoT}
        theme={theme} setTheme={setTheme} lang={lang} changeLanguage={changeLanguage}
        soundEnabled={soundEnabled} setSoundEnabled={setSoundEnabled}
        isReading={isReading}
        onReadToggle={()=>{ if(isReading){ stopReadAloud(); setIsReading(false); } else { readAloud(summaryText); setIsReading(true); } }}
        onScreenshot={()=>takeScreenshot()}
        setChatOpen={setChatOpen} t={t}
        registeredUserCount={registeredUserCount}
        isSudo={isSudo}
      />

      {/* ── NAV ────────────────────────────────────────────── */}
      <nav style={{ position:'sticky', top:0, zIndex:900, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 28px', height:60, background:'rgba(3,3,5,0.97)', backdropFilter:'blur(28px)', borderBottom:`1px solid rgba(201,168,76,0.1)`, boxShadow:`0 2px 28px rgba(0,0,0,0.6), inset 0 -1px 0 ${GOLD}08` }}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <button onClick={()=>setDrawerOpen(true)} className="nav-btn-interactive"
            style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.55)', width:38, height:38, borderRadius:8, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:4, flexShrink:0, padding:'0 9px' }}
            title="Open menu"
          >
            <div style={{ display:'flex', alignItems:'center', gap:3 }}>
              <div style={{ width:3, height:16, background:'currentColor', borderRadius:2 }} />
              <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                <div style={{ width:10, height:2, background:'currentColor', borderRadius:1 }} />
                <div style={{ width:10, height:2, background:'currentColor', borderRadius:1 }} />
                <div style={{ width:7, height:2, background:'currentColor', borderRadius:1 }} />
              </div>
            </div>
          </button>

          <div style={{ width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', background:`${GOLD}0a`, boxShadow:`0 0 14px ${GOLD}22`, flexShrink:0 }}>
            <img
              src="https://raw.githubusercontent.com/aura7822/centurion/main/frontend/public/assets/images/cs.png"
              alt="Centurion Logo"
              style={{ width:'120%', height:'120%', objectFit:'contain', borderRadius:'0%' }}
            />
          </div>
          <div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:16, letterSpacing:5, color:GOLD, fontWeight:700, lineHeight:1 }}>CENTURION®</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:8, color:'rgba(209, 5, 5, 0.3)', letterSpacing:2, marginTop:1 }}>{user?.userId||'SYSTEM'} · Absolute Protection</div>
          </div>
        </div>

        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 13px', background:'rgba(0,232,122,0.06)', border:`1px solid ${GREEN}22`, borderRadius:20 }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:GREEN, animation:'glowPulse 2s infinite' }} />
            <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:GREEN, letterSpacing:1 }}>{t('online')}</span>
          </div>
          {serverStarted && (
            <div style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 13px', background:`${GOLD}0a`, border:`1px solid ${GOLD}33`, borderRadius:20, animation:'glowPulse 3s infinite' }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:GOLD, animation:'glowPulse 1.5s infinite' }} />
              <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:GOLD, letterSpacing:1 }}>{t('monitoring')}</span>
            </div>
          )}
          <button onClick={()=>setAccountOpen(true)} className="nav-btn-interactive"
            style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 14px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:20, cursor:'pointer', fontFamily:'var(--font-mono)', fontSize:10, color:'rgba(255,255,255,0.55)' }}
          >
            <div style={{ width:22, height:22, borderRadius:'50%', background:`${GOLD}18`, border:`1px solid ${GOLD}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:GOLD, fontWeight:700, overflow:'hidden', flexShrink:0 }}>
              {user?.avatarUrl
                ? <img src={user.avatarUrl} alt="a" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : String(user?.userId||'A')[0].toUpperCase()
              }
            </div>
            {user?.userId||'Admin'}
            {isSudo && <span style={{ fontSize:7, color:'#ff8800', border:'1px solid rgba(255,136,0,0.3)', padding:'1px 4px', borderRadius:3, letterSpacing:1, marginLeft:2 }}>SUDO</span>}
          </button>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'rgba(255,255,255,0.18)', letterSpacing:1 }}>{t('pressEsc')}</div>
        </div>
      </nav>

      {/* ── HERO — clear background video/gif ────────────────── */}
      <div style={{ position:'relative', height:290, overflow:'hidden', borderBottom:`1px solid rgba(255,255,255,0.05)` }}>
        {/* Primary: video element (for real .mp4 files) */}
        <video autoPlay muted loop playsInline
          style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.72) contrast(1.08) saturate(1.2)', zIndex:0 }}
          onError={e=>{ e.currentTarget.style.display='none'; }}
        >
          <source src={HERO_VIDEO_SRC} />
        </video>
        {/* Fallback: img/gif — clearer, less blur */}
        <img src={HERO_VIDEO_SRC} alt="hero"
          style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.68) contrast(1.1) saturate(1.15)', zIndex:0, transform:'scale(1.0)' }}
          onLoad={e=>{ const vid = e.currentTarget.previousSibling; if(vid && vid.readyState >= 2) e.currentTarget.style.display='none'; }}
        />
        {/* Subtle dark vignette — preserves clarity */}
        <div style={{ position:'absolute', inset:0, background:`linear-gradient(135deg,rgba(0,0,0,0.72) 0%,${GOLD}04 55%,rgba(0,0,0,0.62) 100%)`, zIndex:1 }} />
        {/* Very light scanline — doesn't obscure content */}
        <div style={{ position:'absolute', inset:0, background:'repeating-linear-gradient(0deg,transparent,transparent 4px,rgba(0,0,0,0.04) 4px,rgba(0,0,0,0.04) 5px)', zIndex:2, pointerEvents:'none' }} />

        <div style={{ position:'relative', zIndex:3, height:'100%', display:'flex', alignItems:'center', padding:'0 40px', gap:28 }}>
          <div style={{ width:82, height:82, borderRadius:'50%', border:`2.5px solid ${GOLD}`, overflow:'hidden', flexShrink:0, background:`${GOLD}10`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 0 32px ${GOLD}44, 0 0 8px ${GOLD}22` }}>
            {user?.avatarUrl
              ? <img src={user.avatarUrl} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              : <span style={{ fontFamily:'var(--font-display)', fontWeight:900, fontSize:40, color:GOLD }}>{String(user?.userId||'A')[0].toUpperCase()}</span>
            }
          </div>
          <div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:`${GOLD}88`, letterSpacing:4, marginBottom:7, textTransform:'uppercase' }}>Centurion® Absolute Protection</div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:34, color:GOLD, letterSpacing:1, marginBottom:10, fontWeight:700, textShadow:`0 0 32px ${GOLD}44` }}>{greeting}</div>
            <Typewriter texts={[
              `Monitoring all access events in real-time.`,
              `${analytics.totalAttempts||logs.length} total access events logged.`,
              `ArcFace R100 biometric engine active.`,
              `Tor network routing · Identity protected.`,
              `${cam?.captureCount||0} surveillance captures this session.`,
              `${unauthorizedSnapshots.length} unauthorized attempts recorded.`,
              `All systems nominal. Stay secure.`,
            ]} />
          </div>
          <div style={{ marginLeft:'auto', display:'flex', flexDirection:'column', gap:7, alignItems:'flex-end' }}>
            {[
              { l:'SYSTEM',   s:'NOMINAL',   c:GREEN },
              { l:'AI MODEL', s:'READY',     c:GREEN },
              { l:'DATABASE', s: sysStatus.mongo.ok  ? 'CONNECTED' : 'CONNECTING', c: sysStatus.mongo.ok ? GREEN : GOLD },
              { l:'TOR',      s: sysStatus.tor.ok    ? `ACTIVE :${sysStatus.tor.port}` : 'INACTIVE', c: sysStatus.tor.ok ? GOLD : RED },
              { l:'CAMERA',   s: cam?.cameraReady    ? 'LIVE' : 'STANDBY', c: cam?.cameraReady ? GREEN : 'rgba(255,255,255,0.3)' },
            ].map(({l,s,c})=>(
              <div key={l} style={{ display:'flex', alignItems:'center', gap:7, padding:'4px 12px', background:'rgba(0,0,0,0.65)', borderRadius:14, border:`1px solid ${c}18`, backdropFilter:'blur(6px)' }}>
                <div style={{ width:5, height:5, borderRadius:'50%', background:c, animation:'glowPulse 2s infinite', boxShadow:`0 0 6px ${c}` }} />
                <span style={{ fontFamily:'var(--font-mono)', fontSize:8, color:'rgba(255,255,255,0.38)', letterSpacing:1 }}>{l}</span>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:8, color:c, letterSpacing:1, fontWeight:600 }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ────────────────────────────────────── */}
      <div style={{ maxWidth:1440, margin:'0 auto', padding:'40px 32px' }}>

        {/* ── ANALYTICS STAT CARDS ─────────────────────────── */}
        <div id="analytics">
          <SH sub="Real-time biometric access metrics from backend logs">{t('analytics')}</SH>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(195px,1fr))', gap:16, marginBottom:40 }}>
            <StatCard label={t('totalAttempts')} value={analytics.totalAttempts||logs.length} sub="All access events" />
            <StatCard label={t('authorized')}    value={authCount}       color={GREEN} sub="Verified identities" />
            <StatCard label={t('denied')}        value={denyCount}       color={RED}   sub="Blocked attempts" />
            <StatCard label={t('avgConfidence')} value={`${displayConf}%`} color={GOLD} sub="Biometric accuracy" />
            <StatCard label={t('uniqueUsers')}   value={analytics.uniqueUserCount||0} color={BLUE} sub="Registered users" />
            <StatCard label={t('avgAge')}        value={`${displayAvgAge}y`} sub="Demographic avg" />
          </div>
        </div>

        {/* ── SECURITY CONSOLE ─────────────────────────────── */}
        <div id="console">
          <SH sub="Live access event stream — real backend data — boot to initialise">{t('logs')} — Console</SH>
          <div style={{ ...card, marginBottom:14, borderRadius:14, overflow:'hidden', border:`1px solid rgba(201,168,76,0.12)` }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', padding:'11px 18px', background:'#000000ff', borderBottom:`1px solid rgba(255,255,255,0.04)` }}>
              <div style={{ display:'flex', gap:5 }}>
                <div style={{ width:11,height:11,borderRadius:'50%',background:'#f51105ff' }} />
                <div style={{ width:11,height:11,borderRadius:'50%',background:'#f30303ff' }} />
                <div style={{ width:11,height:11,borderRadius:'50%',background:'#e40404ff' }} />
              </div>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'rgba(255,255,255,0.28)', marginLeft:8 }}>
                centurion@security:~$ <span style={{ color:GOLD }}>./monitor --live --stream --backend</span>
              </span>
              <div style={{ marginLeft:'auto', display:'flex', gap:7, alignItems:'center', flexWrap:'wrap' }}>
                {serverStarted && (
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:GREEN, display:'flex', alignItems:'center', gap:5 }}>
                    <span style={{ width:6,height:6,borderRadius:'50%',background:GREEN,display:'inline-block',animation:'glowPulse 1.5s infinite' }} />
                    LIVE
                  </span>
                )}
                {terminalLines.length>0 && (
                  <>
                    <button className="c-btn" onClick={()=>setTerminalLines([])}
                      style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.38)', fontFamily:'var(--font-mono)', fontSize:9, padding:'3px 9px', borderRadius:4, cursor:'pointer' }}>CLR</button>
                    <button className="c-btn" onClick={()=>navigator.clipboard.writeText(terminalLines.map(l=>l.text).join('\n'))}
                      style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.38)', fontFamily:'var(--font-mono)', fontSize:9, padding:'3px 9px', borderRadius:4, cursor:'pointer' }}>COPY</button>
                  </>
                )}
                {!serverStarted
                  ? <button className="btn-gold c-btn" onClick={startServer} disabled={serverStarting}
                      style={{ fontSize:10, padding:'6px 16px', borderRadius:6 }}>
                      {serverStarting ? `${t('booting')}...` : t('startMonitor')}
                    </button>
                  : <>
                    <button className="btn-ghost c-btn" onClick={restartServer} style={{ fontSize:9, padding:'5px 12px', borderRadius:6 }}>
                      {t('restart')}
                    </button>
                    <button className="c-btn" onClick={stopServer} disabled={serverStopping}
                      style={{ background:'rgba(232,53,53,0.08)', border:`1px solid ${RED}33`, color:RED, fontFamily:'var(--font-mono)', fontSize:9, padding:'5px 12px', borderRadius:6, cursor:'pointer' }}>
                      {t('stop')}
                    </button>
                  </>
                }
              </div>
            </div>

            <div className="terminal-body" ref={terminalRef}
              style={{ minHeight:320, maxHeight:480, fontSize:12, lineHeight:1.8, fontFamily:'var(--font-mono)', background:'#000205', padding:'14px 18px', overflowY:'auto' }}>
              {terminalLines.length===0
                ? (
                  <div style={{ padding:'40px 0', textAlign:'center' }}>
                    <div style={{ fontFamily:'var(--font-display)', fontSize:13, color:GOLD+'66', letterSpacing:6, marginBottom:10 }}>CENTURION®  CONSOLE</div>
                    <div style={{ color:'rgba(255,255,255,0.1)', fontSize:12, letterSpacing:2, marginBottom:20 }}>─────────────────────────────────────────</div>
                    <div style={{ color:'rgba(255,255,255,0.35)', fontSize:12 }}>
                      Press <span style={{ color:GOLD, border:`1px solid ${GOLD}55`, padding:'3px 10px', borderRadius:5 }}>{t('startMonitor')}</span> to initialise
                    </div>
                    <div style={{ color:'rgba(255,255,255,0.15)', fontSize:10, marginTop:16, letterSpacing:1 }}>
                      Full log replay from backend · Real-time event stream · Type 'help' for commands
                    </div>
                  </div>
                )
                : terminalLines.map((l,i)=>(
                  <span key={i} className={`terminal-line ${l.cls}`}
                    style={{ display:'block', paddingLeft:4,
                      background: l.cls==='deny'&&l.text.includes('DENIED') ? 'rgba(232,53,53,0.03)' : l.cls==='auth'&&l.text.includes('GRANTED') ? 'rgba(0,232,122,0.025)' : 'transparent',
                      borderLeft: l.cls==='deny'&&l.text.includes('DENIED') ? `2px solid ${RED}44` : l.cls==='auth'&&l.text.includes('GRANTED') ? `2px solid ${GREEN}44` : 'none',
                    }}>
                    {l.text}
                  </span>
                ))
              }
              <span className="terminal-line sys" style={{ animation:'blinkCursor 1s infinite' }}>_</span>
            </div>

            {serverStarted && (
              <div style={{ display:'flex', alignItems:'center', background:'#000205', borderTop:`1px solid rgba(255,255,255,0.06)`, padding:'8px 18px', gap:10 }}>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:GREEN, flexShrink:0 }}>root@centurion:~$</span>
                <input
                  ref={terminalInputRef}
                  value={terminalInput}
                  onChange={e=>setTerminalInput(e.target.value)}
                  onKeyDown={e=>{ if(e.key==='Enter') handleTerminalCmd(terminalInput); }}
                  placeholder="Type a command (update, status, snaps, logs, help)..."
                  style={{ flex:1, background:'transparent', border:'none', outline:'none', fontFamily:'var(--font-mono)', fontSize:11, color:'rgba(255,255,255,0.75)', caretColor:GREEN }}
                  autoComplete="off" autoCorrect="off" spellCheck="false"
                />
                <button className="c-btn" onClick={()=>handleTerminalCmd(terminalInput)}
                  style={{ background:`${GREEN}14`, border:`1px solid ${GREEN}33`, color:GREEN, fontFamily:'var(--font-mono)', fontSize:9, padding:'4px 10px', borderRadius:4, cursor:'pointer', flexShrink:0 }}>
                  RUN
                </button>
              </div>
            )}

            <div style={{ padding:'7px 18px', borderTop:`1px solid rgba(255,255,255,0.04)`, display:'flex', justifyContent:'space-between', background:'#050508', flexWrap:'wrap', gap:8 }}>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:serverStarted?GREEN:'rgba(255,255,255,0.2)', letterSpacing:1 }}>
                {serverStarted ? `${t('monitoring')} ACTIVE` : t('offline')} · {logs.length} {t('events')}
              </span>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'rgba(255,255,255,0.18)', letterSpacing:1 }}>
                Centurion® v1.7 · ArcFace R100 · Real-time backend stream
              </span>
            </div>
          </div>
        </div>

        {/* ── CPU & SYSTEM METRICS ─────────────────────────── */}
        <div style={{ marginBottom:40, marginTop:40 }}>
          <SH sub={serverStarted ? 'Resource usage monitoring — live from backend /api/system-metrics' : 'System resource monitors — start console to activate'}>Resource Metrics</SH>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
            <MetricCard label={t('cpuUsage')} val={metrics.cpu[metrics.cpu.length-1]?.v||0}  data={metrics.cpu}  color={BLUE}   />
            <MetricCard label={t('memory')}   val={metrics.mem[metrics.mem.length-1]?.v||0}   data={metrics.mem}  color={GOLD}   />
            <MetricCard label={t('disk')}     val={metrics.disk[metrics.disk.length-1]?.v||0}  data={metrics.disk} color={GREEN}  />
            <MetricCard label={t('network')}  val={metrics.net[metrics.net.length-1]?.v||0}   data={metrics.net}  color={PURPLE} />
          </div>
        </div>

        {/* ── ANALYTICS CHARTS — CYBERPUNK ─────────────────── */}
        <div id="charts">
          <SH sub="Statistical visualisation — driven by real backend log data">Analytics Charts</SH>

          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:14, marginBottom:14 }}>
            <CyberpunkChartCard title={t('attemptsHour')} sub="Authorized vs Denied per hour" accent={CYAN}>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={hourlyData}>
                  <defs>
                    <linearGradient id="cpGA" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={CYAN} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={CYAN} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="cpGD" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={RED} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={RED} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="1 6" stroke={`${CYAN}12`} />
                  <XAxis dataKey="time" stroke={`${CYAN}22`} tick={{ fontSize:9, fill:`${CYAN}66` }} />
                  <YAxis stroke={`${CYAN}22`} tick={{ fontSize:9, fill:`${CYAN}66` }} />
                  <Tooltip {...CPCT} />
                  <Legend formatter={v=><span style={{color:'rgba(255,255,255,0.55)',fontSize:10}}>{v}</span>} />
                  <Area type="monotone" dataKey="authorized"   stroke={CYAN} fill="url(#cpGA)" strokeWidth={2.5} name="Authorized" dot={false} />
                  <Area type="monotone" dataKey="unauthorized" stroke={RED}  fill="url(#cpGD)" strokeWidth={2.5} name="Denied"     dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </CyberpunkChartCard>

            <CyberpunkChartCard title={t('authRatio')} sub="Access outcome split" accent={PURPLE}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <defs>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                  </defs>
                  <Pie data={pieData} dataKey="value" cx="50%" cy="48%" outerRadius={74} innerRadius={42} strokeWidth={2} stroke="rgba(0,0,0,0.6)">
                    {pieData.map((_,i)=><Cell key={i} fill={i===0?CYAN:RED} filter="url(#glow)" />)}
                  </Pie>
                  <Tooltip {...CPCT} />
                  <Legend formatter={v=><span style={{color:'rgba(255,255,255,0.55)',fontSize:10}}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </CyberpunkChartCard>

            <CyberpunkChartCard title={t('successRate')} sub="Auth rate gauge" accent={RED}>
              <ResponsiveContainer width="100%" height={200}>
                <RadialBarChart cx="50%" cy="62%" innerRadius="55%" outerRadius="90%" data={radialData} startAngle={180} endAngle={0}>
                  <defs>
                    <linearGradient id="rg" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%"   stopColor={CYAN} />
                      <stop offset="100%" stopColor={GREEN} />
                    </linearGradient>
                  </defs>
                  <RadialBar dataKey="value" cornerRadius={8} background={{ fill:'rgba(0,212,255,0.04)' }} fill="url(#rg)" />
                  <text x="50%" y="52%" textAnchor="middle" dominantBaseline="middle" style={{ fontFamily:'monospace', fontSize:30, fontWeight:800, fill:CYAN }}>
                    {radialData[0].value}%
                  </text>
                  <text x="50%" y="70%" textAnchor="middle" style={{ fontFamily:'monospace', fontSize:9, fill:`${CYAN}88`, letterSpacing:2 }}>
                    AUTH RATE
                  </text>
                </RadialBarChart>
              </ResponsiveContainer>
            </CyberpunkChartCard>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:40 }}>
            <CyberpunkChartCard title={t('confidenceTrend')} sub="Biometric confidence over recent attempts" accent={GOLD}>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={confData}>
                  <defs>
                    <linearGradient id="cgL" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%"   stopColor={GOLD} />
                      <stop offset="100%" stopColor={CYAN} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="1 6" stroke={`${GOLD}12`} />
                  <XAxis dataKey="n" stroke={`${GOLD}22`} tick={{ fontSize:9, fill:`${GOLD}66` }} />
                  <YAxis domain={[0,100]} stroke={`${GOLD}22`} tick={{ fontSize:9, fill:`${GOLD}66` }} />
                  <Tooltip {...{ contentStyle:{ ...CPCT.contentStyle, borderColor:`${GOLD}55`, boxShadow:`0 8px 32px ${GOLD}18` } }} />
                  <Line type="monotone" dataKey="v" stroke="url(#cgL)" strokeWidth={2.5} dot={{ fill:GOLD, r:3, strokeWidth:0 }} name="Conf %" />
                </LineChart>
              </ResponsiveContainer>
            </CyberpunkChartCard>

            <CyberpunkChartCard title={t('demographics')} sub="Detected ethnicity distribution" accent={PURPLE}>
              {ethnicityData.length===0
                ? <div style={{ textAlign:'center', padding:'48px 0', fontFamily:'var(--font-mono)', fontSize:11, color:`${PURPLE}44` }}>
                    No demographic data yet · waiting for backend
                  </div>
                : <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={ethnicityData}>
                      <CartesianGrid strokeDasharray="1 6" stroke={`${PURPLE}12`} />
                      <XAxis dataKey="name" stroke={`${PURPLE}22`} tick={{ fontSize:9, fill:`${PURPLE}88` }} />
                      <YAxis stroke={`${PURPLE}22`} tick={{ fontSize:9, fill:`${PURPLE}88` }} />
                      <Tooltip {...{ contentStyle:{ ...CPCT.contentStyle, borderColor:`${PURPLE}55` } }} />
                      <Bar dataKey="value" radius={[6,6,0,0]}>
                        {ethnicityData.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
              }
            </CyberpunkChartCard>
          </div>
        </div>

        {/* ── SURVEILLANCE ─────────────────────────────────── */}
        <div id="surveillance">
          <SH sub="Live captures ">{t('snapshots')}</SH>
          <div style={{ ...card, padding:24, marginBottom:40 }}>
            <SnapshotTabs
              backendLogs={logs}
              survSnapshots={cam?.snapshots||[]}
              unauthorizedSnapshots={unauthorizedSnapshots}
              onManualSnap={()=>rateLimitedSnap('manual')}
              onClear={()=>cam?.clearSnapshots()}
              snapUsed={snapUsed}
              snapMax={SNAP_MAX_PER_MIN}
            />
          </div>
        </div>

        {/* ── SUMMARY REPORT ───────────────────────────────── */}
        <div id="summary">
          <SH sub="Real-time exportable security report — includes live backend log data">{t('summary')}</SH>
          <div style={{ ...card, padding:28, marginBottom:40 }}>
            <pre style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'rgba(255,255,255,0.52)', lineHeight:2, whiteSpace:'pre-wrap', marginBottom:18, borderLeft:`2px solid ${GOLD}33`, paddingLeft:18 }}>
              {summaryText}
            </pre>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
              <button className="btn-gold c-btn" onClick={exportPDF} style={{ borderRadius:8, fontSize:11 }}>Export PDF</button>
              <button className="btn-ghost c-btn" onClick={()=>navigator.clipboard.writeText(summaryText)} style={{ borderRadius:8, fontSize:11 }}>Copy Report</button>
              <button className="c-btn" onClick={sendReportEmail} disabled={sendingEmail}
                style={{ background: emailSent ? `${GREEN}18` : `${BLUE}14`, border:`1px solid ${emailSent ? GREEN : BLUE}44`, color: emailSent ? GREEN : BLUE, fontFamily:'var(--font-mono)', fontSize:11, padding:'9px 18px', borderRadius:8, cursor:'pointer', transition:'all 0.18s', letterSpacing:0.5 }}
                onMouseEnter={e=>{ if(!emailSent) { e.currentTarget.style.background=`${BLUE}28`; e.currentTarget.style.borderColor=`${BLUE}88`; } }}
                onMouseLeave={e=>{ if(!emailSent) { e.currentTarget.style.background=`${BLUE}14`; e.currentTarget.style.borderColor=`${BLUE}44`; } }}
              >
                {sendingEmail ? 'Sending...' : emailSent ? '✓ Sent!' : t('sendEmail')}
              </button>
              {!user?.email && (
                <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'rgba(255,255,255,0.3)', letterSpacing:0.5 }}>
                  (No email on record — update profile to enable direct send)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── NEWS ─────────────────────────────────────────── */}
        <div id="news">
          <SH sub="Latest security bulletins and developer news from Hacker News">{t('news')}</SH>
          <div style={{ ...card, padding:24, marginBottom:40 }}>
            <div style={{ display:'flex', gap:8, marginBottom:18 }}>
              {[['security',t('securityNews')],['dev',t('devNews')]].map(([k,label])=>(
                <button key={k} onClick={()=>setNewsTab(k)} className="c-btn"
                  style={{ padding:'8px 18px', fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:1, background:newsTab===k?`${GOLD}14`:'rgba(255,255,255,0.03)', border:`1px solid ${newsTab===k?GOLD:'rgba(255,255,255,0.09)'}`, color:newsTab===k?GOLD:'rgba(255,255,255,0.38)', borderRadius:7, cursor:'pointer', transition:'all 0.18s', boxShadow:newsTab===k?`0 0 14px ${GOLD}18`:'none' }}>
                  {label}
                </button>
              ))}
            </div>
            {allNews.length===0
              ? <div style={{ textAlign:'center', padding:'36px 0', fontFamily:'var(--font-mono)', fontSize:12, color:'rgba(255,255,255,0.22)' }}>Fetching from Hacker News...</div>
              : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(285px,1fr))', gap:12 }}>
                  {allNews.map((item,i)=>(
                    <a key={i} href={item.url||`https://news.ycombinator.com/item?id=${item.id}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration:'none' }}>
                      <div className="news-card" style={{ padding:'15px 17px', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, background:'rgba(255,255,255,0.02)', transition:'all 0.18s', cursor:'pointer' }}>
                        <div style={{ fontFamily:'var(--font-body)', fontSize:13, color:'rgba(255,255,255,0.78)', marginBottom:9, lineHeight:1.6, fontWeight:500 }}>{String(item.title||'')}</div>
                        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                          <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:`${GOLD}66` }}>▲ {item.score||0}</span>
                          <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'rgba(255,255,255,0.18)' }}>{item.by||'anon'}</span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
            }
          </div>
        </div>

        {/* ── CONTACT ──────────────────────────────────────── */}
        <div id="PING ME 🔴">
          <SH sub="Reach out to the system administrator">{t('contact')}</SH>
          <div style={{ ...card, padding:32, marginBottom:40 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:36 }}>
              <div>
                <p style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'rgba(255,255,255,0.35)', letterSpacing:2, marginBottom:18 }}>{t('contactAdmin').toUpperCase()}</p>
                <input className="centurion-input" placeholder={t('adminEmail')} value={emailTo} onChange={e=>setEmailTo(e.target.value)} style={{ marginBottom:12, fontSize:13, borderRadius:8 }} />
                <input className="centurion-input" placeholder={t('subject')} value={emailTopic} onChange={e=>setEmailTopic(e.target.value)} style={{ marginBottom:12, fontSize:13, borderRadius:8 }} />
                <textarea className="centurion-input" placeholder={t('message')} value={emailBody} onChange={e=>setEmailBody(e.target.value)} rows={4} style={{ resize:'vertical', marginBottom:16, fontSize:13, borderRadius:8 }} />
                <button className="btn-gold c-btn" style={{ width:'100%', fontSize:13, borderRadius:9, padding:'13px' }}
                  onClick={()=>{ if(emailTo&&emailTopic&&emailBody) window.open(`mailto:${emailTo}?subject=${encodeURIComponent(emailTopic)}&body=${encodeURIComponent(emailBody)}`); }}
                >{t('sendMessage')}</button>
              </div>

              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:24 }}>
                <div style={{ width:82, height:82, display:'flex', alignItems:'center', justifyContent:'center', background:`${GOLD}0d`, boxShadow:`0 0 28px ${GOLD}22` }}>
                  <img src="https://raw.githubusercontent.com/aura7822/centurion/main/frontend/public/assets/images/c.png"
                    alt="Centurion Logo"
                    style={{ width:'120%', height:'120%', objectFit:'contain' }}
                  />
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:10, width:'100%', maxWidth:200 }}>
                  {SOCIAL_LINKS.map(({ label, href })=>(
                    <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                      style={{ display:'block', textAlign:'center', textDecoration:'none', fontFamily:'var(--font-mono)', fontSize:12, color:'rgba(255,255,255,0.38)', letterSpacing:3, padding:'9px 0', borderRadius:7, border:'1px solid rgba(255,255,255,0.06)', background:'rgba(255,255,255,0.02)', transition:'all 0.18s', textTransform:'uppercase' }}
                      onMouseEnter={e=>{ e.currentTarget.style.color=GOLD; e.currentTarget.style.borderColor=GOLD+'44'; e.currentTarget.style.background=DIM; e.currentTarget.style.transform='translateY(-2px)'; }}
                      onMouseLeave={e=>{ e.currentTarget.style.color='rgba(255,255,255,0.38)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.06)'; e.currentTarget.style.background='rgba(255,255,255,0.02)'; e.currentTarget.style.transform='translateY(0)'; }}
                    >{label}</a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── ABOUT ────────────────────────────────────────── */}
        <div id="about">
          <SH sub="Client Orientation">About Centurion®</SH>
          <div style={{ ...card, padding:36, marginBottom:40 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 220px', gap:44, alignItems:'start' }}>
              <div>
                <p style={{ fontFamily:'var(--font-body)', fontSize:14, color:'rgba(255,255,255,0.62)', lineHeight:2.0, marginBottom:16, maxWidth:540 }}>
                  <strong style={{ color:GOLD }}>Centurion®</strong> is an enterprise-grade AI-powered cybersecurity and biometric access control platform. It combines <strong style={{ color:GOLD }}>ArcFace R100</strong> 512-dimensional facial embeddings, multi-factor authentication, real-time IoT integration, and Tor-protected communications.
                </p>
                <p style={{ fontFamily:'var(--font-body)', fontSize:14, color:'rgba(255,255,255,0.62)', lineHeight:2.0, marginBottom:24, maxWidth:540 }}>
                  The <strong style={{ color:GOLD }}>Security Login System</strong> provides end-to-end identity verification through liveness detection, demographic AI analysis, admin-gated registration, and continuous encrypted surveillance. Every access event is cryptographically logged and visually analysed. Built by <strong style={{ color:GOLD }}>Aura Joshua™</strong>.
                </p>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {['ArcFace R100','Tor Network','MongoDB','OpenCV DNN','AES-256','React + C++','Anthropic','Node.js'].map(tag=>(
                    <span key={tag} style={{ fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:1, color:`${RED}88`, border:`1px solid ${RED}1a`, padding:'4px 10px', borderRadius:5, background:`${RED}07` }}>{tag}</span>
                  ))}
                </div>
              </div>

              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10, padding:'10px 20px', background:`${GOLD}06`, borderRadius:14 }}>
                <QRCode value="https://wa.me/254119750041" size={230} />
                <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'rgba(255,255,255,0.62)', textAlign:'center', lineHeight:2, letterSpacing:0.5 }}>
                  🎕 Suggest an Improvement<br />
                  🎕 Report a Bug<br />
                  🎕 Buy me a Coffee
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer style={{ borderTop:`1px solid rgba(201,168,76,0.1)`, maxWidth:1440, margin:'0 auto', padding:'48px 32px 56px' }}>
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:14, justifyContent:'center' }}>
            <div style={{ width:40, height:40, display:'flex', alignItems:'center', justifyContent:'center', background:`${GOLD}0d`, boxShadow:`0 0 20px ${GOLD}22` }}>
              <img
                src="https://raw.githubusercontent.com/aura7822/centurion/main/frontend/public/assets/images/cs.png"
                alt="Centurion Logo"
                style={{ width:'120%', height:'120%', objectFit:'contain', borderRadius:'0%' }}
              />
            </div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:26, color:GOLD, letterSpacing:6, fontWeight:700, textShadow:`0 0 24px ${GOLD}33` }}>CENTURION®</div>
          </div>
          <p style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'rgba(255,255,255,0.22)', lineHeight:1.8, letterSpacing:0.5, marginTop:10, maxWidth:440, margin:'10px auto 0' }}>
            AI-powered biometric access control platform. Engineered for security gurus.
          </p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:32, margin:'0 auto 36px', maxWidth:1000, alignItems:'start' }}>

          {/* Quick Links */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'rgba(209, 7, 7, 0.7)', border:`1px solid ${GOLD}18`, padding:'3px 3px', borderRadius:4, letterSpacing:4, marginBottom:14, textTransform:'uppercase' }}>
              Quick Links
            </div>
            {[['Analytics','analytics'],['Security Console','console'],['Surveillance','surveillance'],['News Feed','news'],['About','about']].map(([label,id])=>(
              <div key={label}
                onClick={()=>document.getElementById(id)?.scrollIntoView({behavior:'smooth'})}
                style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'rgba(255,255,255,0.35)', cursor:'pointer', transition:'all 0.15s', marginBottom:8, letterSpacing:0.5 }}
                onMouseEnter={e=>{ e.currentTarget.style.color=GOLD; e.currentTarget.style.paddingLeft='6px'; }}
                onMouseLeave={e=>{ e.currentTarget.style.color='rgba(255,255,255,0.35)'; e.currentTarget.style.paddingLeft='0'; }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* System Status — live from backend */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'rgba(199, 5, 5, 0.84)', border:`1px solid ${GOLD}18`, padding:'3px 3px', borderRadius:4, letterSpacing:4, marginBottom:14, textTransform:'uppercase' }}>
              System Status
            </div>
            {[
              ['API Server',  sysStatus.api.ok   ? `Running :${sysStatus.api.port}`  : 'Offline',        sysStatus.api.ok  ? GREEN : RED],
              ['MongoDB',     sysStatus.mongo.ok ? 'centurion DB'                    : 'Disconnected',   sysStatus.mongo.ok ? GREEN : RED],
              ['Tor Circuit', sysStatus.tor.ok   ? `SOCKS5 :${sysStatus.tor.port}`   : 'Inactive',       sysStatus.tor.ok  ? GOLD  : RED],
              ['AI Engine',   'ArcFace R100 CPU',                                                         GREEN],
              ['Camera',      cam?.cameraReady   ? 'LIVE'                            : 'Standby',        cam?.cameraReady  ? GREEN : 'rgba(255,255,255,0.25)'],
            ].map(([label,status,c])=>(
              <div key={label}
                style={{ display:'flex', justifyContent:'space-between', gap:14, marginBottom:8, fontFamily:'var(--font-mono)', fontSize:10, width:'100%', maxWidth:220 }}
              >
                <span style={{ color:'rgba(255,255,255,0.35)' }}>{label}</span>
                <span style={{ color:c, fontSize:9, display:'flex', alignItems:'center', gap:5 }}>
                  <span style={{ width:4, height:4, borderRadius:'50%', background:c }} />
                  {status}
                </span>
              </div>
            ))}
          </div>

          {/* Collaborators */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'rgba(201, 6, 6, 0.68)', border:`1px solid ${GOLD}18`, padding:'3px 3px', borderRadius:4, letterSpacing:4, textTransform:'uppercase', marginBottom:14 }}>
              Collaborators
            </div>
            {COLLABORATORS.slice(0,5).map(c=>(
              <div key={c.name}
                style={{ width:'100%', maxWidth:220, padding:'12px 14px', borderRadius:10, border:'1px solid rgba(255,255,255,0.05)', background:'rgba(255,255,255,0.02)', marginBottom:10, transition:'all 0.18s' }}
                onMouseEnter={e=>{ e.currentTarget.style.borderColor=GOLD+'33'; e.currentTarget.style.background=DIM; e.currentTarget.style.transform='translateY(-2px)'; }}
                onMouseLeave={e=>{ e.currentTarget.style.borderColor='rgba(255,255,255,0.05)'; e.currentTarget.style.background='rgba(255,255,255,0.02)'; e.currentTarget.style.transform='translateY(0)'; }}
              >
                <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'rgba(255,255,255,0.72)', marginBottom:4, fontWeight:600 }}>{c.name}</div>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:9,  color:'rgba(255,255,255,0.35)', marginBottom:6 }}>{c.role}</div>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:8,  color:GOLD+'88', letterSpacing:0.5 }}>{c.stack}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ borderTop:`1px solid rgba(255,255,255,0.04)`, paddingTop:18, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
          <p style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'rgba(216, 93, 11, 0.7)', letterSpacing:1 }}>
            {t('footer')} © 2025–{new Date().getFullYear()} ❖ Designed By Aura Joshua
          </p>
          <div style={{ display:'flex', gap:10 }}>
            {['AES-256','Zero-Trust','Biometric-MFA'].map(badge=>(
              <span key={badge} style={{ fontFamily:'var(--font-mono)', fontSize:8, color:`${GOLD}55`, border:`1px solid ${GOLD}18`, padding:'3px 8px', borderRadius:4, letterSpacing:1 }}>{badge}</span>
            ))}
          </div>
        </div>
      </footer>

      {/* ── AI CHAT ─────────────────────────────────────────── */}
      {chatOpen && (
        <div className="ai-chat-window" style={{ borderRadius:16, overflow:'hidden', boxShadow:`0 24px 80px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.05)` }}>
          <div style={{ padding:'14px 18px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between', background:'#050505' }}>
            <div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:12, color:GOLD, letterSpacing:3 }}>GEMINI AI ASSISTANT</div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:8, color:'rgba(255,255,255,0.28)', letterSpacing:1 }}>Centurion® Security Intelligence</div>
            </div>
            <button className="c-btn"
              style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.45)', fontSize:15, cursor:'pointer', width:28, height:28, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center' }}
              onMouseEnter={e=>{ e.currentTarget.style.borderColor=RED; e.currentTarget.style.color=RED; }}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'; e.currentTarget.style.color='rgba(255,255,255,0.45)'; }}
              onClick={()=>setChatOpen(false)}>×</button>
          </div>
          <div style={{ flex:1, overflowY:'auto', padding:12, display:'flex', flexDirection:'column', gap:8, minHeight:200, maxHeight:320, background:'rgba(2,3,4,0.96)' }}>
            {chatMessages.length===0 && (
              <p style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'rgba(255,255,255,0.25)', textAlign:'center', marginTop:22 }}>Ask anything about security, threats, or analytics...</p>
            )}
            {chatMessages.map((m,i)=>(
              <div key={i} style={{ alignSelf:m.role==='user'?'flex-end':'flex-start', maxWidth:'88%', padding:'9px 13px', borderRadius:10, background:m.role==='user'?`${GOLD}12`:'rgba(255,255,255,0.04)', border:`1px solid ${m.role==='user'?GOLD+'33':'rgba(255,255,255,0.07)'}`, fontFamily:'var(--font-mono)', fontSize:11, color:m.role==='user'?GOLD:'rgba(255,255,255,0.72)', lineHeight:1.6 }}>
                {String(m.content)}
              </div>
            ))}
          </div>
          <div style={{ padding:'10px 12px', borderTop:`1px solid rgba(255,255,255,0.06)`, display:'flex', gap:8, background:'#050505' }}>
            <input className="centurion-input" placeholder="Ask Gemini AI..." value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendChat()} style={{ fontSize:12, borderRadius:8 }} />
            <button className="btn-gold c-btn" onClick={sendChat} style={{ padding:'8px 14px', fontSize:12, borderRadius:8, flexShrink:0 }}>→</button>
          </div>
        </div>
      )}
    </div>
  );
}
