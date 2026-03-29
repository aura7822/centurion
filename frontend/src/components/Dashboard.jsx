import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { getLogs, getAnalytics, getHackerNews, pollLogs, pollIoT } from '../api/backendAPI';
import { takeScreenshot, readAloud, stopReadAloud } from '../utils/webcam_utils';
import IoTSimulation from './IoTSimulation';
import { useCameraContext } from '../App';

// ── Config ────────────────────────────────────────────────────
const GEMINI_API_KEY ='IzaSyA8ksUis2vWpv0jWmIxcPeKlhWp_sRZUBQ';
const HERO_VIDEO_SRC = 'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExdXYzMHdlc2piYnV5NzJhOHh2c3VwdjJ5Y3hxcWZpa2d5cTEwM29jaSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/pOEbLRT4SwD35IELiQ/giphy.gif';
const SUDO_EMAIL     = 'joshuaura7822@gmail.com';
const SUDO_USERNAME  = 'aura';
const INACTIVITY_MS  = 4 * 60 * 1000;

// ── Palette ───────────────────────────────────────────────────
const GOLD   = '#c9a84c';
const GOLD2  = '#e8c76a';
const GREEN  = '#00e87a';
const RED    = '#e83535';
const BLUE   = '#3d8bff';
const DIM    = 'rgba(201,168,76,0.18)';
const PIE_COLORS = [GREEN, RED, GOLD, BLUE, '#cc44ff'];

// ── Social links (text only, no icons/emojis) ─────────────────
const SOCIAL_LINKS = [
  { label: 'GitHub',    href: 'https://github.com/aura7822' },
  { label: 'Instagram', href: 'https://instagram.com/_t.y.p.i.c.a.l.l.y_aura_73' },
  { label: 'LinkedIn',  href: 'https://www.linkedin.com/in/aura-joshua-615660344/' },
  { label: 'WhatsApp',  href: 'https://wa.me/254119750041' },
];

// ── Module-level card style (accessible to all sub-components) ─
const card = {
  background: 'rgba(12, 12, 12, 0.86)',
  border: '1px solid rgba(201,168,76,0.14)',
  borderRadius: 14,
  backdropFilter: 'blur(18px)',
  boxShadow: '0 4px 32px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)',
};

// ── Translations ──────────────────────────────────────────────
const STRINGS = {
  en: {
    analytics:'Analytics', logs:'Security Feed', snapshots:'Surveillance',
    summary:'Summary Report', news:'News Feed', contact:'Contact', about:'About Centurion',
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
    pressEsc:'ESC to logout', inactivity:'Auto-logout in',
    stayLoggedIn:'Stay Logged In', scanHere:'Scan to connect',
    suggestImprove:'Suggest an improvement', reportBug:'Report a bug', buyCoffee:'Buy me a coffee',
    openWhatsapp:'Open WhatsApp', footer:'Centurion. All Rights Reserved.',
  },
  sw: {
    analytics:'Takwimu', logs:'Mlango wa Usalama', snapshots:'Ufuatiliaji',
    summary:'Muhtasari', news:'Habari', contact:'Wasiliana', about:'Kuhusu',
    logout:'Toka', language:'Lugha', monitoring:'INAFUATILIA', online:'MTANDAONI',
    offline:'NJE YA MTANDAO', settings:'Mipangilio', navigation:'URAMBAZAJI',
    sessionActive:'KIPINDI KINAFANYA KAZI', events:'matukio', accessibility:'Upatikanaji',
    totalAttempts:'Jumla', authorized:'Kuruhusiwa', denied:'Kukataliwa',
    footer:'Centurion. Haki Zote Zimehifadhiwa.',
  },
  fr: {
    analytics:'Analytique', logs:'Journal', logout:'Déconnexion', language:'Langue',
    authorized:'Autorisé', denied:'Refusé', totalAttempts:'Total',
    monitoring:'SURVEILLANCE', online:'EN LIGNE', offline:'HORS LIGNE',
    settings:'Paramètres', navigation:'NAVIGATION', footer:'Centurion. Tous droits réservés.',
  },
  de: {
    analytics:'Analytik', logs:'Sicherheitsprotokoll', logout:'Abmelden', language:'Sprache',
    authorized:'Autorisiert', denied:'Verweigert', totalAttempts:'Gesamt',
    monitoring:'ÜBERWACHUNG', online:'ONLINE', offline:'OFFLINE',
    settings:'Einstellungen', navigation:'NAVIGATION', footer:'Centurion. Alle Rechte vorbehalten.',
  },
  es: {
    analytics:'Analíticas', logs:'Registro', logout:'Cerrar sesión', language:'Idioma',
    authorized:'Autorizado', denied:'Denegado', totalAttempts:'Total',
    monitoring:'SUPERVISIÓN', online:'EN LÍNEA', offline:'FUERA DE LÍNEA',
    settings:'Configuración', navigation:'NAVEGACIÓN', footer:'Centurion. Todos los derechos reservados.',
  },
  ja: {
    analytics:'分析', logs:'セキュリティログ', logout:'ログアウト', language:'言語',
    authorized:'許可済み', denied:'拒否', totalAttempts:'総試行回数',
    monitoring:'監視中', online:'オンライン', offline:'オフライン',
    settings:'設定', navigation:'ナビゲーション', footer:'Centurion. 全著作権所有.',
  },
};
function useT(lang) {
  return useCallback((key) => (STRINGS[lang]?.[key]) || STRINGS.en[key] || key, [lang]);
}

// ── Greeting (evening not goodnight at night) ─────────────────
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

// ── Audio ─────────────────────────────────────────────────────
function playTone(freq=440,dur=0.15,type='sine',vol=0.28){
  try{const c=new(window.AudioContext||window.webkitAudioContext)();const o=c.createOscillator();const g=c.createGain();o.connect(g);g.connect(c.destination);o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(vol,c.currentTime);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+dur);o.start(c.currentTime);o.stop(c.currentTime+dur);}catch{}
}
const sounds = {
  start:   () => { playTone(440,.1); setTimeout(()=>playTone(550,.1),120); setTimeout(()=>playTone(660,.2),240); },
  stop:    () => { playTone(660,.1); setTimeout(()=>playTone(330,.25,'sawtooth'),240); },
  restart: () => { playTone(330,.08); setTimeout(()=>playTone(440,.08),100); setTimeout(()=>playTone(660,.15),300); },
  alert:   () => { playTone(880,.08,'square'); setTimeout(()=>playTone(880,.08,'square'),180); },
  auth:    () => { playTone(523,.08); setTimeout(()=>playTone(659,.12),100); },
};

// ── System metrics hook ───────────────────────────────────────
function useSystemMetrics(boosted) {
  const [m, setM] = useState({ cpu:[], mem:[], disk:[], net:[] });
  const tick = useRef(0);
  useEffect(() => {
    const seed = (base,v,len=20) =>
      Array.from({length:len}, (_,i) => ({ t:i, v:Math.max(5,Math.min(98,base+(Math.random()-0.5)*v*2)) }));
    setM({ cpu:seed(20,8), mem:seed(35,8), disk:seed(18,5), net:seed(30,12) });
    const iv = setInterval(() => {
      tick.current++;
      setM(prev => {
        const n = (arr, base, v, boost=0) => {
          const last = arr[arr.length-1]?.v || base;
          const target = boosted ? Math.min(98, base + boost + Math.random()*18) : base;
          const nv = boosted
            ? Math.max(5, Math.min(98, last + (target - last) * 0.2 + (Math.random()-.5)*v))
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
    }, 900);
    return () => clearInterval(iv);
  }, [boosted]);
  return m;
}

// ── Typewriter (cursor in red) ────────────────────────────────
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
    <span style={{ fontFamily:'var(--font-mono)', fontSize:15, color:'rgba(255,255,255,0.72)' }}>
      {String(disp)}
      <span style={{ borderRight:`2.5px solid ${RED}`, marginLeft:2, animation:'blinkCursor 1.1s infinite' }}>&nbsp;</span>
    </span>
  );
}

// ── QR code (true Google Charts QR for +254119750041) ─────────
function QRCode({ value, size=148 }) {
  const url = `https://chart.googleapis.com/chart?cht=qr&chs=${size}x${size}&chl=${encodeURIComponent(value)}&chco=C9A84C%7C000000&chf=bg,s,080808&chld=M|2`;
  return (
    <img src='/home/aura/CENTURION/frontend/public/assets/images/QR.png' alt="QR Code"
      style={{ width:size, height:size, borderRadius:10, border:`1px solid ${GOLD}33`, display:'block' }}
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

// ── Chart tooltip preset ──────────────────────────────────────
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

// ── Stat Card (no emojis) ─────────────────────────────────────
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

// ── Metric Sparkline Card (no emojis) ─────────────────────────
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

// ── Snapshot Tabs ─────────────────────────────────────────────
function SnapshotTabs({ backendLogs, survSnapshots, onManualSnap, onClear }) {
  const safeLogs  = Array.isArray(backendLogs)    ? backendLogs    : [];
  const safeSnaps = Array.isArray(survSnapshots)  ? survSnapshots  : [];
  const unauthLogs  = safeLogs.filter(l => !l.authorized && l.snapshotPath);
  const unauthSnaps = safeSnaps.filter(s => s.reason === 'unauthorized-attempt');
  const [tab, setTab]         = useState(unauthLogs.length || unauthSnaps.length ? 'unauthorized' : 'surveillance');
  const [expanded, setExpanded] = useState(null);

  const tbActive = active => ({
    fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:2, padding:'8px 18px',
    borderRadius:'6px 6px 0 0', cursor:'pointer',
    border:`1px solid ${active ? GOLD+'44' : 'rgba(255,255,255,0.07)'}`,
    borderBottom:'none',
    background: active ? `${GOLD}10` : 'transparent',
    color: active ? GOLD : 'rgba(255,255,255,0.38)',
    transition:'all 0.25s',
  });

  const download = snap => {
    const a = document.createElement('a');
    a.href = snap.dataUrl; a.download = `centurion-${snap.id||Date.now()}.jpg`; a.click();
  };

  const copyLink = snap => {
    navigator.clipboard.writeText(snap.dataUrl || '').catch(()=>{});
  };

  return (
    <div>
      <div style={{ display:'flex', gap:4, marginBottom:0, borderBottom:`1px solid rgba(255,255,255,0.07)` }}>
        <button style={tbActive(tab==='surveillance')}  onClick={()=>setTab('surveillance')}>
          Surveillance ({safeSnaps.length})
        </button>
        <button style={tbActive(tab==='unauthorized')} onClick={()=>setTab('unauthorized')}>
          Unauthorized ({unauthLogs.length + unauthSnaps.length})
        </button>
        <div style={{ marginLeft:'auto', display:'flex', gap:8, alignItems:'center', paddingBottom:4 }}>
          <button onClick={onManualSnap}
            style={{ background:'transparent', border:`1px solid ${GOLD}44`, color:GOLD, fontFamily:'var(--font-mono)', fontSize:9, padding:'5px 12px', borderRadius:5, cursor:'pointer', letterSpacing:1, transition:'all 0.2s' }}
            onMouseEnter={e=>e.currentTarget.style.background=DIM}
            onMouseLeave={e=>e.currentTarget.style.background='transparent'}
          >Capture</button>
          {tab==='surveillance' && safeSnaps.length>0 && (
            <button onClick={onClear}
              style={{ background:'transparent', border:`1px solid ${RED}44`, color:RED, fontFamily:'var(--font-mono)', fontSize:9, padding:'5px 10px', borderRadius:5, cursor:'pointer', transition:'all 0.2s' }}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(232,53,53,0.1)'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}
            >Clear</button>
          )}
        </div>
      </div>

      <div style={{ paddingTop:16 }}>
        {tab==='surveillance' && (
          safeSnaps.length===0
            ? <div style={{ textAlign:'center', padding:'52px 0', fontFamily:'var(--font-mono)', fontSize:12, color:'rgba(255,255,255,0.22)' }}>
                <div style={{ fontFamily:'var(--font-display)', fontSize:11, letterSpacing:4, color:GOLD+'55', marginBottom:8 }}>SURVEILLANCE ACTIVE</div>
                No captures yet — system is monitoring
              </div>
            : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(148px,1fr))', gap:10 }}>
                {[...safeSnaps].reverse().map(snap => (
                  <SnapThumb key={snap.id} snap={snap} accentColor={GOLD} onExpand={setExpanded} onDownload={download} onCopyLink={copyLink} />
                ))}
              </div>
        )}

        {tab==='unauthorized' && (
          unauthLogs.length===0 && unauthSnaps.length===0
            ? <div style={{ textAlign:'center', padding:'52px 0', fontFamily:'var(--font-mono)', fontSize:12, color:'rgba(255,255,255,0.22)' }}>
                <div style={{ fontFamily:'var(--font-display)', fontSize:11, letterSpacing:4, color:GREEN+'55', marginBottom:8 }}>ALL CLEAR</div>
                No unauthorized captures on record
              </div>
            : <div>
                {unauthSnaps.length>0 && (
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(148px,1fr))', gap:10, marginBottom:14 }}>
                    {[...unauthSnaps].reverse().map(snap => (
                      <SnapThumb key={snap.id} snap={snap} accentColor={RED} onExpand={setExpanded} onDownload={download} onCopyLink={copyLink} badge="UNAUTH" />
                    ))}
                  </div>
                )}
                {unauthLogs.length>0 && (
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(148px,1fr))', gap:10 }}>
                    {unauthLogs.map((log,i) => (
                      <div key={i} style={{ aspectRatio:'4/3', borderRadius:8, overflow:'hidden', border:`1px solid ${RED}22`, background:'#080808', position:'relative' }}>
                        <div style={{ inset:0, position:'absolute', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:4, fontFamily:'var(--font-mono)', fontSize:9, color:`${RED}66` }}>
                          <span style={{ fontFamily:'var(--font-display)', fontSize:10, letterSpacing:2, color:`${RED}55` }}>NO PREVIEW</span>
                          <span>{(log.snapshotPath||'').split('/').pop()||'captured'}</span>
                        </div>
                        <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'linear-gradient(transparent,rgba(0,0,0,0.9))', padding:'4px 6px', fontFamily:'monospace', fontSize:7, color:RED }}>
                          {new Date(log.timestamp).toLocaleTimeString()} · {String(log.ipAddress||'')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
        )}
      </div>

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
              Copy Link
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

function SnapThumb({ snap, accentColor, onExpand, onDownload, onCopyLink, badge }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      style={{ aspectRatio:'4/3', borderRadius:8, overflow:'hidden', border:`1px solid ${hover ? accentColor : 'rgba(255,255,255,0.07)'}`, cursor:'pointer', position:'relative', transition:'all 0.22s', transform: hover ? 'scale(1.03)' : 'scale(1)' }}
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

// ── Side Drawer (no emojis, sidebar icon, modern sections) ────
function SideDrawer({ open, onClose, user, onLogout, onSimOpen, theme, setTheme, lang, changeLanguage, soundEnabled, setSoundEnabled, isReading, onReadToggle, onScreenshot, setChatOpen, t }) {
  const [accessOpen, setAccessOpen] = useState(false);
  const [autoScroll, setAutoScroll] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if(autoScroll) { scrollRef.current = setInterval(()=>window.scrollBy({top:2,behavior:'auto'}),18); }
    else { clearInterval(scrollRef.current); }
    return () => clearInterval(scrollRef.current);
  }, [autoScroll]);

  const LANGS = [['en','EN'],['sw','SW'],['fr','FR'],['de','DE'],['es','ES'],['ja','JA']];
  const admins = [];
  try { const a = JSON.parse(sessionStorage.getItem('centurion_admins')||'[]'); admins.push(...a); } catch {}

  const NAV_ITEMS = [
    { key:'analytics',  label:'Analytics',        id:'analytics' },
    { key:'logs',       label:'Security Console', id:'console' },
    { key:'snapshots',  label:'Surveillance',     id:'surveillance' },
    { key:'summary',    label:'Summary Report',   id:'summary' },
    { key:'news',       label:'News Feed',        id:'news' },
    { key:'contact',    label:'Contact',          id:'contact' },
    { key:'about',      label:'About',            id:'about' },
  ];

  const scrollTo = id => {
    const el = document.getElementById(id);
    if(el) el.scrollIntoView({ behavior:'smooth', block:'start' });
    onClose();
  };

  return (
    <>
      {open && <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', backdropFilter:'blur(6px)', zIndex:1999 }} />}
      <div style={{
        position:'fixed', left:0, top:0, bottom:0, width:300,
        background:'rgba(6,6,6,0.98)',
        backdropFilter:'blur(32px)',
        borderRight:`1px solid rgba(201,168,76,0.1)`,
        zIndex:2000, display:'flex', flexDirection:'column',
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition:'transform 0.38s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: open ? `6px 0 60px rgba(0,0,0,0.9), inset -1px 0 0 rgba(201,168,76,0.06)` : 'none',
      }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'22px 20px 16px', borderBottom:`1px solid rgba(255,255,255,0.05)`, flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:34, height:34, borderRadius:'50%', border:`1.5px solid ${GOLD}77`, display:'flex', alignItems:'center', justifyContent:'center', background:`${GOLD}0d` }}>
              <span style={{ fontFamily:'var(--font-display)', fontWeight:900, fontSize:17, color:GOLD }}>C</span>
            </div>
            <div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:13, letterSpacing:5, color:GOLD, fontWeight:700 }}>CENTURION</div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:8, color:'rgba(255,255,255,0.28)', letterSpacing:2, marginTop:1 }}>{t('navigation')}</div>
            </div>
          </div>
          <button onClick={onClose}
            style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.45)', width:30, height:30, borderRadius:6, cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s' }}
            onMouseEnter={e=>{ e.currentTarget.style.borderColor=GOLD; e.currentTarget.style.color=GOLD; }}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'; e.currentTarget.style.color='rgba(255,255,255,0.45)'; }}
          >✕</button>
        </div>

        {/* User badge */}
        <div style={{ padding:'14px 20px', borderBottom:`1px solid rgba(255,255,255,0.04)`, flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:11, padding:'10px 12px', background:'rgba(201,168,76,0.05)', border:`1px solid ${GOLD}18`, borderRadius:9 }}>
            <div style={{ width:30, height:30, borderRadius:'50%', background:`${GOLD}18`, border:`1px solid ${GOLD}44`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontSize:14, color:GOLD, fontWeight:700, flexShrink:0 }}>
              {String(user?.userId||'A')[0].toUpperCase()}
            </div>
            <div style={{ overflow:'hidden' }}>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'rgba(255,255,255,0.75)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user?.userId||'Administrator'}</div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:8, color:GREEN, letterSpacing:1 }}>{t('sessionActive')}</div>
            </div>
          </div>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'10px 12px' }}>
          {/* Navigation section */}
          <div style={{ fontFamily:'var(--font-mono)', fontSize:8, color:'rgba(255,255,255,0.22)', letterSpacing:4, padding:'10px 8px 8px', textTransform:'uppercase' }}>Navigation</div>
          {NAV_ITEMS.map(item => (
            <button key={item.key} onClick={()=>scrollTo(item.id)}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 12px', cursor:'pointer', borderRadius:8, transition:'all 0.2s', fontFamily:'var(--font-mono)', fontSize:11, color:'rgba(255,255,255,0.52)', letterSpacing:0.5, background:'transparent', border:'none', textAlign:'left', marginBottom:2 }}
              onMouseEnter={e=>{ e.currentTarget.style.background=`${GOLD}0a`; e.currentTarget.style.color=GOLD; }}
              onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.color='rgba(255,255,255,0.52)'; }}
            >
              <div style={{ width:4, height:4, borderRadius:'50%', background:'currentColor', flexShrink:0, opacity:0.6 }} />
              {item.label}
            </button>
          ))}

          <div style={{ height:1, background:`linear-gradient(90deg,transparent,rgba(201,168,76,0.12),transparent)`, margin:'12px 0' }} />

          {/* Tools section */}
          <div style={{ fontFamily:'var(--font-mono)', fontSize:8, color:'rgba(255,255,255,0.22)', letterSpacing:4, padding:'6px 8px 8px', textTransform:'uppercase' }}>Tools</div>
          {[
            { label:'AI Assistant',    action: ()=>{ setChatOpen(true); onClose(); } },
            { label:'IoT Simulation',  action: onSimOpen },
            { label:'Screenshot',      action: ()=>{ onScreenshot(); onClose(); } },
            { label: isReading ? 'Stop Reading' : 'Read Aloud', action: ()=>{ onReadToggle(); } },
          ].map(item => (
            <button key={item.label} onClick={item.action}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 12px', cursor:'pointer', borderRadius:8, transition:'all 0.2s', fontFamily:'var(--font-mono)', fontSize:11, color:'rgba(255,255,255,0.52)', letterSpacing:0.5, background:'transparent', border:'none', textAlign:'left', marginBottom:2 }}
              onMouseEnter={e=>{ e.currentTarget.style.background=`${GOLD}0a`; e.currentTarget.style.color=GOLD; }}
              onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.color='rgba(255,255,255,0.52)'; }}
            >
              <div style={{ width:4, height:4, borderRadius:'50%', background:'currentColor', flexShrink:0, opacity:0.6 }} />
              {item.label}
            </button>
          ))}

          <div style={{ height:1, background:`linear-gradient(90deg,transparent,rgba(201,168,76,0.12),transparent)`, margin:'12px 0' }} />

          {/* Preferences section */}
          <div style={{ fontFamily:'var(--font-mono)', fontSize:8, color:'rgba(255,255,255,0.22)', letterSpacing:4, padding:'6px 8px 8px', textTransform:'uppercase' }}>Preferences</div>

          {/* Language pills */}
          <div style={{ padding:'4px 8px 12px' }}>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'rgba(255,255,255,0.28)', letterSpacing:2, marginBottom:8 }}>Language</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
              {LANGS.map(([code, label]) => (
                <button key={code} onClick={()=>changeLanguage(code)}
                  style={{
                    padding:'5px 11px', fontSize:10, fontFamily:'var(--font-mono)',
                    background: lang===code ? `${GOLD}18` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${lang===code ? GOLD : 'rgba(255,255,255,0.1)'}`,
                    color: lang===code ? GOLD : 'rgba(255,255,255,0.42)',
                    borderRadius:5, cursor:'pointer', transition:'all 0.2s',
                    boxShadow: lang===code ? `0 0 10px ${GOLD}22` : 'none',
                  }}
                  onMouseEnter={e=>{ if(lang!==code){ e.currentTarget.style.borderColor=GOLD+'66'; e.currentTarget.style.color='rgba(255,255,255,0.7)'; }}}
                  onMouseLeave={e=>{ if(lang!==code){ e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'; e.currentTarget.style.color='rgba(255,255,255,0.42)'; }}}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Theme toggle */}
          <div style={{ padding:'0 8px 10px' }}>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'rgba(255,255,255,0.28)', letterSpacing:2, marginBottom:8 }}>Theme</div>
            <div style={{ display:'flex', gap:6 }}>
              {['dark','light'].map(th => (
                <button key={th} onClick={()=>setTheme(th)}
                  style={{
                    flex:1, padding:'7px 0', fontSize:10, fontFamily:'var(--font-mono)',
                    background: theme===th ? `${GOLD}18` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${theme===th ? GOLD : 'rgba(255,255,255,0.1)'}`,
                    color: theme===th ? GOLD : 'rgba(255,255,255,0.42)',
                    borderRadius:6, cursor:'pointer', transition:'all 0.2s', textTransform:'capitalize',
                    boxShadow: theme===th ? `0 0 10px ${GOLD}22` : 'none',
                  }}
                >{theme===th ? `${th.toUpperCase()} (active)` : th}</button>
              ))}
            </div>
          </div>

          {/* Toggle rows */}
          {[
            ['Sounds', soundEnabled, ()=>setSoundEnabled(v=>!v)],
            ['Auto Scroll', autoScroll, ()=>setAutoScroll(v=>!v)],
          ].map(([label, val, fn]) => (
            <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 8px', marginBottom:4 }}>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'rgba(255,255,255,0.45)' }}>{label}</span>
              <div
                onClick={fn}
                style={{ width:38, height:20, borderRadius:10, border:`1px solid ${val ? GOLD+'66' : 'rgba(255,255,255,0.15)'}`, background: val ? `${GOLD}22` : 'rgba(255,255,255,0.04)', cursor:'pointer', position:'relative', transition:'all 0.25s' }}
              >
                <div style={{ position:'absolute', top:3, left: val ? 19 : 3, width:12, height:12, borderRadius:'50%', background: val ? GOLD : 'rgba(255,255,255,0.35)', transition:'all 0.25s', boxShadow: val ? `0 0 6px ${GOLD}88` : 'none' }} />
              </div>
            </div>
          ))}

          {/* Admins */}
          {admins.length > 0 && (
            <>
              <div style={{ height:1, background:`linear-gradient(90deg,transparent,rgba(201,168,76,0.12),transparent)`, margin:'12px 0' }} />
              <div style={{ fontFamily:'var(--font-mono)', fontSize:8, color:'rgba(255,255,255,0.22)', letterSpacing:4, padding:'6px 8px 8px', textTransform:'uppercase' }}>Administrators</div>
              {admins.slice(0,4).map(a => (
                <div key={a.username} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:8, marginBottom:3, background:'rgba(255,255,255,0.02)' }}>
                  <div style={{ width:26, height:26, borderRadius:'50%', background:`${GOLD}14`, border:`1px solid ${GOLD}33`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-mono)', fontSize:11, color:GOLD, fontWeight:700, flexShrink:0 }}>
                    {String(a.username||'A')[0].toUpperCase()}
                  </div>
                  <div style={{ overflow:'hidden' }}>
                    <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'rgba(255,255,255,0.65)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      {a.username}
                      {a.isSudo && <span style={{ marginLeft:5, fontSize:7, color:'#ff8800', border:'1px solid rgba(255,136,0,0.3)', padding:'1px 4px', borderRadius:3, letterSpacing:1 }}>SUDO</span>}
                    </div>
                    <div style={{ fontFamily:'var(--font-mono)', fontSize:8, color:'rgba(255,255,255,0.28)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{a.email}</div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'14px 16px', borderTop:`1px solid rgba(255,255,255,0.05)`, flexShrink:0 }}>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'rgba(255,255,255,0.25)', textAlign:'center', letterSpacing:1, marginBottom:10 }}>
            {user?.userId||'ADMIN'} · {t('sessionActive')}
          </div>
          <button onClick={onLogout}
            style={{ width:'100%', background:'rgba(232,53,53,0.07)', border:`1px solid rgba(232,53,53,0.22)`, color:RED, fontFamily:'var(--font-mono)', fontSize:11, padding:'10px', borderRadius:8, cursor:'pointer', letterSpacing:2, transition:'all 0.2s' }}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(232,53,53,0.14)'}
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
  const [serverStarted, setServerStarted] = useState(false);
  const metrics = useSystemMetrics(serverStarted);
  const [lang, setLang] = useState('en');
  const t = useT(lang);

  // Register admin
  useEffect(() => {
    if(!user?.userId) return;
    try {
      const list = JSON.parse(sessionStorage.getItem('centurion_admins')||'[]');
      if(!list.find(a=>a.username===user.userId)) {
        list.push({ username:user.userId, email:user.email||'', avatarUrl:user.avatarUrl||'', registeredAt:new Date().toISOString(), isSudo:user.email===SUDO_EMAIL });
        sessionStorage.setItem('centurion_admins', JSON.stringify(list));
      }
    } catch {}
  }, [user]);

  const [logs,        setLogs]        = useState([]);
  const [analytics,   setAnalytics]   = useState({ totalAttempts:0, authorized:0, unauthorized:0, avgConfidence:0, uniqueUserCount:0, avgAge:0 });
  const [iotStatus,   setIotStatus]   = useState({ message:'Idle' });
  const [hnNews,      setHnNews]      = useState([]);
  const [newNews,     setNewNews]     = useState([]);
  const [terminalLines, setTerminalLines] = useState([]);
  const [serverStarting, setServerStarting] = useState(false);
  const [serverStopping, setServerStopping] = useState(false);
  const [theme,       setTheme]       = useState('dark');
  const [drawerOpen,  setDrawerOpen]  = useState(false);
  const [chatOpen,    setChatOpen]    = useState(false);
  const [chatMessages,setChatMessages]= useState([]);
  const [chatInput,   setChatInput]   = useState('');
  const [inactiveCountdown, setInactiveCountdown] = useState(null);
  const [isReading,   setIsReading]   = useState(false);
  const [emailTo,     setEmailTo]     = useState('');
  const [emailTopic,  setEmailTopic]  = useState('');
  const [emailBody,   setEmailBody]   = useState('');
  const [soundEnabled,setSoundEnabled]= useState(false);
  const [langChanging,setLangChanging]= useState(false);
  const [newsTab,     setNewsTab]     = useState('security');
  const [greeting,    setGreeting]    = useState('');

  const terminalRef    = useRef(null);
  const inactiveTimer  = useRef(null);
  const inactiveWarn   = useRef(null);
  const liveLogTimer   = useRef(null);
  const lastLogCount   = useRef(0);
  const lastSnapTime   = useRef(0);
  const snapCountMinute= useRef(0);
  const snapMinuteStart= useRef(Date.now());

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
    await new Promise(r=>setTimeout(r,180));
    setLang(l);
    await new Promise(r=>setTimeout(r,180));
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
    window.addEventListener('keydown', resetInactivity);
    resetInactivity();
    return ()=>{ window.removeEventListener('mousemove', resetInactivity); window.removeEventListener('keydown', resetInactivity); clearTimeout(inactiveTimer.current); clearInterval(inactiveWarn.current); };
  },[resetInactivity]);

  useEffect(()=>{
    const h=e=>{ if(e.key==='Escape') onLogout(); };
    window.addEventListener('keydown',h);
    return ()=>window.removeEventListener('keydown',h);
  },[onLogout]);

  // ── Rate-limited snap (4/min, no flash) ──────────────────────
  const rateLimitedSnap = useCallback((reason='scheduled')=>{
    const now = Date.now();
    if(now - snapMinuteStart.current > 60000){ snapCountMinute.current=0; snapMinuteStart.current=now; }
    if(snapCountMinute.current >= 4) return;
    if(now - lastSnapTime.current < 15000) return;
    lastSnapTime.current = now; snapCountMinute.current++;
    if(cam?.takeSurveillanceSnapshot) cam.takeSurveillanceSnapshot(reason);
  },[cam]);

  useEffect(()=>{
    if(!serverStarted) return;
    const scheduleNext = ()=>{
      const delay = (Math.random()*5+15)*1000;
      return setTimeout(()=>{ rateLimitedSnap('scheduled'); scheduleNext(); }, delay);
    };
    const timer = scheduleNext();
    return ()=>clearTimeout(timer);
  },[serverStarted, rateLimitedSnap]);

  // ── Fetch data ────────────────────────────────────────────────
  useEffect(()=>{
    const fetchAll = async()=>{
      try { const[l,a]=await Promise.all([getLogs(100),getAnalytics()]); setLogs(Array.isArray(l)?l:[]); setAnalytics(a||{}); } catch {}
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

  // ── Live watch ────────────────────────────────────────────────
  const startLiveWatch = ()=>{
    liveLogTimer.current = setInterval(async()=>{
      try {
        const fresh = await getLogs(100); if(!Array.isArray(fresh)) return;
        if(fresh.length > lastLogCount.current) {
          const ne = fresh.slice(0, fresh.length-lastLogCount.current);
          ne.reverse().forEach(log=>{
            const auth = log.authorized;
            const conf = ((log.confidence||0)*100).toFixed(2);
            addLine(`┌─ [${new Date(log.timestamp).toLocaleTimeString('en-GB',{hour12:false})}] ─ ${auth?'ACCESS GRANTED':'ACCESS DENIED'} ─────────────────────`, auth?'auth':'deny');
            addLine(`│  User: ${log.userId||'UNKNOWN'} · Confidence: ${conf}% · IP: ${log.ipAddress||'?'}`, auth?'auth':'deny');
            if(log.estimatedAge||log.estimatedGender)
              addLine(`│  Bio: age:${log.estimatedAge||'?'} · ${log.estimatedGender||'?'} · ${log.estimatedEthnicity||'?'}`, 'sys');
            addLine(`└───────────────────────────────────────────────────────────────────`, auth?'auth':'deny');
            if(soundEnabled) auth ? sounds.auth() : sounds.alert();
            if(!auth && cam?.captureUnauthorized) cam.captureUnauthorized({ userId:log.userId, confidence:log.confidence, attemptCount:1 });
          });
          lastLogCount.current = fresh.length;
        } else if(Math.random()<0.05) {
          addLine(`[${stamp()}]  heartbeat · uptime:${Math.floor(performance.now()/1000)}s · logs:${lastLogCount.current}`, 'sys');
        }
      } catch(e) { addLine(`[${stamp()}] [WARN] ${e.message}`, 'warn'); }
    },2000);
  };
  const stopLiveWatch = ()=>clearInterval(liveLogTimer.current);

  // ── Boot sequence ─────────────────────────────────────────────
  const startServer = async()=>{
    if(serverStarting||serverStarted) return;
    setServerStarting(true); if(soundEnabled) sounds.start();
    const boot = [
      {t:0,   c:'sys',  m:'━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'},
      {t:100, c:'info', m:'  CENTURION® BIOMETRIC SECURITY SYSTEM — BOOT SEQUENCE v3.0'},
      {t:200, c:'sys',  m:'━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'},
      {t:400, c:'sys',  m:`[${stamp()}] Operator: ${user?.userId||'ADMIN'}`},
      {t:700, c:'info', m:`[${stamp()}] [DB]  Connecting to MongoDB @ localhost:27017...`},
      {t:900, c:'auth', m:`[${stamp()}] [DB]  Connected · database: centurion`},
      {t:1200,c:'auth', m:`[${stamp()}] [AI]  ArcFace R100 loaded · 512-dim embeddings`},
      {t:1500,c:'warn', m:`[${stamp()}] [AI]  Ethnicity estimator: STUB mode`},
      {t:1800,c:'auth', m:`[${stamp()}] [TOR] Circuit active · SOCKS5: localhost:9050`},
      {t:2000,c:'auth', m:`[${stamp()}] [API] REST endpoints bound to 0.0.0.0:8080`},
      {t:2300,c:'sys',  m:''},
    ];
    for(const l of boot){ await new Promise(r=>setTimeout(r,l.t)); addLine(l.m,l.c); }
    addLine(`[${stamp()}]  SERVER ONLINE — ALL SYSTEMS NOMINAL`, 'auth');
    // Load real logs from backend
    try {
      const list = Array.isArray(await getLogs(50)) ? await getLogs(50) : [];
      lastLogCount.current = list.length;
      if(list.length===0){ addLine(`[${stamp()}] No access log entries yet — monitoring active`,'sys'); }
      else {
        addLine(`[${stamp()}] Loaded ${list.length} historical log entries`,'info');
        addLine('─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─', 'sys');
        for(const log of list) {
          await new Promise(r=>setTimeout(r,40));
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
    stopLiveWatch(); await new Promise(r=>setTimeout(r,400));
    setTerminalLines([]); setServerStarted(false); setServerStarting(false);
    await new Promise(r=>setTimeout(r,200)); await startServer();
  };

  useEffect(()=>()=>stopLiveWatch(),[]); // eslint-disable-line

  // ── Derived data ──────────────────────────────────────────────
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

  const authCount = analytics.authorized  || logs.filter(l=>l.authorized).length;
  const denyCount = analytics.unauthorized || logs.filter(l=>!l.authorized).length;
  const total     = authCount + denyCount || 1;
  const pieData   = [{name:'Authorized',value:authCount},{name:'Denied',value:denyCount}];
  const confData  = logs.slice(0,25).map((l,i)=>({n:i+1,v:Math.round((l.confidence||0)*100)}));
  const radialData= [{name:'Rate',value:Math.round(authCount/total*100),fill:GREEN}];
  const allNews   = newsTab==='security' ? hnNews : newNews;

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
  Avg Confidence:   ${((analytics.avgConfidence||0)*100).toFixed(1)}%
  Unique Users:     ${analytics.uniqueUserCount||0}
  Avg Age:          ${analytics.avgAge||0}y
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SYSTEM STATUS
  IoT:              ${iotStatus.message}
  Surveillance:     ${cam?.captureCount||0} captures
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

  const sendChat = async()=>{
    if(!chatInput.trim()) return;
    const msg={role:'user',content:chatInput}; setChatMessages(p=>[...p,msg]); setChatInput('');
    try {
      const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[...chatMessages.map(m=>({role:m.role==='assistant'?'model':'user',parts:[{text:m.content}]})),{role:'user',parts:[{text:chatInput}]}],systemInstruction:{parts:[{text:`You are Centurion AI security assistant. Stats: ${JSON.stringify({analytics,logs:logs.length})}. Be concise and professional.`}]}})});
      const d=await r.json();
      const text=String(d.candidates?.[0]?.content?.parts?.[0]?.text||'No response');
      setChatMessages(p=>[...p,{role:'assistant',content:text}]);
    } catch(e){ setChatMessages(p=>[...p,{role:'assistant',content:'Error: '+e.message}]); }
  };

  const mc = v => v>80?RED:v>60?GOLD:GREEN;

  // ══════════════════════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════════════════════
  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-primary)', opacity:langChanging?0.3:1, transition:'opacity 0.2s ease', position:'relative' }}>

      <style>{`
        @keyframes blinkCursor { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glowPulse { 0%,100%{opacity:0.5} 50%{opacity:1} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        .c-btn { transition:all 0.22s !important; }
        .c-btn:hover { filter:brightness(1.12); }
        .news-card:hover { border-color:${GOLD}44 !important; background:rgba(201,168,76,0.03) !important; transform:translateY(-2px) !important; }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:rgba(255,255,255,0.02); }
        ::-webkit-scrollbar-thumb { background:rgba(201,168,76,0.25); border-radius:4px; }
        ::-webkit-scrollbar-thumb:hover { background:rgba(201,168,76,0.45); }
        .terminal-line.auth { color:#00e87a; }
        .terminal-line.deny { color:#e83535; }
        .terminal-line.warn { color:#e8a435; }
        .terminal-line.info { color:#5599ff; }
        .terminal-line.sys  { color:rgba(255,255,255,0.42); }
      `}</style>

      {/* Inactivity overlay */}
      {inactiveCountdown !== null && (
        <div className="inactivity-overlay">
          <div style={{ fontFamily:'var(--font-display)', fontSize:14, color:GOLD, letterSpacing:5, marginBottom:10 }}>{t('inactivity').toUpperCase()}</div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:72, color:RED, fontWeight:900, lineHeight:1 }}>{inactiveCountdown}</div>
          <p style={{ fontFamily:'var(--font-mono)', color:'rgba(255,255,255,0.4)', fontSize:13, marginTop:10 }}>{t('inactivity')} {inactiveCountdown}s</p>
          <button className="btn-gold c-btn" onClick={resetInactivity} style={{ marginTop:18, borderRadius:10 }}>{t('stayLoggedIn')}</button>
        </div>
      )}

      <SideDrawer
        open={drawerOpen} onClose={()=>setDrawerOpen(false)} user={user} onLogout={onLogout}
        onSimOpen={()=>{
          const html=`<!DOCTYPE html><html><head><title>IoT Simulation</title><style>body{margin:0;background:#050505;color:${GOLD};font-family:monospace;display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:20px;}</style></head><body><h1 style="letter-spacing:6px">IoT Simulation</h1><p style="color:#555">Load IoTSimulation component here</p></body></html>`;
          const w=window.open('','_blank','width=1100,height=750,toolbar=0');
          if(w){ w.document.write(html); w.document.close(); }
        }}
        theme={theme} setTheme={setTheme} lang={lang} changeLanguage={changeLanguage}
        soundEnabled={soundEnabled} setSoundEnabled={setSoundEnabled}
        isReading={isReading}
        onReadToggle={()=>{ if(isReading){ stopReadAloud(); setIsReading(false); } else { readAloud(summaryText); setIsReading(true); } }}
        onScreenshot={()=>takeScreenshot()}
        setChatOpen={setChatOpen} t={t}
      />

      {/* ── NAV ────────────────────────────────────────────── */}
      <nav style={{ position:'sticky', top:0, zIndex:900, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 28px', height:60, background:'rgba(4,4,4,0.96)', backdropFilter:'blur(24px)', borderBottom:`1px solid rgba(201,168,76,0.1)`, boxShadow:'0 2px 24px rgba(0,0,0,0.5)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          {/* Sidebar icon (vertical lines) */}
          <button onClick={()=>setDrawerOpen(true)}
            style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.55)', width:38, height:38, borderRadius:8, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:4, transition:'all 0.2s', flexShrink:0, padding:'0 9px' }}
            onMouseEnter={e=>{ e.currentTarget.style.borderColor=GOLD; e.currentTarget.style.background=DIM; e.currentTarget.style.color=GOLD; }}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'; e.currentTarget.style.background='rgba(255,255,255,0.04)'; e.currentTarget.style.color='rgba(255,255,255,0.55)'; }}
            title="Open menu"
          >
            {/* Sidebar-style icon: one thick bar on the left, two thin on the right */}
            <div style={{ display:'flex', alignItems:'center', gap:3 }}>
              <div style={{ width:3, height:16, background:'currentColor', borderRadius:2 }} />
              <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                <div style={{ width:10, height:2, background:'currentColor', borderRadius:1 }} />
                <div style={{ width:10, height:2, background:'currentColor', borderRadius:1 }} />
                <div style={{ width:7, height:2, background:'currentColor', borderRadius:1 }} />
              </div>
            </div>
          </button>

          <div style={{ width:38, height:38, borderRadius:'50%', border:`1.5px solid ${GOLD}66`, display:'flex', alignItems:'center', justifyContent:'center', background:`${GOLD}0a`, boxShadow:`0 0 14px ${GOLD}22` }}>
            <span style={{ fontFamily:'var(--font-display)', fontWeight:900, fontSize:20, color:GOLD }}>C</span>
          </div>
          <div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:16, letterSpacing:5, color:GOLD, fontWeight:700, lineHeight:1 }}>CENTURION</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:8, color:'rgba(255,255,255,0.3)', letterSpacing:2, marginTop:1 }}>{user?.userId||'SYSTEM'} · SECURE SESSION</div>
          </div>
        </div>

        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 13px', background:'rgba(0,232,122,0.06)', border:`1px solid ${GREEN}22`, borderRadius:20 }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:GREEN, animation:'glowPulse 2s infinite' }} />
            <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:GREEN, letterSpacing:1 }}>{t('online')}</span>
          </div>
          {serverStarted && (
            <div style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 13px', background:`${GOLD}0a`, border:`1px solid ${GOLD}33`, borderRadius:20 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:GOLD, animation:'glowPulse 1.5s infinite' }} />
              <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:GOLD, letterSpacing:1 }}>{t('monitoring')}</span>
            </div>
          )}
          <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'rgba(255,255,255,0.22)', letterSpacing:1 }}>{t('pressEsc')}</div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <div style={{ position:'relative', height:230, overflow:'hidden', borderBottom:`1px solid rgba(255,255,255,0.05)` }}>
        <video autoPlay muted loop playsInline style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', filter:'blur(5px) brightness(0.22)', zIndex:0 }}>
          <source src={HERO_VIDEO_SRC} type="video/mp4" />
        </video>
        <div style={{ position:'absolute', inset:0, background:`linear-gradient(135deg,rgba(0,0,0,0.88) 0%,${GOLD}07 60%,rgba(0,0,0,0.75) 100%)`, zIndex:1 }} />
        <div style={{ position:'relative', zIndex:2, height:'100%', display:'flex', alignItems:'center', padding:'0 40px', gap:28 }}>
          <div style={{ width:80, height:80, borderRadius:'50%', border:`2px solid ${GOLD}`, overflow:'hidden', flexShrink:0, background:`${GOLD}10`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 0 28px ${GOLD}33` }}>
            {user?.avatarUrl
              ? <img src={user.avatarUrl} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              : <span style={{ fontFamily:'var(--font-display)', fontWeight:900, fontSize:38, color:GOLD }}>{String(user?.userId||'A')[0].toUpperCase()}</span>
            }
          </div>
          <div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:`${GOLD}77`, letterSpacing:4, marginBottom:7, textTransform:'uppercase' }}>Centurion® Security System</div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:32, color:GOLD, letterSpacing:1, marginBottom:10, fontWeight:700 }}>{greeting}</div>
            <Typewriter texts={[
              `Monitoring all access events in real-time.`,
              `${analytics.totalAttempts||logs.length} total access events logged.`,
              `ArcFace R100 biometric engine active.`,
              `Tor network routing · Identity protected.`,
              `${cam?.captureCount||0} surveillance captures this session.`,
              `All systems nominal. Stay secure.`,
            ]} />
          </div>
          <div style={{ marginLeft:'auto', display:'flex', flexDirection:'column', gap:7, alignItems:'flex-end' }}>
            {[
              { l:'SYSTEM',   s:'NOMINAL',   c:GREEN },
              { l:'AI MODEL', s:'READY',     c:GREEN },
              { l:'DATABASE', s:'CONNECTED', c:GREEN },
              { l:'TOR',      s:'ACTIVE',    c:GOLD  },
              { l:'CAMERA',   s:cam?.cameraReady?'LIVE':'STANDBY', c:cam?.cameraReady?GREEN:'rgba(255,255,255,0.3)' },
            ].map(({l,s,c})=>(
              <div key={l} style={{ display:'flex', alignItems:'center', gap:7, padding:'4px 12px', background:'rgba(0,0,0,0.55)', borderRadius:14, border:`1px solid ${c}18`, backdropFilter:'blur(6px)' }}>
                <div style={{ width:5, height:5, borderRadius:'50%', background:c, animation:'glowPulse 2s infinite' }} />
                <span style={{ fontFamily:'var(--font-mono)', fontSize:8, color:'rgba(255,255,255,0.38)', letterSpacing:1 }}>{l}</span>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:8, color:c, letterSpacing:1, fontWeight:600 }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ────────────────────────────────────── */}
      <div style={{ maxWidth:1440, margin:'0 auto', padding:'40px 32px' }}>

        {/* ── ANALYTICS STAT CARDS (no emojis) ─────────────── */}
        <div id="analytics">
          <SH sub="Real-time biometric access metrics from backend logs">{t('analytics')}</SH>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(195px,1fr))', gap:16, marginBottom:40 }}>
            <StatCard label={t('totalAttempts')} value={analytics.totalAttempts||logs.length} sub="All access events" />
            <StatCard label={t('authorized')}    value={authCount} color={GREEN} sub="Verified identities" />
            <StatCard label={t('denied')}        value={denyCount} color={RED}   sub="Blocked attempts" />
            <StatCard label={t('avgConfidence')} value={`${((analytics.avgConfidence||0)*100).toFixed(0)}%`} color={GOLD} sub="Biometric accuracy" />
            <StatCard label={t('uniqueUsers')}   value={analytics.uniqueUserCount||0} color={BLUE} sub="Registered users" />
            <StatCard label={t('avgAge')}        value={`${analytics.avgAge||0}y`} sub="Demographic avg" />
          </div>
        </div>

        {/* ── SECURITY CONSOLE ─────────────────────────────── */}
        <div id="console">
          <SH sub="Live access event stream — real backend data — boot to initialise">{t('logs')} — Console</SH>
          <div style={{ ...card, marginBottom:14, borderRadius:12, overflow:'hidden', border:`1px solid rgba(201,168,76,0.12)` }}>
            {/* Terminal bar */}
            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', padding:'11px 18px', background:'#050505', borderBottom:`1px solid rgba(255,255,255,0.04)` }}>
              <div style={{ display:'flex', gap:5 }}>
                <div style={{ width:11,height:11,borderRadius:'50%',background:'#ff5f57' }} />
                <div style={{ width:11,height:11,borderRadius:'50%',background:'#febc2e' }} />
                <div style={{ width:11,height:11,borderRadius:'50%',background:'#28c840' }} />
              </div>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'rgba(255,255,255,0.28)', marginLeft:8 }}>
                centurion@security:~$ <span style={{ color:GOLD }}>./monitor --live --stream</span>
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
                      {serverStarting ? `${t('booting')}...` : `${t('startMonitor')}`}
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

            {/* Terminal body — pure black */}
            <div className="terminal-body" ref={terminalRef}
              style={{ minHeight:340, maxHeight:520, fontSize:12.5, lineHeight:1.88, fontFamily:'var(--font-mono)', background:'#000000', padding:'14px 18px', overflowY:'auto' }}>
              {terminalLines.length===0
                ? (
                  <div style={{ padding:'40px 0', textAlign:'center' }}>
                    <div style={{ fontFamily:'var(--font-display)', fontSize:13, color:GOLD+'66', letterSpacing:6, marginBottom:10 }}>CENTURION® SECURITY CONSOLE</div>
                    <div style={{ color:'rgba(255,255,255,0.12)', fontSize:12, letterSpacing:2, marginBottom:20 }}>─────────────────────────────────────────</div>
                    <div style={{ color:'rgba(255,255,255,0.35)', fontSize:12 }}>
                      Press{' '}<span style={{ color:GOLD, border:`1px solid ${GOLD}55`, padding:'3px 10px', borderRadius:5 }}>{t('startMonitor')}</span>{' '}to initialise
                    </div>
                    <div style={{ color:'rgba(255,255,255,0.15)', fontSize:10, marginTop:16, letterSpacing:1 }}>
                      Full log replay from backend · Real-time event stream
                    </div>
                  </div>
                )
                : terminalLines.map((l,i)=>(
                  <span key={i} className={`terminal-line ${l.cls}`}
                    style={{ display:'block', paddingLeft:4,
                      background: l.cls==='deny'&&l.text.includes('DENIED') ? 'rgba(232,53,53,0.035)' : l.cls==='auth'&&l.text.includes('GRANTED') ? 'rgba(0,232,122,0.03)' : 'transparent',
                      borderLeft: l.cls==='deny'&&l.text.includes('DENIED') ? `2px solid ${RED}44` : l.cls==='auth'&&l.text.includes('GRANTED') ? `2px solid ${GREEN}44` : 'none',
                    }}>
                    {l.text}
                  </span>
                ))
              }
              <span className="terminal-line sys" style={{ animation:'blinkCursor 1s infinite' }}>_</span>
            </div>

            {/* Status bar */}
            <div style={{ padding:'7px 18px', borderTop:`1px solid rgba(255,255,255,0.04)`, display:'flex', justifyContent:'space-between', background:'#050505', flexWrap:'wrap', gap:8 }}>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:serverStarted?GREEN:'rgba(255,255,255,0.2)', letterSpacing:1 }}>
                {serverStarted ? `${t('monitoring')} ACTIVE` : t('offline')} · {logs.length} {t('events')}
              </span>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'rgba(255,255,255,0.18)', letterSpacing:1 }}>
                Centurion® v3.0 · ArcFace R100
              </span>
            </div>
          </div>
        </div>

        {/* ── CPU & SYSTEM METRICS ─────────────────────────── */}
        <div style={{ marginBottom:40, marginTop:40 }}>
          <SH sub={serverStarted ? 'Live system metrics — elevated after console start' : 'System resource monitors — start console to activate'}>{t('cpuUsage')} & System Metrics</SH>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
            <MetricCard label={t('cpuUsage')} val={metrics.cpu[metrics.cpu.length-1]?.v||0} data={metrics.cpu}  color={BLUE} />
            <MetricCard label={t('memory')}   val={metrics.mem[metrics.mem.length-1]?.v||0} data={metrics.mem}  color={GOLD} />
            <MetricCard label={t('disk')}     val={metrics.disk[metrics.disk.length-1]?.v||0} data={metrics.disk} color={GREEN} />
            <MetricCard label={t('network')}  val={metrics.net[metrics.net.length-1]?.v||0} data={metrics.net}  color='#cc44ff' />
          </div>
        </div>

        {/* ── ANALYTICS CHARTS ─────────────────────────────── */}
        <div id="charts">
          <SH sub="Statistical visualisation of access logs — real-time data">Analytics Charts</SH>

          {/* Row 1: Area chart + Pie + Radial */}
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:14, marginBottom:14 }}>
            {/* Area: attempts per hour */}
            <div style={{ ...card, padding:'22px 20px' }}>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'rgba(255,255,255,0.3)', letterSpacing:3, marginBottom:14, textTransform:'uppercase' }}>{t('attemptsHour')}</div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={hourlyData}>
                  <defs>
                    <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={GREEN} stopOpacity={0.28} />
                      <stop offset="95%" stopColor={GREEN} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gD" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={RED} stopOpacity={0.28} />
                      <stop offset="95%" stopColor={RED} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="time" stroke="rgba(255,255,255,0.1)" tick={{ fontSize:9, fill:'rgba(255,255,255,0.28)' }} />
                  <YAxis stroke="rgba(255,255,255,0.1)" tick={{ fontSize:9, fill:'rgba(255,255,255,0.28)' }} />
                  <Tooltip {...CT} />
                  <Legend formatter={v=>String(v)} />
                  <Area type="monotone" dataKey="authorized"   stroke={GREEN} fill="url(#gA)" strokeWidth={2} name="Authorized" />
                  <Area type="monotone" dataKey="unauthorized" stroke={RED}   fill="url(#gD)" strokeWidth={2} name="Denied" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Pie: auth ratio */}
            <div style={{ ...card, padding:'22px 20px' }}>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'rgba(255,255,255,0.3)', letterSpacing:3, marginBottom:14, textTransform:'uppercase' }}>{t('authRatio')}</div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" cx="50%" cy="48%" outerRadius={72} innerRadius={40} strokeWidth={2}>
                    {pieData.map((_,i)=><Cell key={i} fill={PIE_COLORS[i]} stroke="rgba(0,0,0,0.5)" />)}
                  </Pie>
                  <Tooltip {...CT} />
                  <Legend formatter={v=>String(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Radial: success rate */}
            <div style={{ ...card, padding:'22px 20px' }}>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'rgba(255,255,255,0.3)', letterSpacing:3, marginBottom:14, textTransform:'uppercase' }}>{t('successRate')}</div>
              <ResponsiveContainer width="100%" height={200}>
                <RadialBarChart cx="50%" cy="62%" innerRadius="55%" outerRadius="90%" data={radialData} startAngle={180} endAngle={0}>
                  <RadialBar dataKey="value" cornerRadius={7} background={{ fill:'rgba(255,255,255,0.03)' }} />
                  <text x="50%" y="52%" textAnchor="middle" dominantBaseline="middle" style={{ fontFamily:'monospace', fontSize:32, fontWeight:800, fill:GREEN }}>
                    {radialData[0].value}%
                  </text>
                  <text x="50%" y="72%" textAnchor="middle" style={{ fontFamily:'monospace', fontSize:10, fill:'rgba(255,255,255,0.3)' }}>
                    Auth Rate
                  </text>
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Row 2: Line chart + Bar chart */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:40 }}>
            {/* Line: confidence trend */}
            <div style={{ ...card, padding:'22px 20px' }}>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'rgba(255,255,255,0.3)', letterSpacing:3, marginBottom:14, textTransform:'uppercase' }}>{t('confidenceTrend')}</div>
              <ResponsiveContainer width="100%" height={175}>
                <LineChart data={confData}>
                  <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="n" stroke="rgba(255,255,255,0.1)" tick={{ fontSize:9, fill:'rgba(255,255,255,0.28)' }} />
                  <YAxis domain={[0,100]} stroke="rgba(255,255,255,0.1)" tick={{ fontSize:9, fill:'rgba(255,255,255,0.28)' }} />
                  <Tooltip {...CT} />
                  <Line type="monotone" dataKey="v" stroke={GOLD} strokeWidth={2.5} dot={{ fill:GOLD, r:2.5 }} name="Conf %" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Bar: demographics */}
            <div style={{ ...card, padding:'22px 20px' }}>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'rgba(255,255,255,0.3)', letterSpacing:3, marginBottom:14, textTransform:'uppercase' }}>{t('demographics')}</div>
              {ethnicityData.length===0
                ? <div style={{ textAlign:'center', padding:'48px 0', fontFamily:'var(--font-mono)', fontSize:11, color:'rgba(255,255,255,0.2)' }}>No demographic data yet</div>
                : <ResponsiveContainer width="100%" height={175}>
                    <BarChart data={ethnicityData}>
                      <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.1)" tick={{ fontSize:9, fill:'rgba(255,255,255,0.28)' }} />
                      <YAxis stroke="rgba(255,255,255,0.1)" tick={{ fontSize:9, fill:'rgba(255,255,255,0.28)' }} />
                      <Tooltip {...CT} />
                      <Bar dataKey="value" radius={[5,5,0,0]}>
                        {ethnicityData.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
              }
            </div>
          </div>
        </div>

        {/* ── SURVEILLANCE ─────────────────────────────────── */}
        <div id="surveillance">
          <SH sub="Rate-limited captures: max 4/min, 15s minimum interval — hover for download/copy options">{t('snapshots')}</SH>
          <div style={{ ...card, padding:24, marginBottom:40 }}>
            <SnapshotTabs
              backendLogs={logs}
              survSnapshots={cam?.snapshots||[]}
              onManualSnap={()=>rateLimitedSnap('manual')}
              onClear={()=>cam?.clearSnapshots()}
            />
          </div>
        </div>

        {/* ── SUMMARY REPORT ───────────────────────────────── */}
        <div id="summary">
          <SH sub="Exportable security report including real backend log data">{t('summary')}</SH>
          <div style={{ ...card, padding:28, marginBottom:40 }}>
            <pre style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'rgba(255,255,255,0.52)', lineHeight:2, whiteSpace:'pre-wrap', marginBottom:18, borderLeft:`2px solid ${GOLD}33`, paddingLeft:18 }}>
              {summaryText}
            </pre>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              <button className="btn-gold c-btn" onClick={exportPDF}   style={{ borderRadius:8, fontSize:11 }}>Export PDF</button>
              <button className="btn-ghost c-btn" onClick={()=>navigator.clipboard.writeText(summaryText)} style={{ borderRadius:8, fontSize:11 }}>Copy Report</button>
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
                  style={{ padding:'8px 18px', fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:1, background:newsTab===k?`${GOLD}14`:'rgba(255,255,255,0.03)', border:`1px solid ${newsTab===k?GOLD:'rgba(255,255,255,0.09)'}`, color:newsTab===k?GOLD:'rgba(255,255,255,0.38)', borderRadius:7, cursor:'pointer', transition:'all 0.22s', boxShadow:newsTab===k?`0 0 14px ${GOLD}18`:'none' }}>
                  {label}
                </button>
              ))}
            </div>
            {allNews.length===0
              ? <div style={{ textAlign:'center', padding:'36px 0', fontFamily:'var(--font-mono)', fontSize:12, color:'rgba(255,255,255,0.22)' }}>Fetching from Hacker News...</div>
              : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(285px,1fr))', gap:12 }}>
                  {allNews.map((item,i)=>(
                    <a key={i} href={item.url||`https://news.ycombinator.com/item?id=${item.id}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration:'none' }}>
                      <div className="news-card" style={{ padding:'15px 17px', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, background:'rgba(255,255,255,0.02)', transition:'all 0.22s', cursor:'pointer' }}>
                        <div style={{ fontFamily:'var(--font-body)', fontSize:13, color:'rgba(255,255,255,0.78)', marginBottom:9, lineHeight:1.6, fontWeight:500 }}>{String(item.title||'')}</div>
                        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                          <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:GOLD }}>+{item.score||0}</span>
                          <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'rgba(255,255,255,0.25)' }}>by {String(item.by||'anon')}</span>
                          <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'rgba(255,255,255,0.2)', marginLeft:'auto' }}>{item.descendants||0} comments</span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
            }
          </div>
        </div>

        {/* ── CONTACT ──────────────────────────────────────── */}
        <div id="contact">
          <SH sub="Reach out to the system administrator">{t('contact')}</SH>
          <div style={{ ...card, padding:32, marginBottom:40 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:36 }}>
              <div>
                <p style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'rgba(255,255,255,0.35)', letterSpacing:2, marginBottom:18 }}>{t('contactAdmin').toUpperCase()}</p>
                <input className="centurion-input" placeholder={t('adminEmail')} value={emailTo}    onChange={e=>setEmailTo(e.target.value)}    style={{ marginBottom:12, fontSize:13, borderRadius:8 }} />
                <input className="centurion-input" placeholder={t('subject')}    value={emailTopic} onChange={e=>setEmailTopic(e.target.value)} style={{ marginBottom:12, fontSize:13, borderRadius:8 }} />
                <textarea className="centurion-input" placeholder={t('message')} value={emailBody} onChange={e=>setEmailBody(e.target.value)} rows={4} style={{ resize:'vertical', marginBottom:16, fontSize:13, borderRadius:8 }} />
                <button className="btn-gold c-btn" style={{ width:'100%', fontSize:13, borderRadius:9, padding:'13px' }}>{t('sendMessage')}</button>
              </div>

              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:24 }}>
                {/* Big C logo */}
                <div style={{ width:72, height:72, borderRadius:'50%', border:`2px solid ${GOLD}66`, display:'flex', alignItems:'center', justifyContent:'center', background:`${GOLD}0d`, boxShadow:`0 0 28px ${GOLD}22` }}>
                  <span style={{ fontFamily:'var(--font-display)', fontWeight:900, fontSize:38, color:GOLD }}>C</span>
                </div>
                {/* Social links as text only */}
                <div style={{ display:'flex', flexDirection:'column', gap:10, width:'100%', maxWidth:200 }}>
                  {SOCIAL_LINKS.map(({ label, href })=>(
                    <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                      style={{ display:'block', textAlign:'center', textDecoration:'none', fontFamily:'var(--font-mono)', fontSize:12, color:'rgba(255,255,255,0.38)', letterSpacing:3, padding:'9px 0', borderRadius:7, border:'1px solid rgba(255,255,255,0.06)', background:'rgba(255,255,255,0.02)', transition:'all 0.22s', textTransform:'uppercase' }}
                      onMouseEnter={e=>{ e.currentTarget.style.color=GOLD; e.currentTarget.style.borderColor=GOLD+'44'; e.currentTarget.style.background=DIM; }}
                      onMouseLeave={e=>{ e.currentTarget.style.color='rgba(255,255,255,0.38)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.06)'; e.currentTarget.style.background='rgba(255,255,255,0.02)'; }}
                    >
                      {label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── ABOUT + QR ───────────────────────────────────── */}
        <div id="about">
          <SH sub="Platform overview and security architecture">About Centurion®</SH>
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
                  {['ArcFace R100','Tor Network','MongoDB','OpenCV DNN','AES-256','React + C++','Gemini AI','Node.js'].map(tag=>(
                    <span key={tag} style={{ fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:1, color:`${GOLD}88`, border:`1px solid ${GOLD}1a`, padding:'4px 10px', borderRadius:5, background:`${GOLD}07` }}>{tag}</span>
                  ))}
                </div>
              </div>

              {/* QR code block */}
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14, padding:'22px 18px', background:`${GOLD}06`, border:`1px solid ${GOLD}18`, borderRadius:14 }}>
                <QRCode value="https://wa.me/254119750041" size={148} />
                <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'rgba(255,255,255,0.38)', textAlign:'center', lineHeight:2, letterSpacing:0.5 }}>
                  <strong style={{ color:GOLD, display:'block', marginBottom:4 }}>{t('scanHere')}</strong>
                  {t('suggestImprove')}<br />
                  {t('reportBug')}<br />
                  {t('buyCoffee')}
                </div>
                <a href="https://wa.me/254119750041" target="_blank" rel="noopener noreferrer" className="c-btn"
                  style={{ fontFamily:'var(--font-mono)', fontSize:10, color:GOLD, textDecoration:'none', border:`1px solid ${GOLD}44`, padding:'8px 16px', borderRadius:7, display:'block', textAlign:'center', transition:'all 0.22s', background:'transparent' }}
                  onMouseEnter={e=>e.currentTarget.style.background=DIM}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                >
                  {t('openWhatsapp')}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ── FOOTER ────────────────────────────────────────── */}
        <footer style={{ borderTop:`1px solid rgba(201,168,76,0.1)`, paddingTop:40, paddingBottom:52 }}>
          {/* Top row: brand block centred above the 3 columns */}
          <div style={{ textAlign:'center', marginBottom:36 }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:14, justifyContent:'center' }}>
              <div style={{ width:40, height:40, borderRadius:'50%', border:`1.5px solid ${GOLD}66`, display:'flex', alignItems:'center', justifyContent:'center', background:`${GOLD}0d`, boxShadow:`0 0 16px ${GOLD}22` }}>
                <span style={{ fontFamily:'var(--font-display)', fontWeight:900, fontSize:20, color:GOLD }}>C</span>
              </div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:22, color:GOLD, letterSpacing:5, fontWeight:700 }}>CENTURION®</div>
            </div>
            <p style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'rgba(255,255,255,0.24)', lineHeight:1.8, letterSpacing:0.5, marginTop:10, maxWidth:440, margin:'10px auto 0' }}>
              AI-powered biometric access control platform. Engineered for security professionals.
            </p>
          </div>

          {/* 3-column grid */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:28, marginBottom:32 }}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-start' }}>
              {/* intentionally empty — brand is above */}
            </div>

            {/* Quick links — centred */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'rgba(255,255,255,0.22)', letterSpacing:4, marginBottom:14, textTransform:'uppercase' }}>Quick Links</div>
              {[['Analytics','analytics'],['Security Console','console'],['Surveillance','surveillance'],['News Feed','news']].map(([label,id])=>(
                <div key={label} onClick={()=>document.getElementById(id)?.scrollIntoView({behavior:'smooth'})}
                  style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'rgba(255,255,255,0.35)', cursor:'pointer', transition:'color 0.2s', marginBottom:8, letterSpacing:0.5 }}
                  onMouseEnter={e=>e.currentTarget.style.color=GOLD}
                  onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.35)'}
                >
                  {label}
                </div>
              ))}
            </div>

            {/* System status — centred */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'rgba(255,255,255,0.22)', letterSpacing:4, marginBottom:14, textTransform:'uppercase' }}>System Status</div>
              {[
                ['API Server',    'Running on :8080',     GREEN],
                ['MongoDB',       'centurion database',   GREEN],
                ['Tor Circuit',   'SOCKS5 :9050',         GOLD],
                ['AI Engine',     'ArcFace R100 CPU',     GREEN],
                ['Camera',        'Surveillance',         cam?.cameraReady?GREEN:'rgba(255,255,255,0.25)'],
              ].map(([label,status,c])=>(
                <div key={label} style={{ display:'flex', justifyContent:'space-between', gap:14, marginBottom:7, fontFamily:'var(--font-mono)', fontSize:10, width:'100%', maxWidth:220 }}>
                  <span style={{ color:'rgba(255,255,255,0.35)' }}>{label}</span>
                  <span style={{ color:c, fontSize:9 }}>{status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom row */}
          <div style={{ borderTop:`1px solid rgba(255,255,255,0.04)`, paddingTop:18, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
            <p style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'rgba(255,255,255,0.22)', letterSpacing:1 }}>
              {t('footer')} · 2025–{new Date().getFullYear()} · Aura Joshua™
            </p>
            <div style={{ display:'flex', gap:10 }}>
              {['AES-256','Zero-Trust','Biometric-MFA'].map(badge=>(
                <span key={badge} style={{ fontFamily:'var(--font-mono)', fontSize:8, color:`${GOLD}55`, border:`1px solid ${GOLD}18`, padding:'3px 8px', borderRadius:4, letterSpacing:1 }}>{badge}</span>
              ))}
            </div>
          </div>
        </footer>
      </div>

      {/* ── AI CHAT ─────────────────────────────────────────── */}
      {chatOpen && (
        <div className="ai-chat-window" style={{ borderRadius:16, overflow:'hidden', boxShadow:`0 24px 80px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.05)` }}>
          <div style={{ padding:'14px 18px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between', background:'#050505' }}>
            <div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:12, color:GOLD, letterSpacing:3 }}>GEMINI AI ASSISTANT</div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:8, color:'rgba(255,255,255,0.28)', letterSpacing:1 }}>Centurion® Security Intelligence</div>
            </div>
            <button style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.45)', fontSize:15, cursor:'pointer', width:28, height:28, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s' }}
              onMouseEnter={e=>{ e.currentTarget.style.borderColor=RED; e.currentTarget.style.color=RED; }}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'; e.currentTarget.style.color='rgba(255,255,255,0.45)'; }}
              onClick={()=>setChatOpen(false)}>×</button>
          </div>
          {GEMINI_API_KEY==='YOUR_GEMINI_API_KEY_HERE' && (
            <div style={{ padding:'8px 14px', background:`rgba(232,53,53,0.07)`, borderBottom:`1px solid ${RED}22`, fontFamily:'var(--font-mono)', fontSize:9, color:RED, letterSpacing:1 }}>
              Paste Gemini API key in GEMINI_API_KEY constant
            </div>
          )}
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
