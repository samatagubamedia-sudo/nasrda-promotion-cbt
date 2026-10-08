import React, { useState } from 'react';
import { Question, LearnerProgress } from '../types';
import { 
  getAllQuestions, 
  getVerifiedQuestions, 
  getUnverifiedQuestions, 
  validateQuestionBank,
  OFFICIAL_SUBJECTS 
} from '../services/questionsService';
import { 
  loadCustomQuestions, 
  saveCustomQuestions, 
  clearCustomQuestions 
} from '../services/storage';
import { 
  Settings, 
  BookMarked, 
  ExternalLink, 
  Upload, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Calendar,
  Layers,
  HelpCircle,
  ShieldCheck
} from 'lucide-react';

interface SettingsSourcesViewProps {
  progress: LearnerProgress;
  onUpdateTargetDate: (date: string) => void;
  onRefreshBank: () => void;
}

export const SettingsSourcesView: React.FC<SettingsSourcesViewProps> = ({
  progress,
  onUpdateTargetDate,
  onRefreshBank,
}) => {
  const [targetDateInput, setTargetDateInput] = useState(progress.targetExamDate || '');
  const [dateSavedMessage, setDateSavedMessage] = useState(false);

  // Bank import states
  const [importPreview, setImportPreview] = useState<{
    total: number;
    newIds: number;
    existingIds: number;
    questions: Question[];
  } | null>(null);
  const [bankImportError, setBankImportError] = useState<string | null>(null);
  const [bankImportSuccess, setBankImportSuccess] = useState<string | null>(null);

  const allQuestions = getAllQuestions();
  const verifiedQuestions = getVerifiedQuestions();
  const unverifiedQuestions = getUnverifiedQuestions();
  const customQuestions = loadCustomQuestions();

  // Deduplicate all cited source documents & official URLs
  const sourceCitations = React.useMemo(() => {
    const map = new Map<string, { document: string; url: string; count: number }>();
    allQuestions.forEach((q) => {
      const key = `${q.sourceDocument}|${q.sourceURL}`;
      if (!map.has(key)) {
        map.set(key, { document: q.sourceDocument, url: q.sourceURL, count: 1 });
      } else {
        map.get(key)!.count++;
      }
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [allQuestions]);

  const handleSaveDate = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateTargetDate(targetDateInput);
    setDateSavedMessage(true);
    setTimeout(() => setDateSavedMessage(false), 3000);
  };

  // Handle Bank File Upload
  const handleBankFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBankImportError(null);
    setBankImportSuccess(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = JSON.parse(event.target?.result as string);
        const val = validateQuestionBank(raw);
        if (!val.valid || !val.questions) {
          setBankImportError(val.error || 'Failed to validate question records.');
          setImportPreview(null);
          return;
        }

        const existingMap = new Map(allQuestions.map((q) => [q.id, q]));
        let newIds = 0;
        let existingIds = 0;

        val.questions.forEach((q) => {
          if (existingMap.has(q.id)) {
            existingIds++;
          } else {
            newIds++;
          }
        });

        setImportPreview({
          total: val.questions.length,
          newIds,
          existingIds,
          questions: val.questions,
        });
      } catch (err: any) {
        setBankImportError(err.message || 'Invalid JSON syntax.');
        setImportPreview(null);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmBankImport = () => {
    if (!importPreview) return;
    saveCustomQuestions(importPreview.questions);
    setBankImportSuccess(
      `Bank updated: imported ${importPreview.total} records (${importPreview.newIds} new, ${importPreview.existingIds} updated).`
    );
    setImportPreview(null);
    onRefreshBank();
  };

  const handleRestoreBaseline = () => {
    if (window.confirm('Restore original bundled 227-question baseline? Custom supplements will be cleared.')) {
      clearCustomQuestions();
      setBankImportSuccess('Restored to bundled 227-question baseline.');
      setImportPreview(null);
      onRefreshBank();
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <span className="p-1.5 rounded-lg bg-teal-100 text-teal-800">
            <Settings className="w-5 h-5" />
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Settings & Source Documentation
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Target exam configuration, official source authorities, and question bank management.
        </p>
      </div>

      {/* Target Promotion Exam Date Configuration */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-2xs">
        <div className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-teal-700" />
          <h2 className="text-base font-bold text-slate-900">Target Promotion Exam Date</h2>
        </div>
        <p className="text-xs text-slate-600">
          Set an optional learner target date for your promotion examination. The app displays your personal countdown without claiming an official exam timetable.
        </p>

        <form onSubmit={handleSaveDate} className="flex flex-wrap items-center gap-3 pt-1">
          <input
            type="date"
            value={targetDateInput}
            onChange={(e) => setTargetDateInput(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 min-h-[44px]"
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-xs min-h-[44px]"
          >
            Update Target Date
          </button>
          {progress.targetExamDate && (
            <button
              type="button"
              onClick={() => {
                setTargetDateInput('');
                onUpdateTargetDate('');
              }}
              className="px-3 py-2 text-xs text-slate-500 hover:text-red-700 font-semibold"
            >
              Clear Date
            </button>
          )}
          {dateSavedMessage && (
            <span className="text-xs text-emerald-700 font-bold flex items-center space-x-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Target date updated!</span>
            </span>
          )}
        </form>
      </section>

      {/* Official Source Authorities Documentation */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 space-y-5 shadow-2xs">
        <div className="flex items-center space-x-2">
          <BookMarked className="w-5 h-5 text-teal-700" />
          <h2 className="text-base font-bold text-slate-900">Documentary Authorities & Legal Base</h2>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <span className="w-2 h-2 bg-teal-600 rounded-full" />
              <span>Public Service Rules (PSR 2021)</span>
            </h3>
            <p className="text-xs text-slate-600">
              Extant edition issued by the Office of the Head of the Civil Service of the Federation (OHCSF). Regulates eligibility intervals (3 years for GL 07–14), merit-based selection, confirmation, disciplinary queries (Rule 100302), misconduct vs serious misconduct, interdiction salary (50%), and working-day leave rules.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <span className="w-2 h-2 bg-teal-600 rounded-full" />
              <span>Financial Regulations (Revised to January 2009)</span>
            </h3>
            <p className="text-xs text-slate-600">
              Federal financial administration regulations issued by the Office of the Accountant-General of the Federation (OAGF). Defines Accounting Officers (Permanent Secretaries), expenditure warrants, vote books, AIEs, standing and special imprest retirement (31 December or upon purpose completion), and Internal Audit controls.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <span className="w-2 h-2 bg-teal-600 rounded-full" />
              <span>International Space Treaties & UN Status Records</span>
            </h3>
            <p className="text-xs text-slate-600">
              Verified against authentic UN Treaty Series texts: Outer Space Treaty 1967 (Articles I to XII), Liability Convention 1972, Rescue Agreement 1968, and Registration Convention 1975. Verified against UN Treaty Collection participant deposit records: Nigeria acceded to the Outer Space Treaty on 14 Nov 1967, ratified Rescue on 23 Mar 1973, acceded to Liability on 29 Dec 2005, and acceded to Registration on 6 Jul 2009. Nigeria is not listed as a party to the 1979 Moon Agreement.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <span className="w-2 h-2 bg-teal-600 rounded-full" />
              <span>Constitution (Section 12), NASRDA Act 2010 & Nigerian Missions</span>
            </h3>
            <p className="text-xs text-slate-600">
              Section 12(1) of the 1999 Constitution establishes that treaties require legislative enactment to have the force of domestic law. The National Space Research and Development Agency Act 2010 establishes licensing under Section 9 and the Register of Space Objects under Section 10. Nigerian missions include NigeriaSat-1 (launched 2003), NigeriaSat-X (built by 25 Nigerian engineers), NigComSat-1R (launched 2011), and NigeriaEduSat-1 (2017 BIRDS-1 nanosatellite).
            </p>
          </div>
        </div>

        {/* Deduplicated Source Documents Table */}
        <div className="space-y-2 pt-2">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
            Cited Source Documents & Official Repositories
          </h3>
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
            {sourceCitations.map((item, idx) => (
              <div key={idx} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white hover:bg-slate-50">
                <div>
                  <span className="font-semibold text-slate-900 block">{item.document}</span>
                  <span className="text-[11px] text-slate-500">Cited across {item.count} question records</span>
                </div>
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-teal-700 hover:text-teal-900 font-semibold underline text-xs whitespace-nowrap"
                  >
                    <span>View Official Document</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Question Bank Status & Optional Import Control */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 space-y-5 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-teal-700" />
            <h2 className="text-base font-bold text-slate-900">Installed Question Bank Status</h2>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-teal-50 text-teal-900 border border-teal-200">
            {allQuestions.length} Questions Active
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500 block">Verified Scored</span>
            <span className="text-lg font-bold text-slate-900 block mt-0.5">{verifiedQuestions.length}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500 block">Bundled Baseline</span>
            <span className="text-lg font-bold text-slate-900 block mt-0.5">227</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500 block">Custom Supplements</span>
            <span className="text-lg font-bold text-slate-900 block mt-0.5">{customQuestions.length}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500 block">Unverified Excluded</span>
            <span className="text-lg font-bold text-slate-900 block mt-0.5">{unverifiedQuestions.length}</span>
          </div>
        </div>

        {/* Optional Bank Import Tool for Future Supplements */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Import Future Question Bank Supplements
            </h3>
            {customQuestions.length > 0 && (
              <button
                type="button"
                onClick={handleRestoreBaseline}
                className="text-xs font-bold text-red-700 hover:text-red-900 flex items-center space-x-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore 227 Bundled Baseline</span>
              </button>
            )}
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            The complete 227-question bank is already bundled and active. If you receive an authorized JSON question file in the future, you may import it here. The file will be thoroughly validated for IDs, distinct options, and official citations.
          </p>

          <label className="inline-flex items-center space-x-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-xl shadow-2xs cursor-pointer min-h-[44px]">
            <Upload className="w-4 h-4 text-teal-700" />
            <span>Select Question Bank JSON File</span>
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleBankFileUpload}
              className="hidden"
            />
          </label>

          {/* Validation Error */}
          {bankImportError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs font-semibold rounded-lg flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{bankImportError}</span>
            </div>
          )}

          {/* Success Notification */}
          {bankImportSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{bankImportSuccess}</span>
            </div>
          )}

          {/* Import Preview Confirmation */}
          {importPreview && (
            <div className="p-4 bg-teal-50 border border-teal-300 rounded-xl space-y-3 text-xs">
              <div className="font-bold text-teal-950 text-sm">
                File Validated Successfully: {importPreview.total} Records
              </div>
              <div className="grid grid-cols-2 gap-2 text-teal-900">
                <div>• Completely New IDs: <strong>{importPreview.newIds}</strong></div>
                <div>• Overwriting Existing IDs: <strong>{importPreview.existingIds}</strong></div>
              </div>
              <div className="flex items-center space-x-2 pt-1">
                <button
                  type="button"
                  onClick={handleConfirmBankImport}
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-lg min-h-[38px]"
                >
                  Confirm & Commit to Local Storage
                </button>
                <button
                  type="button"
                  onClick={() => setImportPreview(null)}
                  className="px-3 py-2 text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Unverified Questions Quarantine (if any exist) */}
      {unverifiedQuestions.length > 0 && (
        <section className="bg-amber-50 rounded-xl border border-amber-300 p-5 space-y-3">
          <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-700" />
            <span>Quarantined Unverified Records ({unverifiedQuestions.length})</span>
          </div>
          <p className="text-xs text-amber-800">
            Records missing verificationStatus: 'verified' are excluded from scored practice and mock examinations.
          </p>
          <div className="divide-y divide-amber-200 text-xs text-amber-950">
            {unverifiedQuestions.map((q) => (
              <div key={q.id} className="py-2">
                <span className="font-bold">{q.id}:</span> {q.question} ({q.sourceDocument})
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Firebase Cloud Sync & Security Configuration Guide */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-2xs">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-teal-700" />
          <h2 className="text-base font-bold text-slate-900">Firebase & Firestore Security Configuration</h2>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Cloud synchronization and Google authentication are connected to Firebase project <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">stellar-nation-w5fd2</code>. All user data is isolated per authenticated UID with zero public read/write access.
        </p>

        <div className="space-y-3 pt-2 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-slate-900 block text-sm">
              Required Console Configuration Checklist:
            </span>
            <ul className="space-y-2 text-slate-700 list-disc list-inside">
              <li>
                <strong>1. Enable Google Sign-In Provider:</strong> In the <a href="https://console.firebase.google.com/project/stellar-nation-w5fd2/authentication/providers" target="_blank" rel="noopener noreferrer" className="text-teal-700 underline font-semibold">Firebase Console &gt; Authentication &gt; Sign-in method</a>, ensure the <em>Google</em> provider is enabled with support email set.
              </li>
              <li>
                <strong>2. Authorize Website Domains:</strong> Under <a href="https://console.firebase.google.com/project/stellar-nation-w5fd2/authentication/settings" target="_blank" rel="noopener noreferrer" className="text-teal-700 underline font-semibold">Authentication &gt; Settings &gt; Authorized domains</a>, confirm the deployed hostnames are listed:
                <div className="mt-1 pl-4 space-y-0.5 font-mono text-[11px] text-slate-800">
                  <div>• ais-dev-mqn7wgfdfvaix5hmx6aqul-923532371505.europe-west2.run.app</div>
                  <div>• ais-pre-mqn7wgfdfvaix5hmx6aqul-923532371505.europe-west2.run.app</div>
                </div>
              </li>
              <li>
                <strong>3. Firestore Security Rules:</strong> Hardened security rules have been deployed to database <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">ai-studio-nasrdapromotionc-9f93719c-25a0-4c3c-b4b1-1e81300571e8</code>. Each user can read and write only their own record under <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">/users/&#123;userId&#125;</code>.
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};
