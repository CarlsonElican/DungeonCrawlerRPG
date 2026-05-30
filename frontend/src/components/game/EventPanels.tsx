import { Swords } from 'lucide-react';
import type { GameEvent } from '../../types/game';

interface ThreatPanelProps {
  event: GameEvent;
  loading: boolean;
  onStartCombat: () => void;
  onBack: () => void;
}

export function ThreatPanel({ event, loading, onStartCombat, onBack }: ThreatPanelProps) {
  return (
    <div className="center-state-notice" style={{ border: '1px dashed #ef4444', padding: '24px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.02)' }}>
      <h3 className="center-state-title" style={{ color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        <Swords size={22} /> Threat Detected
      </h3>
      <p className="center-state-desc" style={{ color: 'var(--text-h)' }}>
        A hostile <strong>{event.result.enemy_name || "Unknown Fiend"}</strong> bars your advance. Steel yourself.
      </p>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '16px' }}>
        <button
          onClick={onStartCombat}
          disabled={loading}
          className="btn-adventure-start"
          style={{ backgroundColor: '#ef4444', color: '#fff', boxShadow: '0 4px 12px rgba(239,68,68,0.2)', fontWeight: '700', flex: 1, padding: '12px', fontSize: '1rem' }}
        >
          Fight Your Way In
        </button>
        <button onClick={onBack} className="btn-secondary" style={{ flex: 1, padding: '12px', fontSize: '1rem' }}>
          Not Ready
        </button>
      </div>
    </div>
  );
}

interface NonCombatEventPanelProps {
  event: GameEvent;
  loading: boolean;
  onResolveEvent: () => void;
  onSkipEvent: () => void;
  onBack: () => void;
}

export function NonCombatEventPanel({ event, loading, onResolveEvent, onSkipEvent, onBack }: NonCombatEventPanelProps) {
  return (
    <div className="center-state-notice">
      <h4 style={{ margin: '0 0 8px 0', color: '#2563eb', fontSize: '1.3rem', fontWeight: '800' }}>{event.template.name}</h4>
      <p style={{ color: 'var(--text)', fontSize: '1rem', margin: '0 0 20px 0', lineHeight: '1.5' }}>{event.template.description}</p>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={onResolveEvent} disabled={loading} className="btn-combat-advance" style={{ backgroundColor: '#2563eb', color: '#fff', flex: '1 1 100%', marginBottom: '4px' }}>Proceed</button>
        <button onClick={onSkipEvent} disabled={loading} className="btn-secondary" style={{ flex: 1 }}>Pass By</button>
        <button onClick={onBack} disabled={loading} className="btn-secondary" style={{ flex: 1 }}>Decide Later</button>
      </div>
    </div>
  );
}
