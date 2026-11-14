import copy
import hashlib
import json
import os
from pathlib import Path
import re
import unittest

from prepare_game_dataset import candidate_questions, learner_split, prepare

ROOT = Path(__file__).resolve().parents[2]
BACKEND = Path(os.environ.get("ALGOVENTURE_BACKEND_ROOT", ROOT.parent / "AlgoVenture_Backend"))
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
        self.assertEqual([len(sequences[s]) for s in ("train", "validation", "test")], [6, 1, 3])
        for row in rows:
            self.assertEqual(row["questionId"] in vocab["questionVocab"], splits[row["learnerId"]] == "train")
        for split in ("validation", "test"):
            self.assertTrue(all(q == vocab["questionOovId"] for r in sequences[split] for q in r["questions"]))
        self.assertFalse(report["deploymentReady"])

    def test_one_learner_preserves_cross_attempt_order_and_scores_each_target_once(self):
        rows = [observation("learner-0", j, f"q{j}") for j in range(1, 10)]
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

    def test_stable_learner_split_and_generic_verified_kc(self):
        original = [observation(f"learner-{i}", j) for i in range(10) for j in (1, 2)]
        split = prepare(original, CATALOG)[2]
        expanded = original + [observation("new-learner", j) for j in (1, 2)]
        self.assertEqual(split, {key: value for key, value in prepare(expanded, CATALOG)[2].items()
                                 if key in split})
        self.assertEqual(split["learner-0"], learner_split(42, "learner-0"))
        generic = dict(schemaVersion=1, encodingVersion="game-state-v1", predictionTarget="next_action",
                       exercises=[dict(id="graph-bfs-easy-v1", kcId="graph.bfs.next_node.v1",
                                       questionId="game-state-v1:" + "a" * 64)])
        rows = [{**observation("learner-0", j), "kcId": "graph.bfs.next_node.v1",
                 "serverVerified": True,
                 "questionId": "game-state-v1:" + hashlib.sha256(str(j).encode()).hexdigest()}
                for j in (1, 2)]
        _, vocab, _, report = prepare(rows, generic)
        self.assertIn("graph.bfs.next_node.v1", vocab["kcVocab"])
        self.assertEqual(report["predictionTarget"], "next_action")
        self.assertEqual(report["encodingVersion"], "game-state-v1")

    def test_candidate_snapshot_matches_backend_catalog(self):
        catalog_source = BACKEND / "src/main/java/edu/algoventure/service/impl/PracticeCatalogServiceImpl.java"
        if not catalog_source.is_file():
            self.skipTest("Backend checkout is unavailable; set ALGOVENTURE_BACKEND_ROOT")
        source = catalog_source.read_text(encoding="utf-8")
        records = re.findall(r'new Exercise\("([^\"]+)".*?List\.of\(([^)]+)\)\)', source, re.S)
        actual = {name: [int(v.strip()) for v in values.split(",")] for name, values in records}
        self.assertEqual(actual, {e["id"]: e["input"] for e in CATALOG["exercises"]})
        for e in candidate_questions(CATALOG):
            self.assertTrue(e["questionId"].startswith("bubble-board-v1:"))
        shifted = dict(CATALOG, exercises=[dict(id="skip", kcId="bubble.next_swap.v1", input=[1, 3, 2])])
        canonical = hashlib.sha256(b"1,3,2|1|2|1").hexdigest()
        self.assertEqual(candidate_questions(shifted)[0]["questionId"], "bubble-board-v1:" + canonical)

    def test_mixed_contract_export_is_partitioned_without_dropping_provenance(self):
        generic = dict(schemaVersion=1, encodingVersion="game-state-v1", predictionTarget="next_action",
            exercises=[dict(id="graph-one", lessonId="graph-basics", kcId="graph-basics.next_action.v1",
                            questionId="game-state-v1:" + "a" * 64)])
        rows = [{**observation("learner-0", j), "lessonId": "graph-basics",
                 "encodingVersion": "game-state-v1", "predictionTarget": "next_action",
                 "questionId": "game-state-v1:" + "a" * 64, "kcId": "graph-basics.next_action.v1",
                 "inputProvenance": "validated_client_snapshot"} for j in (1, 2)]
        for row in rows:
            row["serverVerified"] = True
        rows.append({**observation("bubble-learner", 1), "encodingVersion": "bubble-board-v1",
                     "predictionTarget": "first_swap_opportunity", "lessonId": "bubble"})
        _, _, _, report = prepare(rows, generic)
        self.assertEqual(1, report["excludedOtherContracts"])
        self.assertEqual({"validated_client_snapshot": 2}, report["inputProvenanceCounts"])
        self.assertEqual("graph-basics", report["lessonCoverage"][0]["lessonId"])
        self.assertFalse(report["lessonCoverage"][0]["deploymentReady"])
        rows[0]["serverVerified"] = False
        with self.assertRaises(ValueError):
            prepare(rows, generic)


if __name__ == "__main__":
    unittest.main()
