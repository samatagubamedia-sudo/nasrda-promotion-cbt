import React, { useState } from 'react';
import { Question } from '../types';
import { 
  getVerifiedQuestions, 
  OFFICIAL_SUBJECTS, 
  getAvailableTopics, 
  shuffleArray 
} from '../services/questionsService';
import { 
  Sparkles, 
  Eye, 
  EyeOff, 
  ChevronLeft, 
  ChevronRight, 
  Shuffle, 
  Bookmark, 
  ExternalLink, 
  FileText,
  Info
} from 'lucide-react';

interface QuickRevisionViewProps {
  bookmarkedIds: string[];
  onToggleBookmark: (id: string) => void;
}

export const QuickRevisionView: React.FC<QuickRevisionViewProps> = ({
  bookmarkedIds,
  onToggleBookmark,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [selectedTopic, setSelectedTopic] = useState<string>('All');
  const [onlyBookmarks, setOnlyBookmarks] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isRevealed, setIsRevealed] = useState<boolean>(false);

  const verified = getVerifiedQuestions();

  // Filter pool
  const filteredList = verified.filter((q) => {
    if (onlyBookmarks && !bookmarkedIds.includes(q.id)) return false;
    if (selectedSubject !== 'All' && q.subject !== selectedSubject) return false;
    if (selectedTopic !== 'All' && q.topic !== selectedTopic) return false;
    return true;
  });

  const availableTopics = getAvailableTopics(
    selectedSubject === 'All' ? [...OFFICIAL_SUBJECTS] : [selectedSubject]
  );

  const currentQuestion: Question | undefined = filteredList[currentIndex];

  const handleNext = () => {
    if (currentIndex < filteredList.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsRevealed(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsRevealed(false);
    }
  };

  const handleShuffle = () => {
    setIsRevealed(false);
    setCurrentIndex(0);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <span className="p-1.5 rounded-lg bg-teal-100 text-teal-800">
            <Sparkles className="w-5 h-5" />
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Quick Revision Flashcards
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Review authentic provisions, rules, and treaties at high speed. Revealing flashcards is untimed and does not alter scored attempt accuracy.
        </p>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Subject Filter */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                setSelectedTopic('All');
                setCurrentIndex(0);
                setIsRevealed(false);
              }}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 min-h-[40px]"
            >
              <option value="All">All Subjects</option>
              {OFFICIAL_SUBJECTS.map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          {/* Topic Filter */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Topic</label>
            <select
              value={selectedTopic}
              onChange={(e) => {
                setSelectedTopic(e.target.value);
                setCurrentIndex(0);
                setIsRevealed(false);
              }}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 min-h-[40px]"
            >
              <option value="All">All Topics</option>
              {availableTopics.map((topic) => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>
          </div>

          {/* Saved Only Filter */}
          <div className="flex items-end">
            <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 p-2.5 rounded-lg border border-slate-300 bg-slate-50 w-full cursor-pointer min-h-[40px]">
              <input
                type="checkbox"
                checked={onlyBookmarks}
                onChange={(e) => {
                  setOnlyBookmarks(e.target.checked);
                  setCurrentIndex(0);
                  setIsRevealed(false);
                }}
                className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
              />
              <span>Bookmarked Only ({bookmarkedIds.length})</span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>{filteredList.length} Flashcards in this filter</span>
          {filteredList.length > 0 && (
            <span className="font-semibold text-slate-800">
              Card {currentIndex + 1} of {filteredList.length}
            </span>
          )}
        </div>
      </div>

      {/* Main Flashcard Card */}
      {currentQuestion ? (
        <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between min-h-[380px]">
          {/* Card Top Meta */}
          <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-900 border border-teal-200">
                {currentQuestion.subject}
              </span>
              {currentQuestion.topic && (
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {currentQuestion.topic}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => onToggleBookmark(currentQuestion.id)}
              className={`p-2 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1 min-h-[40px] min-w-[40px] justify-center ${
                bookmarkedIds.includes(currentQuestion.id)
                  ? 'bg-teal-100 text-teal-900 border border-teal-300'
                  : 'text-slate-500 hover:bg-slate-200'
              }`}
              title="Bookmark card"
            >
              <Bookmark className={`w-4 h-4 ${bookmarkedIds.includes(currentQuestion.id) ? 'fill-teal-600 text-teal-700' : ''}`} />
            </button>
          </div>

          {/* Card Question Prompt */}
          <div className="p-6 sm:p-8 space-y-6 flex-1 flex flex-col justify-center">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-relaxed">
              {currentQuestion.question}
            </h2>

            {/* Revealed Answer Panel */}
            {isRevealed ? (
              <div className="mt-4 p-5 bg-teal-50/60 rounded-xl border border-teal-300 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center space-x-2 text-teal-950 font-bold text-sm">
                  <span className="w-6 h-6 rounded-md bg-teal-700 text-white flex items-center justify-center text-xs">
                    {currentQuestion.correctAnswer}
                  </span>
                  <span>Correct Answer: {currentQuestion.options[currentQuestion.correctAnswer]}</span>
                </div>

                <p className="text-sm text-slate-800 leading-relaxed font-normal">
                  {currentQuestion.explanation}
                </p>

                <div className="pt-2 border-t border-teal-200/80 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
                  <span>
                    Authority: <strong className="text-slate-900">{currentQuestion.sourceDocument}</strong> ({currentQuestion.sourceReference})
                  </span>
                  {currentQuestion.sourceURL && (
                    <a
                      href={currentQuestion.sourceURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-800 hover:text-teal-950 underline font-semibold inline-flex items-center"
                    >
                      <span>Official Link</span>
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <button
                  type="button"
                  onClick={() => setIsRevealed(true)}
                  className="px-6 py-3 bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold rounded-xl shadow-xs transition-colors inline-flex items-center space-x-2 min-h-[46px]"
                >
                  <Eye className="w-4 h-4" />
                  <span>Reveal Answer & Explanation</span>
                </button>
              </div>
            )}
          </div>

          {/* Flashcard Nav Footer */}
          <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 flex items-center space-x-1 min-h-[40px]"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <button
              type="button"
              onClick={() => setIsRevealed(!isRevealed)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              {isRevealed ? 'Hide Answer' : 'Peek Answer'}
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={currentIndex === filteredList.length - 1}
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 flex items-center space-x-1 min-h-[40px]"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          No flashcards match the selected filter. Try selecting "All Subjects" or deselecting "Bookmarked Only".
        </div>
      )}
    </div>
  );
};
