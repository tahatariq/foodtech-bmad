import { useState } from 'react';
import type { FormEvent } from 'react';

type WizardStep =
  | 'basic-info'
  | 'station-layout'
  | 'order-stages'
  | 'menu-import'
  | 'inventory-thresholds'
  | 'staff-roles'
  | 'pos-integration'
  | 'review-activate';

const STEPS: { key: WizardStep; label: string }[] = [
  { key: 'basic-info', label: 'Basic Info' },
  { key: 'station-layout', label: 'Station Layout' },
  { key: 'order-stages', label: 'Order Stages' },
  { key: 'menu-import', label: 'Menu Import' },
  { key: 'inventory-thresholds', label: 'Inventory Thresholds' },
  { key: 'staff-roles', label: 'Staff & Roles' },
  { key: 'pos-integration', label: 'POS Integration' },
  { key: 'review-activate', label: 'Review & Activate' },
];

interface StationInput {
  name: string;
  emoji: string;
}

interface StageInput {
  name: string;
  sequence: number;
}

export function OnboardingWizard() {
  const [stepIndex, setStepIndex] = useState(0);
  const [tenantName, setTenantName] = useState('');
  const [tier, setTier] = useState<'indie' | 'growth' | 'enterprise'>('indie');
  const [stationsInput, setStationsInput] = useState<StationInput[]>([
    { name: '', emoji: '' },
  ]);
  const [stagesInput] = useState<StageInput[]>([
    { name: 'received', sequence: 0 },
    { name: 'preparing', sequence: 1 },
    { name: 'plating', sequence: 2 },
    { name: 'served', sequence: 3 },
  ]);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);
  const [activated, setActivated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentStep = STEPS[stepIndex];

  const goNext = () => {
    if (stepIndex < STEPS.length - 1) setStepIndex(stepIndex + 1);
  };

  const goPrev = () => {
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  };

  const addStation = () => {
    setStationsInput([...stationsInput, { name: '', emoji: '' }]);
  };

  const removeStation = (index: number) => {
    setStationsInput(stationsInput.filter((_, i) => i !== index));
  };

  const updateStation = (
    index: number,
    field: keyof StationInput,
    value: string,
  ) => {
    const updated = [...stationsInput];
    updated[index] = { ...updated[index], [field]: value };
    setStationsInput(updated);
  };

  const handleCreateTenant = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tenantName, tier }),
      });
      if (!res.ok) throw new Error('Failed to create tenant');
      const data = (await res.json()) as { tenantId: string };
      setTenantId(data.tenantId);
      goNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleActivate = async () => {
    if (!tenantId) return;
    setActivating(true);
    setError(null);
    try {
      const validStations = stationsInput.filter((s) => s.name.trim());
      const res = await fetch(`/api/admin/tenants/${tenantId}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stations: validStations.map((s) => ({
            name: s.name,
            emoji: s.emoji || undefined,
          })),
          stages: stagesInput,
        }),
      });
      if (!res.ok) throw new Error('Failed to activate tenant');
      setActivated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setActivating(false);
    }
  };

  return (
    <div data-testid="onboarding-wizard" style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
      <h1 data-testid="wizard-title">Tenant Onboarding</h1>

      {/* Step indicator */}
      <div data-testid="step-indicator" style={{ marginBottom: 24 }}>
        Step {stepIndex + 1} of {STEPS.length}: {currentStep.label}
      </div>

      {error && (
        <div data-testid="error-message" style={{ color: 'red', marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Step: Basic Info */}
      {currentStep.key === 'basic-info' && (
        <form data-testid="basic-info-step" onSubmit={handleCreateTenant}>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="tenant-name">Restaurant Name</label>
            <input
              id="tenant-name"
              data-testid="tenant-name-input"
              type="text"
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value)}
              required
              style={{ display: 'block', width: '100%', padding: 8, marginTop: 4 }}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="tier-select">Subscription Tier</label>
            <select
              id="tier-select"
              data-testid="tier-select"
              value={tier}
              onChange={(e) =>
                setTier(e.target.value as 'indie' | 'growth' | 'enterprise')
              }
              style={{ display: 'block', width: '100%', padding: 8, marginTop: 4 }}
            >
              <option value="indie">Indie</option>
              <option value="growth">Growth</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <button data-testid="next-button" type="submit">
            Create & Continue
          </button>
        </form>
      )}

      {/* Step: Station Layout */}
      {currentStep.key === 'station-layout' && (
        <div data-testid="station-layout-step">
          <h2>Stations</h2>
          {stationsInput.map((station, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                data-testid={`station-name-${i}`}
                placeholder="Station name"
                value={station.name}
                onChange={(e) => updateStation(i, 'name', e.target.value)}
                style={{ flex: 1, padding: 8 }}
              />
              <input
                data-testid={`station-emoji-${i}`}
                placeholder="Emoji"
                value={station.emoji}
                onChange={(e) => updateStation(i, 'emoji', e.target.value)}
                style={{ width: 60, padding: 8 }}
              />
              {stationsInput.length > 1 && (
                <button
                  data-testid={`remove-station-${i}`}
                  onClick={() => removeStation(i)}
                  type="button"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button data-testid="add-station" onClick={addStation} type="button">
            Add Station
          </button>
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <button data-testid="prev-button" onClick={goPrev} type="button">
              Back
            </button>
            <button data-testid="next-button" onClick={goNext} type="button">
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step: Order Stages */}
      {currentStep.key === 'order-stages' && (
        <div data-testid="order-stages-step">
          <h2>Order Stages</h2>
          {stagesInput.map((stage, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <span>
                {stage.sequence}. {stage.name}
              </span>
            </div>
          ))}
          <p>Default stages are pre-configured. Customize as needed.</p>
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <button data-testid="prev-button" onClick={goPrev} type="button">
              Back
            </button>
            <button data-testid="next-button" onClick={goNext} type="button">
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step: Menu Import (placeholder) */}
      {currentStep.key === 'menu-import' && (
        <div data-testid="menu-import-step">
          <h2>Menu Import</h2>
          <p>CSV menu import will be available here. Skip for now.</p>
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <button data-testid="prev-button" onClick={goPrev} type="button">
              Back
            </button>
            <button data-testid="next-button" onClick={goNext} type="button">
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step: Inventory Thresholds (placeholder) */}
      {currentStep.key === 'inventory-thresholds' && (
        <div data-testid="inventory-thresholds-step">
          <h2>Inventory Thresholds</h2>
          <p>Configure reorder thresholds after import. Skip for now.</p>
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <button data-testid="prev-button" onClick={goPrev} type="button">
              Back
            </button>
            <button data-testid="next-button" onClick={goNext} type="button">
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step: Staff & Roles (placeholder) */}
      {currentStep.key === 'staff-roles' && (
        <div data-testid="staff-roles-step">
          <h2>Staff & Roles</h2>
          <p>Invite staff and assign roles. Skip for now.</p>
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <button data-testid="prev-button" onClick={goPrev} type="button">
              Back
            </button>
            <button data-testid="next-button" onClick={goNext} type="button">
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step: POS Integration (placeholder) */}
      {currentStep.key === 'pos-integration' && (
        <div data-testid="pos-integration-step">
          <h2>POS Integration</h2>
          <p>Connect your point-of-sale system. Skip for now.</p>
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <button data-testid="prev-button" onClick={goPrev} type="button">
              Back
            </button>
            <button data-testid="next-button" onClick={goNext} type="button">
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step: Review & Activate */}
      {currentStep.key === 'review-activate' && (
        <div data-testid="review-activate-step">
          <h2>Review & Activate</h2>
          {activated ? (
            <div data-testid="activation-success">
              <p>Tenant activated successfully!</p>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 16 }}>
                <h3>Summary</h3>
                <p>
                  <strong>Name:</strong> {tenantName}
                </p>
                <p>
                  <strong>Tier:</strong> {tier}
                </p>
                <p>
                  <strong>Stations:</strong>{' '}
                  {stationsInput
                    .filter((s) => s.name.trim())
                    .map((s) => s.name)
                    .join(', ') || 'None'}
                </p>
                <p>
                  <strong>Stages:</strong>{' '}
                  {stagesInput.map((s) => s.name).join(' -> ')}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button data-testid="prev-button" onClick={goPrev} type="button">
                  Back
                </button>
                <button
                  data-testid="activate-button"
                  onClick={() => void handleActivate()}
                  disabled={activating || !tenantId}
                  type="button"
                >
                  {activating ? 'Activating...' : 'Activate Tenant'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
