import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppRouter } from './routes';
import { useThemeStore } from './shared/store/themeStore';
import { Toaster } from 'sonner';
import { GlobalErrorBoundary } from './shared/components/ui/GlobalErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

import { useAuthStore } from './features/auth/store/authStore';

// Apply persisted theme on mount before any paint
function ThemeInitializer() {
  const theme = useThemeStore((s) => s.theme);
  useEffect(() => {
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);
  }, [theme]);
  return null;
}

import { toast } from 'sonner';

function AuthEventListener() {
  const logout = useAuthStore((s) => s.logout);
  useEffect(() => {
    // 1. Lắng nghe sự kiện auth:logout nội bộ từ axiosClient
    const handleLogoutEvent = async (event: Event) => {
      const customEvent = event as CustomEvent<{ message?: string }>;
      if (customEvent.detail?.message) {
        toast.error(customEvent.detail.message);
      }
      await logout();
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    };

    // 2. Đồng bộ đăng xuất giữa các Tab trình duyệt (Multi-Tab Sync)
    const handleStorageChange = async (e: StorageEvent) => {
      if (e.key === 'access_token' && !e.newValue) {
        toast.info('Phiên đăng nhập đã kết thúc từ một tab khác.');
        await logout();
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.replace('/login');
        }
      }
    };

    window.addEventListener('auth:logout', handleLogoutEvent);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('auth:logout', handleLogoutEvent);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [logout]);
  return null;
}

function App() {
  return (
    <GlobalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeInitializer />
        <AuthEventListener />
        <Toaster position="top-right" richColors />
        <AppRouter />
      </QueryClientProvider>
    </GlobalErrorBoundary>
  );
}

export default App;
