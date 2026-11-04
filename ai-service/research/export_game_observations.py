"""Export server-validated first responses using psql and standard PG* env vars.

Output is a dataset preparation artifact, never a deployment approval.
"""
from __future__ import annotations

import argparse
from collections import Counter
import hashlib
import hmac
import json
from pathlib import Path
import secrets
import subprocess

QUERY = """
SELECT json_build_object(
 'userId',a.user_id,'attemptId',a.client_attempt_id,
 'sequence',i.sequence_no,'arrival',a.received_at,
 'metadata',a.metadata::jsonb,'evaluation',i.evaluation::jsonb,
 'isQa',lower(u.email) LIKE 'qa.%')
FROM learning_attempts a
JOIN app_users u ON u.id=a.user_id
JOIN learning_interactions i ON i.user_id=a.user_id AND i.client_attempt_id=a.client_attempt_id
WHERE a.lesson_id='bubble' AND i.kind='move'
 AND i.evaluation::jsonb->>'firstResponse'='true'
ORDER BY a.received_at,a.client_attempt_id,i.sequence_no
"""


def question_id(snapshot):
    values = ",".join(str(item["value"]) for item in snapshot["items"])
    canonical = f'{values}|{snapshot["pair"]}|{snapshot["end"]}|{snapshot["pass"]}'
    return "bubble-board-v1:" + hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def transform(rows, key, include_qa=False):
    observations = []
    seen = set()
    excluded = 0
    def pseudonym(kind, value):
        return hmac.new(key, f"{kind}:{value}".encode(), hashlib.sha256).hexdigest()
    for row in rows:
        if row["isQa"] and not include_qa:
            excluded += 1
            continue
        identity = (row["userId"], row["attemptId"], row["sequence"])
        if identity in seen:
            raise ValueError("Duplicate observation")
        seen.add(identity)
        e, m = row["evaluation"], row["metadata"]
        if (e.get("firstResponse") is not True or type(e.get("correct")) is not bool
                or e.get("kcId") != "bubble.next_swap.v1" or m.get("engineVersion") != "bubble-v1"):
            raise ValueError("Incompatible observation")
        observations.append(dict(
            learnerId=pseudonym("learner", row["userId"]),
            attemptId=pseudonym("attempt", row["attemptId"]),
            sequence=row["sequence"], questionId=question_id(e["before"]),
            kcId=e["kcId"], response=int(e["correct"]),
            activity=m.get("activity") or "minigame", source=m["source"],
            exerciseId=m.get("exerciseId"), isQa=row["isQa"]))
    counts = Counter(o["activity"] for o in observations)
    report = dict(schemaVersion=1, encodingVersion="bubble-board-v1",
                  predictionTarget="first_swap_opportunity", observations=len(observations),
                  learners=len({o["learnerId"] for o in observations}),
                  attempts=len({o["attemptId"] for o in observations}),
                  questions=len({o["questionId"] for o in observations}),
                  correct=sum(o["response"] for o in observations),
                  activityCounts=dict(counts), excludedQaObservations=excluded,
                  includesQa=include_qa, trainingApproved=False,
                  limitations=["Non-QA accounts are not verified study participants.",
                               "Split by learner before fitting vocabulary or training; never split random events.",
                               "Training readiness requires held-out learner validation and candidate vocabulary coverage.",
                               "The dataset does not establish unassisted mastery or learning gains."])
    return observations, report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--psql", default="psql")
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--include-qa", action="store_true", help="Pipeline debugging only")
    args = parser.parse_args()
    result = subprocess.run([args.psql, "-X", "-qAt", "-v", "ON_ERROR_STOP=1", "-c", QUERY],
                            capture_output=True, text=True, encoding="utf-8", timeout=60)
    if result.returncode:
        # Do not echo database stderr (it can include connection details).
        raise RuntimeError("PostgreSQL export failed; check PG* environment and server availability")
    rows = [json.loads(line) for line in result.stdout.splitlines() if line.strip()]
    args.output.mkdir(parents=True, exist_ok=True)
    key_path = args.output / "pseudonym.key"
    if not key_path.exists():
        key_path.write_bytes(secrets.token_bytes(32))
    observations, report = transform(rows, key_path.read_bytes(), args.include_qa)
    (args.output / "observations.jsonl").write_text(
        "".join(json.dumps(o) + "\n" for o in observations), encoding="utf-8")
    (args.output / "readiness.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
