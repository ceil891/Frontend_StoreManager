/**
 * Performance Monitoring: Core Web Vitals (LCP, FID/INP, CLS, FCP, TTFB)
 * Tự động đo lường và gửi metrics về analytics endpoint hoặc console.
 */
export interface Metric {
  name: 'CLS' | 'FCP' | 'FID' | 'INP' | 'LCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

export function reportWebVitals(onPerfEntry?: (metric: Metric) => void) {
  if (onPerfEntry && typeof onPerfEntry === 'function') {
    // @ts-ignore
    import('web-vitals')
      .then(({ onCLS, onINP, onLCP, onFCP, onTTFB }) => {
        onCLS(onPerfEntry);
        onINP(onPerfEntry);
        onLCP(onPerfEntry);
        onFCP(onPerfEntry);
        onTTFB(onPerfEntry);
      })
      .catch(() => {
        // Fallback: nếu package web-vitals chưa được install thì dùng PerformanceObserver
        if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
          try {
            const observer = new PerformanceObserver((list) => {
              for (const entry of list.getEntries()) {
                if (entry.entryType === 'largest-contentful-paint') {
                  onPerfEntry({
                    name: 'LCP',
                    value: entry.startTime,
                    rating: entry.startTime < 2500 ? 'good' : 'poor',
                    delta: entry.startTime,
                    id: 'perf-lcp',
                  });
                }
              }
            });
            observer.observe({ type: 'largest-contentful-paint', buffered: true });
          } catch {
            // Ignore if not supported
          }
        }
      });
  }
}
