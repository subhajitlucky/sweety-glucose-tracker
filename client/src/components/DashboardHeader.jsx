import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { formatDateWithWeekday, initials, todayISO } from '../lib/dates.js';
import { Brand } from './Brand.jsx';
import { IconCalendar, IconLogout } from './Icons.jsx';

export default function DashboardHeader() {
  const { user, logout } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  async function handleLogout() {
    setSigningOut(true);
    try {
      await logout();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <header className="dashboard-header">
      <div className="dashboard-header__inner">
        <Brand markSize={36} />

        <div className="dashboard-header__right">
          <span className="header-date">
            <IconCalendar size={16} />
            {formatDateWithWeekday(todayISO())}
          </span>

          <span className="header-divider" aria-hidden="true" />

          <div className="user-cluster">
            <span className="avatar" aria-hidden="true">
              {initials(user?.name)}
            </span>
            <span className="user-cluster__copy">
              <strong>{user?.name}</strong>
              <small>{user?.email}</small>
            </span>
          </div>

          <button
            type="button"
            className="btn btn--quiet btn--icon-text"
            onClick={handleLogout}
            disabled={signingOut}
            aria-label="Log out"
          >
            {signingOut ? (
              <span className="spinner spinner--small" aria-hidden="true" />
            ) : (
              <IconLogout size={17} />
            )}
            <span>Log out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
