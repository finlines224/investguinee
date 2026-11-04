import json

from django.test import Client, TestCase

from accounts.models import User
from .models import TrainingResource


class StudentTrainingApiTests(TestCase):
    def setUp(self):
        self.student = User.objects.create_user(
            username="student@example.com",
            email="student@example.com",
            password="test-password",
            role=User.Role.STUDENT,
        )
        self.entrepreneur = User.objects.create_user(
            username="entrepreneur@example.com",
            email="entrepreneur@example.com",
            password="test-password",
            role=User.Role.ENTREPRENEUR,
        )

    def create_resource(self, **overrides):
        fields = {
            "title": "Construire un plan d’affaires",
            "description": "Structurer les étapes d’un projet.",
            "category": TrainingResource.Category.ENTREPRENEURSHIP,
            "format": "Guide pratique",
            "level": "Débutant",
            "is_published": True,
        }
        fields.update(overrides)
        return TrainingResource.objects.create(**fields)

    def test_catalog_requires_a_student_account(self):
        self.assertEqual(self.client.get("/api/student/trainings/").status_code, 401)

        self.client.force_login(self.entrepreneur)
        response = self.client.get("/api/student/trainings/")

        self.assertEqual(response.status_code, 403)

    def test_catalog_only_returns_published_resources(self):
        published = self.create_resource()
        self.create_resource(title="Ressource en brouillon", is_published=False)
        self.client.force_login(self.student)

        response = self.client.get("/api/student/trainings/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [resource["id"] for resource in response.json()["resources"]],
            [published.pk],
        )
        self.assertEqual(response.json()["categories"], [
            "Entrepreneuriat",
            "Finance",
            "Compétences",
        ])

    def test_catalog_search_category_and_pagination(self):
        first = self.create_resource(title="Plan d’affaires")
        self.create_resource(
            title="Budget de projet",
            category=TrainingResource.Category.FINANCE,
        )
        self.create_resource(
            title="Présentation orale",
            category=TrainingResource.Category.SKILLS,
        )
        self.client.force_login(self.student)

        page_one = self.client.get("/api/student/trainings/?page=1&pageSize=1")
        page_two = self.client.get("/api/student/trainings/?page=2&pageSize=1")
        searched = self.client.get("/api/student/trainings/?q=Plan")
        category_filter = self.client.get(
            "/api/student/trainings/?category=Finance"
        )

        self.assertEqual(page_one.status_code, 200)
        self.assertEqual(page_one.json()["pagination"]["totalResults"], 3)
        self.assertEqual(page_two.json()["pagination"]["page"], 2)
        self.assertNotEqual(
            page_one.json()["resources"][0]["id"],
            page_two.json()["resources"][0]["id"],
        )
        self.assertEqual(searched.json()["resources"][0]["id"], first.pk)
        self.assertEqual(
            category_filter.json()["resources"][0]["title"],
            "Budget de projet",
        )

    def test_catalog_rejects_invalid_query_parameters(self):
        self.client.force_login(self.student)

        invalid_page = self.client.get("/api/student/trainings/?page=0")
        invalid_page_size = self.client.get("/api/student/trainings/?pageSize=101")
        invalid_category = self.client.get("/api/student/trainings/?category=Unknown")

        self.assertEqual(invalid_page.status_code, 400)
        self.assertEqual(invalid_page_size.status_code, 400)
        self.assertEqual(invalid_category.status_code, 400)


class AdminTrainingApiTests(TestCase):
    def setUp(self):
        self.client = Client(enforce_csrf_checks=True)
        self.csrf_token = self.client.get("/api/auth/csrf/").json()["csrfToken"]
        self.admin = User.objects.create_user(
            username="admin@example.com",
            email="admin@example.com",
            password="test-password",
            role=User.Role.ADMIN,
        )
        self.student = User.objects.create_user(
            username="student@example.com",
            email="student@example.com",
            password="test-password",
            role=User.Role.STUDENT,
        )
        self.student = User.objects.create_user(
            username="other-student@example.com",
            email="other-student@example.com",
            password="test-password",
            role=User.Role.STUDENT,
        )

    def create_resource(self, **overrides):
        fields = {
            "title": "Ressource publiée",
            "description": "Description éditoriale.",
            "category": TrainingResource.Category.FINANCE,
            "format": "Guide",
            "level": "Débutant",
            "is_published": True,
        }
        fields.update(overrides)
        return TrainingResource.objects.create(**fields)

    def json_request(self, method, path, payload, csrf=True):
        return getattr(self.client, method)(
            path,
            data=json.dumps(payload),
            content_type="application/json",
            **({"HTTP_X_CSRFTOKEN": self.csrf_token} if csrf else {}),
        )

    def test_admin_catalog_is_restricted_and_includes_drafts(self):
        resource = self.create_resource()
        self.create_resource(title="Brouillon", is_published=False)

        unauthorized = self.client.get("/api/admin/trainings/")
        self.client.force_login(self.student)
        forbidden = self.client.get("/api/admin/trainings/")
        self.client.force_login(self.admin)
        response = self.client.get("/api/admin/trainings/?status=draft")

        self.assertEqual(unauthorized.status_code, 401)
        self.assertEqual(forbidden.status_code, 403)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["pagination"]["totalResults"], 1)
        self.assertNotEqual(response.json()["resources"][0]["id"], resource.pk)

    def test_admin_can_create_update_and_publish_resource_with_csrf(self):
        self.client.force_login(self.admin)
        payload = {
            "title": "Nouvelle formation",
            "description": "Description suffisamment claire.",
            "category": TrainingResource.Category.ENTREPRENEURSHIP,
            "format": "Atelier",
            "level": "Débutant",
            "url": "https://example.com/formation",
            "isPublished": False,
        }

        rejected = self.json_request(
            "post",
            "/api/admin/trainings/create/",
            payload,
            csrf=False,
        )
        created = self.json_request(
            "post",
            "/api/admin/trainings/create/",
            payload,
        )
        resource_id = created.json()["resource"]["id"]
        updated = self.json_request(
            "patch",
            f"/api/admin/trainings/{resource_id}/",
            {"isPublished": True, "title": "Formation publiée"},
        )

        self.assertEqual(rejected.status_code, 403)
        self.assertEqual(created.status_code, 201)
        self.assertFalse(created.json()["resource"]["isPublished"])
        self.assertEqual(updated.status_code, 200)
        self.assertTrue(updated.json()["resource"]["isPublished"])
        self.assertEqual(updated.json()["resource"]["title"], "Formation publiée")

        self.client.force_login(self.student)
        student_catalog = self.client.get("/api/student/trainings/")
        self.assertEqual(student_catalog.status_code, 200)
        self.assertEqual(
            student_catalog.json()["resources"][0]["title"],
            "Formation publiée",
        )

    def test_admin_mutations_reject_invalid_fields_and_missing_resources(self):
        self.client.force_login(self.admin)
        invalid = self.json_request(
            "post",
            "/api/admin/trainings/create/",
            {
                "title": "Formation",
                "description": "Description",
                "category": "Inconnue",
                "format": "Guide",
                "level": "Débutant",
            },
        )
        missing = self.json_request(
            "patch",
            "/api/admin/trainings/999999/",
            {"isPublished": True},
        )

        self.assertEqual(invalid.status_code, 400)
        self.assertEqual(missing.status_code, 404)
