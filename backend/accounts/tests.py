import json

from django.core import mail
from django.test import Client, TestCase, override_settings
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.contrib.auth.tokens import default_token_generator

from .models import User


class AuthApiTests(TestCase):
    def setUp(self):
        self.client = Client(enforce_csrf_checks=True)
        self.csrf_token = self.client.get("/api/auth/csrf/").json()["csrfToken"]

    def post_json(self, path, payload, csrf_token=None):
        return self.client.post(
            path,
            data=json.dumps(payload),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf_token or self.csrf_token,
        )

    def registration_payload(self, **overrides):
        payload = {
            "full_name": "Aissatou Diallo",
            "email": "Aissatou@example.com",
            "phone_number": "+224 622 00 00 00",
            "password": "Vigorous!Guinea42",
            "role": User.Role.ENTREPRENEUR,
            "terms_accepted": True,
            "marketing_consent": False,
            "project_name": "Agri Kipe",
            "sector": "AGRICULTURE",
        }
        payload.update(overrides)
        return payload

    def create_user(self, email="aissatou@example.com", password="Vigorous!Guinea42"):
        return User.objects.create_user(
            username=email,
            email=email,
            first_name="Aissatou",
            last_name="Diallo",
            password=password,
        )

    def test_registration_creates_hashed_user_and_persists_consents(self):
        response = self.post_json(
            "/api/auth/register/",
            self.registration_payload(marketing_consent=True),
        )

        self.assertEqual(response.status_code, 201)
        user = User.objects.get(email="aissatou@example.com")
        self.assertTrue(user.check_password("Vigorous!Guinea42"))
        self.assertNotEqual(user.password, "Vigorous!Guinea42")
        self.assertEqual(user.role, User.Role.ENTREPRENEUR)
        self.assertEqual(
            user.profile_data,
            {"project_name": "Agri Kipe", "sector": "AGRICULTURE"},
        )
        self.assertIsNotNone(user.terms_accepted_at)
        self.assertTrue(user.marketing_consent)

    def test_registration_rejects_missing_terms_and_duplicate_email(self):
        missing_terms = self.post_json(
            "/api/auth/register/",
            self.registration_payload(terms_accepted=False),
        )
        self.assertEqual(missing_terms.status_code, 400)
        self.assertFalse(User.objects.exists())

        self.create_user()
        duplicate = self.post_json(
            "/api/auth/register/",
            self.registration_payload(),
        )
        self.assertEqual(duplicate.status_code, 400)
        self.assertEqual(User.objects.count(), 1)

    def test_login_requires_csrf_and_creates_session_for_valid_credentials(self):
        self.create_user()
        response_without_csrf = self.post_json(
            "/api/auth/login/",
            {"email": "aissatou@example.com", "password": "Vigorous!Guinea42"},
            csrf_token="invalid-token",
        )
        self.assertEqual(response_without_csrf.status_code, 403)

        response = self.post_json(
            "/api/auth/login/",
            {
                "email": "AISSATOU@example.com",
                "password": "Vigorous!Guinea42",
                "remember_me": True,
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["detail"], "Connexion réussie.")
        self.assertIn("_auth_user_id", self.client.session)
        self.assertEqual(self.client.session.get_expiry_age(), 60 * 60 * 24 * 14)

    def test_session_returns_safe_user_profile_after_login(self):
        user = self.create_user()
        user.role = User.Role.INVESTOR
        user.save(update_fields=["role"])
        login_response = self.post_json(
            "/api/auth/login/",
            {"email": user.email, "password": "Vigorous!Guinea42"},
        )

        self.assertEqual(login_response.status_code, 200)
        self.assertEqual(login_response.json()["user"]["role"], User.Role.INVESTOR)
        self.assertNotIn("password", login_response.json()["user"])

        session_response = self.client.get("/api/auth/session/")
        self.assertEqual(session_response.status_code, 200)
        self.assertEqual(
            session_response.json()["user"],
            {
                "id": user.pk,
                "firstName": "Aissatou",
                "lastName": "Diallo",
                "fullName": "Aissatou Diallo",
                "email": user.email,
                "role": User.Role.INVESTOR,
                "isVerified": False,
            },
        )

    def test_session_rejects_anonymous_requests(self):
        response = self.client.get("/api/auth/session/")

        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json(), {"detail": "Vous devez vous connecter."})

    def test_student_profile_is_private_to_authenticated_students(self):
        anonymous_response = self.client.get("/api/student/profile/")
        self.assertEqual(anonymous_response.status_code, 401)

        investor = self.create_user()
        investor.role = User.Role.INVESTOR
        investor.save(update_fields=["role"])
        self.client.force_login(investor)
        wrong_role_response = self.client.get("/api/student/profile/")
        self.assertEqual(wrong_role_response.status_code, 403)

    def test_student_can_read_and_update_their_profile(self):
        student = self.create_user()
        student.role = User.Role.STUDENT
        student.profile_data = {
            "institution": "Université de Conakry",
            "study_field": "Économie",
        }
        student.save(update_fields=["role", "profile_data"])
        self.client.force_login(student)

        read_response = self.client.get("/api/student/profile/")
        self.assertEqual(
            read_response.json(),
            {"institution": "Université de Conakry", "studyField": "Économie"},
        )

        update_response = self.client.patch(
            "/api/student/profile/",
            data=json.dumps(
                {
                    "institution": "Université Gamal Abdel Nasser",
                    "studyField": "Finance",
                }
            ),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=self.csrf_token,
        )
        self.assertEqual(update_response.status_code, 200)
        student.refresh_from_db()
        self.assertEqual(
            student.profile_data,
            {
                "institution": "Université Gamal Abdel Nasser",
                "study_field": "Finance",
            },
        )

    def test_student_profile_update_validates_payload_and_csrf(self):
        student = self.create_user()
        student.role = User.Role.STUDENT
        student.save(update_fields=["role"])
        self.client.force_login(student)

        invalid_response = self.client.patch(
            "/api/student/profile/",
            data=json.dumps({"institution": [], "studyField": "Finance"}),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=self.csrf_token,
        )
        self.assertEqual(invalid_response.status_code, 400)

        csrf_response = self.client.patch(
            "/api/student/profile/",
            data=json.dumps({"institution": "Université", "studyField": "Finance"}),
            content_type="application/json",
            HTTP_X_CSRFTOKEN="invalid-token",
        )
        self.assertEqual(csrf_response.status_code, 403)

    def test_login_failure_does_not_disclose_whether_email_exists(self):
        self.create_user()
        existing_email = self.post_json(
            "/api/auth/login/",
            {"email": "aissatou@example.com", "password": "incorrect"},
        )
        unknown_email = self.post_json(
            "/api/auth/login/",
            {"email": "unknown@example.com", "password": "incorrect"},
        )

        self.assertEqual(existing_email.status_code, 400)
        self.assertEqual(existing_email.json(), unknown_email.json())

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_password_reset_email_is_neutral_and_link_resets_password(self):
        user = self.create_user()
        response = self.post_json(
            "/api/auth/password-reset/",
            {"email": "aissatou@example.com"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("Si un compte correspond", response.json()["detail"])
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("/reinitialiser-mot-de-passe?uid=", mail.outbox[0].body)

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        reset_response = self.post_json(
            "/api/auth/password-reset/confirm/",
            {
                "uid": uid,
                "token": token,
                "new_password": "NewSecure!Guinea73",
            },
        )

        self.assertEqual(reset_response.status_code, 200)
        user.refresh_from_db()
        self.assertTrue(user.check_password("NewSecure!Guinea73"))

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_password_reset_response_does_not_disclose_unknown_email(self):
        response = self.post_json(
            "/api/auth/password-reset/",
            {"email": "unknown@example.com"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("Si un compte correspond", response.json()["detail"])
        self.assertEqual(len(mail.outbox), 0)
