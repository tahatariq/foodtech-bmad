import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders FoodTech heading', () => {
    render(<App />);
    expect(screen.getByText('FoodTech')).toBeInTheDocument();
  });

  it('renders connection status placeholder', () => {
    render(<App />);
    expect(screen.getByText('Initializing...')).toBeInTheDocument();
  });
});
