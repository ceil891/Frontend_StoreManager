import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Sparkles } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState([
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

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Mock AI response
    setTimeout(() => {
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateMockResponse(userMsg.content),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const generateMockResponse = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes('tồn kho')) {
      return 'Hiện tại có 5 sản phẩm sắp hết hàng (dự kiến hết trong 3 ngày tới). Đặc biệt là "Nước giải khát Coca-Cola 1.5L" chỉ còn 20 chai ở kho Quận 1. Sếp có muốn tôi tự động tạo đơn đặt hàng (Purchase Order) không?';
    }
    if (lower.includes('doanh thu') || lower.includes('bán chạy')) {
      return 'Doanh thu hôm nay đạt 125.000.000 VNĐ, tăng 15% so với hôm qua. Sản phẩm bán chạy nhất là "Sữa tươi Vinamilk" (bán được 300 lốc).';
    }
    return 'Tôi đã ghi nhận yêu cầu của sếp. Hệ thống đang phân tích dữ liệu từ Google Sheets để đưa ra câu trả lời chính xác nhất...';
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
            className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 transition-transform hover:scale-110 active:scale-95"
          >
            <Sparkles className="h-6 w-6 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex h-4 w-4 rounded-full bg-red-500"></span>
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
            className="fixed bottom-6 right-6 z-50 flex h-[600px] w-[400px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900"
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
                      {msg.content}
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
