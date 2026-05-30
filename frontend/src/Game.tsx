import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent, MouseEvent } from 'react';
import { api } from './api';
import { ActionNavigation } from './components/game/ActionNavigation';
import { CharacterGate } from './components/game/CharacterGate';
import { CharacterSidebar } from './components/game/CharacterSidebar';
import { CombatPanel } from './components/game/CombatPanel';
import { NonCombatEventPanel, ThreatPanel } from './components/game/EventPanels';
import { InventoryPanel } from './components/game/InventoryPanel';
import { LevelUpModal } from './components/game/LevelUpModal';
import { ShopPanel } from './components/game/ShopPanel';
import { TerminalLog } from './components/game/TerminalLog';
import type { Character, CombatResult, EventCompletionResult, GameEvent, GameRun, InventoryItem, ShopOffer, StarterStatAllocation, UpgradeResult } from './types/game';
import './app.css';

interface GameProps {
  onLogout: () => void;
}

const STARTING_LOGS = ["Welcome to the Dungeon..."];
const COMBAT_EVENT_TYPES = ['enemy', 'monster', 'combat'];
const STARTER_STAT_POINTS = 25;
const STARTER_BASE_STATS = {
  hp: 50,
  atk: 10,
  def: 10,
  spd: 50,
  eva: 0.05,
  critRate: 0.05,
  critDmg: 1.5,
  lifesteal: 0,
};

const STARTER_STAT_GAINS = {
  hp: 10,
  atk: 1,
  def: 1,
  spd: 10,
  eva: 0.01,
  critRate: 0.01,
  critDmg: 0.1,
  lifesteal: 0.01,
};

const INITIAL_STARTER_ALLOCATIONS: StarterStatAllocation = {
  hp: 0,
  atk: 0,
  def: 0,
  spd: 0,
  eva: 0,
  critRate: 0,
  critDmg: 0,
  lifesteal: 0,
};

function Game({ onLogout }: GameProps) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);
  const [activeRun, setActiveRun] = useState<GameRun | null>(null);
  const [currentEvent, setCurrentEvent] = useState<GameEvent | null>(null);
  const [logs, setLogs] = useState<string[]>(STARTING_LOGS);
  const [isCreating, setIsCreating] = useState(false);
  const [isInShop, setIsInShop] = useState(false);
  const [isInInventory, setIsInInventory] = useState(false);
  const [shopOffers, setShopOffers] = useState<ShopOffer[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState("");
  const [starterSkill, setStarterSkill] = useState("Strike");
  const [starterStatAllocation, setStarterStatAllocation] = useState<StarterStatAllocation>(INITIAL_STARTER_ALLOCATIONS);

  const [combatResult, setCombatResult] = useState<CombatResult | null>(null);
  const [preCombatCharacter, setPreCombatCharacter] = useState<Character | null>(null);
  const [levelUpModalData, setLevelUpModalData] = useState<{ before: Character; after: Character } | null>(null);
  const [levelUpModalHandled, setLevelUpModalHandled] = useState(false);
  const [simulatedLog, setSimulatedLog] = useState<string[]>([]);
  const [currentSimIndex, setCurrentSimIndex] = useState(0);
  const [simPlayerHp, setSimPlayerHp] = useState(10);
  const [simEnemyHp, setSimEnemyHp] = useState(10);
  const [enemyMaxHp, setEnemyMaxHp] = useState(10);
  const [enemyName, setEnemyName] = useState("Monster");

  const combatLogRef = useRef<HTMLDivElement>(null);
  const terminalLogRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((message: string) => {
    setLogs(previousLogs => [...previousLogs.slice(-10), `> ${message}`]);
  }, []);

  const fetchCharacters = useCallback(async () => {
    try {
      const response = await api.get<Character[]>(`/characters/me`);
      setCharacters(response.data);
      if (response.data.length === 0) {
        setIsCreating(true);
      }
    } catch (error) {
      console.error("Failed to fetch characters", error);
    }
  }, []);

  useEffect(() => {
    fetchCharacters();
  }, [fetchCharacters]);

  useEffect(() => {
    if (combatLogRef.current) {
      combatLogRef.current.scrollTop = combatLogRef.current.scrollHeight;
    }
  }, [simulatedLog]);

  useEffect(() => {
    if (terminalLogRef.current) {
      terminalLogRef.current.scrollTop = terminalLogRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    if (!combatResult || currentSimIndex >= combatResult.combat_log.length) return;

    const timer = window.setTimeout(() => {
      const nextLine = combatResult.combat_log[currentSimIndex];
      setSimulatedLog(previousLog => [...previousLog, nextLine]);

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

      setCurrentSimIndex(previousIndex => previousIndex + 1);
    }, 600);

    return () => window.clearTimeout(timer);
  }, [combatResult, currentSimIndex]);

  useEffect(() => {
    if (
      !combatResult?.level_up_triggered ||
      !preCombatCharacter ||
      !selectedChar ||
      levelUpModalHandled ||
      currentSimIndex < combatResult.combat_log.length
    ) {
      return;
    }

    let isMounted = true;

    const loadLevelUpStats = async () => {
      try {
        const refreshedCharacter = await fetchCharacterById(selectedChar.character_id);
        if (!isMounted) return;

        setSelectedChar(refreshedCharacter);
        updateCharacterCache(refreshedCharacter);
        setSimPlayerHp(refreshedCharacter.current_hp);
        setLevelUpModalData({ before: preCombatCharacter, after: refreshedCharacter });
        setLevelUpModalHandled(true);
      } catch {
        addLog("Leveled up, but failed to load the updated stat sheet.");
        setLevelUpModalHandled(true);
      }
    };

    loadLevelUpStats();

    return () => {
      isMounted = false;
    };
  }, [addLog, combatResult, currentSimIndex, levelUpModalHandled, preCombatCharacter, selectedChar]);

  const selectCharacter = async (character: Character) => {
    setLoading(true);
    resetEncounterState();
    setActiveRun(null);

    try {
      const freshCharacter = await fetchCharacterById(character.character_id);
      setSelectedChar(freshCharacter);
      updateCharacterCache(freshCharacter);
      addLog(`Character ${freshCharacter.name} selected.`);

      try {
        const runResponse = await api.get<GameRun>(`/runs/active/${character.character_id}`);
        setActiveRun(runResponse.data);
        addLog(`Resuming run at Floor ${runResponse.data.current_floor}, Room ${runResponse.data.current_room}.`);
      } catch {
        setActiveRun(null);
        addLog("No active run found. Ready to explore.");
      }
    } catch {
      addLog("Failed to load the latest character sheet.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCharacter = async (event: FormEvent) => {
    event.preventDefault();
    if (!newName.trim()) return;

    setLoading(true);
    const startingStats = buildStartingStats(starterStatAllocation);

    const characterPayload = {
      name: newName,
      base_hp: startingStats.hp,
      base_atk: startingStats.atk,
      base_def: startingStats.def,
      base_spd: startingStats.spd,
      base_eva: startingStats.eva,
      base_crit_rate: startingStats.critRate,
      base_crit_dmg: startingStats.critDmg,
      base_lifesteal: startingStats.lifesteal,
      starter_skill: starterSkill,
    };

    try {
      const response = await api.post<Character>('/characters/create', characterPayload);
      addLog(`Hero ${response.data.name} has been born with baseline stats!`);
      setCharacters(previousCharacters => [...previousCharacters, response.data]);
      setIsCreating(false);
      setSelectedChar(response.data);
      setNewName("");

      setStarterSkill("");
      setStarterStatAllocation(INITIAL_STARTER_ALLOCATIONS);
    } catch {
      addLog("Failed to create character. Check backend logs.");
    } finally {
      setLoading(false);
    }
  };

  const deleteCharacter = async (event: MouseEvent, characterId: number, characterName: string) => {
    event.stopPropagation();
    if (!window.confirm(`Are you sure you want to permanently delete ${characterName}?`)) return;

    try {
      await api.delete(`/characters/${characterId}`);
      setCharacters(previousCharacters => previousCharacters.filter(character => character.character_id !== characterId));
      addLog(`Character ${characterName} was permanently deleted.`);
    } catch {
      addLog("Failed to delete character. Ensure backend router supports DELETE /characters/{id}");
    }
  };

  const startRunIfNeeded = async (introLog: string) => {
    if (activeRun || !selectedChar) return activeRun;

    resetEncounterState();
    const response = await api.post<GameRun>(`/runs/start/${selectedChar.character_id}`);
    setActiveRun(response.data);
    addLog(introLog);
    return response.data;
  };

  const openShop = async () => {
    if (!selectedChar) return;
    setLoading(true);

    try {
      const currentRun = await startRunIfNeeded("Stepped into the underground trading outpost...");

      if (!currentRun) {
        addLog("Unable to establish a secure connection to the dungeon servers.");
        return;
      }

      const response = await api.get<ShopOffer[]>(`/shop/offers/${currentRun.run_id}`);
      setShopOffers(response.data);
      setIsInShop(true);
      setIsInInventory(false);
      addLog("The merchant opens his pack...");
    } catch {
      addLog("The shop is closed right now.");
    } finally {
      setLoading(false);
    }
  };

  const openInventory = useCallback(async () => {
    if (!selectedChar) return [];
    setLoading(true);

    try {
      const response = await api.get<InventoryItem[]>(`/inventory/${selectedChar.character_id}`);
      setInventoryItems(response.data);
      setIsInInventory(true);
      setIsInShop(false);
      addLog("Opening your adventurer knapsack...");
      return response.data;
    } catch {
      addLog("Failed to look into your backpack right now.");
      return [];
    } finally {
      setLoading(false);
    }
  }, [addLog, selectedChar]);

  const buyItem = async (offer: ShopOffer) => {
    try {
      await api.post(`/shop/buy/${activeRun?.run_id}`, {
        run_shop_offer_id: offer.run_shop_offer_id,
        item_template_id: offer.item_template_id,
        rarity_id: offer.rarity_id,
      });
      addLog(`Bought ${offer.item_name}!`);
      setShopOffers(previousOffers =>
        previousOffers.filter(shopOffer =>
          offer.run_shop_offer_id
            ? shopOffer.run_shop_offer_id !== offer.run_shop_offer_id
            : shopOffer !== offer
        )
      );
      await refreshSelectedCharacter();
    } catch (error: unknown) {
      const message = getApiErrorMessage(error) || "Purchase failed.";
      addLog(message);
    }
  };

  const equipItem = async (item: InventoryItem) => {
    if (!selectedChar) return;

    try {
      await api.post(`/inventory/equip/${selectedChar.character_id}`, {
        inventory_item_id: item.inventory_item_id,
        slot: item.item_type,
      });
      addLog(`Equipped ${item.item_name} safely!`);
      await openInventory();
      await refreshSelectedCharacter();
    } catch {
      addLog("Failed to equip item.");
    }
  };

  const unequipItem = async (item: InventoryItem) => {
    if (!selectedChar) return;

    try {
      await api.post(`/inventory/unequip/${selectedChar.character_id}`, {
        inventory_item_id: item.inventory_item_id,
      });
      addLog(`Unequipped ${item.item_name}.`);
      await openInventory();
      await refreshSelectedCharacter();
    } catch {
      addLog("Failed to unequip item.");
    }
  };

  const sellItem = async (item: InventoryItem) => {
    if (!selectedChar) return;

    try {
      await api.post(`/inventory/sell/${selectedChar.character_id}`, {
        inventory_item_id: item.inventory_item_id,
      });
      addLog(`Sold ${item.item_name} for ${item.sell_amount} gold.`);
      await openInventory();
      await refreshSelectedCharacter();
    } catch {
      addLog("Failed to sell item.");
    }
  };

  const upgradeItem = async (item: InventoryItem) => {
    if (!selectedChar) return null;

    try {
      const response = await api.post<UpgradeResult>(`/inventory/upgrade/${selectedChar.character_id}`, {
        inventory_item_id: item.inventory_item_id,
      });
      addLog(`Upgraded ${item.item_name} to +${response.data.upgraded_level} for ${response.data.gold_spent} gold.`);
      applyServerCharacter(response.data.character);
      const refreshedItems = await openInventory();
      return refreshedItems.find(refreshedItem => refreshedItem.inventory_item_id === item.inventory_item_id) ?? null;
    } catch (error: unknown) {
      const message = getApiErrorMessage(error) || "Failed to upgrade item.";
      addLog(message);
      return null;
    }
  };

  const exploreNextRoom = async () => {
    if (!selectedChar) return;
    setLoading(true);

    try {
      const currentRun = await startRunIfNeeded("Crossed the heavy iron gates into the depths...");

      if (!currentRun) {
        addLog("Unable to establish a secure connection to the dungeon servers.");
        return;
      }

      const response = await api.get<GameEvent>(`/runs/${currentRun.run_id}/next-event`);
      const nextEvent = response.data;
      const eventType = nextEvent.template.event_type.toLowerCase();

      if (nextEvent.template?.description) {
        addLog(nextEvent.template.description);
      }

      setCurrentEvent(nextEvent);

      if (COMBAT_EVENT_TYPES.includes(eventType)) {
        addLog(`Encountered a dangerous foe: ${nextEvent.result.enemy_name || "Unknown Horrific Foe"}!`);
      }
    } catch {
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
      setPreCombatCharacter(selectedChar);
      setLevelUpModalData(null);
      setLevelUpModalHandled(false);

      const response = await api.post<CombatResult>(`/combat/resolve/${activeRun.run_id}`, {
        event_template_id: currentEvent.template.event_template_id,
      });

      setEnemyName(parsedEnemyName);
      setEnemyMaxHp(currentEvent.result.enemy_hp || 40);
      setSimEnemyHp(currentEvent.result.enemy_hp || 40);
      setSimPlayerHp(selectedChar.current_hp);
      setSimulatedLog([]);
      setCurrentSimIndex(0);
      setCombatResult(response.data);
      if (response.data.run) {
        setActiveRun(response.data.run);
      }
      setCurrentEvent(null);
    } catch {
      addLog("Error initiating combat sequence.");
    } finally {
      setLoading(false);
    }
  };

  const resolveEvent = async () => {
    if (!activeRun || !currentEvent) return;
    setLoading(true);

    try {
      const response = await api.post<EventCompletionResult>(`/runs/${activeRun.run_id}/complete-event`, {
        event_template_id: currentEvent.template.event_template_id,
        event_result_id: currentEvent.result.event_result_id,
      });

      addLog(currentEvent.result.notes);
      setActiveRun(response.data.run);
      applyServerCharacter(response.data.character);
      setCurrentEvent(null);
    } catch {
      addLog("Error resolving event.");
    } finally {
      setLoading(false);
    }
  };

  const advanceAfterCombat = async () => {
    if (combatResult?.run) {
      setActiveRun(combatResult.run);
    }
    if (combatResult?.character) {
      applyServerCharacter(combatResult.character);
      setSimPlayerHp(combatResult.character.current_hp);
    } else {
      await refreshSelectedCharacter();
    }
    setCombatResult(null);
  };

  const refreshSelectedCharacter = async () => {
    if (!selectedChar) return;
    const refreshedCharacter = await fetchCharacterById(selectedChar.character_id);
    setSelectedChar(refreshedCharacter);
    updateCharacterCache(refreshedCharacter);
  };

  const fetchCharacterById = async (characterId: number) => {
    const response = await api.get<Character>(`/characters/${characterId}`);
    return response.data;
  };

  const updateCharacterCache = (updatedCharacter: Character) => {
    setCharacters(previousCharacters =>
      previousCharacters.map(character =>
        character.character_id === updatedCharacter.character_id ? updatedCharacter : character
      )
    );
  };

  const applyServerCharacter = (updatedCharacter: Character) => {
    setSelectedChar(updatedCharacter);
    updateCharacterCache(updatedCharacter);
  };

  const resetEncounterState = () => {
    setCombatResult(null);
    setPreCombatCharacter(null);
    setLevelUpModalData(null);
    setLevelUpModalHandled(false);
    setSimulatedLog([]);
    setCurrentSimIndex(0);
    setCurrentEvent(null);
  };

  const closeShop = () => {
    setIsInShop(false);
    addLog("You step out of the shop and back into the dark corridor.");
  };

  const closeInventory = () => {
    setIsInInventory(false);
    addLog("You tuck your backpack away and resume your vigil.");
  };

  if (!selectedChar) {
    return (
      <CharacterGate
        characters={characters}
        isCreating={isCreating}
        loading={loading}
        newName={newName}
        starterSkill={starterSkill}
        starterStatAllocation={starterStatAllocation}
        starterStatPoints={STARTER_STAT_POINTS}
        onCreateCharacter={handleCreateCharacter}
        onDeleteCharacter={deleteCharacter}
        onLogout={onLogout}
        onSelectCharacter={selectCharacter}
        onSetCreating={setIsCreating}
        onSetNewName={setNewName}
        onSetStarterSkill={setStarterSkill}
        onSetStarterStatAllocation={setStarterStatAllocation}
      />
    );
  }

  return (
    <div className="game-world-layout">
      <div className="game-main-grid">
        <CharacterSidebar
          activeRun={activeRun}
          character={selectedChar}
          combatResult={combatResult}
          simulatedPlayerHp={simPlayerHp}
          onBackToSelection={() => {
            setIsInShop(false);
            setIsInInventory(false);
            setShopOffers([]);
            setInventoryItems([]);
            setSelectedChar(null);
            setActiveRun(null);
            resetEncounterState();
          }}
        />

        <div className="interactive-screen-panel">
          <div className="dynamic-panel-container">
            {renderActivePanel(selectedChar)}
          </div>
        </div>

        <div className="game-log-panel">
          <TerminalLog logs={logs} logRef={terminalLogRef} />
        </div>
      </div>
      {levelUpModalData && (
        <LevelUpModal
          before={levelUpModalData.before}
          after={levelUpModalData.after}
          onClose={() => setLevelUpModalData(null)}
        />
      )}
    </div>
  );

  function renderActivePanel(character: Character) {
    if (isInShop) {
      return <ShopPanel key={`shop-run-${activeRun?.run_id}`} offers={shopOffers} onBuyItem={buyItem} onLeaveShop={closeShop} />;
    }

    if (isInInventory) {
      return (
        <InventoryPanel
          key={`inv-char-${character.character_id}`}
          items={inventoryItems}
          onCloseInventory={closeInventory}
          onEquipItem={equipItem}
          onSellItem={sellItem}
          onUnequipItem={unequipItem}
          onUpgradeItem={upgradeItem}
        />
      );
    }

    if (combatResult) {
      return (
        <CombatPanel
          character={character}
          combatLogRef={combatLogRef}
          combatResult={combatResult}
          currentSimIndex={currentSimIndex}
          enemyMaxHp={enemyMaxHp}
          enemyName={enemyName}
          simulatedEnemyHp={simEnemyHp}
          simulatedLog={simulatedLog}
          simulatedPlayerHp={simPlayerHp}
          onAdvance={advanceAfterCombat}
        />
      );
    }

    if (currentEvent && isCombatEvent(currentEvent)) {
      return <ThreatPanel event={currentEvent} loading={loading} onStartCombat={startCombat} />;
    }

    if (currentEvent) {
      return <NonCombatEventPanel event={currentEvent} loading={loading} onResolveEvent={resolveEvent} />;
    }

    return (
      <ActionNavigation
        loading={loading}
        bossUnlocked={activeRun?.boss_unlocked}
        onExplore={exploreNextRoom}
        onOpenInventory={openInventory}
        onOpenShop={openShop}
      />
    );
  }
}

function buildStartingStats(allocation: StarterStatAllocation) {
  return {
    hp: STARTER_BASE_STATS.hp + (allocation.hp * STARTER_STAT_GAINS.hp),
    atk: STARTER_BASE_STATS.atk + (allocation.atk * STARTER_STAT_GAINS.atk),
    def: STARTER_BASE_STATS.def + (allocation.def * STARTER_STAT_GAINS.def),
    spd: STARTER_BASE_STATS.spd + (allocation.spd * STARTER_STAT_GAINS.spd),
    eva: roundDecimal(STARTER_BASE_STATS.eva + (allocation.eva * STARTER_STAT_GAINS.eva)),
    critRate: roundDecimal(STARTER_BASE_STATS.critRate + (allocation.critRate * STARTER_STAT_GAINS.critRate)),
    critDmg: roundDecimal(STARTER_BASE_STATS.critDmg + (allocation.critDmg * STARTER_STAT_GAINS.critDmg)),
    lifesteal: roundDecimal(STARTER_BASE_STATS.lifesteal + (allocation.lifesteal * STARTER_STAT_GAINS.lifesteal)),
  };
}

function roundDecimal(value: number) {
  return Math.round(value * 100) / 100;
}

function isCombatEvent(event: GameEvent) {
  return COMBAT_EVENT_TYPES.includes(event.template.event_type.toLowerCase());
}

function getApiErrorMessage(error: unknown) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'data' in error.response &&
    typeof error.response.data === 'object' &&
    error.response.data !== null &&
    'detail' in error.response.data &&
    typeof error.response.data.detail === 'string'
  ) {
    return error.response.data.detail;
  }

  return null;
}

export default Game;
