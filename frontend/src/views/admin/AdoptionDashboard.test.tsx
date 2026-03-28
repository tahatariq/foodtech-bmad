import { render, screen } from '@testing-library/react';
import { AdoptionDashboard } from './AdoptionDashboard';

// Mock window.matchMedia for AttentionWrapper
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

const mockMetrics = [
  {
    tenantId: 'loc-1',
    tenantName: 'Org A - Main',
    bumpUsageRate: 80,
    activeUsersPerDay: 5,
    daysSinceOnboarding: 10,
    flagged: false,
  },
  {
    tenantId: 'loc-2',
    tenantName: 'Org B - Downtown',
    bumpUsageRate: 30,
    activeUsersPerDay: 1,
    daysSinceOnboarding: 7,
    flagged: true,
  },
];

describe('AdoptionDashboard', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockMetrics),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders tenant metrics table', async () => {
    render(<AdoptionDashboard />);

    await screen.findByTestId('adoption-dashboard');

    expect(screen.getByTestId('adoption-table')).toBeInTheDocument();
    expect(screen.getByText('Org A - Main')).toBeInTheDocument();
    expect(screen.getByText('Org B - Downtown')).toBeInTheDocument();
  });

  it('flags low-adoption tenants', async () => {
    render(<AdoptionDashboard />);

    await screen.findByTestId('adoption-dashboard');

    // Org B should be flagged
    expect(screen.getByTestId('flagged-usage')).toHaveTextContent('30%');
    expect(screen.getByTestId('flagged-badge')).toHaveTextContent('Needs Attention');

    // Org A should be healthy
    expect(screen.getByTestId('healthy-badge')).toHaveTextContent('Healthy');
  });

  it('shows loading state', () => {
    global.fetch = vi.fn().mockReturnValue(new Promise(() => {})); // never resolves

    render(<AdoptionDashboard />);

    expect(screen.getByTestId('adoption-loading')).toBeInTheDocument();
  });

  it('shows error state on fetch failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    render(<AdoptionDashboard />);

    await screen.findByTestId('adoption-error');

    expect(screen.getByTestId('adoption-error')).toHaveTextContent('Error:');
  });
});
