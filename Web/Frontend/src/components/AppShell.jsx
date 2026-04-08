import React from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV = [
  {
    section: 'Overview',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: <HomeIcon /> },
      { to: '/citizens', label: 'Citizens', icon: <UsersIcon /> },
    ],
  },
  {
    section: 'Simulator',
    items: [
      { to: '/policy', label: 'Policy Input', icon: <DocIcon /> },
      { to: '/simulate', label: 'Run Simulation', icon: <PlayIcon /> },
      { to: '/results', label: 'Results', icon: <ChartIcon /> },
    ],
  },
]

const PAGE_TITLES = {
  '/dashboard': { title: 'Dashboard', sub: 'Overview of system activity' },
  '/citizens': { title: 'Citizens', sub: 'Browse and filter citizen dataset' },
  '/policy': { title: 'Policy Input', sub: 'Parse policy text using AI' },
  '/simulate': { title: 'Run Simulation', sub: 'Apply rules to citizen data' },
  '/results': { title: 'Results & Analysis', sub: 'View impact metrics and breakdown' },
}

export default function AppShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const page = PAGE_TITLES[location.pathname] || { title: 'PolicySim', sub: '' }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)
    : 'U'

  return (
    <div className="app-shell">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">
            <div className="logo-icon">📋</div>
            <div>
              <div className="logo-text">PIS</div>
              <div className="logo-sub">Impact Simulator</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(section => (
            <div key={section.section}>
              <div className="nav-section-label">{section.section}</div>
              {section.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="user-avatar">{initials}</div>
            <div>
              <div className="user-name">{user?.name || 'User'}</div>
              <div className="user-role">{user?.role || user?.department || 'Analyst'}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogoutIcon />
            Sign out
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="main-content">
        <div className="topbar">
          <div>
            <div className="topbar-title">{page.title}</div>
          </div>
          <div className="topbar-sub">{page.sub}</div>
        </div>
        <div className="page-body fade-in">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

// ── SVG ICONS ──────────────────────────────────────────
function HomeIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h4v-4h2v4h4a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
    </svg>
  )
}

function DocIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/>
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
      <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h7a1 1 0 100-2H4V5h6a1 1 0 100-2H3zm11.293 4.293a1 1 0 011.414 0l2 2a1 1 0 010 1.414l-2 2a1 1 0 01-1.414-1.414L15.586 11H9a1 1 0 110-2h6.586l-.293-.293a1 1 0 010-1.414z" clipRule="evenodd"/>
    </svg>
  )
}
