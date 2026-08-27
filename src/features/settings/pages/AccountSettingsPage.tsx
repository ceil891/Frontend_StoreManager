import { useState, useEffect, useRef } from 'react';
import { useAuthUser, useAuthStore } from '@/features/auth/store/authStore';
import { Camera, Mail, Phone, Lock, Save, User as UserIcon, Shield, Activity, Bell, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { axiosClient } from '@/shared/lib/axiosClient';
import { compressImage } from '@/shared/utils/imageCompressor';
import { uploadImageToCloudinary } from '@/shared/services/uploadService';

export function AccountSettingsPage() {
  const user = useAuthUser();
  const updateUser = useAuthStore((s) => s.updateUser);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications'>('profile');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Profile state
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState((user as any)?.phone || '0987654321');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar || (user as any)?.avatarUrl || null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImg, setIsUploadingImg] = useState(false);

  // Security state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone((user as any)?.phone || '0987654321');
      const av = user.avatar || (user as any)?.avatarUrl || null;
      if (typeof av === 'string' && av.trim() && !av.includes('[object')) {
        setAvatarPreview(av);
      } else {
        setAvatarPreview(null);
      }
    }
  }, [user]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Vui lòng nhập họ và tên!');
      return;
    }
    try {
      setIsSaving(true);
      const cleanAvatar = typeof avatarPreview === 'string' && !avatarPreview.includes('[object') ? avatarPreview : undefined;

      // 1. Cập nhật qua API /auth/profile chuyên biệt
      const res = await axiosClient.put<any, any>('/auth/profile', {
        fullName: name.trim(),
        phone: phone || '',
        avatar: cleanAvatar || '',
      });

      const updatedUser = res?.data || res;

      // 2. Cập nhật Zustand authStore và localStorage
      updateUser({
        name: updatedUser?.name || name.trim(),
        avatar: updatedUser?.avatar || cleanAvatar,
        ...(phone ? { phone } : {}),
      });

      toast.success('Hồ sơ và ảnh đại diện đã được cập nhật thành công!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi cập nhật hồ sơ');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu mới không khớp!');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    try {
      await axiosClient.post('/auth/change-password', {
        oldPassword: currentPassword,
        newPassword: newPassword,
        confirmPassword: confirmPassword,
      });
      toast.success('Đã thay đổi mật khẩu thành công!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi khi thay đổi mật khẩu');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImg(true);
      toast.loading('Đang tải ảnh đại diện lên...', { id: 'upload_avatar' });

      // 1. Nén ảnh qua canvas trước khi gửi
      const compressedFile = await compressImage(file, { maxWidth: 500, maxHeight: 500, quality: 0.85 });
      
      // 2. Upload lên Cloudinary qua Server API (hoặc Base64 fallback)
      const imageUrl = await uploadImageToCloudinary(compressedFile, 'avatars');

      setAvatarPreview(imageUrl);

      // 3. Lưu trực tiếp vào Database thông qua /auth/profile
      const res = await axiosClient.put<any, any>('/auth/profile', {
        fullName: name.trim() || user?.name || '',
        phone: phone || '',
        avatar: imageUrl,
      });

      const updatedUser = res?.data || res;

      // 4. Cập nhật Zustand authStore ngay lập tức để Sidebar & toàn bộ app nhận diện
      updateUser({
        name: updatedUser?.name || name.trim() || user?.name,
        avatar: updatedUser?.avatar || imageUrl,
      });

      toast.success('Đã cập nhật ảnh đại diện thành công!', { id: 'upload_avatar' });
    } catch (err: any) {
      console.error('Lỗi khi tải ảnh đại diện:', err);
      toast.error('Không thể cập nhật ảnh đại diện: ' + (err?.message || ''), { id: 'upload_avatar' });
    } finally {
      setIsUploadingImg(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarPreview(null);
    try {
      await axiosClient.put('/auth/profile', {
        fullName: name.trim() || user?.name || '',
        phone: phone || '',
        avatar: '',
      });
      updateUser({ avatar: '' });
      toast.info('Đã xóa ảnh đại diện');
    } catch (err) {
      updateUser({ avatar: '' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-xl flex items-center justify-center">
          <UserIcon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tài khoản của tôi</h1>
          <p className="text-sm text-gray-500">Quản lý thông tin cá nhân và bảo mật tài khoản.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-2 overflow-x-auto">
          {[
            { id: 'profile', label: 'Hồ sơ', icon: UserIcon },
            { id: 'security', label: 'Bảo mật', icon: Shield },
            { id: 'notifications', label: 'Thông báo', icon: Bell }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSave} className="space-y-8 max-w-2xl">
              {/* Avatar Section */}
              <div className="flex items-center gap-6">
                <div
                  className="relative group cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                  title="Bấm để chọn ảnh đại diện mới"
                >
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 flex items-center justify-center transition-all group-hover:ring-4 group-hover:ring-emerald-500/30">
                    {avatarPreview && typeof avatarPreview === 'string' && !avatarPreview.includes('[object') ? (
                      <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" onError={() => setAvatarPreview(null)} />
                    ) : (
                      <span className="text-3xl font-bold text-gray-400">{((name || user?.name || 'U').charAt(0)).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                    <Camera className="w-6 h-6" />
                  </div>
                  <label
                    onClick={(e) => e.stopPropagation()}
                    className="absolute bottom-0 right-0 p-1.5 bg-emerald-600 text-white rounded-full cursor-pointer shadow-lg hover:bg-emerald-700 transition-transform hover:scale-110"
                  >
                    <Camera className="w-4 h-4" />
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Ảnh đại diện</h3>
                  <p className="text-xs text-gray-500">Nên dùng ảnh vuông, kích thước tối thiểu 200x200px.</p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 flex items-center gap-1 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" /> Tải ảnh mới
                    </button>
                    {avatarPreview && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Xóa ảnh
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Họ và Tên</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                    <input
                      type="email"
                      value={user?.email || ''}
                      readOnly
                      disabled
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-not-allowed"
                    />
                  </div>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Số điện thoại</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
                <button type="submit" className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-sm transition-colors text-sm">
                  <Save className="w-4 h-4" /> Lưu Thay Đổi
                </button>
              </div>
            </form>
          )}

          {activeTab === 'security' && (
            <div className="space-y-8 max-w-xl">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                  <Lock className="w-4 h-4 text-emerald-600" /> Đổi mật khẩu
                </h3>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Mật khẩu hiện tại</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Mật khẩu mới</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Xác nhận mật khẩu mới</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                  <div className="pt-2">
                    <button type="submit" className="px-4 py-2 bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg text-sm transition-colors">
                      Cập nhật Mật khẩu
                    </button>
                  </div>
                </form>
              </div>

              <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                  <Activity className="w-4 h-4 text-emerald-600" /> Phiên đăng nhập gần đây
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Windows 11 • Chrome</p>
                      <p className="text-xs text-gray-500">192.168.1.5 • Đang hoạt động</p>
                    </div>
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 px-2 py-1 rounded">Hiện tại</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">iPhone 14 Pro • Safari</p>
                      <p className="text-xs text-gray-500">14.120.55.2 • 2 giờ trước</p>
                    </div>
                    <button className="text-xs text-red-600 hover:underline">Đăng xuất</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="text-center py-12 text-gray-500">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p>Chưa có cấu hình thông báo cá nhân nào.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
