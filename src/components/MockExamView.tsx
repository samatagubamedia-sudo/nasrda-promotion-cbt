import React, { useState, useEffect, useRef } from 'react';
import { 
  Question, 
  MockExamState, 
  LearnerProgress,
  PracticeSessionState
} from '../types';
import { 
  OFFICIAL_SUBJECTS, 
  getVerifiedQuestions, 
  calculateMixedMockComposition,
  selectMockQuestions,
  getQuestionMap
} from '../services/questionsService';
import { QuestionCard } from './QuestionCard';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  ChevronLeft, 
  ChevronRight, 
  Flag, 
  ArrowRight, 
  Play, 
  RotateCcw,
  ShieldAlert,
  Info,
  BookOpen,
  AlertCircle
} from 'lucide-react';

interface MockExamViewProps {
  progress: LearnerProgress;
  onSaveProgress: (updated: LearnerProgress) => void;
  onLaunchPracticeWithIds?: (ids: string[]) => void;
}

export const MockExamView: React.FC<MockExamViewProps> = ({
  progress,
  onSaveProgress,
  onLaunchPracticeWithIds,
}) => {
  // Setup configuration state
  const [examType, setExamType] = useState<'mixed' | 'subject'>('mixed');
  const [selectedSingleSubject, setSelectedSingleSubject] = useState<string>(OFFICIAL_SUBJECTS[0]);
  const [selectedMixedSubjects, setSelectedMixedSubjects] = useState<string[]>([...OFFICIAL_SUBJECTS]);
  const [requestedCount, setRequestedCount] = useState<number | 'all'>(50);
  const [customDurationMinutes, setCustomDurationMinutes] = useState<number>(50);

  // Active / Review Exam state
  const [mockExam, setMockExam] = useState<MockExamState | null>(
    progress.activeMockExam || null
  );

  // Submission confirmation modal state
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Real-time remaining seconds
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const timerRef = useRef<any>(null);

  // Sync state helper
  const saveMockState = (updatedMock: MockExamState | null) => {
    setMockExam(updatedMock);
    onSaveProgress({
      ...progress,
      activeMockExam: updatedMock,
    });
  };

  // Compute available pool for setup screen
  const verifiedQuestions = getVerifiedQuestions();
  const activeSelectedSubjects = examType === 'mixed' ? selectedMixedSubjects : [selectedSingleSubject];
  const totalEligiblePool = verifiedQuestions.filter((q) => activeSelectedSubjects.includes(q.subject)).length;

  // Compute preview composition for mixed mock
  const previewTargetCount = requestedCount === 'all' 
    ? totalEligiblePool 
    : Math.min(requestedCount, totalEligiblePool);

  const { composition: previewComposition, actualTotal: previewActualTotal } = calculateMixedMockComposition(
    activeSelectedSubjects,
    previewTargetCount
  );

  // Auto-adjust default duration when requestedCount changes
  useEffect(() => {
    if (!mockExam) {
      const count = requestedCount === 'all' ? previewActualTotal : Math.min(requestedCount, previewActualTotal);
      setCustomDurationMinutes(Math.max(5, count)); // 1 min per question default
    }
  }, [requestedCount, previewActualTotal]);

  // Start new mock exam
  const handleStartExam = () => {
    if (previewActualTotal === 0) return;

    const { questions, composition } = selectMockQuestions(
      activeSelectedSubjects,
      previewTargetCount
    );

    const now = Date.now();
    const durationMs = customDurationMinutes * 60 * 1000;
    const deadlineTime = now + durationMs;

    const newMock: MockExamState = {
      id: `mock_${now}`,
      name: examType === 'mixed' ? 'Full Mixed CBT Mock Exam' : `${selectedSingleSubject} Mock`,
      isMixed: examType === 'mixed',
      selectedSubjects: activeSelectedSubjects,
      subjectComposition: composition,
      questionIds: questions.map((q) => q.id),
      questionSnapshots: questions, // Immutable snapshot preserving historical bank
      currentIndex: 0,
      userAnswers: {},
      flaggedIds: [],
      startTime: now,
      durationMinutes: customDurationMinutes,
      deadlineTime,
      isSubmitted: false,
    };

    saveMockState(newMock);
  };

  // Timer Effect: Calculates remaining time from deadlineTime (does NOT reset on reload!)
  useEffect(() => {
    if (!mockExam || mockExam.isSubmitted) return;

    const updateTimer = () => {
      const now = Date.now();
      const remainingMs = mockExam.deadlineTime - now;
      const secondsLeft = Math.max(0, Math.floor(remainingMs / 1000));
      setRemainingSeconds(secondsLeft);

      // Auto-submit on expiry
      if (secondsLeft <= 0 && !mockExam.isSubmitted) {
        handleSubmitExam(true);
      }
    };

    updateTimer(); // immediate
    timerRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [mockExam?.deadlineTime, mockExam?.isSubmitted]);

  // Submit Exam handler (guards against double submission)
  const handleSubmitExam = (isAutoExpiry = false) => {
    if (!mockExam || mockExam.isSubmitted) return;

    if (timerRef.current) clearInterval(timerRef.current);

    const submittedAt = Date.now();
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    const subjectBreakdown: Record<string, { correct: number; total: number; percentage: number }> = {};
    mockExam.selectedSubjects.forEach((sub) => {
      subjectBreakdown[sub] = { correct: 0, total: 0, percentage: 0 };
    });

    // Score based on immutable snapshots
    mockExam.questionSnapshots.forEach((q) => {
      const userAns = mockExam.userAnswers[q.id];
      if (!subjectBreakdown[q.subject]) {
        subjectBreakdown[q.subject] = { correct: 0, total: 0, percentage: 0 };
      }
      subjectBreakdown[q.subject].total++;

      if (!userAns) {
        unansweredCount++;
      } else if (userAns === q.correctAnswer) {
        correctCount++;
        subjectBreakdown[q.subject].correct++;
      } else {
        incorrectCount++;
      }
    });

    // Compute subject percentages
    Object.keys(subjectBreakdown).forEach((sub) => {
      const b = subjectBreakdown[sub];
      b.percentage = b.total > 0 ? Math.round((b.correct / b.total) * 100) : 0;
    });

    const totalQuestions = mockExam.questionSnapshots.length;
    const finalScore = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    // Update active mistakes:
    // Missed or unanswered mock questions feed into mistake queue;
    // Correctly answered questions are cleared from mistake queue!
    const updatedMistakes = { ...progress.activeMistakes };
    mockExam.questionSnapshots.forEach((q) => {
      const userAns = mockExam.userAnswers[q.id];
      if (userAns === q.correctAnswer) {
        delete updatedMistakes[q.id];
      } else {
        updatedMistakes[q.id] = {
          questionId: q.id,
          lastMissedAt: submittedAt,
          source: 'mock',
          subject: q.subject,
        };
      }
    });

    const finalizedMock: MockExamState = {
      ...mockExam,
      isSubmitted: true,
      submittedAt,
      score: finalScore,
      correctCount,
      incorrectCount,
      unansweredCount,
      subjectScores: subjectBreakdown,
    };

    setShowSubmitModal(false);
    setMockExam(finalizedMock);

    // Save into history and clear activeMockExam
    onSaveProgress({
      ...progress,
      activeMockExam: finalizedMock, // Keep for review view
      mockHistory: [finalizedMock, ...progress.mockHistory],
      activeMistakes: updatedMistakes,
    });
  };

  const handleSelectOption = (opt: 'A' | 'B' | 'C' | 'D') => {
    if (!mockExam || mockExam.isSubmitted) return;
    const currentQId = mockExam.questionIds[mockExam.currentIndex];
    const updated: MockExamState = {
      ...mockExam,
      userAnswers: {
        ...mockExam.userAnswers,
        [currentQId]: opt,
      },
    };
    saveMockState(updated);
  };

  const handleToggleFlag = (id: string) => {
    if (!mockExam) return;
    const isFlagged = mockExam.flaggedIds.includes(id);
    const updatedFlags = isFlagged
      ? mockExam.flaggedIds.filter((fId) => fId !== id)
      : [...mockExam.flaggedIds, id];
    saveMockState({ ...mockExam, flaggedIds: updatedFlags });
  };

  const handleJumpTo = (index: number) => {
    if (!mockExam) return;
    saveMockState({ ...mockExam, currentIndex: index });
  };

  const handleRetakeNewMock = () => {
    saveMockState(null);
  };

  const handlePracticeMissedQuestions = () => {
    if (!mockExam || !onLaunchPracticeWithIds) return;
    const missedIds = mockExam.questionSnapshots
      .filter((q) => mockExam.userAnswers[q.id] !== q.correctAnswer)
      .map((q) => q.id);

    if (missedIds.length > 0) {
      onLaunchPracticeWithIds(missedIds);
    }
  };

  // Format seconds into MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  // ==========================================
  // VIEW: 1. SETUP / CONFIGURATION SCREEN
  // ==========================================
  if (!mockExam) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Timed Mock Examination
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Simulate CBT conditions with an absolute countdown timer, multi-subject composition, and post-submission scoring.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          {/* Exam Type: Mixed or Subject-Specific */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-900 block">
              1. Choose Examination Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setExamType('mixed')}
                className={`p-4 rounded-xl border text-left transition-all min-h-[56px] ${
                  examType === 'mixed'
                    ? 'bg-teal-50 border-teal-600 text-teal-950 ring-1 ring-teal-600'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="font-bold text-sm">Full Mixed CBT Simulation</div>
                <div className="text-xs text-slate-500 mt-1">
                  Balanced mix across all 4 subjects according to available capacities.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setExamType('subject')}
                className={`p-4 rounded-xl border text-left transition-all min-h-[56px] ${
                  examType === 'subject'
                    ? 'bg-teal-50 border-teal-600 text-teal-950 ring-1 ring-teal-600'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="font-bold text-sm">Single Subject Focused Mock</div>
                <div className="text-xs text-slate-500 mt-1">
                  Target a specific paper (e.g. Space Law & Policy or Financial Regs).
                </div>
              </button>
            </div>
          </div>

          {/* Subject Selection based on mode */}
          {examType === 'subject' ? (
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-900 block">
                2. Select Subject
              </label>
              <select
                value={selectedSingleSubject}
                onChange={(e) => setSelectedSingleSubject(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-teal-500 min-h-[44px]"
              >
                {OFFICIAL_SUBJECTS.map((sub) => {
                  const pool = verifiedQuestions.filter((q) => q.subject === sub).length;
                  return (
                    <option key={sub} value={sub}>
                      {sub} ({pool} Questions Available)
                    </option>
                  );
                })}
              </select>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-900 block">
                2. Included Subjects in Mixed Mock
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {OFFICIAL_SUBJECTS.map((sub) => {
                  const isChecked = selectedMixedSubjects.includes(sub);
                  return (
                    <label
                      key={sub}
                      className={`flex items-center space-x-2.5 p-2.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                        isChecked ? 'bg-slate-50 border-teal-500 text-slate-900' : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked && selectedMixedSubjects.length === 1) return;
                          setSelectedMixedSubjects((prev) =>
                            isChecked ? prev.filter((s) => s !== sub) : [...prev, sub]
                          );
                        }}
                        className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                      />
                      <span>{sub}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Question Count Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-900">
                3. Total Number of Questions
              </label>
              <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200">
                Max Eligible: {totalEligiblePool}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {([10, 20, 50, 100, 'all'] as const).map((count) => {
                const isPossible = count === 'all' ? totalEligiblePool > 0 : totalEligiblePool >= count;
                const isSelected = requestedCount === count;

                return (
                  <button
                    key={String(count)}
                    type="button"
                    disabled={!isPossible}
                    onClick={() => setRequestedCount(count)}
                    className={`py-2 px-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all min-h-[44px] ${
                      !isPossible
                        ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-50'
                        : isSelected
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-50 border border-slate-200 text-slate-800 hover:border-slate-300'
                    }`}
                  >
                    {count === 'all' ? `All (${totalEligiblePool})` : `${count} Qs`}
                  </button>
                );
              })}
            </div>

            {requestedCount !== 'all' && totalEligiblePool < requestedCount && (
              <p className="text-xs text-amber-700 mt-1 flex items-center space-x-1">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Pool limit reached ({totalEligiblePool}). Questions are never duplicated to artificially reach counts.</span>
              </p>
            )}
          </div>

          {/* Timing Configuration */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-900">
                4. Exam Duration (Minutes)
              </label>
              <span className="text-xs font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Practice timing, not official exam timing
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                min="5"
                max="180"
                value={customDurationMinutes}
                onChange={(e) => setCustomDurationMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-28 bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 min-h-[44px]"
              />
              <span className="text-xs text-slate-500">
                Default: 1 minute per question ({previewActualTotal} mins). Configurable for your practice pace.
              </span>
            </div>
          </div>

          {/* Composition Breakdown Preview */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Configured Composition ({previewActualTotal} Questions Total)
              </span>
              <span className="text-xs text-slate-500">
                No official exam weighting claimed
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {Object.entries(previewComposition).map(([sub, count]) => (
                <div key={sub} className="flex items-center justify-between bg-white p-2 rounded-md border border-slate-200">
                  <span className="text-slate-700 font-medium truncate mr-2">{sub}</span>
                  <span className="font-bold text-slate-900">{count} Qs</span>
                </div>
              ))}
            </div>
          </div>

          {/* Launch Button */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 space-y-0.5">
              <p>• Answers and explanations stay hidden until submission.</p>
              <p>• Timer counts down from absolute deadline; switching tabs does not reset time.</p>
            </div>
            <button
              type="button"
              onClick={handleStartExam}
              disabled={previewActualTotal === 0}
              className="w-full sm:w-auto px-8 py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-sm font-bold rounded-xl shadow-xs transition-colors min-h-[48px] flex items-center justify-center space-x-2"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Begin Timed Mock Exam</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: 2. RESULTS & FULL REVIEW SCREEN
  // ==========================================
  if (mockExam.isSubmitted) {
    const totalQ = mockExam.questionSnapshots.length;
    const answeredCount = totalQ - (mockExam.unansweredCount || 0);

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* Results Banner */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
                Official Attempt Logged
              </span>
              <h1 className="text-2xl font-extrabold text-slate-900 mt-2">
                {mockExam.name} Result
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Completed on {mockExam.submittedAt ? new Date(mockExam.submittedAt).toLocaleString() : 'Today'} • Duration: {mockExam.durationMinutes} mins
              </p>
            </div>

            {/* Score Ring / Block */}
            <div className="flex items-center space-x-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="text-right">
                <span className="text-3xl font-extrabold text-slate-900 block leading-none">
                  {mockExam.score}%
                </span>
                <span className="text-xs font-medium text-slate-500 block mt-1">
                  {mockExam.correctCount} of {totalQ} correct
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
              <span className="text-xs font-semibold text-emerald-800 block">Correct</span>
              <span className="text-xl font-bold text-emerald-950 block mt-1">{mockExam.correctCount}</span>
            </div>
            <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-center">
              <span className="text-xs font-semibold text-red-800 block">Incorrect</span>
              <span className="text-xl font-bold text-red-950 block mt-1">{mockExam.incorrectCount}</span>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-center">
              <span className="text-xs font-semibold text-amber-800 block">Unanswered</span>
              <span className="text-xl font-bold text-amber-950 block mt-1">{mockExam.unansweredCount}</span>
            </div>
          </div>

          {/* Subject Breakdown Bars */}
          {mockExam.subjectScores && (
            <div className="space-y-3 pt-2">
              <h2 className="text-sm font-bold text-slate-900">Performance by Subject Paper</h2>
              <div className="space-y-2.5">
                {Object.entries(mockExam.subjectScores).map(([sub, scoreData]) => (
                  <div key={sub} className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span>{sub}</span>
                      <span>
                        {scoreData.correct} / {scoreData.total} ({scoreData.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${scoreData.percentage >= 60 ? 'bg-teal-600' : 'bg-amber-500'}`}
                        style={{ width: `${scoreData.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleRetakeNewMock}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-bold rounded-xl transition-colors min-h-[44px]"
            >
              Configure Another Mock Exam
            </button>

            {onLaunchPracticeWithIds && (mockExam.incorrectCount || 0) + (mockExam.unansweredCount || 0) > 0 && (
              <button
                type="button"
                onClick={handlePracticeMissedQuestions}
                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors min-h-[44px] flex items-center space-x-2"
              >
                <BookOpen className="w-4 h-4" />
                <span>Practice {((mockExam.incorrectCount || 0) + (mockExam.unansweredCount || 0))} Missed Questions</span>
              </button>
            )}
          </div>
        </div>

        {/* Complete Question-by-Question Review List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Detailed Question Review</h2>
            <span className="text-xs text-slate-500">
              Review your answers alongside official citations
            </span>
          </div>

          <div className="space-y-6">
            {mockExam.questionSnapshots.map((q, idx) => {
              const selectedAns = mockExam.userAnswers[q.id];
              return (
                <QuestionCard
                  key={q.id}
                  question={q}
                  selectedAnswer={selectedAns}
                  isChecked={true}
                  isLocked={true}
                  isMockMode={false}
                  isBookmarked={progress.bookmarkedQuestionIds.includes(q.id)}
                  isFlagged={mockExam.flaggedIds.includes(q.id)}
                  questionNumber={idx + 1}
                  totalQuestions={totalQ}
                />
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: 3. ACTIVE TIMED MOCK RUNTIME
  // ==========================================
  const currentQId = mockExam.questionIds[mockExam.currentIndex];
  const currentQuestion = mockExam.questionSnapshots.find((q) => q.id === currentQId);

  if (!currentQuestion) {
    return <div>Question snapshot not found.</div>;
  }

  const selectedAnswer = mockExam.userAnswers[currentQId];
  const isFlagged = mockExam.flaggedIds.includes(currentQId);
  const totalQuestions = mockExam.questionIds.length;
  const answeredCount = Object.keys(mockExam.userAnswers).length;
  const isWarningTime = remainingSeconds <= 300 && remainingSeconds > 0; // Final 5 minutes warning

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Exam Header with Real Countdown */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block">
            {mockExam.name}
          </span>
          <span className="text-sm font-bold text-slate-900 block mt-0.5">
            Question {mockExam.currentIndex + 1} of {totalQuestions}
          </span>
        </div>

        <div className="flex items-center space-x-3">
          {/* Answered Counter */}
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
            {answeredCount}/{totalQuestions} Answered
          </span>

          {/* Absolute Countdown Timer Indicator */}
          <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border font-mono font-bold text-sm ${
            isWarningTime 
              ? 'bg-red-50 border-red-300 text-red-700 animate-pulse ring-1 ring-red-400' 
              : 'bg-slate-900 border-slate-900 text-white'
          }`}>
            <Clock className="w-4 h-4" />
            <span>{formatTime(remainingSeconds)}</span>
          </div>

          {/* Submit Action */}
          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-lg shadow-xs min-h-[40px]"
          >
            Submit Exam
          </button>
        </div>
      </div>

      {/* Warning Alert in final 5 minutes */}
      {isWarningTime && (
        <div className="bg-red-50 border border-red-300 rounded-xl p-3 flex items-center space-x-2 text-xs font-semibold text-red-900">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>Warning: Under 5 minutes remaining! Complete any unanswered questions before the timer expires.</span>
        </div>
      )}

      {/* Main Question Card Component (Strictly Conceals Answers During Mock) */}
      <QuestionCard
        question={currentQuestion}
        selectedAnswer={selectedAnswer}
        onSelectAnswer={handleSelectOption}
        isChecked={false}
        isLocked={false}
        isMockMode={true} // Strictly conceals explanation & correctness
        isBookmarked={progress.bookmarkedQuestionIds.includes(currentQuestion.id)}
        isFlagged={isFlagged}
        onToggleFlag={() => handleToggleFlag(currentQuestion.id)}
        questionNumber={mockExam.currentIndex + 1}
        totalQuestions={totalQuestions}
      />

      {/* Bottom Mock Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
        <button
          type="button"
          onClick={() => mockExam.currentIndex > 0 && handleJumpTo(mockExam.currentIndex - 1)}
          disabled={mockExam.currentIndex === 0}
          className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 disabled:opacity-40 text-xs sm:text-sm font-bold text-slate-700 flex items-center space-x-1 min-h-[44px]"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        <div className="flex items-center space-x-2">
          {mockExam.currentIndex < totalQuestions - 1 ? (
            <button
              type="button"
              onClick={() => handleJumpTo(mockExam.currentIndex + 1)}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs min-h-[44px] flex items-center space-x-1"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs min-h-[44px]"
            >
              Review & Submit
            </button>
          )}
        </div>
      </div>

      {/* Mock Question Navigator Grid */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
          <span>Question Palette</span>
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
              <span>Answered</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Flagged</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
              <span>Unanswered</span>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
          {mockExam.questionIds.map((id, index) => {
            const isCurrent = index === mockExam.currentIndex;
            const hasAnswer = !!mockExam.userAnswers[id];
            const hasFlag = mockExam.flaggedIds.includes(id);

            let badge = 'bg-slate-100 text-slate-700 border-slate-200';
            if (hasFlag) badge = 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
            else if (hasAnswer) badge = 'bg-teal-50 text-teal-800 border-teal-300 font-semibold';

            return (
              <button
                key={id}
                type="button"
                onClick={() => handleJumpTo(index)}
                className={`w-8 h-8 rounded-lg text-xs font-bold border transition-all flex items-center justify-center min-h-[32px] min-w-[32px] ${badge} ${
                  isCurrent ? 'ring-2 ring-slate-900 scale-105' : 'hover:scale-105'
                }`}
                title={`Question ${index + 1}`}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900">Submit Mock Examination?</h2>
              <p className="text-xs text-slate-500">
                Are you sure you want to finalize this attempt? Unanswered questions will receive a score of zero.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block">Questions Answered:</span>
                <span className="text-base font-bold text-teal-700 block mt-0.5">{answeredCount}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Questions Left:</span>
                <span className="text-base font-bold text-amber-700 block mt-0.5">{totalQuestions - answeredCount}</span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 min-h-[44px]"
              >
                Return to Exam
              </button>
              <button
                type="button"
                onClick={() => handleSubmitExam(false)}
                className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-xs min-h-[44px]"
              >
                Confirm & View Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
