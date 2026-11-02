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


if __name__ == "__main__":
    unittest.main()
