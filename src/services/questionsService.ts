import { Question, Difficulty } from '../types';
import { BUNDLED_QUESTIONS } from '../data/bundledQuestions';
import { loadCustomQuestions, saveCustomQuestions } from './storage';

export const OFFICIAL_SUBJECTS = [
  'Public Service Rules',
  'Financial Regulations',
  'Space Law and Policy',
  'General Public Service Knowledge',
] as const;

export type SubjectName = typeof OFFICIAL_SUBJECTS[number];

/**
 * Validates a single question record
 */
export function validateQuestionRecord(q: any, index: number): { valid: boolean; error?: string } {
  if (!q || typeof q !== 'object') {
    return { valid: false, error: `Record #${index + 1} is not an object.` };
  }
  if (!q.id || typeof q.id !== 'string' || !q.id.trim()) {
    return { valid: false, error: `Record #${index + 1} missing unique id.` };
  }
  if (!q.subject || typeof q.subject !== 'string' || !q.subject.trim()) {
    return { valid: false, error: `Record ${q.id} missing subject.` };
  }
  if (!q.question || typeof q.question !== 'string' || !q.question.trim()) {
    return { valid: false, error: `Record ${q.id} has empty question.` };
  }
  if (!q.options || typeof q.options !== 'object') {
    return { valid: false, error: `Record ${q.id} missing options object.` };
  }
  const keys = ['A', 'B', 'C', 'D'] as const;
  for (const k of keys) {
    if (!q.options[k] || typeof q.options[k] !== 'string' || !q.options[k].trim()) {
      return { valid: false, error: `Record ${q.id} option ${k} is empty.` };
    }
  }
  const optionValues = keys.map((k) => q.options[k].trim());
  if (new Set(optionValues).size !== 4) {
    return { valid: false, error: `Record ${q.id} does not have four distinct options.` };
  }
  if (!['A', 'B', 'C', 'D'].includes(q.correctAnswer)) {
    return { valid: false, error: `Record ${q.id} correctAnswer must be A, B, C, or D.` };
  }
  if (!q.explanation || typeof q.explanation !== 'string' || !q.explanation.trim()) {
    return { valid: false, error: `Record ${q.id} missing explanation.` };
  }
  if (!q.sourceDocument || typeof q.sourceDocument !== 'string' || !q.sourceDocument.trim()) {
    return { valid: false, error: `Record ${q.id} missing sourceDocument.` };
  }
  return { valid: true };
}

/**
 * Validates a full questions JSON array
 */
export function validateQuestionBank(data: any): {
  valid: boolean;
  error?: string;
  questions?: Question[];
  duplicatesInFile?: string[];
} {
  if (!Array.isArray(data)) {
    return { valid: false, error: 'The uploaded file must contain a JSON array of question objects.' };
  }
  if (data.length === 0) {
    return { valid: false, error: 'The uploaded array contains no question records.' };
  }

  const seenIds = new Set<string>();
  const duplicateIds: string[] = [];

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const val = validateQuestionRecord(item, i);
    if (!val.valid) {
      return { valid: false, error: val.error };
    }
    if (seenIds.has(item.id)) {
      duplicateIds.push(item.id);
    }
    seenIds.add(item.id);
  }

  if (duplicateIds.length > 0) {
    return {
      valid: false,
      error: `Import rejected: Contains duplicate IDs within the file: ${duplicateIds.slice(0, 5).join(', ')}${duplicateIds.length > 5 ? '...' : ''}`,
      duplicatesInFile: duplicateIds,
    };
  }

  return { valid: true, questions: data as Question[] };
}

/**
 * Returns all active questions (bundled + custom overrides/additions)
 */
export function getAllQuestions(): Question[] {
  const custom = loadCustomQuestions();
  if (custom.length === 0) {
    return BUNDLED_QUESTIONS;
  }
  const customMap = new Map<string, Question>();
  custom.forEach((q) => customMap.set(q.id, q));

  // Merge bundled + custom (custom overrides bundled if same ID)
  const result: Question[] = [];
  const processedIds = new Set<string>();

  BUNDLED_QUESTIONS.forEach((q) => {
    if (customMap.has(q.id)) {
      result.push(customMap.get(q.id)!);
    } else {
      result.push(q);
    }
    processedIds.add(q.id);
  });

  // Add any completely new custom questions
  custom.forEach((q) => {
    if (!processedIds.has(q.id)) {
      result.push(q);
    }
  });

  return result;
}

/**
 * Returns only verified questions for scored practice and mock exams
 */
export function getVerifiedQuestions(): Question[] {
  return getAllQuestions().filter((q) => q.verificationStatus?.toLowerCase() === 'verified');
}

/**
 * Returns unverified questions (for separate review in Settings)
 */
export function getUnverifiedQuestions(): Question[] {
  return getAllQuestions().filter((q) => q.verificationStatus?.toLowerCase() !== 'verified');
}

/**
 * Get map of question by ID
 */
export function getQuestionMap(): Map<string, Question> {
  const map = new Map<string, Question>();
  getAllQuestions().forEach((q) => map.set(q.id, q));
  return map;
}

export function getQuestionById(id: string): Question | undefined {
  return getQuestionMap().get(id);
}

/**
 * Counts questions by subject from currently loaded bank
 */
export function getSubjectCounts(): Record<string, number> {
  const verified = getVerifiedQuestions();
  const counts: Record<string, number> = {
    'Public Service Rules': 0,
    'Financial Regulations': 0,
    'Space Law and Policy': 0,
    'General Public Service Knowledge': 0,
  };
  verified.forEach((q) => {
    counts[q.subject] = (counts[q.subject] || 0) + 1;
  });
  return counts;
}

/**
 * Returns distinct topics for given subjects
 */
export function getAvailableTopics(subjects: string[]): string[] {
  const verified = getVerifiedQuestions();
  const topicsSet = new Set<string>();
  verified.forEach((q) => {
    if (subjects.length === 0 || subjects.includes(q.subject)) {
      if (q.topic) topicsSet.add(q.topic);
    }
  });
  return Array.from(topicsSet).sort();
}

/**
 * Filter questions for practice
 */
export function filterQuestions(criteria: {
  subjects: string[];
  topic?: string;
  difficulty?: Difficulty | 'All';
  onlyVerified?: boolean;
}): Question[] {
  const source = criteria.onlyVerified !== false ? getVerifiedQuestions() : getAllQuestions();
  return source.filter((q) => {
    if (criteria.subjects.length > 0 && !criteria.subjects.includes(q.subject)) {
      return false;
    }
    if (criteria.topic && criteria.topic !== 'All' && q.topic !== criteria.topic) {
      return false;
    }
    if (criteria.difficulty && criteria.difficulty !== 'All' && q.difficulty !== criteria.difficulty) {
      return false;
    }
    return true;
  });
}

/**
 * Fisher-Yates shuffle that returns a new array
 */
export function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Mixed Mock Composition algorithm:
 * Allocates as evenly as possible across selected subjects, respecting each pool's capacity,
 * then redistributes unfilled allocations to subjects with remaining capacity.
 * Never duplicates questions!
 */
export function calculateMixedMockComposition(
  selectedSubjects: string[],
  requestedTotal: number
): { composition: Record<string, number>; actualTotal: number } {
  const verified = getVerifiedQuestions();
  const pools: Record<string, Question[]> = {};
  selectedSubjects.forEach((sub) => {
    pools[sub] = verified.filter((q) => q.subject === sub);
  });

  const totalPoolCapacity = selectedSubjects.reduce((acc, sub) => acc + (pools[sub]?.length || 0), 0);
  const actualTarget = Math.min(requestedTotal, totalPoolCapacity);

  const allocation: Record<string, number> = {};
  selectedSubjects.forEach((sub) => (allocation[sub] = 0));

  let remainingToAllocate = actualTarget;
  const activeSubjects = new Set(selectedSubjects);

  while (remainingToAllocate > 0 && activeSubjects.size > 0) {
    const share = Math.floor(remainingToAllocate / activeSubjects.size);
    const remainder = remainingToAllocate % activeSubjects.size;

    let allocatedInPass = 0;
    const toRemove: string[] = [];

    const activeList = Array.from(activeSubjects);
    for (let i = 0; i < activeList.length; i++) {
      const sub = activeList[i];
      const maxAvailable = pools[sub].length;
      const current = allocation[sub];
      const targetAddition = share + (i < remainder ? 1 : 0);
      const possibleAddition = Math.min(targetAddition, maxAvailable - current);

      allocation[sub] += possibleAddition;
      allocatedInPass += possibleAddition;

      if (allocation[sub] >= maxAvailable) {
        toRemove.push(sub);
      }
    }

    toRemove.forEach((sub) => activeSubjects.delete(sub));
    remainingToAllocate -= allocatedInPass;

    if (allocatedInPass === 0) {
      // No more can be added
      break;
    }
  }

  const actualTotal = Object.values(allocation).reduce((a, b) => a + b, 0);
  return { composition: allocation, actualTotal };
}

/**
 * Select questions for a mock exam (either single subject or mixed)
 */
export function selectMockQuestions(
  selectedSubjects: string[],
  requestedTotal: number
): { questions: Question[]; composition: Record<string, number> } {
  const { composition } = calculateMixedMockComposition(selectedSubjects, requestedTotal);
  const verified = getVerifiedQuestions();
  const selected: Question[] = [];

  for (const [sub, count] of Object.entries(composition)) {
    if (count > 0) {
      const subjectPool = shuffleArray(verified.filter((q) => q.subject === sub));
      selected.push(...subjectPool.slice(0, count));
    }
  }

  // Shuffle final list so subjects are mixed
  return {
    questions: shuffleArray(selected),
    composition,
  };
}
