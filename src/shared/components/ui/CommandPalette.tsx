// ────────────────────────────────────────────────────────────
// Command Palette — Ctrl+K global search
// Features:
// - Open via Ctrl+K or Cmd+K
// - Close via Escape or backdrop click
// - Fuzzy search across all navigation items
// - Keyboard navigation (↑↓ arrows, Enter to go)
// - Framer Motion animations
// ────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowRight, Keyboard } from 'lucide-react';
import { NAV_GROUPS } from '@/shared/config/navigation';
import { usePermission, checkPermission } from '@/shared/hooks/usePermission';

interface CommandItem {
  id: string;
  name: string;
  href: string;
  group: string;
  icon: React.ElementType;
}

function collectNavItems(itemList: any[], groupName: string, permissions: string[], result: CommandItem[]) {
  for (const item of itemList) {
    if (item.children && item.children.length > 0) {
      collectNavItems(item.children, `${groupName} › ${item.name}`, permissions, result);
    } else if (item.href) {
      if (!item.permission || checkPermission(permissions, item.permission)) {
        result.push({
          id: item.href,
          name: item.name,
          href: item.href,
          group: groupName,
          icon: item.icon,
        });
      }
    }
  }
}

function useCommandItems(permissions: string[]): CommandItem[] {
  return useMemo(() => {
    const items: CommandItem[] = [];
    for (const group of NAV_GROUPS) {
      collectNavItems(group.items, group.group, permissions, items);
    }
    return items;
  }, [permissions]);
}

function fuzzyMatch(text: string, query: string): boolean {
  const t = text.toLowerCase();
  const q = query.toLowerCase();
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { permissions } = usePermission();
  const allItems = useCommandItems(permissions);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return allItems.slice(0, 12);
    return allItems.filter((item) => fuzzyMatch(item.name, query));
  }, [query, allItems]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Clamp activeIdx
  useEffect(() => {
    setActiveIdx((i) => Math.min(i, Math.max(filtered.length - 1, 0)));
  }, [filtered]);

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-active="true"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  const handleSelect = useCallback(
    (href: string) => {
      onClose();
      navigate(href);
    },
    [navigate, onClose]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIdx((i) => (i + 1) % filtered.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIdx((i) => (i - 1 + filtered.length) % filtered.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (filtered[activeIdx]) handleSelect(filtered[activeIdx].href);
        break;
      case 'Escape':
        onClose();
        break;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed left-1/2 top-[15%] -translate-x-1/2 z-50 w-full max-w-2xl"
          >
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 dark:border-gray-800">
                <Search className="w-5 h-5 text-gray-400 shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setActiveIdx(0); }}
                  onKeyDown={handleKeyDown}
                  placeholder="Tìm kiếm trang, chức năng..."
                  className="flex-1 bg-transparent text-base text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                />
                <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div ref={listRef} className="max-h-[380px] overflow-y-auto py-2">
                {filtered.length === 0 ? (
                  <div className="px-4 py-10 text-center text-gray-400">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Không tìm thấy kết quả cho "{query}"</p>
                  </div>
                ) : (
                  (() => {
                    const groups: Record<string, CommandItem[]> = {};
                    filtered.forEach((item) => {
                      (groups[item.group] ??= []).push(item);
                    });
                    let globalIdx = 0;
                    return Object.entries(groups).map(([group, items]) => (
                      <div key={group}>
                        <div className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          {group}
                        </div>
                        {items.map((item) => {
                          const idx = globalIdx++;
                          const isActive = idx === activeIdx;
                          return (
                            <button
                              key={item.id}
                              data-active={isActive}
                              onClick={() => handleSelect(item.href)}
                              onMouseEnter={() => setActiveIdx(idx)}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                                isActive
                                  ? 'bg-emerald-50 dark:bg-emerald-900/20'
                                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                isActive
                                  ? 'bg-emerald-100 dark:bg-emerald-900/40'
                                  : 'bg-gray-100 dark:bg-gray-800'
                              }`}>
                                <item.icon className={`w-4 h-4 ${
                                  isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500'
                                }`} />
                              </div>
                              <span className={`flex-1 text-sm font-medium ${
                                isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'
                              }`}>
                                {item.name}
                              </span>
                              {isActive && (
                                <ArrowRight className="w-4 h-4 text-emerald-500 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ));
                  })()
                )}
              </div>

              {/* Footer hint */}
              <div className="flex items-center gap-4 px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Keyboard className="w-3 h-3" /> Điều hướng
                </span>
                <span>↑↓ di chuyển</span>
                <span>↵ mở trang</span>
                <span>esc đóng</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Hook to open/close palette from anywhere ─────────────────
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return { isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) };
}
