"""Opt-in integration tests against an actual exported Game artifact."""
import json
import os
from pathlib import Path
import unittest

from fastapi.testclient import TestClient

from app import app
from tutor import Tutor


@unittest.skipUnless(os.environ.get("AI_TEST_MANIFEST"), "Set AI_TEST_MANIFEST to run real-artifact tests")
class ExperimentalArtifactTests(unittest.TestCase):
    def setUp(self):
        self.path = Path(os.environ["AI_TEST_MANIFEST"])
        manifest = json.loads(self.path.read_text(encoding="utf-8"))
        self.qid = next(iter(manifest["questionVocab"]))
        self.kc = "bubble.next_swap.v1"
        self.history = [dict(questionId=self.qid, kcId=self.kc, response=1)]
        self.candidates = [dict(id="known", questionId=self.qid, kcId=self.kc)]

    def test_real_artifact_requires_explicit_experimental_mode(self):
        blocked = Tutor(str(self.path))
        self.assertIsNone(blocked.session)
        self.assertEqual("artifact_invalid", blocked.reason)
        tutor = Tutor(str(self.path), allow_experimental=True)
        self.assertEqual("experimental_ready", tutor.reason)
        result = tutor.recommend(self.history, self.candidates)
        self.assertEqual("ready", result["status"])
        self.assertEqual("experimental_target_correctness", result["reasonCode"])
        self.assertTrue(0 <= result["predictedCorrectness"] <= 1)

    def test_sparse_history_disclosed_but_unknown_candidate_never_mapped(self):
        tutor = Tutor(str(self.path), allow_experimental=True)
        unknown = dict(questionId="unseen-board", kcId=self.kc, response=0)
        result = tutor.recommend([unknown] + self.history, self.candidates)
        self.assertEqual(1, result["historyUsed"])
        self.assertEqual(1, result["historySkipped"])
        self.assertEqual("no_known_history", tutor.recommend([unknown], self.candidates)["reasonCode"])
        self.assertEqual("unmapped_game_items", tutor.recommend(self.history, [dict(id="unknown", questionId="unseen-board", kcId=self.kc)])["reasonCode"])

    def test_live_api_contract_and_experimental_health(self):
        with TestClient(app) as client:
            client.app.state.tutor = Tutor(str(self.path), allow_experimental=True)
            self.assertEqual("experimental_ready", client.get("/health").json()["modelStatus"])
            result = client.post("/v1/recommendations", json=dict(schemaVersion=1, history=self.history, candidates=self.candidates))
            self.assertEqual(200, result.status_code)
            self.assertEqual("ready", result.json()["status"])
            self.assertEqual(0, result.json()["historySkipped"])
