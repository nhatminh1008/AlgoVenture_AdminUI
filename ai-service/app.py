import os
from contextlib import asynccontextmanager
from typing import Annotated, Literal

from fastapi import FastAPI
from pydantic import BaseModel, ConfigDict, Field, model_validator

from tutor import Tutor


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Observation(StrictModel):
    questionId: Annotated[str, Field(min_length=1, max_length=160)]
    kcId: Literal["bubble.next_swap.v1"]
    response: Literal[0, 1]


class Candidate(StrictModel):
    id: Annotated[str, Field(min_length=1, max_length=80)]
    questionId: Annotated[str, Field(min_length=1, max_length=160)]
    kcId: Literal["bubble.next_swap.v1"]


class Recommend(StrictModel):
    schemaVersion: Literal[1]
    history: Annotated[list[Observation], Field(max_length=2000)]
    candidates: Annotated[list[Candidate], Field(max_length=100)]

    @model_validator(mode="after")
    def distinct_candidates(self):
        if len({row.id for row in self.candidates}) != len(self.candidates):
            raise ValueError("Duplicate candidate IDs")
        return self


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.tutor = Tutor(os.environ.get("AI_MODEL_MANIFEST"),
                            allow_experimental=os.environ.get("AI_ALLOW_EXPERIMENTAL", "").lower() == "true")
    yield


app = FastAPI(title="AlgoVenture Adaptive Learning", lifespan=lifespan)


@app.get("/health")
def health():
    tutor = app.state.tutor
    return {"status": "ok", "modelStatus": tutor.reason,
            "experimental": tutor.experimental}


@app.post("/v1/recommendations")
def recommend(body: Recommend):
    return app.state.tutor.recommend([row.model_dump() for row in body.history],
                                     [row.model_dump() for row in body.candidates])
