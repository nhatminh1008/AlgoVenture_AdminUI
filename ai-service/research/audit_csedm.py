"""Reproduce frozen CSEDM simpleKT and export verified research-only ONNX.

Never creates a Game deployment manifest or changes the research archive.
"""
from __future__ import annotations

import argparse
import copy
import csv
import gzip
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import sys
import types
import zipfile

import numpy as np
import onnx
import onnxruntime as ort
import torch
from sklearn.metrics import roc_auc_score

ARCHIVE_SHA = "16eaa53c856ca552f196b4216964ebbff64aa02c54ab2da8b725769cb7f0a3f3"
WEIGHT_SHAS = [
    "573b4f9c7a9a7ada2c0927c4a7d19d5c25ad31fcb2f900668afa38b69c8073a9",
    "6b73f1c0583d29bd8c0a087e3d7943a008849ef87ba5c7c9d16d571ef8082ef9",
    "33c5bcc1f3bc1ee1370345271e6b1977bae1507f62ae373295e62f32b10f4673",
    "3be560a412357074889289e8282139efb1efec4b3a07757d99e43f8fc9700979",
    "4e861d9d41fa303d0c9de12a372d94bbea481de1d68d196136f85e45d318dfde",
]
INPUTS = ("qseqs", "cseqs", "rseqs", "shft_qseqs", "shft_cseqs", "shft_rseqs")
TOLERANCE = 2e-5


def require(condition, message):
    if not condition:
        raise ValueError(message)


def portable_attention_layer(self, mask, query, key, values, apply_pos=True):
    # Original numpy mask would freeze sequence length during tracing.
    positions = torch.arange(query.size(1), device=query.device)
    allowed = positions.unsqueeze(0) < positions.unsqueeze(1)
    if mask != 0:
        allowed = positions.unsqueeze(0) <= positions.unsqueeze(1)
    query2 = self.masked_attn_head(query, key, values,
                                 mask=allowed[None, None], zero_pad=(mask == 0))
    query = self.layer_norm1(query + self.dropout1(query2))
    if apply_pos:
        query2 = self.linear2(self.dropout(self.activation(self.linear1(query))))
        query = self.layer_norm2(query + self.dropout2(query2))
    return query


class SixTensorModel(torch.nn.Module):
    def __init__(self, model):
        super().__init__()
        self.model = model

    def forward(self, qseqs, cseqs, rseqs, shft_qseqs, shft_cseqs, shft_rseqs):
        return self.model(dict(zip(INPUTS, (qseqs, cseqs, rseqs,
                                           shft_qseqs, shft_cseqs, shft_rseqs))))


def read_csv(data):
    return list(csv.DictReader(io.StringIO(data.decode("utf-8"))))


def source_model(archive, destination):
    destination.mkdir(parents=True, exist_ok=True)
    for name in ("simplekt.py", "utils.py"):
        member = f"01_phase1/pykt-toolkit/pykt/models/{name}"
        (destination / name).write_bytes(archive.read(member))
    package = types.ModuleType("frozen_csedm")
    package.__path__ = [str(destination.resolve())]
    sys.modules[package.__name__] = package
    spec = importlib.util.spec_from_file_location("frozen_csedm.simplekt", destination / "simplekt.py")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    module.device = torch.device("cpu")
    return module.simpleKT


def encoded_test(archive, fold):
    rows = read_csv(archive.read(
        f"01_phase1/pykt-toolkit/data/csedmfreshv2f{fold}/test_sequences_firstkc_eval.csv"))
    rows = [r for r in rows if int(r["fold"]) == -1]
    arrays = {key: np.array([[int(v) for v in r[column].split(",")] for r in rows],
                            dtype=np.int64)
              for key, column in zip(INPUTS[:3], ("questions", "concepts", "responses"))}
    mask = (arrays["cseqs"][:, :-1] != -1) & (arrays["cseqs"][:, 1:] != -1)
    # Matches pinned KTDataset: selectmasks != -1, then evaluate on smasks.
    selected = np.array([[int(v) for v in r["selectmasks"].split(",")] for r in rows])[:, 1:] != -1
    inputs = {}
    for key, value in arrays.items():
        inputs[key] = value[:, :-1] * mask
        inputs["shft_" + key] = value[:, 1:] * mask
    return inputs, selected


def max_error(a, b):
    require(a.shape == b.shape, f"Shape mismatch: {a.shape} vs {b.shape}")
    error = float(np.max(np.abs(a - b)))
    require(np.isfinite(error) and error <= TOLERANCE, f"Parity failure: {error}")
    return error


def audit_fold(archive, model_class, fold, output):
    folder = output / f"fold{fold}"
    folder.mkdir(parents=True, exist_ok=True)
    prefix = f"01_phase1/checkpoints/simplekt_f{fold}/"
    config_member = next(n for n in archive.namelist() if n.startswith(prefix) and n.endswith("/config.json"))
    weights = archive.read(config_member.rsplit("/", 1)[0] + "/qid_model.ckpt")
    require(hashlib.sha256(weights).hexdigest() == WEIGHT_SHAS[fold], "Checkpoint checksum mismatch")
    config = json.loads(archive.read(config_member))
    model_config = {k: v for k, v in config["model_config"].items()
                    if k not in {"use_wandb", "learning_rate", "add_uuid", "l2", "batch_size", "num_epochs", "weight_decay"}}
    model = model_class(n_question=config["data_config"]["num_c"],
                        n_pid=config["data_config"]["num_q"],
                        seq_len=config["train_config"]["seq_len"], emb_type="qid", **model_config)
    model.load_state_dict(torch.load(io.BytesIO(weights), map_location="cpu", weights_only=True), strict=True)
    model.eval()
    portable = copy.deepcopy(model)
    for layer in portable.model.blocks_2:
        layer.forward = types.MethodType(portable_attention_layer, layer)
    wrapper = SixTensorModel(portable).eval()
    inputs, selected = encoded_test(archive, fold)
    predictions, exported_predictions = [], []
    errors = []
    onnx_path = folder / "simplekt-csedm.onnx"
    example = tuple(torch.from_numpy(inputs[n][:2, :5].copy()) for n in INPUTS)
    torch.onnx.export(wrapper, example, str(onnx_path), input_names=list(INPUTS),
                      output_names=["probabilities"], opset_version=17, dynamo=False,
                      dynamic_axes={**{n: {0: "batch", 1: "history"} for n in INPUTS},
                                    "probabilities": {0: "batch", 1: "steps"}})
    onnx.checker.check_model(str(onnx_path))
    options = ort.SessionOptions()
    options.intra_op_num_threads = 2
    session = ort.InferenceSession(str(onnx_path), sess_options=options, providers=["CPUExecutionProvider"])
    with torch.inference_mode():
        for start in range(0, len(selected), 8):
            batch = {n: v[start:start + 8] for n, v in inputs.items()}
            tensors = {n: torch.from_numpy(v) for n, v in batch.items()}
            original = model(tensors).numpy()
            converted = wrapper(*(tensors[n] for n in INPUTS)).numpy()
            actual = session.run(None, batch)[0]
            errors.extend([max_error(original, converted), max_error(original, actual)])
            selection = selected[start:start + 8]
            predictions.extend(original[:, 1:][selection].tolist())
            exported_predictions.extend(actual[:, 1:][selection].tolist())
        # Technical fixtures only: no training or evidence of learning gains.
        rng = np.random.default_rng(42)
        for batch_size, history in [(1, 1), (3, 2), (2, 5), (1, 17), (1, 199)]:
            q = rng.integers(0, 50, (batch_size, history + 1), dtype=np.int64)
            c = rng.integers(0, 18, (batch_size, history + 1), dtype=np.int64)
            r = rng.integers(0, 2, (batch_size, history + 1), dtype=np.int64)
            fixture = {}
            for name, a in zip(INPUTS[:3], (q, c, r)):
                fixture[name] = a[:, :-1].copy()
                fixture["shft_" + name] = a[:, 1:].copy()
            expected = model({n: torch.from_numpy(a) for n, a in fixture.items()}).numpy()
            actual = session.run(None, fixture)[0]
            errors.append(max_error(expected, actual))
            changed = {n: a.copy() for n, a in fixture.items()}
            changed["shft_rseqs"][:, -1] = 1 - changed["shft_rseqs"][:, -1]
            errors.append(max_error(actual, session.run(None, changed)[0]))
    reference = read_csv(gzip.decompress(archive.read(prefix + "test_predictions.csv.gz")))
    labels = inputs["shft_rseqs"][selected]
    require(len(reference) == len(predictions), "Prediction count mismatch")
    require(np.array_equal(labels, [int(r["correct"]) for r in reference]), "Reference label order mismatch")
    reference_error = max_error(np.array(predictions), np.array([float(r["prob"]) for r in reference]))
    p = np.array(exported_predictions)
    vocab_bytes = archive.read(f"01_phase1/pykt-toolkit/data/csedmfreshv2f{fold}/vocab_train_only.json")
    (folder / "vocab_train_only.json").write_bytes(vocab_bytes)
    (folder / "source_config.json").write_bytes(archive.read(config_member))
    return dict(fold=fold, status="passed", checkpointSha256=WEIGHT_SHAS[fold],
                onnxSha256=hashlib.sha256(onnx_path.read_bytes()).hexdigest(),
                testPredictions=len(p), referenceProbabilityMaxError=reference_error,
                portableAndOnnxMaxError=max(errors), testAuc=float(roc_auc_score(labels, p)),
                testAccuracy=float(np.mean((p >= .5) == labels)),
                testBrier=float(np.mean((p - labels) ** 2)),
                variableShapeCases=5, currentResponseInvariant=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    require(hashlib.sha256(args.archive.read_bytes()).hexdigest() == ARCHIVE_SHA, "Frozen archive checksum mismatch")
    args.output.mkdir(parents=True, exist_ok=True)
    # Invalidate any previous summary before starting a new run.
    report_path = args.output / "audit.json"
    report_path.write_text(json.dumps({"status": "running"}), encoding="utf-8")
    torch.set_num_threads(2)
    with zipfile.ZipFile(args.archive) as archive:
        cls = source_model(archive, args.output / "pinned_source")
        folds = []
        for fold in range(5):
            result = audit_fold(archive, cls, fold, args.output)
            folds.append(result)
            print(json.dumps(result), flush=True)
    report = dict(status="passed", scope="CSEDM research reproduction; NOT Game deployment",
                  archiveSha256=ARCHIVE_SHA, probabilityTolerance=TOLERANCE,
                  torchVersion=torch.__version__, onnxVersion=onnx.__version__,
                  onnxruntimeVersion=ort.__version__, folds=folds,
                  gameReady=False, gameBlocker="Bubble item/KC vocabulary and prediction target are absent from CSEDM training")
    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
