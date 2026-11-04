"""Experimental Game simpleKT training. Does not evaluate or deploy a model."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import random
import zipfile

import numpy as np
import torch

from audit_csedm import ARCHIVE_SHA, source_model


def load_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def tensors(record, vocab, sequence_length):
    arrays = [record[key] for key in ("questions", "concepts", "responses")]
    length = len(arrays[0])
    if not 2 <= length <= sequence_length or any(len(a) != length for a in arrays):
        raise ValueError("Invalid training sequence length")
    limits = (vocab["questionOovId"], vocab["kcOovId"], 2)
    for array, limit in zip(arrays, limits):
        # No OOV items may enter training: vocab must come from this training set.
        if any(type(value) is not int or not 0 <= value < limit for value in array):
            raise ValueError("Invalid/OOV training value")
    result = {}
    for name, array in zip(("qseqs", "cseqs", "rseqs"), arrays):
        result[name] = torch.tensor([array[:-1]], dtype=torch.int64)
        result["shft_" + name] = torch.tensor([array[1:]], dtype=torch.int64)
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dataset", type=Path, required=True)
    parser.add_argument("--archive", type=Path, required=True, help="Frozen archive supplying pinned simpleKT source")
    parser.add_argument("--output", type=Path, required=True, help="New experiment directory; never overwritten")
    parser.add_argument("--epochs", type=int, default=1)
    parser.add_argument("--max-steps", type=int, default=0, help="0 means all epochs; useful for pipeline smoke checks")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--experimental", action="store_true", required=True)
    args = parser.parse_args()
    if not 1 <= args.epochs <= 100 or args.max_steps < 0:
        raise ValueError("Invalid training limits")
    dataset = load_json(args.dataset / "dataset.json")
    vocab = load_json(args.dataset / "vocab.json")
    if (dataset.get("schemaVersion") != 1 or dataset.get("encodingVersion") != "bubble-board-v1"
            or dataset.get("predictionTarget") != "first_swap_opportunity"
            or not dataset.get("datasetPrepared") or dataset.get("deploymentReady") is not False):
        raise ValueError("Incompatible experimental dataset")
    records = [json.loads(line) for line in (args.dataset / "train.jsonl").read_text(encoding="utf-8").splitlines() if line.strip()]
    if not records:
        raise ValueError("No trainable sequences")
    sequence_length = dataset["sequenceLength"]
    feeds = [tensors(record, vocab, sequence_length) for record in records]
    if hashlib.sha256(args.archive.read_bytes()).hexdigest() != ARCHIVE_SHA:
        raise ValueError("Frozen source archive checksum mismatch")
    args.output.mkdir(parents=True, exist_ok=False)
    run_path = args.output / "run.json"
    run = dict(status="running", purpose="experimental pipeline development",
               architecture="simplekt", initialization="random Game embeddings and weights; no CSEDM checkpoint transfer",
               predictionTarget="first_swap_opportunity", encodingVersion="bubble-board-v1",
               evaluationStatus="deferred", deploymentReady=False, seed=args.seed,
               epochsRequested=args.epochs, maxSteps=args.max_steps,
               sourceArchiveSha256=ARCHIVE_SHA,
               datasetFilesSha256={name: hashlib.sha256((args.dataset / name).read_bytes()).hexdigest()
                                   for name in ("train.jsonl", "vocab.json", "dataset.json", "learner-splits.json")})
    run_path.write_text(json.dumps(run, indent=2) + "\n", encoding="utf-8")
    torch.set_num_threads(2)
    torch.manual_seed(args.seed)
    np.random.seed(args.seed)
    random.seed(args.seed)
    with zipfile.ZipFile(args.archive) as archive:
        cls = source_model(archive, args.output / "pinned_source")
    config = dict(d_model=256, n_blocks=2, dropout=.1, d_ff=256,
                  final_fc_dim=256, final_fc_dim2=256, num_attn_heads=4,
                  seq_len=sequence_length, emb_type="qid")
    model = cls(n_question=vocab["numConcepts"], n_pid=vocab["numQuestions"], **config)
    model.train()
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-4)
    losses, steps = [], 0
    for _ in range(args.epochs):
        order = list(range(len(feeds)))
        random.shuffle(order)
        for index in order:
            feed = feeds[index]
            optimizer.zero_grad(set_to_none=True)
            prediction = model(feed)[:, 1:]
            loss = torch.nn.functional.binary_cross_entropy(prediction, feed["shft_rseqs"].float())
            if not torch.isfinite(loss):
                raise ValueError("Non-finite training loss")
            loss.backward()
            norm = torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0, error_if_nonfinite=True)
            optimizer.step()
            losses.append(float(loss.detach()))
            steps += 1
            if args.max_steps and steps >= args.max_steps:
                break
        if args.max_steps and steps >= args.max_steps:
            break
    model.eval()
    checkpoint = args.output / "experimental-simplekt.pt"
    torch.save(model.state_dict(), checkpoint)
    restored = cls(n_question=vocab["numConcepts"], n_pid=vocab["numQuestions"], **config)
    restored.load_state_dict(torch.load(checkpoint, map_location="cpu", weights_only=True), strict=True)
    restored.eval()
    with torch.inference_mode():
        probe = feeds[0]
        before = model(probe)
        after = restored(probe)
        changed = {name: value.clone() for name, value in probe.items()}
        changed["shft_rseqs"][:, -1] = 1 - changed["shft_rseqs"][:, -1]
        if not torch.equal(before, after) or not torch.allclose(after, restored(changed), atol=1e-7, rtol=0):
            raise ValueError("Checkpoint reload or causal smoke check failed")
    (args.output / "model-config.json").write_text(json.dumps(config, indent=2) + "\n", encoding="utf-8")
    (args.output / "vocab.json").write_text(json.dumps(vocab, indent=2) + "\n", encoding="utf-8")
    run.update(status="completed", optimizerSteps=steps, trainingSequences=len(feeds),
               checkpointReloadPassed=True, currentResponseInvariant=True,
               meanTrainingLoss=float(np.mean(losses)), lastGradientNorm=float(norm),
               checkpointSha256=hashlib.sha256(checkpoint.read_bytes()).hexdigest(),
               torchVersion=torch.__version__,
               limitations="Training loss is a pipeline diagnostic, not validation or evidence of recommendation quality.")
    run_path.write_text(json.dumps(run, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(run, indent=2))


if __name__ == "__main__":
    main()
