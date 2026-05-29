import { useState } from 'react';
import { Coins, Store, X } from 'lucide-react';
import type { ShopOffer } from '../../types/game';

interface ShopPanelProps {
  offers: ShopOffer[];
  onBuyItem: (offer: ShopOffer) => void;
  onLeaveShop: () => void;
}

const DETAIL_ROWS = [
  { label: 'HP', totalKey: 'total_item_hp', bonusKey: 'bonus_item_hp', percent: false, multiplier: false },
  { label: 'ATK', totalKey: 'total_item_atk', bonusKey: 'bonus_item_atk', percent: false, multiplier: false },
  { label: 'DEF', totalKey: 'total_item_def', bonusKey: 'bonus_item_def', percent: false, multiplier: false },
  { label: 'SPD', totalKey: 'total_item_spd', bonusKey: 'bonus_item_spd', percent: false, multiplier: false },
  { label: 'Crit Rate', totalKey: 'total_item_crit_rate', bonusKey: 'bonus_item_crit_rate', percent: true, multiplier: false },
  { label: 'Crit Damage', totalKey: 'total_item_crit_dmg', bonusKey: 'bonus_item_crit_dmg', percent: false, multiplier: true },
  { label: 'Evasion', totalKey: 'total_item_eva', bonusKey: 'bonus_item_eva', percent: true, multiplier: false },
  { label: 'Lifesteal', totalKey: 'total_item_lifesteal', bonusKey: 'bonus_item_lifesteal', percent: true, multiplier: false },
] as const;

export function ShopPanel({ offers, onBuyItem, onLeaveShop }: ShopPanelProps) {
  const [selectedOffer, setSelectedOffer] = useState<ShopOffer | null>(null);

  const handleBuy = () => {
    if (!selectedOffer) return;
    onBuyItem(selectedOffer);
    setSelectedOffer(null);
  };

  return (
    <div className="sub-panel-ui">
      <h4 className="sub-panel-title" style={{ color: '#fbbf24' }}><Store size={22} /> Merchant Camp</h4>
      {offers.length === 0 ? (
        <p style={{ color: 'var(--text)', fontSize: '0.95rem', margin: '30px 0', fontStyle: 'italic' }}>
          The merchant has nothing else prepared for this visit.
        </p>
      ) : (
        <div className="sub-panel-grid">
          {offers.map((offer, index) => (
            <button
              key={`${offer.item_template_id}-${offer.rarity_id}-${index}`}
              onClick={() => setSelectedOffer(offer)}
              className="sub-panel-card"
            >
              <div style={{ color: offer.hex_color, fontWeight: '700', fontSize: '1.05rem', marginBottom: '4px' }}>
                [{offer.rarity_name}] {offer.item_name}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text)', margin: '4px 0' }}>
                {offer.item_type}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#fbbf24', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px' }}>
                <Coins size={14} /> {offer.dynamic_gold_cost} Gold
              </div>
            </button>
          ))}
        </div>
      )}

      <button onClick={onLeaveShop} className="btn-panel-close">
        Leave Shop
      </button>

      {selectedOffer && (
        <ShopItemModal
          offer={selectedOffer}
          onBuy={handleBuy}
          onClose={() => setSelectedOffer(null)}
        />
      )}
    </div>
  );
}

interface ShopItemModalProps {
  offer: ShopOffer;
  onBuy: () => void;
  onClose: () => void;
}

function ShopItemModal({ offer, onBuy, onClose }: ShopItemModalProps) {
  return (
    <div className="shop-item-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="shop-item-title">
      <div className="shop-item-modal">
        <div className="shop-item-modal-header">
          <div>
            <p className="shop-item-modal-kicker">{offer.item_type}</p>
            <h3 id="shop-item-title" className="shop-item-modal-title" style={{ color: offer.hex_color }}>
              [{offer.rarity_name}] {offer.item_name}
            </h3>
          </div>
          <button onClick={onClose} className="shop-item-icon-btn" aria-label="Close item details">
            <X size={18} />
          </button>
        </div>

        <p className="shop-item-modal-desc">
          {offer.description || offer.item_effect || 'No additional notes are attached to this item.'}
        </p>

        <div className="shop-item-stat-grid">
          {DETAIL_ROWS.map(row => (
            <div key={row.totalKey} className="shop-item-stat-row">
              <span>{row.label}</span>
              <strong>
                {formatStatValue(offer[row.totalKey], row.percent, row.multiplier)}
                {offer[row.bonusKey] !== 0 && (
                  <span className="shop-item-bonus-stat" style={{ color: offer.hex_color }}>
                    {' '}({formatBonusValue(offer[row.bonusKey], row.percent, row.multiplier)})
                  </span>
                )}
              </strong>
            </div>
          ))}
        </div>

        <div className="shop-item-modal-footer">
          <div className="shop-item-price">
            <Coins size={16} /> {offer.dynamic_gold_cost} Gold
          </div>
          <div className="shop-item-actions">
            <button onClick={onBuy} className="btn-primary shop-item-buy-btn">Buy Item</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatStatValue(value: number, percent?: boolean, multiplier?: boolean) {
  if (percent) return `${(value * 100).toFixed(0)}%`;
  if (multiplier) return `${value.toFixed(2)}x`;
  return value > 0 ? `+${value}` : `${value}`;
}

function formatBonusValue(value: number, percent?: boolean, multiplier?: boolean) {
  const prefix = value > 0 ? '+' : '';
  if (percent) return `${prefix}${(value * 100).toFixed(0)}%`;
  if (multiplier) return `${prefix}${value.toFixed(2)}x`;
  return `${prefix}${value}`;
}
