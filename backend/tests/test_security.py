import unittest
import uuid

from fastapi.testclient import TestClient
from slowapi import Limiter
from sqlalchemy import text

from app.db.session import get_db, init_db
from app.main import app
from app.main import limiter as main_limiter
from app.api.v1.auth import limiter as auth_limiter
from app.repositories.session_repo import _hash_token


class TestSecurity(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        cls.client = TestClient(app)
        main_limiter.enabled = False
        auth_limiter.enabled = False

    @classmethod
    def tearDownClass(cls):
        main_limiter.enabled = True
        auth_limiter.enabled = True

    def tearDown(self):
        with get_db() as db:
            db.execute(text(
                "DELETE FROM sessions WHERE user_id IN "
                "(SELECT id FROM users WHERE email LIKE '%@sectest.com')"
            ))
            db.execute(text("DELETE FROM users WHERE email LIKE '%@sectest.com'"))

    def _unique_email(self):
        return f"{uuid.uuid4().hex[:8]}@sectest.com"

    def _register(self, email=None, password="validpass123"):
        if email is None:
            email = self._unique_email()
        r = self.client.post(
            "/api/v1/auth/register", json={"email": email, "password": password}
        )
        return r, email

    def _login(self, email, password="validpass123"):
        return self.client.post(
            "/api/v1/auth/login", json={"email": email, "password": password}
        )

    # --- Password length ---

    def test_register_password_too_long_rejected(self):
        r, _ = self._register(password="a" * 129)
        self.assertEqual(r.status_code, 422)

    def test_register_password_at_max_accepted(self):
        r, _ = self._register(password="a" * 128)
        self.assertEqual(r.status_code, 201)

    def test_register_password_too_short_rejected(self):
        r, _ = self._register(password="short")
        self.assertEqual(r.status_code, 422)

    def test_login_password_too_long_rejected(self):
        _, email = self._register()
        r = self._login(email, password="a" * 129)
        self.assertEqual(r.status_code, 422)

    # --- Session token hashing ---

    def test_session_token_stored_as_hash(self):
        r, _ = self._register()
        raw_token = r.json()["access_token"]

        with get_db() as db:
            row = db.execute(
                text("SELECT id FROM sessions WHERE id = :hashed"),
                {"hashed": _hash_token(raw_token)},
            ).first()
            self.assertIsNotNone(row, "Hashed token should exist in DB")

            raw_row = db.execute(
                text("SELECT id FROM sessions WHERE id = :raw"),
                {"raw": raw_token},
            ).first()
            self.assertIsNone(raw_row, "Raw token should NOT exist in DB")

    # --- Session cap ---

    def test_session_cap_evicts_oldest(self):
        from app.repositories.session_repo import SessionRepository

        _, email = self._register()

        with get_db() as db:
            uid = db.execute(
                text("SELECT id FROM users WHERE email = :e"), {"e": email}
            ).scalar()

        tokens = []
        for _ in range(12):
            with get_db() as db:
                tokens.append(SessionRepository.create_session(db, uid))

        with get_db() as db:
            count = db.execute(
                text("SELECT COUNT(*) FROM sessions WHERE user_id = :uid"),
                {"uid": uid},
            ).scalar()
            self.assertLessEqual(count, 10, "Sessions per user should be capped at 10")

        # Oldest token should be invalidated
        h_old = {"Authorization": f"Bearer {tokens[0]}"}
        self.assertEqual(self.client.get("/api/v1/auth/me", headers=h_old).status_code, 401)

        # Newest token should still work
        h_new = {"Authorization": f"Bearer {tokens[-1]}"}
        self.assertEqual(self.client.get("/api/v1/auth/me", headers=h_new).status_code, 200)

    # --- Logout requires auth ---

    def test_logout_without_auth_returns_401(self):
        r = self.client.post("/api/v1/auth/logout")
        self.assertEqual(r.status_code, 401)

    def test_logout_with_invalid_token_returns_401(self):
        r = self.client.post(
            "/api/v1/auth/logout",
            headers={"Authorization": "Bearer fake_token_abc"},
        )
        self.assertEqual(r.status_code, 401)

    def test_logout_invalidates_session(self):
        _, email = self._register()
        r = self._login(email)
        token = r.json()["access_token"]
        h = {"Authorization": f"Bearer {token}"}

        self.assertEqual(self.client.post("/api/v1/auth/logout", headers=h).status_code, 200)
        self.assertEqual(self.client.get("/api/v1/auth/me", headers=h).status_code, 401)



if __name__ == "__main__":
    unittest.main()
