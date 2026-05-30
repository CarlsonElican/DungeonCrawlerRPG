import { ChevronRight, Store, Sword, Swords } from 'lucide-react';

interface ActionNavigationProps {
  bossUnlocked?: boolean;
  hasPendingEvent: boolean;
  loading: boolean;
  onExplore: () => void;
  onResumeEvent: () => void;
  onOpenInventory: () => void;
  onOpenShop: () => void;
}

export function ActionNavigation({ bossUnlocked, hasPendingEvent, loading, onExplore, onResumeEvent, onOpenInventory, onOpenShop }: ActionNavigationProps) {
  return (
    <div className="action-navigation-row">
      <button onClick={hasPendingEvent ? onResumeEvent : onExplore} disabled={loading} className="action-nav-btn" style={{ backgroundColor: hasPendingEvent ? '#10b981' : (bossUnlocked ? '#b91c1c' : '#2563eb'), boxShadow: hasPendingEvent ? '0 4px 12px rgba(16,185,129,0.2)' : (bossUnlocked ? '0 4px 12px rgba(185,28,28,0.24)' : '0 4px 12px rgba(37,99,235,0.2)') }}>
        {hasPendingEvent ? (
          <>
            Resume Encounter <ChevronRight size={18} />
          </>
        ) : bossUnlocked ? (
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
