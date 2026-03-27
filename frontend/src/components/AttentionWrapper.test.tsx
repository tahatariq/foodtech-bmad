import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AttentionWrapper } from './AttentionWrapper';

function mockMatchMedia(matches: boolean) {
  const listeners: ((e: MediaQueryListEvent) => void)[] = [];
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matches,
      addEventListener: (_: string, fn: (e: MediaQueryListEvent) => void) =>
        listeners.push(fn),
      removeEventListener: (_: string, fn: (e: MediaQueryListEvent) => void) => {
        const idx = listeners.indexOf(fn);
        if (idx >= 0) listeners.splice(idx, 1);
      },
    })),
  });
}

describe('AttentionWrapper', () => {
  beforeEach(() => {
    mockMatchMedia(false);
  });

  it('renders children at all levels', () => {
    const levels = ['healthy', 'watching', 'warning', 'critical', 'resolved'] as const;
    for (const level of levels) {
      const { unmount } = render(
        <AttentionWrapper level={level}>
          <span>content-{level}</span>
        </AttentionWrapper>,
      );
      expect(screen.getByText(`content-${level}`)).toBeInTheDocument();
      unmount();
    }
  });

  it('applies correct data-attention-level attribute', () => {
    render(
      <AttentionWrapper level="warning">
        <span>child</span>
      </AttentionWrapper>,
    );
    expect(screen.getByTestId('attention-wrapper')).toHaveAttribute(
      'data-attention-level',
      'warning',
    );
  });

  it('applies resolved style with reduced opacity', () => {
    render(
      <AttentionWrapper level="resolved">
        <span>child</span>
      </AttentionWrapper>,
    );
    expect(screen.getByTestId('attention-wrapper')).toHaveStyle({
      opacity: '0.7',
    });
  });

  it('uses border-only styles when prefers-reduced-motion is set', () => {
    mockMatchMedia(true);
    render(
      <AttentionWrapper level="critical">
        <span>child</span>
      </AttentionWrapper>,
    );
    const wrapper = screen.getByTestId('attention-wrapper');
    expect(wrapper.style.animation).toBeFalsy();
    expect(wrapper).toHaveStyle({ borderWidth: '3px' });
  });

  it('uses border styles for warning in reduced-motion mode', () => {
    mockMatchMedia(true);
    render(
      <AttentionWrapper level="warning">
        <span>child</span>
      </AttentionWrapper>,
    );
    const wrapper = screen.getByTestId('attention-wrapper');
    expect(wrapper.style.animation).toBeFalsy();
    expect(wrapper).toHaveStyle({ borderWidth: '2px', borderStyle: 'solid' });
  });

  it('applies animation styles for warning when motion is allowed', () => {
    mockMatchMedia(false);
    render(
      <AttentionWrapper level="warning">
        <span>child</span>
      </AttentionWrapper>,
    );
    const wrapper = screen.getByTestId('attention-wrapper');
    expect(wrapper.style.animation).toBeTruthy();
  });

  it('applies animation styles for critical when motion is allowed', () => {
    mockMatchMedia(false);
    render(
      <AttentionWrapper level="critical">
        <span>child</span>
      </AttentionWrapper>,
    );
    const wrapper = screen.getByTestId('attention-wrapper');
    expect(wrapper.style.animation).toBeTruthy();
  });
});
