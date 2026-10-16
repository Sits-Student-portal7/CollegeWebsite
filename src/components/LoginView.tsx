import React, { useState } from 'react';
import { UserRole, UserProfile } from '../types';
import { supabase, isSupabaseConfigured, getSupabaseConfigStatus } from '../lib/supabase';
import { DEFAULT_USER_PROFILES } from '../data/mockData';

interface LoginViewProps {
  onLogin: (user: UserProfile) => void;
  authError?: string | null;
  onClearAuthError?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLogin,
  authError,
  onClearAuthError,
}) => {
  const [selectedTabRole, setSelectedTabRole] = useState<UserRole>('student');
  const [emailOrId, setEmailOrId] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string>('');
  const [infoToast, setInfoToast] = useState<string>('');
  
  // Password Recovery State
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);
  const [recoveryEmail, setRecoveryEmail] = useState<string>('');
  const [recoveryLoading, setRecoveryLoading] = useState<boolean>(false);
  const [recoverySuccess, setRecoverySuccess] = useState<string>('');
  const [recoveryError, setRecoveryError] = useState<string>('');

  const configStatus = getSupabaseConfigStatus();

  // Show quick demo switcher ONLY when explicitly enabled via development flag
  const showDevDemoSwitcher =
    import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEMO_LOGIN === 'true';

  const roleHints: Record<UserRole, { label: string; placeholder: string; defaultEmail: string }> = {
    student: {
      label: 'Student Institutional Email or Roll No',
      placeholder: 'e.g. 22cs045@siddhartha.ac.in or 22CS045',
      defaultEmail: 'arjun.22cs045@siddhartha.ac.in',
    },
    faculty: {
      label: 'Faculty Institutional Email or ID',
      placeholder: 'e.g. r.sharma@siddhartha.ac.in or FAC-1024',
      defaultEmail: 'r.sharma@siddhartha.ac.in',
    },
    admin: {
      label: 'Administrator Email or ID',
      placeholder: 'e.g. admin.erp@siddhartha.ac.in or ADM-001',
      defaultEmail: 'admin.erp@siddhartha.ac.in',
    },
  };

  const handleRoleTabChange = (role: UserRole) => {
    setSelectedTabRole(role);
    setLocalError('');
    if (onClearAuthError) onClearAuthError();
  };

  /**
   * Resolves raw user input (email or institutional ID) into a valid email address.
   */
  const resolveEmail = (input: string): string => {
    const trimmed = input.trim();
    if (trimmed.includes('@')) {
      return trimmed;
    }
    // Convenience transformation for institutional roll/staff numbers
    return `${trimmed.toLowerCase()}@siddhartha.ac.in`;
  };

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    if (onClearAuthError) onClearAuthError();

    if (!emailOrId.trim()) {
      setLocalError('Please enter your institutional email or ID.');
      return;
    }

    if (!password) {
      setLocalError('Please enter your password.');
      return;
    }

    const resolvedEmail = resolveEmail(emailOrId);

    if (!configStatus.isConfigured) {
      setLocalError(
        'Supabase is not configured with live credentials. The project is currently using placeholder configuration. Please set real SUPABASE_URL and SUPABASE_ANON_KEY to authenticate.'
      );
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: resolvedEmail,
        password: password,
      });

      if (error) {
        setLocalError(error.message || 'Authentication failed. Please verify your credentials.');
        setLoading(false);
        return;
      }

      if (!data.user) {
        setLocalError('No user returned by authentication provider.');
        setLoading(false);
        return;
      }

      // Successful authentication: Session state listener in App.tsx handles loading profile and role.
      setInfoToast('Credentials verified. Loading ERP profile...');
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setLocalError(
        err?.message || 'An unexpected network error occurred while contacting the authentication service.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');
    setRecoverySuccess('');

    if (!recoveryEmail.trim()) {
      setRecoveryError('Please enter your email address.');
      return;
    }

    const resolvedEmail = resolveEmail(recoveryEmail);

    if (!configStatus.isConfigured) {
      setRecoveryError(
        'Cannot dispatch password reset: Supabase environment credentials are not configured.'
      );
      return;
    }

    setRecoveryLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resolvedEmail, {
        redirectTo: window.location.origin,
      });

      if (error) {
        setRecoveryError(error.message);
      } else {
        setRecoverySuccess(
          `Password reset instructions have been dispatched to ${resolvedEmail}. Please check your inbox.`
        );
      }
    } catch (err: any) {
      setRecoveryError(err?.message || 'Failed to dispatch password recovery email.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  const displayError = localError || authError;

  return (
    <div className="bg-[#0b1326] text-[#dae2fd] font-sans min-h-screen flex flex-col items-center justify-center relative overflow-hidden antialiased">
      {/* Ambient Background Effects */}
      <div className="absolute top-0 left-0 -translate-x-1/4 -translate-y-1/4 w-[40vw] h-[40vw] bg-[radial-gradient(circle,rgba(99,102,241,0.15)_0%,rgba(11,19,38,0)_70%)] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30vw] h-[30vw] bg-[radial-gradient(circle,rgba(6,182,212,0.1)_0%,rgba(11,19,38,0)_70%)] rounded-full pointer-events-none z-0" />

      {infoToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white px-5 py-2.5 rounded-full shadow-lg text-sm font-medium flex items-center gap-2 border border-indigo-400">
          <span className="material-symbols-outlined text-[20px]">info</span>
          {infoToast}
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-[#1E293B] border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => {
                setShowForgotModal(false);
                setRecoveryError('');
                setRecoverySuccess('');
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <span className="material-symbols-outlined text-[22px]">lock_reset</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Reset Password</h3>
                <p className="text-xs text-slate-400">Supabase Auth recovery link</p>
              </div>
            </div>

            {recoveryError && (
              <div className="mb-4 text-xs text-rose-300 bg-rose-950/60 border border-rose-800 rounded-lg p-3">
                {recoveryError}
              </div>
            )}

            {recoverySuccess && (
              <div className="mb-4 text-xs text-emerald-300 bg-emerald-950/60 border border-emerald-800 rounded-lg p-3">
                {recoverySuccess}
              </div>
            )}

            {!recoverySuccess ? (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Institutional Email Address
                  </label>
                  <input
                    type="email"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    placeholder="e.g. arjun.22cs045@siddhartha.ac.in"
                    className="w-full rounded-lg bg-[#0F172A] border border-slate-700 text-white px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-hidden"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-lg hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={recoveryLoading}
                    className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center gap-1.5 shadow-md disabled:opacity-50"
                  >
                    {recoveryLoading ? 'Sending...' : 'Send Recovery Link'}
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  setRecoverySuccess('');
                }}
                className="w-full mt-2 py-2 text-xs font-semibold bg-slate-800 text-white rounded-lg hover:bg-slate-700"
              >
                Close
              </button>
            )}
          </div>
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
            <p className="text-sm text-[#c7c4d7] mb-4">
              Access your academic records via secure Supabase authentication.
            </p>

            {/* Supabase Environment Status Banner */}
            {!configStatus.isConfigured && (
              <div className="mb-4 text-xs bg-amber-950/50 border border-amber-600/60 text-amber-200 rounded-xl p-3 flex items-start gap-2.5">
                <span className="material-symbols-outlined text-amber-400 text-[18px] shrink-0 mt-0.5">
                  warning
                </span>
                <div>
                  <span className="font-semibold block">Supabase Credentials Notice</span>
                  <span className="text-amber-300/80">
                    Host: <code className="font-mono">{configStatus.configuredHost}</code> (Placeholder). Set active Supabase credentials in your environment variables to authenticate live users.
                  </span>
                </div>
              </div>
            )}

            {/* Role Context Tabs (Visual helper; authoritative role verified from database) */}
            <div className="bg-[#171f33] rounded-xl p-1.5 flex mb-3 border border-[#464554]/80 shadow-inner">
              <button
                type="button"
                id="role-student"
                onClick={() => handleRoleTabChange('student')}
                className={`flex-1 py-2 px-2 text-xs rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  selectedTabRole === 'student'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-[#c7c4d7] hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <span className="material-symbols-outlined text-[17px]">school</span> Student
              </button>
              <button
                type="button"
                id="role-faculty"
                onClick={() => handleRoleTabChange('faculty')}
                className={`flex-1 py-2 px-2 text-xs rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  selectedTabRole === 'faculty'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-[#c7c4d7] hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <span className="material-symbols-outlined text-[17px]">groups</span> Faculty
              </button>
              <button
                type="button"
                id="role-admin"
                onClick={() => handleRoleTabChange('admin')}
                className={`flex-1 py-2 px-2 text-xs rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  selectedTabRole === 'admin'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-[#c7c4d7] hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <span className="material-symbols-outlined text-[17px]">admin_panel_settings</span> Admin
              </button>
            </div>

            <div className="text-[11px] text-slate-400 mb-4 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px] text-indigo-400">verified_user</span>
              <span>Your authoritative role is loaded strictly from the verified ERP database profile.</span>
            </div>

            {/* Dev-Only Demo Role Switcher (Hidden in production and default dev) */}
            {showDevDemoSwitcher && (
              <div className="mb-4 p-3 rounded-xl bg-amber-950/30 border border-amber-600/40 text-xs">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-2">
                  [DEV ONLY] Mock Role Switcher:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onLogin(DEFAULT_USER_PROFILES.student)}
                    className="px-2.5 py-1.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-200 font-semibold text-xs flex items-center gap-1.5"
                  >
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => onLogin(DEFAULT_USER_PROFILES.faculty)}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-200 font-semibold text-xs flex items-center gap-1.5"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Faculty
                  </button>
                  <button
                    type="button"
                    onClick={() => onLogin(DEFAULT_USER_PROFILES.admin)}
                    className="px-2.5 py-1.5 rounded-lg bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-200 font-semibold text-xs flex items-center gap-1.5"
                  >
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    Admin
                  </button>
                </div>
              </div>
            )}

            {displayError && (
              <div className="mb-4 text-xs text-rose-300 bg-rose-950/60 border border-rose-800 rounded-lg p-3 flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] text-rose-400 mt-0.5 shrink-0">
                  error
                </span>
                <span>{displayError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#c7c4d7] mb-1.5" htmlFor="email-input">
                  {roleHints[selectedTabRole].label}
                </label>
                <input
                  id="email-input"
                  type="text"
                  value={emailOrId}
                  onChange={(e) => setEmailOrId(e.target.value)}
                  placeholder={roleHints[selectedTabRole].placeholder}
                  autoComplete="username"
                  required
                  className="w-full rounded-lg bg-[#0F172A] border border-[#334155] text-[#dae2fd] px-3.5 py-2.5 text-sm transition-colors focus:border-[#06B6D4] focus:outline-hidden focus:ring-1 focus:ring-[#06B6D4]"
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
                    autoComplete="current-password"
                    required
                    className="w-full rounded-lg bg-[#0F172A] border border-[#334155] text-[#dae2fd] px-3.5 py-2.5 text-sm pr-10 transition-colors focus:border-[#06B6D4] focus:outline-hidden focus:ring-1 focus:ring-[#06B6D4]"
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
                  <span>Remember Session</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setRecoveryEmail(emailOrId);
                    setShowForgotModal(true);
                  }}
                  className="text-[#c0c1ff] hover:underline transition-colors cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#6366F1] hover:bg-[#8083ff] text-white font-medium text-sm py-3 rounded-lg flex items-center justify-center gap-2 transition-all mt-6 shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Welcome & Portal Overview */}
          <div className="w-full md:w-1/2 bg-[#171f33]/50 border-t md:border-t-0 md:border-l border-[#464554] p-6 md:p-10 flex flex-col justify-between">
            <div className="mb-6">
              <h3 className="text-xl md:text-2xl font-bold text-[#dae2fd] mb-1">
                ScholarCore College ERP
              </h3>
              <p className="text-sm text-[#c7c4d7]">
                Siddhartha Institute of Technology &amp; Sciences &bull; Secure Academic Portal
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-grow content-center my-4">
              <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-3.5 hover:border-[#908fa0] transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-full bg-[#c0c1ff]/10 flex items-center justify-center text-[#c0c1ff]">
                    <span className="material-symbols-outlined text-[18px]">verified_user</span>
                  </div>
                  <h4 className="text-xs text-[#dae2fd] font-bold">Supabase Auth</h4>
                </div>
                <p className="text-xs text-[#c7c4d7]">Encrypted tokens, session restoration &amp; RLS policies.</p>
              </div>

              <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-3.5 hover:border-[#908fa0] transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-full bg-[#4cd7f6]/10 flex items-center justify-center text-[#4cd7f6]">
                    <span className="material-symbols-outlined text-[18px]">badge</span>
                  </div>
                  <h4 className="text-xs text-[#dae2fd] font-bold">Authoritative Roles</h4>
                </div>
                <p className="text-xs text-[#c7c4d7]">Role verified from database profiles, not client claims.</p>
              </div>

              <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-3.5 hover:border-[#908fa0] transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-full bg-[#b9c7e0]/10 flex items-center justify-center text-[#b9c7e0]">
                    <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                  </div>
                  <h4 className="text-xs text-[#dae2fd] font-bold">Fees &amp; Dues</h4>
                </div>
                <p className="text-xs text-[#c7c4d7]">Online payments, receipts, and ledger tracking.</p>
              </div>

              <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-3.5 hover:border-[#908fa0] transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-full bg-[#e1e0ff]/10 flex items-center justify-center text-[#e1e0ff]">
                    <span className="material-symbols-outlined text-[18px]">bar_chart</span>
                  </div>
                  <h4 className="text-xs text-[#dae2fd] font-bold">Academic Records</h4>
                </div>
                <p className="text-xs text-[#c7c4d7]">Internal assessments, university grades &amp; transcripts.</p>
              </div>
            </div>

            <div className="text-xs text-[#c7c4d7]/70 pt-2 border-t border-[#334155]/50 flex items-center justify-between">
              <span>Siddhartha Institute of Technology &amp; Sciences</span>
              <span className="font-mono text-[11px] bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-indigo-300">
                v2.5 &bull; Supabase Auth
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
