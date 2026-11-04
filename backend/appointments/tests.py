import json
from datetime import timedelta

from django.test import Client, TestCase
from django.utils import timezone

from access_requests.models import ProjectAccessRequest
from accounts.models import User
from projects.models import EntrepreneurProject
from notifications.models import Notification

from .models import Appointment


class AppointmentApiTests(TestCase):
    def setUp(self):
        self.client = Client(enforce_csrf_checks=True)
        self.csrf_token = self.client.get("/api/auth/csrf/").json()["csrfToken"]
        self.investor = User.objects.create_user(
            username="investor@example.com",
            email="investor@example.com",
            password="SecurePassword123!",
            role=User.Role.INVESTOR,
        )
        self.entrepreneur = User.objects.create_user(
            username="entrepreneur@example.com",
            email="entrepreneur@example.com",
            password="SecurePassword123!",
            role=User.Role.ENTREPRENEUR,
        )
        self.other_entrepreneur = User.objects.create_user(
            username="other@example.com",
            email="other@example.com",
            password="SecurePassword123!",
            role=User.Role.ENTREPRENEUR,
        )
        self.admin = User.objects.create_user(
            username="admin@example.com",
            email="admin@example.com",
            password="SecurePassword123!",
            role=User.Role.ADMIN,
        )
        self.project = self.create_project()

    def create_project(self, **overrides):
        fields = {
            "owner": self.entrepreneur,
            "title": "Projet énergie renouvelable",
            "description": "Un projet public présenté aux investisseurs.",
            "summary": "Résumé du projet pour le catalogue public.",
            "sector": "Énergie",
            "region": "Conakry",
            "funding_goal": 100_000_000,
            "stage": EntrepreneurProject.Stage.PROTOTYPE,
            "status": EntrepreneurProject.Status.PUBLISHED,
            "visibility": EntrepreneurProject.Visibility.PUBLIC,
            "slug": "projet-energie-renouvelable",
        }
        fields.update(overrides)
        return EntrepreneurProject.objects.create(**fields)

    def future_slot(self, *, minutes=0):
        value = timezone.now() + timedelta(days=2, minutes=minutes)
        rounded_minute = ((value.minute + 29) // 30 * 30) % 60
        if rounded_minute == 0:
            value = value.replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)
        else:
            value = value.replace(
                minute=rounded_minute,
                second=0,
                microsecond=0,
            )
        return value

    def post_json(self, path, payload, csrf_token=None):
        return self.client.post(
            path,
            data=json.dumps(payload),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf_token or self.csrf_token,
        )

    def patch_json(self, path, payload, csrf_token=None):
        return self.client.patch(
            path,
            data=json.dumps(payload),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf_token or self.csrf_token,
        )

    def create_appointment(self, **overrides):
        fields = {
            "investor": self.investor,
            "entrepreneur": self.entrepreneur,
            "project": self.project,
            "scheduled_at": self.future_slot(),
            "message": "Je souhaite discuter du projet.",
        }
        fields.update(overrides)
        return Appointment.objects.create(**fields)

    def request_payload(self, **overrides):
        payload = {
            "projectId": self.project.pk,
            "scheduledAt": self.future_slot().isoformat(),
            "message": "Je souhaite discuter du projet.",
        }
        payload.update(overrides)
        return payload

    def test_investor_can_request_and_list_appointment(self):
        self.client.force_login(self.investor)
        response = self.post_json(
            "/api/investor/appointments/",
            self.request_payload(),
        )

        self.assertEqual(response.status_code, 201)
        appointment = Appointment.objects.get()
        self.assertEqual(appointment.investor, self.investor)
        self.assertEqual(appointment.entrepreneur, self.entrepreneur)
        self.assertEqual(appointment.project, self.project)
        self.assertEqual(appointment.status, Appointment.Status.PENDING)
        self.assertTrue(
            Notification.objects.filter(
                recipient=self.entrepreneur,
                kind=Notification.Kind.APPOINTMENT,
            ).exists()
        )

        list_response = self.client.get("/api/investor/appointments/")
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(
            list_response.json()["appointments"][0]["id"],
            appointment.pk,
        )

    def test_appointment_requires_investor_and_published_accessible_project(self):
        self.assertEqual(
            self.client.get("/api/investor/appointments/").status_code,
            401,
        )
        self.client.force_login(self.entrepreneur)
        self.assertEqual(
            self.client.get("/api/investor/appointments/").status_code,
            403,
        )

        self.client.force_login(self.investor)
        private_project = self.create_project(
            title="Projet restreint",
            slug="projet-restreint",
            visibility=EntrepreneurProject.Visibility.RESTRICTED,
        )
        denied_response = self.post_json(
            "/api/investor/appointments/",
            self.request_payload(projectId=private_project.pk),
        )
        self.assertEqual(denied_response.status_code, 403)

        ProjectAccessRequest.objects.create(
            project=private_project,
            investor=self.investor,
            justification="Je souhaite évaluer cette opportunité.",
            status=ProjectAccessRequest.Status.APPROVED,
        )
        allowed_response = self.post_json(
            "/api/investor/appointments/",
            self.request_payload(projectId=private_project.pk),
        )
        self.assertEqual(allowed_response.status_code, 201)

    def test_schedule_and_message_validation(self):
        self.client.force_login(self.investor)
        invalid_payloads = [
            self.request_payload(message="Trop"),
            self.request_payload(scheduledAt=timezone.now().isoformat()),
            self.request_payload(
                scheduledAt=(self.future_slot().replace(minute=15)).isoformat()
            ),
            self.request_payload(scheduledAt=self.future_slot().replace(tzinfo=None).isoformat()),
            self.request_payload(
                scheduledAt=(timezone.now() + timedelta(days=100)).replace(
                    minute=0, second=0, microsecond=0
                ).isoformat()
            ),
        ]
        for payload in invalid_payloads:
            with self.subTest(payload=payload):
                response = self.post_json("/api/investor/appointments/", payload)
                self.assertEqual(response.status_code, 400)
        self.assertFalse(Appointment.objects.exists())

    def test_overlapping_active_appointments_are_rejected(self):
        self.client.force_login(self.investor)
        scheduled_at = self.future_slot()
        self.create_appointment(scheduled_at=scheduled_at)
        response = self.post_json(
            "/api/investor/appointments/",
            self.request_payload(scheduledAt=scheduled_at.isoformat()),
        )
        self.assertEqual(response.status_code, 409)
        self.assertEqual(Appointment.objects.count(), 1)

    def test_entrepreneur_can_confirm_and_decline_only_own_pending_requests(self):
        appointment = self.create_appointment()
        self.client.force_login(self.other_entrepreneur)
        denied_response = self.patch_json(
            f"/api/entrepreneur/appointments/{appointment.pk}/",
            {"decision": "CONFIRMED", "responseNote": ""},
        )
        self.assertEqual(denied_response.status_code, 404)

        self.client.force_login(self.entrepreneur)
        confirmed_response = self.patch_json(
            f"/api/entrepreneur/appointments/{appointment.pk}/",
            {"decision": "CONFIRMED", "responseNote": "Créneau confirmé."},
        )
        repeated_response = self.patch_json(
            f"/api/entrepreneur/appointments/{appointment.pk}/",
            {"decision": "DECLINED", "responseNote": ""},
        )
        appointment.refresh_from_db()
        self.assertEqual(confirmed_response.status_code, 200)
        self.assertEqual(repeated_response.status_code, 409)
        self.assertEqual(appointment.status, Appointment.Status.CONFIRMED)
        self.assertEqual(appointment.response_note, "Créneau confirmé.")
        self.assertIsNotNone(appointment.responded_at)
        self.assertTrue(
            Notification.objects.filter(
                recipient=self.investor,
                kind=Notification.Kind.APPOINTMENT,
            ).exists()
        )

    def test_investor_can_cancel_pending_but_not_confirmed_appointments(self):
        pending = self.create_appointment()
        confirmed = self.create_appointment(
            scheduled_at=self.future_slot(minutes=30),
            status=Appointment.Status.CONFIRMED,
        )
        self.client.force_login(self.investor)
        cancelled_response = self.patch_json(
            f"/api/investor/appointments/{pending.pk}/",
            {"action": "cancel"},
        )
        confirmed_response = self.patch_json(
            f"/api/investor/appointments/{confirmed.pk}/",
            {"action": "cancel"},
        )

        pending.refresh_from_db()
        self.assertEqual(cancelled_response.status_code, 200)
        self.assertEqual(pending.status, Appointment.Status.CANCELLED)
        self.assertIsNotNone(pending.cancelled_at)
        self.assertEqual(confirmed_response.status_code, 409)

    def test_admin_can_search_filter_and_paginate_appointments(self):
        appointment = self.create_appointment()
        self.client.force_login(self.admin)
        response = self.client.get(
            "/api/admin/appointments/?q=énergie&status=PENDING&pageSize=1"
        )
        invalid_response = self.client.get(
            "/api/admin/appointments/?status=UNKNOWN"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json()["appointments"][0]["id"],
            appointment.pk,
        )
        self.assertEqual(response.json()["pagination"]["totalResults"], 1)
        self.assertEqual(invalid_response.status_code, 400)

        self.client.force_login(self.investor)
        forbidden_response = self.client.get("/api/admin/appointments/")
        self.assertEqual(forbidden_response.status_code, 403)
