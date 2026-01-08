def test_signup(client):
    response = client.post(
        "/v1/auth/signup",
        json={"email": "newuser@example.com", "password": "password123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "newuser@example.com"


def test_signup_duplicate_email(client, test_user):
    response = client.post(
        "/v1/auth/signup",
        json={"email": "test@example.com", "password": "password123"},
    )
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]


def test_login(client, test_user):
    response = client.post(
        "/v1/auth/login",
        json={"email": "test@example.com", "password": "password123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "test@example.com"


def test_login_invalid_password(client, test_user):
    response = client.post(
        "/v1/auth/login",
        json={"email": "test@example.com", "password": "wrongpassword"},
    )
    assert response.status_code == 401


def test_login_invalid_email(client):
    response = client.post(
        "/v1/auth/login",
        json={"email": "nonexistent@example.com", "password": "password123"},
    )
    assert response.status_code == 401


def test_get_me(client, auth_headers):
    response = client.get("/v1/auth/me", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["email"] == "test@example.com"


def test_get_me_unauthorized(client):
    response = client.get("/v1/auth/me")
    assert response.status_code == 403
