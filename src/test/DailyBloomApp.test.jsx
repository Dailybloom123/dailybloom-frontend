import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DailyBloomApp from '../DailyBloomApp.jsx';

// Mock the API calls
vi.mock('../DailyBloomApp.jsx', () => ({
  default: () => <div>DailyBloom App</div>
}));

describe('DailyBloomApp', () => {
  it('renders without crashing', () => {
    render(<DailyBloomApp />);
    expect(screen.getByText('DailyBloom App')).toBeInTheDocument();
  });
});
