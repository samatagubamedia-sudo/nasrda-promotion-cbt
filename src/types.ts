export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface Question {
  id: string;
  subject: string;
  category: string;
  topic: string;
  difficulty: Difficulty;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  sourceDocument: string;
  sourceReference: string;
  sourceURL: string;
  verificationStatus: string;
  verifiedOn: string;
  verificationNote: string;
  origin: string;
}

export interface PracticeSessionState {
  id: string;
  selectedSubjects: string[];
  selectedTopic?: string;
  selectedDifficulty?: Difficulty;
  questionIds: string[];
  currentIndex: number;
  userAnswers: Record<string, 'A' | 'B' | 'C' | 'D'>;
  checkedQuestions: Record<string, boolean>; // whether Check Answer was pressed
  bookmarkedIds: string[];
  flaggedIds: string[];
  isCompleted: boolean;
  createdAt: number;
  completedAt?: number;
}

export interface MockExamState {
  id: string;
  name: string;
  isMixed: boolean;
  selectedSubjects: string[];
  subjectComposition: Record<string, number>;
  questionIds: string[];
  questionSnapshots: Question[]; // immutable snapshot for history preservation
  currentIndex: number;
  userAnswers: Record<string, 'A' | 'B' | 'C' | 'D'>;
  flaggedIds: string[];
  startTime: number;
  durationMinutes: number;
  deadlineTime: number; // absolute timestamp
  isSubmitted: boolean;
  submittedAt?: number;
  score?: number; // percentage
  correctCount?: number;
  incorrectCount?: number;
  unansweredCount?: number;
  subjectScores?: Record<string, { correct: number; total: number; percentage: number }>;
}

export interface MistakeItem {
  questionId: string;
  lastMissedAt: number;
  source: 'practice' | 'mock';
  subject: string;
}

export interface PracticeAttemptRecord {
  questionId: string;
  subject: string;
  selectedAnswer: 'A' | 'B' | 'C' | 'D';
  isCorrect: boolean;
  timestamp: number;
}

export interface LearnerProgress {
  schemaVersion: number;
  targetExamDate?: string;
  practiceAttempts: PracticeAttemptRecord[];
  mockHistory: MockExamState[];
  activeMistakes: Record<string, MistakeItem>; // keyed by questionId
  bookmarkedQuestionIds: string[];
  activePracticeSession?: PracticeSessionState | null;
  activeMockExam?: MockExamState | null;
  lastUpdated: number;
}

export interface BackupPayload {
  version: number;
  exportedAt: string;
  progress: LearnerProgress;
}
