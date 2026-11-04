import unittest
import tempfile
import json
from pathlib import Path
from unittest.mock import Mock

import numpy as np
from fastapi.testclient import TestClient

from app import app
from tutor import Tutor, choose_target_correctness

KC = "bubble.next_swap.v1"


class TutorTests(unittest.TestCase):
    def test_policy_selects_nearest_probability_and_stable_ties(self):
        self.assertEqual("b", choose_target_correctness({"a": .95, "b": .72, "c": .30}))
        self.assertEqual("a", choose_target_correctness({"z": .8, "a": .6}))
        for value in (float("nan"), float("inf"), -.1, 1.1):
            with self.assertRaises(ValueError):
                choose_target_correctness({"a": value})

    def test_missing_artifact_and_unseen_kc_never_return_fake_predictions(self):
        tutor = Tutor()
        history = [dict(questionId="q1", kcId=KC, response=0)]
        self.assertEqual("insufficient_history", tutor.recommend([], [])['status'])
        result = tutor.recommend(history, [])
        self.assertEqual("model_not_ready", result['status'])
        self.assertIsNone(result['predictedCorrectness'])
        tutor.session = Mock()
        tutor.manifest = dict(sequenceLength=4, questionVocab={"q1": 0}, kcVocab={"CSEDM-For": 0})
        self.assertEqual("unmapped_game_items", tutor.recommend(history, [dict(id="e", questionId="q1", kcId=KC)])['reasonCode'])
        tutor.session.run.assert_not_called()

    def test_serving_preserves_history_shift_truncation_and_candidate_identity(self):
        tutor = Tutor()
        tutor.manifest = dict(sequenceLength=3, questionVocab={"h": 0, "a": 1, "b": 2}, kcVocab={KC: 0}, outputName="probabilities", modelVersion="test-only")
        tutor.session = Mock()
        tutor.session.run.return_value = [np.array([[.5, .4, .95], [.5, .4, .72]])]
        history = [dict(questionId="h", kcId=KC, response=r) for r in [1, 0, 1]]
        candidates = [dict(id=name, questionId=name, kcId=KC) for name in ["a", "b"]]
        result = tutor.recommend(history, candidates)
        self.assertEqual("b", result['exerciseId'])
        self.assertEqual(.72, result['predictedCorrectness'])
        feed = tutor.session.run.call_args.args[1]
        np.testing.assert_array_equal(feed['rseqs'], [[0, 1], [0, 1]])
        np.testing.assert_array_equal(feed['shft_qseqs'], [[0, 1], [0, 2]])
        np.testing.assert_array_equal(feed['shft_rseqs'], [[1, 0], [1, 0]])
        tutor.session.run.return_value = [np.array([.7, .8])]
        self.assertEqual("temporarily_unavailable", tutor.recommend(history, candidates)['status'])

    def test_api_validation_and_honest_not_ready(self):
        with TestClient(app) as client:
            client.app.state.tutor = Tutor()
            payload = dict(schemaVersion=1, history=[dict(questionId="h", kcId=KC, response=1)], candidates=[dict(id="a", questionId="a", kcId=KC)])
            response = client.post('/v1/recommendations', json=payload)
            self.assertEqual(200, response.status_code)
            self.assertEqual("model_not_ready", response.json()['status'])
            payload['history'][0]['response'] = 2
            self.assertEqual(422, client.post('/v1/recommendations', json=payload).status_code)
            payload['history'][0]['response'] = 1
            payload['candidates'] *= 2
            self.assertEqual(422, client.post('/v1/recommendations', json=payload).status_code)

    def test_invalid_and_unverified_artifacts_remain_disabled(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / 'manifest.json'
            self.assertEqual('artifact_invalid', Tutor(str(path)).reason)
            path.write_text(json.dumps(dict(schemaVersion=1, architecture='simplekt', predictionTarget='first_swap_opportunity',
                encodingVersion='bubble-board-v1', modelVersion='unverified', validation=dict(status='pending', evidence=''))), encoding='utf-8')
            tutor = Tutor(str(path))
            self.assertEqual('artifact_invalid', tutor.reason)
            self.assertIsNone(tutor.session)


if __name__ == '__main__':
    unittest.main()
