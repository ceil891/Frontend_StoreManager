import { useMemo, useState, useEffect } from 'react';
import { Search, Send, User, Shield, Clock, PhoneCall, Mail, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { useCrmStore } from '../store/crmStore';

interface MessageRecord {
  id: string;
  ticketId: string;
  ticketNumber: string;
  senderName: string;
  senderType: 'CUSTOMER' | 'AGENT' | 'SYSTEM';
  messageText: string;
  createdAt: string;
  attachments?: string[];
}

export function TicketMessagesPage() {
  const {
    supportTickets,
    fetchSupportTickets,
    ticketMessages,
    fetchTicketMessages,
    addTicketMessage,
  } = useCrmStore();

  useEffect(() => {
    fetchSupportTickets();
    fetchTicketMessages();
  }, [fetchSupportTickets, fetchTicketMessages]);

  const [selectedTicketId, setSelectedTicketId] = useState<string>('');
  const [inputMessage, setInputMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Automatically select first ticket when supportTickets load
  useEffect(() => {
    if (supportTickets.length > 0 && !selectedTicketId) {
      setSelectedTicketId(supportTickets[0].id);
    }
  }, [supportTickets, selectedTicketId]);

  const tickets = useMemo(() => {
    return supportTickets.map((t) => ({
      id: t.id,
      ticketNumber: t.ticketCode || `TCK-${t.id}`,
      customerName: t.customerName,
      subject: t.subject,
    }));
  }, [supportTickets]);

  const messages: MessageRecord[] = useMemo(() => {
    return ticketMessages.map((m) => {
      const ticket = supportTickets.find((t) => t.id === m.ticketId);
      return {
        id: m.id,
        ticketId: m.ticketId,
        ticketNumber: ticket?.ticketCode || `TCK-${m.ticketId}`,
        senderName: m.senderName,
        senderType: m.isStaff ? 'AGENT' : 'CUSTOMER',
        messageText: m.message,
        createdAt: m.createdAt,
      };
    });
  }, [ticketMessages, supportTickets]);

  const currentTicket = useMemo(() => {
    return tickets.find((t) => t.id === selectedTicketId) || tickets[0] || null;
  }, [tickets, selectedTicketId]);

  const filteredTickets = useMemo(() => {
    if (!searchQuery) return tickets;
    const q = searchQuery.toLowerCase();
    return tickets.filter(
      (t) =>
        t.ticketNumber.toLowerCase().includes(q) ||
        t.customerName.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q)
    );
  }, [tickets, searchQuery]);

  const activeMessages = useMemo(() => {
    if (!selectedTicketId) return [];
    return messages.filter((m) => m.ticketId === selectedTicketId);
  }, [messages, selectedTicketId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !selectedTicketId) return;

    try {
      await addTicketMessage({
        ticketId: selectedTicketId,
        senderName: 'Nhân viên hỗ trợ',
        isStaff: true,
        message: inputMessage.trim(),
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      });
      setInputMessage('');
      toast.success('Đã gửi phản hồi ticket');
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Không thể gửi tin nhắn');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] bg-gray-50 dark:bg-gray-950 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="flex h-full divide-x divide-gray-200 dark:divide-gray-800">
        {/* Left Side: Ticket List */}
        <div className="w-1/3 flex flex-col bg-white dark:bg-gray-900">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Hội thoại hỗ trợ</h1>
            <p className="text-xs text-gray-500 mt-0.5">Danh sách các yêu cầu chat / liên hệ</p>
            <div className="mt-3 relative">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                <Search className="h-3.5 w-3.5 text-gray-400" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm mã phiếu hoặc khách hàng..."
                className="w-full pl-8 pr-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-xs bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-150 dark:divide-gray-800">
            {filteredTickets.map((t) => {
              const isSelected = t.id === selectedTicketId;
              const lastMsg = messages.filter((m) => m.ticketId === t.id).slice(-1)[0];

              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicketId(t.id)}
                  className={`p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-l-4 border-primary'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-xs font-bold text-primary">{t.ticketNumber}</span>
                    {lastMsg && (
                      <span className="text-[10px] text-gray-400 font-mono">
                        {lastMsg.createdAt.includes(' ') ? lastMsg.createdAt.split(' ')[1] : lastMsg.createdAt}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mt-1 truncate">
                    {t.customerName}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{t.subject}</p>
                  {lastMsg && (
                    <p className="text-xs text-gray-400 italic truncate mt-1.5 bg-gray-50 dark:bg-gray-950/50 p-1.5 rounded border border-gray-100 dark:border-gray-800">
                      {lastMsg.senderType === 'CUSTOMER' ? 'Khách: ' : lastMsg.senderType === 'AGENT' ? 'Hỗ trợ: ' : ''}
                      {lastMsg.messageText}
                    </p>
                  )}
                </div>
              );
            })}
            {filteredTickets.length === 0 && (
              <div className="p-8 text-center text-gray-400 text-sm">Chưa có ticket hỗ trợ nào.</div>
            )}
          </div>
        </div>

        {/* Right Side: Chat Box */}
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-950">
          {currentTicket ? (
            <>
              {/* Header */}
              <div className="p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between shadow-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-primary">{currentTicket.ticketNumber}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      {currentTicket.customerName}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">{currentTicket.subject}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    title="Gọi điện"
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 rounded-lg transition-colors"
                  >
                    <PhoneCall className="w-4 h-4" />
                  </button>
                  <button
                    title="Gửi email"
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 rounded-lg transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Message Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {activeMessages.map((msg) => {
                  const isAgent = msg.senderType === 'AGENT';

                  return (
                    <div key={msg.id} className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] flex gap-3 ${isAgent ? 'flex-row-reverse' : ''}`}>
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm ${
                            isAgent ? 'bg-emerald-600' : 'bg-gray-400'
                          }`}
                        >
                          {isAgent ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        </div>

                        <div>
                          <div
                            className={`flex items-center gap-2 mb-1 ${isAgent ? 'justify-end' : 'justify-start'}`}
                          >
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                              {msg.senderName}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono flex items-center gap-0.5">
                              <Clock className="w-3 h-3" />
                              {msg.createdAt.includes(' ') ? msg.createdAt.split(' ')[1] : msg.createdAt}
                            </span>
                          </div>

                          <div
                            className={`p-3 rounded-2xl text-sm shadow-sm ${
                              isAgent
                                ? 'bg-primary text-white rounded-tr-none'
                                : 'bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-800 rounded-tl-none'
                            }`}
                          >
                            <p className="leading-relaxed whitespace-pre-wrap">{msg.messageText}</p>

                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-white/20 dark:border-gray-800 space-y-1">
                                {msg.attachments.map((att) => (
                                  <div
                                    key={att}
                                    className="flex items-center gap-2 text-xs bg-black/10 dark:bg-black/35 px-2.5 py-1.5 rounded-lg font-mono"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    <span className="underline cursor-pointer">{att}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {activeMessages.length === 0 && (
                  <div className="p-8 text-center text-gray-400 text-sm">Chưa có tin nhắn trong hội thoại này.</div>
                )}
              </div>

              {/* Input Box */}
              <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Nhập nội dung câu trả lời hỗ trợ..."
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                  <button
                    type="submit"
                    className="p-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl shadow transition-colors flex items-center justify-center"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              Vui lòng chọn một phiếu hỗ trợ để bắt đầu trò chuyện.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TicketMessagesPage;
