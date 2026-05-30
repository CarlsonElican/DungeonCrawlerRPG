import type { RefObject } from 'react';
import { Swords } from 'lucide-react';
import { getEnemySprite, getPlayerSprite } from '../../config/sprites';
import type { Character, CombatResult } from '../../types/game';

interface CombatPanelProps {
  character: Character;
  combatLogRef: RefObject<HTMLDivElement | null>;
  combatResult: CombatResult;
  currentSimIndex: number;
  enemyMaxHp: number;
  enemyName: string;
  simulatedEnemyHp: number;
  simulatedLog: string[];
  simulatedPlayerHp: number;
  onAdvance: () => void;
}

export function CombatPanel({
  character,
  combatLogRef,
  combatResult,
  currentSimIndex,
  enemyMaxHp,
  enemyName,
  simulatedEnemyHp,
  simulatedLog,
  simulatedPlayerHp,
  onAdvance,
}: CombatPanelProps) {
  const isFinished = currentSimIndex >= combatResult.combat_log.length;

  return (
    <div className="sub-panel-ui">
      <div className="combat-stage-banner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div className="combat-fighter-block" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '160px', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
            <img
              src={getPlayerSprite()}
              alt={character.name}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', imageRendering: 'pixelated' }}
            />
          </div>
          <h4 className="combat-fighter-name">{character.name}</h4>
          <div className="combat-hp-track" style={{ width: '100%', marginTop: '8px' }}>
            <div className="combat-hp-fill" style={{ width: `${Math.max(0, (simulatedPlayerHp / character.total_hp) * 100)}%`, backgroundColor: '#10b981' }} />
          </div>
          <span className="combat-hp-text" style={{ marginTop: '4px' }}>HP: {simulatedPlayerHp} / {character.total_hp}</span>
        </div>

        <div style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--text)', fontStyle: 'italic' }}>VS</div>

        <div className="combat-fighter-block" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '160px', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
            <img
              src={getEnemySprite(enemyName)}
              alt={enemyName}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', imageRendering: 'pixelated' }}
            />
          </div>
          <h4 className="combat-fighter-name" style={{ color: '#ef4444' }}>{enemyName}</h4>
          <div className="combat-hp-track" style={{ width: '100%', marginTop: '8px' }}>
            <div className="combat-hp-fill" style={{ width: `${Math.max(0, (simulatedEnemyHp / enemyMaxHp) * 100)}%`, backgroundColor: '#ef4444' }} />
          </div>
          <span className="combat-hp-text" style={{ marginTop: '4px' }}>HP: {simulatedEnemyHp} / {enemyMaxHp}</span>
        </div>
      </div>

      <div className="combat-scroll-box" ref={combatLogRef} style={{ overflowY: 'auto' }}>
        {simulatedLog.map((line, index) => (
          <div key={`${line}-${index}`} style={{ color: getCombatLineColor(line) }}>{line}</div>
        ))}
      </div>

      {isFinished ? (
        <div className="combat-resolution-wrap">
          <h4 className="combat-resolution-title" style={{ color: combatResult.victory ? '#10b981' : '#ef4444' }}>
            {combatResult.victory ? "ROOM SECURED" : "YOU PERISHED"}
          </h4>
          {combatResult.victory ? (
            <p className="combat-resolution-reward" style={{ color: '#fbbf24' }}>Looted +{combatResult.gold_earned} Gold | Gained +{combatResult.exp_earned} EXP</p>
          ) : (
            <p className="combat-resolution-reward" style={{ color: '#f87171' }}>Fled to town. Lost half of your gold stash items.</p>
          )}
          <button onClick={onAdvance} className="btn-combat-advance">
            {combatResult.victory ? "Advance Forward" : "Return to Outpost"}
          </button>
        </div>
      ) : (
        <p style={{ fontSize: '0.85rem', color: 'var(--text)', fontStyle: 'italic', marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <Swords size={14} /> Resolving structural battle calculations...
        </p>
      )}
    </div>
  );
}

function getCombatLineColor(line: string) {
  if (line.includes('🩸')) return '#f87171';
  if (line.includes('⚔️')) return '#34d399';
  if (line.includes('✨') || line.includes('💚') || line.includes('❤️')) return '#4ade80';
  if (line.includes('🧛') || line.includes('🦇') || line.includes('Stealed')) return '#a78bfa';
  if (line.includes('💥')) return '#fbbf24';
  if (line.includes('💀')) return '#ef4444';
  return '#fff';
}
