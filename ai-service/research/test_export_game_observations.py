import hashlib
import unittest

from export_game_observations import question_id, transform, transform_all


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

    def test_attempt_counts_use_learner_and_client_attempt_composite_identity(self):
        first, second = self.row(), self.row()
        second["userId"] = "another-private-user"
        observations, report = transform([first, second], b"test")
        self.assertEqual(2, report["learners"])
        self.assertEqual(2, report["attempts"])
        self.assertEqual(2, len(observations))

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

    def test_all_contracts_report_missing_lessons_and_input_trust(self):
        graph = self.row()
        graph["attemptId"] = "graph-attempt"
        graph["lessonId"] = "graph-basics"
        graph["metadata"] = dict(engineVersion="gameplay-v1", lessonId="graph-basics", source="map")
        graph["evaluation"] = dict(firstResponse=True, correct=False, serverVerified=True,
            inputVerified=False, inputProvenance="validated_client_snapshot", lessonId="graph-basics",
            kcId="graph-basics.next_action.v1", encodingVersion="game-state-v1",
            predictionTarget="next_action", questionId="game-state-v1:" + "a" * 64)
        retry = {**graph, "sequence": 2, "evaluation": {**graph["evaluation"], "firstResponse": False}}
        ungraded = {**graph, "sequence": 3, "evaluation": {**graph["evaluation"], "serverVerified": False}}
        observations, report = transform_all([self.row(), graph, retry, ungraded], b"key",
                                             expected_lessons=["bubble", "graph-basics", "matrix"])
        self.assertEqual(2, len(observations))
        self.assertEqual(2, len(report["contracts"]))
        coverage = {row["lessonId"]: row for row in report["lessonCoverage"]}
        self.assertEqual("no_verified_observations", coverage["matrix"]["reasonCode"])
        self.assertEqual({"validated_client_snapshot": 1}, coverage["graph-basics"]["inputProvenanceCounts"])
        self.assertFalse(coverage["graph-basics"]["trainingApproved"])
        self.assertEqual(1, report["excludedObservations"]["not_server_graded"])
        self.assertEqual(1, report["excludedObservations"]["not_first_response"])


if __name__ == "__main__":
    unittest.main()
