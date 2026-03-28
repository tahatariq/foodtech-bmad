import { useEffect, useState } from 'react';
import { AttentionWrapper } from '../../components/AttentionWrapper';
import { useAuthStore } from '../../stores/authStore';

export interface AdoptionMetric {
  tenantId: string;
  tenantName: string;
  bumpUsageRate: number;
  activeUsersPerDay: number;
  daysSinceOnboarding: number;
  flagged: boolean;
}

const API_BASE = '/api/v1';

type SortKey = keyof AdoptionMetric;
type SortDir = 'asc' | 'desc';

export function AdoptionDashboard() {
  const [metrics, setMetrics] = useState<AdoptionMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('tenantName');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  useEffect(() => {
    const token = useAuthStore.getState().accessToken;
    fetch(`${API_BASE}/admin/metrics/adoption`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json();
      })
      .then((data: AdoptionMetric[]) => {
        setMetrics(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = [...metrics].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    const dir = sortDir === 'asc' ? 1 : -1;
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return aVal.localeCompare(bVal) * dir;
    }
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return (aVal - bVal) * dir;
    }
    if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
      return ((aVal ? 1 : 0) - (bVal ? 1 : 0)) * dir;
    }
    return 0;
  });

  if (loading) return <div data-testid="adoption-loading">Loading...</div>;
  if (error) return <div data-testid="adoption-error">Error: {error}</div>;

  return (
    <div data-testid="adoption-dashboard" style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>
        Adoption Metrics
      </h1>
      <table
        data-testid="adoption-table"
        style={{ width: '100%', borderCollapse: 'collapse' }}
      >
        <thead>
          <tr>
            <SortableHeader label="Tenant" sortKey="tenantName" currentKey={sortKey} dir={sortDir} onClick={handleSort} />
            <SortableHeader label="Bump Usage" sortKey="bumpUsageRate" currentKey={sortKey} dir={sortDir} onClick={handleSort} />
            <SortableHeader label="Active Users/Day" sortKey="activeUsersPerDay" currentKey={sortKey} dir={sortDir} onClick={handleSort} />
            <SortableHeader label="Days Since Onboarding" sortKey="daysSinceOnboarding" currentKey={sortKey} dir={sortDir} onClick={handleSort} />
            <th style={thStyle}>Status</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((m) => (
            <tr key={m.tenantId} data-testid={`tenant-row-${m.tenantId}`}>
              <td style={tdStyle}>{m.tenantName}</td>
              <td style={tdStyle}>
                {m.flagged ? (
                  <AttentionWrapper level="warning">
                    <span data-testid="flagged-usage">{m.bumpUsageRate}%</span>
                  </AttentionWrapper>
                ) : (
                  <span>{m.bumpUsageRate}%</span>
                )}
              </td>
              <td style={tdStyle}>{m.activeUsersPerDay}</td>
              <td style={tdStyle}>{m.daysSinceOnboarding}</td>
              <td style={tdStyle}>
                <span
                  data-testid={m.flagged ? 'flagged-badge' : 'healthy-badge'}
                  style={{
                    padding: '2px 8px',
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 600,
                    backgroundColor: m.flagged ? '#fef2f2' : '#f0fdf4',
                    color: m.flagged ? '#dc2626' : '#16a34a',
                  }}
                >
                  {m.flagged ? 'Needs Attention' : 'Healthy'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SortableHeader({
  label,
  sortKey,
  currentKey,
  dir,
  onClick,
}: {
  label: string;
  sortKey: SortKey;
  currentKey: SortKey;
  dir: SortDir;
  onClick: (key: SortKey) => void;
}) {
  const arrow = currentKey === sortKey ? (dir === 'asc' ? ' ^' : ' v') : '';
  return (
    <th
      style={{ ...thStyle, cursor: 'pointer', userSelect: 'none' }}
      onClick={() => onClick(sortKey)}
    >
      {label}{arrow}
    </th>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '8px 12px',
  borderBottom: '2px solid #e5e7eb',
  fontSize: 14,
  fontWeight: 600,
};

const tdStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderBottom: '1px solid #f3f4f6',
  fontSize: 14,
};
