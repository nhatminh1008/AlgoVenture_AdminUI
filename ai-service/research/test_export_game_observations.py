import hashlib
import unittest

from export_game_observations import question_id, transform


class ExportTests(unittest.TestCase):
    def row(self, qa=False):
        return dict(userId="private-user", attemptId="private-attempt", sequence=1, isQa=qa,
                    metadata=dict(engineVersion="bubble-v1", source="classroom", activity="supplementary",
                                  exerciseId="bubble-short-v1"),
                    evaluation=dict(firstResponse=True, correct=False, kcId="bubble.next_swap.v1",
                                    before=dict(items=[dict(value=4), dict(value=-1)], pair=0, end=1, **{"pass": 0})))

    def test_matches_java_canonical_encoding(self):
        board = self.row()["evaluation"]["before"]
        self.assertEqual(question_id(board), "bubble-board-v1:" + hashlib.sha256(b"4,-1|0|1|0").hexdigest())

    def test_qa_exclusion_and_private_identifiers(self):
        observations, report = transform([self.row(), self.row(True)], b"test-key")
        self.assertEqual(len(observations), 1)
        self.assertEqual(report["excludedQaObservations"], 1)
        self.assertFalse(report["trainingApproved"])
        self.assertNotIn("private", str(observations))
        self.assertEqual(observations[0]["activity"], "supplementary")
        self.assertEqual(observations[0]["response"], 0)
        self.assertEqual(observations, transform([self.row()], b"test-key")[0])
        self.assertNotEqual(observations[0]["learnerId"], transform([self.row()], b"other-key")[0][0]["learnerId"])

    def test_retries_and_duplicates_rejected(self):
        retry = self.row()
        retry["evaluation"]["firstResponse"] = False
        with self.assertRaises(ValueError):
            transform([retry], b"test")
        with self.assertRaises(ValueError):
            transform([self.row(), self.row()], b"test")

    def test_generic_skill_requires_server_verification_and_preserves_order(self):
        def graph(sequence, arrival):
            row = self.row()
            row.update(sequence=sequence, arrival=arrival)
            row["metadata"] = dict(engineVersion="graph-v2", source="map")
            row["evaluation"] = dict(firstResponse=True, correct=sequence == 1,
                                     kcId="graph.bfs.next_node.v1", serverVerified=True,
                                     encodingVersion="game-state-v1", predictionTarget="next_action",
                                     questionId="game-state-v1:" + hashlib.sha256(str(sequence).encode()).hexdigest())
            return row
        rows = [graph(2, "2026-11-02T00:00:02Z"), graph(1, "2026-11-02T00:00:01Z")]
        observations, report = transform(rows, b"key", encoding_version="game-state-v1",
                                         prediction_target="next_action")
        self.assertEqual([row["sequence"] for row in observations], [1, 2])
        self.assertEqual(report["encodingVersion"], "game-state-v1")
        rows[0]["evaluation"]["serverVerified"] = False
        with self.assertRaises(ValueError):
            transform(rows, b"key", encoding_version="game-state-v1", prediction_target="next_action")


if __name__ == "__main__":
    unittest.main()
