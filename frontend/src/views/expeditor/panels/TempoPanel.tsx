import type { TempoData } from '../../../api/orders.api';
import { ServiceTempoGauge } from '../../../components/ServiceTempoGauge/ServiceTempoGauge';

interface TempoPanelProps {
  tempo: TempoData | null;
  isLoading: boolean;
}

export function TempoPanel({ tempo, isLoading }: TempoPanelProps) {
  if (isLoading) {
    return (
      <div
        aria-label="Service Tempo"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          padding: '16px',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--ft-border, #334155)',
            animation: 'ft-pulse-gentle 2s ease-in-out infinite',
          }}
        />
      </div>
    );
  }

  const value = tempo?.tempoValue ?? 0;
  const target = tempo?.target ?? 5;
  const status = tempo?.status ?? 'green';

  return (
    <div
      aria-label="Service Tempo"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: '16px',
      }}
    >
      <ServiceTempoGauge
        value={value}
        target={target}
        status={status}
        variant="large"
      />
    </div>
  );
}
