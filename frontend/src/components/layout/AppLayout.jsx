import { useState } from 'react'
import { Link, NavLink, useNavigate, useLocation, Outlet } from 'react-router-dom'
import { FileText, Plus, User, LogOut, Home, Search, Menu, X, BarChart3, Tag } from 'lucide-react'
import { useDispatch } from 'react-redux'
import { useAuth } from '../../hooks/useAuth'
import { APP_NAME, ROUTES } from '../../constants'
import { extractInitials } from '../../utils/formatters'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu'
import { StatsSidebar } from '../dashboard/StatsSidebar'
import { TagsSidebar } from '../dashboard/TagsSidebar'
import { QuickFilters } from '../dashboard/QuickFilters'
import { SearchBar } from '../notes/SearchBar'
import ConnectionStatus from '../common/ConnectionStatus'
import { useSocket } from '../../hooks/useSocket'
import { cn } from '../../lib/utils'

function SidebarSection({ title, children }) {
  return (
    <div className="px-3 py-2">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
        {title}
      </p>
      {children}
    </div>
  )
}

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Initialize socket connection for real-time updates (single instance for whole app)
  useSocket()

  const isDashboard = location.pathname === ROUTES.DASHBOARD
  const initials = extractInitials(user?.firstName, user?.lastName)

  async function handleLogout() {
    await logout()
    navigate(ROUTES.LOGIN, { replace: true })
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* ─── Navbar ─── */}
      <header className="fixed top-0 inset-x-0 z-40 h-16 flex items-center gap-3 px-4 border-b border-gray-200 bg-white">
        {/* Sidebar toggle (desktop) */}
        <button
          type="button"
          onClick={() => setSidebarOpen(o => !o)}
          className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>

        {/* Logo */}
        <Link to={ROUTES.DASHBOARD} className="flex items-center gap-2 flex-shrink-0">
          <img src="/notesapp-logo.png" alt="Pearl Notes Logo" className="w-8 h-8 object-contain rounded-lg" />
          <span className="font-bold text-lg text-gray-900 hidden sm:block">{APP_NAME}</span>
        </Link>


        {/* Search bar — center, desktop, only on dashboard */}
        {isDashboard && (
          <div className="hidden md:flex flex-1 max-w-md mx-auto">
            <SearchBar className="w-full" />
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <ConnectionStatus />
          {/* User avatar dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-sm flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-indigo-300 transition-all select-none overflow-hidden border border-gray-100">
                {user?.profilePicture ? (
                  <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              <DropdownMenuItem onClick={() => navigate(ROUTES.PROFILE)}>
                <User className="w-4 h-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 hover:bg-red-50">
                <LogOut className="w-4 h-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex flex-1 pt-16">
        {/* ─── Desktop Sidebar ─── */}
        <aside
          className={cn(
            'hidden md:flex flex-col fixed left-0 top-16 bottom-0 z-30 border-r border-gray-200 bg-white overflow-y-auto overflow-x-hidden transition-all duration-200',
            sidebarOpen ? 'w-64' : 'w-0'
          )}
        >
          {/* Navigation / Quick filters */}
          <SidebarSection title="Navigate">
            <QuickFilters />
          </SidebarSection>

          <div className="border-t border-gray-100" />

          {/* Stats */}
          <SidebarSection title="Your Notes">
            <StatsSidebar />
          </SidebarSection>

          <div className="border-t border-gray-100" />

          {/* Tags */}
          <SidebarSection title="My Tags">
            <TagsSidebar />
          </SidebarSection>

        </aside>

        {/* ─── Main content ─── */}
        <main
          className={cn(
            'flex-1 min-w-0 flex flex-col transition-all duration-200 pb-16 md:pb-0',
            sidebarOpen ? 'md:ml-64' : 'md:ml-0'
          )}
        >
          <Outlet />
        </main>
      </div>

      {/* ─── Mobile bottom nav ─── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 h-16 flex items-center justify-around border-t border-gray-200 bg-white">
        <NavLink
          to={ROUTES.DASHBOARD}
          className={({ isActive }) =>
            cn('flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium transition-colors',
              isActive ? 'text-indigo-600' : 'text-gray-500')
          }
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </NavLink>

        <NavLink
          to={ROUTES.DASHBOARD}
          onClick={e => { e.preventDefault(); navigate(ROUTES.DASHBOARD) }}
          className="flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium text-gray-500"
        >
          <Search className="w-5 h-5" />
          <span>Search</span>
        </NavLink>

        <NavLink
          to={ROUTES.NOTE_NEW}
          className="flex flex-col items-center gap-0.5 text-xs font-medium"
        >
          <div className="w-12 h-12 -mt-4 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg">
            <Plus className="w-5 h-5" />
          </div>
        </NavLink>

        <NavLink
          to={ROUTES.PROFILE}
          className={({ isActive }) =>
            cn('flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium transition-colors',
              isActive ? 'text-indigo-600' : 'text-gray-500')
          }
        >
          <User className="w-5 h-5" />
          <span>Profile</span>
        </NavLink>
      </nav>
    </div>
  )
}
