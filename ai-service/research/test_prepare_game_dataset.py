import copy
import hashlib
import json
from pathlib import Path
import re
import unittest

from prepare_game_dataset import candidate_questions, prepare

ROOT = Path(__file__).resolve().parents[2]
CATALOG = json.loads(Path(__file__).with_name("bubble-candidates.json").read_text())


def observation(learner, sequence, question=None):
    return dict(learnerId=learner, attemptId=learner + "-attempt", sequence=sequence,
                questionId="bubble-board-v1:" + hashlib.sha256((question or f"{learner}:{sequence}").encode()).hexdigest(),
                kcId="bubble.next_swap.v1", response=sequence % 2, activity="minigame", source="map", isQa=False)


class DatasetTests(unittest.TestCase):
    def test_disjoint_learners_train_only_vocab_and_oov(self):
        rows = [observation(f"learner-{i}", j) for i in range(10) for j in (1, 2, 3)]
        sequences, vocab, splits, report = prepare(rows, CATALOG)
        self.assertEqual(prepare(rows, CATALOG), (sequences, vocab, splits, report))
        self.assertEqual([len(sequences[s]) for s in ("train", "validation", "test")], [6, 2, 2])
        for row in rows:
            self.assertEqual(row["questionId"] in vocab["questionVocab"], splits[row["learnerId"]] == "train")
        for split in ("validation", "test"):
            self.assertTrue(all(q == vocab["questionOovId"] for r in sequences[split] for q in r["questions"]))
        self.assertFalse(report["deploymentReady"])

    def test_one_learner_preserves_cross_attempt_order_and_scores_each_target_once(self):
        rows = [observation("one", j, f"q{j}") for j in range(1, 10)]
        rows[-1]["attemptId"] = "new-attempt"
        rows[-1]["sequence"] = 1
        rows[-1].update(activity="supplementary", exerciseId="bubble-short-v1")
        sequences, vocab, _, report = prepare(rows, CATALOG, sequence_length=4)
        expected = [vocab["questionVocab"][r["questionId"]] for r in rows][1:]
        self.assertEqual([q for s in sequences["train"] for q in s["questions"][1:]], expected)
        self.assertEqual(report["splits"]["train"]["scoredTargets"], 8)
        self.assertEqual(sequences["validation"], [])
        self.assertEqual(sequences["test"], [])

    def test_reject_qa_bad_labels_duplicates_and_disorder(self):
        row = observation("one", 1)
        for patch in ({"isQa": True}, {"response": True}, {"response": 2}, {"questionId": "unknown"}):
            with self.assertRaises(ValueError):
                prepare([{**row, **patch}], CATALOG)
        for rows in ([row, copy.deepcopy(row)], [observation("one", 2), row]):
            with self.assertRaises(ValueError):
                prepare(rows, CATALOG)

    def test_candidate_snapshot_matches_backend_catalog(self):
        source = (ROOT / "backend/src/main/java/edu/algoventure/PracticeCatalog.java").read_text(encoding="utf-8")
        records = re.findall(r'new Exercise\("([^\"]+)".*?List\.of\(([^)]+)\)\)', source, re.S)
        actual = {name: [int(v.strip()) for v in values.split(",")] for name, values in records}
        self.assertEqual(actual, {e["id"]: e["input"] for e in CATALOG["exercises"]})
        for e in candidate_questions(CATALOG):
            self.assertTrue(e["questionId"].startswith("bubble-board-v1:"))
        shifted = dict(CATALOG, exercises=[dict(id="skip", kcId="bubble.next_swap.v1", input=[1, 3, 2])])
        canonical = hashlib.sha256(b"1,3,2|1|2|1").hexdigest()
        self.assertEqual(candidate_questions(shifted)[0]["questionId"], "bubble-board-v1:" + canonical)


if __name__ == "__main__":
    unittest.main()
