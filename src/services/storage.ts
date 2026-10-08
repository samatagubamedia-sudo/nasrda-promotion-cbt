import { LearnerProgress, BackupPayload, Question } from '../types';

const LEGACY_STORAGE_KEY = 'nasrda_cbt_learner_progress_v1';
const GUEST_STORAGE_KEY = 'nasrda_cbt_learner_progress_guest_v1';
const PRE_IMPORT_BACKUP_KEY = 'nasrda_cbt_progress_backup_pre_import';
const CUSTOM_QUESTIONS_KEY = 'nasrda_cbt_custom_questions_v1';

export const INITIAL_PROGRESS: LearnerProgress = {
  schemaVersion: 1,
  targetExamDate: '',
  practiceAttempts: [],
  mockHistory: [],
  activeMistakes: {},
  bookmarkedQuestionIds: [],
  activePracticeSession: null,
  activeMockExam: null,
  lastUpdated: Date.now(),
};

export function getStorageKey(userId?: string | null): string {
  if (userId) {
    return `nasrda_cbt_learner_progress_user_${userId}_v1`;
  }
  return GUEST_STORAGE_KEY;
}

export function loadProgress(userId?: string | null): LearnerProgress {
  try {
    const key = getStorageKey(userId);
    let raw = localStorage.getItem(key);

    // If guest and guest key doesn't exist, check legacy key
    if (!userId && !raw) {
      raw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (raw) {
        // Migrate to guest key
        localStorage.setItem(GUEST_STORAGE_KEY, raw);
      }
    }

    if (!raw) return { ...INITIAL_PROGRESS };
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return {
        schemaVersion: parsed.schemaVersion || 1,
        targetExamDate: parsed.targetExamDate || '',
        practiceAttempts: Array.isArray(parsed.practiceAttempts) ? parsed.practiceAttempts : [],
        mockHistory: Array.isArray(parsed.mockHistory) ? parsed.mockHistory : [],
        activeMistakes: parsed.activeMistakes && typeof parsed.activeMistakes === 'object' ? parsed.activeMistakes : {},
        bookmarkedQuestionIds: Array.isArray(parsed.bookmarkedQuestionIds) ? parsed.bookmarkedQuestionIds : [],
        activePracticeSession: parsed.activePracticeSession || null,
        activeMockExam: parsed.activeMockExam || null,
        lastUpdated: parsed.lastUpdated || Date.now(),
      };
    }
  } catch (err) {
    console.error('Error loading progress from localStorage:', err);
  }
  return { ...INITIAL_PROGRESS };
}

export function saveProgress(progress: LearnerProgress, userId?: string | null): boolean {
  try {
    const key = getStorageKey(userId);
    const dataToSave: LearnerProgress = {
      ...progress,
      lastUpdated: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(dataToSave));
    return true;
  } catch (err) {
    console.error('Storage quota exceeded or write failed:', err);
    return false;
  }
}

export function resetProgress(userId?: string | null): boolean {
  try {
    const key = getStorageKey(userId);
    const current = localStorage.getItem(key);
    if (current) {
      localStorage.setItem(`${PRE_IMPORT_BACKUP_KEY}_${userId || 'guest'}`, current);
    }
    localStorage.removeItem(key);
    return true;
  } catch (err) {
    console.error('Failed to reset progress:', err);
    return false;
  }
}

export function getGuestProgress(): LearnerProgress | null {
  const guestRaw = localStorage.getItem(GUEST_STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!guestRaw) return null;
  try {
    const parsed = JSON.parse(guestRaw);
    if (parsed && (parsed.practiceAttempts?.length > 0 || parsed.mockHistory?.length > 0 || Object.keys(parsed.activeMistakes || {}).length > 0)) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

export function hasGuestProgress(): boolean {
  return getGuestProgress() !== null;
}

export function clearGuestProgress(): void {
  localStorage.removeItem(GUEST_STORAGE_KEY);
  localStorage.removeItem(LEGACY_STORAGE_KEY);
}

// Merges guest progress into user progress without duplicate attempt records
export function mergeProgress(base: LearnerProgress, incoming: LearnerProgress): LearnerProgress {
  // Combine practice attempts (preventing exact duplicate timestamps/questions)
  const existingAttemptKeys = new Set(base.practiceAttempts.map(a => `${a.questionId}_${a.timestamp}`));
  const newAttempts = incoming.practiceAttempts.filter(a => !existingAttemptKeys.has(`${a.questionId}_${a.timestamp}`));

  // Combine mock history
  const existingMockIds = new Set(base.mockHistory.map(m => m.id));
  const newMocks = incoming.mockHistory.filter(m => !existingMockIds.has(m.id));

  // Merge mistakes
  const mergedMistakes = { ...base.activeMistakes, ...incoming.activeMistakes };

  // Merge bookmarks
  const bookmarkSet = new Set([...base.bookmarkedQuestionIds, ...incoming.bookmarkedQuestionIds]);

  return {
    ...base,
    targetExamDate: base.targetExamDate || incoming.targetExamDate || '',
    practiceAttempts: [...base.practiceAttempts, ...newAttempts],
    mockHistory: [...base.mockHistory, ...newMocks],
    activeMistakes: mergedMistakes,
    bookmarkedQuestionIds: Array.from(bookmarkSet),
    // Preserve active session if base doesn't have one
    activePracticeSession: base.activePracticeSession || incoming.activePracticeSession || null,
    activeMockExam: base.activeMockExam || incoming.activeMockExam || null,
    lastUpdated: Date.now(),
  };
}

export function exportProgressBackup(userId?: string | null): string {
  const current = loadProgress(userId);
  const backup: BackupPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    progress: current,
  };
  return JSON.stringify(backup, null, 2);
}

export function validateBackupJson(jsonString: string): { valid: boolean; error?: string; data?: BackupPayload } {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, error: 'File is not a valid JSON object.' };
    }
    if (!parsed.progress || typeof parsed.progress !== 'object') {
      return { valid: false, error: 'Backup is missing the "progress" field.' };
    }
    if (!Array.isArray(parsed.progress.practiceAttempts) || !Array.isArray(parsed.progress.mockHistory)) {
      return { valid: false, error: 'Progress data format is invalid (missing arrays).' };
    }
    return { valid: true, data: parsed as BackupPayload };
  } catch (err: any) {
    return { valid: false, error: err.message || 'Invalid JSON syntax.' };
  }
}

export function importProgressBackup(payload: BackupPayload, userId?: string | null): boolean {
  try {
    const key = getStorageKey(userId);
    const currentRaw = localStorage.getItem(key);
    if (currentRaw) {
      localStorage.setItem(`${PRE_IMPORT_BACKUP_KEY}_${userId || 'guest'}`, currentRaw);
    }
    saveProgress(payload.progress, userId);
    return true;
  } catch (err) {
    console.error('Failed to restore backup:', err);
    return false;
  }
}

export function restorePreImportBackup(userId?: string | null): boolean {
  try {
    const backupKey = `${PRE_IMPORT_BACKUP_KEY}_${userId || 'guest'}`;
    const raw = localStorage.getItem(backupKey);
    if (!raw) return false;
    localStorage.setItem(getStorageKey(userId), raw);
    return true;
  } catch (err) {
    console.error('Failed to restore pre-import backup:', err);
    return false;
  }
}

export function hasPreImportBackup(userId?: string | null): boolean {
  return !!localStorage.getItem(`${PRE_IMPORT_BACKUP_KEY}_${userId || 'guest'}`);
}

// Custom questions storage for optional bank additions
export function loadCustomQuestions(): Question[] {
  try {
    const raw = localStorage.getItem(CUSTOM_QUESTIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load custom questions:', err);
    return [];
  }
}

export function saveCustomQuestions(questions: Question[]): boolean {
  try {
    localStorage.setItem(CUSTOM_QUESTIONS_KEY, JSON.stringify(questions));
    return true;
  } catch (err) {
    console.error('Failed to save custom questions:', err);
    return false;
  }
}

export function clearCustomQuestions(): boolean {
  try {
    localStorage.removeItem(CUSTOM_QUESTIONS_KEY);
    return true;
  } catch (err) {
    return false;
  }
}
