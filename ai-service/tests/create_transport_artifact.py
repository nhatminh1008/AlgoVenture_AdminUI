"""Create an explicitly synthetic ONNX transport fixture; never a deployable learner model.

Run with the research environment (onnx + onnxruntime), not against any database.
The fixed output tests wiring, vocabulary and tensor shape only; it is not trained accuracy.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

INPUTS = ("qseqs", "cseqs", "rseqs", "shft_qseqs", "shft_cseqs", "shft_rseqs")


def create(output, lessons, catalog=None, observations=(), *, encoding="game-state-v1", target="next_action"):
    import numpy as np
    import onnx
    from onnx import TensorProto, helper
    import onnxruntime as ort

    output = Path(output)
    output.mkdir(parents=True, exist_ok=False)
    if (encoding, target) not in (("game-state-v1", "next_action"), ("bubble-board-v1", "first_swap_opportunity")):
        raise ValueError("Unsupported test transport contract")
    if encoding != "game-state-v1" and not catalog:
        raise ValueError("Bubble transport requires its actual candidate catalog")
    candidates = catalog or [dict(id=lesson + "-transport-fixture", lessonId=lesson,
        questionId="game-state-v1:" + hashlib.sha256(("transport-fixture:" + lesson).encode()).hexdigest(),
        kcId=lesson + ".next_action.v1") for lesson in lessons]
    if not candidates or any(not all(row.get(key) for key in ("id", "lessonId", "questionId", "kcId")) for row in candidates):
        raise ValueError("A candidate needs id, lessonId, questionId and kcId")
    lessons = sorted({row["lessonId"] for row in candidates})
    questions = sorted({row["questionId"] for row in candidates + list(observations)})
    skills = sorted({row["kcId"] for row in candidates + list(observations)})
    inputs = [helper.make_tensor_value_info(name, TensorProto.INT64, ["batch", "history"]) for name in INPUTS]
    # Preserve all six contract inputs; deliberately constant output makes no quality claim.
    nodes = [
        helper.make_node("Shape", ["qseqs"], ["shape"]),
        helper.make_node("Constant", [], ["extra"], value=helper.make_tensor("extra", TensorProto.INT64, [2], [0, 1])),
        helper.make_node("Add", ["shape", "extra"], ["output_shape"]),
        helper.make_node("ConstantOfShape", ["output_shape"], ["probabilities"],
                         value=helper.make_tensor("test_probability", TensorProto.FLOAT, [1], [0.7]))]
    graph = helper.make_graph(nodes, "SYNTHETIC_TRANSPORT_TEST_NOT_TRAINED", inputs,
                              [helper.make_tensor_value_info("probabilities", TensorProto.FLOAT, ["batch", "steps"])])
    model = helper.make_model(graph, producer_name="algoventure-contract-tests",
                              opset_imports=[helper.make_opsetid("", 13)])
    model.ir_version = 8
    onnx.checker.check_model(model)
    model_path = output / "synthetic-transport-test.onnx"
    onnx.save(model, model_path)
    session = ort.InferenceSession(str(model_path), providers=["CPUExecutionProvider"])
    for batch, length in ((1, 1), (3, 7), (len(lessons), 2)):
        feed = {name: np.zeros((batch, length), dtype=np.int64) for name in INPUTS}
        actual = session.run(["probabilities"], feed)[0]
        if actual.shape != (batch, length + 1) or not np.allclose(actual, .7):
            raise ValueError("Fixture shape test failed")
    evidence = dict(status="passed", scope="synthetic HTTP/tensor transport only; no training or quality evaluation",
                    trained=False, deploymentReady=False, lessons=len(lessons))
    evidence_path = output / "technical-validation.json"
    evidence_path.write_text(json.dumps(evidence, indent=2), encoding="utf-8")
    manifest = dict(schemaVersion=1, architecture="synthetic-simplekt-contract", artifactPurpose="synthetic_transport_test",
        deploymentMode="experimental", modelVersion="synthetic-allgame-transport-only-v1",
        encodingVersion=encoding, predictionTarget=target, lessonIds=lessons,
        sequenceLength=200, questionVocab={q: i for i, q in enumerate(questions)},
        kcVocab={kc: i for i, kc in enumerate(skills)}, modelFile=model_path.name,
        modelSha256=hashlib.sha256(model_path.read_bytes()).hexdigest(), outputName="probabilities",
        validation=dict(status="deferred", evidence=""),
        technicalValidation=dict(status="passed", evidence=evidence_path.name,
                                 evidenceSha256=hashlib.sha256(evidence_path.read_bytes()).hexdigest()))
    (output / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    (output / "registry.json").write_text(json.dumps(dict(schemaVersion=1, models=[dict(
        id="synthetic-transport", manifestPath="manifest.json", lessonIds=lessons)]), indent=2), encoding="utf-8")
    (output / "catalog.json").write_text(json.dumps(dict(schemaVersion=1, encodingVersion=encoding,
        predictionTarget=target, exercises=candidates), indent=2), encoding="utf-8")
    return dict(testOnly=True, deploymentReady=False, lessons=len(lessons), questions=len(questions),
                registry=str((output / "registry.json").resolve()))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True, help="New isolated test directory")
    parser.add_argument("--curriculum", type=Path,
        default=Path(__file__).resolve().parents[3] / "AlgoVenture_Backend/src/main/resources/curriculum.json")
    parser.add_argument("--catalog", type=Path, help="Optional real test candidate IDs for backend-to-AI transport")
    parser.add_argument("--observations", type=Path, help="Optional JSONL test histories added to exact test vocab")
    parser.add_argument("--encoding-version", default="game-state-v1")
    parser.add_argument("--prediction-target", default="next_action")
    args = parser.parse_args()
    lessons = [lesson[0] for topic in json.loads(args.curriculum.read_text(encoding="utf-8")) for lesson in topic["lessons"]]
    catalog = json.loads(args.catalog.read_text(encoding="utf-8"))["exercises"] if args.catalog else None
    observations = [json.loads(line) for line in args.observations.read_text(encoding="utf-8").splitlines() if line.strip()] if args.observations else []
    print(json.dumps(create(args.output, lessons, catalog, observations,
                            encoding=args.encoding_version, target=args.prediction_target), indent=2))


if __name__ == "__main__":
    main()
