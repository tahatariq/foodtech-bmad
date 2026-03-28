import { useState, useCallback } from 'react';

type Pace = 'rush' | 'steady' | 'slow';

interface SimulatorStatus {
  running: boolean;
  ordersGenerated: number;
  pace: Pace | null;
}

export function SimulatorPanel() {
  const [pace, setPace] = useState<Pace>('steady');
  const [status, setStatus] = useState<SimulatorStatus>({
    running: false,
    ordersGenerated: 0,
    pace: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/simulator/status');
      if (res.ok) {
        const data = (await res.json()) as SimulatorStatus;
        setStatus(data);
      }
    } catch {
      // ignore status fetch errors
    }
  }, []);

  const handleStart = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/simulator/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pace }),
      });
      if (!res.ok) throw new Error('Failed to start simulator');
      await fetchStatus();
      setStatus((prev) => ({ ...prev, running: true, pace }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/simulator/stop', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to stop simulator');
      const data = (await res.json()) as { running: boolean; ordersGenerated: number };
      setStatus({
        running: false,
        ordersGenerated: data.ordersGenerated,
        pace: null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/simulator/clear', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to clear simulated data');
      setStatus({ running: false, ordersGenerated: 0, pace: null });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="simulator-panel" style={{ maxWidth: 480, margin: '0 auto', padding: 24 }}>
      <h1 data-testid="simulator-title">Demo Simulator</h1>

      {error && (
        <div data-testid="error-message" style={{ color: 'red', marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div data-testid="status-display" style={{ marginBottom: 24 }}>
        <p>
          Status:{' '}
          <strong data-testid="running-status">
            {status.running ? 'Running' : 'Stopped'}
          </strong>
        </p>
        <p>
          Orders Generated:{' '}
          <span data-testid="orders-count">{status.ordersGenerated}</span>
        </p>
        {status.pace && (
          <p>
            Pace: <span data-testid="current-pace">{status.pace}</span>
          </p>
        )}
      </div>

      <div style={{ marginBottom: 16 }}>
        <label htmlFor="pace-select">Pace</label>
        <select
          id="pace-select"
          data-testid="pace-select"
          value={pace}
          onChange={(e) => setPace(e.target.value as Pace)}
          disabled={status.running}
          style={{ display: 'block', width: '100%', padding: 8, marginTop: 4 }}
        >
          <option value="rush">Rush (every 20s)</option>
          <option value="steady">Steady (every 60s)</option>
          <option value="slow">Slow (every 180s)</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {!status.running ? (
          <button
            data-testid="start-button"
            onClick={() => void handleStart()}
            disabled={loading}
            type="button"
          >
            {loading ? 'Starting...' : 'Start Simulator'}
          </button>
        ) : (
          <button
            data-testid="stop-button"
            onClick={() => void handleStop()}
            disabled={loading}
            type="button"
          >
            {loading ? 'Stopping...' : 'Stop Simulator'}
          </button>
        )}
        <button
          data-testid="clear-button"
          onClick={() => void handleClear()}
          disabled={loading || status.running}
          type="button"
        >
          Clear Simulated Data
        </button>
      </div>
    </div>
  );
}
