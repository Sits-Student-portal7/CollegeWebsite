import React, { useState } from 'react';
import { UserRole, UserProfile } from '../types';
import { DEFAULT_USER_PROFILES } from '../data/mockData';

interface LoginViewProps {
  onLogin: (user: UserProfile) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [idInput, setIdInput] = useState<string>('22CS045');
  const [password, setPassword] = useState<string>('password123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [infoToast, setInfoToast] = useState<string>('');

  const labels: Record<UserRole, { label: string; placeholder: string; defaultId: string }> = {
    student: {
      label: 'Roll Number',
      placeholder: 'Enter your Roll Number (e.g., 22CS045)',
      defaultId: '22CS045',
    },
    faculty: {
      label: 'Faculty ID',
      placeholder: 'Enter your Faculty ID (e.g., FAC-1024)',
      defaultId: 'FAC-1024',
    },
    admin: {
      label: 'Admin ID',
      placeholder: 'Enter your Admin ID (e.g., ADM-001)',
      defaultId: 'ADM-001',
    },
  };

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    setIdInput(labels[role].defaultId);
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!idInput.trim()) {
      setErrorMsg(`Please enter a valid ${labels[selectedRole].label}.`);
      return;
    }

    const defaultProfile = DEFAULT_USER_PROFILES[selectedRole];
    const userProfile: UserProfile = {
      ...defaultProfile,
      idNumber: idInput.trim() || defaultProfile.idNumber,
    };

    onLogin(userProfile);
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    setInfoToast(`A password reset link has been dispatched to your institutional email for ${labels[selectedRole].label}.`);
    setTimeout(() => setInfoToast(''), 5000);
  };

  return (
    <div className="bg-[#0b1326] text-[#dae2fd] font-sans min-h-screen flex flex-col items-center justify-center relative overflow-hidden antialiased">
      {/* Ambient Background Effects */}
      <div className="absolute top-0 left-0 -translate-x-1/4 -translate-y-1/4 w-[40vw] h-[40vw] bg-[radial-gradient(circle,rgba(99,102,241,0.15)_0%,rgba(11,19,38,0)_70%)] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30vw] h-[30vw] bg-[radial-gradient(circle,rgba(6,182,212,0.1)_0%,rgba(11,19,38,0)_70%)] rounded-full pointer-events-none z-0" />

      {infoToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white px-5 py-2.5 rounded-full shadow-lg text-sm font-medium flex items-center gap-2 border border-indigo-400 animate-bounce">
          <span className="material-symbols-outlined text-[20px]">info</span>
          {infoToast}
        </div>
      )}

      <main className="w-full max-w-[1200px] px-4 md:px-6 z-10 flex-grow flex items-center justify-center py-10">
        <div className="bg-[#1E293B]/70 backdrop-blur-md border border-[#334155] w-full rounded-xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
          
          {/* Left Column: Login Form */}
          <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col justify-center">
            <div className="mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#c0c1ff] text-[36px]">school</span>
              <h1 className="text-2xl md:text-3xl font-bold text-[#dae2fd]">ScholarCore</h1>
            </div>

            <h2 className="text-2xl md:text-3xl font-semibold mb-2 text-white">Sign In</h2>
            <p className="text-sm text-[#c7c4d7] mb-6">
              Access your academic dashboard at Siddhartha Institute of Technology &amp; Sciences.
            </p>

            {/* Role Selector Tabs */}
            <div className="bg-[#171f33] rounded-xl p-1.5 flex mb-4 border border-[#464554]/80 shadow-inner">
              <button
                type="button"
                id="role-student"
                onClick={() => handleRoleChange('student')}
                className={`flex-1 py-2.5 px-2 text-xs rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  selectedRole === 'student'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-[#c7c4d7] hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <span className="material-symbols-outlined text-[17px]">school</span> Student
              </button>
              <button
                type="button"
                id="role-faculty"
                onClick={() => handleRoleChange('faculty')}
                className={`flex-1 py-2.5 px-2 text-xs rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  selectedRole === 'faculty'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-[#c7c4d7] hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <span className="material-symbols-outlined text-[17px]">groups</span> Faculty
              </button>
              <button
                type="button"
                id="role-admin"
                onClick={() => handleRoleChange('admin')}
                className={`flex-1 py-2.5 px-2 text-xs rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  selectedRole === 'admin'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-[#c7c4d7] hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <span className="material-symbols-outlined text-[17px]">admin_panel_settings</span> Admin
              </button>
            </div>

            {/* Quick Demo One-Click Logins */}
            <div className="mb-5 p-3 rounded-xl bg-slate-900/60 border border-slate-700/60 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Quick Role Switcher:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onLogin(DEFAULT_USER_PROFILES.student)}
                  className="px-2.5 py-1.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-200 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  Student (Arjun)
                </button>
                <button
                  type="button"
                  onClick={() => onLogin(DEFAULT_USER_PROFILES.faculty)}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-200 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Faculty (Dr. Rajesh)
                </button>
                <button
                  type="button"
                  onClick={() => onLogin(DEFAULT_USER_PROFILES.admin)}
                  className="px-2.5 py-1.5 rounded-lg bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-200 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  Admin (Registrar)
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 text-xs text-red-300 bg-red-950/60 border border-red-800 rounded-lg p-3">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#c7c4d7] mb-1.5" id="id-label" htmlFor="id-input">
                  {labels[selectedRole].label}
                </label>
                <input
                  id="id-input"
                  type="text"
                  value={idInput}
                  onChange={(e) => setIdInput(e.target.value)}
                  placeholder={labels[selectedRole].placeholder}
                  className="w-full rounded-lg bg-[#0F172A] border border-[#334155] text-[#dae2fd] px-3.5 py-2.5 text-sm transition-colors focus:border-[#06B6D4] focus:outline-none focus:ring-1 focus:ring-[#06B6D4]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#c7c4d7] mb-1.5" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg bg-[#0F172A] border border-[#334155] text-[#dae2fd] px-3.5 py-2.5 text-sm pr-10 transition-colors focus:border-[#06B6D4] focus:outline-none focus:ring-1 focus:ring-[#06B6D4]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c7c4d7] hover:text-white"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-[#c7c4d7]">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-[#334155] bg-[#0F172A] text-[#6366F1] focus:ring-[#6366F1]"
                  />
                  <span>Remember Me</span>
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[#c0c1ff] hover:underline transition-colors"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                className="w-full bg-[#6366F1] hover:bg-[#8083ff] text-white font-medium text-sm py-3 rounded-lg flex items-center justify-center gap-2 transition-all mt-6 shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] cursor-pointer"
              >
                Sign In <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </form>
          </div>

          {/* Right Column: Welcome & Features */}
          <div className="w-full md:w-1/2 bg-[#171f33]/50 border-t md:border-t-0 md:border-l border-[#464554] p-6 md:p-10 flex flex-col justify-between">
            <div className="mb-6">
              <h3 className="text-xl md:text-2xl font-bold text-[#dae2fd] mb-1">Welcome to ScholarCore ERP</h3>
              <p className="text-sm text-[#c7c4d7]">
                Centralized academic portal for Siddhartha Institute of Technology &amp; Sciences.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-grow content-center my-4">
              {/* Feature Card 1 */}
              <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-3.5 hover:border-[#908fa0] transition-colors group">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-full bg-[#c0c1ff]/10 flex items-center justify-center text-[#c0c1ff] group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-[18px]">school</span>
                  </div>
                  <h4 className="text-xs text-[#dae2fd] font-bold">Academics</h4>
                </div>
                <p className="text-xs text-[#c7c4d7]">Course registration, materials, and schedules.</p>
              </div>

              {/* Feature Card 2 */}
              <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-3.5 hover:border-[#908fa0] transition-colors group">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-full bg-[#4cd7f6]/10 flex items-center justify-center text-[#4cd7f6] group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                  </div>
                  <h4 className="text-xs text-[#dae2fd] font-bold">Attendance</h4>
                </div>
                <p className="text-xs text-[#c7c4d7]">Real-time tracking and semester analytics.</p>
              </div>

              {/* Feature Card 3 */}
              <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-3.5 hover:border-[#908fa0] transition-colors group">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-full bg-[#b9c7e0]/10 flex items-center justify-center text-[#b9c7e0] group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                  </div>
                  <h4 className="text-xs text-[#dae2fd] font-bold">Fees</h4>
                </div>
                <p className="text-xs text-[#c7c4d7]">Online payments, receipts, and dues.</p>
              </div>

              {/* Feature Card 4 */}
              <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-3.5 hover:border-[#908fa0] transition-colors group">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-full bg-[#e1e0ff]/10 flex items-center justify-center text-[#e1e0ff] group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-[18px]">bar_chart</span>
                  </div>
                  <h4 className="text-xs text-[#dae2fd] font-bold">Results</h4>
                </div>
                <p className="text-xs text-[#c7c4d7]">Grades, transcripts, and performance.</p>
              </div>

              {/* Feature Card 5 */}
              <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-3.5 hover:border-[#908fa0] transition-colors group">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-full bg-[#acedff]/10 flex items-center justify-center text-[#acedff] group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-[18px]">notifications</span>
                  </div>
                  <h4 className="text-xs text-[#dae2fd] font-bold">Notices</h4>
                </div>
                <p className="text-xs text-[#c7c4d7]">Campus announcements and important dates.</p>
              </div>

              {/* Feature Card 6 */}
              <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-3.5 hover:border-[#908fa0] transition-colors group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#c0c1ff]/5 to-transparent pointer-events-none" />
                <div className="flex items-center gap-2 mb-1 relative z-10">
                  <div className="w-8 h-8 rounded-full bg-[#494bd6]/20 flex items-center justify-center text-[#c0c1ff] group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                  </div>
                  <h4 className="text-xs text-[#dae2fd] font-bold">AI Assistant</h4>
                </div>
                <p className="text-xs text-[#c7c4d7] relative z-10">Smart query resolution &amp; academic guidance.</p>
              </div>
            </div>

            <div className="text-xs text-[#c7c4d7]/70 pt-2 border-t border-[#334155]/50 flex items-center justify-between">
              <span>Siddhartha Institute of Technology &amp; Sciences</span>
              <span className="font-mono text-[11px] bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-indigo-300">
                v2.4
              </span>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full text-center py-4 z-10 mt-auto text-xs text-[#c7c4d7]/60">
        &copy; 2026 ScholarCore ERP &bull; Siddhartha Institute of Technology &amp; Sciences
      </footer>
    </div>
  );
};
