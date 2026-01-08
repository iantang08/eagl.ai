import pytest
from worker.analysis import (
    generate_mock_result,
    result_to_dict,
    PhaseTimestamp,
    RubricItem,
    AnalysisResult,
)


def test_generate_mock_result():
    result = generate_mock_result()

    assert result.criteria_version == "v1"
    assert 0 <= result.overall_score <= 100
    assert 0 <= result.analysis_confidence <= 1.0
    assert len(result.phases) > 0
    assert len(result.rubric) > 0


def test_result_to_dict():
    result = AnalysisResult(
        criteria_version="v1",
        overall_score=75,
        analysis_confidence=0.9,
        phases=[
            PhaseTimestamp("address", 0, 0),
            PhaseTimestamp("top", 30, 1000),
        ],
        metrics={"frames_analyzed": 60},
        rubric=[
            RubricItem("Head Stability", 80, 100, "Good"),
        ],
    )

    result_dict = result_to_dict(result)

    assert result_dict["criteria_version"] == "v1"
    assert result_dict["overall_score"] == 75
    assert len(result_dict["phases"]) == 2
    assert result_dict["phases"][0]["name"] == "address"
    assert len(result_dict["rubric"]) == 1
    assert result_dict["rubric"][0]["name"] == "Head Stability"


def test_phase_timestamp():
    phase = PhaseTimestamp("impact", 45, 1500)
    assert phase.name == "impact"
    assert phase.frame == 45
    assert phase.timestamp_ms == 1500


def test_rubric_item():
    item = RubricItem("Tempo", 70, 100, "Good tempo", timestamp_ms=1000)
    assert item.name == "Tempo"
    assert item.score == 70
    assert item.max_score == 100
    assert item.explanation == "Good tempo"
    assert item.timestamp_ms == 1000
