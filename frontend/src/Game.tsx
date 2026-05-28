import React, { useState, useEffect, useCallback } from 'react';
import { api } from './api';
import {
  Swords, Heart, Shield, Zap, Sparkles, Skull, Coins, LogOut, ChevronRight, Store, UserPlus, UserCheck, ArrowLeft, Trash2
} from 'lucide-react';
import './app.css';
import { getEnemySprite, getPlayerSprite } from './config/sprites';

interface User {
  user_id: number;
  username: string;
  email: string;
  created_at: string;
}

interface Character {
  character_id: number;
  name: string;
  level: number;
  current_gold: number;
  total_hp: number;
  current_hp?: number;
  total_atk: number;
  total_def: number;
  total_spd: number;
  total_eva: number;
  total_crit_rate: number;
  total_lifesteal: number;
}

interface GameRun {
  run_id: number;
  current_floor: number;
  current_room: number;
}

interface GameEvent {
  template: {
    event_template_id: number;
    name: string;
    description: string;
    event_type: string;
  };
  result: {
    event_result_id: number;
    result_type: string;
    notes: string;
    enemy_id?: number;
    enemy_name?: string;
    enemy_hp?: number;
  };
}

interface GameProps {
  currentUser: User;
  onLogout: () => void;
}

const Game: React.FC<GameProps> = ({ currentUser, onLogout }) => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);
  const [activeRun, setActiveRun] = useState<GameRun | null>(null);
  const [currentEvent, setCurrentEvent] = useState<GameEvent | null>(null);
  const [logs, setLogs] = useState<string[]>(["Welcome to the Dungeon..."]);
  const [isCreating, setIsCreating] = useState(false);
  const [isInShop, setIsInShop] = useState(false);
  const [isInInventory, setIsInInventory] = useState(false);
  const [shopOffers, setShopOffers] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [newName, setNewName] = useState("");

  const [combatResult, setCombatResult] = useState<{
    victory: boolean;
    gold_earned: number;
    exp_earned: number;
    level_up_triggered: boolean;
    combat_log: string[];
  } | null>(null);

  const [simulatedLog, setSimulatedLog] = useState<string[]>([]);
  const [currentSimIndex, setCurrentSimIndex] = useState<number>(0);
  const [simPlayerHp, setSimPlayerHp] = useState<number>(10);
  const [simEnemyHp, setSimEnemyHp] = useState<number>(10);
  const [enemyMaxHp, setEnemyMaxHp] = useState<number>(10);
  const [enemyName, setEnemyName] = useState<string>("Monster");

  const fetchCharacters = useCallback(async () => {
    try {
      const res = await api.get(`/characters/me`);
      setCharacters(res.data);
      if (res.data.length === 0) {
        setIsCreating(true);
      }
    } catch (err) {
      console.error("Failed to fetch characters", err);
    }
  }, []);

  useEffect(() => {
    fetchCharacters();
  }, [fetchCharacters]);

  useEffect(() => {
    if (!combatResult || currentSimIndex >= combatResult.combat_log.length) return;

    const timer = setTimeout(() => {
      const nextLine = combatResult.combat_log[currentSimIndex];
      setSimulatedLog(prev => [...prev, nextLine]);

      const hpMatch = nextLine.match(/\((\d+)\/\d+\s+HP\)/);
      if (hpMatch) {
        const remainingHp = parseInt(hpMatch[1], 10);

        const enemyTookDamage = nextLine.includes(`deals`) || nextLine.includes('⚔️');
        const playerTookDamage = nextLine.includes('hits you') || nextLine.includes('🩸');

        if (enemyTookDamage) {
          setSimEnemyHp(remainingHp);
        } else if (playerTookDamage) {
          setSimPlayerHp(remainingHp);
        }
      }

      setCurrentSimIndex(prev => prev + 1);
    }, 600);

    return () => clearTimeout(timer);
  }, [combatResult, currentSimIndex, enemyName]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-10), `> ${msg}`]);
  };

  const selectCharacter = async (char: Character) => {
    setSelectedChar(char);
    addLog(`Character ${char.name} selected.`);
    try {
      const res = await api.get(`/runs/active/${char.character_id}`);
      setActiveRun(res.data);
      addLog(`Resuming run at Floor ${res.data.current_floor}, Room ${res.data.current_room}.`);
    } catch (err) {
      addLog("No active run found. Ready to explore.");
    }
  };

  const handleCreateCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setLoading(true);

    const characterPayload = {
      name: newName,
      user_id: currentUser.user_id,
      base_hp: 25,
      base_atk: 8,
      base_def: 7,
      base_spd: 100,
      base_eva: 0.05,
      base_crit_rate: 0.05,
      base_crit_dmg: 1.50,
      base_lifesteal: 0.00,
      starter_skill: "Strike"
    };

    try {
      const res = await api.post('/characters/create', characterPayload);
      addLog(`Hero ${res.data.name} has been born with baseline stats!`);
      setCharacters([...characters, res.data]);
      setIsCreating(false);
      setSelectedChar(res.data);
      setNewName("");
    } catch (err) {
      addLog("Failed to create character. Check backend logs.");
    } finally {
      setLoading(false);
    }
  };

  const deleteCharacter = async (e: React.MouseEvent, characterId: number, characterName: string) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to permanently delete ${characterName}?`)) return;

    try {
      await api.delete(`/characters/${characterId}`);
      setCharacters(prev => prev.filter(c => c.character_id !== characterId));
      addLog(`Character ${characterName} was permanently deleted.`);
    } catch (err) {
      addLog("Failed to delete character. Ensure backend router supports DELETE /characters/{id}");
    }
  };

  const openShop = async () => {
    if (!selectedChar) return;
    setLoading(true);
    try {
      let currentRun = activeRun;

      if (!currentRun) {
        setCombatResult(null);
        setSimulatedLog([]);
        setCurrentSimIndex(0);
        setCurrentEvent(null);

        const runRes = await api.post(`/runs/start/${selectedChar.character_id}`);
        currentRun = runRes.data;
        setActiveRun(currentRun);
        addLog("Stepped into the underground trading outpost...");
      }

      if (!currentRun) {
        addLog("Unable to establish a secure connection to the dungeon servers.");
        setLoading(false);
        return;
      }

      const res = await api.get(`/shop/offers/${currentRun.run_id}`);
      setShopOffers(res.data);
      setIsInShop(true);
      setIsInInventory(false);
      addLog("The merchant opens his pack...");
    } catch (err) {
      addLog("The shop is closed right now.");
    } finally {
      setLoading(false);
    }
  };

  const openInventory = async () => {
    if (!selectedChar) return;
    setLoading(true);
    try {
      const res = await api.get(`/inventory/${selectedChar.character_id}`);
      setInventoryItems(res.data);
      setIsInInventory(true);
      setIsInShop(false);
      addLog("Opening your adventurer knapsack...");
    } catch (err) {
      addLog("Failed to look into your backpack right now.");
    } finally {
      setLoading(false);
    }
  };

  const buyItem = async (offer: any) => {
    try {
      await api.post(`/shop/buy/${activeRun?.run_id}`, offer);
      addLog(`Bought ${offer.item_name}!`);
      setIsInShop(false);
      const charRes = await api.get(`/characters/${selectedChar?.character_id}`);
      setSelectedChar(charRes.data);
    } catch (err: any) {
      addLog(err.response?.data?.detail || "Purchase failed.");
    }
  };

  const exploreNextRoom = async () => {
    if (!selectedChar) return;
    setLoading(true);
    try {
      let currentRun = activeRun;

      if (!currentRun) {
        setCombatResult(null);
        setSimulatedLog([]);
        setCurrentSimIndex(0);

        const runRes = await api.post(`/runs/start/${selectedChar.character_id}`);
        currentRun = runRes.data;
        setActiveRun(currentRun);
        addLog("Crossed the heavy iron gates into the depths...");
      }

      const res = await api.get(`/events/next?level=${selectedChar.level}`);
      const eventType = res.data.template.event_type.toLowerCase();

      if (res.data.template?.description) {
        addLog(res.data.template.description);
      }

      setCurrentEvent(res.data);

      if (eventType === 'enemy' || eventType === 'monster' || eventType === 'combat') {
        addLog(`Encountered a dangerous foe: ${res.data.result.enemy_name || "Unknown Horrific Foe"}!`);
      }
    } catch (err) {
      addLog("Failed to explore the room safely. (Check terminal logs)");
    } finally {
      setLoading(false);
    }
  };

  const startCombat = async () => {
    if (!activeRun || !currentEvent || !selectedChar) return;
    setLoading(true);
    try {
      const parsedEnemyName = currentEvent.result.enemy_name || "Unknown Horrific Foe";

      const combatRes = await api.post(`/combat/resolve/${activeRun.run_id}`, {
        event_template_id: currentEvent.template.event_template_id
      });

      setEnemyName(parsedEnemyName);
      setEnemyMaxHp(currentEvent.result.enemy_hp || 40);
      setSimEnemyHp(currentEvent.result.enemy_hp || 40);
      setSimPlayerHp(selectedChar.current_hp ?? selectedChar.total_hp);
      setSimulatedLog([]);
      setCurrentSimIndex(0);

      setCombatResult(combatRes.data);
      setCurrentEvent(null);

      if (!combatRes.data.victory) {
        setActiveRun(null);
      }
    } catch (err) {
      addLog("Error initiating combat sequence.");
    } finally {
      setLoading(false);
    }
  };

  const resolveEvent = async () => {
    if (!activeRun || !currentEvent) return;
    setLoading(true);
    try {
      await api.post(`/runs/${activeRun.run_id}/complete-event`, {
        event_template_id: currentEvent.template.event_template_id,
        event_result_id: currentEvent.result.event_result_id
      });

      addLog(currentEvent.result.notes);

      setActiveRun({
        ...activeRun,
        current_room: activeRun.current_room + 1
      });

      setCurrentEvent(null);
      const charRes = await api.get(`/characters/${selectedChar?.character_id}`);
      setSelectedChar(charRes.data);

    } catch (err) {
      addLog("Error resolving event.");
    } finally {
      setLoading(false);
    }
  };

  if (!selectedChar) {
    return (
      <div className="auth-screen-wrapper">
        <div className="auth-card">
          {isCreating ? (
            <div>
              <h2 className="auth-title">Forge Your Hero</h2>
              <p className="auth-subtitle">Base Attributes: HP: 25 | ATK: 8 | DEF: 7 | SPD: 100</p>
              <form onSubmit={handleCreateCharacter}>
                <div className="form-group">
                  <label htmlFor="charName" className="form-label">Character Name</label>
                  <input
                    id="charName"
                    placeholder="Enter name..."
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    maxLength={25}
                    required
                    autoFocus
                    className="form-input"
                  />
                </div>
                <button type="submit" disabled={loading || !newName.trim()} className="btn-primary">
                  {loading ? "Initializing..." : "Create Character"}
                </button>
                <button type="button" onClick={() => setIsCreating(false)} className="btn-secondary">
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
                {characters.map(c => (
                  // ⚔️ UPDATED CONTAINER: Holds selection row and delete button side-by-side
                  <div key={c.character_id} style={{ display: 'flex', gap: '8px', width: '100%', alignItems: 'center' }}>
                    <button onClick={() => selectCharacter(c)} className="character-select-row" style={{ flex: 1 }}>
                      <span>⚔️ {c.name}</span>
                      <span className="character-select-badge">Lv. {c.level}</span>
                    </button>

                    {/* Trash Delete Action Button */}
                    <button
                      onClick={(e) => deleteCharacter(e, c.character_id, c.name)}
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
                        transition: 'background-color 0.2s'
                      }}
                      title="Delete Character"
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2d1a1a'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1f2937'}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}

                <button onClick={() => setIsCreating(true)} className="btn-forge-hero" style={{ width: '100%' }}>
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

  return (
    <div className="game-world-layout">
      <div className="game-main-grid">

        {/* Sidebar Component */}
        <div className="game-sidebar-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="sidebar-profile-header">
              <h3 className="sidebar-profile-title">{selectedChar.name}</h3>
              <span className="sidebar-profile-level">Lv. {selectedChar.level}</span>
            </div>

            <div className="sidebar-vital-list">
              <div className="sidebar-vital-row">
                <span className="sidebar-vital-label">
                  <Heart size={16} color="#ef4444" fill="#ef4444" /> Health
                </span>
                <span className="sidebar-vital-value">
                  {combatResult ? simPlayerHp : (selectedChar.current_hp ?? selectedChar.total_hp)} / {selectedChar.total_hp}
                </span>
              </div>
              <div className="sidebar-vital-row">
                <span className="sidebar-vital-label"><Coins size={16} color="#fbbf24" fill="#fbbf24" /> Gold Wealth</span>
                <span className="sidebar-vital-value" style={{ color: '#fbbf24' }}>{selectedChar.current_gold}</span>
              </div>
            </div>

            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.8rem', fontWeight: '700', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Attributes Matrix</h4>
            <div className="attribute-matrix-container">
              <div className="attribute-matrix-row">
                <span><Swords size={14} color="#9ca3af" /> Attack Power</span>
                <span className="attribute-matrix-value">{selectedChar.total_atk}</span>
              </div>
              <div className="attribute-matrix-row">
                <span><Shield size={14} color="#9ca3af" /> Defense Rating</span>
                <span className="attribute-matrix-value">{selectedChar.total_def}</span>
              </div>
              <div className="attribute-matrix-row">
                <span><Zap size={14} color="#9ca3af" /> Speed Stat</span>
                <span className="attribute-matrix-value">{selectedChar.total_spd}</span>
              </div>
              <div className="attribute-matrix-row">
                <span><Sparkles size={14} color="#9ca3af" /> Evasion Rate</span>
                <span className="attribute-matrix-value">{(selectedChar.total_eva * 100).toFixed(0)}%</span>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '6px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text)' }}>
                <span>Crit: {(selectedChar.total_crit_rate * 100).toFixed(0)}%</span>
                <span>Lifesteal: {(selectedChar.total_lifesteal * 100).toFixed(0)}%</span>
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
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
            <button
              onClick={() => setSelectedChar(null)}
              className="btn-back-selection"
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', fontSize: '0.85rem', fontWeight: '600', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text-h)', cursor: 'pointer' }}
            >
              <ArrowLeft size={14} /> Back to Heroes
            </button>
          </div>
        </div>

        {/* Dashboard Display Components */}
        <div className="interactive-screen-panel">
          <div className="terminal-scroll-log">
            {logs.map((log, i) => (
              <div key={i} style={{ color: i === logs.length - 1 ? 'var(--accent)' : 'var(--text)' }}>{log}</div>
            ))}
          </div>

          <div className="dynamic-panel-container">
            {isInShop ? (
              <div className="sub-panel-ui">
                <h4 className="sub-panel-title" style={{ color: '#fbbf24' }}><Store size={22} /> Merchant Camp</h4>
                <div className="sub-panel-grid">
                  {shopOffers.map((offer, i) => (
                    <button key={i} onClick={() => buyItem(offer)} className="sub-panel-card">
                      <div style={{ color: offer.hex_color, fontWeight: '700', fontSize: '1.05rem', marginBottom: '4px' }}>
                        [{offer.rarity_name}] {offer.item_name}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text)', margin: '4px 0' }}>
                        Standard Item
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#fbbf24', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px' }}>
                        💰 {offer.dynamic_gold_cost} Gold
                      </div>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setIsInShop(false);
                    addLog("You step out of the shop and back into the dark corridor.");
                  }}
                  className="btn-panel-close"
                >
                  Leave Shop
                </button>
              </div>
            ) : isInInventory ? (
              <div className="sub-panel-ui">
                <h4 className="sub-panel-title" style={{ color: 'var(--accent)' }}><Sparkles size={22} /> Equipment Backpack</h4>
                {inventoryItems.length === 0 ? (
                  <p style={{ color: 'var(--text)', fontSize: '0.95rem', margin: '30px 0', fontStyle: 'italic' }}>Your backpack is completely empty.</p>
                ) : (
                  <div className="sub-panel-grid">
                    {inventoryItems.map((item, i) => (
                      <div key={i} className="sub-panel-card" style={{ border: item.is_equipped ? '1px solid #10b981' : '1px solid var(--border)', cursor: 'default' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                          <span style={{ color: item.hex_color, fontWeight: '700' }}>[{item.rarity_name}] {item.item_name}</span>
                          {item.is_equipped && <span style={{ color: '#10b981', fontSize: '0.7rem', fontWeight: '800', backgroundColor: '#142f26', padding: '2px 6px', borderRadius: '4px' }}>EQUIPPED</span>}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-h)', marginTop: '4px' }}>C_ATK: +{item.total_item_atk} | C_DEF: +{item.total_item_def}</div>
                        {!item.is_equipped && (
                          <button
                            onClick={async () => {
                              try {
                                await api.post(`/inventory/equip/${selectedChar.character_id}`, {
                                  inventory_item_id: item.inventory_item_id,
                                  slot: item.item_type.toLowerCase() === 'weapon' ? 'Weapon' : 'Armor'
                                });
                                addLog(`Equipped ${item.item_name} safely!`);
                                openInventory();
                                const charRes = await api.get(`/characters/${selectedChar.character_id}`);
                                setSelectedChar(charRes.data);
                              } catch (err) {
                                addLog("Failed to equip item.");
                              }
                            }}
                            style={{ marginTop: '8px', width: 'fit-content', padding: '6px 14px', fontSize: '0.85rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                          >
                            Equip
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => {
                    setIsInInventory(false);
                    addLog("You tuck your backpack away and resume your vigil.");
                  }}
                  className="btn-panel-close"
                >
                  Close Backpack
                </button>
              </div>
            ) : combatResult ? (
              <div className="sub-panel-ui">
                <div className="combat-stage-banner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>

                  {/* PLAYER SIDE */}
                  <div className="combat-fighter-block" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '160px', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                      <img
                        src={getPlayerSprite()}
                        alt={selectedChar.name}
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', imageRendering: 'pixelated' }}
                      />
                    </div>
                    <h4 className="combat-fighter-name">{selectedChar.name}</h4>
                    <div className="combat-hp-track" style={{ width: '100%', marginTop: '8px' }}>
                      <div className="combat-hp-fill" style={{ width: `${Math.max(0, (simPlayerHp / selectedChar.total_hp) * 100)}%`, backgroundColor: '#10b981' }}></div>
                    </div>
                    <span className="combat-hp-text" style={{ marginTop: '4px' }}>HP: {simPlayerHp} / {selectedChar.total_hp}</span>
                  </div>

                  <div style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--text)', fontStyle: 'italic' }}>VS</div>

                  {/* ENEMY SIDE */}
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
                      <div className="combat-hp-fill" style={{ width: `${Math.max(0, (simEnemyHp / enemyMaxHp) * 100)}%`, backgroundColor: '#ef4444' }}></div>
                    </div>
                    <span className="combat-hp-text" style={{ marginTop: '4px' }}>HP: {simEnemyHp} / {enemyMaxHp}</span>
                  </div>
                </div>

                <div className="combat-scroll-box">
                  {simulatedLog.map((line, idx) => {
                    let displayColor = '#fff';
                    if (line.includes('🩸')) displayColor = '#f87171';
                    else if (line.includes('⚔️')) displayColor = '#34d399';
                    else if (line.includes('💥')) displayColor = '#fbbf24';
                    else if (line.includes('💀')) displayColor = '#ef4444';
                    return <div key={idx} style={{ color: displayColor }}>{line}</div>;
                  })}
                </div>

                {currentSimIndex >= combatResult.combat_log.length ? (
                  <div className="combat-resolution-wrap">
                    <h4 className="combat-resolution-title" style={{ color: combatResult.victory ? '#10b981' : '#ef4444' }}>
                      {combatResult.victory ? "ROOM SECURED" : "YOU PERISHED"}
                    </h4>
                    {combatResult.victory ? (
                      <p className="combat-resolution-reward" style={{ color: '#fbbf24' }}>Looted +{combatResult.gold_earned} Gold | Gained +{combatResult.exp_earned} EXP</p>
                    ) : (
                      <p className="combat-resolution-reward" style={{ color: '#f87171' }}>Fled to town. Lost half of your gold stash items.</p>
                    )}
                    <button
                      onClick={async () => {
                        setCombatResult(null);
                        if (selectedChar) {
                          const charRes = await api.get(`/characters/${selectedChar.character_id}`);
                          setSelectedChar(charRes.data);
                        }
                      }}
                      className="btn-combat-advance"
                    >
                      {combatResult.victory ? "Advance Forward" : "Return to Outpost"}
                    </button>
                  </div>
                ) : (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text)', fontStyle: 'italic', marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><Swords size={14} /> Resolving structural battle calculations...</p>
                )}
              </div>
            ) : currentEvent && ['enemy', 'monster', 'combat'].includes(currentEvent.template.event_type.toLowerCase()) ? (
              <div className="center-state-notice" style={{ border: '1px dashed #ef4444', padding: '24px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.02)' }}>
                <h3 className="center-state-title" style={{ color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Swords size={22} /> Threat Detected
                </h3>
                <p className="center-state-desc" style={{ color: 'var(--text-h)' }}>
                  A hostile <strong>{currentEvent.result.enemy_name || "Unknown Fiend"}</strong> bars your advance. Steel yourself.
                </p>
                <button
                  onClick={startCombat}
                  disabled={loading}
                  className="btn-adventure-start"
                  style={{ backgroundColor: '#ef4444', color: '#fff', boxShadow: '0 4px 12px rgba(239,68,68,0.2)', fontWeight: '700' }}
                >
                  Fight Your Way In
                </button>
              </div>
            ) : !currentEvent ? (
              <div className="action-navigation-row">
                <button onClick={exploreNextRoom} disabled={loading} className="action-nav-btn" style={{ backgroundColor: '#2563eb', boxShadow: '0 4px 12px rgba(37,99,235,0.2)' }}>Explore Chamber <ChevronRight size={18} /></button>
                <button onClick={openShop} disabled={loading} className="action-nav-btn" style={{ backgroundColor: '#d97706', boxShadow: '0 4px 12px rgba(217,119,6,0.2)' }}><Store size={18} /> Enter Shop</button>
                <button onClick={openInventory} disabled={loading} className="action-nav-btn" style={{ backgroundColor: '#7c3aed', boxShadow: '0 4px 12px rgba(124,58,237,0.2)' }}><Swords size={18} /> Open Backpack</button>
              </div>
            ) : (
              <div className="center-state-notice">
                <h4 style={{ margin: '0 0 8px 0', color: '#2563eb', fontSize: '1.3rem', fontWeight: '800' }}>{currentEvent.template.name}</h4>
                <p style={{ color: 'var(--text)', fontSize: '1rem', margin: '0 0 20px 0', lineHeight: '1.5' }}>{currentEvent.template.description}</p>
                <button onClick={resolveEvent} disabled={loading} className="btn-combat-advance" style={{ backgroundColor: '#2563eb', color: '#fff' }}>Proceed</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game;