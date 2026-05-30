import type { FormEvent, MouseEvent } from 'react';
import { useState, useEffect } from 'react';
import { LogOut, Trash2, UserCheck, UserPlus } from 'lucide-react';
import { api } from '../../api';
import type { Character, StarterStatAllocation, StarterStatKey } from '../../types/game';

interface SkillTemplate {
  name: string;
  description: string;
}

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
  const [availableSkills, setAvailableSkills] = useState<SkillTemplate[]>([]);

  useEffect(() => {
    if (isCreating) {
      api.get<SkillTemplate[]>('/skills/templates')
        .then((response) => {
          const data = response.data;
          setAvailableSkills(data);

          if (data.length > 0 && !starterSkill) {
            onSetStarterSkill(data[0].name);
          }
        })
        .catch((err) => console.error("Failed to load skills via Axios client:", err));
    }
  }, [isCreating]);

  const spentPoints = Object.values(starterStatAllocation).reduce((total, points) => total + points, 0);
  const remainingPoints = starterStatPoints - spentPoints;

  const handleSubmitValidation = (event: FormEvent) => {
    event.preventDefault();

    if (remainingPoints !== 0) {
      alert(`🚨 Character Creation Halted!\n\nYou must distribute all ${starterStatPoints} stat points. You currently have ${remainingPoints} unspent points remaining.`);
      return;
    }

    onCreateCharacter(event);
  };

  const updateStat = (stat: StarterStatKey, direction: 1 | -1) => {
    const currentValue = starterStatAllocation[stat];
    if (direction === 1 && remainingPoints <= 0) return;
    if (direction === -1 && currentValue <= 0) return;

    onSetStarterStatAllocation({
      ...starterStatAllocation,
      [stat]: currentValue + direction,
    });
  };

  const selectedSkillDetails = availableSkills.find(s => s.name === starterSkill);

  return (
    <div className="auth-screen-wrapper">
      <div className="auth-card" style={{ maxWidth: isCreating ? '540px' : '440px', transition: 'max-width 0.2s' }}>
        {isCreating ? (
          <div>
            <h2 className="auth-title">Forge Your Hero</h2>
            <p className="auth-subtitle">Distribute {starterStatPoints} points, then choose a starter skill.</p>
            <form onSubmit={handleSubmitValidation}>
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
                  <strong style={{ color: remainingPoints > 0 ? '#eab308' : '#22c55e' }}>
                    {remainingPoints} Remaining
                  </strong>
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

              <div className="form-group" style={{ marginTop: '20px' }}>
                <label htmlFor="starterSkillSelect" className="form-label">Starter Ability</label>
                <select
                  id="starterSkillSelect"
                  value={starterSkill}
                  onChange={(event) => onSetStarterSkill(event.target.value)}
                  className="form-input"
                  style={{
                    width: '100%',
                    marginTop: '8px',
                    backgroundColor: '#111827',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f3f4f6',
                    cursor: 'pointer',
                    padding: '10px 12px'
                  }}
                >
                  {availableSkills.map(skill => (
                    <option key={skill.name} value={skill.name} style={{ backgroundColor: '#111827', color: '#f3f4f6' }}>
                      {skill.name}
                    </option>
                  ))}
                </select>

                <div style={{
                  marginTop: '8px',
                  padding: '10px 12px',
                  backgroundColor: '#1e293b',
                  borderRadius: '6px',
                  borderLeft: '3px solid #3b82f6',
                  fontSize: '12px',
                  color: '#9ca3af',
                  lineHeight: '1.4',
                  height: '54px',
                  overflowY: 'auto',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  {selectedSkillDetails ? selectedSkillDetails.description : "Select an ability to view its details."}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !newName.trim()}
                className="btn-primary"
                style={{
                  marginTop: '16px',
                  opacity: remainingPoints !== 0 ? 0.6 : 1,
                  filter: remainingPoints !== 0 ? 'grayscale(30%)' : 'none'
                }}
              >
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