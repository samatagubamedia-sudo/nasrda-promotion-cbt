import React, { useState } from 'react';
import { LearnerProgress } from '../types';
import { getQuestionMap, OFFICIAL_SUBJECTS } from '../services/questionsService';
import { QuestionCard } from './QuestionCard';
import { 
  AlertTriangle, 
  CheckCircle2, 
  BookOpen, 
  Filter, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface ReviewMistakesViewProps {
  progress: LearnerProgress;
  onLaunchPracticeWithIds: (ids: string[]) => void;
  onSaveProgress: (updated: LearnerProgress) => void;
}

export const ReviewMistakesView: React.FC<ReviewMistakesViewProps> = ({
  progress,
  onLaunchPracticeWithIds,
  onSaveProgress,
}) => {
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('All');
  const questionMap = getQuestionMap();

  // Gather active mistake items
  const mistakeKeys = Object.keys(progress.activeMistakes || {});
  const mistakeItems = mistakeKeys
    .map((id) => {
      const q = questionMap.get(id);
      const meta = progress.activeMistakes[id];
      return q ? { question: q, meta } : null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => b.meta.lastMissedAt - a.meta.lastMissedAt);

  // Filter by subject
  const filteredMistakes = selectedSubjectFilter === 'All'
    ? mistakeItems
    : mistakeItems.filter((item) => item.question.subject === selectedSubjectFilter);

  const handleRetryAll = () => {
    const idsToRetry = filteredMistakes.map((m) => m.question.id);
    if (idsToRetry.length > 0) {
      onLaunchPracticeWithIds(idsToRetry);
    }
  };

  const handleToggleBookmark = (id: string) => {
    const isBookmarked = progress.bookmarkedQuestionIds.includes(id);
    const updated = isBookmarked
      ? progress.bookmarkedQuestionIds.filter((bId) => bId !== id)
      : [...progress.bookmarkedQuestionIds, id];
    onSaveProgress({ ...progress, bookmarkedQuestionIds: updated });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
              <AlertTriangle className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Review Active Mistakes
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Questions answered incorrectly in practice or missed in mocks. Answering correctly during a future session removes them from this queue.
          </p>
        </div>

        {filteredMistakes.length > 0 && (
          <button
            type="button"
            onClick={handleRetryAll}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2 min-h-[44px]"
          >
            <BookOpen className="w-4 h-4" />
            <span>Practice These {filteredMistakes.length} Mistakes</span>
          </button>
        )}
      </div>

      {/* Filter by Subject Toolbar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-wrap items-center gap-2 text-xs">
        <span className="font-bold text-slate-500 flex items-center space-x-1 pl-1">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter:</span>
        </span>
        <button
          type="button"
          onClick={() => setSelectedSubjectFilter('All')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
            selectedSubjectFilter === 'All'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          All Subjects ({mistakeItems.length})
        </button>
        {OFFICIAL_SUBJECTS.map((sub) => {
          const subCount = mistakeItems.filter((m) => m.question.subject === sub).length;
          return (
            <button
              key={sub}
              type="button"
              onClick={() => setSelectedSubjectFilter(sub)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                selectedSubjectFilter === sub
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {sub} ({subCount})
            </button>
          );
        })}
      </div>

      {/* Mistakes List or Empty State */}
      {filteredMistakes.length > 0 ? (
        <div className="space-y-6">
          {filteredMistakes.map(({ question, meta }, index) => (
            <div key={question.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>
                  Missed during <strong className="text-slate-800">{meta.source}</strong> on{' '}
                  {new Date(meta.lastMissedAt).toLocaleDateString()}
                </span>
                <span className="text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Needs Mastery
                </span>
              </div>
              <QuestionCard
                question={question}
                isChecked={true} // Display with official answer and explanation revealed for review
                isLocked={true}
                isMockMode={false}
                isBookmarked={progress.bookmarkedQuestionIds.includes(question.id)}
                onToggleBookmark={() => handleToggleBookmark(question.id)}
                questionNumber={index + 1}
                totalQuestions={filteredMistakes.length}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h2 className="text-lg font-bold text-slate-900">
              {mistakeItems.length === 0 ? 'No Active Mistakes!' : 'No Mistakes in this Subject'}
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              {mistakeItems.length === 0
                ? 'Great job! You have no unresolved mistake records. When you practice or take a mock exam, any missed questions will appear here for targeted revision.'
                : 'You have cleared all missed questions for this subject. Select another filter or take a mock exam.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
