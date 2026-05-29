import { Swords } from 'lucide-react';
import type { GameEvent } from '../../types/game';

interface ThreatPanelProps {
  event: GameEvent;
  loading: boolean;
  onStartCombat: () => void;
}

export function ThreatPanel({ event, loading, onStartCombat }: ThreatPanelProps) {
  return (
    <div className="center-state-notice" style={{ border: '1px dashed #ef4444', padding: '24px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.02)' }}>
      <h3 className="center-state-title" style={{ color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        <Swords size={22} /> Threat Detected
      </h3>
      <p className="center-state-desc" style={{ color: 'var(--text-h)' }}>
        A hostile <strong>{event.result.enemy_name || "Unknown Fiend"}</strong> bars your advance. Steel yourself.
      </p>
      <button
        onClick={onStartCombat}
        disabled={loading}
        className="btn-adventure-start"
        style={{ backgroundColor: '#ef4444', color: '#fff', boxShadow: '0 4px 12px rgba(239,68,68,0.2)', fontWeight: '700' }}
      >
        Fight Your Way In
      </button>
    </div>
  );
}

interface NonCombatEventPanelProps {
  event: GameEvent;
  loading: boolean;
  onResolveEvent: () => void;
}

export function NonCombatEventPanel({ event, loading, onResolveEvent }: NonCombatEventPanelProps) {
  return (
    <div className="center-state-notice">
      <h4 style={{ margin: '0 0 8px 0', color: '#2563eb', fontSize: '1.3rem', fontWeight: '800' }}>{event.template.name}</h4>
      <p style={{ color: 'var(--text)', fontSize: '1rem', margin: '0 0 20px 0', lineHeight: '1.5' }}>{event.template.description}</p>
      <button onClick={onResolveEvent} disabled={loading} className="btn-combat-advance" style={{ backgroundColor: '#2563eb', color: '#fff' }}>Proceed</button>
    </div>
  );
}
