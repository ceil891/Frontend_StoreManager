import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.tsx'

window.addEventListener('error', (event) => {
  console.error('[Global Window Error]', event.error || event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Unhandled Promise Rejection]', event.reason);
});

try {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
} catch (err) {
  console.error('[Mount Error]', err);
  const rootEl = document.getElementById('root');
  if (rootEl) {
    rootEl.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background-color:#090d16;color:#ffffff;font-family:sans-serif;padding:24px;">
        <div style="max-width:500px;background-color:#111827;border:1px solid #374151;border-radius:16px;padding:32px;text-align:center;">
          <h2 style="font-size:20px;font-weight:bold;margin-bottom:12px;color:#f87171;">Đã xảy ra lỗi khởi tạo ứng dụng</h2>
          <p style="font-size:14px;color:#9ca3af;margin-bottom:24px;">Không thể tải giao diện ứng dụng. Vui lòng thử bấm nút bên dưới để tải lại.</p>
          <button onclick="window.location.reload()" style="background-color:#10b981;color:#ffffff;border:none;padding:10px 20px;border-radius:10px;font-weight:600;cursor:pointer;">Tải lại trang</button>
        </div>
      </div>
    `;
  }
}
