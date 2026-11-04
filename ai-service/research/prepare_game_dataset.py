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


def validate_rows(rows):
    seen, previous = set(), {}
    for row in rows:
        if (not isinstance(row.get("learnerId"), str) or not row["learnerId"]
                or not isinstance(row.get("attemptId"), str) or not row["attemptId"]
                or type(row.get("sequence")) is not int or row["sequence"] < 1
                or type(row.get("response")) is not int or row["response"] not in (0, 1)
                or row.get("kcId") != KC
                or not re.fullmatch(r"bubble-board-v1:[0-9a-f]{64}", row.get("questionId", ""))
                or row.get("activity") not in ("minigame", "supplementary")
                or row.get("source") not in ("map", "classroom")
                or row.get("isQa") is not False
                or (row["activity"] == "supplementary" and not row.get("exerciseId"))):
            raise ValueError("Invalid observation or QA data included")
        attempt = row["learnerId"], row["attemptId"]
        identity = (*attempt, row["sequence"])
        if identity in seen or row["sequence"] <= previous.get(attempt, 0):
            raise ValueError("Duplicate or out-of-order observation")
        seen.add(identity)
        previous[attempt] = row["sequence"]


def candidate_questions(catalog):
    if catalog.get("schemaVersion") != 1 or catalog.get("encodingVersion") != "bubble-board-v1":
        raise ValueError("Incompatible catalog")
    result = []
    for exercise in catalog["exercises"]:
        values = exercise["input"]
        if (exercise["kcId"] != KC or not 2 <= len(values) <= 8
                or any(type(v) is not int or not -99 <= v <= 99 for v in values)):
            raise ValueError("Incompatible exercise")
        # BubbleTrace skips automatic keeps before the first required swap.
        pair = next((i for i in range(len(values) - 1) if values[i] > values[i + 1]), None)
        if pair is None:
            raise ValueError("Exercise has no learner swap opportunity")
        board = dict(items=[dict(value=v) for v in values], pair=pair, end=len(values) - 1, **{"pass": 1})
        result.append(dict(id=exercise["id"], questionId=question_id(board), kcId=KC))
    if not result or len({r["id"] for r in result}) != len(result):
        raise ValueError("Empty or duplicate catalog")
    return result


def prepare(rows, catalog, seed=42, sequence_length=200):
    if not 2 <= sequence_length <= 200:
        raise ValueError("Sequence length must be 2..200")
    validate_rows(rows)
    grouped = defaultdict(list)
    for row in rows:
        grouped[row["learnerId"]].append(row)
    # Deterministic for an identical snapshot/key/seed; freeze split file for a study.
    learners = sorted(grouped, key=lambda uid: hashlib.sha256(f"{seed}:{uid}".encode()).hexdigest())
    heldout = max(1, len(learners) // 5) if len(learners) >= 3 else 0
    assignment = {uid: ("validation" if i < heldout else "test" if i < 2 * heldout else "train")
                  for i, uid in enumerate(learners)}
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
    for candidate in candidate_questions(catalog):
        matching = [r for r in train_rows if r["questionId"] == candidate["questionId"]]
        coverage.append(dict(**candidate, inTrainVocab=candidate["questionId"] in qv,
                             trainObservations=len(matching),
                             trainLearners=len({r["learnerId"] for r in matching})))
    report = dict(schemaVersion=1, encodingVersion="bubble-board-v1",
                  predictionTarget="first_swap_opportunity", sequenceLength=sequence_length,
                  splitSeed=seed, splitMethod="learner-disjoint snapshot hash rank; approximately 60/20/20",
                  splits={split: {**dict(counts[split]), "sequences": len(sequences[split])} for split in SPLITS},
                  candidateCoverage=coverage, datasetPrepared=bool(sequences["train"]),
                  evaluationDeferred=True, deploymentReady=False,
                  warnings=[])
    if len(learners) < 3:
        report["warnings"].append("Fewer than 3 learners: all data stays in train; validation/test are empty.")
    if any(not c["inTrainVocab"] for c in coverage):
        report["warnings"].append("Some practice candidates are missing from training vocabulary.")
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
