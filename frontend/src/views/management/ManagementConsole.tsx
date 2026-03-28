import { useEffect, useState } from 'react';
import { LocationCard } from '../../components/management/LocationCard';
import { useAuthStore } from '../../stores/authStore';

interface LocationData {
  id: string;
  name: string;
  activeOrderCount: number;
  tempoStatus: 'green' | 'amber' | 'red';
  staffCount: number;
}

const API_BASE = '/api/v1';

async function fetchWithAuth(url: string) {
  const token = useAuthStore.getState().accessToken;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export function ManagementConsole() {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // In a real app, orgId would come from auth context
    const orgId = 'current'; // placeholder
    fetchWithAuth(`${API_BASE}/organizations/${orgId}/locations`)
      .then((data: LocationData[]) => {
        setLocations(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleCardClick = (locationId: string) => {
    // Placeholder: drill-down navigation
    console.log('Navigate to location:', locationId);
  };

  if (loading) {
    return <div data-testid="management-loading">Loading locations...</div>;
  }

  if (error) {
    return <div data-testid="management-error">Error: {error}</div>;
  }

  return (
    <div data-testid="management-console" style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>
        Organization Dashboard
      </h1>
      <div
        data-testid="location-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16,
        }}
      >
        {locations.map((loc) => (
          <LocationCard
            key={loc.id}
            name={loc.name}
            tempoStatus={loc.tempoStatus}
            orderCount={loc.activeOrderCount}
            staffCount={loc.staffCount}
            onClick={() => handleCardClick(loc.id)}
          />
        ))}
      </div>
      {locations.length === 0 && (
        <p data-testid="no-locations">No locations found.</p>
      )}
    </div>
  );
}
