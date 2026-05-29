import { ArrowLeft, Coins, Heart, Shield, Sparkle, Sparkles, Swords, Zap, Rabbit } from 'lucide-react';
import type { Character, CombatResult, GameRun } from '../../types/game';

interface CharacterSidebarProps {
  activeRun: GameRun | null;
  character: Character;
  combatResult: CombatResult | null;
  simulatedPlayerHp: number;
  onBackToSelection: () => void;
}

export function CharacterSidebar({
  activeRun,
  character,
  combatResult,
  simulatedPlayerHp,
  onBackToSelection,
}: CharacterSidebarProps) {
  const displayedHp = combatResult ? simulatedPlayerHp : character.current_hp;
  const expPercent = Math.min(100, Math.max(0, (character.experience / character.exp_cap) * 100));

  return (
    <div className="game-sidebar-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        <div className="sidebar-profile-header">
          <h3 className="sidebar-profile-title">{character.name}</h3>
          <span className="sidebar-profile-level">Lv. {character.level}</span>
        </div>

        <div className="sidebar-vital-list">
          <div className="sidebar-vital-row">
            <span className="sidebar-vital-label">
              <Heart size={16} color="#ef4444" fill="#ef4444" /> Health
            </span>
            <span className="sidebar-vital-value">
              {displayedHp} / {character.total_hp}
            </span>
          </div>
          <div className="sidebar-vital-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="sidebar-vital-label">
                <Sparkles size={16} color="var(--accent)" /> Experience
              </span>
              <span className="sidebar-vital-value">
                {character.experience} / {character.exp_cap}
              </span>
            </div>
            <div className="combat-hp-track">
              <div className="combat-hp-fill" style={{ width: `${expPercent}%`, backgroundColor: 'var(--accent)' }} />
            </div>
          </div>
          <div className="sidebar-vital-row">
            <span className="sidebar-vital-label"><Coins size={16} color="#fbbf24" fill="#fbbf24" /> Gold Wealth</span>
            <span className="sidebar-vital-value" style={{ color: '#fbbf24' }}>{character.current_gold}</span>
          </div>
        </div>

        <h4 style={{ margin: '0 0 12px 0', fontSize: '0.8rem', fontWeight: '700', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Attributes Matrix</h4>
        <div className="attribute-matrix-container">
          <div className="attribute-matrix-row">
            <span><Swords size={14} color="#9ca3af" /> Attack Power</span>
            <span className="attribute-matrix-value">{character.total_atk}</span>
          </div>
          <div className="attribute-matrix-row">
            <span><Shield size={14} color="#9ca3af" /> Defense Rating</span>
            <span className="attribute-matrix-value">{character.total_def}</span>
          </div>
          <div className="attribute-matrix-row">
            <span><Zap size={14} color="#9ca3af" /> Speed Stat</span>
            <span className="attribute-matrix-value">{character.total_spd}</span>
          </div>
          <div className="attribute-matrix-row">
            <span><Rabbit size={14} color="#9ca3af" /> Evasion Rate</span>
            <span className="attribute-matrix-value">{(character.total_eva * 100).toFixed(0)}%</span>
          </div>
          <div className="attribute-matrix-row">
            <span><Sparkle size={14} color="#9ca3af" /> Crit Rate</span>
            <span className="attribute-matrix-value">{(character.total_crit_rate * 100).toFixed(0)}%</span>
          </div>
          <div className="attribute-matrix-row">
            <span><Sparkles size={14} color="#9ca3af" /> Crit Damage</span>
            <span className="attribute-matrix-value">{character.total_crit_dmg.toFixed(2)}x</span>
          </div>
          <div className="attribute-matrix-row">
            <span><Heart size={14} color="#9ca3af" /> Lifesteal</span>
            <span className="attribute-matrix-value">{(character.total_lifesteal * 100).toFixed(0)}%</span>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '20px 0' }} />

        {activeRun ? (
          <div className="sidebar-run-tracker">
            <p className="sidebar-run-row"><span>Current Floor:</span> <strong className="sidebar-run-value">{activeRun.current_floor}</strong></p>
            <p className="sidebar-run-row"><span>Room Matrix Index:</span> <strong className="sidebar-run-value">{activeRun.current_room}</strong></p>
          </div>
        ) : (
          <p style={{ fontSize: '0.85rem', color: '#4b5563', margin: 0, textAlign: 'center', fontStyle: 'italic' }}>No active progression data.</p>
        )}

        <div className="sidebar-run-tracker" style={{ marginTop: '12px' }}>
          <p className="sidebar-run-row"><span>Kills:</span> <strong className="sidebar-run-value">{character.kills}</strong></p>
          <p className="sidebar-run-row"><span>Deaths:</span> <strong className="sidebar-run-value">{character.deaths}</strong></p>
        </div>
      </div>

      <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
        <button
          onClick={onBackToSelection}
          className="btn-back-selection"
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', fontSize: '0.85rem', fontWeight: '600', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text-h)', cursor: 'pointer' }}
        >
          <ArrowLeft size={14} /> Back to Heroes
        </button>
      </div>
    </div>
  );
}
