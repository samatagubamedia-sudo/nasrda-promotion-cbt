import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { LearnerProgress } from '../types';

export const app = initializeApp(firebaseConfig);

/* CRITICAL: The app requires the explicit database ID configured */
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection check as required by skill
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore is currently offline or unreachable. Please check configuration.');
    }
  }
}

// Google Sign-in via popup
export async function loginWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err: any) {
    console.error('Google Sign-In failed:', err);
    throw err;
  }
}

// Sign-out
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.error('Sign-Out failed:', err);
    throw err;
  }
}

// Fetch user's saved progress from Firestore
export async function fetchUserProgressFromCloud(userId: string): Promise<LearnerProgress | null> {
  const userDocPath = `users/${userId}`;
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      return null;
    }
    const data = snap.data();
    return {
      schemaVersion: data.schemaVersion || 1,
      targetExamDate: data.targetExamDate || '',
      practiceAttempts: Array.isArray(data.practiceAttempts) ? data.practiceAttempts : [],
      mockHistory: Array.isArray(data.mockHistory) ? data.mockHistory : [],
      activeMistakes: data.activeMistakes && typeof data.activeMistakes === 'object' ? data.activeMistakes : {},
      bookmarkedQuestionIds: Array.isArray(data.bookmarkedQuestionIds) ? data.bookmarkedQuestionIds : [],
      activePracticeSession: data.activePracticeSession || null,
      activeMockExam: data.activeMockExam || null,
      lastUpdated: data.lastUpdated || Date.now(),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, userDocPath);
    return null;
  }
}

// Save progress to Firestore under users/{userId}
export async function saveUserProgressToCloud(
  userId: string,
  progress: LearnerProgress,
  userInfo?: { email?: string | null; displayName?: string | null }
): Promise<void> {
  const userDocPath = `users/${userId}`;
  try {
    const userRef = doc(db, 'users', userId);
    const payload = {
      userId,
      email: userInfo?.email || auth.currentUser?.email || '',
      displayName: userInfo?.displayName || auth.currentUser?.displayName || '',
      targetExamDate: progress.targetExamDate || '',
      practiceAttempts: progress.practiceAttempts || [],
      mockHistory: progress.mockHistory || [],
      activeMistakes: progress.activeMistakes || {},
      bookmarkedQuestionIds: progress.bookmarkedQuestionIds || [],
      activePracticeSession: progress.activePracticeSession || null,
      activeMockExam: progress.activeMockExam || null,
      updatedAt: new Date().toISOString(),
      lastUpdated: Date.now(),
    };
    await setDoc(userRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userDocPath);
  }
}
