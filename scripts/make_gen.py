import json

gen_questions = [
  {
    "id": "GEN-001",
    "subject": "General Public Service Knowledge",
    "category": "General Public Service Knowledge",
    "topic": "Rules and institutions",
    "difficulty": "Easy",
    "question": "If the PSR conflicts with an applicable constitutional provision, how does its application operate?",
    "options": {
      "A": "The conflict cancels all employment contracts",
      "B": "The PSR automatically overrides the Constitution",
      "C": "The Rules apply only to the extent consistent with the Constitution",
      "D": "A cashier decides which text applies"
    },
    "correctAnswer": "C",
    "explanation": "PSR 010102 places the Rules within the applicable constitutional and legal framework.",
    "sourceDocument": "Public Service Rules 2021",
    "sourceReference": "010102",
    "sourceURL": "https://www.ohcsf.gov.ng/wp-content/uploads/2025/09/PUBLIC-SERVICE-RULES.pdf",
    "verificationStatus": "verified",
    "verifiedOn": "2026-10-08",
    "verificationNote": "Checked against the cited source edition or official mission record. A study question, not an official past examination question. Later applicable circulars are not comprehensively covered.",
    "origin": "Newly authored source-based revision question"
  },
  {
    "id": "GEN-002",
    "subject": "General Public Service Knowledge",
    "category": "General Public Service Knowledge",
    "topic": "Rules and institutions",
    "difficulty": "Easy",
    "question": "Who must acquaint himself or herself with the PSR and extant regulations and circulars?",
    "options": {
      "A": "Only Human Resource staff",
      "B": "Every officer",
      "C": "Only newly appointed officers",
      "D": "Only officers writing GL 17 exams"
    },
    "correctAnswer": "B",
    "explanation": "Knowledge of governing service rules is an individual duty rather than a task delegated entirely to HR.",
    "sourceDocument": "Public Service Rules 2021",
    "sourceReference": "010103",
    "sourceURL": "https://www.ohcsf.gov.ng/wp-content/uploads/2025/09/PUBLIC-SERVICE-RULES.pdf",
    "verificationStatus": "verified",
    "verifiedOn": "2026-10-08",
    "verificationNote": "Checked against the cited source edition or official mission record. A study question, not an official past examination question. Later applicable circulars are not comprehensively covered.",
    "origin": "Newly authored source-based revision question"
  },
  {
    "id": "GEN-003",
    "subject": "General Public Service Knowledge",
    "category": "General Public Service Knowledge",
    "topic": "Official communication",
    "difficulty": "Easy",
    "question": "Which set contains the stated classifications of official correspondence?",
    "options": {
      "A": "Blue Yellow Silver and Green",
      "B": "Junior Senior Temporary and Permanent",
      "C": "Restricted Confidential Secret and Top Secret",
      "D": "Annual Recurrent Capital and Special"
    },
    "correctAnswer": "C",
    "explanation": "These are information-security classifications, not colours of Council documents or budget categories.",
    "sourceDocument": "Public Service Rules 2021",
    "sourceReference": "010105 definition of Classified Correspondence",
    "sourceURL": "https://www.ohcsf.gov.ng/wp-content/uploads/2025/09/PUBLIC-SERVICE-RULES.pdf",
    "verificationStatus": "verified",
    "verifiedOn": "2026-10-08",
    "verificationNote": "Checked against the cited source edition or official mission record. A study question, not an official past examination question. Later applicable circulars are not comprehensively covered.",
    "origin": "Newly authored source-based revision question"
  },
  {
    "id": "GEN-004",
    "subject": "General Public Service Knowledge",
    "category": "General Public Service Knowledge",
    "topic": "Rules and institutions",
    "difficulty": "Medium",
    "question": "What does the PSR definition of a promotion cut-off mark link it to?",
    "options": {
      "A": "Awarding automatic promotion to every passer",
      "B": "Determining a supplier's invoice value",
      "C": "Selecting eligible candidates among exam passers in light of declared vacancies",
      "D": "Calculating maternity leave"
    },
    "correctAnswer": "C",
    "explanation": "A pass mark and selection against available vacancies should not be treated as the same guarantee.",
    "sourceDocument": "Public Service Rules 2021",
    "sourceReference": "010105 definition of Cut off Mark",
    "sourceURL": "https://www.ohcsf.gov.ng/wp-content/uploads/2025/09/PUBLIC-SERVICE-RULES.pdf",
    "verificationStatus": "verified",
    "verifiedOn": "2026-10-08",
    "verificationNote": "Checked against the cited source edition or official mission record. A study question, not an official past examination question. Later applicable circulars are not comprehensively covered.",
    "origin": "Newly authored source-based revision question"
  },
  {
    "id": "GEN-005",
    "subject": "General Public Service Knowledge",
    "category": "General Public Service Knowledge",
    "topic": "Rules and institutions",
    "difficulty": "Medium",
    "question": "What is an established post under the PSR definition?",
    "options": {
      "A": "A post provided for under the Personnel Emoluments sub-head of the Estimates",
      "B": "Any unofficial desk created by a supervisor",
      "C": "A vacancy declared only on social media",
      "D": "Any privately funded hobby role"
    },
    "correctAnswer": "A",
    "explanation": "The definition links the post to authorized personnel provision in the Estimates.",
    "sourceDocument": "Public Service Rules 2021",
    "sourceReference": "010105 definition of Established Post",
    "sourceURL": "https://www.ohcsf.gov.ng/wp-content/uploads/2025/09/PUBLIC-SERVICE-RULES.pdf",
    "verificationStatus": "verified",
    "verifiedOn": "2026-10-08",
    "verificationNote": "Checked against the cited source edition or official mission record. A study question, not an official past examination question. Later applicable circulars are not comprehensively covered.",
    "origin": "Newly authored source-based revision question"
  },
  {
    "id": "GEN-006",
    "subject": "General Public Service Knowledge",
    "category": "General Public Service Knowledge",
    "topic": "Equality and conduct",
    "difficulty": "Easy",
    "question": "Do masculine references in the PSR mean the provisions apply only to men?",
    "options": {
      "A": "Yes for disciplinary matters only",
      "B": "Yes unless a woman requests an exemption",
      "C": "Yes except at GL 12",
      "D": "No the Rules apply equally to both genders"
    },
    "correctAnswer": "D",
    "explanation": "The gender rule expressly makes the provisions apply equally despite the drafting convention.",
    "sourceDocument": "Public Service Rules 2021",
    "sourceReference": "010107",
    "sourceURL": "https://www.ohcsf.gov.ng/wp-content/uploads/2025/09/PUBLIC-SERVICE-RULES.pdf",
    "verificationStatus": "verified",
    "verifiedOn": "2026-10-08",
    "verificationNote": "Checked against the cited source edition or official mission record. A study question, not an official past examination question. Later applicable circulars are not comprehensively covered.",
    "origin": "Newly authored source-based revision question"
  },
  {
    "id": "GEN-007",
    "subject": "General Public Service Knowledge",
    "category": "General Public Service Knowledge",
    "topic": "Rules and institutions",
    "difficulty": "Easy",
    "question": "What document must form part of the inventory in all public service offices?",
    "options": {
      "A": "A copy of the Public Service Rules",
      "B": "Only the previous year's timetable",
      "C": "Only a private staff handbook",
      "D": "Only a commercial newspaper"
    },
    "correctAnswer": "A",
    "explanation": "This supports access to the governing Rules at the office level.",
    "sourceDocument": "Public Service Rules 2021",
    "sourceReference": "010108",
    "sourceURL": "https://www.ohcsf.gov.ng/wp-content/uploads/2025/09/PUBLIC-SERVICE-RULES.pdf",
    "verificationStatus": "verified",
    "verifiedOn": "2026-10-08",
    "verificationNote": "Checked against the cited source edition or official mission record. A study question, not an official past examination question. Later applicable circulars are not comprehensively covered.",
    "origin": "Newly authored source-based revision question"
  },
  {
    "id": "GEN-008",
    "subject": "General Public Service Knowledge",
    "category": "General Public Service Knowledge",
    "topic": "Official communication",
    "difficulty": "Medium",
    "question": "How does a petition differ from an appeal in the PSR definition?",
    "options": {
      "A": "It is always an anonymous rumour",
      "B": "It is a formal complaint about a personal matter or general public interest",
      "C": "It is an automatic reversal of a decision",
      "D": "It is a procurement payment voucher"
    },
    "correctAnswer": "B",
    "explanation": "An appeal seeks reconsideration of a decision; a petition is a formal complaint for consideration.",
    "sourceDocument": "Public Service Rules 2021",
    "sourceReference": "110101",
    "sourceURL": "https://www.ohcsf.gov.ng/wp-content/uploads/2025/09/PUBLIC-SERVICE-RULES.pdf",
    "verificationStatus": "verified",
    "verifiedOn": "2026-10-08",
    "verificationNote": "Checked against the cited source edition or official mission record. A study question, not an official past examination question. Later applicable circulars are not comprehensively covered.",
    "origin": "Newly authored source-based revision question"
  },
  {
    "id": "GEN-009",
    "subject": "General Public Service Knowledge",
    "category": "General Public Service Knowledge",
    "topic": "Financial administration",
    "difficulty": "Medium",
    "question": "Who should be consulted on an accounting matter not provided for in the Financial Regulations?",
    "options": {
      "A": "Only the contractor's accountant",
      "B": "Any officer's private banker",
      "C": "Office of the Accountant General",
      "D": "Only a political campaign office"
    },
    "correctAnswer": "C",
    "explanation": "Accounting Officers refer such matters to the Accountant-General; departures require the stated concurrence.",
    "sourceDocument": "Financial Regulations revised to January 2009",
    "sourceReference": "FR 127",
    "sourceURL": "https://oagf.gov.ng/wp-content/uploads/2023/08/Financial-Regulations-and-Rules.pdf",
    "verificationStatus": "verified",
    "verifiedOn": "2026-10-08",
    "verificationNote": "Checked against the cited source edition or official mission record. A study question, not an official past examination question. Later applicable circulars are not comprehensively covered.",
    "origin": "Newly authored source-based revision question"
  },
  {
    "id": "GEN-010",
    "subject": "General Public Service Knowledge",
    "category": "General Public Service Knowledge",
    "topic": "Financial administration",
    "difficulty": "Medium",
    "question": "Under whose authority are general Treasury-numbered accounting forms issued?",
    "options": {
      "A": "Accountant General",
      "B": "Only contractors",
      "C": "Only commercial printers",
      "D": "Every individual cashier acting privately"
    },
    "correctAnswer": "A",
    "explanation": "Standard forms support uniform accountability; special-use forms also need the required authority.",
    "sourceDocument": "Financial Regulations revised to January 2009",
    "sourceReference": "FR 3001",
    "sourceURL": "https://oagf.gov.ng/wp-content/uploads/2023/08/Financial-Regulations-and-Rules.pdf",
    "verificationStatus": "verified",
    "verifiedOn": "2026-10-08",
    "verificationNote": "Checked against the cited source edition or official mission record. A study question, not an official past examination question. Later applicable circulars are not comprehensively covered.",
    "origin": "Newly authored source-based revision question"
  }
]

with open("scripts/gen.json", "w", encoding="utf-8") as f:
    json.dump(gen_questions, f, indent=2)

print(f"GEN written: {len(gen_questions)} items")
