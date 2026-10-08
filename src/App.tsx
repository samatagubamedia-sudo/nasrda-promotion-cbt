import React, { useState, useEffect, useRef } from 'react';
import { ViewType, Navbar, SyncStatus } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { PracticeView } from './components/PracticeView';
import { MockExamView } from './components/MockExamView';
import { ReviewMistakesView } from './components/ReviewMistakesView';
import { QuickRevisionView } from './components/QuickRevisionView';
import { ProgressView } from './components/ProgressView';
import { SettingsSourcesView } from './components/SettingsSourcesView';
import { 
  loadProgress, 
  saveProgress, 
  getGuestProgress, 
  clearGuestProgress, 
  mergeProgress,
  INITIAL_PROGRESS 
} from './services/storage';
import { LearnerProgress } from './types';
import { 
  auth, 
  loginWithGoogle, 
  logoutUser, 
  fetchUserProgressFromCloud, 
  saveUserProgressToCloud,
  testFirestoreConnection
} from './services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Cloud, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [progress, setProgress] = useState<LearnerProgress>(() => loadProgress(null));
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [practiceInitialSubject, setPracticeInitialSubject] = useState<string | undefined>();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('guest');
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(null);

  // Guest import prompt modal
  const [guestPromptData, setGuestPromptData] = useState<{
    user: User;
    guestProgress: LearnerProgress;
    cloudProgress: LearnerProgress | null;
  } | null>(null);

  // Sync debounce ref to prevent hammering Firestore on rapid clicks
  const syncTimeoutRef = useRef<any>(null);

  // Test Firestore connection on boot
  useEffect(() => {
    testFirestoreConnection();
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsAuthLoading(true);
      if (user) {
        setCurrentUser(user);
        setSyncStatus('saving');
        try {
          // 1. Fetch cloud progress for this specific user
          const cloudData = await fetchUserProgressFromCloud(user.uid);
          const guestData = getGuestProgress();

          if (cloudData) {
            // Existing cloud progress found!
            if (guestData && (guestData.practiceAttempts?.length > 0 || guestData.mockHistory?.length > 0)) {
              // Both cloud progress and local guest progress exist: prompt user
              setGuestPromptData({ user, guestProgress: guestData, cloudProgress: cloudData });
              setProgress(cloudData);
              saveProgress(cloudData, user.uid);
            } else {
              // Load cloud progress directly
              setProgress(cloudData);
              saveProgress(cloudData, user.uid);
            }
            setSyncStatus('synced');
          } else {
            // No cloud progress yet for this user
            if (guestData && (guestData.practiceAttempts?.length > 0 || guestData.mockHistory?.length > 0)) {
              // Offer to import guest progress
              setGuestPromptData({ user, guestProgress: guestData, cloudProgress: null });
              // Temporarily initialize with local user cache or initial
              const localUser = loadProgress(user.uid);
              setProgress(localUser);
            } else {
              // Brand new user: load local cache or initialize fresh
              const localUser = loadProgress(user.uid);
              setProgress(localUser);
              // Save to cloud to establish baseline
              await saveUserProgressToCloud(user.uid, localUser, {
                email: user.email,
                displayName: user.displayName,
              });
            }
            setSyncStatus('synced');
          }
        } catch (err: any) {
          console.error('Failed to sync user data on auth change:', err);
          setSyncStatus('error');
          setSyncErrorMessage(err.message || 'Failed to sync with cloud.');
          // Fallback to local user cache
          setProgress(loadProgress(user.uid));
        }
      } else {
        // Logged out / Guest
        setCurrentUser(null);
        setSyncStatus('guest');
        setGuestPromptData(null);
        // Load isolated guest progress
        setProgress(loadProgress(null));
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Hash route syncing for browser back/forward and direct links
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as ViewType;
      const validViews: ViewType[] = [
        'dashboard', 
        'practice', 
        'mock', 
        'mistakes', 
        'quick-revision', 
        'progress', 
        'settings'
      ];
      if (validViews.includes(hash)) {
        setCurrentView(hash);
      }
    };

    if (window.location.hash) {
      handleHashChange();
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (view: ViewType) => {
    setCurrentView(view);
    window.location.hash = view;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Central progress saving function
  const handleSaveProgress = (updated: LearnerProgress) => {
    setProgress(updated);
    // 1. Save to user-specific localStorage cache immediately
    saveProgress(updated, currentUser?.uid);

    // 2. If signed in, sync to Firestore
    if (currentUser) {
      setSyncStatus('saving');
      setSyncErrorMessage(null);

      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }

      syncTimeoutRef.current = setTimeout(async () => {
        try {
          await saveUserProgressToCloud(currentUser.uid, updated, {
            email: currentUser.email,
            displayName: currentUser.displayName,
          });
          setSyncStatus('synced');
        } catch (err: any) {
          console.error('Cloud synchronization failed:', err);
          setSyncStatus('error');
          setSyncErrorMessage(err.message || 'Error updating cloud document.');
        }
      }, 500); // 500ms debounce
    }
  };

  const handleManualSync = async () => {
    if (!currentUser) return;
    setSyncStatus('saving');
    try {
      await saveUserProgressToCloud(currentUser.uid, progress, {
        email: currentUser.email,
        displayName: currentUser.displayName,
      });
      setSyncStatus('synced');
      setSyncErrorMessage(null);
    } catch (err: any) {
      setSyncStatus('error');
      setSyncErrorMessage(err.message || 'Manual sync failed.');
    }
  };

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        alert(`Sign-in error: ${err.message || 'Please enable popups to sign in with Google.'}`);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Guest progress merge resolution
  const handleResolveGuestMerge = async (merge: boolean) => {
    if (!guestPromptData) return;
    const { user, guestProgress, cloudProgress } = guestPromptData;

    if (merge) {
      const base = cloudProgress || { ...INITIAL_PROGRESS };
      const merged = mergeProgress(base, guestProgress);
      setProgress(merged);
      saveProgress(merged, user.uid);
      await saveUserProgressToCloud(user.uid, merged, {
        email: user.email,
        displayName: user.displayName,
      });
      clearGuestProgress();
    } else {
      if (cloudProgress) {
        setProgress(cloudProgress);
        saveProgress(cloudProgress, user.uid);
      }
    }
    setGuestPromptData(null);
  };

  const handleUpdateTargetDate = (date: string) => {
    handleSaveProgress({
      ...progress,
      targetExamDate: date,
    });
  };

  const handleStartPracticeWithSubject = (subject: string) => {
    setPracticeInitialSubject(subject);
    navigateTo('practice');
  };

  const handleLaunchPracticeWithIds = (ids: string[]) => {
    const newSession = {
      id: `practice_custom_${Date.now()}`,
      selectedSubjects: [],
      questionIds: ids,
      currentIndex: 0,
      userAnswers: {},
      checkedQuestions: {},
      bookmarkedIds: [...progress.bookmarkedQuestionIds],
      flaggedIds: [],
      isCompleted: false,
      createdAt: Date.now(),
    };

    handleSaveProgress({
      ...progress,
      activePracticeSession: newSession,
    });
    navigateTo('practice');
  };

  const handleResumePractice = () => {
    navigateTo('practice');
  };

  const handleResumeMock = () => {
    navigateTo('mock');
  };

  const activeMistakesCount = Object.keys(progress.activeMistakes || {}).length;
  const hasActiveMock = !!(progress.activeMockExam && !progress.activeMockExam.isSubmitted);
  const hasActivePractice = !!(progress.activePracticeSession && !progress.activePracticeSession.isCompleted);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased selection:bg-teal-500 selection:text-white pb-20 lg:pb-8">
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={navigateTo}
        mistakesCount={activeMistakesCount}
        hasActiveMock={hasActiveMock}
        hasActivePractice={hasActivePractice}
        currentUser={currentUser}
        syncStatus={syncStatus}
        syncErrorMessage={syncErrorMessage}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onManualSync={handleManualSync}
      />

      {/* Guest Progress Import Prompt Modal */}
      {guestPromptData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in fade-in">
            <div className="flex items-center space-x-2 text-teal-700">
              <Cloud className="w-6 h-6" />
              <h2 className="text-lg font-bold text-slate-900">Import Guest Practice into Account?</h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              We detected previous study progress completed on this device as a guest ({guestPromptData.guestProgress.practiceAttempts?.length || 0} practice attempts, {guestPromptData.guestProgress.mockHistory?.length || 0} mock exams, {Object.keys(guestPromptData.guestProgress.activeMistakes || {}).length} mistakes).
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              Would you like to merge this guest progress into your cloud account <strong>{guestPromptData.user.email}</strong>, or keep your account clean?
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleResolveGuestMerge(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 min-h-[44px]"
              >
                No, Keep Account As Is
              </button>
              <button
                type="button"
                onClick={() => handleResolveGuestMerge(true)}
                className="w-full sm:w-auto px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-xs min-h-[44px] flex items-center justify-center space-x-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Yes, Merge Guest Progress</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full" id="main-content">
        {currentView === 'dashboard' && (
          <DashboardView
            progress={progress}
            onNavigate={navigateTo}
            onStartPracticeWithSubject={handleStartPracticeWithSubject}
            onResumePractice={handleResumePractice}
            onResumeMock={handleResumeMock}
            onUpdateTargetDate={handleUpdateTargetDate}
            currentUser={currentUser}
            syncStatus={syncStatus}
            onLogin={handleLogin}
          />
        )}

        {currentView === 'practice' && (
          <PracticeView
            progress={progress}
            onSaveProgress={handleSaveProgress}
            initialSubject={practiceInitialSubject}
            onClearInitialSubject={() => setPracticeInitialSubject(undefined)}
          />
        )}

        {currentView === 'mock' && (
          <MockExamView
            progress={progress}
            onSaveProgress={handleSaveProgress}
            onLaunchPracticeWithIds={handleLaunchPracticeWithIds}
          />
        )}

        {currentView === 'mistakes' && (
          <ReviewMistakesView
            progress={progress}
            onLaunchPracticeWithIds={handleLaunchPracticeWithIds}
            onSaveProgress={handleSaveProgress}
          />
        )}

        {currentView === 'quick-revision' && (
          <QuickRevisionView
            bookmarkedIds={progress.bookmarkedQuestionIds}
            onToggleBookmark={(id) => {
              const updated = progress.bookmarkedQuestionIds.includes(id)
                ? progress.bookmarkedQuestionIds.filter((bId) => bId !== id)
                : [...progress.bookmarkedQuestionIds, id];
              handleSaveProgress({ ...progress, bookmarkedQuestionIds: updated });
            }}
          />
        )}

        {currentView === 'progress' && (
          <ProgressView
            progress={progress}
            onRefreshProgress={() => setProgress(loadProgress(currentUser?.uid))}
            onViewMockDetails={(mock) => {
              handleSaveProgress({
                ...progress,
                activeMockExam: mock,
              });
              navigateTo('mock');
            }}
          />
        )}

        {currentView === 'settings' && (
          <SettingsSourcesView
            progress={progress}
            onUpdateTargetDate={handleUpdateTargetDate}
            onRefreshBank={() => setProgress(loadProgress(currentUser?.uid))}
          />
        )}
      </main>

      {/* Accessible Footer */}
      <footer className="hidden lg:block border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
          <span>
            NASRDA GL 11 to GL 12 Promotion CBT Prep • Independent Revision Portal
          </span>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateTo('settings')}
              className="hover:text-slate-800 underline"
            >
              Documentary Sources & Firebase Configuration
            </button>
            <span>•</span>
            <span>
              {currentUser ? `Signed in as ${currentUser.email}` : 'Guest Mode (Local Storage)'}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
