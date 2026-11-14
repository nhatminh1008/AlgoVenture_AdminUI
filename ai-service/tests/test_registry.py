import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import Mock, patch

from fastapi.testclient import TestClient
from app import app
from model_registry import ModelBinding, ModelRegistry
from tutor import Tutor


def fake_tutor(encoding, target, lesson):
    tutor = Tutor()
    tutor.manifest = dict(encodingVersion=encoding, predictionTarget=target, lessonIds=[lesson],
                          questionVocab={"q": 0}, kcVocab={lesson + ".next_action.v1": 0}, modelVersion="unit-test")
    tutor.session = Mock()
    tutor.reason = "ready"
    tutor.recommend = Mock(return_value=dict(status="ready", exerciseId="candidate", predictedCorrectness=.7))
    return tutor


class RegistryTests(unittest.TestCase):
    def setUp(self):
        self.bubble = fake_tutor("bubble-board-v1", "first_swap_opportunity", "bubble")
        self.graph = fake_tutor("game-state-v1", "next_action", "graph-basics")
        self.registry = ModelRegistry([
            ModelBinding("bubble", "bubble-board-v1", "first_swap_opportunity", ["bubble"], self.bubble),
            ModelBinding("graph", "game-state-v1", "next_action", ["graph-basics"], self.graph)])
        self.history = [dict(questionId="q", kcId="graph-basics.next_action.v1", response=1)]
        self.candidates = [dict(id="candidate", questionId="q", kcId="graph-basics.next_action.v1")]

    def test_routes_contract_and_lesson_without_fallback(self):
        result = self.registry.recommend(self.history, self.candidates, lesson_id="graph-basics",
                                         encoding_version="game-state-v1", prediction_target="next_action")
        self.assertEqual("graph", result["modelId"])
        self.bubble.recommend.assert_not_called()
        self.graph.recommend.assert_called_once()
        missing = self.registry.recommend(self.history, self.candidates, lesson_id="matrix",
                                          encoding_version="game-state-v1", prediction_target="next_action")
        self.assertEqual("unsupported_lesson", missing["reasonCode"])
        self.assertIsNone(missing["predictedCorrectness"])
        self.assertEqual("unsupported_model_contract", self.registry.recommend(self.history, self.candidates,
            encoding_version="unconfigured", prediction_target="next_action")["reasonCode"])

    def test_legacy_default_and_no_model_remain_honest(self):
        self.assertEqual("bubble", self.registry.recommend(self.history, self.candidates)["modelId"])
        result = ModelRegistry().recommend(self.history, self.candidates)
        self.assertEqual("model_not_configured", result["reasonCode"])
        self.assertIsNone(result["predictedCorrectness"])

    def test_http_passes_lesson_contract_and_health_coverage(self):
        with TestClient(app) as client:
            client.app.state.tutor = self.registry
            result = client.post("/v1/recommendations", json=dict(schemaVersion=1, lessonId="graph-basics",
                encodingVersion="game-state-v1", predictionTarget="next_action",
                history=self.history, candidates=self.candidates))
            self.assertEqual(200, result.status_code)
            self.assertEqual("graph", result.json()["modelId"])
            self.assertEqual("graph-basics", self.graph.recommend.call_args.kwargs["lesson_id"])
            health = client.get("/health").json()
            self.assertEqual(2, len(health["models"]))
            self.assertEqual(["graph-basics"], health["models"][1]["lessonIds"])
            self.assertNotIn("manifestPath", json.dumps(health))

    def test_registry_paths_and_ambiguous_coverage(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder)
            manifest = dict(encodingVersion="game-state-v1", predictionTarget="next_action", lessonIds=["graph-basics"])
            (path / "manifest.json").write_text(json.dumps(manifest), encoding="utf-8")
            config = dict(schemaVersion=1, models=[dict(id="one", manifestPath="manifest.json", lessonIds=["graph-basics"])])
            (path / "registry.json").write_text(json.dumps(config), encoding="utf-8")
            with patch("model_registry.Tutor", return_value=self.graph):
                loaded = ModelRegistry.from_file(path / "registry.json")
                self.assertEqual("one", loaded.models[0].id)
                config["models"].append(dict(id="two", manifestPath="manifest.json", lessonIds=["graph-basics"]))
                (path / "registry.json").write_text(json.dumps(config), encoding="utf-8")
                with self.assertRaises(ValueError):
                    ModelRegistry.from_file(path / "registry.json")

    def test_malformed_registry_reports_unavailable_without_paths_or_startup_failure(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "registry.json"
            for config in ([], {"schemaVersion": 1, "models": [None]},
                           {"schemaVersion": 1, "models": [{"id": "broken", "manifestPath": "missing.json"}]}):
                with self.subTest(config=config):
                    path.write_text(json.dumps(config), encoding="utf-8")
                    with patch.dict(os.environ, {"AI_MODEL_REGISTRY": str(path)}, clear=True):
                        registry = ModelRegistry.from_environment()
                    self.assertEqual("registry_invalid", registry.reason)
                    self.assertEqual([], registry.coverage())


@unittest.skipUnless(os.environ.get("AI_TEST_ALLGAME_REGISTRY"), "Generate the explicit synthetic ONNX transport fixture first")
class AllGameOnnxTransportTests(unittest.TestCase):
    def test_every_fixture_lesson_traverses_http_and_real_onnx(self):
        registry_path = Path(os.environ["AI_TEST_ALLGAME_REGISTRY"])
        registry = ModelRegistry.from_file(registry_path, allow_experimental=True, allow_test_artifacts=True)
        candidates = json.loads((registry_path.parent / "catalog.json").read_text(encoding="utf-8"))["exercises"]
        self.assertGreaterEqual(len({row["lessonId"] for row in candidates}), 34)
        with TestClient(app) as client:
            client.app.state.tutor = registry
            for row in candidates:
                with self.subTest(lesson=row["lessonId"]):
                    candidate = {key: row[key] for key in ("id", "questionId", "kcId")}
                    history = [dict(questionId=row["questionId"], kcId=row["kcId"], response=1)]
                    response = client.post("/v1/recommendations", json=dict(schemaVersion=1,
                        lessonId=row["lessonId"], encodingVersion="game-state-v1", predictionTarget="next_action",
                        history=history, candidates=[candidate]))
                    self.assertEqual(200, response.status_code)
                    self.assertEqual("ready", response.json()["status"])
                    self.assertTrue(response.json()["testOnly"])
                    self.assertEqual("synthetic_transport_test", response.json()["reasonCode"])
            self.assertTrue(client.get("/health").json()["models"][0]["testOnly"])

    def test_synthetic_artifact_is_disabled_without_separate_opt_in(self):
        registry = ModelRegistry.from_file(Path(os.environ["AI_TEST_ALLGAME_REGISTRY"]), allow_experimental=True)
        self.assertIsNone(registry.models[0].tutor.session)
        self.assertEqual("artifact_invalid", registry.models[0].tutor.reason)


if __name__ == "__main__":
    unittest.main()
