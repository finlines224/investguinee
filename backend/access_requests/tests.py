import json

from django.test import Client, TestCase

from accounts.models import User
from notifications.models import Notification
from projects.models import EntrepreneurProject

from .models import ProjectAccessRequest


class ProjectAccessRequestApiTests(TestCase):
    def setUp(self):
        self.client = Client(enforce_csrf_checks=True)
        self.csrf_token = self.client.get("/api/auth/csrf/").json()["csrfToken"]
        self.investor = User.objects.create_user(
            username="investor@example.com",
            email="investor@example.com",
            password="SecurePassword123!",
            role=User.Role.INVESTOR,
        )
        self.owner = User.objects.create_user(
            username="owner@example.com",
            email="owner@example.com",
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
            "owner": self.owner,
            "title": "Projet solaire confidentiel",
            "description": "Détails réservés aux investisseurs autorisés.",
            "summary": "Résumé interne du projet.",
            "sector": "Énergie",
            "region": "Conakry",
            "funding_goal": 250_000_000,
            "stage": EntrepreneurProject.Stage.PROTOTYPE,
            "status": EntrepreneurProject.Status.PUBLISHED,
            "visibility": EntrepreneurProject.Visibility.RESTRICTED,
            "slug": "projet-solaire-confidentiel",
        }
        fields.update(overrides)
        return EntrepreneurProject.objects.create(**fields)

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

    def create_request(self, project=None):
        return ProjectAccessRequest.objects.create(
            project=project or self.project,
            investor=self.investor,
            justification="Je souhaite évaluer cette opportunité.",
        )

    def test_only_investors_can_browse_and_submit_access_requests(self):
        anonymous_response = self.client.get(
            "/api/investor/access-requests/projects/"
        )
        self.assertEqual(anonymous_response.status_code, 401)

        student = User.objects.create_user(
            username="student@example.com",
            email="student@example.com",
            password="SecurePassword123!",
            role=User.Role.STUDENT,
        )
        self.client.force_login(student)
        forbidden_response = self.client.get(
            "/api/investor/access-requests/projects/"
        )
        self.assertEqual(forbidden_response.status_code, 403)

    def test_project_list_only_exposes_teasers_for_published_restricted_projects(self):
        self.create_project(
            title="Projet réservé aux membres",
            slug="projet-membres",
            visibility=EntrepreneurProject.Visibility.MEMBERS_ONLY,
        )
        self.create_project(
            title="Projet public",
            slug="projet-public",
            visibility=EntrepreneurProject.Visibility.PUBLIC,
        )
        self.create_project(
            title="Projet en brouillon",
            slug="projet-brouillon",
            status=EntrepreneurProject.Status.DRAFT,
        )
        self.create_project(
            title="Projet du compte investisseur",
            slug="projet-proprietaire",
            owner=self.investor,
        )
        self.client.force_login(self.investor)

        response = self.client.get("/api/investor/access-requests/projects/")
        projects = response.json()["projects"]
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            {project["title"] for project in projects},
            {"Projet solaire confidentiel", "Projet réservé aux membres"},
        )
        self.assertNotIn("description", projects[0])
        self.assertNotIn("summary", projects[0])
        self.assertEqual(response.json()["pagination"]["totalResults"], 2)

    def test_investor_can_submit_request_and_cannot_duplicate_active_request(self):
        self.client.force_login(self.investor)
        payload = {
            "projectId": self.project.pk,
            "justification": "Je souhaite évaluer cette opportunité.",
        }

        response = self.post_json("/api/investor/access-requests/", payload)
        duplicate_response = self.post_json("/api/investor/access-requests/", payload)

        self.assertEqual(response.status_code, 201)
        request = ProjectAccessRequest.objects.get()
        self.assertEqual(request.investor, self.investor)
        self.assertEqual(request.project, self.project)
        self.assertEqual(request.status, ProjectAccessRequest.Status.PENDING)
        self.assertTrue(
            Notification.objects.filter(
                recipient=self.admin,
                kind=Notification.Kind.ACCESS_REQUEST,
            ).exists()
        )
        self.assertEqual(duplicate_response.status_code, 409)

        list_response = self.client.get("/api/investor/access-requests/")
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(list_response.json()["requests"][0]["id"], request.pk)

    def test_request_validation_and_visibility_rules(self):
        public_project = self.create_project(
            title="Projet déjà public",
            slug="projet-deja-public",
            visibility=EntrepreneurProject.Visibility.PUBLIC,
        )
        self.client.force_login(self.investor)
        invalid_payloads = [
            {"projectId": True, "justification": "Texte assez long."},
            {"projectId": self.project.pk, "justification": "Court"},
            {
                "projectId": self.project.pk,
                "justification": "Texte valide mais extra.",
                "extra": "non",
            },
        ]
        for payload in invalid_payloads:
            with self.subTest(payload=payload):
                response = self.post_json("/api/investor/access-requests/", payload)
                self.assertEqual(response.status_code, 400)

        public_response = self.post_json(
            "/api/investor/access-requests/",
            {
                "projectId": public_project.pk,
                "justification": "Je souhaite accéder à ce projet.",
            },
        )
        self.assertEqual(public_response.status_code, 404)
        self.assertFalse(ProjectAccessRequest.objects.exists())

    def test_approved_request_grants_access_to_project_detail(self):
        self.client.force_login(self.investor)
        denied_response = self.client.get(
            f"/api/projects/{self.project.slug}/"
        )
        response = self.post_json(
            "/api/investor/access-requests/",
            {
                "projectId": self.project.pk,
                "justification": "Je souhaite évaluer cette opportunité.",
            },
        )
        request_id = response.json()["request"]["id"]
        self.assertEqual(denied_response.status_code, 404)
        self.client.force_login(self.admin)
        decision_response = self.patch_json(
            f"/api/admin/access-requests/{request_id}/",
            {"decision": "APPROVED", "reviewerNote": "Accès accordé."},
        )
        self.assertEqual(decision_response.status_code, 200)
        self.assertEqual(
            decision_response.json()["request"]["status"],
            ProjectAccessRequest.Status.APPROVED,
        )

        self.client.force_login(self.investor)
        detail_response = self.client.get(
            f"/api/projects/{self.project.slug}/"
        )
        self.assertEqual(detail_response.status_code, 200)
        self.assertEqual(
            detail_response.json()["project"]["description"],
            self.project.description,
        )

    def test_rejected_request_does_not_grant_access_and_can_be_retried(self):
        self.client.force_login(self.investor)
        response = self.post_json(
            "/api/investor/access-requests/",
            {
                "projectId": self.project.pk,
                "justification": "Je souhaite évaluer cette opportunité.",
            },
        )
        request_id = response.json()["request"]["id"]
        self.client.force_login(self.admin)
        self.patch_json(
            f"/api/admin/access-requests/{request_id}/",
            {"decision": "REJECTED", "reviewerNote": "Précisions requises."},
        )
        self.client.force_login(self.investor)
        detail_response = self.client.get(
            f"/api/projects/{self.project.slug}/"
        )
        retry_response = self.post_json(
            "/api/investor/access-requests/",
            {
                "projectId": self.project.pk,
                "justification": "Voici une nouvelle justification complète.",
            },
        )

        self.assertEqual(detail_response.status_code, 404)
        self.assertEqual(retry_response.status_code, 201)
        self.assertEqual(ProjectAccessRequest.objects.count(), 2)

    def test_admin_can_filter_requests_and_cannot_decide_twice(self):
        access_request = self.create_request()
        self.client.force_login(self.admin)
        list_response = self.client.get(
            "/api/admin/access-requests/?status=PENDING&q=solaire"
        )
        invalid_filter_response = self.client.get(
            "/api/admin/access-requests/?status=UNKNOWN"
        )
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(
            list_response.json()["requests"][0]["id"], access_request.pk
        )
        self.assertEqual(invalid_filter_response.status_code, 400)

        invalid_decision_response = self.patch_json(
            f"/api/admin/access-requests/{access_request.pk}/",
            {"decision": {}, "reviewerNote": ""},
        )
        self.assertEqual(invalid_decision_response.status_code, 400)
        decision_response = self.patch_json(
            f"/api/admin/access-requests/{access_request.pk}/",
            {"decision": "APPROVED", "reviewerNote": ""},
        )
        repeated_response = self.patch_json(
            f"/api/admin/access-requests/{access_request.pk}/",
            {"decision": "REJECTED", "reviewerNote": ""},
        )
        access_request.refresh_from_db()
        self.assertEqual(decision_response.status_code, 200)
        self.assertEqual(repeated_response.status_code, 409)
        self.assertEqual(access_request.reviewed_by, self.admin)
        self.assertIsNotNone(access_request.decided_at)
        self.assertTrue(
            Notification.objects.filter(
                recipient=self.investor,
                kind=Notification.Kind.ACCESS_REQUEST,
            ).exists()
        )

    def test_non_admin_cannot_review_access_requests(self):
        access_request = self.create_request()
        self.client.force_login(self.investor)

        list_response = self.client.get("/api/admin/access-requests/")
        decision_response = self.patch_json(
            f"/api/admin/access-requests/{access_request.pk}/",
            {"decision": "APPROVED", "reviewerNote": ""},
        )
        self.assertEqual(list_response.status_code, 403)
        self.assertEqual(decision_response.status_code, 403)
