import json

from django.test import Client, TestCase

from accounts.models import User

from .models import Notification, NotificationBroadcast
from .services import create_notification


class NotificationApiTests(TestCase):
    def setUp(self):
        self.client = Client(enforce_csrf_checks=True)
        self.csrf_token = self.client.get("/api/auth/csrf/").json()["csrfToken"]
        self.investor = User.objects.create_user(
            username="investor@example.com",
            email="investor@example.com",
            password="test-password-123",
            role=User.Role.INVESTOR,
        )
        self.entrepreneur = User.objects.create_user(
            username="entrepreneur@example.com",
            email="entrepreneur@example.com",
            password="test-password-123",
            role=User.Role.ENTREPRENEUR,
        )
        self.student = User.objects.create_user(
            username="student@example.com",
            email="student@example.com",
            password="test-password-123",
            role=User.Role.STUDENT,
        )
        self.admin = User.objects.create_user(
            username="admin@example.com",
            email="admin@example.com",
            password="test-password-123",
            role=User.Role.ADMIN,
        )
        self.other_admin = User.objects.create_user(
            username="admin2@example.com",
            email="admin2@example.com",
            password="test-password-123",
            role=User.Role.ADMIN,
        )

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

    def test_inbox_is_authenticated_and_scoped_to_the_recipient(self):
        own = create_notification(
            self.investor,
            kind=Notification.Kind.MESSAGE,
            title="Nouveau message",
            body="Un nouveau message vous attend.",
        )
        create_notification(
            self.entrepreneur,
            kind=Notification.Kind.APPOINTMENT,
            title="Rendez-vous",
            body="Une demande est arrivée.",
        )
        self.assertEqual(self.client.get("/api/notifications/").status_code, 401)

        self.client.force_login(self.investor)
        response = self.client.get("/api/notifications/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["unreadCount"], 1)
        self.assertEqual(
            [item["id"] for item in response.json()["notifications"]],
            [own.pk],
        )

    def test_user_can_mark_one_all_and_delete_only_their_own_notifications(self):
        own = create_notification(
            self.investor,
            kind=Notification.Kind.MESSAGE,
            title="Message",
            body="Un nouveau message.",
        )
        other = create_notification(
            self.entrepreneur,
            kind=Notification.Kind.MESSAGE,
            title="Message",
            body="Un autre message.",
        )
        self.client.force_login(self.investor)
        mark_response = self.patch_json(
            f"/api/notifications/{own.pk}/",
            {"action": "mark_read"},
        )
        self.assertEqual(mark_response.status_code, 200)
        self.assertIsNotNone(own.__class__.objects.get(pk=own.pk).read_at)

        own_unread = create_notification(
            self.investor,
            kind=Notification.Kind.ANNOUNCEMENT,
            title="Annonce",
            body="Information importante.",
        )
        all_read_response = self.post_json(
            "/api/notifications/",
            {"action": "mark_all_read"},
        )
        self.assertEqual(all_read_response.status_code, 200)
        self.assertEqual(all_read_response.json()["updated"], 1)

        forbidden_response = self.client.delete(
            f"/api/notifications/{other.pk}/",
            HTTP_X_CSRFTOKEN=self.csrf_token,
        )
        delete_response = self.client.delete(
            f"/api/notifications/{own.pk}/",
            HTTP_X_CSRFTOKEN=self.csrf_token,
        )
        self.assertEqual(forbidden_response.status_code, 404)
        self.assertEqual(delete_response.status_code, 200)
        self.assertFalse(Notification.objects.filter(pk=own.pk).exists())
        self.assertTrue(Notification.objects.filter(pk=own_unread.pk).exists())

    def test_mark_read_requires_csrf_and_valid_action(self):
        notification = create_notification(
            self.investor,
            kind=Notification.Kind.MESSAGE,
            title="Message",
            body="Un nouveau message.",
        )
        self.client.force_login(self.investor)
        no_csrf = self.client.patch(
            f"/api/notifications/{notification.pk}/",
            data=json.dumps({"action": "mark_read"}),
            content_type="application/json",
        )
        invalid_action = self.patch_json(
            f"/api/notifications/{notification.pk}/",
            {"action": "archive"},
        )
        self.assertEqual(no_csrf.status_code, 403)
        self.assertEqual(invalid_action.status_code, 400)

    def test_admin_can_broadcast_to_all_active_users_and_list_history(self):
        self.client.force_login(self.admin)
        response = self.post_json(
            "/api/admin/notifications/",
            {
                "title": "Maintenance planifiée",
                "body": "Le service sera momentanément indisponible.",
                "targetUrl": "/",
            },
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["broadcast"]["recipientCount"], 5)
        self.assertEqual(Notification.objects.filter(kind=Notification.Kind.ANNOUNCEMENT).count(), 5)
        broadcast = NotificationBroadcast.objects.get()
        self.assertEqual(broadcast.notifications.count(), 5)

        history = self.client.get("/api/admin/notifications/")
        self.assertEqual(history.status_code, 200)
        self.assertEqual(history.json()["broadcasts"][0]["recipientCount"], 5)
        self.assertNotIn("notifications", history.json()["broadcasts"][0])

        self.client.force_login(self.investor)
        self.assertEqual(
            self.client.get("/api/admin/notifications/").status_code,
            403,
        )

    def test_admin_broadcast_validates_content_and_internal_link(self):
        self.client.force_login(self.admin)
        for target_url in ("https://example.com", "//example.com", "/\\example"):
            with self.subTest(target_url=target_url):
                response = self.post_json(
                    "/api/admin/notifications/",
                    {
                        "title": "Annonce",
                        "body": "Message de test.",
                        "targetUrl": target_url,
                    },
                )
                self.assertEqual(response.status_code, 400)
        self.assertFalse(NotificationBroadcast.objects.exists())
