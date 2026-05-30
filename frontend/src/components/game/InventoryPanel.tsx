import {Coins, Gem, HardHat, PackageOpen, PersonStanding, Shield, Shirt, Sparkles, SportShoe, Sword, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import type { InventoryItem } from '../../types/game';

interface InventoryPanelProps {
  items: InventoryItem[];
  onCloseInventory: () => void;
  onEquipItem: (item: InventoryItem) => void;
  onSellItem: (item: InventoryItem) => void;
  onUnequipItem: (item: InventoryItem) => void;
  onUpgradeItem: (item: InventoryItem) => Promise<InventoryItem | null>;
}

const EQUIPMENT_SLOTS = ['Weapon', 'Shield', 'Helmet', 'Chestplate', 'Leggings', 'Boots', 'Accessory'];
const INVENTORY_TABS = ['All', ...EQUIPMENT_SLOTS];
const ITEM_TYPE_ICONS: Record<string, LucideIcon> = {
  All: PackageOpen,
  Weapon: Sword,
  Shield,
  Helmet: HardHat,
  Chestplate: Shirt,
  Leggings: PersonStanding,
  Boots: SportShoe,
  Accessory: Gem,
};

const DETAIL_ROWS = [
  { label: 'HP', totalKey: 'total_item_hp', bonusKey: 'bonus_item_hp', upgradeKey: 'upgrade_item_hp', percent: false, multiplier: false },
  { label: 'ATK', totalKey: 'total_item_atk', bonusKey: 'bonus_item_atk', upgradeKey: 'upgrade_item_atk', percent: false, multiplier: false },
  { label: 'DEF', totalKey: 'total_item_def', bonusKey: 'bonus_item_def', upgradeKey: 'upgrade_item_def', percent: false, multiplier: false },
  { label: 'SPD', totalKey: 'total_item_spd', bonusKey: 'bonus_item_spd', upgradeKey: 'upgrade_item_spd', percent: false, multiplier: false },
  { label: 'Crit Rate', totalKey: 'total_item_crit_rate', bonusKey: 'bonus_item_crit_rate', upgradeKey: 'upgrade_item_crit_rate', percent: true, multiplier: false },
  { label: 'Crit Damage', totalKey: 'total_item_crit_dmg', bonusKey: 'bonus_item_crit_dmg', upgradeKey: 'upgrade_item_crit_dmg', percent: false, multiplier: true },
  { label: 'Evasion', totalKey: 'total_item_eva', bonusKey: 'bonus_item_eva', upgradeKey: 'upgrade_item_eva', percent: true, multiplier: false },
  { label: 'Lifesteal', totalKey: 'total_item_lifesteal', bonusKey: 'bonus_item_lifesteal', upgradeKey: 'upgrade_item_lifesteal', percent: true, multiplier: false },
] as const;

export function InventoryPanel({
  items,
  onCloseInventory,
  onEquipItem,
  onSellItem,
  onUnequipItem,
  onUpgradeItem,
}: InventoryPanelProps) {
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [activeTab, setActiveTab] = useState('All');
  const equippedBySlot = getEquippedBySlot(items);
  const filteredItems = activeTab === 'All' ? items : items.filter(item => item.item_type === activeTab);

  const handleEquipToggle = () => {
    if (!selectedItem) return;

    if (selectedItem.is_equipped) {
      onUnequipItem(selectedItem);
    } else {
      onEquipItem(selectedItem);
    }
    setSelectedItem(null);
  };

  const handleSell = () => {
    if (!selectedItem) return;
    onSellItem(selectedItem);
    setSelectedItem(null);
  };

  return (
    <div className="sub-panel-ui">
      <h4 className="sub-panel-title" style={{ color: 'var(--accent)' }}><Sparkles size={22} /> Equipment Backpack</h4>

      <div className="equipment-workspace">
        <div className="equipment-slot-column" aria-label="Equipped items">
          {EQUIPMENT_SLOTS.map(slot => {
            const equippedItem = equippedBySlot[slot];
            const SlotIcon = ITEM_TYPE_ICONS[slot];

            return (
              <button
                key={slot}
                className={equippedItem ? 'equipment-slot-card is-filled' : 'equipment-slot-card'}
                onClick={() => equippedItem && setSelectedItem(equippedItem)}
                disabled={!equippedItem}
              >
                <span className="equipment-slot-name"><SlotIcon size={15} /> {slot}</span>
                <span className="equipment-slot-item" style={{ color: equippedItem?.hex_color }}>
                  {equippedItem ? equippedItem.item_name : 'Open Slot'}
                </span>
              </button>
            );
          })}
        </div>

        <div className="inventory-workspace">
          <div className="inventory-section-header">
            <PackageOpen size={18} />
            <span>Backpack</span>
          </div>

          <div className="inventory-tab-row" role="tablist" aria-label="Inventory filters">
            {INVENTORY_TABS.map(tab => {
              const TabIcon = ITEM_TYPE_ICONS[tab];

              return (
                <button
                  key={tab}
                  className={activeTab === tab ? 'inventory-tab is-active' : 'inventory-tab'}
                  onClick={() => setActiveTab(tab)}
                  role="tab"
                  aria-label={tab === 'All' ? 'All items' : tab}
                  aria-selected={activeTab === tab}
                  title={tab === 'All' ? 'All items' : tab}
                >
                  <TabIcon size={18} />
                </button>
              );
            })}
          </div>

          {filteredItems.length === 0 ? (
            <p style={{ color: 'var(--text)', fontSize: '0.95rem', margin: '30px 0', fontStyle: 'italic' }}>Your backpack is completely empty.</p>
          ) : (
            <div className="sub-panel-grid">
              {filteredItems.map(item => (
                <button
                  key={item.inventory_item_id}
                  onClick={() => setSelectedItem(item)}
                  className="sub-panel-card"
                  style={{ border: item.is_equipped ? '1px solid #10b981' : '1px solid var(--border)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '10px' }}>
                    <span style={{ color: item.hex_color, fontWeight: '700' }}>
                      [{item.rarity_name}] {item.item_name}{item.upgraded_level > 0 ? ` +${item.upgraded_level}` : ''}
                    </span>
                    {item.is_equipped && <span style={{ color: '#10b981', fontSize: '0.7rem', fontWeight: '800', backgroundColor: '#142f26', padding: '2px 6px', borderRadius: '4px' }}>EQUIPPED</span>}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text)', marginTop: '4px' }}>{item.item_type}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <button onClick={onCloseInventory} className="btn-panel-close">
        Close Backpack
      </button>

      {selectedItem && (
        <InventoryItemModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onEquipToggle={handleEquipToggle}
          onSell={handleSell}
          onUpgrade={async () => {
            const upgradedItem = await onUpgradeItem(selectedItem);
            if (upgradedItem) {
              setSelectedItem(upgradedItem);
            }
          }}
        />
      )}
    </div>
  );
}

interface InventoryItemModalProps {
  item: InventoryItem;
  onClose: () => void;
  onEquipToggle: () => void;
  onSell: () => void;
  onUpgrade: () => void;
}

function InventoryItemModal({ item, onClose, onEquipToggle, onSell, onUpgrade }: InventoryItemModalProps) {
  return (
    <div className="shop-item-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="inventory-item-title">
      <div className="shop-item-modal">
        <div className="shop-item-modal-header">
          <div>
            <p className="shop-item-modal-kicker">{item.item_type}{item.equipped_slot ? ` Slot: ${item.equipped_slot}` : ''}</p>
            <h3 id="inventory-item-title" className="shop-item-modal-title" style={{ color: item.hex_color }}>
              [{item.rarity_name}] {item.item_name}{item.upgraded_level > 0 ? ` +${item.upgraded_level}` : ''}
            </h3>
          </div>
          <button onClick={onClose} className="shop-item-icon-btn" aria-label="Close item details">
            <X size={18} />
          </button>
        </div>

        <p className="shop-item-modal-desc">
          {item.description || item.item_effect || 'No additional notes are attached to this item.'}
        </p>

        <div className="shop-item-stat-grid">
          {DETAIL_ROWS.map(row => (
            <div key={row.totalKey} className="shop-item-stat-row">
              <span>{row.label}</span>
              <strong>
                {formatStatValue(item[row.totalKey], row.percent, row.multiplier)}
                {item[row.bonusKey] !== 0 && (
                  <span className="shop-item-bonus-stat" style={{ color: item.hex_color }}>
                    {' '}({formatBonusValue(item[row.bonusKey], row.percent, row.multiplier)})
                  </span>
                )}
                {item[row.upgradeKey] !== 0 && (
                  <span className="inventory-upgrade-stat">
                    {' '}[{formatBonusValue(item[row.upgradeKey], row.percent, row.multiplier)}]
                  </span>
                )}
              </strong>
            </div>
          ))}
        </div>

        <div className="shop-item-modal-footer">
          <div className="shop-item-price">
            <Coins size={16} /> Sells for {item.sell_amount}
          </div>
          <div className="shop-item-actions">
            <button onClick={onEquipToggle} className="btn-primary shop-item-buy-btn">
              {item.is_equipped ? 'Unequip' : 'Equip'}
            </button>
            <button onClick={onSell} className="btn-secondary inventory-danger-btn">Sell</button>
            <button onClick={onUpgrade} disabled={item.upgrade_cost === null} className="btn-panel-close inventory-upgrade-btn">
              Upgrade
              {item.upgrade_cost === null ? (
                <span>Maxed</span>
              ) : (
                <span><Coins size={14} /> {item.upgrade_cost}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getEquippedBySlot(items: InventoryItem[]) {
  return items.reduce<Record<string, InventoryItem>>((accumulator, item) => {
    if (item.is_equipped) {
      accumulator[item.equipped_slot || item.item_type] = item;
    }
    return accumulator;
  }, {});
}

function formatSignedStat(value: number) {
  return value > 0 ? `+${value}` : `${value}`;
}

function formatStatValue(value: number, percent?: boolean, multiplier?: boolean) {
  if (percent) return `${(value * 100).toFixed(0)}%`;
  if (multiplier) return `${value.toFixed(2)}x`;
  return formatSignedStat(value);
}

function formatBonusValue(value: number, percent?: boolean, multiplier?: boolean) {
  const prefix = value > 0 ? '+' : '';
  if (percent) return `${prefix}${(value * 100).toFixed(0)}%`;
  if (multiplier) return `${prefix}${value.toFixed(2)}x`;
  return `${prefix}${value}`;
}
