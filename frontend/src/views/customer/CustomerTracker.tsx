import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getOrderByToken, type TrackingResponse } from '../../api/tracking.api';
import { CustomerProgressSteps } from '../../components/CustomerProgressSteps';
import { useCustomerSocket } from '../../hooks/useCustomerSocket';

const STATUS_TO_STEP: Record<string, 1 | 2 | 3 | 4> = {
  received: 1,
  preparing: 2,
  plating: 3,
  served: 4,
  completed: 4,
};

const STEP_LABELS: Record<number, string> = {
  1: 'Received',
  2: 'Preparing',
  3: 'Plating',
  4: 'Ready',
};

const DEFAULT_ETA: Record<number, { text: string; className: string }> = {
  1: { text: '~15 min', className: 'text-gray-500' },
  2: { text: '~8 min', className: 'text-gray-700' },
  3: { text: '~2 min', className: 'text-gray-900 font-semibold' },
  4: { text: 'NOW', className: 'text-green-600 font-bold' },
};

export function CustomerTracker() {
  const { token } = useParams<{ token: string }>();
  const [order, setOrder] = useState<TrackingResponse | null>(null);
  const [loading, setLoading] = useState(!(!token));
  const [error, setError] = useState(!token);

  const { currentStage, etaMinutes } = useCustomerSocket(token);

  useEffect(() => {
    if (!token) return;

    getOrderByToken(token)
      .then((result) => {
        if ('error' in result) {
          setError(true);
        } else {
          setOrder(result);
        }
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  // Derive effective status from WebSocket updates or initial data
  const effectiveStatus = currentStage ?? order?.status ?? 'received';
  const step = STATUS_TO_STEP[effectiveStatus] ?? 1;
  const stageLabel = STEP_LABELS[step];
  const eta = DEFAULT_ETA[step];
  const isReady = step === 4;

  // Use dynamic ETA from WebSocket if available and not ready
  const etaDisplay =
    etaMinutes != null && !isReady
      ? { text: `~${etaMinutes} min`, className: eta.className }
      : eta;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" data-testid="loading">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex items-center justify-center min-h-screen" data-testid="error">
        <div className="text-center p-8">
          <div className="text-5xl mb-4">🔗</div>
          <h1 className="text-xl font-semibold text-gray-800 mb-2">This link has expired</h1>
          <p className="text-gray-500">Please ask staff for a new tracking link.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-sm p-6 space-y-6">
        {/* Order number */}
        <div className="text-center">
          <p className="text-sm text-gray-400 uppercase tracking-wide">Order</p>
          <p className="text-2xl font-bold text-gray-900">{order.orderNumber}</p>
        </div>

        {/* Progress steps */}
        <CustomerProgressSteps currentStep={step} />

        {/* Stage label + ETA */}
        <div className="text-center space-y-1">
          <p className="text-lg font-medium text-gray-800">{stageLabel}</p>
          <p className={`text-2xl ${etaDisplay.className}`} data-testid="eta-display">
            {etaDisplay.text}
          </p>
        </div>

        {/* Ready celebration */}
        {isReady && (
          <div
            className="text-center animate-[scaleUp_0.4s_ease-out] motion-reduce:animate-none"
            data-testid="ready-celebration"
          >
            <div className="text-5xl mb-2 animate-[scaleUp_0.4s_ease-out] motion-reduce:animate-none">
              ✅
            </div>
            <p className="text-green-600 font-bold text-lg">Ready! Pick up at counter</p>
          </div>
        )}
      </div>

      {/* CSS animation for celebration */}
      <style>{`
        @keyframes scaleUp {
          from { transform: scale(0.5); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
