import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import init_db, get_db_connection

class TestAuthAndTracking(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        cls.client = TestClient(app)

    def tearDown(self):
        with get_db_connection() as conn:
            conn.execute("DELETE FROM users WHERE email LIKE '%@authtest.com'")

    def test_auth_and_scoped_tracking_flow(self):
        # 1. Register user 1
        r1 = self.client.post(
            "/api/v1/auth/register",
            json={"email": "alice@authtest.com", "password": "password123"},
        )
        self.assertEqual(r1.status_code, 201)
        token1 = r1.json()["access_token"]
        self.assertTrue(token1)

        # 2. Register user 2
        r2 = self.client.post(
            "/api/v1/auth/register",
            json={"email": "bob@authtest.com", "password": "password456"},
        )
        self.assertEqual(r2.status_code, 201)
        token2 = r2.json()["access_token"]
        self.assertTrue(token2)

        # 3. Duplicate email
        r_dup = self.client.post(
            "/api/v1/auth/register",
            json={"email": "alice@authtest.com", "password": "password123"},
        )
        self.assertEqual(r_dup.status_code, 409)

        # 4. Login user 1
        r_login = self.client.post(
            "/api/v1/auth/login",
            json={"email": "alice@authtest.com", "password": "password123"},
        )
        self.assertEqual(r_login.status_code, 200)

        # 5. Invalid credentials login
        r_bad_login = self.client.post(
            "/api/v1/auth/login",
            json={"email": "alice@authtest.com", "password": "wrongpassword"},
        )
        self.assertEqual(r_bad_login.status_code, 401)

        # 6. /me endpoint
        h1 = {"Authorization": f"Bearer {token1}"}
        h2 = {"Authorization": f"Bearer {token2}"}
        me1 = self.client.get("/api/v1/auth/me", headers=h1)
        self.assertEqual(me1.status_code, 200)
        self.assertEqual(me1.json()["email"], "alice@authtest.com")

        me2 = self.client.get("/api/v1/auth/me", headers=h2)
        self.assertEqual(me2.status_code, 200)
        self.assertEqual(me2.json()["email"], "bob@authtest.com")

        # 7. Tracking isolation
        probs = self.client.get("/api/v1/problems?page_size=1", headers=h1).json()
        if probs["items"]:
            pid = probs["items"][0]["id"]

            # Alice marks solved
            tr1 = self.client.patch(
                f"/api/v1/problems/{pid}/tracking",
                json={"status": "solved", "notes": "Alice note", "is_starred": True},
                headers=h1,
            )
            self.assertEqual(tr1.status_code, 200)

            # Bob marks in_progress
            tr2 = self.client.patch(
                f"/api/v1/problems/{pid}/tracking",
                json={"status": "in_progress", "notes": "Bob note", "is_starred": False},
                headers=h2,
            )
            self.assertEqual(tr2.status_code, 200)

            # Check Alice view
            p1 = self.client.get(f"/api/v1/problems/{pid}", headers=h1).json()
            self.assertEqual(p1["status"], "solved")
            self.assertEqual(p1["notes"], "Alice note")
            self.assertTrue(p1["is_starred"])

            # Check Bob view
            p2 = self.client.get(f"/api/v1/problems/{pid}", headers=h2).json()
            self.assertEqual(p2["status"], "in_progress")
            self.assertEqual(p2["notes"], "Bob note")
            self.assertFalse(p2["is_starred"])

            # Verify stats isolation
            s1 = self.client.get("/api/v1/stats", headers=h1).json()
            s2 = self.client.get("/api/v1/stats", headers=h2).json()
            self.assertGreaterEqual(s1["solved_problems"], 1)
            self.assertEqual(s2["solved_problems"], 0)


if __name__ == "__main__":
    unittest.main()
