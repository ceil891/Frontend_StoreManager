import { useState, useRef, useEffect, useId } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import type { RoleType } from '../types';

// ----------------------------------------------------------------
// Validation Schema (Zod)
// ----------------------------------------------------------------
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// ----------------------------------------------------------------
// Role → Redirect mapping
// ----------------------------------------------------------------
function getRedirectPath(role: RoleType): string {
  switch (role) {
    case 'STAFF':
      return '/pos';
    case 'STORE_MANAGER':
      return '/';
    case 'SUPER_ADMIN':
    default:
      return '/';
  }
}

// ----------------------------------------------------------------
// LoginPage Component
// ----------------------------------------------------------------
export function LoginPage() {
  const navigate = useNavigate();
  const loginAsync = useAuthStore((s) => s.loginAsync);
  const serverError = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  const [showPassword, setShowPassword] = useState(false);
  const [shake, setShake] = useState(false);
  const emailId = useId();
  const passwordId = useId();
  const emailRef = useRef<HTMLInputElement>(null);

  // Auto-focus email on mount
  useEffect(() => {
    emailRef.current?.focus();
    clearError();
  }, [clearError]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      await loginAsync(data);
      const user = useAuthStore.getState().user;
      if (user) {
        navigate(getRedirectPath(user.role), { replace: true });
      }
    } catch {
      // Trigger shake animation on error
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }
  };

  // Destructure register and merge with ref
  const { ref: emailRegRef, ...emailRegProps } = register('email');

  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-950">
      {/* ─── LEFT: Branding Panel (hidden on mobile) ─── */}
      <div className="hidden lg:flex flex-col w-[55%] relative bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-400 p-12 text-white overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-teal-300/20 blur-2xl" />
        <div className="absolute top-1/2 -translate-y-1/2 right-8 w-64 h-64 rounded-full bg-emerald-300/10 blur-2xl" />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
            <span className="text-xl font-black">R</span>
          </div>
          <span className="text-xl font-bold tracking-tight">RetailHub</span>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col justify-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <h1 className="text-4xl font-black leading-tight mb-4">
              Enterprise Retail<br />Management Platform
            </h1>
            <p className="text-emerald-100 text-lg leading-relaxed max-w-md">
              Manage your entire multi-store operation from a single, powerful dashboard. Built for scale, designed for people.
            </p>
          </motion.div>

          {/* Feature list */}
          <motion.ul
            className="mt-10 space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            {[
              'Đồng bộ POS thời gian thực trên toàn chi nhánh',
              'Cảnh báo tồn kho thông minh',
              'Quản lý CRM & Điểm thưởng',
              'Báo cáo & phân tích tài chính',
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-emerald-50">
                <div className="w-5 h-5 rounded-full bg-white/25 flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 12 12">
                    <path d="M10 3L5 8.5 2 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                </div>
                <span className="text-sm font-medium">{item}</span>
              </li>
            ))}
          </motion.ul>
        </div>

        {/* Footer */}
        <p className="text-emerald-200 text-xs relative z-10">
          © 2026 RetailHub Enterprise. Bản quyền đã được bảo hộ.
        </p>
      </div>

      {/* ─── RIGHT: Login Form ─── */}
      <div className="flex flex-col w-full lg:w-[45%] items-center justify-center px-6 sm:px-12 py-12 bg-white dark:bg-gray-950">
        {/* Mobile logo */}
        <div className="flex items-center gap-2 mb-8 lg:hidden">
          <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-black text-lg">R</span>
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-white">RetailHub</span>
        </div>

        <div className="w-full max-w-sm">
          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Đăng nhập vào hệ thống
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Chào mừng bạn quay lại. Vui lòng nhập thông tin đăng nhập.
            </p>
          </motion.div>

          {/* Demo credentials hint */}
          <div className="mb-6 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl">
            <p className="text-xs font-medium text-amber-800 dark:text-amber-400 mb-1">Tài khoản trải nghiệm (Demo)</p>
            <div className="space-y-0.5 text-xs text-amber-700 dark:text-amber-500 font-mono">
              <p>admin@system.com → SUPER_ADMIN</p>
              <p>manager@store.com → STORE_MANAGER</p>
              <p>staff@store.com → STAFF (POS)</p>
              <p>inventory@retailhub.vn → INVENTORY_STAFF</p>
              <p className="mt-1 font-sans text-amber-600">Mật khẩu: <strong>123456</strong></p>
            </div>
          </div>

          {/* Form */}
          <motion.form
            onSubmit={handleSubmit(onSubmit)}
            animate={shake ? { x: [0, -10, 10, -8, 8, -4, 0] } : { x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-5"
            noValidate
          >
            {/* Server Error Alert */}
            <AnimatePresence>
              {serverError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl text-red-700 dark:text-red-400"
                >
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <p className="text-sm font-medium">{serverError}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email Field */}
            <div>
              <label htmlFor={emailId} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Địa chỉ Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id={emailId}
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  ref={(e) => {
                    emailRegRef(e);
                    (emailRef as React.MutableRefObject<HTMLInputElement | null>).current = e;
                  }}
                  {...emailRegProps}
                  className={`block w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-150 ${
                    errors.email
                      ? 'border-red-400 dark:border-red-600'
                      : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
                  }`}
                />
              </div>
              <AnimatePresence>
                {errors.email && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-1.5 text-xs text-red-500 flex items-center gap-1"
                  >
                    <AlertCircle className="w-3 h-3" />
                    {errors.email.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor={passwordId} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mật khẩu
                </label>
                <a
                  href="#"
                  className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
                >
                  Quên mật khẩu?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id={passwordId}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register('password')}
                  className={`block w-full pl-10 pr-11 py-2.5 border rounded-xl text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-150 ${
                    errors.password
                      ? 'border-red-400 dark:border-red-600'
                      : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <AnimatePresence>
                {errors.password && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-1.5 text-xs text-red-500 flex items-center gap-1"
                  >
                    <AlertCircle className="w-3 h-3" />
                    {errors.password.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="relative w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-emerald-400 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang đăng nhập...
                </>
              ) : (
                <>
                  Đăng nhập
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </motion.form>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-gray-400 dark:text-gray-600">
            Secure connection · RetailHub Identity Platform v4
          </p>
        </div>
      </div>
    </div>
  );
}
