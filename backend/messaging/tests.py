import json

from django.test import Client, TestCase

from access_requests.models import ProjectAccessRequest
from accounts.models import User
from projects.models import EntrepreneurProject
from notifications.models import Notification

from .models import Conversation, Message


class ConversationApiTests(TestCase):
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
        self.other_investor = User.objects.create_user(
            username="other-investor@example.com",
            email="other-investor@example.com",
            password="test-password-123",
            role=User.Role.INVESTOR,
        )
        self.admin = User.objects.create_user(
            username="admin@example.com",
            email="admin@example.com",
            password="test-password-123",
            role=User.Role.ADMIN,
        )
        self.project = EntrepreneurProject.objects.create(
            owner=self.entrepreneur,
            title="Projet énergie renouvelable",
            description="Un projet public présenté aux investisseurs.",
            summary="Résumé du projet pour le catalogue public.",
            sector="Énergie",
            region="Conakry",
            funding_goal=100_000_000,
            stage=EntrepreneurProject.Stage.PROTOTYPE,
            status=EntrepreneurProject.Status.PUBLISHED,
            visibility=EntrepreneurProject.Visibility.PUBLIC,
            slug="projet-energie-renouvelable",
        )

    def post_json(self, path, payload, csrf_token=None):
        return self.client.post(
            path,
            data=json.dumps(payload),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf_token or self.csrf_token,
        )

    def create_conversation(self):
        conversation = Conversation.objects.create(
            investor=self.investor,
            entrepreneur=self.entrepreneur,
            project=self.project,
        )
        return conversation

    def test_investor_can_start_and_reuse_project_conversation(self):
        self.client.force_login(self.investor)
        first_response = self.post_json(
            "/api/investor/conversations/",
            {"projectId": self.project.pk, "body": "Bonjour, intéressé par le projet."},
        )
        second_response = self.post_json(
            "/api/investor/conversations/",
            {"projectId": self.project.pk, "body": "Pouvons-nous en parler ?"},
        )

        self.assertEqual(first_response.status_code, 201)
        self.assertEqual(second_response.status_code, 201)
        self.assertEqual(Conversation.objects.count(), 1)
        self.assertEqual(Message.objects.count(), 2)
        self.assertEqual(
            Notification.objects.filter(
                recipient=self.entrepreneur,
                kind=Notification.Kind.MESSAGE,
            ).count(),
            2,
        )
        self.assertNotIn(
            "Bonjour, intéressé par le projet.",
            Notification.objects.filter(recipient=self.entrepreneur)
            .first()
            .body,
        )
        self.assertEqual(
            second_response.json()["conversation"]["lastMessageBody"],
            "Pouvons-nous en parler ?",
        )

    def test_start_requires_investor_and_accessible_published_project(self):
        self.assertEqual(
            self.client.get("/api/investor/conversations/").status_code,
            401,
        )
        self.client.force_login(self.entrepreneur)
        self.assertEqual(
            self.client.get("/api/investor/conversations/").status_code,
            403,
        )

        self.client.force_login(self.investor)
        restricted_project = EntrepreneurProject.objects.create(
            owner=self.entrepreneur,
            title="Projet restreint",
            description="Un projet accessible après approbation.",
            summary="Résumé du projet restreint.",
            sector="Énergie",
            region="Conakry",
            funding_goal=50_000_000,
            stage=EntrepreneurProject.Stage.PROTOTYPE,
            status=EntrepreneurProject.Status.PUBLISHED,
            visibility=EntrepreneurProject.Visibility.RESTRICTED,
            slug="projet-restreint",
        )
        denied_response = self.post_json(
            "/api/investor/conversations/",
            {"projectId": restricted_project.pk, "body": "Bonjour pour ce projet."},
        )
        self.assertEqual(denied_response.status_code, 403)

        ProjectAccessRequest.objects.create(
            project=restricted_project,
            investor=self.investor,
            justification="Je souhaite évaluer cette opportunité.",
            status=ProjectAccessRequest.Status.APPROVED,
        )
        allowed_response = self.post_json(
            "/api/investor/conversations/",
            {"projectId": restricted_project.pk, "body": "Bonjour pour ce projet."},
        )
        self.assertEqual(allowed_response.status_code, 201)

    def test_only_conversation_participants_can_read_or_send_messages(self):
        conversation = self.create_conversation()
        self.client.force_login(self.other_investor)
        url = f"/api/investor/conversations/{conversation.pk}/messages/"
        self.assertEqual(self.client.get(url).status_code, 404)
        self.assertEqual(
            self.post_json(url, {"body": "Message non autorisé"}).status_code,
            404,
        )

        self.client.force_login(self.entrepreneur)
        response = self.post_json(
            f"/api/entrepreneur/conversations/{conversation.pk}/messages/",
            {"body": "Réponse de l’entrepreneur."},
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Message.objects.get().sender, self.entrepreneur)

    def test_message_validation_and_csrf(self):
        self.client.force_login(self.investor)
        payload = {"projectId": self.project.pk, "body": "Bonjour le porteur."}
        self.assertEqual(
            self.client.post(
                "/api/investor/conversations/",
                data=json.dumps(payload),
                content_type="application/json",
            ).status_code,
            403,
        )
        for body in ("", "   ", "x" * 4001):
            with self.subTest(length=len(body)):
                response = self.post_json(
                    "/api/investor/conversations/",
                    {"projectId": self.project.pk, "body": body},
                )
                self.assertEqual(response.status_code, 400)
        self.assertFalse(Conversation.objects.exists())

    def test_read_receipts_are_scoped_to_the_other_participant_messages(self):
        conversation = self.create_conversation()
        incoming = Message.objects.create(
            conversation=conversation,
            sender=self.entrepreneur,
            body="Bonjour l’investisseur.",
        )
        outgoing = Message.objects.create(
            conversation=conversation,
            sender=self.investor,
            body="Merci pour votre retour.",
        )
        self.client.force_login(self.investor)
        response = self.client.post(
            f"/api/conversations/{conversation.pk}/read/",
            HTTP_X_CSRFTOKEN=self.csrf_token,
        )
        incoming.refresh_from_db()
        outgoing.refresh_from_db()
        self.assertEqual(response.status_code, 200)
        self.assertIsNotNone(incoming.read_at)
        self.assertIsNone(outgoing.read_at)

    def test_admin_can_only_see_conversation_metadata(self):
        conversation = self.create_conversation()
        Message.objects.create(
            conversation=conversation,
            sender=self.investor,
            body="Contenu strictement privé.",
        )
        self.client.force_login(self.admin)
        response = self.client.get("/api/admin/conversations/")
        self.assertEqual(response.status_code, 200)
        payload = response.json()["conversations"][0]
        self.assertEqual(payload["messageCount"], 1)
        self.assertNotIn("lastMessageBody", payload)
        self.assertNotIn("body", payload)

        self.client.force_login(self.investor)
        forbidden_response = self.client.get("/api/admin/conversations/")
        self.assertEqual(forbidden_response.status_code, 403)
