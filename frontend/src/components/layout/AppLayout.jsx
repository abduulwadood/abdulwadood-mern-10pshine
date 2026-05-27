import { useState } from 'react'
import { NavLink, useNavigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { APP_NAME, ROUTES } from '../../constants'

const navItems = [
  { to: ROUTES.DASHBOARD, icon: '🏠', label: 'Dashboard' },
  { to: ROUTES.NOTE_NEW, icon: '✏️', label: 'New Note' },
  { to: ROUTES.PROFILE, icon: '👤', label: 'Profile' },
]

function NavItem({ to, icon, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        }`
      }
    >
      <span className="text-base">{icon}</span>
      <span>{label}</span>
    </NavLink>
  )
}

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate(ROUTES.LOGIN)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navbar */}
      <header className="fixed top-0 inset-x-0 z-40 h-14 flex items-center px-4 border-b border-border bg-background/95 backdrop-blur">
        <button
          onClick={() => setSidebarOpen(o => !o)}
          className="hidden md:flex items-center justify-center w-8 h-8 rounded-md hover:bg-muted mr-3"
          aria-label="Toggle sidebar"
        >
          ☰
        </button>
        <span className="text-lg font-bold text-foreground flex items-center gap-2">
          <span>📝</span>
          <span className="hidden sm:inline">{APP_NAME}</span>
        </span>
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden sm:block text-sm text-muted-foreground">
            {user?.firstName} {user?.lastName}
          </span>
          <button
            onClick={handleLogout}
            className="text-sm px-3 py-1.5 rounded-md border border-border hover:bg-muted transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex flex-1 pt-14">
        {/* Sidebar — desktop only */}
        <aside
          className={`hidden md:flex flex-col fixed left-0 top-14 bottom-0 z-30 border-r border-border bg-background transition-all duration-200 ${
            sidebarOpen ? 'w-56' : 'w-0 overflow-hidden'
          }`}
        >
          <nav className="flex-1 p-3 space-y-1">
            {navItems.map(item => (
              <NavItem key={item.to} {...item} />
            ))}
          </nav>
          <div className="p-3 border-t border-border">
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
        </aside>

        {/* Main content */}
        <main
          className={`flex-1 min-w-0 transition-all duration-200 ${
            sidebarOpen ? 'md:ml-56' : 'md:ml-0'
          }`}
        >
          <div className="p-4 md:p-6 pb-20 md:pb-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 h-16 flex items-center justify-around border-t border-border bg-background/95 backdrop-blur">
        {navItems.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`
            }
          >
            <span className="text-xl">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium text-muted-foreground"
        >
          <span className="text-xl">🚪</span>
          <span>Logout</span>
        </button>
      </nav>
    </div>
  )
}
