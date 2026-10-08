import React, { useState, useEffect } from 'react';
import { Question, Difficulty, PracticeSessionState, LearnerProgress } from '../types';
import { 
  OFFICIAL_SUBJECTS, 
  filterQuestions, 
  getAvailableTopics, 
  shuffleArray, 
  getQuestionMap 
} from '../services/questionsService';
import { QuestionCard } from './QuestionCard';
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  Flag, 
  Bookmark, 
  Filter, 
  ArrowLeft,
  Sparkles,
  Layers,
  AlertCircle
} from 'lucide-react';

interface PracticeViewProps {
  progress: LearnerProgress;
  onSaveProgress: (updated: LearnerProgress) => void;
  initialSubject?: string;
  onClearInitialSubject?: () => void;
}

export const PracticeView: React.FC<PracticeViewProps> = ({
  progress,
  onSaveProgress,
  initialSubject,
  onClearInitialSubject,
}) => {
  // Session configuration state
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    initialSubject ? [initialSubject] : [...OFFICIAL_SUBJECTS]
  );
  const [selectedTopic, setSelectedTopic] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | 'All'>('All');
  const [requestedCount, setRequestedCount] = useState<number | 'all'>(20);

  // Active session state (synced with progress.activePracticeSession)
  const [session, setSession] = useState<PracticeSessionState | null>(
    progress.activePracticeSession || null
  );

  // If initialSubject is passed, set it
  useEffect(() => {
    if (initialSubject && !session) {
      setSelectedSubjects([initialSubject]);
      if (onClearInitialSubject) onClearInitialSubject();
    }
  }, [initialSubject]);

  // Keep progress in sync when session changes
  const saveSessionState = (updatedSession: PracticeSessionState | null) => {
    setSession(updatedSession);
    onSaveProgress({
      ...progress,
      activePracticeSession: updatedSession,
    });
  };

  // Filter pool calculations for config screen
  const availablePool = filterQuestions({
    subjects: selectedSubjects,
    topic: selectedTopic === 'All' ? undefined : selectedTopic,
    difficulty: selectedDifficulty === 'All' ? undefined : selectedDifficulty,
  });

  const availableCount = availablePool.length;
  const availableTopics = getAvailableTopics(selectedSubjects);

  // Toggle subject
  const toggleSubject = (sub: string) => {
    setSelectedSubjects((prev) => {
      if (prev.includes(sub)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter((s) => s !== sub);
      } else {
        return [...prev, sub];
      }
    });
    setSelectedTopic('All');
  };

  // Start new practice session
  const handleStartPractice = () => {
    if (availableCount === 0) return;

    const countToPick = requestedCount === 'all' ? availableCount : Math.min(requestedCount, availableCount);
    const shuffled = shuffleArray(availablePool).slice(0, countToPick);
    const questionIds = shuffled.map((q) => q.id);

    const newSession: PracticeSessionState = {
      id: `practice_${Date.now()}`,
      selectedSubjects,
      selectedTopic: selectedTopic === 'All' ? undefined : selectedTopic,
      selectedDifficulty: selectedDifficulty === 'All' ? undefined : selectedDifficulty,
      questionIds,
      currentIndex: 0,
      userAnswers: {},
      checkedQuestions: {},
      bookmarkedIds: [...progress.bookmarkedQuestionIds],
      flaggedIds: [],
      isCompleted: false,
      createdAt: Date.now(),
    };

    saveSessionState(newSession);
  };

  // Question navigation and actions within active session
  const currentQuestionId = session ? session.questionIds[session.currentIndex] : null;
  const questionMap = getQuestionMap();
  const currentQuestion = currentQuestionId ? questionMap.get(currentQuestionId) : null;

  const handleSelectOption = (opt: 'A' | 'B' | 'C' | 'D') => {
    if (!session || !currentQuestionId) return;
    if (session.checkedQuestions[currentQuestionId]) return; // Locked once checked

    const updatedSession: PracticeSessionState = {
      ...session,
      userAnswers: {
        ...session.userAnswers,
        [currentQuestionId]: opt,
      },
    };
    saveSessionState(updatedSession);
  };

  const handleCheckAnswer = () => {
    if (!session || !currentQuestionId || !currentQuestion) return;
    const selectedAnswer = session.userAnswers[currentQuestionId];
    if (!selectedAnswer) return; // Must pick an answer to check
    if (session.checkedQuestions[currentQuestionId]) return; // Already checked

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

    // Check if this question was already attempted in past history to record score
    const newAttempt = {
      questionId: currentQuestion.id,
      subject: currentQuestion.subject,
      selectedAnswer,
      isCorrect,
      timestamp: Date.now(),
    };

    // Update active mistakes:
    // If correct, remove from active mistakes
    // If incorrect, add or update active mistakes
    const updatedMistakes = { ...progress.activeMistakes };
    if (isCorrect) {
      delete updatedMistakes[currentQuestion.id];
    } else {
      updatedMistakes[currentQuestion.id] = {
        questionId: currentQuestion.id,
        lastMissedAt: Date.now(),
        source: 'practice',
        subject: currentQuestion.subject,
      };
    }

    const updatedSession: PracticeSessionState = {
      ...session,
      checkedQuestions: {
        ...session.checkedQuestions,
        [currentQuestionId]: true,
      },
    };

    setSession(updatedSession);

    onSaveProgress({
      ...progress,
      practiceAttempts: [...progress.practiceAttempts, newAttempt],
      activeMistakes: updatedMistakes,
      activePracticeSession: updatedSession,
    });
  };

  const handleToggleBookmark = (id: string) => {
    const isBookmarked = progress.bookmarkedQuestionIds.includes(id);
    const updatedBookmarks = isBookmarked
      ? progress.bookmarkedQuestionIds.filter((bId) => bId !== id)
      : [...progress.bookmarkedQuestionIds, id];

    onSaveProgress({
      ...progress,
      bookmarkedQuestionIds: updatedBookmarks,
    });
  };

  const handleToggleFlag = (id: string) => {
    if (!session) return;
    const isFlagged = session.flaggedIds.includes(id);
    const updatedFlags = isFlagged
      ? session.flaggedIds.filter((fId) => fId !== id)
      : [...session.flaggedIds, id];

    const updatedSession = { ...session, flaggedIds: updatedFlags };
    saveSessionState(updatedSession);
  };

  const handleNext = () => {
    if (!session) return;
    if (session.currentIndex < session.questionIds.length - 1) {
      saveSessionState({ ...session, currentIndex: session.currentIndex + 1 });
    }
  };

  const handlePrev = () => {
    if (!session) return;
    if (session.currentIndex > 0) {
      saveSessionState({ ...session, currentIndex: session.currentIndex - 1 });
    }
  };

  const handleJumpTo = (index: number) => {
    if (!session) return;
    saveSessionState({ ...session, currentIndex: index });
  };

  const handleCompleteSession = () => {
    if (!session) return;
    const updatedSession: PracticeSessionState = {
      ...session,
      isCompleted: true,
      completedAt: Date.now(),
    };
    saveSessionState(updatedSession);
  };

  const handleExitSession = () => {
    saveSessionState(null);
  };

  // ==========================================
  // VIEW: 1. CONFIGURATION SCREEN
  // ==========================================
  if (!session) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Untimed Practice Mode
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Study questions at your own pace with instant answer keys, authoritative explanations, and cited laws.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          {/* Subjects Selection */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-900 block">
              1. Select Subject(s)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {OFFICIAL_SUBJECTS.map((sub) => {
                const isSelected = selectedSubjects.includes(sub);
                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => toggleSubject(sub)}
                    className={`p-3.5 rounded-xl border text-left text-sm font-semibold transition-all flex items-center justify-between min-h-[48px] ${
                      isSelected
                        ? 'bg-teal-50 border-teal-600 text-teal-950 ring-1 ring-teal-600'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span>{sub}</span>
                    <span className={`w-5 h-5 rounded-md flex items-center justify-center text-xs ${
                      isSelected ? 'bg-teal-700 text-white' : 'border border-slate-300'
                    }`}>
                      {isSelected ? '✓' : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Topic Filter */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-900 block">
              2. Filter by Topic (Optional)
            </label>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-teal-500 min-h-[44px]"
            >
              <option value="All">All Topics ({availableTopics.length} available)</option>
              {availableTopics.map((topic) => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>
          </div>

          {/* Difficulty Filter */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-900 block">
              3. Difficulty Level
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['All', 'Easy', 'Medium', 'Hard'] as const).map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`py-2 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all min-h-[44px] ${
                    selectedDifficulty === diff
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Question Count Selection: Disables counts above available pool */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-900">
                4. Number of Questions
              </label>
              <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                {availableCount} Available in Selected Pool
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {([10, 20, 50, 'all'] as const).map((count) => {
                const isPossible = count === 'all' ? availableCount > 0 : availableCount >= count;
                const isSelected = requestedCount === count;

                return (
                  <button
                    key={String(count)}
                    type="button"
                    disabled={!isPossible}
                    onClick={() => setRequestedCount(count)}
                    className={`py-2 px-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all min-h-[44px] ${
                      !isPossible
                        ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                        : isSelected
                          ? 'bg-teal-700 text-white shadow-xs'
                          : 'bg-slate-50 border border-slate-200 text-slate-800 hover:border-slate-300'
                    }`}
                  >
                    {count === 'all' ? `All (${availableCount})` : `${count} Qs`}
                  </button>
                );
              })}
            </div>

            {requestedCount !== 'all' && availableCount < requestedCount && (
              <p className="text-xs text-amber-700 mt-1 flex items-center space-x-1">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Requested size exceeds available questions ({availableCount}). Select a lower count or expand filters.</span>
              </p>
            )}
          </div>

          {/* Launch Action */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-500">
              Questions will be randomized without duplicates. Your selected answer is locked once checked.
            </span>
            <button
              type="button"
              onClick={handleStartPractice}
              disabled={availableCount === 0}
              className="w-full sm:w-auto px-8 py-3 bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 text-white text-sm font-bold rounded-xl shadow-xs transition-colors min-h-[48px] flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Start Practice Session</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: 2. COMPLETION SUMMARY SCREEN
  // ==========================================
  if (session.isCompleted) {
    const totalInSession = session.questionIds.length;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    session.questionIds.forEach((id) => {
      const q = questionMap.get(id);
      const userAns = session.userAnswers[id];
      if (!userAns) {
        unansweredCount++;
      } else if (q && userAns === q.correctAnswer) {
        correctCount++;
      } else {
        incorrectCount++;
      }
    });

    const answeredCount = correctCount + incorrectCount;
    const answeredAccuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
    const overallScore = Math.round((correctCount / totalInSession) * 100);

    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 text-center">
          <div className="w-16 h-16 bg-teal-50 text-teal-700 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-slate-900">
              Practice Session Completed!
            </h1>
            <p className="text-sm text-slate-600">
              Here is your performance breakdown for this practice set.
            </p>
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-medium block">Total Questions</span>
              <span className="text-xl font-bold text-slate-900 block mt-1">{totalInSession}</span>
            </div>
            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950">
              <span className="text-xs text-emerald-700 font-medium block">Correct</span>
              <span className="text-xl font-bold block mt-1">{correctCount}</span>
            </div>
            <div className="p-3.5 bg-red-50 rounded-xl border border-red-200 text-red-950">
              <span className="text-xs text-red-700 font-medium block">Incorrect</span>
              <span className="text-xl font-bold block mt-1">{incorrectCount}</span>
            </div>
            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-950">
              <span className="text-xs text-amber-700 font-medium block">Unanswered</span>
              <span className="text-xl font-bold block mt-1">{unansweredCount}</span>
            </div>
          </div>

          {/* Accuracy Highlight */}
          <div className="p-4 bg-teal-50/70 rounded-xl border border-teal-200 text-left flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-teal-800 uppercase tracking-wider block">Answered Accuracy</span>
              <span className="text-sm text-slate-600">
                {correctCount} correct out of {answeredCount} answered
              </span>
            </div>
            <span className="text-2xl font-extrabold text-teal-900">
              {answeredAccuracy}%
            </span>
          </div>

          {/* Action Controls */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                // Keep session open for review, set to first question
                saveSessionState({ ...session, isCompleted: false, currentIndex: 0 });
              }}
              className="w-full sm:w-auto px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-bold rounded-xl transition-colors min-h-[44px]"
            >
              Review All Questions
            </button>
            <button
              type="button"
              onClick={handleExitSession}
              className="w-full sm:w-auto px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold rounded-xl transition-colors min-h-[44px]"
            >
              Start New Practice Set
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: 3. ACTIVE PRACTICE SESSION
  // ==========================================
  if (!currentQuestion) {
    return (
      <div className="p-6 text-center text-slate-600">
        Question record not found. <button onClick={handleExitSession} className="text-teal-700 underline">Exit session</button>
      </div>
    );
  }

  const selectedAnswer = session.userAnswers[currentQuestion.id];
  const isChecked = !!session.checkedQuestions[currentQuestion.id];
  const isBookmarked = progress.bookmarkedQuestionIds.includes(currentQuestion.id);
  const isFlagged = session.flaggedIds.includes(currentQuestion.id);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Session Progress Bar & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={handleExitSession}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 min-h-[40px] min-w-[40px] flex items-center justify-center"
            title="Exit Practice"
            aria-label="Exit Practice"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block">
              Practice Session
            </span>
            <span className="text-sm font-bold text-slate-900 block">
              Question {session.currentIndex + 1} of {session.questionIds.length}
            </span>
          </div>
        </div>

        {/* Mini progress tracker */}
        <div className="flex items-center space-x-2">
          <div className="w-32 sm:w-48 bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
            <div 
              className="bg-teal-600 h-full transition-all duration-300"
              style={{ width: `${((session.currentIndex + 1) / session.questionIds.length) * 100}%` }}
            />
          </div>
          <span className="text-xs font-bold text-slate-700 min-w-[36px] text-right">
            {Math.round(((session.currentIndex + 1) / session.questionIds.length) * 100)}%
          </span>
        </div>
      </div>

      {/* Main Question Card Component */}
      <QuestionCard
        question={currentQuestion}
        selectedAnswer={selectedAnswer}
        onSelectAnswer={handleSelectOption}
        isChecked={isChecked}
        isLocked={isChecked}
        isMockMode={false}
        isBookmarked={isBookmarked}
        isFlagged={isFlagged}
        onToggleBookmark={() => handleToggleBookmark(currentQuestion.id)}
        onToggleFlag={() => handleToggleFlag(currentQuestion.id)}
        questionNumber={session.currentIndex + 1}
        totalQuestions={session.questionIds.length}
      />

      {/* Bottom Practice Controls: Check Answer & Next */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handlePrev}
            disabled={session.currentIndex === 0}
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs sm:text-sm font-bold text-slate-700 flex items-center space-x-1 min-h-[44px]"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={session.currentIndex === session.questionIds.length - 1}
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs sm:text-sm font-bold text-slate-700 flex items-center space-x-1 min-h-[44px]"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {!isChecked ? (
            <button
              type="button"
              onClick={handleCheckAnswer}
              disabled={!selectedAnswer}
              className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors min-h-[44px] flex items-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Check Answer</span>
            </button>
          ) : (
            session.currentIndex < session.questionIds.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors min-h-[44px] flex items-center space-x-2"
              >
                <span>Next Question</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCompleteSession}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors min-h-[44px] flex items-center space-x-2"
              >
                <span>Finish Session</span>
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
              </button>
            )
          )}
        </div>
      </div>

      {/* Quick Question Jump Navigator */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
          <span>Question Grid</span>
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Correct</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span>Incorrect</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              <span>Unchecked</span>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
          {session.questionIds.map((id, index) => {
            const isCurrent = index === session.currentIndex;
            const q = questionMap.get(id);
            const userAns = session.userAnswers[id];
            const hasChecked = !!session.checkedQuestions[id];
            const isRight = hasChecked && q && userAns === q.correctAnswer;
            const isWrong = hasChecked && q && userAns !== q.correctAnswer;

            let badge = 'bg-slate-100 text-slate-700 border-slate-200';
            if (isRight) badge = 'bg-emerald-50 text-emerald-800 border-emerald-400 font-bold';
            else if (isWrong) badge = 'bg-red-50 text-red-800 border-red-300 font-bold';
            else if (userAns) badge = 'bg-teal-50 text-teal-800 border-teal-300';

            return (
              <button
                key={id}
                type="button"
                onClick={() => handleJumpTo(index)}
                className={`w-8 h-8 rounded-lg text-xs font-bold border transition-all flex items-center justify-center min-h-[32px] min-w-[32px] ${badge} ${
                  isCurrent ? 'ring-2 ring-slate-900 scale-105' : 'hover:scale-105'
                }`}
                title={`Jump to Question ${index + 1}`}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
