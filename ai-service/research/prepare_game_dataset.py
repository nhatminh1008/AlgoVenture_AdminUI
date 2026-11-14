"""Prepare learner-disjoint simpleKT data; vocab is fitted on training only."""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
import hashlib
import json
from pathlib import Path
import re

from export_game_observations import question_id

KC = "bubble.next_swap.v1"
SPLITS = ("train", "validation", "test")
IDENTIFIER = re.compile(r"[a-z][a-z0-9._-]*")


def learner_split(seed, learner_id):
    """Stable split: adding learners never moves an existing learner."""
    bucket = int.from_bytes(hashlib.sha256(f"{seed}:{learner_id}".encode()).digest()[:8], "big") % 10
    return "train" if bucket < 6 else "validation" if bucket < 8 else "test"


def validate_rows(rows, encoding_version):
    seen, previous = set(), {}
    for row in rows:
        if (not isinstance(row.get("learnerId"), str) or not row["learnerId"]
                or not isinstance(row.get("attemptId"), str) or not row["attemptId"]
                or type(row.get("sequence")) is not int or row["sequence"] < 1
                or type(row.get("response")) is not int or row["response"] not in (0, 1)
                or not isinstance(row.get("kcId"), str) or not IDENTIFIER.fullmatch(row["kcId"])
                or not re.fullmatch(re.escape(encoding_version) + r":[0-9a-f]{64}", row.get("questionId", ""))
                or row.get("activity") not in ("minigame", "supplementary")
                or row.get("source") not in ("map", "classroom")
                or row.get("isQa") is not False
                or (encoding_version != "bubble-board-v1" and row.get("serverVerified") is not True)
                or (row["activity"] == "supplementary" and not row.get("exerciseId"))):
            raise ValueError("Invalid observation or QA data included")
        attempt = row["learnerId"], row["attemptId"]
        identity = (*attempt, row["sequence"])
        if identity in seen or row["sequence"] <= previous.get(attempt, 0):
            raise ValueError("Duplicate or out-of-order observation")
        seen.add(identity)
        previous[attempt] = row["sequence"]


def candidate_questions(catalog):
    encoding = catalog.get("encodingVersion")
    if (catalog.get("schemaVersion") != 1 or not isinstance(encoding, str)
            or not IDENTIFIER.fullmatch(encoding)):
        raise ValueError("Incompatible catalog")
    result = []
    for exercise in catalog["exercises"]:
        kc = exercise.get("kcId")
        if not isinstance(kc, str) or not IDENTIFIER.fullmatch(kc):
            raise ValueError("Incompatible exercise KC")
        supplied = exercise.get("questionId")
        if supplied is not None:
            if not re.fullmatch(re.escape(encoding) + r":[0-9a-f]{64}", supplied):
                raise ValueError("Incompatible exercise question ID")
            qid = supplied
        else:
            values = exercise["input"]
            if (encoding != "bubble-board-v1" or kc != KC or not 2 <= len(values) <= 8
                    or any(type(v) is not int or not -99 <= v <= 99 for v in values)):
                raise ValueError("Incompatible exercise")
            # BubbleTrace skips automatic keeps before the first required swap.
            pair = next((i for i in range(len(values) - 1) if values[i] > values[i + 1]), None)
            if pair is None:
                raise ValueError("Exercise has no learner swap opportunity")
            board = dict(items=[dict(value=v) for v in values], pair=pair, end=len(values) - 1, **{"pass": 1})
            qid = question_id(board)
        lesson = exercise.get("lessonId", "bubble" if encoding == "bubble-board-v1" else None)
        if lesson is not None and (not isinstance(lesson, str) or not re.fullmatch(r"[a-z][a-z0-9-]{0,49}", lesson)):
            raise ValueError("Invalid candidate lesson ID")
        result.append(dict(id=exercise["id"], questionId=qid, kcId=kc, lessonId=lesson))
    if not result or len({r["id"] for r in result}) != len(result):
        raise ValueError("Empty or duplicate catalog")
    return result


def prepare(rows, catalog, seed=42, sequence_length=200):
    if not 2 <= sequence_length <= 200:
        raise ValueError("Sequence length must be 2..200")
    candidates = candidate_questions(catalog)
    encoding = catalog["encodingVersion"]
    target = catalog.get("predictionTarget", "first_swap_opportunity" if encoding == "bubble-board-v1" else None)
    if not isinstance(target, str) or not IDENTIFIER.fullmatch(target):
        raise ValueError("Missing prediction target")
    all_rows = rows
    rows = [r for r in rows if r.get("encodingVersion", encoding) == encoding
            and r.get("predictionTarget", target) == target]
    validate_rows(rows, encoding)
    grouped = defaultdict(list)
    for row in rows:
        grouped[row["learnerId"]].append(row)
    learners = sorted(grouped)
    assignment = {uid: learner_split(seed, uid) for uid in learners}
    train_rows = [r for r in rows if assignment[r["learnerId"]] == "train"]
    qv = {qid: i for i, qid in enumerate(sorted({r["questionId"] for r in train_rows}))}
    cv = {cid: i for i, cid in enumerate(sorted({r["kcId"] for r in train_rows}))}
    vocab = dict(questionVocab=qv, kcVocab=cv, questionOovId=len(qv), kcOovId=len(cv),
                 numQuestions=len(qv) + 1, numConcepts=len(cv) + 1)
    sequences = {split: [] for split in SPLITS}
    counts = {split: Counter(dict.fromkeys(("learners", "observations", "questionOov", "kcOov", "correct", "scoredTargets"), 0))
              for split in SPLITS}
    for uid in learners:
        history = grouped[uid]
        split = assignment[uid]
        count = counts[split]
        count["learners"] += 1
        count["observations"] += len(history)
        count["questionOov"] += sum(r["questionId"] not in qv for r in history)
        count["kcOov"] += sum(r["kcId"] not in cv for r in history)
        count["correct"] += sum(r["response"] for r in history)
        # Sliding windows score every response after the first exactly once.
        # Short windows are not padded here; batching is the trainer's responsibility.
        for start in range(0, len(history) - 1, sequence_length - 1):
            window = history[start:start + sequence_length]
            sequences[split].append(dict(
                learnerId=uid, start=start,
                questions=[qv.get(r["questionId"], len(qv)) for r in window],
                concepts=[cv.get(r["kcId"], len(cv)) for r in window],
                responses=[r["response"] for r in window]))
            count["scoredTargets"] += len(window) - 1
    coverage = []
    for candidate in candidates:
        matching = [r for r in train_rows if r["questionId"] == candidate["questionId"]]
        coverage.append(dict(**candidate, inTrainVocab=candidate["questionId"] in qv,
                             trainObservations=len(matching),
                             trainLearners=len({r["learnerId"] for r in matching})))
    report = dict(schemaVersion=1, encodingVersion=encoding,
                  predictionTarget=target, sequenceLength=sequence_length,
                  splitSeed=seed, splitMethod="learner-disjoint stable hash bucket; approximately 60/20/20",
                  splits={split: {**dict(counts[split]), "sequences": len(sequences[split])} for split in SPLITS},
                  candidateCoverage=coverage, datasetPrepared=bool(sequences["train"]),
                  excludedOtherContracts=len(all_rows) - len(rows),
                  inputProvenanceCounts=dict(Counter(r.get("inputProvenance", "not_recorded") for r in rows)),
                  evaluationDeferred=True, deploymentReady=False,
                  warnings=[])
    lesson_ids = {r.get("lessonId") for r in rows + candidates if r.get("lessonId")}
    report["lessonCoverage"] = []
    for lesson in sorted(lesson_ids):
        observations = [r for r in rows if r.get("lessonId") == lesson]
        eligible = [r for r in coverage if r.get("lessonId") == lesson]
        report["lessonCoverage"].append(dict(lessonId=lesson, observations=len(observations),
            learners=len({r["learnerId"] for r in observations}), candidates=len(eligible),
            candidatesInTrainVocab=sum(r["inTrainVocab"] for r in eligible),
            inputProvenanceCounts=dict(Counter(r.get("inputProvenance", "not_recorded") for r in observations)),
            deploymentReady=False, reasonCode="quality_evaluation_required" if observations else "no_verified_observations"))
    if not all(counts[split]["learners"] for split in SPLITS):
        report["warnings"].append("At least one learner split is empty; evaluation is unavailable.")
    if any(not c["inTrainVocab"] for c in coverage):
        report["warnings"].append("Some practice candidates are missing from training vocabulary.")
    if any(r.get("inputProvenance") == "validated_client_snapshot" for r in rows):
        report["warnings"].append("Some inputs were client supplied and server graded; they were not server-issued challenges.")
    report["warnings"].append("Prepared data does not certify participant identity, calibration or model quality.")
    return sequences, vocab, assignment, report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--observations", type=Path, required=True)
    parser.add_argument("--catalog", type=Path, default=Path(__file__).with_name("bubble-candidates.json"))
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--sequence-length", type=int, default=200)
    args = parser.parse_args()
    raw = args.observations.read_bytes()
    catalog_raw = args.catalog.read_bytes()
    rows = [json.loads(line) for line in raw.decode("utf-8").splitlines() if line.strip()]
    sequences, vocab, assignment, report = prepare(rows, json.loads(catalog_raw), args.seed, args.sequence_length)
    report["observationsSha256"] = hashlib.sha256(raw).hexdigest()
    report["catalogSha256"] = hashlib.sha256(catalog_raw).hexdigest()
    args.output.mkdir(parents=True, exist_ok=True)
    for split, records in sequences.items():
        (args.output / f"{split}.jsonl").write_text("".join(json.dumps(r) + "\n" for r in records), encoding="utf-8")
    for name, obj in (("vocab.json", vocab), ("learner-splits.json", assignment), ("dataset.json", report)):
        (args.output / name).write_text(json.dumps(obj, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
