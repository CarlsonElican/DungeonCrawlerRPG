import { Sparkles } from 'lucide-react';
import type { Character } from '../../types/game';

interface LevelUpModalProps {
  after: Character;
  before: Character;
  onClose: () => void;
}

const STAT_ROWS = [
  { label: 'Level', getValue: (character: Character) => character.level },
  { label: 'Current HP', getValue: (character: Character) => character.current_hp },
  { label: 'Max HP', getValue: (character: Character) => character.total_hp },
  { label: 'Attack', getValue: (character: Character) => character.total_atk },
  { label: 'Defense', getValue: (character: Character) => character.total_def },
  { label: 'Speed', getValue: (character: Character) => character.total_spd },
  { label: 'EXP Cap', getValue: (character: Character) => character.exp_cap },
  { label: 'Evasion', getValue: (character: Character) => `${(character.total_eva * 100).toFixed(0)}%` },
  { label: 'Crit Rate', getValue: (character: Character) => `${(character.total_crit_rate * 100).toFixed(0)}%` },
  { label: 'Lifesteal', getValue: (character: Character) => `${(character.total_lifesteal * 100).toFixed(0)}%` },
];

export function LevelUpModal({ after, before, onClose }: LevelUpModalProps) {
  return (
    <div className="level-up-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="level-up-title">
      <div className="level-up-modal">
        <div className="level-up-modal-icon">
          <Sparkles size={30} />
        </div>
        <h2 id="level-up-title" className="level-up-modal-title">Level Up</h2>
        <p className="level-up-modal-subtitle">{after.name} reached Level {after.level}</p>

        <div className="level-up-stat-list">
          {STAT_ROWS.map(row => {
            const beforeValue = row.getValue(before);
            const afterValue = row.getValue(after);
            const changed = beforeValue !== afterValue;

            return (
              <div key={row.label} className={changed ? 'level-up-stat-row is-improved' : 'level-up-stat-row'}>
                <span className="level-up-stat-label">{row.label}</span>
                <span className="level-up-stat-values">
                  <span>{beforeValue}</span>
                  <span className="level-up-stat-arrow">&rarr;</span>
                  <strong>{afterValue}</strong>
                </span>
              </div>
            );
          })}
        </div>

        <button onClick={onClose} className="btn-primary level-up-modal-btn">
          Continue
        </button>
      </div>
    </div>
  );
}
