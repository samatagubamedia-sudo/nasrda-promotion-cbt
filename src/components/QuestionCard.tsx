import React, { useState } from 'react';
import { Question } from '../types';
import { 
  CheckCircle2, 
  XCircle, 
  Bookmark, 
  Flag, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  FileText,
  Info
} from 'lucide-react';

interface QuestionCardProps {
  question: Question;
  selectedAnswer?: 'A' | 'B' | 'C' | 'D';
  onSelectAnswer?: (option: 'A' | 'B' | 'C' | 'D') => void;
  isChecked?: boolean; // In practice mode: whether Check Answer was pressed
  isLocked?: boolean; // Cannot change answer
  isMockMode?: boolean; // During mock: correctness and explanations are strictly hidden
  isBookmarked?: boolean;
  isFlagged?: boolean;
  onToggleBookmark?: () => void;
  onToggleFlag?: () => void;
  questionNumber?: number;
  totalQuestions?: number;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  selectedAnswer,
  onSelectAnswer,
  isChecked = false,
  isLocked = false,
  isMockMode = false,
  isBookmarked = false,
  isFlagged = false,
  onToggleBookmark,
  onToggleFlag,
  questionNumber,
  totalQuestions,
}) => {
  const [showSourceDetails, setShowSourceDetails] = useState(false);

  const options: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
  const showResults = isChecked && !isMockMode;

  const difficultyColors = {
    Easy: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    Medium: 'bg-blue-50 text-blue-800 border-blue-200',
    Hard: 'bg-purple-50 text-purple-800 border-purple-200',
  };

  return (
    <article className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-all">
      {/* Question Header & Meta Bar */}
      <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
          {questionNumber !== undefined && (
            <span className="text-sm font-bold text-slate-900 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
              Question {questionNumber} {totalQuestions ? `of ${totalQuestions}` : ''}
            </span>
          )}
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-teal-50 text-teal-900 border border-teal-200">
            {question.subject}
          </span>
          {question.topic && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
              {question.topic}
            </span>
          )}
          <span className={`text-xs font-medium px-2 py-0.5 rounded-md border ${difficultyColors[question.difficulty] || ''}`}>
            {question.difficulty}
          </span>
        </div>

        {/* Action Controls: Flag & Bookmark */}
        <div className="flex items-center space-x-1">
          {onToggleFlag && (
            <button
              type="button"
              onClick={onToggleFlag}
              className={`p-2 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1 min-h-[44px] min-w-[44px] justify-center ${
                isFlagged 
                  ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
              title={isFlagged ? 'Flagged for review' : 'Flag question'}
              aria-label={isFlagged ? 'Unflag question' : 'Flag question for review'}
            >
              <Flag className={`w-4 h-4 ${isFlagged ? 'fill-amber-600 text-amber-700' : ''}`} />
              <span className="hidden sm:inline">{isFlagged ? 'Flagged' : 'Flag'}</span>
            </button>
          )}

          {onToggleBookmark && (
            <button
              type="button"
              onClick={onToggleBookmark}
              className={`p-2 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1 min-h-[44px] min-w-[44px] justify-center ${
                isBookmarked 
                  ? 'bg-teal-100 text-teal-900 border border-teal-300' 
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
              title={isBookmarked ? 'Bookmarked' : 'Bookmark question'}
              aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark question'}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-teal-600 text-teal-700' : ''}`} />
              <span className="hidden sm:inline">{isBookmarked ? 'Saved' : 'Save'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Question Body */}
      <div className="p-4 sm:p-6 space-y-5">
        <h2 className="text-base sm:text-lg font-semibold text-slate-900 leading-relaxed">
          {question.question}
        </h2>

        {/* Options List */}
        <div className="space-y-3" role="radiogroup" aria-label="Answer options">
          {options.map((key) => {
            const isSelected = selectedAnswer === key;
            const isCorrectOption = question.correctAnswer === key;

            let buttonStyles = 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800';
            let badgeStyles = 'bg-slate-100 text-slate-700 border-slate-300';
            let statusIcon = null;
            let statusLabel = null;

            if (showResults) {
              if (isCorrectOption) {
                // Correct option
                buttonStyles = 'bg-emerald-50 border-emerald-400 text-emerald-950 font-medium ring-1 ring-emerald-400';
                badgeStyles = 'bg-emerald-600 text-white border-emerald-600';
                statusIcon = <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0" />;
                statusLabel = <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-sm">Correct Answer</span>;
              } else if (isSelected && !isCorrectOption) {
                // User picked wrong option
                buttonStyles = 'bg-red-50 border-red-300 text-red-950 ring-1 ring-red-300';
                badgeStyles = 'bg-red-600 text-white border-red-600';
                statusIcon = <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />;
                statusLabel = <span className="text-xs font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-sm">Your Choice</span>;
              } else {
                // Neutral unselected incorrect option
                buttonStyles = 'bg-slate-50/60 border-slate-200 text-slate-600 opacity-75';
              }
            } else if (isSelected) {
              // Pre-check selected state
              buttonStyles = 'bg-teal-50 border-teal-600 text-teal-950 font-medium ring-2 ring-teal-500/20';
              badgeStyles = 'bg-teal-700 text-white border-teal-700';
            }

            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  if (!isLocked && onSelectAnswer) {
                    onSelectAnswer(key);
                  }
                }}
                disabled={isLocked}
                className={`w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all flex items-start space-x-3.5 min-h-[48px] focus:outline-hidden focus:ring-2 focus:ring-teal-500 ${buttonStyles} ${
                  isLocked ? 'cursor-default' : 'cursor-pointer'
                }`}
                role="radio"
                aria-checked={isSelected}
              >
                {/* Option Letter Badge (A, B, C, D) */}
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold border flex-shrink-0 mt-0.5 ${badgeStyles}`}>
                  {key}
                </span>

                {/* Option Text */}
                <div className="flex-1 text-sm sm:text-base leading-snug pt-0.5">
                  <span>{question.options[key]}</span>
                </div>

                {/* Status Indicator Icon & Tag */}
                <div className="flex items-center space-x-1.5 flex-shrink-0">
                  {statusLabel}
                  {statusIcon}
                </div>
              </button>
            );
          })}
        </div>

        {/* Checked/Review State: Explanation and Source Details */}
        {showResults && (
          <div className="mt-6 pt-5 border-t border-slate-200 space-y-4 animate-in fade-in duration-200">
            {/* Outcome Banner */}
            <div className={`p-3.5 rounded-lg border flex items-center space-x-3 ${
              selectedAnswer === question.correctAnswer
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-amber-50 border-amber-300 text-amber-900'
            }`}>
              {selectedAnswer === question.correctAnswer ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0" />
              ) : (
                <Info className="w-5 h-5 text-amber-700 flex-shrink-0" />
              )}
              <div className="text-sm">
                <span className="font-bold">
                  {selectedAnswer === question.correctAnswer
                    ? 'Correct! '
                    : selectedAnswer 
                      ? `Incorrect. The correct answer is Option ${question.correctAnswer}. `
                      : `Unanswered. The correct answer is Option ${question.correctAnswer}. `}
                </span>
              </div>
            </div>

            {/* Explanation Card */}
            <div className="bg-slate-50 rounded-xl p-4 sm:p-5 border border-slate-200 space-y-3">
              <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
                <FileText className="w-4 h-4 text-teal-700" />
                <span>Authoritative Explanation</span>
              </div>
              <p className="text-sm text-slate-800 leading-relaxed font-normal">
                {question.explanation}
              </p>

              {/* Source Document Reference Accordion */}
              <div className="pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowSourceDetails(!showSourceDetails)}
                  className="w-full flex items-center justify-between text-xs font-semibold text-teal-800 hover:text-teal-950 py-1 min-h-[36px]"
                  aria-expanded={showSourceDetails}
                >
                  <span className="flex items-center space-x-1.5">
                    <span>Cited Authority: {question.sourceDocument} ({question.sourceReference})</span>
                  </span>
                  {showSourceDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showSourceDetails && (
                  <div className="mt-2.5 p-3 bg-white rounded-lg border border-slate-200 text-xs space-y-2 text-slate-700">
                    <div>
                      <span className="font-semibold text-slate-900">Source Document: </span>
                      {question.sourceDocument}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900">Official Reference: </span>
                      <code className="bg-slate-100 px-1.5 py-0.5 rounded-sm font-mono text-slate-900">{question.sourceReference}</code>
                    </div>
                    {question.verificationNote && (
                      <div>
                        <span className="font-semibold text-slate-900">Verification Note: </span>
                        <span className="text-slate-600">{question.verificationNote}</span>
                      </div>
                    )}
                    {question.sourceURL && (
                      <div className="pt-1">
                        <a
                          href={question.sourceURL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 text-teal-700 hover:text-teal-900 underline font-medium"
                        >
                          <span>Open cited official document / treaty text</span>
                          <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </article>
  );
};
