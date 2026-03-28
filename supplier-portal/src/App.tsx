import { useState } from 'react';
import { DemandDashboard } from './views/DemandDashboard';
import { OrdersView } from './views/OrdersView';
import { TrendsView } from './views/TrendsView';

type View = 'demand' | 'orders' | 'trends';

function App() {
  const [currentView, setCurrentView] = useState<View>('demand');

  return (
    <div style={{ minHeight: '100vh' }}>
      <nav
        style={{
          display: 'flex',
          gap: '16px',
          padding: '12px 24px',
          borderBottom: '1px solid #334155',
          backgroundColor: '#1E293B',
        }}
      >
        <strong>Supplier Portal</strong>
        <button onClick={() => setCurrentView('demand')}>Dashboard</button>
        <button onClick={() => setCurrentView('orders')}>Orders</button>
        <button onClick={() => setCurrentView('trends')}>Trends</button>
      </nav>
      <main style={{ padding: '24px' }}>
        {currentView === 'demand' && <DemandDashboard />}
        {currentView === 'orders' && <OrdersView />}
        {currentView === 'trends' && <TrendsView />}
      </main>
    </div>
  );
}

export default App;
