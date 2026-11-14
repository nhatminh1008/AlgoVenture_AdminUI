"""Route a request to an explicitly configured model; never substitute another skill."""
from __future__ import annotations

from dataclasses import dataclass
import json
import os
from pathlib import Path
import re

from tutor import Tutor, unavailable

LESSON = re.compile(r"[a-z][a-z0-9-]{0,49}")
CONTRACT = re.compile(r"[a-z][a-z0-9._-]{0,79}")


@dataclass
class ModelBinding:
    id: str
    encoding: str
    target: str
    lessons: list[str]
    tutor: Tutor


class ModelRegistry:
    def __init__(self, models=(), *, configuration_error=None):
        self.models = list(models)
        self.configuration_error = configuration_error

    @classmethod
    def from_environment(cls):
        experimental = os.environ.get("AI_ALLOW_EXPERIMENTAL", "").lower() == "true"
        test_artifacts = os.environ.get("AI_ALLOW_TEST_ARTIFACTS", "").lower() == "true"
        registry = os.environ.get("AI_MODEL_REGISTRY")
        legacy = os.environ.get("AI_MODEL_MANIFEST")
        try:
            if registry:
                return cls.from_file(Path(registry), allow_experimental=experimental,
                                     allow_test_artifacts=test_artifacts)
            if legacy:
                return cls([cls._binding("legacy", Path(legacy), None, experimental, test_artifacts)])
            return cls()
        except (OSError, ValueError, TypeError, KeyError):
            # No connection settings, filesystem paths or exception text in public health.
            return cls(configuration_error="registry_invalid" if registry else "artifact_invalid")

    @classmethod
    def from_file(cls, path, *, allow_experimental=False, allow_test_artifacts=False):
        path = Path(path)
        config = json.loads(path.read_text(encoding="utf-8"))
        if (not isinstance(config, dict) or config.get("schemaVersion") != 1
                or not isinstance(config.get("models"), list) or not config["models"]):
            raise ValueError("Invalid model registry")
        models, identifiers = [], set()
        for item in config["models"]:
            if not isinstance(item, dict):
                raise ValueError("Invalid model registry entry")
            model_id = item.get("id")
            if not isinstance(model_id, str) or not CONTRACT.fullmatch(model_id) or model_id in identifiers:
                raise ValueError("Invalid or duplicate model ID")
            identifiers.add(model_id)
            model_path = Path(item["manifestPath"])
            if not model_path.is_absolute():
                model_path = path.parent / model_path
            models.append(cls._binding(model_id, model_path, item.get("lessonIds"),
                                       allow_experimental, allow_test_artifacts))
        routes = [(m.encoding, m.target, lesson) for m in models for lesson in m.lessons]
        if len(routes) != len(set(routes)):
            raise ValueError("Overlapping model routes")
        return cls(models)

    @staticmethod
    def _binding(model_id, path, lessons, experimental, test_artifacts):
        manifest = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(manifest, dict):
            raise ValueError("Invalid model manifest")
        encoding, target = manifest.get("encodingVersion"), manifest.get("predictionTarget")
        if any(not isinstance(value, str) or not CONTRACT.fullmatch(value) for value in (encoding, target)):
            raise ValueError("Invalid model contract")
        declared = manifest.get("lessonIds", ["bubble"] if encoding == "bubble-board-v1" else [])
        if (not isinstance(declared, list) or not declared
                or any(not isinstance(lesson, str) or not LESSON.fullmatch(lesson) for lesson in declared)):
            raise ValueError("Invalid manifest lesson coverage")
        lessons = declared if lessons is None else lessons
        if (not isinstance(lessons, list) or not lessons
                or any(not isinstance(lesson, str) or not LESSON.fullmatch(lesson) for lesson in lessons)
                or len(lessons) != len(set(lessons))):
            raise ValueError("Models must declare supported lesson IDs")
        if declared and not set(lessons).issubset(set(declared)):
            raise ValueError("Registry cannot expand model-declared lesson coverage")
        tutor = Tutor(str(path), allow_experimental=experimental, allow_test_artifacts=test_artifacts)
        return ModelBinding(model_id, encoding, target, list(lessons), tutor)

    @property
    def reason(self):
        if self.configuration_error:
            return self.configuration_error
        if any(model.tutor.reason == "ready" for model in self.models):
            return "ready"
        if any(model.tutor.reason == "experimental_ready" for model in self.models):
            return "experimental_ready"
        return "model_not_configured" if not self.models else "model_not_ready"

    @property
    def experimental(self):
        return any(model.tutor.experimental for model in self.models)

    def coverage(self):
        result = []
        for model in self.models:
            manifest = model.tutor.manifest or {}
            result.append(dict(id=model.id, encodingVersion=model.encoding,
                               predictionTarget=model.target, lessonIds=model.lessons,
                               modelVersion=manifest.get("modelVersion"), modelStatus=model.tutor.reason,
                               inferenceReady=model.tutor.session is not None,
                               experimental=model.tutor.experimental, testOnly=model.tutor.test_only,
                               qualityValidated=bool(model.tutor.session is not None
                                   and not model.tutor.experimental and not model.tutor.test_only
                                   and manifest.get("validation", {}).get("status") == "passed"),
                               lessonCoverage=[dict(lessonId=lesson,
                                   kcInVocab=(lesson + ".next_action.v1" in manifest.get("kcVocab", {})
                                       if model.encoding == "game-state-v1" else
                                       "bubble.next_swap.v1" in manifest.get("kcVocab", {})
                                       if model.encoding == "bubble-board-v1" else None))
                                   for lesson in model.lessons],
                               questionVocabSize=len(manifest.get("questionVocab", {})),
                               kcVocabSize=len(manifest.get("kcVocab", {}))))
        return result

    def recommend(self, history, candidates, *, prediction_target="first_swap_opportunity",
                  encoding_version="bubble-board-v1", lesson_id=None):
        if not history:
            return unavailable("insufficient_history", "no_observations")
        if self.configuration_error:
            return unavailable("model_not_ready", self.configuration_error)
        if not self.models:
            return unavailable("model_not_ready", "model_not_configured")
        matching = [model for model in self.models
                    if model.encoding == encoding_version and model.target == prediction_target]
        if not matching:
            return unavailable("model_not_ready", "unsupported_model_contract")
        if lesson_id is not None:
            matching = [model for model in matching if lesson_id in model.lessons]
            if not matching:
                return unavailable("model_not_ready", "unsupported_lesson")
        if len(matching) != 1:
            return unavailable("model_not_ready", "lesson_required_for_model_route")
        result = matching[0].tutor.recommend(history, candidates, prediction_target=prediction_target,
                                             encoding_version=encoding_version, lesson_id=lesson_id)
        return {**result, "lessonId": lesson_id, "modelId": matching[0].id}
