import { useMemo, useState, useEffect, useCallback } from 'react';
import { Search, Send, User, Shield, Clock, PhoneCall, Mail, MessageSquare, AlertCircle } from 'lucide-react';
import { axiosClient } from '@/shared/lib/axiosClient';
import { toast } from 'sonner';

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

const MOCK_TICKETS = [
  { id: '1', ticketNumber: 'TCK-9910', customerName: 'Johnathan Vance', subject: 'Barcode scanner intermittent connection drop' },
  { id: '2', ticketNumber: 'TCK-9912', customerName: 'Alice Smith-Bauer', subject: 'Requesting bulk export of annual VAT tax invoices' },
  { id: '3', ticketNumber: 'TCK-9915', customerName: 'Robert Jenkins Junior', subject: 'Loyalty points did not credit' },
  { id: '4', ticketNumber: 'TCK-9918', customerName: 'Diana Prince', subject: 'Damaged display case glass during transit' }
];

const MOCK_MESSAGES: MessageRecord[] = [
  { id: '101', ticketId: '1', ticketNumber: 'TCK-9910', senderName: 'Johnathan Vance', senderType: 'CUSTOMER', messageText: 'Hi, our barcode scanner keeps dropping connection. We have to unplug and replug the USB to make it work. It happens every 10-15 minutes.', createdAt: '2024-05-17 09:15' },
  { id: '102', ticketId: '1', ticketNumber: 'TCK-9910', senderName: 'SYSTEM', senderType: 'SYSTEM', messageText: 'Ticket created and assigned to Michael Chang.', createdAt: '2024-05-17 09:16' },
  { id: '103', ticketId: '1', ticketNumber: 'TCK-9910', senderName: 'Michael Chang', senderType: 'AGENT', messageText: 'Hello Johnathan, could you please try connecting the scanner to a different USB port, preferably a USB 2.0 port on the back of the POS station?', createdAt: '2024-05-17 11:30' },
  { id: '104', ticketId: '1', ticketNumber: 'TCK-9910', senderName: 'Johnathan Vance', senderType: 'CUSTOMER', messageText: 'We tried that, but the issue persists. We even tried it on another POS station and it still drops.', createdAt: '2024-05-17 13:10' },
  { id: '105', ticketId: '1', ticketNumber: 'TCK-9910', senderName: 'Michael Chang', senderType: 'AGENT', messageText: 'Understood. It seems like a hardware fault with the USB interface or dongle. We have dispatched a replacement USB dongle via courier. Please test upon arrival.', createdAt: '2024-05-17 14:30' },
  { id: '201', ticketId: '2', ticketNumber: 'TCK-9912', senderName: 'Alice Smith-Bauer', senderType: 'CUSTOMER', messageText: 'Can I get a bulk export of all our VAT invoices for last year? We need it for auditing next week.', createdAt: '2024-05-16 11:20' },
  { id: '202', ticketId: '2', ticketNumber: 'TCK-9912', senderName: 'Sarah Jenkins', senderType: 'AGENT', messageText: 'Hello Alice, sure! I am generating the export package now. It will include all monthly VAT statements for FY2023.', createdAt: '2024-05-16 14:00' },
  { id: '203', ticketId: '2', ticketNumber: 'TCK-9912', senderName: 'Sarah Jenkins', senderType: 'AGENT', messageText: 'Attached zip archive containing all monthly statements for FY2023. Ticket resolved.', createdAt: '2024-05-17 10:00', attachments: ['VAT_Invoices_FY2023.zip'] },
  { id: '301', ticketId: '3', ticketNumber: 'TCK-9915', senderName: 'Robert Jenkins Junior', senderType: 'CUSTOMER', messageText: 'I bought a coffee grinder yesterday at branch #2 but my points did not update on my app. Please check.', createdAt: '2024-05-17 15:45' },
  { id: '401', ticketId: '4', ticketNumber: 'TCK-9918', senderName: 'Diana Prince', senderType: 'CUSTOMER', messageText: 'The shipment arrived today but one of the display case glass sheets is completely shattered. This is urgent as we are opening next Monday.', createdAt: '2024-05-15 16:30' },
  { id: '402', ticketId: '4', ticketNumber: 'TCK-9918', senderName: 'David Ross', senderType: 'AGENT', messageText: 'Hello Diana, we are so sorry to hear this. We will send a replacement immediately. Please provide photos of the damaged shipping pallet so we can file an insurance claim with DHL.', createdAt: '2024-05-16 09:00' }
];

export function TicketMessagesPage() {
  const [selectedTicketId, setSelectedTicketId] = useState<string>('1');
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTicketMessages = useCallback(async () => {
    try {
      const res: any = await axiosClient.get('/crm/ticket-messages');
      const list = Array.isArray(res) ? res : res?.content || res?.data || [];
      if (list.length > 0) {
        const mapped: MessageRecord[] = list.map((item: any) => ({
          id: String(item.id),
          ticketId: item.ticket?.id ? String(item.ticket.id) : '1',
          ticketNumber: item.ticket?.ticketNumber || 'TCK-9910',
          senderName: item.senderName || item.sender?.name || 'Hỗ trợ viên',
          senderType: item.isInternalNote ? 'SYSTEM' : item.senderType || 'AGENT',
          messageText: item.message || item.messageText || '',
          createdAt: item.createdDate ? String(item.createdDate).split('T')[0] : '2024-05-17 10:00',
        }));
        setMessages(mapped);
      } else {
        setMessages(MOCK_MESSAGES);
      }
    } catch (err) {
      console.error('Error fetching ticket messages:', err);
      toast.error('Lỗi khi tải tin nhắn hỗ trợ, dùng dữ liệu mẫu');
      setMessages(MOCK_MESSAGES);
    }
  }, []);

  useEffect(() => {
    fetchTicketMessages();
  }, [fetchTicketMessages]);

  const currentTicket = useMemo(() => {
    return MOCK_TICKETS.find(t => t.id === selectedTicketId) || MOCK_TICKETS[0];
  }, [selectedTicketId]);

  const filteredTickets = useMemo(() => {
    if (!searchQuery) return MOCK_TICKETS;
    return MOCK_TICKETS.filter(t => 
      t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const activeMessages = useMemo(() => {
    return messages.filter(m => m.ticketId === selectedTicketId);
  }, [messages, selectedTicketId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const payload = {
      message: inputMessage,
      senderName: 'Nhân viên hỗ trợ',
      senderType: 'AGENT',
    };

    try {
      await axiosClient.post('/crm/ticket-messages', payload);
      toast.success('Đã gửi tin nhắn hỗ trợ!');
      const newMessage: MessageRecord = {
        id: String(Date.now()),
        ticketId: selectedTicketId,
        ticketNumber: currentTicket.ticketNumber,
        senderName: 'Nhân viên hỗ trợ (Bạn)',
        senderType: 'AGENT',
        messageText: inputMessage,
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
      };
      setMessages((prev) => [...prev, newMessage]);
      setInputMessage('');
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
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm mã phiếu hoặc khách hàng..."
                className="w-full pl-8 pr-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-xs bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-150 dark:divide-gray-800">
            {filteredTickets.map(t => {
              const isSelected = t.id === selectedTicketId;
              const lastMsg = messages.filter(m => m.ticketId === t.id).slice(-1)[0];

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
                    {lastMsg && <span className="text-[10px] text-gray-400 font-mono">{lastMsg.createdAt.split(' ')[1]}</span>}
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mt-1 truncate">{t.customerName}</h4>
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
              <div className="p-8 text-center text-gray-400 text-sm">Không tìm thấy kết quả.</div>
            )}
          </div>
        </div>

        {/* Right Side: Chat Box */}
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-950">
          
          {/* Header */}
          <div className="p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-primary">{currentTicket.ticketNumber}</span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{currentTicket.customerName}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">{currentTicket.subject}</p>
            </div>
            <div className="flex items-center gap-2">
              <button title="Gọi điện" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 rounded-lg transition-colors">
                <PhoneCall className="w-4 h-4" />
              </button>
              <button title="Gửi email" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 rounded-lg transition-colors">
                <Mail className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Message Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeMessages.map(msg => {
              const isAgent = msg.senderType === 'AGENT';
              const isSystem = msg.senderType === 'SYSTEM';

              if (isSystem) {
                return (
                  <div key={msg.id} className="flex justify-center">
                    <span className="px-3 py-1 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 text-[11px] font-semibold rounded-full border border-amber-100 dark:border-amber-900/40 flex items-center gap-1 shadow-sm">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {msg.messageText} • {msg.createdAt}
                    </span>
                  </div>
                );
              }

              return (
                <div key={msg.id} className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] flex gap-3 ${isAgent ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm ${
                      isAgent ? 'bg-emerald-600' : 'bg-gray-400'
                    }`}>
                      {isAgent ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>

                    <div>
                      <div className={`flex items-center gap-2 mb-1 ${isAgent ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{msg.senderName}</span>
                        <span className="text-[10px] text-gray-400 font-mono flex items-center gap-0.5"><Clock className="w-3 h-3" />{msg.createdAt.split(' ')[1]}</span>
                      </div>

                      <div className={`p-3 rounded-2xl text-sm shadow-sm ${
                        isAgent
                          ? 'bg-primary text-white rounded-tr-none'
                          : 'bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-800 rounded-tl-none'
                      }`}>
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.messageText}</p>
                        
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-white/20 dark:border-gray-800 space-y-1">
                            {msg.attachments.map(att => (
                              <div key={att} className="flex items-center gap-2 text-xs bg-black/10 dark:bg-black/35 px-2.5 py-1.5 rounded-lg font-mono">
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
          </div>

          {/* Input Box */}
          <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
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

        </div>

      </div>
    </div>
  );
}

export default TicketMessagesPage;

