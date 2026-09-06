import { useEffect, useRef, useState, useCallback } from 'react';

const STORAGE_KEY = 'retailhub_last_activity';
const THROTTLE_MS = 1000; // Chỉ ghi nhận hoạt động tối đa 1 lần/giây để tối ưu hiệu năng

interface UseIdleTimerOptions {
  /** Thời gian không hoạt động tối đa trước khi hết hạn (mili-giây). Mặc định 15 phút. */
  timeoutMs?: number;
  /** Thời gian hiển thị cảnh báo trước khi hết hạn (mili-giây). Mặc định 60 giây. */
  warningTimeMs?: number;
  /** Callback được gọi khi hết thời gian chờ */
  onTimeout: () => void | Promise<void>;
  /** Bật/tắt theo dõi (ví dụ chỉ bật khi đã đăng nhập và không ở trang /login) */
  enabled?: boolean;
}

export function useIdleTimer({
  timeoutMs = 15 * 60 * 1000, // 15 phút
  warningTimeMs = 60 * 1000,  // 60 giây
  onTimeout,
  enabled = true,
}: UseIdleTimerOptions) {
  const [isWarning, setIsWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(Math.ceil(warningTimeMs / 1000));

  const lastActivityRef = useRef<number>(Date.now());
  const lastRecordedRef = useRef<number>(0);
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  // Cập nhật mốc thời gian hoạt động gần nhất
  const recordActivity = useCallback(() => {
    const now = Date.now();
    // Throttle để tránh ghi liên tục vào localStorage khi rê chuột
    if (now - lastRecordedRef.current < THROTTLE_MS) {
      return;
    }
    lastRecordedRef.current = now;
    lastActivityRef.current = now;
    try {
      localStorage.setItem(STORAGE_KEY, String(now));
    } catch {
      // Bỏ qua nếu localStorage bị vô hiệu hóa
    }

    // Nếu đang cảnh báo mà người dùng có hành động rõ ràng, tự tắt cảnh báo
    setIsWarning(false);
  }, []);

  // Hàm thủ công để người dùng bấm "Tiếp tục làm việc"
  const resetTimer = useCallback(() => {
    const now = Date.now();
    lastRecordedRef.current = now;
    lastActivityRef.current = now;
    try {
      localStorage.setItem(STORAGE_KEY, String(now));
    } catch {
      // ignore
    }
    setIsWarning(false);
    setRemainingSeconds(Math.ceil(warningTimeMs / 1000));
  }, [warningTimeMs]);

  useEffect(() => {
    if (!enabled) {
      setIsWarning(false);
      return;
    }

    // Khởi tạo mốc thời gian ban đầu từ localStorage nếu có
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? parseInt(stored, 10) : 0;
      if (parsed && !isNaN(parsed)) {
        lastActivityRef.current = Math.max(parsed, Date.now() - (timeoutMs - warningTimeMs - 5000));
      } else {
        lastActivityRef.current = Date.now();
        localStorage.setItem(STORAGE_KEY, String(Date.now()));
      }
    } catch {
      lastActivityRef.current = Date.now();
    }

    // 1. Lắng nghe các sự kiện thao tác của người dùng
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'wheel'];
    const handleUserActivity = () => {
      // Nếu đang trong trạng thái cảnh báo, không tự động tắt chỉ bằng cử động chuột nhỏ
      // mà yêu cầu nhấn phím hoặc chạm để tránh va quẹt chuột vô ý khi rời máy
      if (isWarning) {
        return;
      }
      recordActivity();
    };

    events.forEach((eventName) => {
      window.addEventListener(eventName, handleUserActivity, { passive: true });
    });

    // 2. Đồng bộ thao tác giữa các tab (Multi-tab Sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const remoteTime = parseInt(e.newValue, 10);
        if (!isNaN(remoteTime) && remoteTime > lastActivityRef.current) {
          lastActivityRef.current = remoteTime;
          setIsWarning(false);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // 3. Vòng lặp kiểm tra định kỳ mỗi 1 giây
    const interval = setInterval(() => {
      // Đọc lại từ localStorage để đảm bảo đồng bộ mới nhất từ các tab khác
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const parsed = stored ? parseInt(stored, 10) : 0;
        if (parsed && !isNaN(parsed) && parsed > lastActivityRef.current) {
          lastActivityRef.current = parsed;
        }
      } catch {
        // ignore
      }

      const elapsed = Date.now() - lastActivityRef.current;

      if (elapsed >= timeoutMs) {
        // Đã hết thời gian chờ -> Kích hoạt đăng xuất
        setIsWarning(false);
        clearInterval(interval);
        onTimeoutRef.current();
      } else if (elapsed >= timeoutMs - warningTimeMs) {
        // Đã bước vào khoảng thời gian cảnh báo
        const remainingMs = timeoutMs - elapsed;
        setRemainingSeconds(Math.max(0, Math.ceil(remainingMs / 1000)));
        setIsWarning(true);
      } else {
        setIsWarning(false);
      }
    }, 1000);

    return () => {
      events.forEach((eventName) => {
        window.removeEventListener(eventName, handleUserActivity);
      });
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [enabled, timeoutMs, warningTimeMs, recordActivity, isWarning]);

  return {
    isWarning,
    remainingSeconds,
    resetTimer,
  };
}
