# NASRDA Promotion CBT Prep (GL 11 → GL 12)

A client-side Computer-Based Testing (CBT) preparation platform designed for Nigerian public servants and engineers at the National Space Research and Development Agency (NASRDA) preparing for promotion from Grade Level 11 to Grade Level 12.

---

## 1. Installed Question Bank Specifications

The application comes pre-bundled with **227 complete, verified question records** authored directly from official source documents. All 227 questions are immediately available on first launch without requiring an import step:

| Subject Area | Question Count | Primary Legal / Documentary Source |
| :--- | :---: | :--- |
| **Public Service Rules** | **60** | Public Service Rules (PSR 2021 edition, OHCSF) |
| **Financial Regulations** | **61** | Financial Regulations (Revised to January 2009, OAGF) |
| **Space Law and Policy** | **96** | UN Treaties (OST 1967, Rescue 1968, Liability 1972, Registration 1975), CFRN 1999 (s. 12), NASRDA Act 2010, Official Satellite Mission Records |
| **General Public Service Knowledge** | **10** | Supplementary baseline on constitutional supremacy, security classifications, and service tenets |
| **Total Verified Bank** | **227** | Fully validated with distinct 4-option A–D keys, explanations, and cited laws |

---

## 2. Core Functional Views

1. **Dashboard**:
   - Real-time question counts computed dynamically from loaded records.
   - Denominator-accurate answered accuracy calculation (no fictitious scores before activity).
   - Recent mock exam history with scores and breakdown metrics.
   - Learner-set target promotion examination date with countdown.
   - Active mock and practice resume banners.

2. **Practice Mode**:
   - Filter by subjects, topics, and difficulty levels.
   - Untimed question delivery with random order without duplicates.
   - Choice locking upon clicking **Check Answer**, displaying Correct/Incorrect status, official explanation, and expandable legal/treaty citation link.
   - Explicit **Next Question** progression so explanations can be absorbed before moving forward.
   - Each question is scored once per session to prevent score inflation.
   - Mistake tracking feeds directly into the Review Mistakes queue.

3. **Timed Mock Exam**:
   - Mixed CBT simulation and Single-Subject mocks.
   - Feasible question options (10, 20, 50, 100, or All Available) respecting pool capacities without duplicating items.
   - Transparent subject composition preview prior to commencing.
   - Practice timing: Default 1 minute per question (configurable).
   - Absolute countdown timer (`deadlineTime = startTime + durationMs`). Switching tabs or reloading the browser computes remaining time from the deadline and never resets or extends the clock.
   - Final 5-minute visual warning.
   - Answers and explanations strictly concealed until submission.
   - Immutable historical exam snapshots preserved in localStorage.

4. **Review Mistakes**:
   - Queue of all missed questions from practice sessions and mock exams.
   - Answering a question correctly in any subsequent session removes it from the active mistake queue while preserving historical attempt logs.
   - Subject filtering and one-click "Practice Missed Questions".

5. **Quick Revision (Flashcards)**:
   - Rapid flashcard interface for mobile and desk study.
   - Reveal Answer & Explanation toggle.
   - Subject, topic, and bookmark filters.
   - Viewing flashcards does not count as scored attempts or clear mistakes.

6. **Progress & Persistence**:
   - Independent metrics for practice answered accuracy vs timed mock exam scores.
   - Full mock history table with modal breakdown.
   - **Export Progress**: Download encrypted/structured JSON backup file.
   - **Import Progress**: Restore backup with schema validation and automatic safety snapshot.
   - **Reset Progress**: Safe reset of learner scores without touching the question bank or other origin data.

7. **Settings & Sources**:
   - Deduplicated catalog of official legal texts, treaties, and circulars with verified external links.
   - Optional future bank supplement importer with preview of new vs existing IDs.
   - Quarantined list for unverified questions (excluded from scored practice).

---

## 3. Firebase Authentication & Firestore Persistence

The application includes Google Sign-in with Firebase Authentication and multi-device persistence with Cloud Firestore:

- **Firebase Project ID**: `stellar-nation-w5fd2`
- **Firestore Database ID**: `ai-studio-nasrdapromotionc-9f93719c-25a0-4c3c-b4b1-1e81300571e8`
- **User Document Path**: `/users/{userId}`

### Data Privacy & Multi-User Isolation
- **Per-User Isolation**: Signed-in learners have their attempt records, active mistakes, bookmarks, and mock histories stored under `/users/{userId}` in Firestore and cached under a user-specific local key (`nasrda_cbt_learner_progress_user_{userId}_v1`).
- **Never Overwritten with Empty Defaults**: When a user signs in, existing cloud progress is retrieved first before initializing state. One account's data will never appear when a different account signs in.
- **Guest Mode Available**: Learners can practice offline without an account; progress is cached in guest storage. When logging in, an explicit modal offers to merge guest practice into the Google account.
- **Strict Firestore Security Rules**: Already deployed and enforced. Rules strictly disallow public reading or listing of user records (`allow list: if false`), permitting users to read and write only their own document where `request.auth.uid == userId`.

### Required Firebase Console Steps
To finalize production access on your Google Cloud / Firebase project:
1. **Enable Google Sign-in Provider**:
   - Open [Firebase Console > Authentication > Sign-in method](https://console.firebase.google.com/project/stellar-nation-w5fd2/authentication/providers).
   - Click on **Google**, toggle **Enable**, select your project support email, and click **Save**.
2. **Authorize Deployed Website Domains**:
   - In [Authentication > Settings > Authorized domains](https://console.firebase.google.com/project/stellar-nation-w5fd2/authentication/settings), add:
     - `ais-dev-mqn7wgfdfvaix5hmx6aqul-923532371505.europe-west2.run.app`
     - `ais-pre-mqn7wgfdfvaix5hmx6aqul-923532371505.europe-west2.run.app`
3. **Security Rules Verification**:
   - The security rules in `firestore.rules` have been compiled and deployed directly to database `ai-studio-nasrdapromotionc-9f93719c-25a0-4c3c-b4b1-1e81300571e8`.

---

## 4. Setup, Development & Production Build

### Prerequisites
- Node.js (v18+ or v20+ recommended)
- npm or bun

### Local Development
```bash
# Install dependencies
npm install

# Start development server on port 3000
npm run dev
```

### Production Build
```bash
# Typecheck and build optimized static assets
npm run build

# Preview production build locally
npm run preview
```

### Static Hosting Guidance
The output in `dist/` is a pure static single-page application (SPA). It can be hosted on Cloud Run, GitHub Pages, Vercel, Netlify, or any static HTTP server. Because it utilizes hash-based routing (`#dashboard`, `#practice`, `#mock`), all direct navigation, page refreshes, and bookmarks work without special server-side URL rewriting.
