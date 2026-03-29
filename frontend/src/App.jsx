import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import i18n from './utils/i18n';
import { I18nextProvider } from 'react-i18next';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import './styles/main.css';

// ╔══════════════════════════════════════════════════════════════╗
// ║  GLOBAL CAMERA CONTEXT                                      ║
// ║  Shared across all pages — camera never stops               ║
// ╚══════════════════════════════════════════════════════════════╝
export const CameraContext = createContext(null);

export function useCameraContext() {
  return useContext(CameraContext);
}

// ── Snapshot storage (in-memory + localStorage backup) ────────
const SNAPSHOT_KEY = 'centurion_surveillance_snapshots';
function loadSnapshots() {
  try {
    const raw = sessionStorage.getItem(SNAPSHOT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveSnapshots(snaps) {
  try {
    // Keep last 50 only to avoid storage limits
    const trimmed = snaps.slice(-50);
    sessionStorage.setItem(SNAPSHOT_KEY, JSON.stringify(trimmed));
  } catch {}
}

// ── Global persistent camera provider ─────────────────────────
function CameraProvider({ children }) {
  const videoRef      = useRef(null);
  const streamRef     = useRef(null);
  const captureTimer  = useRef(null);
  const flashRef      = useRef(null);

  const [cameraReady, setCameraReady]     = useState(false);
  const [snapshots, setSnapshots]         = useState(loadSnapshots);
  const [lastSnap, setLastSnap]           = useState(null);
  const [captureCount, setCaptureCount]   = useState(0);
  const [isCapturing, setIsCapturing]     = useState(false);
  const [survActive, setSurvActive]       = useState(false);
  const [cameraError, setCameraError]     = useState('');

  // ── Start camera ───────────────────────────────────────────
  const startCamera = useCallback(async () => {
    if (streamRef.current) return; // already running
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width:{ ideal:640 }, height:{ ideal:480 }, facingMode:'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraReady(true);
      setCameraError('');
      console.log('[CENTURION] 🎥 Persistent camera started');
    } catch(err) {
      setCameraError(err.message);
      console.warn('[CENTURION] Camera failed:', err.message);
    }
  }, []);

  // ── Stop camera ────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    clearInterval(captureTimer.current);
    setCameraReady(false);
    setSurvActive(false);
  }, []);

  // ── Capture one frame ──────────────────────────────────────
  const captureFrame = useCallback((quality = 0.85) => {
    const v = videoRef.current;
    if (!v || !v.videoWidth || v.readyState < 2) return null;
    const canvas = document.createElement('canvas');
    canvas.width  = v.videoWidth;
    canvas.height = v.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(v, 0, 0);
    // Blank frame check
    const data = ctx.getImageData(0, 0, 10, 10).data;
    if (data.every(v => v === 0)) return null;
    return canvas.toDataURL('image/jpeg', quality);
  }, []);

  // ── Flash animation ────────────────────────────────────────
  const triggerFlash = useCallback(() => {
    if (!flashRef.current) return;
    flashRef.current.style.opacity = '0.7';
    flashRef.current.style.transition = 'none';
    setTimeout(() => {
      if (flashRef.current) {
        flashRef.current.style.transition = 'opacity 0.4s ease';
        flashRef.current.style.opacity = '0';
      }
    }, 60);
  }, []);

  // ── Save a surveillance snapshot ───────────────────────────
  const takeSurveillanceSnapshot = useCallback((reason = 'scheduled') => {
    const frame = captureFrame(0.75);
    if (!frame) return null;
    const snap = {
      id:        `snap-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
      dataUrl:   frame,
      timestamp: new Date().toISOString(),
      reason,
      page:      window.location.pathname || 'dashboard',
    };
    setSnapshots(prev => {
      const updated = [...prev, snap].slice(-50);
      saveSnapshots(updated);
      return updated;
    });
    setLastSnap(snap);
    setCaptureCount(c => c + 1);
    triggerFlash();
    console.log(`[SURV] 📸 Snapshot taken — reason: ${reason}`);
    return snap;
  }, [captureFrame, triggerFlash]);

  // ── Start surveillance mode ────────────────────────────────
  const startSurveillance = useCallback(() => {
    if (survActive) return;
    setSurvActive(true);
    console.log('[CENTURION] 👁 Surveillance mode ACTIVE');

    // Max 4 per minute — interval 15–20s randomly
    const scheduleNext = () => {
      const delay = (Math.random() * 5 + 15) * 1000; // 15–20s
      captureTimer.current = setTimeout(() => {
        takeSurveillanceSnapshot('scheduled');
        scheduleNext();
      }, delay);
    };

    // First capture after 8 seconds
    captureTimer.current = setTimeout(() => {
      takeSurveillanceSnapshot('session-start');
      scheduleNext();
    }, 8000);
  }, [survActive, takeSurveillanceSnapshot]);

  // ── Stop surveillance ──────────────────────────────────────
  const stopSurveillance = useCallback(() => {
    clearTimeout(captureTimer.current);
    clearInterval(captureTimer.current);
    setSurvActive(false);
  }, []);

  // ── Capture on navigation/scroll events ───────────────────
  useEffect(() => {
    if (!survActive || !cameraReady) return;
    let lastScroll = 0;
    let scrollDebounce = null;

    const onScroll = () => {
      const now = Date.now();
      if (now - lastScroll < 60000) return; // max 1 per 60s from scroll
      clearTimeout(scrollDebounce);
      scrollDebounce = setTimeout(() => {
        lastScroll = Date.now();
        takeSurveillanceSnapshot('scroll-event');
      }, 2000); // capture 2s after scroll stops
    };

    const onClick = (() => {
      let lastClick = 0;
      return () => {
        const now = Date.now();
        if (now - lastClick < 90000) return; // max 1 per 90s from click
        lastClick = now;
        setTimeout(() => takeSurveillanceSnapshot('nav-click'), 800);
      };
    })();

    const onFocus = () => {
      setTimeout(() => takeSurveillanceSnapshot('window-focus'), 1500);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('click', onClick);
    window.addEventListener('focus', onFocus);

    return () => {
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('click', onClick);
      window.removeEventListener('focus', onFocus);
      clearTimeout(scrollDebounce);
    };
  }, [survActive, cameraReady, takeSurveillanceSnapshot]);

  // ── Cleanup on unmount ─────────────────────────────────────
  useEffect(() => {
    return () => {
      stopCamera();
      stopSurveillance();
    };
  }, [stopCamera, stopSurveillance]);

  // ── Pre-capture on unauthorized attempt ─────────────────────
  const captureUnauthorized = useCallback((details = {}) => {
    const frame = captureFrame(0.85);
    if (!frame) return null;
    const snap = {
      id:        `unauth-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
      dataUrl:   frame,
      timestamp: new Date().toISOString(),
      reason:    'unauthorized-attempt',
      page:      'login',
      details,
    };
    setSnapshots(prev => {
      const updated = [...prev, snap].slice(-50);
      saveSnapshots(updated);
      return updated;
    });
    setLastSnap(snap);
    setCaptureCount(c => c + 1);
    triggerFlash();
    console.log('[SURV] 🚨 Unauthorized attempt captured');
    return snap;
  }, [captureFrame, triggerFlash]);

  const ctx = {
    videoRef,
    cameraReady,
    cameraError,
    survActive,
    snapshots,
    lastSnap,
    captureCount,
    isCapturing,
    startCamera,
    stopCamera,
    captureFrame,
    takeSurveillanceSnapshot,
    captureUnauthorized,
    startSurveillance,
    stopSurveillance,
    clearSnapshots: () => { setSnapshots([]); saveSnapshots([]); },
  };

  return (
    <CameraContext.Provider value={ctx}>
      {/* ── Hidden persistent video element ─────────────────── */}
      <video
        ref={videoRef}
        autoPlay muted playsInline
        onCanPlay={() => setCameraReady(true)}
        style={{
          position: 'fixed',
          bottom: 0, right: 0,
          width: 1, height: 1,
          opacity: 0,
          pointerEvents: 'none',
          zIndex: -1,
        }}
      />
      {/* ── Camera flash effect ──────────────────────────────── */}
      <div ref={flashRef} style={{
        position: 'fixed', inset: 0,
        background: 'white',
        opacity: 0,
        pointerEvents: 'none',
        zIndex: 99998,
      }} />
      {children}
    </CameraContext.Provider>
  );
}

// ── Surveillance HUD overlay ───────────────────────────────────
function SurveillanceHUD({ user, page }) {
  const cam = useCameraContext();
  const [tick, setTick] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  // Blink every second
  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  if (!user || page !== 'dashboard') return null;

  return (
    <>
      {/* ── Top-left surveillance indicator ─────────────────── */}
      <div style={{
        position: 'fixed', top: 72, left: 16,
        zIndex: 9000, display: 'flex', alignItems: 'center', gap: 8,
        background: 'rgba(0,0,0,0.7)',
        border: `1px solid ${cam.survActive ? 'rgba(255,51,51,0.5)' : 'rgba(201,168,76,0.3)'}`,
        padding: '5px 10px', borderRadius: 4,
        backdropFilter: 'blur(8px)',
        cursor: 'pointer',
        transition: 'all 0.3s',
      }} onClick={() => setShowPreview(v => !v)}>
        {/* Blinking dot */}
        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          background: cam.survActive ? '#ff3333' : '#555',
          boxShadow: cam.survActive ? '0 0 8px #ff3333' : 'none',
          opacity: cam.survActive && tick % 2 === 0 ? 1 : 0.4,
          transition: 'opacity 0.3s',
        }} />
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 9,
          color: cam.survActive ? '#ff5555' : '#555',
          letterSpacing: 2,
        }}>
          {cam.survActive ? 'REC' : 'CAM'}
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 9,
          color: 'var(--text-secondary)', letterSpacing: 1,
        }}>
          {cam.captureCount} snaps
        </span>
        {!cam.cameraReady && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--gold)' }}>
            ◌
          </span>
        )}
      </div>

      {/* ── Snapshot preview panel ───────────────────────────── */}
      {showPreview && (
        <div style={{
          position: 'fixed', top: 110, left: 16,
          zIndex: 9001, width: 300,
          background: 'rgba(0,0,0,0.92)',
          border: '1px solid var(--border)',
          borderRadius: 8, padding: 16,
          backdropFilter: 'blur(16px)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: 3 }}>
              SURVEILLANCE FEED
            </span>
            <button onClick={() => setShowPreview(false)}
              style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 14 }}>×</button>
          </div>

          {/* Live mini feed */}
          <LiveMiniCamera videoRef={cam.videoRef} cameraReady={cam.cameraReady} />

          {/* Controls */}
          <div style={{ display: 'flex', gap: 8, marginTop: 10, marginBottom: 12 }}>
            {!cam.survActive ? (
              <button onClick={cam.startSurveillance}
                style={{ flex: 1, background: 'rgba(255,51,51,0.15)', border: '1px solid rgba(255,51,51,0.4)',
                  color: 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: 10,
                  padding: '6px', borderRadius: 3, cursor: 'pointer', letterSpacing: 2,
                }}>▶ START REC</button>
            ) : (
              <button onClick={cam.stopSurveillance}
                style={{ flex: 1, background: 'rgba(255,51,51,0.1)', border: '1px solid rgba(255,51,51,0.3)',
                  color: '#ff6666', fontFamily: 'var(--font-mono)', fontSize: 10,
                  padding: '6px', borderRadius: 3, cursor: 'pointer', letterSpacing: 2,
                }}>■ STOP REC</button>
            )}
            <button onClick={() => cam.takeSurveillanceSnapshot('manual')}
              style={{ flex: 1, background: 'rgba(201,168,76,0.1)', border: '1px solid var(--border)',
                color: 'var(--gold)', fontFamily: 'var(--font-mono)', fontSize: 10,
                padding: '6px', borderRadius: 3, cursor: 'pointer', letterSpacing: 2,
              }}>📷 SNAP</button>
          </div>

          {/* Snapshot grid */}
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-secondary)',
            letterSpacing: 2, marginBottom: 8 }}>
            CAPTURED FRAMES ({cam.snapshots.length})
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, maxHeight: 240, overflowY: 'auto' }}>
            {cam.snapshots.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 16,
                fontFamily: 'var(--font-mono)', fontSize: 10, color: '#333' }}>
                No captures yet
              </div>
            ) : (
              [...cam.snapshots].reverse().map(snap => (
                <SnapThumb key={snap.id} snap={snap} />
              ))
            )}
          </div>

          {cam.snapshots.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button onClick={() => downloadAllSnapshots(cam.snapshots)}
                style={{ flex: 1, background: 'rgba(201,168,76,0.08)', border: '1px solid var(--border)',
                  color: 'var(--gold)', fontFamily: 'var(--font-mono)', fontSize: 9,
                  padding: '5px', borderRadius: 3, cursor: 'pointer', letterSpacing: 1,
                }}>⬇ EXPORT ALL</button>
              <button onClick={cam.clearSnapshots}
                style={{ background: 'none', border: '1px solid rgba(255,51,51,0.3)',
                  color: 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: 9,
                  padding: '5px 8px', borderRadius: 3, cursor: 'pointer',
                }}>🗑</button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

// ── Live mini camera display ───────────────────────────────────
function LiveMiniCamera({ videoRef, cameraReady }) {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const draw = () => {
      const v = videoRef?.current;
      if (v && cameraReady && v.readyState >= 2 && v.videoWidth > 0) {
        ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
        // Scanline overlay
        ctx.fillStyle = 'rgba(0,0,0,0.05)';
        for (let y = 0; y < canvas.height; y += 4) {
          ctx.fillRect(0, y, canvas.width, 1);
        }
        // Green tint
        ctx.fillStyle = 'rgba(0,30,0,0.15)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#1a1a1a';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('NO SIGNAL', canvas.width/2, canvas.height/2);
      }
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [videoRef, cameraReady]);

  return (
    <div style={{ position: 'relative', borderRadius: 4, overflow: 'hidden',
      border: '1px solid rgba(0,255,136,0.2)',
    }}>
      <canvas ref={canvasRef} width={268} height={150}
        style={{ display: 'block', width: '100%' }}
      />
      {/* REC indicator */}
      <div style={{ position: 'absolute', top: 6, left: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff3333',
          boxShadow: '0 0 6px #ff3333', animation: 'pulse-gold 1.5s infinite' }} />
        <span style={{ fontFamily: 'monospace', fontSize: 8, color: '#ff5555', letterSpacing: 1 }}>LIVE</span>
      </div>
      {/* Timestamp */}
      <div style={{ position: 'absolute', bottom: 4, right: 6,
        fontFamily: 'monospace', fontSize: 8, color: 'rgba(0,255,0,0.6)',
      }}>
        <LiveClock />
      </div>
    </div>
  );
}

function LiveClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString('en-GB', { hour12: false }));
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, []);
  return <>{time}</>;
}

// ── Snapshot thumbnail ─────────────────────────────────────────
function SnapThumb({ snap }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <div onClick={() => setExpanded(true)} style={{
        aspectRatio: '4/3', borderRadius: 3, overflow: 'hidden',
        border: '1px solid var(--border)', cursor: 'pointer', position: 'relative',
        transition: 'border-color 0.2s',
      }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
      >
        <img src={snap.dataUrl} alt="snapshot"
          style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'sepia(20%)' }}
        />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(transparent,rgba(0,0,0,0.8))',
          padding: '3px 3px 2px',
          fontFamily: 'monospace', fontSize: 7, color: '#0f0',
        }}>
          {new Date(snap.timestamp).toLocaleTimeString('en-GB', { hour12: false })}
        </div>
      </div>
      {expanded && (
        <div onClick={() => setExpanded(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)',
          zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 16,
        }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: 3 }}>
            SURVEILLANCE CAPTURE
          </div>
          <img src={snap.dataUrl} alt="expanded"
            style={{ maxWidth: '80vw', maxHeight: '70vh', borderRadius: 4,
              border: '1px solid var(--gold)', filter: 'sepia(15%)',
            }}
          />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)', textAlign: 'center' }}>
            {new Date(snap.timestamp).toLocaleString()} · {snap.reason} · {snap.page}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={(e) => { e.stopPropagation(); downloadSnap(snap); }}
              style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid var(--gold)',
                color: 'var(--gold)', fontFamily: 'var(--font-mono)', fontSize: 11,
                padding: '8px 18px', borderRadius: 3, cursor: 'pointer', letterSpacing: 2,
              }}>⬇ DOWNLOAD</button>
            <button onClick={() => setExpanded(false)}
              style={{ background: 'none', border: '1px solid #444', color: '#888',
                fontFamily: 'var(--font-mono)', fontSize: 11,
                padding: '8px 18px', borderRadius: 3, cursor: 'pointer',
              }}>CLOSE</button>
          </div>
        </div>
      )}
    </>
  );
}

// ── Download helpers ───────────────────────────────────────────
function downloadSnap(snap) {
  const a = document.createElement('a');
  a.href = snap.dataUrl;
  a.download = `centurion-surv-${snap.id}.jpg`;
  a.click();
}

function downloadAllSnapshots(snaps) {
  snaps.forEach((snap, i) => {
    setTimeout(() => downloadSnap(snap), i * 200);
  });
}

// ── Doodle background ──────────────────────────────────────────
function DoodleCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId, t = 0;
    let nodes = [];
    const resize = () => {
      canvas.width = window.innerWidth; canvas.height = window.innerHeight;
      nodes = Array.from({ length: 60 }, () => ({
        x: Math.random()*canvas.width, y: Math.random()*canvas.height,
        vx: (Math.random()-.5)*.3, vy: (Math.random()-.5)*.3,
        r: Math.random()*2+1, pulse: Math.random()*Math.PI*2,
      }));
    };
    resize(); window.addEventListener('resize', resize);
    const draw = () => {
      ctx.clearRect(0,0,canvas.width,canvas.height); t+=.008;
      nodes.forEach(n=>{
        n.x+=n.vx; n.y+=n.vy; n.pulse+=.02;
        if(n.x<0||n.x>canvas.width)n.vx*=-1;
        if(n.y<0||n.y>canvas.height)n.vy*=-1;
      });
      ctx.strokeStyle='rgba(201,168,76,0.15)'; ctx.lineWidth=.5;
      for(let i=0;i<nodes.length;i++) for(let j=i+1;j<nodes.length;j++){
        const dx=nodes[i].x-nodes[j].x, dy=nodes[i].y-nodes[j].y, d=Math.sqrt(dx*dx+dy*dy);
        if(d<140){ctx.globalAlpha=(1-d/140)*.4;ctx.beginPath();ctx.moveTo(nodes[i].x,nodes[i].y);ctx.lineTo(nodes[j].x,nodes[j].y);ctx.stroke();}
      }
      nodes.forEach(n=>{
        const p=.5+.5*Math.sin(n.pulse); ctx.globalAlpha=.3+.3*p; ctx.fillStyle='#c9a84c';
        ctx.beginPath(); ctx.arc(n.x,n.y,n.r*(.8+.4*p),0,Math.PI*2); ctx.fill();
      });
      ctx.globalAlpha=.06; ctx.strokeStyle='#c9a84c'; ctx.lineWidth=1;
      for(let i=0;i<8;i++){
        const x=(i*137.5+t*10)%canvas.width, y=(i*89.3+t*7)%canvas.height;
        ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+30,y); ctx.lineTo(x+30,y+20); ctx.lineTo(x+60,y+20); ctx.stroke();
        ctx.fillStyle='#c9a84c'; ctx.fillRect(x+28,y-2,4,4); ctx.fillRect(x+58,y+18,4,4);
      }
      ctx.globalAlpha=1; animId=requestAnimationFrame(draw);
    };
    draw();
    return ()=>{ window.removeEventListener('resize',resize); cancelAnimationFrame(animId); };
  },[]);
  return <canvas ref={canvasRef} style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',pointerEvents:'none',zIndex:0,opacity:.18}}/>;
}

// ── Custom cursor ──────────────────────────────────────────────
function CustomCursor() {
  const cursorRef=useRef(null), dotRef=useRef(null);
  const pos=useRef({x:0,y:0}), target=useRef({x:0,y:0});
  useEffect(()=>{
    const move=e=>{ target.current={x:e.clientX,y:e.clientY}; };
    window.addEventListener('mousemove',move);
    let animId;
    const animate=()=>{
      pos.current.x+=(target.current.x-pos.current.x)*.12;
      pos.current.y+=(target.current.y-pos.current.y)*.12;
      if(cursorRef.current)cursorRef.current.style.transform=`translate(${pos.current.x-16}px,${pos.current.y-16}px)`;
      if(dotRef.current)dotRef.current.style.transform=`translate(${target.current.x-3}px,${target.current.y-3}px)`;
      animId=requestAnimationFrame(animate);
    };
    animate();
    return()=>{ window.removeEventListener('mousemove',move); cancelAnimationFrame(animId); };
  },[]);
  return(
    <>
      <div ref={cursorRef} style={{position:'fixed',top:0,left:0,zIndex:99999,width:32,height:32,pointerEvents:'none',border:'1px solid rgba(201,168,76,0.6)',borderRadius:'50%'}}/>
      <div ref={dotRef} style={{position:'fixed',top:0,left:0,zIndex:99999,width:6,height:6,pointerEvents:'none',background:'var(--gold)',borderRadius:'50%',boxShadow:'0 0 8px var(--gold)'}}/>
    </>
  );
}

// ╔══════════════════════════════════════════════════════════════╗
// ║  MAIN APP                                                   ║
// ╚══════════════════════════════════════════════════════════════╝
export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('login');
  const [fadeOut, setFadeOut] = useState(false);
  const [pendingPage, setPendingPage] = useState(null);
  const [pendingUser, setPendingUser] = useState(null);

  const handleLogin = useCallback((userData) => {
    setFadeOut(true);
    setPendingUser(userData);
    setPendingPage('dashboard');
  }, []);

  const handleLogout = useCallback(() => {
    setFadeOut(true);
    setPendingUser(null);
    setPendingPage('login');
  }, []);

  // After fade out completes, switch page then fade in
  useEffect(() => {
    if (!fadeOut || !pendingPage) return;
    const t = setTimeout(() => {
      setUser(pendingUser);
      setPage(pendingPage);
      setPendingPage(null);
      setPendingUser(null);
      setFadeOut(false);
    }, 500);
    return () => clearTimeout(t);
  }, [fadeOut, pendingPage, pendingUser]);

  return (
    <I18nextProvider i18n={i18n}>
      <CameraProvider>
        <AppInner
          user={user} page={page}
          onLogin={handleLogin} onLogout={handleLogout}
          fadeOut={fadeOut}
        />
      </CameraProvider>
    </I18nextProvider>
  );
}

// ── Inner app — has access to camera context ───────────────────
function AppInner({ user, page, onLogin, onLogout, fadeOut }) {
  const cam = useCameraContext();

  // ── Start camera + surveillance when user logs in ──────────
  useEffect(() => {
    if (page === 'dashboard' && user) {
      cam.startCamera().then(() => {
        setTimeout(() => cam.startSurveillance(), 2000);
      });
    }
  }, [page, user]); // eslint-disable-line

  // ── Take snapshot on every page change ────────────────────
  useEffect(() => {
    if (page === 'dashboard' && cam.cameraReady) {
      setTimeout(() => cam.takeSurveillanceSnapshot('page-view'), 3000);
    }
  }, [page, cam.cameraReady]); // eslint-disable-line

  // ── Stop surveillance on logout ────────────────────────────
  useEffect(() => {
    if (page === 'login') {
      cam.stopSurveillance();
    }
  }, [page]); // eslint-disable-line

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <DoodleCanvas />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none',
        background: 'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.03) 3px,rgba(0,0,0,0.03) 4px)',
      }} />
      <CustomCursor />

      {/* ── Surveillance HUD (always visible on dashboard) ──── */}
      <SurveillanceHUD user={user} page={page} />

      {/* ── Pages — with fade transition ──────────────────────── */}
      <div style={{
        position: 'relative', zIndex: 2,
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 0.5s ease',
        pointerEvents: fadeOut ? 'none' : 'auto',
      }}>
        {page === 'login' && (
          <LoginPage onLogin={onLogin} />
        )}
        {page === 'dashboard' && (
          <Dashboard user={user} onLogout={onLogout} />
        )}
      </div>
    </div>
  );
}
