import { ChevronRight, Store, Sword, Swords } from 'lucide-react';

interface ActionNavigationProps {
  bossUnlocked?: boolean;
  loading: boolean;
  onExplore: () => void;
  onOpenInventory: () => void;
  onOpenShop: () => void;
}

export function ActionNavigation({ bossUnlocked, loading, onExplore, onOpenInventory, onOpenShop }: ActionNavigationProps) {
  return (
    <div className="action-navigation-row">
      <button onClick={onExplore} disabled={loading} className="action-nav-btn" style={{ backgroundColor: bossUnlocked ? '#b91c1c' : '#2563eb', boxShadow: bossUnlocked ? '0 4px 12px rgba(185,28,28,0.24)' : '0 4px 12px rgba(37,99,235,0.2)' }}>
        {bossUnlocked ? (
          <>
            Face Floor Boss <Sword size={18} />
          </>
        ) : (
          <>
            Explore Chamber <ChevronRight size={18} />
          </>
        )}
      </button>
      <button onClick={onOpenShop} disabled={loading} className="action-nav-btn" style={{ backgroundColor: '#d97706', boxShadow: '0 4px 12px rgba(217,119,6,0.2)' }}>
        <Store size={18} /> Enter Shop
      </button>
      <button onClick={onOpenInventory} disabled={loading} className="action-nav-btn" style={{ backgroundColor: '#7c3aed', boxShadow: '0 4px 12px rgba(124,58,237,0.2)' }}>
        <Swords size={18} /> Open Backpack
      </button>
    </div>
  );
}
