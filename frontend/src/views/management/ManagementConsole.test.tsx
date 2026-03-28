import { render, screen, fireEvent } from '@testing-library/react';
import { ManagementConsole } from './ManagementConsole';

const mockLocations = [
  {
    id: 'loc-1',
    name: 'Downtown',
    activeOrderCount: 8,
    tempoStatus: 'green' as const,
    staffCount: 3,
  },
  {
    id: 'loc-2',
    name: 'Uptown',
    activeOrderCount: 15,
    tempoStatus: 'amber' as const,
    staffCount: 5,
  },
];

describe('ManagementConsole', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockLocations),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders location cards after loading', async () => {
    render(<ManagementConsole />);

    // Wait for loading to finish
    await screen.findByTestId('management-console');

    const cards = screen.getAllByTestId('location-card');
    expect(cards).toHaveLength(2);
  });

  it('renders location names', async () => {
    render(<ManagementConsole />);

    await screen.findByTestId('management-console');

    expect(screen.getByText('Downtown')).toBeInTheDocument();
    expect(screen.getByText('Uptown')).toBeInTheDocument();
  });

  it('handles card click', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    render(<ManagementConsole />);

    await screen.findByTestId('management-console');

    const cards = screen.getAllByTestId('location-card');
    fireEvent.click(cards[0]);

    expect(consoleSpy).toHaveBeenCalledWith('Navigate to location:', 'loc-1');
    consoleSpy.mockRestore();
  });

  it('shows error message on fetch failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    render(<ManagementConsole />);

    await screen.findByTestId('management-error');

    expect(screen.getByTestId('management-error')).toHaveTextContent('Error:');
  });
});
