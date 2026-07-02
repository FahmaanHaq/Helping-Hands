import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import RequestStatusBadge from '../RequestStatusBadge.jsx';

describe('RequestStatusBadge', () => {
  it('renders the status text with underscores replaced by spaces', () => {
    render(<RequestStatusBadge status="IN_PROGRESS" />);
    expect(screen.getByText('IN PROGRESS')).toBeInTheDocument();
  });

  it('renders known statuses without throwing', () => {
    const statuses = ['CREATED', 'PLEDGED', 'ACCEPTED', 'IN_PROGRESS', 'DELIVERED', 'COMPLETED', 'CANCELLED'];
    statuses.forEach((status) => {
      const { unmount } = render(<RequestStatusBadge status={status} />);
      expect(screen.getByText(status.replace('_', ' '))).toBeInTheDocument();
      unmount();
    });
  });
});
