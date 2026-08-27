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

function AuthEventListener() {
  const logout = useAuthStore((s) => s.logout);
  useEffect(() => {
    const handleLogoutEvent = () => {
      logout();
    };
    window.addEventListener('auth:logout', handleLogoutEvent);
    return () => {
      window.removeEventListener('auth:logout', handleLogoutEvent);
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
