"""Internal simpleKT inference. Never substitute synthetic scores for a missing artifact."""
from __future__ import annotations

import hashlib
import json
import math
from pathlib import Path

POLICY = "target-correctness-v1:0.70"
TARGET = "first_swap_opportunity"
INPUTS = ("qseqs", "cseqs", "rseqs", "shft_qseqs", "shft_cseqs", "shft_rseqs")


def unavailable(status: str, reason: str) -> dict:
    return dict(status=status, exerciseId=None, predictedCorrectness=None,
                modelVersion=None, policyVersion=POLICY, reasonCode=reason)


def choose_target_correctness(scores: dict[str, float], target: float = 0.70) -> str:
    if not scores or any(not math.isfinite(p) or not 0 <= p <= 1 for p in scores.values()):
        raise ValueError("Invalid candidate probabilities")
    # Numerical ties within 1e-12 use the stable exercise ID.
    return min(scores, key=lambda key: (round(abs(scores[key] - target), 12), key))


class Tutor:
    def __init__(self, manifest_path: str | None = None, *, allow_experimental: bool = False):
        self.session = None
        self.manifest = None
        self.reason = "model_not_configured"
        self.experimental = False
        self.allow_experimental = allow_experimental
        if manifest_path:
            try:
                self._load(Path(manifest_path))
            except Exception:
                # Health exposes a reason code, never file paths, weights or exception text.
                self.reason = "artifact_invalid"

    def _load(self, path: Path):
        import onnxruntime as ort

        manifest = json.loads(path.read_text(encoding="utf-8"))
        if (manifest["schemaVersion"] != 1 or manifest["architecture"] != "simplekt"
                or manifest["predictionTarget"] != TARGET
                or manifest["encodingVersion"] != "bubble-board-v1"
                or not manifest["modelVersion"]):
            raise ValueError("Unverified or incompatible artifact")
        mode = manifest.get("deploymentMode", "validated")
        experimental = mode == "experimental"
        if experimental:
            if not self.allow_experimental or manifest["validation"]["status"] != "deferred":
                raise ValueError("Experimental mode requires explicit opt-in")
            validation = manifest["technicalValidation"]
            evidence = path.parent / validation["evidence"]
            if (validation["status"] != "passed" or evidence.resolve().parent != path.parent.resolve()
                    or hashlib.sha256(evidence.read_bytes()).hexdigest() != validation["evidenceSha256"]
                    or json.loads(evidence.read_text(encoding="utf-8"))["status"] != "passed"):
                raise ValueError("Missing technical validation")
        elif (mode != "validated" or manifest["validation"]["status"] != "passed"
                or not manifest["validation"]["evidence"]):
            raise ValueError("Unverified artifact")
        sequence_length = manifest["sequenceLength"]
        if type(sequence_length) is not int or not 2 <= sequence_length <= 512:
            raise ValueError("Invalid sequence length")
        for vocab in (manifest["questionVocab"], manifest["kcVocab"]):
            values = list(vocab.values())
            if not values or any(type(v) is not int or v < 0 for v in values) or len(set(values)) != len(values):
                raise ValueError("Invalid vocabulary")
        if "bubble.next_swap.v1" not in manifest["kcVocab"]:
            raise ValueError("Game KC missing")
        model_path = path.parent / manifest["modelFile"]
        if model_path.resolve().parent != path.parent.resolve():
            raise ValueError("Artifact must be adjacent to manifest")
        if hashlib.sha256(model_path.read_bytes()).hexdigest() != manifest["modelSha256"]:
            raise ValueError("Artifact checksum mismatch")
        session = ort.InferenceSession(str(model_path), providers=["CPUExecutionProvider"])
        inputs = session.get_inputs()
        if {item.name for item in inputs} != set(INPUTS) or any(item.type != "tensor(int64)" for item in inputs):
            raise ValueError("Incompatible ONNX inputs")
        if manifest["outputName"] not in {item.name for item in session.get_outputs()}:
            raise ValueError("Missing ONNX probability output")
        self.manifest, self.session = manifest, session
        self.experimental = experimental
        self.reason = "experimental_ready" if experimental else "ready"

    def recommend(self, history: list[dict], candidates: list[dict]) -> dict:
        if not history:
            return unavailable("insufficient_history", "no_observations")
        if self.session is None:
            return unavailable("model_not_ready", self.reason)
        if not candidates:
            return unavailable("model_not_ready", "no_eligible_exercises")
        manifest = self.manifest
        qv, cv = manifest["questionVocab"], manifest["kcVocab"]
        skipped = 0
        if self.experimental:
            # Dev-only sparse history: disclose dropped boards; never invent an OOV embedding.
            known = [r for r in history if r["questionId"] in qv and r["kcId"] in cv]
            skipped = len(history) - len(known)
            history = known
            if not history:
                return unavailable("insufficient_history", "no_known_history")
        history = history[-(manifest["sequenceLength"] - 1):]
        if any(row["questionId"] not in qv or row["kcId"] not in cv for row in history + candidates):
            return unavailable("model_not_ready", "unmapped_game_items")
        try:
            import numpy as np

            count = len(candidates)
            hq = np.tile([qv[row["questionId"]] for row in history], (count, 1)).astype(np.int64)
            hc = np.tile([cv[row["kcId"]] for row in history], (count, 1)).astype(np.int64)
            hr = np.tile([row["response"] for row in history], (count, 1)).astype(np.int64)
            tq = np.array([[qv[row["questionId"]]] for row in candidates], dtype=np.int64)
            tc = np.array([[cv[row["kcId"]]] for row in candidates], dtype=np.int64)
            feed = dict(qseqs=hq, cseqs=hc, rseqs=hr,
                        shft_qseqs=np.concatenate((hq[:, 1:], tq), axis=1),
                        shft_cseqs=np.concatenate((hc[:, 1:], tc), axis=1),
                        # Placeholder is never a real learner answer. Artifact validation must check causal invariance.
                        shft_rseqs=np.concatenate((hr[:, 1:], np.zeros((count, 1), dtype=np.int64)), axis=1))
            output = np.asarray(self.session.run([manifest["outputName"]], feed)[0])
            if output.shape != (count, len(history) + 1):
                raise ValueError("Expected simpleKT full sequence probabilities")
            scores = {row["id"]: float(output[i, -1]) for i, row in enumerate(candidates)}
            selected = choose_target_correctness(scores)
            result = dict(status="ready", exerciseId=selected, predictedCorrectness=scores[selected],
                        modelVersion=manifest["modelVersion"], policyVersion=POLICY,
                        reasonCode="experimental_target_correctness" if self.experimental else "target_correctness")
            if self.experimental:
                result.update(historyUsed=len(history), historySkipped=skipped)
            return result
        except Exception:
            return unavailable("temporarily_unavailable", "inference_failed")
