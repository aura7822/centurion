import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { pollIoT } from '../api/backendAPI';

export default function IoTSimulation({ iotStatus: propStatus }) {
  const { t } = useTranslation();
  const [status, setStatus] = useState(propStatus || { greenLED:false, redLED:false, buzzer:false, doorUnlocked:false, message:'Idle' });
  const [log, setLog] = useState([]);
  const [buzz, setBuzz] = useState(false);

  useEffect(() => {
    if (propStatus) {
      const changed = JSON.stringify(propStatus) !== JSON.stringify(status);
      if (changed) {
        setStatus(propStatus);
        setLog(prev => [{
          time: new Date().toLocaleTimeString(),
          msg: propStatus.message,
          type: propStatus.doorUnlocked ? 'auth' : propStatus.redLED ? 'deny' : 'info'
        }, ...prev.slice(0, 19)]);
        if (propStatus.buzzer) {
          setBuzz(true);
          setTimeout(() => setBuzz(false), 600);
        }
      }
    }
  }, [propStatus]);

  // Independent polling if used standalone
  useEffect(() => {
    if (!propStatus) {
      const stop = pollIoT(s => {
        setStatus(s);
        setLog(prev => [{
          time: new Date().toLocaleTimeString(),
          msg: s.message,
          type: s.doorUnlocked ? 'auth' : s.redLED ? 'deny' : 'info'
        }, ...prev.slice(0, 19)]);
      }, 1500);
      return stop;
    }
  }, [propStatus]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>

      {/* Left: Door + LEDs */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32 }}>

        {/* Door frame */}
        <div style={{ position: 'relative', width: 200, height: 300 }}>
          {/* Frame */}
          <div style={{ position: 'absolute', inset: 0, border: '3px solid var(--gold-dim)',
            borderRadius: '4px 4px 0 0', background: 'rgba(10,10,10,0.8)'
          }} />
          {/* Door panel */}
          <div className={`sim-door ${status.doorUnlocked ? 'open' : ''}`}
            style={{ position: 'absolute', width: '100%', height: '100%' }}
          >
            {/* Door panels */}
            <div style={{ position: 'absolute', top: 20, left: 16, right: 16, height: 80,
              border: '1px solid rgba(201,168,76,0.2)', borderRadius: 2
            }} />
            <div style={{ position: 'absolute', top: 120, left: 16, right: 16, height: 80,
              border: '1px solid rgba(201,168,76,0.2)', borderRadius: 2
            }} />
            <div style={{ position: 'absolute', top: 220, left: 16, right: 16, height: 50,
              border: '1px solid rgba(201,168,76,0.2)', borderRadius: 2
            }} />
            {/* Knob */}
            <div className="sim-door-knob" />
          </div>
          {/* Status label below door */}
          <div style={{ position: 'absolute', bottom: -36, left: 0, right: 0, textAlign: 'center',
            fontFamily: 'var(--font-mono)', fontSize: 13,
            color: status.doorUnlocked ? 'var(--green)' : 'var(--text-secondary)',
            letterSpacing: 2
          }}>
            {status.doorUnlocked ? `🔓 ${t('doorUnlocked')}` : `🔒 ${t('doorLocked')}`}
          </div>
        </div>

        {/* LEDs panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%',
          padding: 20, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)', borderRadius: 8
        }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)',
            letterSpacing: 3, textAlign: 'center', marginBottom: 4
          }}>CONTROL PANEL</div>

          {[
            { label: t('greenLED'), active: status.greenLED, cls: status.greenLED ? 'led-green' : 'led-off' },
            { label: t('redLED'),   active: status.redLED,   cls: status.redLED   ? 'led-red'   : 'led-off' },
            { label: t('buzzer'),   active: status.buzzer,   cls: buzz            ? 'led-red'   : 'led-off', isBuzz: true },
          ].map(({ label, cls, active, isBuzz }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)', letterSpacing: 1 }}>
                {label}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className={`led ${cls}`} style={isBuzz && buzz ? { borderRadius: 2 } : {}} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10,
                  color: active ? (cls.includes('green') ? 'var(--green)' : 'var(--red)') : '#555'
                }}>
                  {active ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>
          ))}

          {/* Status message */}
          <div style={{ marginTop: 8, padding: '8px 12px',
            background: status.doorUnlocked ? 'rgba(0,255,136,0.08)' : status.redLED ? 'rgba(255,51,51,0.08)' : 'rgba(201,168,76,0.05)',
            border: `1px solid ${status.doorUnlocked ? 'rgba(0,255,136,0.3)' : status.redLED ? 'rgba(255,51,51,0.3)' : 'var(--border)'}`,
            borderRadius: 4, textAlign: 'center',
            fontFamily: 'var(--font-mono)', fontSize: 12,
            color: status.doorUnlocked ? 'var(--green)' : status.redLED ? 'var(--red)' : 'var(--gold)'
          }}>
            {status.message || 'STANDBY'}
          </div>
        </div>
      </div>

      {/* Right: Event log */}
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)',
          letterSpacing: 3, marginBottom: 12
        }}>REAL-TIME EVENT LOG</div>
        <div style={{ background: '#000', border: '1px solid var(--border)', borderRadius: 4,
          padding: 14, height: 400, overflowY: 'auto', fontFamily: 'var(--font-mono)', fontSize: 12
        }}>
          {log.length === 0 ? (
            <span style={{ color: '#555' }}>Waiting for events...</span>
          ) : log.map((l, i) => (
            <div key={i} style={{ marginBottom: 6,
              color: l.type === 'auth' ? 'var(--green)' : l.type === 'deny' ? 'var(--red)' : 'var(--gold)'
            }}>
              <span style={{ color: '#555' }}>[{l.time}]</span> {l.msg}
            </div>
          ))}
        </div>

        {/* Live indicator */}
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8,
          fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)'
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)',
            boxShadow: '0 0 8px var(--green)', animation: 'pulse-gold 2s infinite'
          }} />
          LIVE · Polling backend every 1.5s
        </div>
      </div>
    </div>
  );
}
