def test_create_profile(client, auth_headers):
    response = client.post(
        "/v1/onboarding/profile",
        headers=auth_headers,
        json={
            "goals": ["consistency", "distance"],
            "skill_level": "intermediate",
            "dominant_hand": "right",
            "typical_miss": "slice",
            "equipment_focus": ["driver", "iron"],
            "practice_frequency": "weekly",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["goals"] == ["consistency", "distance"]
    assert data["skill_level"] == "intermediate"
    assert data["dominant_hand"] == "right"


def test_update_profile(client, auth_headers):
    # Create initial profile
    client.post(
        "/v1/onboarding/profile",
        headers=auth_headers,
        json={"goals": ["consistency"], "skill_level": "beginner"},
    )

    # Update profile
    response = client.post(
        "/v1/onboarding/profile",
        headers=auth_headers,
        json={"goals": ["distance"], "skill_level": "advanced"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["goals"] == ["distance"]
    assert data["skill_level"] == "advanced"


def test_get_profile(client, auth_headers):
    # Create profile first
    client.post(
        "/v1/onboarding/profile",
        headers=auth_headers,
        json={"goals": ["consistency"], "skill_level": "intermediate"},
    )

    response = client.get("/v1/onboarding/profile", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["skill_level"] == "intermediate"


def test_get_profile_not_found(client, auth_headers):
    response = client.get("/v1/onboarding/profile", headers=auth_headers)
    assert response.status_code == 404
