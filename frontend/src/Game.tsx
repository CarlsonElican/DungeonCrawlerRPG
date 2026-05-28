import React, { useState, useEffect, useCallback } from 'react';
import { api } from './api';

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
  const [shopOffers, setShopOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Character Creation Form State
  const [newName, setNewName] = useState("");
  const [selectedClass, setSelectedClass] = useState("Warrior");

  const fetchCharacters = useCallback(async () => {
    try {
      // Note: Endpoint fixed to match backend (characters/me uses Depends(get_current_user))
      const res = await api.get(`/characters/me`);
      setCharacters(res.data);
      if (res.data.length === 0) {
        setIsCreating(true);
      }
    } catch (err) {
      console.error("Failed to fetch characters", err);
    }
  }, [currentUser.user_id]);

  useEffect(() => {
    fetchCharacters();
  }, [fetchCharacters]);

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
      addLog("No active run found. Ready to start a new adventure.");
    }
  };

  const handleCreateCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    
    setLoading(true);
    
    // Custom specs: base hp is 10, atk is 5, def is 5, spd is 5
    // Remaining attributes defaulted safely to match standard RPG balances
    const characterPayload = {
      name: newName,
      user_id: currentUser.user_id,
      base_hp: 10,
      base_atk: 5,
      base_def: 5,
      base_spd: 5,
      base_eva: 0.05,       // 5% default dodge
      base_crit_rate: 0.05, // 5% default crit
      base_crit_dmg: 1.50,  // 150% crit multiplier
      base_lifesteal: 0.00,
      starter_skill: "Strike"
    };

    try {
      const res = await api.post('/characters/create', characterPayload);
      addLog(`Hero ${res.data.name} has been born with baseline stats!`);
      setCharacters([...characters, res.data]);
      setIsCreating(false);
      setSelectedChar(res.data);
      setNewName(""); // Clear field
    } catch (err) {
      addLog("Failed to create character. Check backend logs.");
    } finally {
      setLoading(false);
    }
  };

  const startNewRun = async () => {
    if (!selectedChar) return;
    setLoading(true);
    try {
      const res = await api.post(`/runs/start/${selectedChar.character_id}`);
      setActiveRun(res.data);
      addLog("Adventure started! You enter the dark dungeon...");
    } catch (err) {
      addLog("Error starting run.");
    } finally {
      setLoading(false);
    }
  };

  const openShop = async () => {
    if (!activeRun) return;
    setLoading(true);
    try {
      const res = await api.get(`/shop/offers/${activeRun.run_id}`);
      setShopOffers(res.data);
      setIsInShop(true);
      addLog("The merchant opens his pack...");
    } catch (err) {
      addLog("The shop is closed right now.");
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
    setLoading(true);
    try {
      const res = await api.get('/events/next');
      setCurrentEvent(res.data);
      addLog(`Room ${activeRun?.current_room}: ${res.data.template.name}`);
    } catch (err) {
      addLog("Failed to find anything in the next room...");
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
      
      // Update local run state
      setActiveRun({
        ...activeRun,
        current_room: activeRun.current_room + 1
      });
      
      setCurrentEvent(null);
      // Refresh char stats (HP/Gold changes)
      const charRes = await api.get(`/characters/${selectedChar?.character_id}`);
      setSelectedChar(charRes.data);
      
    } catch (err) {
      addLog("Error resolving event.");
    } finally {
      setLoading(false);
    }
  };

  // Render Character Selection or Creation
  if (!selectedChar) {
    return (
      <div className="game-container">
        {isCreating ? (
          <div className="creation-panel">
            <h2>Forge a New Hero</h2>
            <p style={{ fontSize: '0.9rem', color: '#888' }}>
              Base Attributes: HP: 10 | ATK: 5 | DEF: 5 | SPD: 5
            </p>
            <form onSubmit={handleCreateCharacter}>
              <div style={{ marginBottom: '15px' }}>
                <label htmlFor="charName" style={{ display: 'block', marginBottom: '5px' }}>
                  Character Name:
                </label>
                <input 
                  id="charName"
                  placeholder="Enter character name..." 
                  value={newName} 
                  onChange={e => setNewName(e.target.value)} 
                  maxLength={25}
                  required 
                  autoFocus
                />
              </div>
              
              <button type="submit" disabled={loading || !newName.trim()}>
                {loading ? "Initializing..." : "Create Character"}
              </button>
              <button type="button" className="cancel-btn" onClick={() => setIsCreating(false)}>
                Cancel
              </button>
            </form>
          </div>
        ) : (
          <>
            <h2>Select your Hero</h2>
            <div className="character-list">
              {characters.map(c => (
                <button key={c.character_id} onClick={() => selectCharacter(c)}>
                  {c.name} (Lv. {c.level})
                </button>
              ))}
              <button className="new-hero-btn" onClick={() => setIsCreating(true)}>
                + New Hero
              </button>
            </div>
            <button className="logout-btn" onClick={onLogout}>Logout</button>
          </>
        )}
      </div>
    );
  }

  // Render Dungeon Interface
  return (
    <div className="game-container">
      <div className="game-layout">
        {/* Left Side: Stats */}
        <div className="stats-panel">
          <h3>{selectedChar.name}</h3>
          <p>Level: {selectedChar.level}</p>
          <p>HP: {selectedChar.current_hp ?? selectedChar.total_hp} / {selectedChar.total_hp}</p>
          <p>Gold: {selectedChar.current_gold}</p>
          <div className="sub-stats">
            <p>ATK: {selectedChar.total_atk} | DEF: {selectedChar.total_def}</p>
            <p>SPD: {selectedChar.total_spd} | EVA: {(selectedChar.total_eva * 100).toFixed(0)}%</p>
            <p>CRIT: {(selectedChar.total_crit_rate * 100).toFixed(0)}% | LS: {(selectedChar.total_lifesteal * 100).toFixed(0)}%</p>
          </div>
          <hr />
          {activeRun ? (
            <div>
              <p>Floor: {activeRun.current_floor}</p>
              <p>Room: {activeRun.current_room}</p>
            </div>
          ) : (
            <p>No active run.</p>
          )}
        </div>

        {/* Center: Text Display & Controls */}
        <div className="display-panel">
          <div className="text-log">
            {logs.map((log, i) => <div key={i} className="log-entry">{log}</div>)}
          </div>

          <div className="controls">
            {!activeRun ? (
              <button onClick={startNewRun} disabled={loading}>Start Adventure</button>
            ) : isInShop ? (
              <div className="shop-ui">
                <h4>Merchant's Wares</h4>
                <div className="shop-grid">
                  {shopOffers.map((offer, i) => (
                    <button key={i} onClick={() => buyItem(offer)} className="shop-item">
                      <span style={{color: offer.hex_color}}>[{offer.rarity_name}]</span> {offer.item_name} 
                      <br/> {offer.dynamic_gold_cost} Gold
                    </button>
                  ))}
                </div>
                <button onClick={() => setIsInShop(false)}>Leave Shop</button>
              </div>
            ) : !currentEvent ? (
              <div className="action-row">
                <button onClick={exploreNextRoom} disabled={loading}>Explore Next Room</button>
                <button onClick={openShop} disabled={loading}>Visit Shop</button>
              </div>
            ) : (
              <div className="event-display">
                <h4>{currentEvent.template.name}</h4>
                <p>{currentEvent.template.description}</p>
                <button onClick={resolveEvent} disabled={loading}>Proceed</button>
              </div>
            )}
          </div>
        </div>
      </div>
      <button className="back-btn" onClick={() => setSelectedChar(null)}>Back to Selection</button>
    </div>
  );
};

export default Game;