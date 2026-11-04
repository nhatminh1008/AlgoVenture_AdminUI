import unittest

from train_game_simplekt import tensors
from export_game_onnx import feed_for


class TrainingInputTests(unittest.TestCase):
    def test_export_reserves_one_position_for_the_candidate(self):
        history = dict(questions=list(range(200)), concepts=[0] * 200, responses=[1] * 200)
        vocab = dict(questionVocab={"candidate": 201}, kcVocab={"kc": 0})
        feed = feed_for(history, [dict(questionId="candidate", kcId="kc")], vocab)
        self.assertEqual(feed["qseqs"].shape, (1, 199))
        self.assertEqual(feed["qseqs"][0, 0], 1)
        self.assertEqual(feed["shft_qseqs"][0, -1], 201)
        self.assertEqual(feed["shft_rseqs"][0, -1], 0)

    def test_six_tensor_shift_and_label_alignment(self):
        feed = tensors(dict(questions=[0, 1, 2], concepts=[0, 0, 0], responses=[1, 0, 1]),
                       dict(questionOovId=3, kcOovId=1), 200)
        self.assertEqual(feed["qseqs"].tolist(), [[0, 1]])
        self.assertEqual(feed["shft_qseqs"].tolist(), [[1, 2]])
        self.assertEqual(feed["rseqs"].tolist(), [[1, 0]])
        self.assertEqual(feed["shft_rseqs"].tolist(), [[0, 1]])
        self.assertEqual(len(feed), 6)

    def test_oov_and_malformed_sequences_rejected(self):
        vocab = dict(questionOovId=2, kcOovId=1)
        for record in (dict(questions=[0, 2], concepts=[0, 0], responses=[1, 0]),
                       dict(questions=[0, 1], concepts=[0], responses=[1, 0]),
                       dict(questions=[0, 1], concepts=[0, 0], responses=[1, 2]),
                       dict(questions=[0], concepts=[0], responses=[1])):
            with self.assertRaises(ValueError):
                tensors(record, vocab, 200)


if __name__ == "__main__":
    unittest.main()
