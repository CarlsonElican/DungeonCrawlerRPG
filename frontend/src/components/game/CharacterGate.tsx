import type { FormEvent, MouseEvent } from 'react';
import { LogOut, Trash2, UserCheck, UserPlus } from 'lucide-react';
import type { Character, StarterStatAllocation, StarterStatKey } from '../../types/game';

interface CharacterGateProps {
  characters: Character[];
  isCreating: boolean;
  loading: boolean;
  newName: string;
  starterSkill: string;
  starterStatAllocation: StarterStatAllocation;
  starterStatPoints: number;
  onCreateCharacter: (event: FormEvent) => void;
  onDeleteCharacter: (event: MouseEvent, characterId: number, characterName: string) => void;
  onLogout: () => void;
  onSelectCharacter: (character: Character) => void;
  onSetCreating: (isCreating: boolean) => void;
  onSetNewName: (name: string) => void;
  onSetStarterSkill: (skill: string) => void;
  onSetStarterStatAllocation: (allocation: StarterStatAllocation) => void;
}

const STARTER_SKILLS = ['Strike', 'Guard', 'Quickstep', 'First Aid'];

const STAT_ROWS: Array<{
  key: StarterStatKey;
  label: string;
  base: string;
  gain: string;
  getValue: (points: number) => string;
}> = [
  { key: 'hp', label: 'Health', base: '50', gain: '+10 HP', getValue: points => `${50 + (points * 10)}` },
  { key: 'atk', label: 'Attack', base: '10', gain: '+1 ATK', getValue: points => `${10 + points}` },
  { key: 'def', label: 'Defense', base: '10', gain: '+1 DEF', getValue: points => `${10 + points}` },
  { key: 'spd', label: 'Speed', base: '50', gain: '+10 SPD', getValue: points => `${50 + (points * 10)}` },
  { key: 'critRate', label: 'Crit Rate', base: '5%', gain: '+1%', getValue: points => `${5 + points}%` },
  { key: 'eva', label: 'Evasion', base: '5%', gain: '+1%', getValue: points => `${5 + points}%` },
  { key: 'critDmg', label: 'Crit Damage', base: '1.50x', gain: '+0.10x', getValue: points => `${(1.5 + (points * 0.1)).toFixed(2)}x` },
  { key: 'lifesteal', label: 'Lifesteal', base: '0%', gain: '+1%', getValue: points => `${points}%` },
];

export function CharacterGate({
  characters,
  isCreating,
  loading,
  newName,
  starterSkill,
  starterStatAllocation,
  starterStatPoints,
  onCreateCharacter,
  onDeleteCharacter,
  onLogout,
  onSelectCharacter,
  onSetCreating,
  onSetNewName,
  onSetStarterSkill,
  onSetStarterStatAllocation,
}: CharacterGateProps) {
  const spentPoints = Object.values(starterStatAllocation).reduce((total, points) => total + points, 0);
  const remainingPoints = starterStatPoints - spentPoints;

  const updateStat = (stat: StarterStatKey, direction: 1 | -1) => {
    const currentValue = starterStatAllocation[stat];
    if (direction === 1 && remainingPoints <= 0) return;
    if (direction === -1 && currentValue <= 0) return;

    onSetStarterStatAllocation({
      ...starterStatAllocation,
      [stat]: currentValue + direction,
    });
  };

  return (
    <div className="auth-screen-wrapper">
      <div className="auth-card">
        {isCreating ? (
          <div>
            <h2 className="auth-title">Forge Your Hero</h2>
            <p className="auth-subtitle">Distribute {starterStatPoints} points, then choose a starter skill.</p>
            <form onSubmit={onCreateCharacter}>
              <div className="form-group">
                <label htmlFor="charName" className="form-label">Character Name</label>
                <input
                  id="charName"
                  placeholder="Enter name..."
                  value={newName}
                  onChange={event => onSetNewName(event.target.value)}
                  maxLength={25}
                  required
                  autoFocus
                  className="form-input"
                />
              </div>
              <div className="starter-builder">
                <div className="starter-builder-header">
                  <span>Stat Points</span>
                  <strong>{remainingPoints} Remaining</strong>
                </div>

                <div className="starter-stat-list">
                  {STAT_ROWS.map(row => (
                    <div key={row.key} className="starter-stat-row">
                      <div>
                        <span className="starter-stat-label">{row.label}</span>
                        <span className="starter-stat-meta">Base {row.base} | {row.gain}</span>
                      </div>
                      <div className="starter-stat-controls">
                        <button type="button" onClick={() => updateStat(row.key, -1)} disabled={starterStatAllocation[row.key] === 0}>-</button>
                        <span>{starterStatAllocation[row.key]}</span>
                        <button type="button" onClick={() => updateStat(row.key, 1)} disabled={remainingPoints === 0}>+</button>
                      </div>
                      <strong className="starter-stat-value">{row.getValue(starterStatAllocation[row.key])}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="starterSkill" className="form-label">Starter Skill</label>
                <select
                  id="starterSkill"
                  value={starterSkill}
                  onChange={event => onSetStarterSkill(event.target.value)}
                  className="form-input"
                >
                  {STARTER_SKILLS.map(skill => (
                    <option key={skill} value={skill}>{skill}</option>
                  ))}
                </select>
              </div>

              <button type="submit" disabled={loading || !newName.trim() || remainingPoints !== 0} className="btn-primary">
                {loading ? "Initializing..." : "Create Character"}
              </button>
              <button type="button" onClick={() => onSetCreating(false)} className="btn-secondary">
                Cancel
              </button>
            </form>
          </div>
        ) : (
          <>
            <div className="auth-icon-badge">
              <UserCheck size={36} />
            </div>
            <h2 className="auth-title">Select Your Hero</h2>
            <p className="auth-subtitle">Welcome back, champion. Select a hero or forge a new path.</p>

            <div className="character-select-grid">
              {characters.map(character => (
                <div key={character.character_id} style={{ display: 'flex', gap: '8px', width: '100%', alignItems: 'center' }}>
                  <button onClick={() => onSelectCharacter(character)} className="character-select-row" style={{ flex: 1 }}>
                    <span>{character.name}</span>
                    <span className="character-select-badge">Lv. {character.level}</span>
                  </button>

                  <button
                    onClick={event => onDeleteCharacter(event, character.character_id, character.name)}
                    style={{
                      padding: '12px',
                      backgroundColor: '#1f2937',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      color: '#ef4444',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background-color 0.2s',
                    }}
                    title="Delete Character"
                    onMouseEnter={event => event.currentTarget.style.backgroundColor = '#2d1a1a'}
                    onMouseLeave={event => event.currentTarget.style.backgroundColor = '#1f2937'}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}

              <button onClick={() => onSetCreating(true)} className="btn-forge-hero" style={{ width: '100%' }}>
                <UserPlus size={18} /> Forge New Hero
              </button>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '24px 0' }} />

            <button onClick={onLogout} className="btn-logout">
              <LogOut size={16} /> Logout
            </button>
          </>
        )}
      </div>
    </div>
  );
}
