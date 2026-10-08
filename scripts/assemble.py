import json
import os

files = [
    "scripts/space1.json",
    "scripts/space2.json",
    "scripts/space3.json",
    "scripts/psr1.json",
    "scripts/psr2.json",
    "scripts/fr1.json",
    "scripts/fr2.json",
    "scripts/gen.json"
]

all_questions = []
for file_path in files:
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        all_questions.extend(data)

# Validation
seen_ids = set()
subject_counts = {}

for idx, q in enumerate(all_questions):
    qid = q.get("id")
    if not qid or qid in seen_ids:
        raise ValueError(f"Record #{idx} invalid or duplicate id: {qid}")
    seen_ids.add(qid)

    # Check question
    if not q.get("question") or not q["question"].strip():
        raise ValueError(f"Record {qid} has empty question")

    # Check options
    options = q.get("options", {})
    keys = ["A", "B", "C", "D"]
    if not all(k in options for k in keys):
        raise ValueError(f"Record {qid} missing options A-D")

    opt_values = [options[k].strip() for k in keys]
    if any(not v for v in opt_values):
        raise ValueError(f"Record {qid} has empty option value")
    if len(set(opt_values)) != 4:
        raise ValueError(f"Record {qid} options are not 4 distinct values: {options}")

    # Check correctAnswer
    ca = q.get("correctAnswer")
    if ca not in keys:
        raise ValueError(f"Record {qid} invalid correctAnswer: {ca}")

    # Check explanation & sources
    if not q.get("explanation") or not q["explanation"].strip():
        raise ValueError(f"Record {qid} has empty explanation")
    if not q.get("sourceDocument") or not q["sourceDocument"].strip():
        raise ValueError(f"Record {qid} has empty sourceDocument")

    sub = q.get("subject", "Unknown")
    subject_counts[sub] = subject_counts.get(sub, 0) + 1

print("--- VALIDATION PASSED ---")
print(f"Total questions: {len(all_questions)}")
for sub, count in subject_counts.items():
    print(f"  {sub}: {count}")

expected_counts = {
    "Public Service Rules": 60,
    "Financial Regulations": 61,
    "Space Law and Policy": 96,
    "General Public Service Knowledge": 10
}

for sub, exp in expected_counts.items():
    actual = subject_counts.get(sub, 0)
    if actual != exp:
        raise ValueError(f"Subject count mismatch for {sub}: expected {exp}, got {actual}")

# Write to src/data/questions.json
os.makedirs("src/data", exist_ok=True)
json_out = "src/data/questions.json"
with open(json_out, "w", encoding="utf-8") as f:
    json.dump(all_questions, f, indent=2)
print(f"Successfully wrote {json_out} ({len(all_questions)} items)")

# Write src/data/bundledQuestions.ts
ts_out = "src/data/bundledQuestions.ts"
with open(ts_out, "w", encoding="utf-8") as f:
    f.write('import { Question } from "../types";\n\n')
    f.write('export const BUNDLED_QUESTIONS: Question[] = ')
    f.write(json.dumps(all_questions, indent=2))
    f.write(' as Question[];\n')
print(f"Successfully wrote {ts_out}")
