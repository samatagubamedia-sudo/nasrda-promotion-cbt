import React, { useState } from 'react';
import { ViewType, SyncStatus } from './Navbar';
import { LearnerProgress } from '../types';
import { getSubjectCounts, OFFICIAL_SUBJECTS } from '../services/questionsService';
import { User } from 'firebase/auth';
import { 
  BookOpen, 
  Clock, 
  AlertTriangle, 
  Sparkles, 
  Calendar, 
  ChevronRight, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Play,
  Cloud,
  CloudOff
} from 'lucide-react';

interface DashboardViewProps {
  progress: LearnerProgress;
  onNavigate: (view: ViewType) => void;
  onStartPracticeWithSubject?: (subject: string) => void;
  onResumePractice: () => void;
  onResumeMock: () => void;
  onUpdateTargetDate: (date: string) => void;
  currentUser?: User | null;
  syncStatus?: SyncStatus;
  onLogin?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  progress,
  onNavigate,
  onStartPracticeWithSubject,
  onResumePractice,
  onResumeMock,
  onUpdateTargetDate,
  currentUser,
  syncStatus = 'guest',
  onLogin,
}) => {
  const subjectCounts = getSubjectCounts();
  const totalVerifiedQuestions = Object.values(subjectCounts).reduce((a, b) => a + b, 0);

  // Compute practice answered accuracy
  const totalAttempts = progress.practiceAttempts.length;
  const correctAttempts = progress.practiceAttempts.filter(a => a.isCorrect).length;
  const accuracyPercentage = totalAttempts > 0 
    ? Math.round((correctAttempts / totalAttempts) * 100) 
    : null;

  // Active mistakes count
  const activeMistakesCount = Object.keys(progress.activeMistakes || {}).length;

  // Recent mocks (latest 3)
  const recentMocks = [...progress.mockHistory]
    .sort((a, b) => (b.submittedAt || b.startTime) - (a.submittedAt || a.startTime))
    .slice(0, 3);

  // Target date calculations
  const [isEditingTargetDate, setIsEditingTargetDate] = useState(false);
  const [targetDateInput, setTargetDateInput] = useState(progress.targetExamDate || '');

  const getDaysUntilTarget = () => {
    if (!progress.targetExamDate) return null;
    const target = new Date(progress.targetExamDate).getTime();
    const now = new Date().setHours(0, 0, 0, 0);
    const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const daysRemaining = getDaysUntilTarget();

  const handleSaveTargetDate = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateTargetDate(targetDateInput);
    setIsEditingTargetDate(false);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Promotion Exam Header Banner */}
      <section className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden border border-slate-700">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>NASRDA Directorate of Administration & Technical Services</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
            GL 11 to GL 12 Promotion CBT Prep
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Computer-Based Testing revision portal for Nigerian public servants. Practice untimed questions with cited rules, conduct timed mock simulations, and master active mistakes.
          </p>

          {/* Quick Target Date & Local Storage Badge */}
          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
            <div className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-teal-400" />
              {progress.targetExamDate ? (
                <span>
                  Target Exam: <strong className="text-white">{progress.targetExamDate}</strong>{' '}
                  {daysRemaining !== null && (
                    <span className="text-teal-300 font-bold ml-1">
                      ({daysRemaining > 0 ? `${daysRemaining} days left` : daysRemaining === 0 ? 'Today!' : 'Passed'})
                    </span>
                  )}
                </span>
              ) : (
                <span>No target date set</span>
              )}
              <button
                type="button"
                onClick={() => setIsEditingTargetDate(!isEditingTargetDate)}
                className="text-teal-300 hover:text-teal-100 underline ml-2 font-medium"
              >
                {progress.targetExamDate ? 'Edit' : 'Set Date'}
              </button>
            </div>

            <div className="flex items-center space-x-1.5 text-slate-300">
              {currentUser ? (
                <span className="flex items-center space-x-1.5 text-teal-300 font-medium">
                  <Cloud className="w-3.5 h-3.5" />
                  <span>Cloud Synced to {currentUser.displayName || currentUser.email}</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1.5 text-slate-400">
                  <CloudOff className="w-3.5 h-3.5 text-amber-400" />
                  <span>Guest Mode (Local browser cache)</span>
                  {onLogin && (
                    <button
                      type="button"
                      onClick={onLogin}
                      className="text-teal-300 hover:text-teal-200 underline ml-1 font-semibold"
                    >
                      Sign In to Sync
                    </button>
                  )}
                </span>
              )}
            </div>
          </div>

          {/* Target Date Input Form Modal/Inline */}
          {isEditingTargetDate && (
            <form onSubmit={handleSaveTargetDate} className="mt-3 p-3 bg-slate-800 rounded-lg border border-slate-600 flex items-center space-x-2">
              <input
                type="date"
                value={targetDateInput}
                onChange={(e) => setTargetDateInput(e.target.value)}
                className="bg-slate-900 text-white text-xs px-3 py-1.5 rounded-md border border-slate-600"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-md min-h-[36px]"
              >
                Save Target Date
              </button>
              <button
                type="button"
                onClick={() => setIsEditingTargetDate(false)}
                className="px-2 py-1.5 text-slate-400 hover:text-white text-xs"
              >
                Cancel
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Active Session Resume Banners (if any) */}
      {(progress.activeMockExam || progress.activePracticeSession) && (
        <section className="space-y-3" aria-label="Active sessions">
          {progress.activeMockExam && !progress.activeMockExam.isSubmitted && (
            <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm sm:text-base">
                  <span className="w-2.5 h-2.5 bg-amber-600 rounded-full animate-ping" />
                  <span>Timed Mock Exam In Progress: {progress.activeMockExam.name}</span>
                </div>
                <p className="text-xs sm:text-sm text-amber-800">
                  {progress.activeMockExam.questionIds.length} questions • Deadline is ticking against the absolute timer.
                </p>
              </div>
              <button
                type="button"
                onClick={onResumeMock}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-lg shadow-xs flex items-center justify-center space-x-2 min-h-[44px]"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Resume Mock Exam</span>
              </button>
            </div>
          )}

          {progress.activePracticeSession && !progress.activePracticeSession.isCompleted && (
            <div className="bg-teal-50 border border-teal-300 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-teal-950 font-bold text-sm sm:text-base">
                  <RotateCcw className="w-4 h-4 text-teal-700" />
                  <span>Practice Session In Progress</span>
                </div>
                <p className="text-xs sm:text-sm text-teal-800">
                  Question {progress.activePracticeSession.currentIndex + 1} of {progress.activePracticeSession.questionIds.length}
                </p>
              </div>
              <button
                type="button"
                onClick={onResumePractice}
                className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold rounded-lg shadow-xs flex items-center justify-center space-x-2 min-h-[44px]"
              >
                <span>Resume Practice</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </section>
      )}

      {/* Main Action Launchpad */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Practice Mode Tile */}
        <div 
          onClick={() => onNavigate('practice')}
          className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 hover:border-teal-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-4"
        >
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <BookOpen className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
              Untimed Practice
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Study questions by subject or difficulty. Instant check answer with official citations and detailed legal explanations.
            </p>
          </div>
          <div className="flex items-center text-sm font-bold text-teal-700 group-hover:translate-x-1 transition-transform">
            <span>Configure Session</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </div>
        </div>

        {/* Timed Mock Exam Tile */}
        <div 
          onClick={() => onNavigate('mock')}
          className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 hover:border-slate-800 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-4"
        >
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors">
              <Clock className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 group-hover:text-slate-900 transition-colors">
              Timed Mock Exam
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Simulate actual CBT conditions. Balanced mixed or subject mocks with countdown timer and full post-submission score review.
            </p>
          </div>
          <div className="flex items-center text-sm font-bold text-slate-900 group-hover:translate-x-1 transition-transform">
            <span>Start Mock Exam</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </div>
        </div>

        {/* Mistakes Review Tile */}
        <div 
          onClick={() => onNavigate('mistakes')}
          className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 hover:border-amber-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-4"
        >
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                Review Mistakes
              </h2>
              {activeMistakesCount > 0 && (
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  {activeMistakesCount} active
                </span>
              )}
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Targeted queue of all questions you missed in practice or mock exams. Answering correctly removes them from the active list.
            </p>
          </div>
          <div className="flex items-center text-sm font-bold text-amber-800 group-hover:translate-x-1 transition-transform">
            <span>{activeMistakesCount > 0 ? `Review ${activeMistakesCount} Questions` : 'View Mistake Queue'}</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </div>
        </div>
      </section>

      {/* Overview Stats Bar: Denominators explicit! */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" aria-label="Key statistics">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-medium text-slate-500 block">Question Bank</span>
          <span className="text-2xl font-bold text-slate-900 block mt-1">{totalVerifiedQuestions}</span>
          <span className="text-xs text-teal-700 font-medium mt-0.5 block">100% verified records</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-medium text-slate-500 block">Practice Questions Answered</span>
          <span className="text-2xl font-bold text-slate-900 block mt-1">{totalAttempts}</span>
          <span className="text-xs text-slate-500 mt-0.5 block">Cumulative checked items</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-medium text-slate-500 block">Practice Accuracy</span>
          {accuracyPercentage !== null ? (
            <>
              <span className="text-2xl font-bold text-teal-700 block mt-1">{accuracyPercentage}%</span>
              <span className="text-xs text-slate-500 mt-0.5 block">
                {correctAttempts} of {totalAttempts} correct
              </span>
            </>
          ) : (
            <>
              <span className="text-lg font-semibold text-slate-400 block mt-2">No attempts</span>
              <span className="text-xs text-slate-500 mt-0.5 block">Start practice to measure</span>
            </>
          )}
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-medium text-slate-500 block">Completed Mock Exams</span>
          <span className="text-2xl font-bold text-slate-900 block mt-1">{progress.mockHistory.length}</span>
          <span className="text-xs text-slate-500 mt-0.5 block">
            {progress.mockHistory.length > 0 
              ? `Avg score: ${Math.round(progress.mockHistory.reduce((acc, m) => acc + (m.score || 0), 0) / progress.mockHistory.length)}%` 
              : 'None completed yet'}
          </span>
        </div>
      </section>

      {/* The 4 Core Subjects with Real Bank Counts */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Official Exam Syllabus Breakdown</h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Authored GL 11 to GL 12 study questions with exact counts from verified documents
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {OFFICIAL_SUBJECTS.map((subject) => {
            const count = subjectCounts[subject] || 0;
            const subjectAttempts = progress.practiceAttempts.filter(a => a.subject === subject);
            const subjectCorrect = subjectAttempts.filter(a => a.isCorrect).length;
            const subjectAccuracy = subjectAttempts.length > 0 
              ? Math.round((subjectCorrect / subjectAttempts.length) * 100) 
              : null;

            return (
              <div 
                key={subject}
                className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                      {count} Questions
                    </span>
                    {subject === 'General Public Service Knowledge' && (
                      <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        Supplementary
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-900 text-base leading-snug">
                    {subject}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {subject === 'Public Service Rules' && 'PSR 2021: appointments, promotions, conduct, leaves & discipline.'}
                    {subject === 'Financial Regulations' && 'FR 2009: accounting officers, warrants, vote books, imprests & audit.'}
                    {subject === 'Space Law and Policy' && 'Treaties (OST, Liability, Rescue, Registration) & NASRDA Act 2010.'}
                    {subject === 'General Public Service Knowledge' && 'Constitutional supremacy, classifications & core service fundamentals.'}
                  </p>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="text-xs flex items-center justify-between text-slate-600">
                    <span>Practice attempts:</span>
                    <span className="font-semibold text-slate-900">
                      {subjectAttempts.length > 0 
                        ? `${subjectCorrect}/${subjectAttempts.length} (${subjectAccuracy}%)` 
                        : '0 answered'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (onStartPracticeWithSubject) {
                        onStartPracticeWithSubject(subject);
                      } else {
                        onNavigate('practice');
                      }
                    }}
                    className="w-full py-2 bg-slate-50 hover:bg-teal-50 text-slate-700 hover:text-teal-900 text-xs font-bold rounded-lg border border-slate-200 hover:border-teal-300 transition-colors min-h-[38px]"
                  >
                    Practice This Subject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent Mock Exam Results or Empty State */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Recent Mock Results</h2>
            <p className="text-xs text-slate-500">Historical performance across timed examinations</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('progress')}
            className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center space-x-1"
          >
            <span>View All History</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentMocks.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {recentMocks.map((mock) => (
              <div key={mock.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <span className="font-semibold text-sm text-slate-900 block">{mock.name}</span>
                  <span className="text-xs text-slate-500 block">
                    {mock.submittedAt ? new Date(mock.submittedAt).toLocaleDateString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Recent'} • {mock.questionIds.length} Questions
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <span className="text-base font-bold text-slate-900 block leading-tight">
                      {mock.score !== undefined ? `${mock.score}%` : 'N/A'}
                    </span>
                    <span className="text-xs text-slate-500 block">
                      {mock.correctCount || 0} / {mock.questionIds.length} correct
                    </span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    (mock.score || 0) >= 60 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {(mock.score || 0) >= 60 ? 'Strong' : 'Needs Review'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center space-y-2">
            <Clock className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No mock exams completed yet</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Test your knowledge under timed conditions to benchmark your performance across all four subjects.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('mock')}
              className="mt-2 inline-flex items-center space-x-1 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg min-h-[40px]"
            >
              <span>Take Your First Mock</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </section>

      {/* Study Guidance and Disclaimer Notice */}
      <footer className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
        <div className="flex items-center space-x-2 text-slate-800 font-bold">
          <ShieldCheck className="w-4 h-4 text-teal-700" />
          <span>Self-Study Revision Notice</span>
        </div>
        <p className="leading-relaxed">
          These questions have been authored and verified against the Public Service Rules (2021 edition), Financial Regulations (January 2009 edition), UN Space Treaties, and the NASRDA Act 2010. They are designed for independent study and revision. They are not official past examination papers and carry no official endorsement or pass-mark guarantee from an examination authority.
        </p>
      </footer>
    </div>
  );
};
