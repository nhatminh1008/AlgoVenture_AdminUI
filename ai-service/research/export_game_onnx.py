"""Export an experimental Bubble checkpoint; validate mechanics, not model quality."""
import argparse
import copy
import hashlib
import json
from pathlib import Path
import types
import zipfile

import numpy as np
import onnx
import onnxruntime as ort
import torch

from audit_csedm import ARCHIVE_SHA, INPUTS, SixTensorModel, max_error, portable_attention_layer, source_model
from prepare_game_dataset import candidate_questions


def read(path):
    return json.loads(path.read_text(encoding="utf-8"))


def feed_for(history, candidates, vocab, sequence_length=200):
    count = len(candidates)
    q, c, r = [np.tile(history[key][-(sequence_length - 1):], (count, 1)).astype(np.int64)
               for key in ("questions", "concepts", "responses")]
    cq = np.array([[vocab["questionVocab"][row["questionId"]]] for row in candidates], dtype=np.int64)
    cc = np.array([[vocab["kcVocab"][row["kcId"]]] for row in candidates], dtype=np.int64)
    return dict(qseqs=q, cseqs=c, rseqs=r,
                shft_qseqs=np.concatenate((q[:, 1:], cq), axis=1),
                shft_cseqs=np.concatenate((c[:, 1:], cc), axis=1),
                shft_rseqs=np.concatenate((r[:, 1:], np.zeros((count, 1), dtype=np.int64)), axis=1))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--experiment", type=Path, required=True)
    parser.add_argument("--dataset", type=Path, required=True)
    parser.add_argument("--archive", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--catalog", type=Path, default=Path(__file__).with_name("bubble-candidates.json"))
    parser.add_argument("--experimental", action="store_true", required=True)
    args = parser.parse_args()
    run = read(args.experiment / "run.json")
    checkpoint = args.experiment / "experimental-simplekt.pt"
    if (run["status"] != "completed" or run["evaluationStatus"] != "deferred"
            or run["deploymentReady"] is not False
            or hashlib.sha256(checkpoint.read_bytes()).hexdigest() != run["checkpointSha256"]
            or hashlib.sha256(args.archive.read_bytes()).hexdigest() != ARCHIVE_SHA):
        raise ValueError("Incompatible experimental checkpoint/source")
    for name, expected in run["datasetFilesSha256"].items():
        if name not in {"train.jsonl", "vocab.json", "dataset.json", "learner-splits.json"}:
            raise ValueError("Unexpected dataset file")
        if hashlib.sha256((args.dataset / name).read_bytes()).hexdigest() != expected:
            raise ValueError("Dataset changed since training")
    vocab = read(args.dataset / "vocab.json")
    config = read(args.experiment / "model-config.json")
    dataset = read(args.dataset / "dataset.json")
    candidates = candidate_questions(read(args.catalog))
    if any(row["questionId"] not in vocab["questionVocab"] for row in candidates):
        raise ValueError("Practice candidate missing from training vocabulary")
    args.output.mkdir(parents=True, exist_ok=False)
    torch.set_num_threads(2)
    with zipfile.ZipFile(args.archive) as archive:
        cls = source_model(archive, args.output / "pinned_source")
    original = cls(n_question=vocab["numConcepts"], n_pid=vocab["numQuestions"], **config)
    original.load_state_dict(torch.load(checkpoint, map_location="cpu", weights_only=True), strict=True)
    original.eval()
    portable = copy.deepcopy(original)
    for layer in portable.model.blocks_2:
        layer.forward = types.MethodType(portable_attention_layer, layer)
    wrapper = SixTensorModel(portable).eval()
    records = [json.loads(line) for line in (args.dataset / "train.jsonl").read_text().splitlines() if line]
    history = records[0]
    example_feed = feed_for(history, candidates, vocab, dataset["sequenceLength"])
    model_path = args.output / "simplekt-bubble-experimental.onnx"
    torch.onnx.export(wrapper, tuple(torch.from_numpy(example_feed[n]) for n in INPUTS), str(model_path),
                      input_names=list(INPUTS), output_names=["probabilities"], opset_version=17, dynamo=False,
                      dynamic_axes={**{n: {0: "batch", 1: "history"} for n in INPUTS},
                                    "probabilities": {0: "batch", 1: "steps"}})
    onnx.checker.check_model(str(model_path))
    options = ort.SessionOptions()
    options.intra_op_num_threads = 2
    session = ort.InferenceSession(str(model_path), sess_options=options, providers=["CPUExecutionProvider"])
    errors, cases = [], []
    with torch.inference_mode():
        for record in records:
            feed = feed_for(record, candidates, vocab, dataset["sequenceLength"])
            expected = original({n: torch.from_numpy(a) for n, a in feed.items()}).numpy()
            errors.append(max_error(expected, session.run(None, feed)[0]))
        for length in sorted({1, 2, 17, len(history["questions"]), dataset["sequenceLength"] - 1}):
            if not 1 <= length < dataset["sequenceLength"]:
                continue
            # Repeated observed tokens exercise variable shapes, not additional study data.
            trace = {key: (history[key] * (length // len(history[key]) + 1))[:length]
                     for key in ("questions", "concepts", "responses")}
            for count in (1, len(candidates)):
                feed = feed_for(trace, candidates[:count], vocab, dataset["sequenceLength"])
                expected = original({n: torch.from_numpy(a) for n, a in feed.items()}).numpy()
                converted = wrapper(*(torch.from_numpy(feed[n]) for n in INPUTS)).numpy()
                actual = session.run(None, feed)[0]
                errors.extend((max_error(expected, converted), max_error(expected, actual)))
                changed = {n: a.copy() for n, a in feed.items()}
                changed["shft_rseqs"][:, -1] = 1
                errors.append(max_error(actual, session.run(None, changed)[0]))
                selected = lambda p: min(range(count), key=lambda i: (round(abs(float(p[i, -1]) - .70), 12), candidates[i]["id"]))
                if selected(expected) != selected(actual):
                    raise ValueError("Target Correctness selection differs after export")
                cases.append(dict(historyLength=length, candidates=count))
    evidence = dict(status="passed", scope="technical export validation only; quality evaluation deferred",
                    checkpointSha256=run["checkpointSha256"], maxProbabilityError=max(errors),
                    cases=cases, currentResponseInvariant=True, targetCorrectnessSelectionParity=True)
    evidence_path = args.output / "technical-validation.json"
    evidence_path.write_text(json.dumps(evidence, indent=2) + "\n", encoding="utf-8")
    manifest = dict(schemaVersion=1, architecture="simplekt", deploymentMode="experimental",
                    modelVersion="bubble-experimental-" + run["checkpointSha256"][:12],
                    predictionTarget="first_swap_opportunity", encodingVersion="bubble-board-v1",
                    sequenceLength=dataset["sequenceLength"], modelFile=model_path.name,
                    modelSha256=hashlib.sha256(model_path.read_bytes()).hexdigest(),
                    outputName="probabilities", questionVocab=vocab["questionVocab"], kcVocab=vocab["kcVocab"],
                    validation=dict(status="deferred", evidence=""),
                    technicalValidation=dict(status="passed", evidence=evidence_path.name,
                                             evidenceSha256=hashlib.sha256(evidence_path.read_bytes()).hexdigest()))
    (args.output / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(evidence, indent=2))


if __name__ == "__main__":
    main()
