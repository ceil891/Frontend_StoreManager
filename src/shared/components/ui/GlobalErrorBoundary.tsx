import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ShieldAlert, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[GlobalErrorBoundary] Caught an uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-8">
          <div className="w-full max-w-lg rounded-2xl border border-red-200 dark:border-red-900/40 bg-white dark:bg-gray-900 p-8 shadow-xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 mb-6">
              <ShieldAlert className="h-8 w-8" />
            </div>

            <h2 className="text-center text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Đã xảy ra sự cố ứng dụng!
            </h2>
            <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
              Hệ thống vừa gặp lỗi không mong muốn trong quá trình vận hành.
            </p>

            <div className="mt-6 rounded-xl bg-gray-100 dark:bg-gray-950 p-4 font-mono text-xs text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 max-h-48 overflow-y-auto">
              <p className="font-semibold text-red-600 dark:text-red-400">
                {this.state.error?.name}: {this.state.error?.message || 'Lỗi không xác định'}
              </p>
              {this.state.error?.stack && (
                <pre className="mt-2 whitespace-pre-wrap text-[10px] leading-relaxed opacity-75">
                  {this.state.error.stack}
                </pre>
              )}
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold rounded-xl transition-all shadow-sm cursor-pointer text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Tải lại trang
              </button>
              <button
                onClick={this.handleGoHome}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold rounded-xl transition-all cursor-pointer text-sm"
              >
                <Home className="w-4 h-4" />
                Về trang chủ
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
