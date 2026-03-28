import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  getDeliveryOrders,
  pickupDeliveryOrder,
  type DeliveryOrder,
} from '../../api/delivery.api';
import { CountdownETA } from '../../components/CountdownETA';
import { AttentionWrapper } from '../../components/AttentionWrapper';

const REFRESH_INTERVAL = 30_000;

function getOrderAge(createdAt: string): number {
  return (Date.now() - new Date(createdAt).getTime()) / 60_000;
}

export function DeliveryBoard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const apiKey = searchParams.get('key') ?? '';
  const displayMode = searchParams.get('mode') === 'display';
  const [keyInput, setKeyInput] = useState('');
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!apiKey) return;
    try {
      const data = await getDeliveryOrders(apiKey);
      setOrders(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  useEffect(() => {
    if (!apiKey) return;
    setLoading(true);
    fetchOrders();
    const interval = setInterval(fetchOrders, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [apiKey, fetchOrders]);

  const handleKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyInput.trim()) {
      setSearchParams({ key: keyInput.trim() });
    }
  };

  const handlePickup = async (orderId: string) => {
    // Optimistic removal
    const previousOrders = orders;
    setOrders((prev) => prev.filter((o) => o.id !== orderId));

    try {
      await pickupDeliveryOrder(apiKey, orderId);
    } catch {
      // Restore on error
      setOrders(previousOrders);
    }
  };

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <form
          onSubmit={handleKeySubmit}
          className="bg-white p-8 rounded-2xl shadow-sm max-w-sm w-full space-y-4"
          data-testid="key-form"
        >
          <h1 className="text-xl font-bold text-gray-900 text-center">
            Delivery Board
          </h1>
          <label htmlFor="api-key-input" className="block text-sm text-gray-600">
            Enter your API key to access the delivery board
          </label>
          <input
            id="api-key-input"
            type="text"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="API Key"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700"
          >
            Connect
          </button>
        </form>
      </div>
    );
  }

  const readyOrders = orders.filter((o) => o.status === 'served');
  const upcomingOrders = orders.filter((o) => o.status !== 'served');

  const bgClass = displayMode ? 'bg-gray-900 text-white' : 'bg-gray-50';
  const cardBgClass = displayMode ? 'bg-gray-800' : 'bg-white';
  const textClass = displayMode ? 'text-gray-100' : 'text-gray-900';
  const subTextClass = displayMode ? 'text-gray-400' : 'text-gray-500';
  const sizeVariant = displayMode ? 'large' as const : 'compact' as const;

  return (
    <div className={`min-h-screen ${bgClass} p-6`}>
      <h1
        className={`text-2xl font-bold ${textClass} mb-6`}
        data-testid="board-title"
      >
        Delivery Board
      </h1>

      {loading && (
        <div className="text-center py-8" data-testid="loading">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mx-auto" />
        </div>
      )}

      {error && (
        <div className="text-red-500 text-center py-4" data-testid="error">
          {error}
        </div>
      )}

      {/* Ready for Pickup */}
      <section className="mb-8" data-testid="ready-section">
        <h2 className={`text-lg font-semibold ${textClass} mb-3`}>
          Ready for Pickup ({readyOrders.length})
        </h2>
        {readyOrders.length === 0 && (
          <p className={subTextClass}>No orders ready for pickup</p>
        )}
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {readyOrders.map((order) => {
            const ageMinutes = getOrderAge(order.createdAt);
            const attentionLevel = ageMinutes > 5 ? 'warning' : 'healthy';
            return (
              <AttentionWrapper key={order.id} level={attentionLevel}>
                <div
                  className={`${cardBgClass} rounded-xl p-4 border-2 border-green-500`}
                  data-testid="ready-order"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-bold text-lg ${textClass}`}>
                      {order.orderNumber}
                    </span>
                    <CountdownETA
                      minutes={0}
                      isReady
                      variant={sizeVariant}
                    />
                  </div>
                  <ul className={`text-sm ${subTextClass} mb-3`}>
                    {order.items.map((item, idx) => (
                      <li key={idx}>
                        {item.quantity}x {item.itemName}
                      </li>
                    ))}
                  </ul>
                  {!displayMode && (
                    <button
                      onClick={() => handlePickup(order.id)}
                      className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700"
                      data-testid="pickup-button"
                    >
                      Pick Up
                    </button>
                  )}
                </div>
              </AttentionWrapper>
            );
          })}
        </div>
      </section>

      {/* Coming Up */}
      <section data-testid="upcoming-section">
        <h2 className={`text-lg font-semibold ${textClass} mb-3`}>
          Coming Up ({upcomingOrders.length})
        </h2>
        {upcomingOrders.length === 0 && (
          <p className={subTextClass}>No upcoming orders</p>
        )}
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {upcomingOrders.map((order) => (
            <div
              key={order.id}
              className={`${cardBgClass} rounded-xl p-4 border border-gray-200`}
              data-testid="upcoming-order"
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`font-bold ${textClass}`}>
                  {order.orderNumber}
                </span>
                <CountdownETA
                  minutes={order.etaMinutes}
                  variant={sizeVariant}
                />
              </div>
              <ul className={`text-sm ${subTextClass}`}>
                {order.items.map((item, idx) => (
                  <li key={idx}>
                    {item.quantity}x {item.itemName}
                  </li>
                ))}
              </ul>
              <p className={`text-xs mt-2 ${subTextClass} capitalize`}>
                {order.status}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
