type Tier = 'indie' | 'growth' | 'enterprise';

interface TierUpgradePromptProps {
  currentTier: Tier;
}

const TIER_COMPARISON = [
  { feature: 'Locations', indie: '1', growth: '10', enterprise: 'Unlimited' },
  { feature: 'Staff', indie: '5', growth: '50', enterprise: 'Unlimited' },
  { feature: 'Supplier API', indie: 'No', growth: 'Yes', enterprise: 'Yes' },
  { feature: 'Supplier Portal', indie: 'No', growth: 'Yes', enterprise: 'Yes' },
  { feature: 'SSO', indie: 'No', growth: 'No', enterprise: 'Yes' },
];

export function TierUpgradePrompt({ currentTier }: TierUpgradePromptProps) {
  return (
    <div data-testid="tier-upgrade-prompt-view" style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
        Subscription Plans
      </h2>
      <p data-testid="current-tier" style={{ marginBottom: 16, color: '#6b7280' }}>
        Current plan: <strong>{currentTier}</strong>
      </p>

      <table
        data-testid="tier-comparison-table"
        style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}
      >
        <thead>
          <tr>
            <th style={thStyle}>Feature</th>
            <th style={{ ...thStyle, ...(currentTier === 'indie' ? highlightStyle : {}) }}>Indie</th>
            <th style={{ ...thStyle, ...(currentTier === 'growth' ? highlightStyle : {}) }}>Growth</th>
            <th style={{ ...thStyle, ...(currentTier === 'enterprise' ? highlightStyle : {}) }}>Enterprise</th>
          </tr>
        </thead>
        <tbody>
          {TIER_COMPARISON.map((row) => (
            <tr key={row.feature}>
              <td style={tdStyle}>{row.feature}</td>
              <td style={{ ...tdStyle, ...(currentTier === 'indie' ? highlightStyle : {}) }}>{row.indie}</td>
              <td style={{ ...tdStyle, ...(currentTier === 'growth' ? highlightStyle : {}) }}>{row.growth}</td>
              <td style={{ ...tdStyle, ...(currentTier === 'enterprise' ? highlightStyle : {}) }}>{row.enterprise}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {currentTier !== 'enterprise' && (
        <a
          data-testid="upgrade-cta"
          href="mailto:sales@foodtech.app?subject=Upgrade%20Request"
          style={{
            display: 'inline-block',
            padding: '10px 24px',
            backgroundColor: '#3b82f6',
            color: '#fff',
            borderRadius: 6,
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Contact Sales to Upgrade
        </a>
      )}
    </div>
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

const highlightStyle: React.CSSProperties = {
  backgroundColor: '#eff6ff',
};
