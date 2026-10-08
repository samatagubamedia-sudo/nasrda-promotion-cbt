import React, { useState } from 'react';
import { LearnerProgress, MockExamState } from '../types';
import { OFFICIAL_SUBJECTS } from '../services/questionsService';
import { 
  exportProgressBackup, 
  validateBackupJson, 
  importProgressBackup, 
  resetProgress,
  restorePreImportBackup,
  hasPreImportBackup
} from '../services/storage';
import { 
  BarChart3, 
  Download, 
  Upload, 
  RotateCcw, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  FileText,
  ShieldAlert,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ProgressViewProps {
  progress: LearnerProgress;
  onRefreshProgress: () => void;
  onViewMockDetails?: (mock: MockExamState) => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  progress,
  onRefreshProgress,
  onViewMockDetails,
}) => {
  const [showResetModal, setShowResetModal] = useState(false);
  const [importStatus, setImportStatus] = useState<{ message: string; error?: boolean } | null>(null);
  const [selectedMockForModal, setSelectedMockForModal] = useState<MockExamState | null>(null);

  // Compute Practice Statistics
  const totalPracticeAttempts = progress.practiceAttempts.length;
  const correctPracticeAttempts = progress.practiceAttempts.filter(a => a.isCorrect).length;
  const practiceAccuracy = totalPracticeAttempts > 0 
    ? Math.round((correctPracticeAttempts / totalPracticeAttempts) * 100) 
    : null;

  // Compute Mock Exam Statistics
  const totalMocks = progress.mockHistory.length;
  const avgMockScore = totalMocks > 0
    ? Math.round(progress.mockHistory.reduce((acc, m) => acc + (m.score || 0), 0) / totalMocks)
    : null;

  const highestMockScore = totalMocks > 0
    ? Math.max(...progress.mockHistory.map(m => m.score || 0))
    : null;

  // Active Mistakes
  const activeMistakesCount = Object.keys(progress.activeMistakes || {}).length;

  // Export JSON backup
  const handleExportBackup = () => {
    const jsonStr = exportProgressBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nasrda_cbt_progress_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Import JSON backup
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const val = validateBackupJson(content);
      if (!val.valid || !val.data) {
        setImportStatus({ message: val.error || 'Invalid backup file structure.', error: true });
        return;
      }

      if (window.confirm('Importing will replace current local scores with the backup file. A recoverable copy of current scores will be kept. Proceed?')) {
        const success = importProgressBackup(val.data);
        if (success) {
          setImportStatus({ message: 'Backup restored successfully!', error: false });
          onRefreshProgress();
        } else {
          setImportStatus({ message: 'Failed to write backup to localStorage.', error: true });
        }
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  // Reset Progress Confirmation
  const handleConfirmReset = () => {
    resetProgress();
    setShowResetModal(false);
    onRefreshProgress();
  };

  // Restore Pre-Import Backup
  const handleRestorePreImport = () => {
    if (restorePreImportBackup()) {
      setImportStatus({ message: 'Previous snapshot restored!', error: false });
      onRefreshProgress();
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <span className="p-1.5 rounded-lg bg-teal-100 text-teal-800">
            <BarChart3 className="w-5 h-5" />
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Learner Progress & History
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Separate tracking for untimed practice questions vs timed mock exams. Progress belongs exclusively to this browser.
        </p>
      </div>

      {/* Top Cards: Clear Denominators! */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Practice Performance */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wide">
            <span>Untimed Practice</span>
            <FileText className="w-4 h-4 text-teal-600" />
          </div>
          {practiceAccuracy !== null ? (
            <div>
              <span className="text-3xl font-extrabold text-teal-700 block">{practiceAccuracy}%</span>
              <span className="text-xs text-slate-600 font-medium block mt-1">
                {correctPracticeAttempts} correct of {totalPracticeAttempts} answered
              </span>
            </div>
          ) : (
            <div>
              <span className="text-lg font-bold text-slate-400 block">No activity yet</span>
              <span className="text-xs text-slate-500 block mt-1">Practice questions to record accuracy</span>
            </div>
          )}
        </div>

        {/* Timed Mock Performance */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wide">
            <span>Timed Mock Exams</span>
            <Clock className="w-4 h-4 text-slate-700" />
          </div>
          {avgMockScore !== null ? (
            <div>
              <span className="text-3xl font-extrabold text-slate-900 block">{avgMockScore}%</span>
              <span className="text-xs text-slate-600 font-medium block mt-1">
                Average score over {totalMocks} completed exams (Best: {highestMockScore}%)
              </span>
            </div>
          ) : (
            <div>
              <span className="text-lg font-bold text-slate-400 block">No mocks taken</span>
              <span className="text-xs text-slate-500 block mt-1">Complete a mock simulation to log records</span>
            </div>
          )}
        </div>

        {/* Mistakes Status */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wide">
            <span>Active Mistakes</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <span className="text-3xl font-extrabold text-amber-700 block">{activeMistakesCount}</span>
            <span className="text-xs text-slate-600 font-medium block mt-1">
              Questions currently needing review and re-attempt
            </span>
          </div>
        </div>
      </div>

      {/* Subject Performance Breakdown Table */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-2xs">
        <h2 className="text-base font-bold text-slate-900">
          Untimed Practice by Subject
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase font-semibold text-[11px]">
                <th className="pb-3 pr-4">Subject</th>
                <th className="pb-3 px-4 text-center">Answered</th>
                <th className="pb-3 px-4 text-center">Correct</th>
                <th className="pb-3 px-4 text-center">Accuracy</th>
                <th className="pb-3 pl-4">Mastery Indicator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {OFFICIAL_SUBJECTS.map((sub) => {
                const subAttempts = progress.practiceAttempts.filter(a => a.subject === sub);
                const subCorrect = subAttempts.filter(a => a.isCorrect).length;
                const subAcc = subAttempts.length > 0 ? Math.round((subCorrect / subAttempts.length) * 100) : 0;

                return (
                  <tr key={sub} className="py-2.5">
                    <td className="py-3 pr-4 font-semibold text-slate-900">{sub}</td>
                    <td className="py-3 px-4 text-center text-slate-700">{subAttempts.length}</td>
                    <td className="py-3 px-4 text-center text-emerald-700 font-bold">{subCorrect}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-900">
                      {subAttempts.length > 0 ? `${subAcc}%` : '—'}
                    </td>
                    <td className="py-3 pl-4 w-40">
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${subAcc >= 60 ? 'bg-teal-600' : 'bg-amber-500'}`}
                          style={{ width: `${subAcc}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Mock Exam History Table */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Mock Examination History</h2>
            <p className="text-xs text-slate-500">Immutable records of all submitted mock sessions</p>
          </div>
        </div>

        {progress.mockHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase font-semibold text-[11px]">
                  <th className="pb-3 pr-3">Date</th>
                  <th className="pb-3 px-3">Exam Paper</th>
                  <th className="pb-3 px-3 text-center">Questions</th>
                  <th className="pb-3 px-3 text-center">Score</th>
                  <th className="pb-3 pl-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {progress.mockHistory.map((mock) => (
                  <tr key={mock.id} className="py-2.5">
                    <td className="py-3 pr-3 text-slate-600 whitespace-nowrap">
                      {mock.submittedAt ? new Date(mock.submittedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900">{mock.name}</td>
                    <td className="py-3 px-3 text-center text-slate-700">{mock.questionIds.length}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-xs ${
                        (mock.score || 0) >= 60
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {mock.score}%
                      </span>
                    </td>
                    <td className="py-3 pl-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedMockForModal(mock)}
                        className="text-xs font-bold text-teal-700 hover:text-teal-900 underline"
                      >
                        Review Breakdown
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-500">
            No mock exams completed yet. Take a mock exam to see detailed logs here.
          </div>
        )}
      </section>

      {/* Backup, Export & Reset Section */}
      <section className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900">Data Backup & Device Portability</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Because this app stores your progress exclusively in this browser's localStorage, your scores are private to this device. Use backup export to move your history to a new phone or laptop.
        </p>

        {importStatus && (
          <div className={`p-3 rounded-lg text-xs font-semibold ${
            importStatus.error ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}>
            {importStatus.message}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          {/* Export Button */}
          <button
            type="button"
            onClick={handleExportBackup}
            className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-xl shadow-2xs flex items-center space-x-2 min-h-[44px]"
          >
            <Download className="w-4 h-4 text-teal-700" />
            <span>Export Progress (JSON)</span>
          </button>

          {/* Import Button */}
          <label className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-xl shadow-2xs flex items-center space-x-2 cursor-pointer min-h-[44px]">
            <Upload className="w-4 h-4 text-teal-700" />
            <span>Import Progress Backup</span>
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>

          {/* Restore pre-import snapshot button */}
          {hasPreImportBackup() && (
            <button
              type="button"
              onClick={handleRestorePreImport}
              className="px-4 py-2.5 bg-white border border-amber-300 text-amber-800 hover:bg-amber-50 text-xs font-bold rounded-xl shadow-2xs flex items-center space-x-1.5 min-h-[44px]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Pre-Import Copy</span>
            </button>
          )}

          {/* Reset Progress Button */}
          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-xl transition-colors ml-auto min-h-[44px]"
          >
            Reset My Progress
          </button>
        </div>
      </section>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in">
            <div className="flex items-center space-x-2 text-red-600">
              <ShieldAlert className="w-6 h-6" />
              <h2 className="text-lg font-bold text-slate-900">Reset Learner Progress?</h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This will clear your practice attempts, completed mock history, and active mistakes from this browser. The 227 bundled questions will remain intact. A recovery backup copy will be preserved automatically.
            </p>
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 min-h-[40px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs min-h-[40px]"
              >
                Yes, Reset My Progress
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mock Review Modal */}
      {selectedMockForModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{selectedMockForModal.name}</h2>
                <span className="text-xs text-slate-500">
                  {selectedMockForModal.submittedAt ? new Date(selectedMockForModal.submittedAt).toLocaleString() : ''}
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-extrabold text-teal-700">{selectedMockForModal.score}%</span>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Subject Breakdown</h3>
              {selectedMockForModal.subjectScores && Object.entries(selectedMockForModal.subjectScores).map(([sub, score]) => (
                <div key={sub} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{sub}</span>
                  <span className="font-bold text-slate-900">
                    {score.correct} / {score.total} ({score.percentage}%)
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedMockForModal(null)}
                className="px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl min-h-[40px]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
