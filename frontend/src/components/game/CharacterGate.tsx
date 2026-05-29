import type { FormEvent, MouseEvent } from 'react';
import { LogOut, Trash2, UserCheck, UserPlus } from 'lucide-react';
import type { Character } from '../../types/game';

interface CharacterGateProps {
  characters: Character[];
  isCreating: boolean;
  loading: boolean;
  newName: string;
  onCreateCharacter: (event: FormEvent) => void;
  onDeleteCharacter: (event: MouseEvent, characterId: number, characterName: string) => void;
  onLogout: () => void;
  onSelectCharacter: (character: Character) => void;
  onSetCreating: (isCreating: boolean) => void;
  onSetNewName: (name: string) => void;
}

export function CharacterGate({
  characters,
  isCreating,
  loading,
  newName,
  onCreateCharacter,
  onDeleteCharacter,
  onLogout,
  onSelectCharacter,
  onSetCreating,
  onSetNewName,
}: CharacterGateProps) {
  return (
    <div className="auth-screen-wrapper">
      <div className="auth-card">
        {isCreating ? (
          <div>
            <h2 className="auth-title">Forge Your Hero</h2>
            <p className="auth-subtitle">Base Attributes: HP: 100 | ATK: 25 | DEF: 7 | SPD: 100</p>
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
              <button type="submit" disabled={loading || !newName.trim()} className="btn-primary">
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
