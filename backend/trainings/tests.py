from django.test import TestCase

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
