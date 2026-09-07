import { useMemo, useState, useEffect, useRef } from 'react';
import { Search, Download, Eye, Clock, CheckCircle, XCircle, AlertCircle, Scan, ShieldCheck, UserCheck, Loader2, LogOut, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import { useAttendanceStore } from '../store/attendanceStore';
import { useUserStore } from '../store/userStore';
import { faceApiService } from '../services/faceApiService';
import type { ColumnDef } from '@tanstack/react-table';

interface AttendanceItem {
  id: string; userId: string; userName: string; workDate: string;
  checkIn: string; checkOut: string; gpsLocation: string;
  status: 'ĐÚNG_GIỜ' | 'ĐI_MUỘN' | 'VỀ_SỚM' | 'VẮNG_MẶT';
  hoursWorked: number; note?: string;
}

const statusCfg: Record<string,{icon:React.ReactNode;cls:string;label:string}> = {
  ĐÚNG_GIỜ: { icon:<CheckCircle className="w-3.5 h-3.5"/>, cls:'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300', label:'Đúng giờ' },
  ĐI_MUỘN: { icon:<AlertCircle className="w-3.5 h-3.5"/>, cls:'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300', label:'Đi muộn' },
  VỀ_SỚM: { icon:<Clock className="w-3.5 h-3.5"/>, cls:'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300', label:'Về sớm' },
  VẮNG_MẶT: { icon:<XCircle className="w-3.5 h-3.5"/>, cls:'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300', label:'Vắng mặt' },
};

const formatDateVN = (dateStr?: string | null): string => {
  if (!dateStr) return '—';
  try {
    const cleanStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const parts = cleanStr.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch {}
  return dateStr;
};

export function AttendancePage() {
  const { records, isLoading, fetchAttendances, recordCheckIn, recordCheckOut } = useAttendanceStore();
  const { users, fetchUsers } = useUserStore();
  
  useEffect(() => {
    fetchAttendances();
    fetchUsers();
  }, [fetchAttendances, fetchUsers]);

  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tất cả');
  const [selected, setSelected] = useState<AttendanceItem|null>(null);

  // Face Check-In & Check-Out State
  const [faceCheckInOpen, setFaceCheckInOpen] = useState(false);
  const [scanStep, setScanStep] = useState<number>(0);
  const [selectedUserId, setSelectedUserId] = useState<string>('auto');
  const [attendanceAction, setAttendanceAction] = useState<'AUTO' | 'CHECK_IN' | 'CHECK_OUT'>('AUTO');
  const [recordedType, setRecordedType] = useState<'IN' | 'OUT'>('IN');
  const [faceAiStatus, setFaceAiStatus] = useState<string>('');
  const [isFaceMatched, setIsFaceMatched] = useState<boolean>(false);
  const [matchedUser, setMatchedUser] = useState<{ id: string; fullName: string; similarity?: number } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<any>(null);

  const processAttendanceForUser = async (userId: string, userName: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const existingToday = records.find(r => String(r.userId) === String(userId) && r.workDate === todayStr);
    const willCheckOut = attendanceAction === 'CHECK_OUT' || (attendanceAction === 'AUTO' && existingToday && existingToday.checkIn && (!existingToday.checkOut || existingToday.checkOut === '--:--' || existingToday.checkOut.trim() === ''));

    if (willCheckOut) {
      setRecordedType('OUT');
      await recordCheckOut(userId, userName);
    } else {
      setRecordedType('IN');
      await recordCheckIn(userId, userName);
    }
  };

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const stopCameraAndAi = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    stopCameraStream();
    setIsFaceMatched(false);
    setFaceAiStatus('');
  };

  const handleStartFaceCheckIn = async () => {
    setScanStep(1);
    setFaceAiStatus('Đang kết nối Camera & chuẩn bị AI...');
    setIsFaceMatched(false);
    setMatchedUser(null);

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      }
    } catch (e) {
      console.warn('Camera fallback in check-in:', e);
      setFaceAiStatus('Không thể mở Camera. Vui lòng cấp quyền Camera trên trình duyệt!');
      return;
    }

    try {
      setFaceAiStatus('Đang tải mô hình nhận diện khuôn mặt AI...');
      await faceApiService.loadModels();
      setFaceAiStatus('Vui lòng đưa khuôn mặt vào giữa khung hình...');
    } catch (e) {
      setFaceAiStatus('Lỗi nạp mô hình AI. Vui lòng kiểm tra kết nối mạng!');
      return;
    }

    const enrolledFaces = faceApiService.getAllEnrolledFaces();
    let consecutiveMatchCount = 0;
    let lastMatchedId = '';

    scanIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;

      try {
        const detection = await faceApiService.detectFaceAndDescriptor(videoRef.current);
        if (!detection) {
          setFaceAiStatus('Chưa phát hiện khuôn mặt. Vui lòng nhìn thẳng vào camera...');
          setIsFaceMatched(false);
          consecutiveMatchCount = 0;
          return;
        }

        // Mode 1: Auto detection
        if (!selectedUserId || selectedUserId === 'auto') {
          if (enrolledFaces.length === 0) {
            setFaceAiStatus('Chưa có dữ liệu khuôn mặt nào được đăng ký. Vui lòng chọn nhân viên chỉ định hoặc đăng ký tại mục Hồ sơ nhân sự!');
            return;
          }

          const match = faceApiService.findBestMatch(detection.descriptor, 0.55);
          if (match) {
            const foundUser = users.find(u => String(u.id) === String(match.userId)) || {
              id: match.userId,
              fullName: match.enrolled.fullName,
            };

            if (lastMatchedId === String(foundUser.id)) {
              consecutiveMatchCount++;
            } else {
              lastMatchedId = String(foundUser.id);
              consecutiveMatchCount = 1;
            }

            setFaceAiStatus(`Nhận diện: ${foundUser.fullName} (Độ khớp: ${match.similarityPercentage}%)`);
            setIsFaceMatched(true);

            if (consecutiveMatchCount >= 2) {
              if (scanIntervalRef.current) {
                clearInterval(scanIntervalRef.current);
                scanIntervalRef.current = null;
              }
              setMatchedUser({ id: String(foundUser.id), fullName: foundUser.fullName, similarity: match.similarityPercentage });

              setTimeout(async () => {
                stopCameraAndAi();
                setScanStep(2);
                await processAttendanceForUser(String(foundUser.id), foundUser.fullName);
              }, 600);
            }
          } else {
            setFaceAiStatus('Khuôn mặt chưa khớp với nhân sự nào đã đăng ký!');
            setIsFaceMatched(false);
            consecutiveMatchCount = 0;
          }
        } else {
          // Mode 2: Specific employee selected
          const targetUser = users.find(u => String(u.id) === String(selectedUserId));
          if (!targetUser) {
            setFaceAiStatus('Không tìm thấy thông tin nhân viên đã chọn!');
            return;
          }

          const hasEnrolled = faceApiService.getFaceDescriptor(String(targetUser.id));
          if (!hasEnrolled) {
            // First-time auto enrollment on the fly!
            setFaceAiStatus(`Đang tự động đăng ký dữ liệu khuôn mặt cho ${targetUser.fullName}...`);
            faceApiService.saveFaceDescriptor(String(targetUser.id), targetUser.fullName, detection.descriptor);
            if (scanIntervalRef.current) {
              clearInterval(scanIntervalRef.current);
              scanIntervalRef.current = null;
            }
            setMatchedUser({ id: String(targetUser.id), fullName: targetUser.fullName, similarity: 100 });
            setTimeout(async () => {
              stopCameraAndAi();
              setScanStep(2);
              await processAttendanceForUser(String(targetUser.id), targetUser.fullName);
            }, 600);
            return;
          }

          const verify = faceApiService.verifyUserFace(String(targetUser.id), detection.descriptor, 0.55);
          if (verify.isMatch) {
            consecutiveMatchCount++;
            setFaceAiStatus(`Xác thực: ${targetUser.fullName} (Độ khớp: ${verify.similarityPercentage}%)`);
            setIsFaceMatched(true);

            if (consecutiveMatchCount >= 2) {
              if (scanIntervalRef.current) {
                clearInterval(scanIntervalRef.current);
                scanIntervalRef.current = null;
              }
              setMatchedUser({ id: String(targetUser.id), fullName: targetUser.fullName, similarity: verify.similarityPercentage });

              setTimeout(async () => {
                stopCameraAndAi();
                setScanStep(2);
                await processAttendanceForUser(String(targetUser.id), targetUser.fullName);
              }, 600);
            }
          } else {
            setFaceAiStatus(`Khuôn mặt không khớp với ${targetUser.fullName} (Khoảng cách: ${verify.distance.toFixed(2)})`);
            setIsFaceMatched(false);
            consecutiveMatchCount = 0;
          }
        }
      } catch (err) {
        console.error('Lỗi khi đối soát khuôn mặt:', err);
      }
    }, 400);
  };

  const filtered = records.filter(d => {
    const q = search.toLowerCase();
    const ms = d.userName.toLowerCase().includes(q);
    const md = !dateFilter || d.workDate === dateFilter;
    const mst = statusFilter === 'Tất cả' || d.status === statusFilter;
    return ms && md && mst;
  });

  const columns = useMemo<ColumnDef<AttendanceItem>[]>(() => [
    { accessorKey:'userName', header:'Nhân viên', cell:({row})=>(
      <div><p className="font-medium text-gray-900 dark:text-white text-sm">{row.original.userName}</p><p className="text-xs text-gray-400">{row.original.userId}</p></div>
    )},
    {
      accessorKey: 'workDate',
      header: 'Ngày làm việc',
      cell: (info) => (
        <span className="font-mono text-sm text-gray-700 dark:text-gray-300">
          {formatDateVN(info.getValue() as string)}
        </span>
      ),
    },
    { accessorKey:'checkIn', header:'Giờ vào', cell:info=><span className={`font-mono text-sm font-bold ${info.getValue()?'text-emerald-600 dark:text-emerald-400':'text-gray-400'}`}>{(info.getValue() as string)||'--:--'}</span> },
    { accessorKey:'checkOut', header:'Giờ ra', cell:info=><span className={`font-mono text-sm font-bold ${info.getValue()?'text-blue-600 dark:text-blue-400':'text-gray-400'}`}>{(info.getValue() as string)||'--:--'}</span> },
    {
      accessorKey: 'hoursWorked',
      header: 'Số giờ làm',
      cell: ({ row }) => {
        const checkOut = row.original.checkOut;
        const isNotCheckedOut = !checkOut || checkOut === '--:--' || checkOut.trim() === '';
        if (isNotCheckedOut) {
          return (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                <Clock className="w-3.5 h-3.5 animate-pulse text-blue-600 dark:text-blue-400" />
                Đang trong ca
              </span>
              <button
                type="button"
                onClick={async (e) => {
                  e.stopPropagation();
                  await recordCheckOut(row.original.userId, row.original.userName);
                  toast.success(`Đã ghi nhận Tan ca (Giờ ra) cho ${row.original.userName}!`);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                title="Bấm để ghi nhận giờ ra ca (Check-out) ngay bây giờ"
              >
                <LogOut className="w-3 h-3" />
                Tan ca
              </button>
            </div>
          );
        }
        const hours = Number(row.original.hoursWorked) || 0;
        return (
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {hours > 0 ? `${hours} giờ` : '0 giờ'}
          </span>
        );
      },
    },
    { accessorKey:'status', header:'Trạng thái', cell:info=>{ const s=statusCfg[info.getValue() as string]; return <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${s?.cls}`}>{s?.icon}{s?.label}</span>; } },
    { id:'actions', header:'', cell:({row})=><button onClick={e=>{e.stopPropagation();setSelected(row.original)}} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"><Eye className="w-4 h-4"/></button> },
  ], []);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chấm công nhân viên</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Theo dõi giờ vào/ra và trạng thái chấm công hàng ngày của toàn bộ nhân sự.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSelectedUserId('auto');
                setScanStep(0);
                setFaceCheckInOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Scan className="w-4 h-4" /> Quét khuôn mặt chấm công
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium shadow-sm">
              <Download className="w-4 h-4"/>Xuất bảng công
            </button>
          </div>
        </div>

        {/* Thống kê nhanh */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(statusCfg).map(([key,cfg])=>{
            const count = records.filter(d=>d.status===key).length;
            return (
              <div key={key} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                <p className="text-xs text-gray-500 mb-1">{cfg.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
                <p className="text-xs text-gray-400">nhân viên hôm nay</p>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex-1 relative min-w-[200px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-4 w-4 text-gray-400"/></div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm theo tên nhân viên..." className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 sm:text-sm"/>
          </div>
          <input type="date" value={dateFilter} onChange={e=>setDateFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"/>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm">
            <option value="Tất cả">Tất cả trạng thái</option>
            {Object.entries(statusCfg).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>

        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} isLoading={isLoading}/>
      </div>

      {/* Modal: Chi tiết chấm công */}
      <Modal isOpen={!!selected} onClose={()=>setSelected(null)} title={selected?`Chi tiết chấm công: ${selected.userName}`:''} width="max-w-lg">
        {selected&&(
          <div className="space-y-4">
            <div className={`p-4 rounded-xl border flex items-center gap-3 ${statusCfg[selected.status]?.cls.includes('emerald')?'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200':'bg-gray-50 dark:bg-gray-900/30 border-gray-200'}`}>
              {statusCfg[selected.status]?.icon}
              <div><p className="text-xs text-gray-500">Trạng thái hôm nay</p><p className="font-bold text-gray-900 dark:text-white">{statusCfg[selected.status]?.label}</p></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center">
                <p className="text-xs text-gray-500 mb-1">Giờ vào</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{selected.checkIn||'--:--'}</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800 text-center">
                <p className="text-xs text-gray-500 mb-1">Giờ ra</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{selected.checkOut||'--:--'}</p>
              </div>
            </div>
            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              {[
                ['Ngày làm việc', formatDateVN(selected.workDate)],
                ['Tổng số giờ làm', (!selected.checkOut || selected.checkOut === '--:--' || selected.checkOut.trim() === '') ? 'Đang trong ca làm việc' : `${selected.hoursWorked} giờ`],
                ['Toạ độ GPS', selected.gpsLocation || 'Không có dữ liệu']
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between text-sm"><span className="text-gray-500">{l}:</span><span className="font-semibold text-gray-900 dark:text-white text-right max-w-[60%]">{v}</span></div>
              ))}
              {selected.note&&<div className="border-t border-gray-200 dark:border-gray-700 pt-2"><p className="text-xs text-gray-400 mb-1">Ghi chú:</p><p className="text-sm text-gray-700 dark:text-gray-300 italic">{selected.note}</p></div>}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Quét khuôn mặt chấm công (Face Check-in) */}
      <Modal
        isOpen={faceCheckInOpen}
        onClose={() => {
          stopCameraAndAi();
          setFaceCheckInOpen(false);
        }}
        title="Chấm công nhận diện khuôn mặt sinh trắc học AI"
        width="max-w-xl"
      >
        <div className="space-y-6">
          {scanStep === 0 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Mục đích chấm công:
                </label>
                <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-3">
                  <button
                    type="button"
                    onClick={() => setAttendanceAction('AUTO')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${attendanceAction === 'AUTO' ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
                  >
                    ⚡ Tự động (Vào/Ra)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttendanceAction('CHECK_IN')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${attendanceAction === 'CHECK_IN' ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
                  >
                    🟢 Vào ca (Check-in)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttendanceAction('CHECK_OUT')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${attendanceAction === 'CHECK_OUT' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
                  >
                    🔴 Tan ca (Check-out)
                  </button>
                </div>

                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Chế độ xác thực khuôn mặt:
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="auto">✨ Tự động nhận diện (Đứng trước camera)</option>
                  <optgroup label="Hoặc chọn nhân viên cụ thể để đối soát:">
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.userCode} - {u.fullName} {u.faceEnrolled ? '✓ (Đã có sinh trắc học)' : ''}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div className="flex flex-col items-center justify-center p-8 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-dashed border-emerald-300 dark:border-emerald-800 text-center gap-4">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center text-emerald-600 animate-pulse">
                  <Scan className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-base">Xác thực khuôn mặt thời gian thực</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 max-w-[320px]">
                    Đặt khuôn mặt vào giữa khung hình camera để AI nhận diện và ghi nhận giờ vào/ra ca làm việc.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    stopCameraAndAi();
                    setFaceCheckInOpen(false);
                  }}
                  className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleStartFaceCheckIn}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all flex items-center gap-2"
                >
                  <Scan className="w-4 h-4" /> Bắt đầu nhận diện
                </button>
              </div>
            </div>
          )}

          {scanStep === 1 && (
            <div className="py-2">
              <div className={`relative aspect-square w-full max-w-[360px] sm:max-w-[420px] mx-auto rounded-full overflow-hidden bg-black border-4 shadow-2xl flex items-center justify-center transition-colors duration-300 ${isFaceMatched ? 'border-emerald-500 ring-4 ring-emerald-500/30' : 'border-amber-400'}`}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover"
                />
                
                {/* Scanning Radar Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/0 via-emerald-500/25 to-emerald-500/0 animate-bounce pointer-events-none" />
                <div className="absolute inset-3 rounded-full border-2 border-dashed border-emerald-500/50 animate-spin pointer-events-none" />
                
                <div className="absolute w-60 h-60 sm:w-72 sm:h-72 rounded-full border border-emerald-400/80 flex items-center justify-center pointer-events-none">
                  <div className="w-8 h-8 border-t-2 border-l-2 border-emerald-400 absolute top-0 left-0" />
                  <div className="w-8 h-8 border-t-2 border-r-2 border-emerald-400 absolute top-0 right-0" />
                  <div className="w-8 h-8 border-b-2 border-l-2 border-emerald-400 absolute bottom-0 left-0" />
                  <div className="w-8 h-8 border-b-2 border-r-2 border-emerald-400 absolute bottom-0 right-0" />
                  
                  <span className="text-xs text-emerald-300 font-mono tracking-widest uppercase bg-black/75 px-3 py-1 rounded border border-emerald-500/40 animate-pulse">
                    {isFaceMatched ? 'Face Verified' : 'AI Face Matching...'}
                  </span>
                </div>

                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-black/75 px-4 py-1.5 rounded-full text-xs text-white font-mono flex items-center gap-2 shadow-lg">
                  <div className={`w-2.5 h-2.5 rounded-full ${isFaceMatched ? 'bg-emerald-500 animate-ping' : 'bg-amber-400 animate-pulse'}`} />
                  <span>{isFaceMatched ? 'AI: VERIFIED' : 'AI: SCANNING'}</span>
                </div>
              </div>

              <div className="mt-5 text-center">
                <p className={`text-sm sm:text-base transition-colors ${isFaceMatched ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-gray-600 dark:text-gray-300 font-medium'}`}>
                  {faceAiStatus || 'Đang đối soát sinh trắc học với dữ liệu nhân sự...'}
                </p>
              </div>

              <div className="flex justify-center mt-4">
                <button
                  type="button"
                  onClick={() => {
                    stopCameraAndAi();
                    setScanStep(0);
                  }}
                  className="px-5 py-2 text-xs sm:text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Dừng & Chọn lại
                </button>
              </div>
            </div>
          )}

          {scanStep === 2 && (
            <div className="flex flex-col items-center justify-center p-6 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-center gap-3 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-14 h-14 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-lg">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-bold text-emerald-800 dark:text-emerald-400 text-base">
                  {recordedType === 'OUT'
                    ? (matchedUser?.fullName ? `Tan ca (Check-out) thành công: ${matchedUser.fullName}!` : 'Ghi nhận Tan ca thành công!')
                    : (matchedUser?.fullName ? `Vào ca (Check-in) thành công: ${matchedUser.fullName}!` : 'Ghi nhận Vào ca thành công!')}
                </h4>
                <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1 max-w-[320px]">
                  {matchedUser?.similarity ? `Độ khớp sinh trắc học: ${matchedUser.similarity}%. ` : ''}
                  Hệ thống AI đã ghi nhận {recordedType === 'OUT' ? 'giờ ra ca và cập nhật tổng số giờ làm việc thực tế' : 'giờ bắt đầu làm việc hôm nay'} vào cơ sở dữ liệu.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  stopCameraAndAi();
                  setFaceCheckInOpen(false);
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
              >
                Hoàn tất & Đóng
              </button>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
