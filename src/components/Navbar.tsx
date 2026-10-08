import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Clock, 
  AlertTriangle, 
  Sparkles, 
  BarChart3, 
  Settings,
  LogIn,
  LogOut,
  Cloud,
  CloudOff,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  User as UserIcon,
  ChevronDown
} from 'lucide-react';
import { User } from 'firebase/auth';

export type ViewType = 
  | 'dashboard' 
  | 'practice' 
  | 'mock' 
  | 'mistakes' 
  | 'quick-revision' 
  | 'progress' 
  | 'settings';

export type SyncStatus = 'synced' | 'saving' | 'error' | 'guest';

interface NavbarProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  mistakesCount: number;
  hasActiveMock: boolean;
  hasActivePractice: boolean;
  currentUser: User | null;
  syncStatus: SyncStatus;
  syncErrorMessage?: string | null;
  onLogin: () => void;
  onLogout: () => void;
  onManualSync?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  mistakesCount,
  hasActiveMock,
  hasActivePractice,
  currentUser,
  syncStatus,
  syncErrorMessage,
  onLogin,
  onLogout,
  onManualSync,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const navItems = [
    { id: 'dashboard' as ViewType, label: 'Dashboard', icon: LayoutDashboard },
    { 
      id: 'practice' as ViewType, 
      label: 'Practice', 
      icon: BookOpen,
      badge: hasActivePractice ? 'In Progress' : undefined
    },
    { 
      id: 'mock' as ViewType, 
      label: 'Mock Exam', 
      icon: Clock,
      badge: hasActiveMock ? 'Active' : undefined,
      badgePulse: hasActiveMock
    },
    { 
      id: 'mistakes' as ViewType, 
      label: 'Mistakes', 
      icon: AlertTriangle,
      count: mistakesCount > 0 ? mistakesCount : undefined
    },
    { id: 'quick-revision' as ViewType, label: 'Flashcards', icon: Sparkles },
    { id: 'progress' as ViewType, label: 'Progress', icon: BarChart3 },
    { id: 'settings' as ViewType, label: 'Settings & Sources', icon: Settings },
  ];

  return (
    <>
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Agency Branding */}
            <div 
              className="flex items-center space-x-3 cursor-pointer select-none"
              onClick={() => onNavigate('dashboard')}
            >
              <div className="w-10 h-10 rounded-lg bg-slate-900 text-teal-400 flex items-center justify-center font-bold text-lg tracking-wider border border-teal-500/30 shadow-xs">
                N
              </div>
              <div>
                <span className="text-base sm:text-lg font-bold text-slate-900 block leading-tight">
                  NASRDA CBT Prep
                </span>
                <span className="text-[11px] sm:text-xs font-medium text-teal-700 block tracking-wide">
                  GL 11 → GL 12 Promotion Exam Revision
                </span>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden xl:flex items-center space-x-1" aria-label="Main Navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 flex items-center space-x-1.5 min-h-[44px] ${
                      isActive
                        ? 'bg-teal-50 text-teal-900 border border-teal-200 font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-teal-700' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                    {item.count !== undefined && (
                      <span className="ml-1 px-1.5 py-0.2 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                        {item.count}
                      </span>
                    )}
                    {item.badge && (
                      <span className={`ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full ${
                        item.badgePulse ? 'bg-red-100 text-red-700 animate-pulse border border-red-300' : 'bg-teal-100 text-teal-800'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* User Auth & Sync Controls */}
            <div className="flex items-center space-x-2">
              {/* Sync Status Badge */}
              {currentUser ? (
                <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-slate-50">
                  {syncStatus === 'saving' && (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 text-teal-600 animate-spin" />
                      <span className="text-teal-800 font-semibold">Saving...</span>
                    </>
                  )}
                  {syncStatus === 'synced' && (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-slate-700 font-medium">Cloud Synced</span>
                    </>
                  )}
                  {syncStatus === 'error' && (
                    <button
                      onClick={onManualSync}
                      title={syncErrorMessage || 'Click to retry cloud sync'}
                      className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span className="font-semibold underline">Sync Error (Retry)</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                  <CloudOff className="w-3.5 h-3.5 text-amber-600" />
                  <span>Guest Mode (Local)</span>
                </div>
              )}

              {/* Auth Button or User Avatar Profile Menu */}
              {currentUser ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="flex items-center space-x-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors min-h-[44px]"
                    aria-expanded={showUserDropdown}
                  >
                    {currentUser.photoURL ? (
                      <img 
                        src={currentUser.photoURL} 
                        alt={currentUser.displayName || 'Learner'} 
                        className="w-7 h-7 rounded-full object-cover border border-slate-300" 
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-xs">
                        {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                      </div>
                    )}
                    <span className="hidden md:inline text-xs font-bold text-slate-800 max-w-[120px] truncate">
                      {currentUser.displayName || currentUser.email?.split('@')[0]}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  </button>

                  {/* Dropdown Menu */}
                  {showUserDropdown && (
                    <div 
                      className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-xs animate-in fade-in"
                      onMouseLeave={() => setShowUserDropdown(false)}
                    >
                      <div className="px-4 py-2 border-b border-slate-100">
                        <span className="font-bold text-slate-900 block truncate">
                          {currentUser.displayName || 'Public Servant'}
                        </span>
                        <span className="text-slate-500 block truncate">
                          {currentUser.email}
                        </span>
                        <span className="text-[10px] text-teal-700 font-semibold block mt-0.5">
                          UID: {currentUser.uid.slice(0, 10)}...
                        </span>
                      </div>

                      <div className="py-1">
                        <button
                          type="button"
                          onClick={() => {
                            setShowUserDropdown(false);
                            onNavigate('progress');
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 flex items-center space-x-2"
                        >
                          <BarChart3 className="w-4 h-4 text-slate-500" />
                          <span>View My Progress & History</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowUserDropdown(false);
                            onNavigate('settings');
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 flex items-center space-x-2"
                        >
                          <Settings className="w-4 h-4 text-slate-500" />
                          <span>Settings & Documentation</span>
                        </button>
                      </div>

                      <div className="border-t border-slate-100 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setShowUserDropdown(false);
                            onLogout();
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-700 font-semibold flex items-center space-x-2"
                        >
                          <LogOut className="w-4 h-4 text-red-600" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onLogin}
                  className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center space-x-1.5 min-h-[44px]"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Optimized for 360px+ touch screens) */}
      <nav 
        className="xl:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg px-2 py-1.5"
        aria-label="Mobile Navigation"
      >
        <div className="grid grid-cols-5 gap-1 max-w-md mx-auto">
          {[
            { id: 'dashboard' as ViewType, label: 'Home', icon: LayoutDashboard },
            { id: 'practice' as ViewType, label: 'Practice', icon: BookOpen },
            { 
              id: 'mock' as ViewType, 
              label: 'Mock', 
              icon: Clock,
              badgePulse: hasActiveMock
            },
            { 
              id: 'mistakes' as ViewType, 
              label: 'Mistakes', 
              icon: AlertTriangle,
              count: mistakesCount > 0 ? mistakesCount : undefined
            },
            { id: 'progress' as ViewType, label: 'More', icon: Settings },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id || (item.id === 'progress' && (currentView === 'progress' || currentView === 'settings' || currentView === 'quick-revision'));
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-md min-h-[44px] transition-colors ${
                  isActive
                    ? 'text-teal-700 font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-teal-700 stroke-[2.2]' : 'text-slate-500'}`} />
                  {item.badgePulse && (
                    <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                  )}
                  {item.count !== undefined && (
                    <span className="absolute -top-1.5 -right-2.5 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-amber-500 text-white">
                      {item.count}
                    </span>
                  )}
                </div>
                <span className="text-[11px] mt-1 leading-none">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
