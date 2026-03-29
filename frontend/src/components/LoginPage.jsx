import React, { useState, useRef, useEffect, useCallback } from 'react';
import { identifyFace, enrollFace,
  savePendingRegistration, isRegistrationApproved,
  approvePendingRegistration, rejectPendingRegistration
} from '../api/backendAPI';
import { useCameraContext } from '../App';

// ── CONFIG ────────────────────────────────────────────────────
const EMAILJS_SERVICE_ID        = 'service_nhog3wp';
const EMAILJS_OTP_TEMPLATE_ID   = 'template_xgzxfph';
const EMAILJS_ALERT_TEMPLATE_ID = 'template_143kmri';
const EMAILJS_PUBLIC_KEY        = 'OGm0btddjPxjwRZ3b';
const ADMIN_EMAIL               = 'joshuaura7822@gmail.com';
const OTP_EXPIRY_SECS           = 600;

// ── Registered users store (in-memory + sessionStorage) ───────
const USERS_KEY = 'centurion_registered_users';
function getRegisteredUsers() {
  try { return JSON.parse(sessionStorage.getItem(USERS_KEY) || '{}'); } catch { return {}; }
}
function saveRegisteredUser(username, data) {
  const users = getRegisteredUsers();
  users[username.toLowerCase()] = { ...data, registeredAt: new Date().toISOString() };
  try { sessionStorage.setItem(USERS_KEY, JSON.stringify(users)); } catch {}
}
function lookupUser(username) {
  const users = getRegisteredUsers();
  return users[username.toLowerCase()] || null;
}
function isUserRegistered(username) {
  return !!lookupUser(username);
}

// ── Cookie consent ────────────────────────────────────────────
const COOKIE_KEY = 'centurion_cookies_v1';
const getCookieConsent = () => { try { return localStorage.getItem(COOKIE_KEY) === 'true'; } catch { return false; } };
const setCookieConsent = () => { try { localStorage.setItem(COOKIE_KEY, 'true'); } catch {} };

function CookieBanner({ onAccept, onDecline }) {
  return (
    <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:99999,
      background:'rgba(6,6,6,0.97)', backdropFilter:'blur(20px)',
      borderTop:'1px solid rgba(201,168,76,0.18)',
      padding:'16px 28px', display:'flex', alignItems:'center',
      justifyContent:'space-between', flexWrap:'wrap', gap:14 }}>
      <div style={{ flex:1, minWidth:260, display:'flex', alignItems:'flex-start', gap:12 }}>
        <span style={{ fontSize:28, flexShrink:0 }}>🍪🍪</span>
        <div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:11, color:'var(--gold)',
            letterSpacing:3, marginBottom:4 }}>COOKIE NOTICE</div>
          <p style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-secondary)',
            lineHeight:1.7, maxWidth:580 }}>
            Centurion® uses essential session cookies 🍪 for authentication tokens, biometric
            session data and security event logging. Functional cookies store language and
            accessibility preferences. No advertising cookies are used. Declining essential
            cookies will prevent authentication from working correctly.
          </p>
        </div>
      </div>
      <div style={{ display:'flex', gap:10, flexShrink:0 }}>
        <button onClick={onDecline} style={{ background:'none',
          border:'1px solid rgba(255,255,255,0.1)', color:'var(--text-secondary)',
          fontFamily:'var(--font-mono)', fontSize:9, padding:'7px 16px',
          borderRadius:3, cursor:'pointer', letterSpacing:2 }}>DECLINE</button>
        <button onClick={onAccept} className="btn-gold"
          style={{ fontSize:9, padding:'7px 18px', letterSpacing:3 }}>
          ACCEPT ALL 🍪
        </button>
      </div>
    </div>
  );
}

// ── Digital Clock ─────────────────────────────────────────────
function DigitalClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const iv = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);
  const pad = n => String(n).padStart(2,'0');
  const days = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
  return (
    <div style={{ position:'fixed', top:16, left:20, zIndex:500,
      fontFamily:'var(--font-mono)', userSelect:'none' }}>
      <div style={{ fontSize:22, letterSpacing:3, color:'var(--gold)', lineHeight:1,
        fontVariantNumeric:'tabular-nums', fontWeight:700 }}>
        {pad(time.getHours())}
        <span style={{ opacity: time.getSeconds()%2===0?1:0.3, transition:'opacity 0.1s' }}>:</span>
        {pad(time.getMinutes())}
        <span style={{ opacity: time.getSeconds()%2===0?1:0.3, transition:'opacity 0.1s' }}>:</span>
        {pad(time.getSeconds())}
      </div>
      <div style={{ fontSize:9, color:'var(--text-secondary)', letterSpacing:2, marginTop:2 }}>
        {days[time.getDay()]} {time.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}).toUpperCase()}
      </div>
    </div>
  );
}

// ── Password strength rules ───────────────────────────────────
const KEYBOARD_ROWS = [
  'qwertyuiop', 'asdfghjkl', 'zxcvbnm',
  '1234567890', '!@#$%^&*()'
];
function hasConsecutiveKeys(pwd) {
  const p = pwd.toLowerCase();
  for (const row of KEYBOARD_ROWS) {
    for (let i = 0; i < p.length - 2; i++) {
      const trio = p.slice(i, i+3);
      if (row.includes(trio)) return true;
    }
  }
  return false;
}
function getPasswordRules(pwd, username) {
  return [
    { id:'len',     text:'At least 7 characters',              ok: pwd.length >= 7 },
    { id:'upper',   text:'Must include a capital letter',       ok: /[A-Z]/.test(pwd) },
    { id:'number',  text:'Must include a number',               ok: /[0-9]/.test(pwd) },
    { id:'special', text:'Must include a special character',    ok: /[^A-Za-z0-9]/.test(pwd) },
    { id:'nouser',  text:'Must not match username',             ok: pwd.toLowerCase() !== username.toLowerCase() && !pwd.toLowerCase().includes(username.toLowerCase()) },
    { id:'nokeys',  text:'No consecutive keyboard keys (abc, 123…)', ok: !hasConsecutiveKeys(pwd) },
  ];
}
function isPasswordValid(pwd, username) {
  return getPasswordRules(pwd, username).every(r => r.ok);
}

function generateSecurePassword() {
  const upper  = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower  = 'abcdefghjkmnpqrstuvwxyz';
  const nums   = '23456789';
  const specials = '!@#$%^&*-_=+?';
  const all = upper + lower + nums + specials;
  let pwd = '';
  // Guarantee at least one of each required type
  pwd += upper[Math.floor(Math.random()*upper.length)];
  pwd += lower[Math.floor(Math.random()*lower.length)];
  pwd += nums[Math.floor(Math.random()*nums.length)];
  pwd += specials[Math.floor(Math.random()*specials.length)];
  // Fill to 12 chars
  for (let i = 0; i < 8; i++) pwd += all[Math.floor(Math.random()*all.length)];
  // Shuffle
  return pwd.split('').sort(() => Math.random()-0.5).join('');
}

function PasswordRules({ password, username, visible }) {
  const rules = getPasswordRules(password, username);
  const failing = rules.filter(r => !r.ok);
  if (!visible || failing.length === 0) return null;
  return (
    <div style={{ marginTop:8, overflow:'hidden' }}>
      {failing.map(rule => (
        <div key={rule.id} style={{
          display:'flex', alignItems:'center', gap:8,
          padding:'5px 10px', marginBottom:4,
          background:'rgba(255,51,51,0.06)',
          border:'1px solid rgba(255,51,51,0.2)',
          borderRadius:3, fontFamily:'var(--font-mono)', fontSize:10,
          color:'#ff6666',
          animation:'fadeInUp 0.25s ease',
        }}>
          <span style={{ fontSize:12 }}>✗</span>
          {rule.text}
        </div>
      ))}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────
const rnd = (a,b) => Math.floor(Math.random()*(b-a+1))+a;
const pick = arr => arr[rnd(0,arr.length-1)];
const genOTP = () => Math.floor(100000+Math.random()*900000).toString();

// ── EmailJS ───────────────────────────────────────────────────
let ejsLoaded = false;
async function loadEmailJS() {
  if (ejsLoaded||window.emailjs) { ejsLoaded=true; return; }
  await new Promise((res,rej)=>{
    const s=document.createElement('script');
    s.src='https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
    s.onload=()=>{ window.emailjs.init(EMAILJS_PUBLIC_KEY); ejsLoaded=true; res(); };
    s.onerror=rej; document.head.appendChild(s);
  });
}
async function sendOTPEmail(toEmail,otp) {
  await loadEmailJS();
  return window.emailjs.send(EMAILJS_SERVICE_ID,EMAILJS_OTP_TEMPLATE_ID,{
    to_email:toEmail, email:toEmail, to_name:toEmail.split('@')[0],
    otp, otp_code:otp, timestamp:new Date().toLocaleString(), expires_in:'10 minutes'
  });
}
async function sendAdminApprovalEmail(applicantEmail,applicantName,token) {
  await loadEmailJS();
  const [isVerifying, setIsVerifying] = useState(false);
  const base = window.location.origin;
  const approveUrl = `${base}?approve=${token}&email=${encodeURIComponent(applicantEmail)}`;
  return window.emailjs.send(EMAILJS_SERVICE_ID,EMAILJS_ALERT_TEMPLATE_ID,{
    to_email:ADMIN_EMAIL, timestamp:new Date().toLocaleString(),
    ip_address:'New Registration Request',
    attempt_count:`NEW USER: ${applicantName} · ${applicantEmail}`,
    estimated_age:`One-click approve: ${approveUrl}`,
    estimated_gender:'Click the link above to approve instantly.',
    estimated_ethnicity:'Centurion® Registration System',
    liveness_status:'PENDING APPROVAL',
    snapshot_path:'None',
    user_id:applicantName, confidence:'N/A'
  });
}
async function sendAlertEmail(d={}) {
  try {
    await loadEmailJS();
    await window.emailjs.send(EMAILJS_SERVICE_ID,EMAILJS_ALERT_TEMPLATE_ID,{
      to_email:ADMIN_EMAIL, timestamp:new Date().toLocaleString(),
      ip_address:d.ipAddress||'browser', attempt_count:d.attemptCount||1,
      estimated_age:d.estimatedAge||'unknown', estimated_gender:d.estimatedGender||'unknown',
      estimated_ethnicity:d.estimatedEthnicity||'unknown',
      liveness_status:d.livenessPass?'PASS':'FAIL', snapshot_path:d.snapshotPath||'none',
      user_id:d.userId||'UNKNOWN', confidence:d.confidence?`${(d.confidence*100).toFixed(1)}%`:'0%'
    });
  } catch(e) { console.error('[EMAIL]',e); }
}

// ── 2 Captcha challenges only (no sequence memory) ────────────
function CanvasTextCaptcha({ onSolve }) {
  const ref = useRef(null);
  const [input, setInput] = useState('');
  const [answer, setAnswer] = useState('');
  const [err, setErr] = useState('');
  const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  const generate = useCallback(() => {
    const code = Array.from({length:6},()=>CHARS[rnd(0,CHARS.length-1)]).join('');
    setAnswer(code); setInput(''); setErr('');
    requestAnimationFrame(() => {
      const canvas=ref.current; if(!canvas) return;
      const ctx=canvas.getContext('2d'), W=canvas.width, H=canvas.height;
      ctx.clearRect(0,0,W,H);
      ctx.fillStyle='#060606'; ctx.fillRect(0,0,W,H);
      for(let i=0;i<220;i++){
        ctx.fillStyle=`rgba(${rnd(80,200)},${rnd(60,130)},${rnd(10,70)},${Math.random()*.35+.08})`;
        ctx.beginPath(); ctx.arc(rnd(0,W),rnd(0,H),rnd(1,2.5),0,Math.PI*2); ctx.fill();
      }
      for(let i=0;i<7;i++){
        ctx.strokeStyle=`rgba(201,168,76,${Math.random()*.18+.04})`;
        ctx.lineWidth=Math.random()*1.5+.3;
        ctx.beginPath(); ctx.moveTo(rnd(0,W),rnd(0,H));
        ctx.bezierCurveTo(rnd(0,W),rnd(0,H),rnd(0,W),rnd(0,H),rnd(0,W),rnd(0,H));
        ctx.stroke();
      }
      const fonts=['Bold 27px Georgia','26px Courier New','Bold 28px serif','27px Impact'];
      code.split('').forEach((ch,i)=>{
        ctx.save();
        ctx.translate(14+i*37, H/2+rnd(-5,5));
        ctx.rotate((Math.random()-.5)*.45);
        ctx.font=pick(fonts);
        ctx.fillStyle=`hsl(${rnd(36,54)},${rnd(65,100)}%,${rnd(52,78)}%)`;
        ctx.shadowColor='rgba(0,0,0,0.9)'; ctx.shadowBlur=5;
        ctx.transform(1,(Math.random()-.5)*.28,(Math.random()-.5)*.18,1,0,0);
        ctx.fillText(ch,0,0); ctx.restore();
      });
      ctx.strokeStyle='rgba(201,168,76,0.05)'; ctx.lineWidth=.4;
      for(let x=0;x<W;x+=11){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
      for(let y=0;y<H;y+=11){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
    });
  },[]);

  useEffect(()=>{ generate(); },[generate]);
  const submit = () => {
    if(input.toUpperCase().trim()===answer){ onSolve(); }
    else { setErr('✗ Incorrect — new code generated'); generate(); }
  };
  return (
    <div style={{textAlign:'center'}}>
      <div style={{fontFamily:'var(--font-mono)',fontSize:9,color:'var(--text-secondary)',letterSpacing:3,marginBottom:8}}>TYPE EXACTLY WHAT YOU SEE</div>
      <div style={{display:'inline-block',border:'1px solid var(--border)',borderRadius:4,overflow:'hidden',marginBottom:10}}>
        <canvas ref={ref} width={238} height={68} style={{display:'block'}}/>
      </div>
      <div style={{display:'flex',gap:7,justifyContent:'center',marginBottom:6}}>
        <input className="centurion-input" placeholder="Type code..." value={input}
          onChange={e=>setInput(e.target.value.toUpperCase())}
          onKeyDown={e=>e.key==='Enter'&&submit()}
          style={{maxWidth:138,textAlign:'center',letterSpacing:4,fontFamily:'var(--font-mono)',fontSize:15}} autoFocus/>
        <button className="btn-gold" onClick={submit} style={{fontSize:10,padding:'8px 12px'}}>OK</button>
        <button onClick={generate} style={{background:'none',border:'1px solid var(--border)',color:'var(--text-secondary)',fontFamily:'var(--font-mono)',fontSize:13,padding:'8px 11px',borderRadius:3,cursor:'pointer'}}>↺</button>
      </div>
      {err&&<div style={{color:'var(--red)',fontFamily:'var(--font-mono)',fontSize:9}}>{err}</div>}
    </div>
  );
}

function ShapePuzzle({ onSolve }) {
  const ref = useRef(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState(0);
  const [options, setOptions] = useState([]);
  const [err, setErr] = useState('');
  const SHAPES = ['circle','triangle','square','pentagon','star','diamond'];
  const COLORS = [{n:'GOLD',v:'#c9a84c'},{n:'GREEN',v:'#00ff88'},{n:'BLUE',v:'#4488ff'},{n:'PINK',v:'#ff5588'},{n:'ORANGE',v:'#ff8800'}];

  const drawShape=(ctx,shape,x,y,size,color,filled=true)=>{
    ctx.beginPath(); ctx.fillStyle=filled?color:'transparent'; ctx.strokeStyle=color; ctx.lineWidth=2;
    switch(shape){
      case 'circle': ctx.arc(x,y,size/2,0,Math.PI*2); break;
      case 'square': ctx.rect(x-size/2,y-size/2,size,size); break;
      case 'triangle': ctx.moveTo(x,y-size/2);ctx.lineTo(x+size/2,y+size/2);ctx.lineTo(x-size/2,y+size/2);ctx.closePath(); break;
      case 'pentagon': for(let i=0;i<5;i++){const a=i*Math.PI*2/5-Math.PI/2;i?ctx.lineTo(x+Math.cos(a)*size/2,y+Math.sin(a)*size/2):ctx.moveTo(x+Math.cos(a)*size/2,y+Math.sin(a)*size/2);}ctx.closePath();break;
      case 'star': for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,r=i%2?size/4:size/2;i?ctx.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r):ctx.moveTo(x+Math.cos(a)*r,y+Math.sin(a)*r);}ctx.closePath();break;
      case 'diamond': ctx.moveTo(x,y-size/2);ctx.lineTo(x+size/3,y);ctx.lineTo(x,y+size/2);ctx.lineTo(x-size/3,y);ctx.closePath();break;
      default: break;
    }
    if(filled)ctx.fill(); ctx.stroke();
  };

  const generate=useCallback(()=>{
    setErr('');
    const tc=pick(COLORS), ts=pick(SHAPES);
    const count=rnd(1,4), total=rnd(5,9);
    setQuestion(`How many ${tc.n} ${ts.toUpperCase()}S are there?`);
    setAnswer(count);
    const opts=new Set([count]);
    while(opts.size<4)opts.add(rnd(0,6));
    setOptions([...opts].sort(()=>Math.random()-.5));
    requestAnimationFrame(()=>{
      const canvas=ref.current;if(!canvas)return;
      const ctx=canvas.getContext('2d'),W=canvas.width,H=canvas.height;
      ctx.clearRect(0,0,W,H); ctx.fillStyle='#040404'; ctx.fillRect(0,0,W,H);
      for(let i=0;i<120;i++){ctx.fillStyle=`rgba(201,168,76,${Math.random()*.05})`;ctx.beginPath();ctx.arc(rnd(0,W),rnd(0,H),1,0,Math.PI*2);ctx.fill();}
      const placed=[];
      for(let t=0;t<count;t++){
        let x,y,tries=0;
        do{x=rnd(38,W-38);y=rnd(38,H-38);tries++;}
        while(tries<50&&placed.some(p=>Math.hypot(p.x-x,p.y-y)<50));
        placed.push({x,y}); drawShape(ctx,ts,x,y,rnd(28,40),tc.v,true);
      }
      for(let d=0;d<total-count;d++){
        let x,y,tries=0;
        do{x=rnd(38,W-38);y=rnd(38,H-38);tries++;}
        while(tries<50&&placed.some(p=>Math.hypot(p.x-x,p.y-y)<46));
        placed.push({x,y});
        let s,c;do{s=pick(SHAPES);c=pick(COLORS);}while(s===ts&&c.v===tc.v);
        drawShape(ctx,s,x,y,rnd(24,38),c.v,Math.random()>.3);
      }
    });
  },[]);

  useEffect(()=>{generate();},[generate]);
  const handleSelect=(opt)=>{
    if(opt===answer){setTimeout(()=>onSolve(),350);}
    else{setErr('✗ Wrong count — try again');setTimeout(()=>generate(),700);}
  };
  return (
    <div style={{textAlign:'center'}}>
      <div style={{fontFamily:'var(--font-mono)',fontSize:9,color:'var(--text-secondary)',letterSpacing:3,marginBottom:8}}>{question}</div>
      <div style={{display:'inline-block',border:'1px solid var(--border)',borderRadius:4,overflow:'hidden',marginBottom:10}}>
        <canvas ref={ref} width={318} height={178} style={{display:'block'}}/>
      </div>
      <div style={{display:'flex',gap:8,justifyContent:'center',marginBottom:6}}>
        {options.map(opt=>(
          <button key={opt} onClick={()=>handleSelect(opt)} style={{
            width:44,height:44,borderRadius:4,border:'1px solid var(--border)',
            background:'rgba(0,0,0,0.4)',color:'var(--gold)',
            fontFamily:'var(--font-display)',fontSize:18,cursor:'pointer',transition:'all 0.15s'
          }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--gold)';e.currentTarget.style.background='rgba(201,168,76,0.1)';}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.background='rgba(0,0,0,0.4)';}}
          >{opt}</button>
        ))}
      </div>
      <button onClick={generate} style={{background:'none',border:'1px solid var(--border)',color:'var(--text-secondary)',fontFamily:'var(--font-mono)',fontSize:8,padding:'3px 10px',borderRadius:3,cursor:'pointer',letterSpacing:2}}>↺ REFRESH</button>
      {err&&<div style={{color:'var(--red)',fontFamily:'var(--font-mono)',fontSize:9,marginTop:6}}>{err}</div>}
    </div>
  );
}

// ── 2-stage captcha engine ────────────────────────────────────
const CAPTCHA_STAGES = [
  { id:'text', label:'Visual Text Recognition', C:CanvasTextCaptcha },
  { id:'shape',label:'Shape Count Challenge',   C:ShapePuzzle       },
];

function CaptchaEngine({ onAllSolved }) {
  const [idx,setIdx]=useState(0);
  const [solved,setSolved]=useState(0);
  const handleSolve=()=>{
    const n=solved+1; setSolved(n);
    if(n>=CAPTCHA_STAGES.length){ setTimeout(()=>onAllSolved(),500); }
    else setIdx(n);
  };
  const pct=Math.round((solved/CAPTCHA_STAGES.length)*100);
  const {C}=CAPTCHA_STAGES[idx];
  return (
    <div>
      <div style={{marginBottom:16}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
          <span style={{fontFamily:'var(--font-mono)',fontSize:9,color:'var(--text-secondary)',letterSpacing:2}}>SECURITY CHALLENGES</span>
          <span style={{fontFamily:'var(--font-mono)',fontSize:11,color:solved===CAPTCHA_STAGES.length?'var(--green)':'var(--gold)'}}>{solved}/{CAPTCHA_STAGES.length} completed</span>
        </div>
        <div style={{height:5,background:'rgba(255,255,255,0.04)',borderRadius:3,overflow:'hidden',border:'1px solid var(--border)'}}>
          <div style={{height:'100%',borderRadius:3,width:`${pct}%`,background:solved===CAPTCHA_STAGES.length?'linear-gradient(90deg,var(--green),#44ffaa)':'linear-gradient(90deg,var(--gold-dim),var(--gold))',transition:'width 0.5s ease'}}/>
        </div>
        <div style={{display:'flex',gap:6,marginTop:7,justifyContent:'center'}}>
          {CAPTCHA_STAGES.map((s,i)=>(
            <div key={s.id} title={s.label} style={{
              width:10,height:10,borderRadius:'50%',
              background:i<solved?'var(--green)':i===idx?'var(--gold)':'rgba(255,255,255,0.05)',
              border:`1px solid ${i<solved?'var(--green)':i===idx?'var(--gold)':'var(--border)'}`,
              transition:'all 0.3s',
            }}/>
          ))}
        </div>
      </div>
      <div style={{background:'rgba(0,0,0,0.4)',border:'1px solid var(--border)',borderRadius:7,padding:18}}>
        <div style={{fontFamily:'var(--font-mono)',fontSize:8,color:'var(--text-secondary)',letterSpacing:3,marginBottom:10,textAlign:'center'}}>
          CHALLENGE {idx+1} of {CAPTCHA_STAGES.length} — {CAPTCHA_STAGES[idx].label.toUpperCase()}
        </div>
        <C key={CAPTCHA_STAGES[idx].id+idx} onSolve={handleSolve}/>
      </div>
      {solved===CAPTCHA_STAGES.length&&(
        <div style={{textAlign:'center',marginTop:14,padding:14,border:'1px solid rgba(0,255,136,0.18)',borderRadius:7,background:'rgba(0,255,136,0.03)'}}>
          <div style={{fontSize:26,marginBottom:5}}>✓</div>
          <div style={{fontFamily:'var(--font-display)',fontSize:11,color:'var(--green)',letterSpacing:4}}>ALL CHALLENGES PASSED</div>
        </div>
      )}
    </div>
  );
}

// ── Facial mesh overlay drawn on canvas ───────────────────────
function FaceMeshOverlay({ videoRef, active, phase }) {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  const tickRef   = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !active) { cancelAnimationFrame(animRef.current); return; }
    const ctx = canvas.getContext('2d');

    const draw = () => {
      const v = videoRef.current;
      if (!v || v.readyState < 2 || !v.videoWidth) {
        animRef.current = requestAnimationFrame(draw); return;
      }
      canvas.width  = v.videoWidth;
      canvas.height = v.videoHeight;
      tickRef.current++;
      const t = tickRef.current * 0.04;
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // Estimated face region (centre of frame)
      const fx = W * 0.5, fy = H * 0.42;
      const fw = W * 0.28, fh = H * 0.38;

      const alpha = 0.55 + 0.15 * Math.sin(t);
      const col = phase === 'VERIFYING' ? `rgba(0,255,136,${alpha})`
                : phase === 'DENIED'    ? `rgba(255,51,51,${alpha})`
                : `rgba(201,168,76,${alpha})`;

      // Face oval
      ctx.strokeStyle = col; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(fx, fy, fw, fh, 0, 0, Math.PI*2); ctx.stroke();

      // Landmark dots — forehead, cheekbones, chin, nose, eyes
      const landmarks = [
        [fx,           fy-fh*0.9],  // top
        [fx,           fy+fh*0.95], // chin
        [fx-fw*0.85,   fy],         // left cheek
        [fx+fw*0.85,   fy],         // right cheek
        [fx-fw*0.42,   fy-fh*0.28], // left eye
        [fx+fw*0.42,   fy-fh*0.28], // right eye
        [fx,           fy-fh*0.05], // nose
        [fx-fw*0.22,   fy+fh*0.42], // left mouth
        [fx+fw*0.22,   fy+fh*0.42], // right mouth
        [fx-fw*0.55,   fy-fh*0.55], // left brow
        [fx+fw*0.55,   fy-fh*0.55], // right brow
      ];

      // Mesh triangles
      const tris = [
        [0,4,5],[4,6,5],[4,2,7],[5,3,8],[7,8,1],
        [0,10,9],[0,4,10],[0,5,11],[2,4,7],[3,5,8]
      ];
      ctx.strokeStyle = col.replace(/[\d.]+\)$/, '0.2)');
      ctx.lineWidth = 0.7;
      tris.forEach(([a,b,c]) => {
        if (!landmarks[a]||!landmarks[b]||!landmarks[c]) return;
        ctx.beginPath();
        ctx.moveTo(...landmarks[a]); ctx.lineTo(...landmarks[b]);
        ctx.lineTo(...landmarks[c]); ctx.closePath(); ctx.stroke();
      });

      // Landmark dots
      landmarks.forEach(([x,y]) => {
        const pulse = 0.5 + 0.5*Math.sin(t*2);
        ctx.fillStyle = col.replace(/[\d.]+\)$/, `${0.6+0.4*pulse})`);
        ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI*2); ctx.fill();
      });

      // Scan line
      const scanY = ((t * 30) % (fh * 2)) - fh + fy - fh*0.9;
      if (scanY > fy - fh && scanY < fy + fh) {
        const grad = ctx.createLinearGradient(fx-fw, scanY, fx+fw, scanY);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(0.5, col.replace(/[\d.]+\)$/, '0.3)'));
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(fx-fw, scanY, fw*2, 2);
      }

      // Corner brackets
      const bx = fx-fw-8, by = fy-fh-8, bw = fw*2+16, bh = fh*2+16;
      const bl = 18;
      ctx.strokeStyle = col; ctx.lineWidth = 2;
      [[bx,by,bl,0,bl,0],[bx+bw,by,-(bl),0,bl,0],
       [bx,by+bh,bl,0,-(bl),0],[bx+bw,by+bh,-(bl),0,-(bl),0]
      ].forEach(([x,y,dx1,dy1,dx2,dy2])=>{
        ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+dx1,y); ctx.moveTo(x,y); ctx.lineTo(x,y-dy1||y+dx2); ctx.stroke();
      });

      // Phase text at bottom
      ctx.fillStyle = col;
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(phase, fx, fy + fh + 24);

      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [active, phase, videoRef]);

  return (
    <canvas ref={canvasRef}
      style={{ position:'absolute', inset:0, width:'100%', height:'100%',
        pointerEvents:'none', opacity: active ? 1 : 0, transition:'opacity 0.3s' }}
    />
  );
}

// ── Doodle canvas ─────────────────────────────────────────────
function LoginDoodles() {
  const ref=useRef(null);
  useEffect(()=>{
    const canvas=ref.current;if(!canvas)return;
    const ctx=canvas.getContext('2d');
    let animId,t=0,nodes=[],hexs=[];
    const resize=()=>{
      canvas.width=window.innerWidth;canvas.height=window.innerHeight;
      nodes=Array.from({length:48},()=>({x:Math.random()*canvas.width,y:Math.random()*canvas.height,vx:(Math.random()-.5)*.14,vy:(Math.random()-.5)*.14,r:Math.random()*1.3+.4,pulse:Math.random()*Math.PI*2}));
      hexs=Array.from({length:6},()=>({x:Math.random()*canvas.width,y:Math.random()*canvas.height,size:Math.random()*24+7,rot:Math.random()*Math.PI,rs:(Math.random()-.5)*.002,a:Math.random()*.055+.012}));
    };
    resize();window.addEventListener('resize',resize);
    const dH=(x,y,s,r)=>{ctx.beginPath();for(let i=0;i<6;i++){const a=r+i*Math.PI/3;i?ctx.lineTo(x+s*Math.cos(a),y+s*Math.sin(a)):ctx.moveTo(x+s*Math.cos(a),y+s*Math.sin(a));}ctx.closePath();};
    const draw=()=>{
      ctx.clearRect(0,0,canvas.width,canvas.height);t+=.003;
      nodes.forEach(n=>{n.x+=n.vx;n.y+=n.vy;n.pulse+=.009;if(n.x<0||n.x>canvas.width)n.vx*=-1;if(n.y<0||n.y>canvas.height)n.vy*=-1;});
      for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){const dx=nodes[i].x-nodes[j].x,dy=nodes[i].y-nodes[j].y,d=Math.sqrt(dx*dx+dy*dy);if(d<105){ctx.globalAlpha=(1-d/105)*.09;ctx.strokeStyle='#c9a84c';ctx.lineWidth=.3;ctx.beginPath();ctx.moveTo(nodes[i].x,nodes[i].y);ctx.lineTo(nodes[j].x,nodes[j].y);ctx.stroke();}}
      nodes.forEach(n=>{const p=.5+.5*Math.sin(n.pulse);ctx.globalAlpha=.05+.07*p;ctx.fillStyle='#c9a84c';ctx.beginPath();ctx.arc(n.x,n.y,n.r*(.8+.3*p),0,Math.PI*2);ctx.fill();});
      hexs.forEach(h=>{h.rot+=h.rs;ctx.globalAlpha=h.a;ctx.strokeStyle='#c9a84c';ctx.lineWidth=.4;dH(h.x,h.y,h.size,h.rot);ctx.stroke();});
      ctx.globalAlpha=1;animId=requestAnimationFrame(draw);
    };
    draw();
    return()=>{window.removeEventListener('resize',resize);cancelAnimationFrame(animId);};
  },[]);
  return <canvas ref={ref} style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',pointerEvents:'none',zIndex:0,opacity:.1}}/>;
}

// ── Terms text ────────────────────────────────────────────────
const TERMS_TEXT=`CENTURION® CLIENT — END USERS LICENSE AGREEMENT [EULA]

🛈 TIP: Agreement will be acceptable after 15 seconds of reading

1. BIOMETRIC DATA CONSENT
By proceeding, you consent to the collection, processing and storage of your
facial biometric data for the sole purpose of access authentication.

2. PASSWORD SECURITY
You agree to set a strong password meeting all security requirements.
Passwords are stored encrypted and are your responsibility to keep private.

3. DATA USAGE
Facial embeddings and credentials are stored encrypted and never shared
with third parties.

4. COOKIE USAGE
This system uses essential session cookies for authentication tokens and
functional cookies for preferences. No advertising cookies are used.

5. SECURITY MONITORING
All access attempts are logged with timestamp, IP address and AI-estimated
demographic data for security audit purposes.

6. REGISTRATION APPROVAL
New registrations require manual approval by a system administrator.
Your request will be reviewed and you will be notified by email.

7. UNAUTHORIZED ACCESS
Unauthorized attempts trigger automated alerts, capture snapshots, and
may be reported to authorities.

8. DATA RETENTION
Biometric data is retained for the duration of your authorized access period.

9. ACCEPTANCE
By clicking Accept you confirm you have read and agreed to these terms.`;

// ── OTP digit boxes — defined OUTSIDE LoginPage so React never
//    unmounts/remounts it on parent re-renders (e.g. timer ticks)
function OTPBoxes({ otp, setOtp, otpVerified, otpExpired, otpTimeLeft, onVerify, handleVerifyOTP }) {
  return (
    <div style={{marginBottom:12,animation:'fadeInUp 0.35s ease'}}>
      <label style={{fontFamily:'var(--font-mono)',fontSize:9,color:'var(--text-secondary)',letterSpacing:2,display:'flex',justifyContent:'space-between',marginBottom:7}}>
        <span>6-DIGIT CODE</span>
        <span style={{color:otpExpired||otpTimeLeft<60?'var(--red)':'var(--gold)'}}>
          {otpExpired?'EXPIRED':`${Math.floor(otpTimeLeft/60)}:${String(otpTimeLeft%60).padStart(2,'0')}`}
        </span>
      </label>
      <div style={{display:'flex',gap:6,marginBottom:10}}>
        {Array(6).fill(0).map((_,i)=>(
          <input key={i} maxLength={1} value={otp[i]||''} disabled={otpVerified||otpExpired}
            style={{width:40,height:48,textAlign:'center',background:'rgba(0,0,0,0.4)',
              border:`1px solid ${otp.length>i?(otpVerified?'var(--green)':'var(--gold)'):'var(--border)'}`,
              color:otpVerified?'var(--green)':'var(--gold)',fontFamily:'var(--font-mono)',
              fontSize:20,borderRadius:4,outline:'none',transition:'border-color 0.2s',
              opacity:otpExpired?.4:1}}
            onChange={e=>{
              const v=e.target.value.replace(/\D/,'');
              const arr=otp.split('');arr[i]=v;setOtp(arr.join('').slice(0,6));
              if(v&&i<5){const n=e.target.parentElement.children[i+1];if(n)n.focus();}
            }}
            onKeyDown={e=>{
              if(e.key==='Backspace'&&!otp[i]&&i>0){const p=e.target.parentElement.children[i-1];if(p)p.focus();}
              if(e.key==='Enter'&&otp.length===6)handleVerifyOTP(onVerify);
            }}
          />
        ))}
      </div>
      {!otpVerified
        ?<button className="btn-ghost" onClick={()=>handleVerifyOTP(onVerify)}
          disabled={otp.length<6||otpExpired}
          style={{width:'100%',fontSize:11,opacity:otp.length<6||otpExpired?.4:1}}>
          Verify Code →
        </button>
        :<div style={{fontFamily:'var(--font-mono)',fontSize:11,color:'var(--green)',textAlign:'center',
          padding:8,border:'1px solid rgba(0,255,136,0.18)',borderRadius:4,background:'rgba(0,255,136,0.03)'}}>
          ✓ VERIFIED
        </div>
      }
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ════════════════════════════════════════════════════════════════
export default function LoginPage({ onLogin }) {
  const cam = useCameraContext();

  // ── URL token check ───────────────────────────────────────
  useEffect(()=>{
    const p=new URLSearchParams(window.location.search);
    const approve=p.get('approve'), email=p.get('email');
    const reject=p.get('reject');
    if(approve&&email){
      approvePendingRegistration(decodeURIComponent(email));
      window.history.replaceState({},'',window.location.pathname);
      setStatus(`✓ ${decodeURIComponent(email)} approved by admin`);
      setStatusType('success');
    }
    if(reject&&email){
      rejectPendingRegistration(decodeURIComponent(email));
      window.history.replaceState({},'',window.location.pathname);
    }
  // eslint-disable-next-line
  },[]);

  const videoRef    = useRef(null);
  const streamRef   = useRef(null);
  const otpTimerRef = useRef(null);
  const pollRef     = useRef(null);

  const [cookiesAccepted, setCookiesAccepted] = useState(getCookieConsent());
  const [cameraOn,      setCameraOn]      = useState(false);
  const [cameraError,   setCameraError]   = useState('');
  const [videoReady,    setVideoReady]    = useState(false);
  const [scanActive,    setScanActive]    = useState(false);
  const [scanProgress,  setScanProgress]  = useState(0);
  const [scanPhase,     setScanPhase]     = useState('SCANNING');
  const [meshActive,    setMeshActive]    = useState(false);

  // flow: 'home' | 'terms' | 'register-form' | 'otp' | 'email-confirm' | 'awaiting-approval' | 'captcha'
  const [step,          setStep]          = useState('home');
  const [termsCountdown,setTermsCountdown]= useState(10);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // registration fields
  const [username,  setUsername]  = useState('');
  const [password,  setPassword]  = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw,    setShowPw]    = useState(false);
  const [showCPw,   setShowCPw]   = useState(false);
  const [pwFocused, setPwFocused] = useState(false);
  const [generatedPw, setGeneratedPw] = useState('');

  const [pendingUser,   setPendingUser]   = useState(null);
  const [failedAttempts,setFailedAttempts]= useState(0);

  // otp
  const [email,        setEmail]        = useState('');
  const [otp,          setOtp]          = useState('');
  const [generatedOTP, setGeneratedOTP] = useState('');
  const [otpSent,      setOtpSent]      = useState(false);
  const [otpVerified,  setOtpVerified]  = useState(false);
  const [otpTimeLeft,  setOtpTimeLeft]  = useState(OTP_EXPIRY_SECS);
  const [otpExpired,   setOtpExpired]   = useState(false);
  const [otpAttempts,  setOtpAttempts]  = useState(0);

  // approval
  const [approvalPolling,setApprovalPolling]=useState(false);
  const [approvalChecks, setApprovalChecks] =useState(0);

  // ui
  const [status,     setStatus]     = useState('');
  const [statusType, setStatusType] = useState('info');
  const [loading,    setLoading]    = useState(false);

  const sc = statusType==='success'?'var(--green)':statusType==='error'?'var(--red)':'var(--gold)';

  // ── Camera ────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    if(streamRef.current) return;
    try {
      const s=await navigator.mediaDevices.getUserMedia({video:{width:{ideal:640},height:{ideal:480},facingMode:'user'},audio:false});
      streamRef.current=s;
      if(videoRef.current){videoRef.current.srcObject=s; await videoRef.current.play();}
      setCameraOn(true); setCameraError('');
    } catch(e){ setCameraError('Camera error: '+e.message); }
  },[]);

  useEffect(()=>()=>{
    if(streamRef.current) streamRef.current.getTracks().forEach(t=>t.stop());
    clearInterval(otpTimerRef.current); clearInterval(pollRef.current);
  },[]);

  const waitForVideo = () => new Promise(r=>{
    const v=videoRef.current; if(!v) return r(false);
    if(v.readyState>=2&&v.videoWidth>0) return r(true);
    v.addEventListener('canplay',()=>r(v.videoWidth>0),{once:true});
    setTimeout(()=>r(false),6000);
  });

  const captureFrame = async () => {
    const v=videoRef.current; if(!v||!await waitForVideo()) return null;
    const c=document.createElement('canvas');
    c.width=v.videoWidth||640; c.height=v.videoHeight||480;
    const ctx=c.getContext('2d'); ctx.drawImage(v,0,0,c.width,c.height);
    const d=ctx.getImageData(0,0,10,10).data; if(d.every(v=>v===0)) return null;
    return c.toDataURL('image/jpeg',0.92);
  };

  const runScan = (ms=2500) => {
    const ph=['INIT','DETECTING','EXTRACTING','COMPARING','VERIFYING'];
    let i=0,pi=0; setScanActive(true); setScanProgress(0); setScanPhase(ph[0]);
    const iv=setInterval(()=>{
      i++; const p=Math.round((i/50)*100); setScanProgress(p);
      const np=Math.floor(p/20);
      if(np!==pi&&np<ph.length){pi=np; setScanPhase(ph[pi]);}
      if(i>=50){clearInterval(iv); setScanActive(false);}
    },ms/50);
  };

  // ── Terms countdown ───────────────────────────────────────
  useEffect(()=>{
    if(step==='terms'&&termsCountdown>0){
      const t=setTimeout(()=>setTermsCountdown(c=>c-1),1000);
      return()=>clearTimeout(t);
    }
  },[step,termsCountdown]);

  // ── OTP timer ─────────────────────────────────────────────
  const startOTPTimer = () => {
    setOtpTimeLeft(OTP_EXPIRY_SECS); setOtpExpired(false); clearInterval(otpTimerRef.current);
    otpTimerRef.current=setInterval(()=>setOtpTimeLeft(t=>{
      if(t<=1){clearInterval(otpTimerRef.current);setOtpExpired(true);setStatus('OTP expired — request new');setStatusType('error');return 0;}
      return t-1;
    }),1000);
  };

  // ── Approval polling ──────────────────────────────────────
  const startApprovalPolling = (emailAddr) => {
    setApprovalPolling(true); setApprovalChecks(0);
    pollRef.current=setInterval(()=>{
      setApprovalChecks(c=>c+1);
      if(isRegistrationApproved(emailAddr)){
        clearInterval(pollRef.current); setApprovalPolling(false);
        setStatus('✓ Approved — completing security challenges'); setStatusType('success');
        setTimeout(()=>setStep('captcha'),800);
      }
    },3000);
  };

  // ── Send OTP ──────────────────────────────────────────────
  const handleSendOTP = async (targetEmail) => {
    const addr = targetEmail || email;
    if(!addr.trim()||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr)){setStatus('Enter a valid email');setStatusType('error');return false;}
    setLoading(true); setStatus(`Sending OTP to ${addr}...`); setStatusType('info');
    const code=genOTP();
    try{
      await sendOTPEmail(addr.trim(),code);
      setGeneratedOTP(code); setOtp(''); setOtpSent(true); setOtpVerified(false);
      startOTPTimer(); setOtpAttempts(0);
      setStatus(`✓ OTP sent to ${addr}`); setStatusType('success');
      setLoading(false); return true;
    }catch(e){
      setStatus('Failed to send OTP: '+(e.text||e.message));setStatusType('error');
      setLoading(false); return false;
    }
  };

  // ── Verify OTP ────────────────────────────────────────────
  const handleVerifyOTP = (onSuccess) => {
    if(otpExpired){setStatus('OTP expired');setStatusType('error');return;}
    if(otp.length<6){setStatus('Enter 6-digit code');setStatusType('error');return;}
    const att=otpAttempts+1; setOtpAttempts(att);
    if(otp===generatedOTP){
      clearInterval(otpTimerRef.current); setOtpVerified(true);
      setStatus('✓ Email verified'); setStatusType('success');
      if(onSuccess) setTimeout(onSuccess,600);
    }else{
      if(att>=3){setOtpSent(false);setOtp('');setGeneratedOTP('');clearInterval(otpTimerRef.current);setStatus('Too many wrong attempts');setStatusType('error');}
      else{setStatus(`✗ Wrong code — ${3-att} attempt${3-att===1?'':'s'} left`);setStatusType('error');}
    }
  };

  // ── Register face ─────────────────────────────────────────
  const handleRegister = async () => {
    if(!username.trim()){setStatus('Enter a username');setStatusType('error');return;}
    if(!isPasswordValid(password,username)){setStatus('Password does not meet all requirements');setStatusType('error');return;}
    if(password!==confirmPw){setStatus('Passwords do not match');setStatusType('error');return;}
    if(!cameraOn){setStatus('Enable camera first');setStatusType('error');await startCamera();return;}
    setLoading(true); setStatus('Capturing face — look at camera...'); setStatusType('info');
    await new Promise(r=>setTimeout(r,1000));
    setMeshActive(true); runScan(2800);
    const frame=await captureFrame();
    if(!frame){setStatus('Could not capture frame');setStatusType('error');setLoading(false);setMeshActive(false);return;}
    try{
      const res=await enrollFace(username.trim(),frame);
      if(res.success||res.userId){
        // Save user with hashed password indicator
        saveRegisteredUser(username.trim(),{
          userId:username.trim(), email:'', passwordHash:btoa(password),
          method:'face+otp+approval+captcha', awaitingApproval:true
        });
        setStatus('✓ Face enrolled — now confirm your email');setStatusType('success');
        setPendingUser({userId:username,role:'user',method:'face+otp+approval+captcha',awaitingApproval:true});
        setLoading(false); setMeshActive(false); setStep('otp');
      }else{setStatus(`✗ ${res.error||'Enrollment failed — ensure face clearly visible'}`);setStatusType('error');setLoading(false);setMeshActive(false);}
    }catch(e){setStatus('Error: '+e.message);setStatusType('error');setLoading(false);setMeshActive(false);}
  };

  // ── Face login — strict matching ──────────────────────────
  const handleFaceLogin = async () => {
    if(!cameraOn){setStatus('Enable camera first');setStatusType('error');await startCamera();return;}
    setLoading(true); setStatus('Scanning biometrics...'); setStatusType('info');
    await new Promise(r=>setTimeout(r,800));
    setMeshActive(true); runScan(2200);
    const frame=await captureFrame();
    if(!frame){setStatus('Could not capture frame');setStatusType('error');setLoading(false);setMeshActive(false);return;}
    try{
      const res=await identifyFace(frame);
      if(res.authorized && res.userId && res.userId!=='UNKNOWN' && res.confidence>0.75){
        // Strict: confidence must be > 75% and user must be in our registry
        const registeredUser = lookupUser(res.userId);
        if(!registeredUser){
          // Face detected but not in our user registry
          const cnt=failedAttempts+1; setFailedAttempts(cnt);
          setStatus(`✗ Face recognized but user "${res.userId}" is not registered in this system`);
          setStatusType('error');
          if(cam?.captureUnauthorized) cam.captureUnauthorized({userId:res.userId,confidence:res.confidence,attemptCount:cnt});
          sendAlertEmail({userId:res.userId,attemptCount:cnt,livenessPass:res.liveness?.isLive,confidence:res.confidence});
          setLoading(false); setMeshActive(false); return;
        }
        setStatus(`✓ Identity confirmed — ${res.userId} (${(res.confidence*100).toFixed(1)}%) — confirm email`);
        setStatusType('success');
        setPendingUser({...registeredUser, userId:res.userId, confidence:res.confidence, demographics:res.demographics, method:'face+email'});
        // Registered user: face + email confirm only → dashboard
        setLoading(false); setMeshActive(false); setStep('email-confirm');
      }else if(res.authorized && res.confidence<=0.75){
        // Ambiguous match — too low confidence
        const cnt=failedAttempts+1; setFailedAttempts(cnt);
        setStatus(`✗ Match too ambiguous (confidence: ${(res.confidence*100).toFixed(1)}%) — please retry in better lighting`);
        setStatusType('error');
        setLoading(false); setMeshActive(false);
      }else{
        // Completely unrecognized
        const cnt=failedAttempts+1; setFailedAttempts(cnt);
        setStatus(`✗ Face not recognized — this is attempt ${cnt}. If unregistered, please register first.`);
        setStatusType('error');
        if(cam?.captureUnauthorized) cam.captureUnauthorized({userId:'UNKNOWN',confidence:res.confidence||0,attemptCount:cnt,...res.demographics});
        sendAlertEmail({userId:'UNKNOWN',attemptCount:cnt,...res.demographics,livenessPass:res.liveness?.isLive,snapshotPath:res.snapshotPath,confidence:res.confidence||0});
        setLoading(false); setMeshActive(false);
      }
    }catch(e){setStatus('Error: '+e.message);setStatusType('error');setLoading(false);setMeshActive(false);}
  };

  // ── Email confirm (for returning registered users) ────────
  const handleEmailConfirm = async () => {
    const sent = await handleSendOTP(email);
    if(sent) setOtpSent(true);
  };

  // ── Request admin approval ────────────────────────────────
  const handleRequestApproval = async () => {
    const token=Math.random().toString(36).slice(2)+Date.now().toString(36);
    savePendingRegistration({email:email.trim(),username:username.trim(),token,requestedAt:new Date().toISOString(),approved:false});
    // Update user record with email
    saveRegisteredUser(username.trim(),{...(lookupUser(username)||{}),email:email.trim()});
    setStatus('Sending approval request to admin...'); setStatusType('info');
    try{await sendAdminApprovalEmail(email.trim(),username.trim(),token);}catch(e){console.warn('Email:',e);}
    setStatus('⏳ Registration submitted — pending admin approval'); setStatusType('info');
    setStep('awaiting-approval');
    startApprovalPolling(email.trim());
  };

  const handleAllCaptchasSolved = () => {
    setStatus('✓ All verifications complete — entering dashboard...'); setStatusType('success');
    setTimeout(()=>onLogin(pendingUser),900);
  };

  const acceptCookies = () => { setCookieConsent(); setCookiesAccepted(true); };

  // OTPBoxes is defined outside the component — see below LoginPage

  // ── Step pills UI ─────────────────────────────────────────
  const StepPills = ({ steps, current }) => (
    <div style={{display:'flex',justifyContent:'center',gap:7,marginTop:10}}>
      {steps.map((s,i)=>(
        <div key={s} style={{display:'flex',alignItems:'center',gap:3}}>
          <div style={{width:20,height:20,borderRadius:'50%',
            border:`1px solid ${i<current?'var(--green)':i===current?'var(--gold)':'var(--border)'}`,
            background:i<current?'rgba(0,255,136,0.07)':i===current?'rgba(201,168,76,0.07)':'transparent',
            display:'flex',alignItems:'center',justifyContent:'center',
            fontFamily:'var(--font-mono)',fontSize:8,
            color:i<current?'var(--green)':i===current?'var(--gold)':'var(--text-secondary)',
          }}>{i<current?'✓':i+1}</div>
          <span style={{fontFamily:'var(--font-mono)',fontSize:8,letterSpacing:1,color:i===current?'var(--gold)':'var(--text-secondary)'}}>{s}</span>
          {i<steps.length-1&&<span style={{color:'var(--border)',fontSize:9}}>›</span>}
        </div>
      ))}
    </div>
  );

  // ════════════════════════════════════════════════════════
  //  STEP: TERMS
  // ════════════════════════════════════════════════════════
  if(step==='terms') return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'40px 20px',position:'relative'}}>
      <DigitalClock/> <LoginDoodles/>
      <div className="glass-card" style={{maxWidth:640,width:'100%',padding:32,position:'relative',zIndex:2}}>
        <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:20}}>
          <div style={{width:50,height:50,borderRadius:'0%',border:'0px solid rgba(0, 0, 0, 0.4)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                      <img
  src="https://raw.githubusercontent.com/aura7822/centurion/main/frontend/public/assets/images/cs.png"      // Replace with actual image URL
  alt="Custom Logo"
  style={{
    width: '120%',
    height: '120%',
    objectFit: 'contain',           // or 'cover' depending on your image
    borderRadius: '0%',            // if you want the image rounded
  }}
/>
          </div>
          <div>
            <div style={{fontFamily:'var(--font-display)',fontSize:15,letterSpacing:5,color:'var(--gold)'}}>CENTURION</div>
            <div style={{fontFamily:'var(--font-mono)',fontSize:9,color:'var(--text-secondary)',letterSpacing:2}}>End User's License Agreement[EULA] :r</div>
          </div>
        </div>
        <div className="section-heading">Terms &amp; Conditions</div>
        <div style={{height:320,overflowY:'auto',fontFamily:'var(--font-mono)',fontSize:10,lineHeight:1.9,color:'var(--text-secondary)',padding:'12px 16px',background:'rgba(0,0,0,0.38)',borderRadius:4,border:'1px solid var(--border)',whiteSpace:'pre-wrap',marginBottom:16}}>{TERMS_TEXT}</div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}>
          <span style={{fontFamily:'var(--font-mono)',fontSize:11,color:termsCountdown>0?'var(--gold)':'var(--green)'}}>
            {termsCountdown>0?`⏱ ${termsCountdown}s remaining before you may accept`:'✓ You may now accept'}
          </span>
          <div style={{display:'flex',gap:10}}>
            <button className="btn-ghost" onClick={()=>setStep('home')}>← Back</button>
            <button className="btn-gold" disabled={termsCountdown>0}
              style={{opacity:termsCountdown>0?.4:1,cursor:termsCountdown>0?'not-allowed':'pointer'}}
              onClick={()=>{setTermsAccepted(true);setStep('register-form');}}>
              Accept &amp; Continue →
            </button>
          </div>
        </div>
      </div>
      {!cookiesAccepted&&<CookieBanner onAccept={acceptCookies} onDecline={()=>{}}/>}
    </div>
  );

  // ════════════════════════════════════════════════════════
  //  STEP: OTP (registration email verify)
  // ════════════════════════════════════════════════════════
  if(step==='otp') return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'40px 20px',position:'relative'}}>
      <DigitalClock/> <LoginDoodles/>
      <div className="glass-card" style={{maxWidth:460,width:'100%',padding:32,position:'relative',zIndex:2}}>
        <div style={{textAlign:'center',marginBottom:18}}>
          <div style={{fontSize:32,marginBottom:8}}>✉</div>
          <div style={{fontFamily:'var(--font-display)',fontSize:15,letterSpacing:5,color:'var(--gold)'}}>EMAIL VERIFICATION</div>
          <div style={{fontFamily:'var(--font-mono)',fontSize:9,color:'var(--text-secondary)',letterSpacing:2,marginTop:3}}>STEP 2 OF 4</div>
          <StepPills steps={['Face','Email','Approval','Captcha']} current={1}/>
        </div>
        <div className="section-heading">Confirm Your Email</div>
        <div style={{marginBottom:12}}>
          <label style={{fontFamily:'var(--font-mono)',fontSize:9,color:'var(--text-secondary)',letterSpacing:2,display:'block',marginBottom:5}}>YOUR EMAIL ADDRESS</label>
          <div style={{display:'flex',gap:7}}>
            <input className="centurion-input" placeholder="your@email.com" type="email"
              value={email} onChange={e=>setEmail(e.target.value)} disabled={otpSent}
              style={{flex:1,opacity:otpSent?.6:1}} onKeyDown={e=>e.key==='Enter'&&!otpSent&&handleSendOTP()}/>
            <button className="btn-gold"
              onClick={otpSent?()=>{setOtpSent(false);setOtp('');setGeneratedOTP('');clearInterval(otpTimerRef.current);}:()=>handleSendOTP()}
              disabled={loading} style={{fontSize:9,padding:'8px 10px',whiteSpace:'nowrap'}}>
              {loading?'...':otpSent?'↺':'Send OTP'}
            </button>
          </div>
        </div>
        {otpSent&&<OTPBoxes otp={otp} setOtp={setOtp} otpVerified={otpVerified} otpExpired={otpExpired} otpTimeLeft={otpTimeLeft} onVerify={()=>handleRequestApproval()} handleVerifyOTP={handleVerifyOTP}/>}
        {status&&<div style={{padding:'9px 13px',borderRadius:4,fontFamily:'var(--font-mono)',fontSize:10,border:`1px solid ${sc}`,color:sc,background:`${sc}08`,marginTop:9}}>{status}</div>}
        <button className="btn-ghost" onClick={()=>setStep('home')} style={{width:'100%',marginTop:11,fontSize:9,letterSpacing:2}}>← Back to Login</button>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════
  //  STEP: EMAIL CONFIRM (returning registered user)
  // ════════════════════════════════════════════════════════
  if(step==='email-confirm') return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'40px 20px',position:'relative'}}>
      <DigitalClock/> <LoginDoodles/>
      <div className="glass-card" style={{maxWidth:460,width:'100%',padding:32,position:'relative',zIndex:2}}>
        <div style={{textAlign:'center',marginBottom:18}}>
          <div style={{fontSize:32,marginBottom:8}}>⚿</div>
          <div style={{fontFamily:'var(--font-display)',fontSize:15,letterSpacing:5,color:'var(--gold)'}}>IDENTITY POSITIVE</div>
          <div style={{fontFamily:'var(--font-mono)',fontSize:11,color:'var(--text-secondary)',letterSpacing:2,marginTop:3}}>STEP 2 OF 2 — EMAIL CONFIRMATION</div>
          <StepPills steps={['Face Scan','Email OTP']} current={1}/>
        </div>
        <div style={{padding:'12px 16px',background:'rgba(0,255,136,0.05)',border:'1px solid rgba(0,255,136,0.2)',borderRadius:6,marginBottom:16,textAlign:'center'}}>
          <div style={{fontFamily:'var(--font-mono)',fontSize:12,color:'var(--green)',marginBottom:4}}>✓ Welcome back, {pendingUser?.userId}</div>
          <div style={{fontFamily:'var(--font-mono)',fontSize:11,color:'var(--text-secondary)'}}>Confirm your email to enter the dashboard</div>
        </div>
        <div className="section-heading">Email Confirmation</div>
        <div style={{marginBottom:12}}>
          <label style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--text-secondary)',letterSpacing:2,display:'block',marginBottom:5}}>YOUR EMAIL ADDRESS</label>
          <div style={{display:'flex',gap:7}}>
            <input className="centurion-input" placeholder="your@email.com" type="email"
              value={email} onChange={e=>setEmail(e.target.value)} disabled={otpSent}
              style={{flex:1,opacity:otpSent?.6:1}} onKeyDown={e=>e.key==='Enter'&&!otpSent&&handleEmailConfirm()}/>
            <button className="btn-gold"
              onClick={otpSent?()=>{setOtpSent(false);setOtp('');setGeneratedOTP('');clearInterval(otpTimerRef.current);}:handleEmailConfirm}
              disabled={loading} style={{fontSize:10,padding:'8px 10px',whiteSpace:'nowrap'}}>
              {loading?'...':otpSent?'↺':'Send OTP'}
            </button>
          </div>
        </div>
        {otpSent&&<OTPBoxes otp={otp} setOtp={setOtp} otpVerified={otpVerified} otpExpired={otpExpired} otpTimeLeft={otpTimeLeft} handleVerifyOTP={handleVerifyOTP} onVerify={()=>{
          setStatus('✓ All verified — entering dashboard...'); setStatusType('success');
          setTimeout(()=>onLogin(pendingUser),900);
        }}/>}
        {status&&<div style={{padding:'9px 13px',borderRadius:4,fontFamily:'var(--font-mono)',fontSize:10,border:`1px solid ${sc}`,color:sc,background:`${sc}08`,marginTop:9}}>{status}</div>}
        <button className="btn-ghost" onClick={()=>setStep('home')} style={{width:'100%',marginTop:11,fontSize:9,letterSpacing:2}}>← Back</button>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════
  //  STEP: AWAITING APPROVAL
  // ════════════════════════════════════════════════════════
  if(step==='awaiting-approval') return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'40px 20px',position:'relative'}}>
      <DigitalClock/> <LoginDoodles/>
      <div className="glass-card" style={{maxWidth:500,width:'100%',padding:36,position:'relative',zIndex:2,textAlign:'center'}}>
        <div style={{fontSize:40,marginBottom:14,animation:'rotate-slow 5s linear infinite',display:'inline-block'}}>⏳</div>
        <div style={{fontFamily:'var(--font-display)',fontSize:16,letterSpacing:5,color:'var(--gold)',marginBottom:7}}>PENDING APPROVAL</div>
        <div style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--text-secondary)',lineHeight:1.9,marginBottom:20}}>
          Your registration is <span style={{color:'#ff8800',fontWeight:'bold'}}>PENDING</span>.<br/>
          An approval email has been sent to the administrator.<br/>
          You cannot access the dashboard until your account is approved.<br/>
          The admin just needs to click one link in the email.
        </div>
        {/* Checklist */}
        <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:20,textAlign:'left'}}>
          {[
            {l:'Face Enrolled',    done:true},
            {l:'Email Verified',   done:true},
            {l:'Admin Notified',   done:true},
            {l:'Admin Approval',   done:isRegistrationApproved(email), pending:approvalPolling&&!isRegistrationApproved(email)},
            {l:'Security Captcha', done:false},
            {l:'Access Granted',   done:false},
          ].map((item,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'7px 14px',
              background:'rgba(0,0,0,0.22)',borderRadius:4,
              border:`1px solid ${item.done?'rgba(0,255,136,0.18)':item.pending?'rgba(201,168,76,0.18)':'var(--border)'}`,
            }}>
              <div style={{width:20,height:20,borderRadius:'50%',flexShrink:0,
                background:item.done?'rgba(0,255,136,0.12)':item.pending?'rgba(201,168,76,0.08)':'rgba(0,0,0,0.2)',
                border:`1px solid ${item.done?'var(--green)':item.pending?'var(--gold)':'var(--border)'}`,
                display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,
                color:item.done?'var(--green)':item.pending?'var(--gold)':'var(--text-secondary)',
              }}>{item.done?'✓':item.pending?'●':'○'}</div>
              <span style={{fontFamily:'var(--font-mono)',fontSize:10,flex:1,letterSpacing:1,
                color:item.done?'var(--green)':item.pending?'var(--gold)':'var(--text-secondary)'}}>{item.l}</span>
              {item.pending&&<span style={{fontFamily:'var(--font-mono)',fontSize:8,color:'var(--text-secondary)'}}>checking...</span>}
              {!item.done&&!item.pending&&i>3&&<span style={{fontFamily:'var(--font-mono)',fontSize:8,color:'#444',letterSpacing:1}}>LOCKED</span>}
            </div>
          ))}
        </div>
        {/* Admin panel */}
        <div style={{padding:14,background:'rgba(201,168,76,0.03)',border:'1px solid rgba(201,168,76,0.12)',borderRadius:6,marginBottom:12}}>
          <div style={{fontFamily:'var(--font-mono)',fontSize:8,color:'var(--text-secondary)',letterSpacing:2,marginBottom:8}}>ADMIN PANEL</div>
          <div style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--gold)',marginBottom:10}}>{username} · {email}</div>
          <div style={{display:'flex',gap:10,justifyContent:'center'}}>
            <button className="btn-gold" onClick={()=>{
              approvePendingRegistration(email);
              clearInterval(pollRef.current); setApprovalPolling(false);
              setStatus('✓ Approved — completing security challenges'); setStatusType('success');
              setTimeout(()=>setStep('captcha'),800);
            }} style={{fontSize:10,padding:'7px 18px'}}>✓ APPROVE ACCESS</button>
            <button onClick={()=>{
              rejectPendingRegistration(email);
              clearInterval(pollRef.current); setStep('home');
            }} style={{background:'rgba(255,51,51,0.08)',border:'1px solid rgba(255,51,51,0.25)',color:'var(--red)',fontFamily:'var(--font-mono)',fontSize:10,padding:'7px 16px',borderRadius:3,cursor:'pointer'}}>✗ REJECT</button>
          </div>
        </div>
        <div style={{fontFamily:'var(--font-mono)',fontSize:8,color:'#444',letterSpacing:1}}>Auto-checks every 3s · {approvalChecks} checks · Or admin clicks email link</div>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════
  //  STEP: CAPTCHA
  // ════════════════════════════════════════════════════════
  if(step==='captcha') return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'40px 20px',position:'relative'}}>
      <DigitalClock/> <LoginDoodles/>
      <div className="glass-card" style={{maxWidth:490,width:'100%',padding:32,position:'relative',zIndex:2}}>
        <div style={{textAlign:'center',marginBottom:16}}>
          <div style={{fontFamily:'var(--font-display)',fontSize:14,letterSpacing:5,color:'var(--gold)',marginBottom:3}}>SECURITY VERIFICATION</div>
          <div style={{fontFamily:'var(--font-mono)',fontSize:9,color:'var(--text-secondary)',letterSpacing:2}}>STEP 4 OF 4 — PROVE YOU ARE HUMAN</div>
          <StepPills steps={['Face','Email','Approval','Captcha']} current={3}/>
        </div>
        <CaptchaEngine onAllSolved={handleAllCaptchasSolved}/>
        {status&&<div style={{padding:'9px 13px',borderRadius:4,fontFamily:'var(--font-mono)',fontSize:10,border:`1px solid ${sc}`,color:sc,background:`${sc}08`,marginTop:11}}>{status}</div>}
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════
  //  MAIN HOME PAGE
  // ════════════════════════════════════════════════════════
  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',position:'relative'}}>
      <DigitalClock/>
      <LoginDoodles/>

      {/* Header */}
      <div style={{textAlign:'center',padding:'52px 20px 20px',position:'relative',zIndex:2}}>
        <div style={{display:'inline-flex',alignItems:'center',justifyContent:'center',
          width:88,height:88,borderRadius:'0%',
          border:'0px solid rgba(0, 0, 0, 1)',marginBottom:14,
          background:'rgba(0, 0, 0, 1)',
        }}>
          <img
  src="https://raw.githubusercontent.com/aura7822/centurion/main/frontend/public/assets/images/c.png"      // Replace with actual image URL
  alt="Custom Logo"
  style={{
    width: '120%',
    height: '120%',
    objectFit: 'contain',           // or 'cover' depending on your image
    borderRadius: '0%',            // if you want the image rounded
  }}
/>
        </div>
        <h1 style={{fontFamily:'var(--font-display)',fontSize:30,letterSpacing:9,color:'var(--gold)',textTransform:'uppercase',marginBottom:5}}>CENTURION®</h1>
        <p style={{fontFamily:'MonoStruct',fontSize:11,color:'var(--gold)',letterSpacing:4}}>
          THE HIGHLY INTELLIGENT ACCESS CONTROL CLIENT
        </p>
        <div style={{marginTop:10,display:'flex',justifyContent:'center',gap:12,flexWrap:'wrap'}}>
          {['FACE + PASSWORD','EMAIL CONFIRM','ADMIN APPROVAL','2 CAPTCHAS'].map(tag=>(
            <span key={tag} style={{fontFamily:'var(--font-mono)',fontSize:8,letterSpacing:2,
              color:'rgba(151, 2, 2, 0.4)',border:'1px solid rgba(201,168,76,0.12)',
              padding:'2px 8px',borderRadius:2}}>{tag}</span>
          ))}
        </div>
      </div>

      {/* Main grid */}
      <div style={{flex:1,display:'flex',alignItems:'flex-start',justifyContent:'center',padding:'0 20px 36px',position:'relative',zIndex:2}}>
        <div style={{width:'100%',maxWidth:960,display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>

          {/* ── LEFT: Camera + Auth ──────────────────────── */}
          <div className="glass-card" style={{padding:22}}>
            <div className="section-heading">Biometric Scanner</div>
            {/* Camera viewport */}
            <div style={{position:'relative',background:'#000',borderRadius:6,overflow:'hidden',border:'1px solid var(--border)',aspectRatio:'4/3'}}>
              <video ref={videoRef} autoPlay muted playsInline
                onCanPlay={()=>setVideoReady(true)}
                style={{width:'100%',height:'100%',objectFit:'cover',display:cameraOn?'block':'none'}}
              />
              {/* Face mesh overlay */}
              <FaceMeshOverlay videoRef={videoRef} active={meshActive||scanActive} phase={scanPhase}/>
              {!cameraOn&&(
                <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12,background:'#000'}}>
                  <div style={{fontSize:44,opacity:.2}}>👁</div>
                  <p style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--text-secondary)',textAlign:'center',padding:'0 20px',lineHeight:1.8}}>
                    Camera access required<br/>for facial biometrics
                  </p>
                  <button className="btn-gold" onClick={startCamera} style={{fontSize:11,letterSpacing:3}}>ENABLE CAMERA</button>
                </div>
              )}
              {/* Scan line overlay */}
              {scanActive&&(
                <div style={{position:'absolute',inset:0,pointerEvents:'none'}}>
                  {[[0,0],[0,1],[1,0],[1,1]].map(([r,c],i)=>(
                    <div key={i} style={{position:'absolute',
                      top:r===0?10:'auto',bottom:r===1?10:'auto',
                      left:c===0?10:'auto',right:c===1?10:'auto',
                      width:22,height:22,
                      borderTop:r===0?'2px solid var(--gold)':'none',
                      borderBottom:r===1?'2px solid var(--gold)':'none',
                      borderLeft:c===0?'2px solid var(--gold)':'none',
                      borderRight:c===1?'2px solid var(--gold)':'none',
                    }}/>
                  ))}
                  <div style={{position:'absolute',left:0,right:0,top:`${scanProgress}%`,height:2,background:'linear-gradient(90deg,transparent,var(--gold),transparent)',transition:'top 0.05s linear'}}/>
                  <div style={{position:'absolute',bottom:8,left:0,right:0,textAlign:'center',fontFamily:'var(--font-mono)',fontSize:9,color:'var(--gold)',letterSpacing:3}}>
                    {scanPhase} {scanProgress}%
                  </div>
                </div>
              )}
              {cameraOn&&!scanActive&&(
                <div style={{position:'absolute',top:7,left:8,fontFamily:'var(--font-mono)',fontSize:9,color:videoReady?'var(--green)':'var(--gold)',display:'flex',alignItems:'center',gap:4}}>
                  <div style={{width:5,height:5,borderRadius:'50%',background:videoReady?'var(--green)':'var(--gold)'}}/>
                  {videoReady?'LIVE · BIOMETRIC ACTIVE':'INITIALIZING...'}
                </div>
              )}
            </div>
            {cameraError&&<p style={{color:'var(--red)',fontSize:10,marginTop:6,fontFamily:'var(--font-mono)'}}>{cameraError}</p>}
            {cameraOn&&<p style={{fontFamily:'var(--font-mono)',fontSize:9,color:'var(--text-secondary)',marginTop:7,textAlign:'center',letterSpacing:2}}>LOOK DIRECTLY AT CAMERA · ENSURE GOOD LIGHTING</p>}

            {/* Login / Register buttons */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:12}}>
              <button className="btn-gold" onClick={handleFaceLogin} disabled={loading} style={{fontSize:11}}>
                {loading?'⟳ SCANNING...':'▶ FACE LOGIN'}
              </button>
              <button className="btn-ghost"
                onClick={()=>{if(!termsAccepted){setStep('terms');setTermsCountdown(15);}else setStep('register-form');}}
                style={{fontSize:11}}>+ REGISTER</button>
            </div>

            {/* Register form */}
            {(step==='register-form'||termsAccepted)&&(
              <div style={{marginTop:12,animation:'fadeInUp 0.3s ease'}}>
                <div style={{fontFamily:'var(--font-mono)',fontSize:9,color:'var(--gold)',letterSpacing:2,marginBottom:8,textAlign:'center'}}>
                  — NEW USER REGISTRATION —
                </div>
                {/* Username */}
                <input className="centurion-input" placeholder="Choose a username"
                  value={username} onChange={e=>setUsername(e.target.value)}
                  style={{marginBottom:7}}/>
                {/* Password */}
                <div style={{position:'relative',marginBottom:0}}>
                  <input className="centurion-input"
                    type={showPw?'text':'password'}
                    placeholder="Create password"
                    value={password}
                    onChange={e=>setPassword(e.target.value)}
                    onFocus={()=>setPwFocused(true)}
                    onBlur={()=>setPwFocused(false)}
                    style={{paddingRight:80}}/>
                  <div style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',display:'flex',gap:4}}>
                    <button onClick={()=>setShowPw(v=>!v)}
                      style={{background:'none',border:'none',color:'var(--text-secondary)',cursor:'pointer',fontFamily:'var(--font-mono)',fontSize:10}}>
                      {showPw?'HIDE':'👁'}
                    </button>
                    <button onClick={()=>{const p=generateSecurePassword();setPassword(p);setConfirmPw(p);setGeneratedPw(p);}}
                      style={{background:'none',border:'none',color:'var(--gold)',cursor:'pointer',fontFamily:'var(--font-mono)',fontSize:10,letterSpacing:1}}>
                      GEN
                    </button>
                  </div>
                </div>
                {/* Password rules — slide out as satisfied */}
                <PasswordRules password={password} username={username} visible={pwFocused||password.length>0}/>
                {/* Password strength bar */}
                {password.length>0&&(()=>{
                  const rules=getPasswordRules(password,username);
                  const ok=rules.filter(r=>r.ok).length;
                  const pct=Math.round(ok/rules.length*100);
                  const col=pct<40?'var(--red)':pct<70?'#ff8800':'var(--green)';
                  const label=pct<40?'Weak':pct<70?'Fair':pct<100?'Good':'Strong';
                  return (
                    <div style={{marginTop:6,marginBottom:4}}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                        <span style={{fontFamily:'var(--font-mono)',fontSize:8,color:'var(--text-secondary)',letterSpacing:1}}>STRENGTH</span>
                        <span style={{fontFamily:'var(--font-mono)',fontSize:8,color:col,letterSpacing:1}}>{label}</span>
                      </div>
                      <div style={{height:3,background:'rgba(255,255,255,0.06)',borderRadius:2,overflow:'hidden'}}>
                        <div style={{height:'100%',width:`${pct}%`,background:col,borderRadius:2,transition:'width 0.3s,background 0.3s'}}/>
                      </div>
                    </div>
                  );
                })()}
                {/* Generated password display */}
                {generatedPw&&(
                  <div style={{marginTop:4,marginBottom:6,padding:'5px 10px',background:'rgba(201,168,76,0.06)',border:'1px solid rgba(201,168,76,0.2)',borderRadius:3}}>
                    <span style={{fontFamily:'var(--font-mono)',fontSize:9,color:'var(--text-secondary)',letterSpacing:1}}>GENERATED: </span>
                    <span style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--gold)',letterSpacing:2}}>{generatedPw}</span>
                    <span style={{fontFamily:'var(--font-mono)',fontSize:8,color:'#666',marginLeft:8}}>— save this!</span>
                  </div>
                )}
                {/* Confirm password */}
                <div style={{position:'relative',marginTop:6}}>
                  <input className="centurion-input"
                    type={showCPw?'text':'password'}
                    placeholder="Confirm password"
                    value={confirmPw}
                    onChange={e=>setConfirmPw(e.target.value)}
                    style={{paddingRight:60,borderColor:confirmPw&&password&&(confirmPw===password?'var(--green)':'var(--red)')}}/>
                  <button onClick={()=>setShowCPw(v=>!v)}
                    style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'var(--text-secondary)',cursor:'pointer',fontFamily:'var(--font-mono)',fontSize:9}}>
                    {showCPw?'HIDE':'SHOW'}
                  </button>
                  {confirmPw&&password&&(
                    <span style={{position:'absolute',right:52,top:'50%',transform:'translateY(-50%)',fontFamily:'var(--font-mono)',fontSize:11,color:confirmPw===password?'var(--green)':'var(--red)'}}>
                      {confirmPw===password?'✓':'✗'}
                    </span>
                  )}
                </div>
                <button className="btn-ghost" onClick={handleRegister} disabled={loading}
                  style={{width:'100%',fontSize:11,marginTop:9}}>
                  {loading?'⟳ ENROLLING...':' ENROLL FACE & REGISTER'}
                </button>
              </div>
            )}

            {failedAttempts>0&&(
              <div style={{marginTop:10,padding:'7px 10px',borderRadius:3,background:'rgba(255,51,51,0.04)',border:'1px solid rgba(255,51,51,0.14)',fontFamily:'var(--font-mono)',fontSize:9,color:'var(--red)'}}>
                ⚠ {failedAttempts} failed attempt{failedAttempts>1?'s':''} · Admin notified
              </div>
            )}
          </div>

          {/* ── RIGHT: Auth flow info ────────────────────── */}
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            {/* Auth flows */}
            <div className="glass-card" style={{padding:22}}>
              <div className="section-heading">Authentication Flows</div>
              {/* New user */}
              <div style={{marginBottom:16}}>
                <div style={{fontFamily:'var(--font-mono)',fontSize:13,color:'var(--gold)',letterSpacing:2,marginBottom:10}}>❖ NEW USER AUTHENTICATION</div>
                <div style={{display:'flex',flexDirection:'column',gap:7}}>
                  {[
                    {n:'1',icon:'👁',t:'Face + Password',  d:'Biometric enrollment & credentials',c:'var(--red)'},
                    {n:'2',icon:'✉',t:'Email OTP',         d:'Verify your email address',         c:'var(--red)'},
                    {n:'3',icon:'⫍',t:'Admin Approval',   d:'One-click admin verification',      c:'var(--red)'},
                    {n:'4',icon:'⨁',t:'2 Captchas',       d:'Visual bot-resistant challenges',   c:'var(--red)'},
                    {n:'✓',icon:'䷒',t:'Dashboard Access', d:'Registration complete',             c:'var(--red)'},
                  ].map((s,i)=>(
                    <div key={i} style={{display:'flex',alignItems:'center',gap:9}}>
                      <div style={{width:24,height:24,borderRadius:'50%',border:`1px solid ${s.c}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,background:`${s.c}05`,flexShrink:0}}>{s.icon}</div>
                      <div style={{flex:1}}>
                        <div style={{fontFamily:'var(--font-mono)',fontSize:12,color:s.c,letterSpacing:2}}>{s.n}. {s.t}</div>
                        <div style={{fontFamily:'var(--font-body)',fontSize:12,color:'var(--text-secondary)'}}>{s.d}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Divider */}
              <div style={{height:1,background:'linear-gradient(90deg,transparent,var(--border),transparent)',margin:'12px 0'}}/>
              {/* Returning user */}
              <div>
                <div style={{fontFamily:'var(--font-mono)',fontSize:13,color:'var(--gold)',letterSpacing:2,marginBottom:10}}>❖ RETURNING USER LOGIN</div>
                <div style={{display:'flex',flexDirection:'column',gap:7}}>
                  {[
                    {n:'1',icon:'👁',t:'Face Scan',       d:'High-confidence biometric match',   c:'var(--red)'},
                    {n:'2',icon:'✉',t:'Email Confirm',    d:'OTP sent to registered email',       c:'var(--red)'},
                    {n:'✓',icon:'䷒',t:'Dashboard',       d:'Instant access granted',            c:'var(--red)'},
                  ].map((s,i)=>(
                    <div key={i} style={{display:'flex',alignItems:'center',gap:9}}>
                      <div style={{width:24,height:24,borderRadius:'50%',border:`1px solid ${s.c}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,background:`${s.c}05`,flexShrink:0}}>{s.icon}</div>
                      <div style={{flex:1}}>
                        <div style={{fontFamily:'var(--font-mono)',fontSize:12,color:s.c,letterSpacing:2}}>{s.n}. {s.t}</div>
                        <div style={{fontFamily:'var(--font-body)',fontSize:12,color:'var(--text-secondary)'}}>{s.d}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Email login shortcut */}
            <div className="glass-card" style={{padding:20}}>
              <div className="section-heading">Email OTP Login</div>
              <p style={{fontFamily:'var(--font-mono)',fontSize:12,color:'var(--text-secondary)',marginBottom:12,lineHeight:1.7}}>
                No face scan available? Login via email OTP confirmation + 2 captcha challenges.
              </p>
              <button className="btn-ghost" onClick={()=>{
                setPendingUser({userId:email||'user',role:'user',method:'otp+captcha'});
                setStep('otp');
              }} style={{width:'100%',fontSize:12}}>
                ✉ CONFIRM WITH EMAIL →
              </button>
            </div>

            {status&&(
              <div style={{padding:'10px 14px',borderRadius:4,fontFamily:'var(--font-mono)',fontSize:11,border:`1px solid ${sc}`,color:sc,background:`${sc}08`,animation:'fadeInUp 0.3s ease'}}>
                {status}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer — preserved as original */}
      <footer style={{textAlign:'center',padding:'14px',borderTop:'2px solid var(--border)',position:'relative',zIndex:2}}>
        <p style={{fontFamily:'system-ui, sans-serif',fontSize:10,backgroundColor:'#490606ff',color:'#dd8238ff',letterSpacing:4}}>
          Centurion® All Rights Reserved · © 2025-{new Date().getFullYear()} · Designed by Aura Joshua™
        </p>
      </footer>

      {!cookiesAccepted&&<CookieBanner onAccept={acceptCookies} onDecline={()=>{}}/>}
    </div>
  );
}
