import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PrepChecklist } from './PrepChecklist';

const mockItems = [
  { id: '1', description: 'Prep mise en place', isCompleted: false },
  { id: '2', description: 'Check fryer oil', isCompleted: true },
  { id: '3', description: 'Stock line cooler', isCompleted: false },
];

describe('PrepChecklist', () => {
  it('renders all checklist items', () => {
    render(
      <PrepChecklist name="Grill Prep" items={mockItems} onToggle={vi.fn()} />,
    );
    expect(screen.getByText('Prep mise en place')).toBeInTheDocument();
    expect(screen.getByText('Check fryer oil')).toBeInTheDocument();
    expect(screen.getByText('Stock line cooler')).toBeInTheDocument();
  });

  it('shows completion percentage', () => {
    render(
      <PrepChecklist name="Grill Prep" items={mockItems} onToggle={vi.fn()} />,
    );
    expect(screen.getByText('1/3 (33%)')).toBeInTheDocument();
  });

  it('calls onToggle when checkbox is clicked', () => {
    const onToggle = vi.fn();
    render(
      <PrepChecklist name="Grill Prep" items={mockItems} onToggle={onToggle} />,
    );
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    expect(onToggle).toHaveBeenCalledWith('1', true);
  });

  it('has aria-label on each checkbox', () => {
    render(
      <PrepChecklist name="Grill Prep" items={mockItems} onToggle={vi.fn()} />,
    );
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[0]).toHaveAttribute('aria-label', 'Prep mise en place');
  });

  it('has group aria-label with checklist name', () => {
    render(
      <PrepChecklist name="Grill Prep" items={mockItems} onToggle={vi.fn()} />,
    );
    expect(
      screen.getByRole('group', { name: 'Prep checklist: Grill Prep' }),
    ).toBeInTheDocument();
  });
});
