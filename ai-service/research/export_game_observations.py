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
import re
import secrets
import subprocess

QUERY = """
SELECT json_build_object(
 'userId',a.user_id,'attemptId',a.client_attempt_id,'lessonId',a.lesson_id,
 'sequence',i.sequence_no,'arrival',a.received_at,
 'metadata',a.metadata::jsonb,'evaluation',i.evaluation::jsonb,
 'isQa',lower(u.email) LIKE 'qa.%' OR lower(u.email) LIKE '%@example.test')
FROM learning_attempts a
JOIN app_users u ON u.id=a.user_id
JOIN learning_interactions i ON i.user_id=a.user_id AND i.client_attempt_id=a.client_attempt_id
WHERE i.evaluation::jsonb->>'firstResponse'='true'
ORDER BY a.received_at,a.client_attempt_id,i.sequence_no
"""

ALL_QUERY = QUERY.replace("WHERE i.evaluation::jsonb->>'firstResponse'='true'",
                          "WHERE i.kind IN ('move','action')")


def question_id(snapshot):
    values = ",".join(str(item["value"]) for item in snapshot["items"])
    canonical = f'{values}|{snapshot["pair"]}|{snapshot["end"]}|{snapshot["pass"]}'
    return "bubble-board-v1:" + hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def transform(rows, key, include_qa=False, *, encoding_version="bubble-board-v1",
              prediction_target="first_swap_opportunity"):
    observations = []
    seen = set()
    excluded, out_of_scope = 0, 0
    bubble = encoding_version == "bubble-board-v1" and prediction_target == "first_swap_opportunity"
    def pseudonym(kind, value):
        return hmac.new(key, f"{kind}:{value}".encode(), hashlib.sha256).hexdigest()
    for row in sorted(rows, key=lambda item: (item.get("arrival", ""), item["attemptId"], item["sequence"])):
        e, m = row["evaluation"], row["metadata"]
        if (m.get("engineVersion") != "bubble-v1" if bubble else
                e.get("encodingVersion") != encoding_version or e.get("predictionTarget") != prediction_target):
            out_of_scope += 1
            continue
        if row["isQa"] and not include_qa:
            excluded += 1
            continue
        identity = (row["userId"], row["attemptId"], row["sequence"])
        if identity in seen:
            raise ValueError("Duplicate observation")
        seen.add(identity)
        if (e.get("firstResponse") is not True or type(e.get("correct")) is not bool
                or not isinstance(e.get("kcId"), str)
                or (bubble and e.get("kcId") != "bubble.next_swap.v1")
                or (not bubble and e.get("serverVerified") is not True)):
            raise ValueError("Incompatible observation")
        qid = question_id(e["before"]) if bubble else e.get("questionId")
        if not isinstance(qid, str) or not re.fullmatch(re.escape(encoding_version) + r":[0-9a-f]{64}", qid):
            raise ValueError("Incompatible question ID")
        observations.append(dict(
            learnerId=pseudonym("learner", row["userId"]),
            attemptId=pseudonym("attempt", row["attemptId"]),
            sequence=row["sequence"], questionId=qid,
            kcId=e["kcId"], response=int(e["correct"]),
            activity=m.get("activity") or "minigame", source=m["source"],
            exerciseId=m.get("exerciseId"), isQa=row["isQa"],
            lessonId=e.get("lessonId") or m.get("lessonId") or row.get("lessonId") or ("bubble" if bubble else None),
            encodingVersion=encoding_version, predictionTarget=prediction_target,
            serverVerified=True,
            inputVerified=e.get("inputVerified"),
            inputProvenance=e.get("inputProvenance") or ("legacy_bubble_trace" if bubble else "not_recorded")))
    counts = Counter(o["activity"] for o in observations)
    report = dict(schemaVersion=1, encodingVersion=encoding_version,
                  predictionTarget=prediction_target, observations=len(observations),
                  learners=len({o["learnerId"] for o in observations}),
                  attempts=len({(o["learnerId"], o["attemptId"]) for o in observations}),
                  questions=len({o["questionId"] for o in observations}),
                  correct=sum(o["response"] for o in observations),
                  activityCounts=dict(counts), excludedQaObservations=excluded,
                  excludedOutOfScopeObservations=out_of_scope,
                  includesQa=include_qa, trainingApproved=False,
                  limitations=["Non-QA accounts are not verified study participants.",
                               "Split by learner before fitting vocabulary or training; never split random events.",
                               "Training readiness requires held-out learner validation and candidate vocabulary coverage.",
                               "The dataset does not establish unassisted mastery or learning gains."])
    return observations, report


def transform_all(rows, key, include_qa=False, expected_lessons=()):
    """Export only graded first responses, preserving contract and input trust provenance."""
    grouped, excluded = {}, Counter()
    observed_lessons = set(expected_lessons)
    for row in rows:
        evaluation, metadata = row.get("evaluation", {}), row.get("metadata", {})
        lesson = evaluation.get("lessonId") or metadata.get("lessonId") or row.get("lessonId")
        if lesson:
            observed_lessons.add(lesson)
        if evaluation.get("firstResponse") is not True:
            excluded["not_first_response"] += 1
            continue
        if metadata.get("engineVersion") == "bubble-v1":
            contract = "bubble-board-v1", "first_swap_opportunity"
        elif (evaluation.get("encodingVersion") == "game-state-v1"
              and evaluation.get("predictionTarget") == "next_action"):
            if evaluation.get("serverVerified") is not True:
                excluded["not_server_graded"] += 1
                continue
            contract = "game-state-v1", "next_action"
        else:
            excluded["unsupported_contract"] += 1
            continue
        grouped.setdefault(contract, []).append(row)
    observations, reports = [], []
    for (encoding, target), group in sorted(grouped.items()):
        converted, report = transform(group, key, include_qa, encoding_version=encoding,
                                      prediction_target=target)
        observations.extend(converted)
        reports.append(report)
    lesson_coverage = []
    for lesson in sorted(observed_lessons | {r["lessonId"] for r in observations if r["lessonId"]}):
        selected = [r for r in observations if r["lessonId"] == lesson]
        lesson_coverage.append(dict(lessonId=lesson, observations=len(selected),
                                    learners=len({r["learnerId"] for r in selected}),
                                    questions=len({r["questionId"] for r in selected}),
                                    inputProvenanceCounts=dict(Counter(r["inputProvenance"] for r in selected)),
                                    dataAvailable=bool(selected), trainingApproved=False,
                                    reasonCode="quality_evaluation_required" if selected else "no_verified_observations"))
    report = dict(schemaVersion=1, observations=len(observations), contracts=reports,
                  excludedObservations=dict(excluded), lessonCoverage=lesson_coverage,
                  includesQa=include_qa, trainingApproved=False,
                  inputProvenanceCounts=dict(Counter(r["inputProvenance"] for r in observations)),
                  limitations=["Server-graded correctness does not imply a server-issued initial challenge.",
                               "Preserve inputProvenance when evaluating data quality.",
                               "No model quality or deployment approval follows from this export."])
    return observations, report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--psql", default="psql")
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--include-qa", action="store_true", help="Pipeline debugging only")
    parser.add_argument("--encoding-version", default="bubble-board-v1")
    parser.add_argument("--prediction-target", default="first_swap_opportunity")
    parser.add_argument("--all-contracts", action="store_true",
                        help="Export Bubble and verified game-state-v1 observations, separated by contract")
    parser.add_argument("--curriculum", type=Path, help="Optional backend curriculum.json for zero-data lesson coverage")
    args = parser.parse_args()
    result = subprocess.run([args.psql, "-X", "-qAt", "-v", "ON_ERROR_STOP=1", "-c", ALL_QUERY if args.all_contracts else QUERY],
                            capture_output=True, text=True, encoding="utf-8", timeout=60)
    if result.returncode:
        # Do not echo database stderr (it can include connection details).
        raise RuntimeError("PostgreSQL export failed; check PG* environment and server availability")
    rows = [json.loads(line) for line in result.stdout.splitlines() if line.strip()]
    args.output.mkdir(parents=True, exist_ok=True)
    key_path = args.output / "pseudonym.key"
    if not key_path.exists():
        key_path.write_bytes(secrets.token_bytes(32))
    if args.all_contracts:
        lessons = []
        if args.curriculum:
            lessons = [lesson[0] for topic in json.loads(args.curriculum.read_text(encoding="utf-8"))
                       for lesson in topic["lessons"]]
        observations, report = transform_all(rows, key_path.read_bytes(), args.include_qa, lessons)
        for contract in report["contracts"]:
            folder = args.output / "contracts" / (contract["encodingVersion"] + "--" + contract["predictionTarget"])
            folder.mkdir(parents=True, exist_ok=True)
            selected = [r for r in observations if r["encodingVersion"] == contract["encodingVersion"]
                        and r["predictionTarget"] == contract["predictionTarget"]]
            (folder / "observations.jsonl").write_text("".join(json.dumps(r) + "\n" for r in selected), encoding="utf-8")
            (folder / "readiness.json").write_text(json.dumps(contract, indent=2), encoding="utf-8")
    else:
        observations, report = transform(rows, key_path.read_bytes(), args.include_qa,
                                         encoding_version=args.encoding_version,
                                         prediction_target=args.prediction_target)
    (args.output / "observations.jsonl").write_text(
        "".join(json.dumps(o) + "\n" for o in observations), encoding="utf-8")
    (args.output / "readiness.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
