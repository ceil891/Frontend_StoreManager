import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Sparkles, BarChart2, TrendingUp } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { useNavigate, useLocation } from 'react-router';
import { useAuthUser } from '@/features/auth/store/authStore';

interface ChatMessageItem {
  id: string;
  role: string;
  content: string;
  time: string;
  parsed?: any;
}

/** Render msg string with **bold** and newline support */
function renderMsg(text: string) {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <>
      {lines.map((line, i) => {
        // Parse **bold** patterns
        const parts = line.split(/\*\*(.+?)\*\*/);
        return (
          <span key={i}>
            {parts.map((part, j) =>
              j % 2 === 1
                ? <strong key={j} className="font-bold text-gray-900 dark:text-white">{part}</strong>
                : <span key={j}>{part}</span>
            )}
            {i < lines.length - 1 && <br />}
          </span>
        );
      })}
    </>
  );
}

/** Detect if a msg contains a data result (number + đ or count) */
function parseDataResult(msg: string): { label: string; value: string; unit: string } | null {
  const match = msg.match(/^(.+?):\s*\*\*([\d.,]+)\s*(đ|)\*\*$/);
  if (!match) return null;
  return { label: match[1].trim(), value: match[2].trim(), unit: match[3] || '' };
}

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthUser();
  const isPosPage = location.pathname === '/pos';

  const [messages, setMessages] = useState<ChatMessageItem[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Chào sếp! Hôm nay tôi đã phân tích dữ liệu bán hàng mới nhất. Sếp có muốn xem báo cáo tồn kho hay sản phẩm bán chạy không?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessageItem = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsTyping(true);

    try {
      // Production webhook n8n hoặc từ file .env
      const aiApiUrl = import.meta.env.VITE_AI_API_URL || 'https://mucvan891.app.n8n.cloud/webhook/ric-qlbh-webhook';
      const senderId = user?.id ? String(user.id) : (user?.name || user?.email || 'user_001');

      // Gửi POST tới n8n webhook theo format quy định
      const response = await fetch(aiApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMsg.content,
          senderId: senderId,
          platform: 'web',
        }),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        let errJson: any = null;
        try {
          errJson = errText ? JSON.parse(errText) : null;
        } catch {
          // ignore
        }
        if (errJson?.hint) {
          throw new Error(errJson.hint);
        }
        if (errJson?.message) {
          throw new Error(errJson.message);
        }
        throw new Error(`API request failed with status ${response.status}`);
      }

      const rawText = await response.text().catch(() => '');
      if (!rawText || !rawText.trim()) {
        throw new Error('Workflow n8n trả về kết quả rỗng (Empty body). Hãy kiểm tra node Webhook trong n8n đã đổi Respond thành "When Last Node Finishes" hoặc thêm node "Respond to Webhook".');
      }

      let data: any = null;
      try {
        data = JSON.parse(rawText);
      } catch {
        data = rawText;
      }

      // n8n có thể trả về array [ { loai: 1, ... } ] hoặc object { loai: 1, ... }
      if (Array.isArray(data) && data.length > 0) {
        data = data[0];
      }

      let parsed: any = null;
      let displayContent = '';

      if (typeof data === 'string') {
        try {
          parsed = JSON.parse(data);
          displayContent = parsed.loai === 0 ? (parsed.msg || '') : (parsed.msg || `Yêu cầu báo cáo: ${parsed.name || 'Báo cáo số liệu'}`);
        } catch {
          displayContent = data;
        }
      } else if (typeof data === 'object' && data !== null) {
        if (typeof data.response === 'string') {
          try {
            parsed = JSON.parse(data.response);
            displayContent = parsed.loai === 0 ? (parsed.msg || '') : (parsed.msg || `Yêu cầu báo cáo: ${parsed.name || 'Báo cáo số liệu'}`);
          } catch {
            displayContent = data.response;
          }
        } else if (typeof data.response === 'object' && data.response !== null) {
          parsed = data.response;
          displayContent = parsed.loai === 0 ? (parsed.msg || '') : (parsed.msg || `Yêu cầu báo cáo: ${parsed.name || 'Báo cáo số liệu'}`);
        } else {
          parsed = data;
          if (parsed.loai === 0) {
            displayContent = parsed.msg || 'Không có phản hồi từ trợ lý.';
          } else if (parsed.loai === 1) {
            displayContent = parsed.msg || `Yêu cầu báo cáo: ${parsed.name || 'Báo cáo số liệu'}`;
          } else {
            displayContent = parsed.msg || parsed.message || (typeof parsed === 'string' ? parsed : JSON.stringify(parsed));
          }
        }
      }
      
      const aiResponse: ChatMessageItem = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: displayContent,
        parsed: parsed,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiResponse]);
    } catch (error: any) {
      console.error('Error calling AI Agent:', error);
      const detail = error?.message ? ` (${error.message})` : '';
      const errorMsg: ChatMessageItem = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Không thể kết nối tới trợ lý AI (n8n Webhook). Vui lòng đảm bảo workflow trên n8n đang ở trạng thái **Active** (bật toggle ở góc trên bên phải n8n).${detail}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className={twMerge(
              "fixed z-50 flex items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 transition-all hover:scale-110 active:scale-95",
              isPosPage ? "bottom-6 left-6 h-12 w-12" : "bottom-6 right-6 h-14 w-14"
            )}
            title="CEO Assistant AI (Hỗ trợ bán hàng)"
          >
            <Sparkles className={twMerge("animate-pulse", isPosPage ? "h-5 w-5" : "h-6 w-6")} />
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-red-500"></span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={twMerge(
              "fixed bottom-6 z-50 flex h-[600px] w-[400px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900",
              isPosPage ? "left-6" : "right-6"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-4 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                  <Bot className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold leading-tight">CEO Assistant AI</h3>
                  <p className="text-xs text-indigo-100 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-400"></span> Trực tuyến
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 text-indigo-100 transition-colors hover:bg-white/20 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 dark:bg-gray-900/50">
              <div className="flex flex-col gap-4">
                {messages.map((msg) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={msg.id}
                    className={twMerge(
                      "flex max-w-[85%] flex-col gap-1",
                      msg.role === 'user' ? "self-end" : "self-start"
                    )}
                  >
                    <div
                      className={twMerge(
                        "rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                        msg.role === 'user'
                          ? "rounded-tr-sm bg-indigo-600 text-white"
                          : "rounded-tl-sm bg-white border border-gray-100 text-gray-800 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-100"
                      )}
                    >
                      {/* TYPE 1 — Report request card */}
                      {msg.parsed && msg.parsed.loai === 1 ? (
                        <div className="flex flex-col gap-2 min-w-[240px] py-1">
                          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                            <BarChart2 className="w-4 h-4" />
                            <span className="font-semibold text-[11px] uppercase tracking-wider">Yêu cầu báo cáo</span>
                          </div>
                          <div className="text-gray-800 dark:text-gray-200 text-sm font-semibold leading-snug">
                            {msg.parsed.name || 'Báo cáo dữ liệu'}
                          </div>
                          <div className="flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {(msg.parsed.fromdate || msg.parsed.todate) && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-gray-400">📅</span>
                                <span className="text-gray-600 dark:text-gray-300">
                                  {msg.parsed.fromdate?.split('/').reverse().join('/')} – {msg.parsed.todate?.split('/').reverse().join('/')}
                                </span>
                              </div>
                            )}
                            {msg.parsed.draw === 1 && (
                              <div className="flex items-center gap-1.5">
                                <TrendingUp className="w-3 h-3 text-indigo-400" />
                                <span>Có biểu đồ</span>
                              </div>
                            )}
                            {msg.parsed.tel && msg.parsed.tel !== 'SĐT|null' && !msg.parsed.tel.includes('null') && (
                              <div className="flex items-center gap-1.5">
                                <span>📞</span>
                                <span className="font-semibold text-indigo-600">{msg.parsed.tel}</span>
                              </div>
                            )}
                          </div>
                          {msg.parsed.msg && (
                            <div className="mt-1.5 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700/50 text-xs text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-line">
                              {renderMsg(msg.parsed.msg)}
                            </div>
                          )}
                          <div className="mt-1.5 pt-2 border-t border-gray-100 dark:border-gray-700/50 flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                const val = msg.parsed.val;
                                if (val === 103 || val === 300 || val === 60 || val === 110) {
                                  navigate('/reports/sales');
                                } else if (val === 102) {
                                  navigate('/reports/inventory');
                                } else if (val === 200 || val === 70) {
                                  navigate('/inventory/products');
                                } else if (val === 100 || val === 101 || val === 104 || val === 105 || val === 106 || val === 107) {
                                  navigate('/reports/finance');
                                } else if (val === 61 || val === 120 || val === 121) {
                                  navigate('/reports/crm');
                                } else if (val === 400) {
                                  navigate('/crm/campaigns');
                                } else if (val === 62) {
                                  navigate('/hr/employees');
                                } else {
                                  navigate('/reports/sales');
                                }
                                setIsOpen(false); // Close AI panel so the user sees the page transition
                              }}
                              className="px-3 py-1.5 text-[11px] font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 active:scale-95 transition-all shadow-sm cursor-pointer"
                            >
                              Xem báo cáo →
                            </button>
                          </div>
                        </div>

                      ) : msg.parsed && msg.parsed.loai === 0 ? (() => {
                        // TYPE 0 — Direct answer
                        const msgText: string = msg.parsed.msg || msg.content;
                        const dataResult = parseDataResult(msgText);

                        if (dataResult) {
                          // Highlighted data card for numeric results
                          return (
                            <div className="flex flex-col gap-1 min-w-[200px]">
                              <div className="text-xs text-gray-500 dark:text-gray-400">{dataResult.label}</div>
                              <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 tabular-nums tracking-tight">
                                  {dataResult.value}
                                </span>
                                {dataResult.unit && (
                                  <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">{dataResult.unit}</span>
                                )}
                              </div>
                            </div>
                          );
                        }

                        // Regular text answer (multiline / list)
                        return <div className="leading-relaxed whitespace-pre-line">{renderMsg(msgText)}</div>;
                      })() : (
                        // Plain message (no parsed, greeting etc.)
                        <div className="leading-relaxed whitespace-pre-line">{renderMsg(msg.content)}</div>
                      )}
                    </div>
                    <span className={twMerge(
                      "text-[10px] text-gray-400",
                      msg.role === 'user' ? "text-right" : "text-left"
                    )}>
                      {msg.time}
                    </span>
                  </motion.div>
                ))}

                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex max-w-[85%] self-start flex-col gap-1"
                  >
                    <div className="rounded-2xl rounded-tl-sm bg-white border border-gray-100 px-4 py-3 shadow-sm dark:border-gray-800 dark:bg-gray-800">
                      <div className="flex gap-1.5">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]"></span>
                        <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]"></span>
                        <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></span>
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Quick Actions */}
            {!isTyping && messages.length < 3 && (
              <div className="px-4 pb-2 pt-2 flex gap-2 overflow-x-auto no-scrollbar bg-gray-50/50 dark:bg-gray-900/50">
                <button onClick={() => setInput('xem công nợ khách hàng tháng trước')} className="whitespace-nowrap rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-900/30 dark:text-indigo-400">
                  📊 Công nợ tháng trước
                </button>
                <button onClick={() => setInput('Báo cáo doanh thu hôm nay')} className="whitespace-nowrap rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-900/30 dark:text-indigo-400">
                  📈 Báo cáo doanh thu
                </button>
                <button onClick={() => setInput('Sản phẩm nào sắp hết hàng?')} className="whitespace-nowrap rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-600 transition-colors hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-900/30 dark:text-amber-400">
                  ⚠️ Cảnh báo tồn kho
                </button>
              </div>
            )}

            {/* Input Area */}
            <div className="border-t border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Nhập câu hỏi cho AI..."
                  className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-indigo-400"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
