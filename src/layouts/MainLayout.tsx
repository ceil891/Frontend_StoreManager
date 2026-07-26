import { useState, useEffect, useMemo } from 'react';
import { NavLink, Outlet, useNavigate, useLocation, Link } from 'react-router';
import { LogOut, Search, Menu, Store, ChevronRight, X, Moon, Sun, Command } from 'lucide-react';
import { useAuthStore, useAuthUser, useAuthPermissions } from '@/features/auth/store/authStore';
import { NAV_GROUPS, type NavItem } from '@/shared/config/navigation';
import { UserAvatar } from '@/shared/components/ui/UserAvatar';
import { useThemeStore } from '@/shared/store/themeStore';
import { CommandPalette, useCommandPalette } from '@/shared/components/ui/CommandPalette';
import { AIAlerts } from '@/components/AI/AIAlerts';
import { AIAssistant } from '@/components/AI/AIAssistant';

function getAllHrefs(items: NavItem[]): string[] {
  const hrefs: string[] = [];
  for (const item of items) {
    if (item.href) hrefs.push(item.href);
    if (item.children) hrefs.push(...getAllHrefs(item.children));
  }
  return hrefs;
}

function isHrefActive(href: string, pathname: string, allHrefs: string[]): boolean {
  if (href === '/') return pathname === '/';
  if (pathname === href) return true;
  if (pathname.startsWith(href)) {
    const hasBetterMatch = allHrefs.some(
      (other) => other !== href && other.length > href.length && pathname.startsWith(other)
    );
    return !hasBetterMatch;
  }
  return false;
}

function isItemActive(item: NavItem, pathname: string, allHrefs: string[]): boolean {
  if (item.children && item.children.length > 0) {
    return item.children.some((child) => isItemActive(child, pathname, allHrefs));
  }
  if (item.href) {
    return isHrefActive(item.href, pathname, allHrefs);
  }
  return false;
}

function filterNavItem(item: NavItem, permissions: string[]): NavItem | null {
  if (item.children && item.children.length > 0) {
    const validChildren = item.children
      .map((child) => filterNavItem(child, permissions))
      .filter((c): c is NavItem => c !== null);
    if (validChildren.length > 0) {
      return { ...item, children: validChildren };
    }
    return null;
  }
  if (!item.permission || permissions.includes(item.permission)) {
    return item;
  }
  return null;
}

export function MainLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const allHrefs = useMemo(() => {
    const list: string[] = [];
    for (const group of NAV_GROUPS) {
      list.push(...getAllHrefs(group.items));
    }
    return list;
  }, []);

  // Top-level collapsed groups
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('retailhub_sidebar_collapsed');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    const initial: Record<string, boolean> = {};
    for (const group of NAV_GROUPS) {
      const hasActive = group.items.some((item) => isItemActive(item, location.pathname, allHrefs));
      initial[group.group] = !hasActive;
    }
    return initial;
  });

  // Sub-groups collapsed state (Key: `${group.group}::${item.name}`)
  const [collapsedSubGroups, setCollapsedSubGroups] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('retailhub_sidebar_sub_collapsed');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    const initial: Record<string, boolean> = {};
    for (const group of NAV_GROUPS) {
      for (const item of group.items) {
        if (item.children && item.children.length > 0) {
          const subKey = `${group.group}::${item.name}`;
          const hasActive = item.children.some((child) => isItemActive(child, location.pathname, allHrefs));
          initial[subKey] = !hasActive;
        }
      }
    }
    return initial;
  });

  const user = useAuthUser();
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const { theme, toggleTheme } = useThemeStore();
  const { isOpen: cmdOpen, open: openCmd, close: closeCmd } = useCommandPalette();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const toggleGroup = (group: string) =>
    setCollapsedGroups((p) => {
      const next = { ...p, [group]: !p[group] };
      localStorage.setItem('retailhub_sidebar_collapsed', JSON.stringify(next));
      return next;
    });

  const toggleSubGroup = (subKey: string) =>
    setCollapsedSubGroups((p) => {
      const next = { ...p, [subKey]: !p[subKey] };
      localStorage.setItem('retailhub_sidebar_sub_collapsed', JSON.stringify(next));
      return next;
    });

  // Auto-expand group & sub-group when route changes to an active child
  useEffect(() => {
    let groupUpdated = false;
    const nextGroup = { ...collapsedGroups };

    let subGroupUpdated = false;
    const nextSubGroup = { ...collapsedSubGroups };

    for (const group of NAV_GROUPS) {
      const groupActive = group.items.some((item) => isItemActive(item, location.pathname, allHrefs));
      if (groupActive && collapsedGroups[group.group] !== false) {
        nextGroup[group.group] = false;
        groupUpdated = true;
      }

      for (const item of group.items) {
        if (item.children && item.children.length > 0) {
          const subKey = `${group.group}::${item.name}`;
          const subActive = item.children.some((child) => isItemActive(child, location.pathname, allHrefs));
          if (subActive && collapsedSubGroups[subKey] !== false) {
            nextSubGroup[subKey] = false;
            subGroupUpdated = true;
          }
        }
      }
    }

    if (groupUpdated) {
      setCollapsedGroups(nextGroup);
      localStorage.setItem('retailhub_sidebar_collapsed', JSON.stringify(nextGroup));
    }
    if (subGroupUpdated) {
      setCollapsedSubGroups(nextSubGroup);
      localStorage.setItem('retailhub_sidebar_sub_collapsed', JSON.stringify(nextSubGroup));
    }
  }, [location.pathname, allHrefs]);

  const permissions = useAuthPermissions();

  const filteredGroups = useMemo(() => {
    return NAV_GROUPS.map((group) => {
      const validItems = group.items
        .map((item) => filterNavItem(item, permissions))
        .filter((i): i is NavItem => i !== null);
      return {
        ...group,
        items: validItems,
      };
    }).filter((g) => g.items.length > 0);
  }, [permissions]);

  // Breadcrumbs path computation
  let currentGroup = '';
  let currentSubGroup = '';
  let currentItem = '';

  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (item.children && item.children.length > 0) {
        const activeChild = item.children.find(
          (child) => child.href && isHrefActive(child.href, location.pathname, allHrefs)
        );
        if (activeChild) {
          currentGroup = group.group;
          currentSubGroup = item.name;
          currentItem = activeChild.name;
          break;
        }
      } else if (item.href && isHrefActive(item.href, location.pathname, allHrefs)) {
        currentGroup = group.group;
        currentItem = item.name;
        break;
      }
    }
    if (currentGroup) break;
  }

  const renderNavItem = (item: NavItem, groupName: string) => {
    const subKey = `${groupName}::${item.name}`;
    const isSubExpanded = !collapsedSubGroups[subKey];
    const itemActive = isItemActive(item, location.pathname, allHrefs);

    if (item.children && item.children.length > 0) {
      return (
        <div key={item.name} className="mt-0.5">
          <button
            onClick={() => toggleSubGroup(subKey)}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              itemActive
                ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <item.icon className="w-4 h-4 shrink-0 text-gray-400 dark:text-gray-500 group-hover:text-gray-600" />
              <span className="truncate text-xs">{item.name}</span>
            </div>
            <ChevronRight
              className={`w-3.5 h-3.5 shrink-0 text-gray-400 transition-transform duration-150 ${
                isSubExpanded ? 'rotate-90' : ''
              }`}
            />
          </button>

          {isSubExpanded && (
            <div className="mt-0.5 ml-3 pl-2 border-l border-gray-200 dark:border-gray-800 space-y-0.5">
              {item.children.map((child) => (
                <NavLink
                  key={child.href}
                  to={child.href!}
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center gap-2 px-2 py-1.5 text-xs rounded-lg transition-colors ${
                    isHrefActive(child.href!, location.pathname, allHrefs)
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-semibold'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <child.icon className="w-3.5 h-3.5 shrink-0 opacity-70 group-hover:opacity-100" />
                  <span className="truncate text-xs">{child.name}</span>
                  {child.badge && (
                    <span className="ml-auto text-[9px] bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-full px-1.5 py-0.2 font-semibold">
                      {child.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <NavLink
        key={item.href}
        to={item.href!}
        onClick={() => setSidebarOpen(false)}
        className={`group flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
          isHrefActive(item.href!, location.pathname, allHrefs)
            ? 'bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-400 font-semibold'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
        }`}
      >
        <item.icon className="w-4 h-4 shrink-0" />
        <span className="truncate text-xs">{item.name}</span>
        {item.badge && (
          <span className="ml-auto text-[10px] bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-full px-1.5 py-0.5 font-semibold">
            {item.badge}
          </span>
        )}
      </NavLink>
    );
  };

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
          className={`fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
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
          <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1.5 scrollbar-thin">
            {filteredGroups.map((group) => (
              <div key={group.group} className="mb-1">
                <button
                  onClick={() => toggleGroup(group.group)}
                  className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest hover:text-gray-600 dark:hover:text-gray-400 transition-colors cursor-pointer"
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
                    {group.items.map((item) => renderNavItem(item, group.group))}
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
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-6 font-medium flex-wrap">
                  <Link to="/" className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
                    Home
                  </Link>
                  <ChevronRight className="w-3 h-3 text-gray-400" />
                  <span>{currentGroup}</span>
                  {currentSubGroup && (
                    <>
                      <ChevronRight className="w-3 h-3 text-gray-400" />
                      <span>{currentSubGroup}</span>
                    </>
                  )}
                  <ChevronRight className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-900 dark:text-gray-200 font-semibold">{currentItem}</span>
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
