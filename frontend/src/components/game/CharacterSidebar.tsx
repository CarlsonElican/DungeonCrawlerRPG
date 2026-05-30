import { ArrowLeft, Coins, Heart, Shield, Sparkle, Sparkles, Swords, Zap, Rabbit, WandSparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Character, CombatResult, GameRun } from '../../types/game';

interface CharacterSidebarProps {
  activeRun: GameRun | null;
  character: Character;
  combatResult: CombatResult | null;
  simulatedPlayerHp: number;
  onBackToSelection: () => void;
}

const SKILL_DESCRIPTIONS: Record<string, string> = {
  'Strike': 'An offensive passive granting a 30% chance to deal 1.5x heavy damage on attack.',
  'Guard': 'A defensive passive granting a 35% chance to cut incoming damage clean in half.',
  'Quickstep': 'An agility passive that grants a flat +20% bonus to your Evasion stat, making it much easier to dodge.',
  'First Aid': 'A supportive passive granting a 25% chance to restore 10% of your max HP when attacking.',
};

export function CharacterSidebar({
  activeRun,
  character,
  combatResult,
  simulatedPlayerHp,
  onBackToSelection,
}: CharacterSidebarProps) {
  const [showSkillDetail, setShowSkillDetail] = useState(false);
  const displayedHp = combatResult ? simulatedPlayerHp : character.current_hp;
  const expPercent = Math.min(100, Math.max(0, (character.experience / character.exp_cap) * 100));

  useEffect(() => {
    setShowSkillDetail(false);
  }, [character.character_id]);

  const skillName = character.starter_skill || 'None';
  const skillEffect = SKILL_DESCRIPTIONS[skillName] || 'No specific effect modifications mapped to this selection.';

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

          <div className="sidebar-vital-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: showSkillDetail ? '10px' : '0px' }}>
            <button
              type="button"
              onClick={() => skillName !== 'None' && setShowSkillDetail(!showSkillDetail)}
              disabled={skillName === 'None'}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                padding: 0,
                font: 'inherit',
                color: 'inherit',
                cursor: skillName !== 'None' ? 'pointer' : 'default',
                textAlign: 'left',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span className="sidebar-vital-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <WandSparkles size={16} color="var(--accent)" /> Skill
              </span>
              <span className="sidebar-vital-value" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: skillName !== 'None' ? 'var(--accent)' : undefined }}>
                {skillName}
                {skillName !== 'None' && (showSkillDetail ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
              </span>
            </button>

            {showSkillDetail && (
              <div style={{
                padding: '10px 12px',
                backgroundColor: '#1e293b',
                borderRadius: '6px',
                borderLeft: '3px solid #3b82f6',
                fontSize: '0.78rem',
                color: '#9ca3af',
                lineHeight: '1.4',
                animation: 'fadeIn 0.2s ease-in-out'
              }}>
                {skillEffect}
              </div>
            )}
          </div>
        </div>

        <h4 style={{ margin: '16px 0 12px 0', fontSize: '0.8rem', fontWeight: '700', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Attributes Matrix</h4>
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
            <p className="sidebar-run-row"><span>Rooms Cleared:</span> <strong className="sidebar-run-value">{activeRun.events_completed} / {activeRun.events_required}</strong></p>
            <p className="sidebar-run-row">
              <span>Boss Gate:</span>
              <strong className="sidebar-run-value" style={{ color: activeRun.boss_unlocked ? '#ef4444' : undefined }}>
                {activeRun.boss_unlocked ? 'Open' : 'Sealed'}
              </strong>
            </p>
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