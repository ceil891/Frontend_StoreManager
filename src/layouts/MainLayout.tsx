import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation, Link } from 'react-router';
import { LogOut, Search, Menu, Store, ChevronRight, X, Moon, Sun, Command } from 'lucide-react';
import { useAuthStore, useAuthUser, useAuthRole } from '@/features/auth/store/authStore';
import { useRoleStore } from '@/features/hr/store/roleStore';
import { NAV_GROUPS } from '@/shared/config/navigation';
import { UserAvatar } from '@/shared/components/ui/UserAvatar';
import { useThemeStore } from '@/shared/store/themeStore';
import { CommandPalette, useCommandPalette } from '@/shared/components/ui/CommandPalette';
import { AIAlerts } from '@/components/AI/AIAlerts';
import { AIAssistant } from '@/components/AI/AIAssistant';
export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const user = useAuthUser();
  const role = useAuthRole();
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const location = useLocation();

  const { theme, toggleTheme } = useThemeStore();
  const { isOpen: cmdOpen, open: openCmd, close: closeCmd } = useCommandPalette();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const toggleGroup = (group: string) =>
    setCollapsedGroups((p) => ({ ...p, [group]: !p[group] }));

  const checkPermission = useRoleStore((s) => s.checkPermission);

  const filteredGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => !item.permission || (role && checkPermission(role, item.permission))
    ),
  })).filter((g) => g.items.length > 0);

  // Determine current breadcrumbs
  let currentGroup = '';
  let currentItem = '';
  for (const group of NAV_GROUPS) {
    const item = group.items.find(i => {
      if (i.href === '/') return location.pathname === '/';
      return location.pathname.startsWith(i.href);
    });
    if (item) {
      currentGroup = group.group;
      currentItem = item.name;
      break;
    }
  }

  return (
    <>
      <AIAssistant />
      {/* Command Palette — rendered at root level for correct z-index */}
      <CommandPalette isOpen={cmdOpen} onClose={closeCmd} />

      <div className="h-screen flex overflow-hidden bg-gray-50 dark:bg-gray-950">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-gray-900/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Sidebar ── */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex flex-col w-60 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Logo */}
          <div className="flex items-center justify-between h-14 px-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Store className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">RetailHub</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-thin">
            {filteredGroups.map((group) => (
              <div key={group.group} className="mb-1">
                <button
                  onClick={() => toggleGroup(group.group)}
                  className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
                >
                  <span>{group.group}</span>
                  <ChevronRight
                    className={`w-3 h-3 transition-transform duration-150 ${
                      collapsedGroups[group.group] ? '' : 'rotate-90'
                    }`}
                  />
                </button>

                {!collapsedGroups[group.group] && (
                  <div className="mt-0.5 space-y-0.5">
                    {group.items.map((item) => (
                      <NavLink
                        key={item.href}
                        to={item.href}
                        end={item.href === '/'}
                        onClick={() => setSidebarOpen(false)}
                        className={({ isActive }) =>
                          `group flex items-center gap-2.5 px-2.5 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                            isActive
                              ? 'bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-400'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                          }`
                        }
                      >
                        <item.icon className="w-4 h-4 shrink-0" />
                        <span className="truncate text-xs">{item.name}</span>
                        {item.badge && (
                          <span className="ml-auto text-[10px] bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-full px-1.5 py-0.5 font-semibold">
                            {item.badge}
                          </span>
                        )}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* User */}
          <div className="shrink-0 p-3 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
              <Link to="/settings/account" className="flex items-center gap-2.5 flex-1 min-w-0" onClick={() => setSidebarOpen(false)}>
                {user ? (
                  <UserAvatar
                    name={user.name}
                    avatarUrl={user.avatar}
                    seed={user.email}
                    size="xs"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-xs shrink-0">
                    U
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 dark:text-white truncate group-hover:text-emerald-600 transition-colors">{user?.name}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{user?.role}</p>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                title="Sign out"
                className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </aside>

        {/* ── Main Column ── */}
        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
          {/* Topbar */}
          <header className="shrink-0 h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3 px-4 sm:px-5">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Search bar — opens Command Palette */}
            <button
              onClick={openCmd}
              className="flex-1 max-w-sm flex items-center gap-2.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm text-gray-400 dark:text-gray-500 transition-colors group"
            >
              <Search className="w-4 h-4 shrink-0" />
              <span className="hidden sm:block">Search or jump to...</span>
              <span className="ml-auto hidden sm:flex items-center gap-1">
                <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium bg-white dark:bg-gray-700 text-gray-400 rounded border border-gray-200 dark:border-gray-600">
                  <Command className="w-2.5 h-2.5" />K
                </kbd>
              </span>
            </button>

            <div className="ml-auto flex items-center gap-1">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Notifications */}
              <AIAlerts />
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto">
            <div className="p-4 sm:p-6 lg:p-8 max-w-screen-2xl mx-auto">
              {currentGroup && currentItem && (
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-6 font-medium">
                  <Link to="/" className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
                    Home
                  </Link>
                  <ChevronRight className="w-3 h-3" />
                  <span>{currentGroup}</span>
                  <ChevronRight className="w-3 h-3" />
                  <span className="text-gray-900 dark:text-gray-200">{currentItem}</span>
                </div>
              )}
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
