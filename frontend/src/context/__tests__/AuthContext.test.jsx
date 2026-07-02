import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthProvider } from '../AuthContext.jsx';
import { useAuth } from '../../hooks/useAuth.js';

function RoleProbe() {
  const { user, hasRole } = useAuth();
  return (
    <div>
      <span data-testid="username">{user?.username ?? 'none'}</span>
      <span data-testid="is-donor">{hasRole('DONOR') ? 'yes' : 'no'}</span>
      <span data-testid="is-admin">{hasRole('ADMINISTRATOR') ? 'yes' : 'no'}</span>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('has no user and denies every role when nothing is stored', () => {
    render(<AuthProvider><RoleProbe /></AuthProvider>);
    expect(screen.getByTestId('username')).toHaveTextContent('none');
    expect(screen.getByTestId('is-donor')).toHaveTextContent('no');
  });

  it('restores the session and role checks from localStorage on mount', () => {
    localStorage.setItem('hh_user', JSON.stringify({
      userId: 1,
      username: 'donor_jane',
      roles: ['ROLE_DONOR'],
      emailVerified: true
    }));

    render(<AuthProvider><RoleProbe /></AuthProvider>);

    expect(screen.getByTestId('username')).toHaveTextContent('donor_jane');
    expect(screen.getByTestId('is-donor')).toHaveTextContent('yes');
    expect(screen.getByTestId('is-admin')).toHaveTextContent('no');
  });

  it('handles multiple roles on the same account', () => {
    localStorage.setItem('hh_user', JSON.stringify({
      userId: 2,
      username: 'multi_role',
      roles: ['ROLE_DONOR', 'ROLE_ADMINISTRATOR'],
      emailVerified: true
    }));

    render(<AuthProvider><RoleProbe /></AuthProvider>);

    expect(screen.getByTestId('is-donor')).toHaveTextContent('yes');
    expect(screen.getByTestId('is-admin')).toHaveTextContent('yes');
  });
});
