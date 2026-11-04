import json

from django.test import Client, TestCase

from accounts.models import User
from .models import EntrepreneurProject, Favorite


class EntrepreneurProjectApiTests(TestCase):
    def setUp(self):
        self.entrepreneur = User.objects.create_user(
            username="founder@example.com",
            email="founder@example.com",
            password="Secure!Guinea42",
            role=User.Role.ENTREPRENEUR,
        )
        self.other_entrepreneur = User.objects.create_user(
            username="other@example.com",
            email="other@example.com",
            password="Secure!Guinea42",
            role=User.Role.ENTREPRENEUR,
        )
        self.project_payload = {
            "title": "Production agricole durable",
            "description": (
                "Un projet de production agricole durable avec irrigation "
                "solaire pour les producteurs de la région."
            ),
            "sector": "Agriculture",
            "region": "Kindia",
            "fundingGoal": 250_000_000,
            "stage": EntrepreneurProject.Stage.PROTOTYPE,
        }

    def post_json(self, path, payload):
        return self.client.post(
            path,
            data=json.dumps(payload),
            content_type="application/json",
        )

    def patch_json(self, path, payload):
        return self.client.patch(
            path,
            data=json.dumps(payload),
            content_type="application/json",
        )

    def create_project(self, **overrides):
        fields = {
            "owner": self.entrepreneur,
            "title": "Production agricole durable",
            "description": self.project_payload["description"],
            "sector": "Agriculture",
            "region": "Kindia",
            "funding_goal": 250_000_000,
            "stage": EntrepreneurProject.Stage.PROTOTYPE,
        }
        fields.update(overrides)
        return EntrepreneurProject.objects.create(**fields)

    def test_public_catalog_excludes_drafts_and_restricted_projects(self):
        published = self.create_project(
            slug="projet-publie",
            status=EntrepreneurProject.Status.PUBLISHED,
        )
        self.create_project(
            slug="projet-restreint",
            status=EntrepreneurProject.Status.PUBLISHED,
            visibility=EntrepreneurProject.Visibility.RESTRICTED,
        )
        self.create_project(slug="projet-brouillon")

        response = self.client.get("/api/projects/")
        payload = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual([project["id"] for project in payload["projects"]], [published.pk])
        self.assertEqual(payload["stats"]["publishedProjects"], 1)
        self.assertEqual(payload["sectors"], [{"sector": "Agriculture", "project_count": 1}])
        self.assertNotIn("amountCollected", payload["projects"][0])
        self.assertNotIn("views", payload["projects"][0])

    def test_public_project_detail_only_returns_published_public_projects(self):
        published = self.create_project(
            slug="projet-visible",
            status=EntrepreneurProject.Status.PUBLISHED,
        )
        self.create_project(slug="projet-prive")

        response = self.client.get("/api/projects/projet-visible/")
        hidden_response = self.client.get("/api/projects/projet-prive/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["project"]["id"], published.pk)
        self.assertEqual(hidden_response.status_code, 404)

    def test_public_catalog_filters_sorts_and_paginates_on_the_server(self):
        self.create_project(
            title="Projet vingt",
            slug="projet-vingt",
            funding_goal=20_000_000,
            status=EntrepreneurProject.Status.PUBLISHED,
        )
        self.create_project(
            title="Projet trente",
            slug="projet-trente",
            funding_goal=30_000_000,
            status=EntrepreneurProject.Status.PUBLISHED,
        )
        self.create_project(
            title="Projet quarante",
            slug="projet-quarante",
            funding_goal=40_000_000,
            status=EntrepreneurProject.Status.PUBLISHED,
        )

        first_page = self.client.get(
            "/api/projects/?sector=Agriculture&minAmount=20000000"
            "&maxAmount=40000000&sort=amount-asc&page=1&pageSize=1"
        )
        second_page = self.client.get(
            "/api/projects/?sector=Agriculture&minAmount=20000000"
            "&maxAmount=40000000&sort=amount-asc&page=2&pageSize=1"
        )
        searched = self.client.get(
            "/api/projects/?q=Projet%20trente&page=1&pageSize=1"
        )
        unpaginated = self.client.get("/api/projects/")

        self.assertEqual(first_page.status_code, 200)
        self.assertEqual(first_page.json()["pagination"]["totalResults"], 2)
        self.assertEqual(first_page.json()["pagination"]["totalPages"], 2)
        self.assertEqual(first_page.json()["projects"][0]["title"], "Projet vingt")
        self.assertEqual(second_page.json()["projects"][0]["title"], "Projet trente")
        self.assertEqual(searched.json()["projects"][0]["title"], "Projet trente")
        self.assertEqual(len(unpaginated.json()["projects"]), 3)
        self.assertNotIn("pagination", unpaginated.json())

    def test_public_catalog_rejects_invalid_pagination_and_filters(self):
        invalid_page = self.client.get("/api/projects/?page=0")
        invalid_page_size = self.client.get("/api/projects/?page=1&pageSize=101")
        invalid_sector = self.client.get("/api/projects/?sector=Unknown&page=1")

        self.assertEqual(invalid_page.status_code, 400)
        self.assertEqual(invalid_page_size.status_code, 400)
        self.assertEqual(invalid_sector.status_code, 400)

    def test_homepage_data_contains_only_published_public_projects(self):
        published = EntrepreneurProject.objects.create(
            owner=self.entrepreneur,
            title="Projet publié",
            description=self.project_payload["description"],
            sector="Agriculture",
            region="Kindia",
            funding_goal=250_000_000,
            stage=EntrepreneurProject.Stage.PROTOTYPE,
            status=EntrepreneurProject.Status.PUBLISHED,
            slug="projet-publie",
        )
        EntrepreneurProject.objects.create(
            owner=self.entrepreneur,
            title="Brouillon privé",
            description=self.project_payload["description"],
            sector="Énergie",
            region="Conakry",
            funding_goal=100_000_000,
            stage=EntrepreneurProject.Stage.IDEA,
        )

        response = self.client.get("/api/home/")
        payload = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual([item["id"] for item in payload["projects"]], [published.pk])
        self.assertEqual(payload["stats"]["publishedProjects"], 1)
        self.assertEqual(payload["sectors"], [{"sector": "Agriculture", "project_count": 1}])

    def test_project_list_requires_an_entrepreneur_session(self):
        response = self.client.get("/api/entrepreneur/projects/")
        self.assertEqual(response.status_code, 401)

        investor = User.objects.create_user(
            username="investor@example.com",
            email="investor@example.com",
            password="Secure!Guinea42",
            role=User.Role.INVESTOR,
        )
        self.client.force_login(investor)
        response = self.client.get("/api/entrepreneur/projects/")
        self.assertEqual(response.status_code, 403)

    def test_entrepreneur_can_create_and_list_own_project(self):
        self.client.force_login(self.entrepreneur)

        create_response = self.post_json(
            "/api/entrepreneur/projects/",
            self.project_payload,
        )

        self.assertEqual(create_response.status_code, 201)
        self.assertEqual(
            create_response.json()["project"]["status"],
            EntrepreneurProject.Status.DRAFT,
        )
        project = EntrepreneurProject.objects.get()
        self.assertEqual(project.owner, self.entrepreneur)

        list_response = self.client.get("/api/entrepreneur/projects/")
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(len(list_response.json()["projects"]), 1)

    def test_project_creation_validates_fields(self):
        self.client.force_login(self.entrepreneur)
        invalid_payloads = (
            {**self.project_payload, "fundingGoal": -1},
            {**self.project_payload, "sector": []},
            {**self.project_payload, "region": {}},
            {**self.project_payload, "action": []},
        )

        for invalid_payload in invalid_payloads:
            with self.subTest(payload=invalid_payload):
                response = self.post_json(
                    "/api/entrepreneur/projects/",
                    invalid_payload,
                )
                self.assertEqual(response.status_code, 400)
        self.assertFalse(EntrepreneurProject.objects.exists())

    def test_only_owner_can_edit_and_submit_a_draft(self):
        project = EntrepreneurProject.objects.create(
            owner=self.entrepreneur,
            **{
                "title": self.project_payload["title"],
                "description": self.project_payload["description"],
                "sector": self.project_payload["sector"],
                "region": self.project_payload["region"],
                "funding_goal": self.project_payload["fundingGoal"],
                "stage": self.project_payload["stage"],
            },
        )
        self.client.force_login(self.other_entrepreneur)

        response = self.patch_json(
            f"/api/entrepreneur/projects/{project.pk}/",
            {**self.project_payload, "action": "submit"},
        )

        self.assertEqual(response.status_code, 404)
        project.refresh_from_db()
        self.assertEqual(project.status, EntrepreneurProject.Status.DRAFT)


    def test_owner_can_submit_project_and_submitted_project_is_immutable(self):
        project = EntrepreneurProject.objects.create(
            owner=self.entrepreneur,
            title=self.project_payload["title"],
            description=self.project_payload["description"],
            sector=self.project_payload["sector"],
            region=self.project_payload["region"],
            funding_goal=self.project_payload["fundingGoal"],
            stage=self.project_payload["stage"],
        )
        self.client.force_login(self.entrepreneur)

        response = self.patch_json(
            f"/api/entrepreneur/projects/{project.pk}/",
            {**self.project_payload, "action": "submit"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json()["project"]["status"],
            EntrepreneurProject.Status.SUBMITTED,
        )
        immutable_response = self.patch_json(
            f"/api/entrepreneur/projects/{project.pk}/",
            {**self.project_payload, "title": "Titre modifié"},
        )
        self.assertEqual(immutable_response.status_code, 409)

    def test_project_can_be_created_directly_for_review(self):
        self.client.force_login(self.entrepreneur)

        response = self.post_json(
            "/api/entrepreneur/projects/",
            {**self.project_payload, "action": "submit"},
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(
            response.json()["project"]["status"],
            EntrepreneurProject.Status.SUBMITTED,
        )


class StudentFavoriteApiTests(TestCase):
    def setUp(self):
        self.client = Client(enforce_csrf_checks=True)
        self.csrf_token = self.client.get("/api/auth/csrf/").json()["csrfToken"]
        self.student = User.objects.create_user(
            username="student@example.com",
            email="student@example.com",
            password="SecurePass123!",
            role=User.Role.STUDENT,
        )
        self.owner = User.objects.create_user(
            username="owner@example.com",
            email="owner@example.com",
            password="SecurePass123!",
            role=User.Role.ENTREPRENEUR,
        )

    def create_project(self, **overrides):
        fields = {
            "owner": self.owner,
            "title": "Projet étudiant favori",
            "description": "Un projet public suffisamment détaillé pour le catalogue.",
            "sector": "Agriculture",
            "region": "Kindia",
            "funding_goal": 100_000_000,
            "stage": EntrepreneurProject.Stage.PROTOTYPE,
            "status": EntrepreneurProject.Status.PUBLISHED,
            "slug": "projet-favori",
        }
        fields.update(overrides)
        return EntrepreneurProject.objects.create(**fields)

    def put_json(self, payload, csrf_token=None):
        return self.client.put(
            "/api/student/favorites/",
            data=json.dumps(payload),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf_token or self.csrf_token,
        )

    def test_student_can_read_and_replace_persisted_favorites(self):
        first_project = self.create_project()
        second_project = self.create_project(
            title="Second projet",
            slug="second-projet",
        )
        self.client.force_login(self.student)

        save_response = self.put_json({"projectIds": [first_project.pk, second_project.pk]})
        read_response = self.client.get("/api/student/favorites/")

        self.assertEqual(save_response.status_code, 200)
        self.assertEqual(set(save_response.json()["projectIds"]), {first_project.pk, second_project.pk})
        self.assertEqual(read_response.status_code, 200)
        self.assertEqual(set(read_response.json()["projectIds"]), {first_project.pk, second_project.pk})
        self.assertEqual(Favorite.objects.filter(user=self.student).count(), 2)

        remove_response = self.put_json({"projectIds": [second_project.pk]})
        self.assertEqual(remove_response.status_code, 200)
        self.assertEqual(remove_response.json()["projectIds"], [second_project.pk])
        self.assertFalse(Favorite.objects.filter(user=self.student, project=first_project).exists())

    def test_student_favorites_require_student_role_and_valid_public_projects(self):
        project = self.create_project()
        private_project = self.create_project(
            title="Projet non publié",
            slug="projet-non-publie",
            status=EntrepreneurProject.Status.DRAFT,
        )

        anonymous_response = self.client.get("/api/student/favorites/")
        self.assertEqual(anonymous_response.status_code, 401)

        investor = User.objects.create_user(
            username="investor@example.com",
            email="investor@example.com",
            password="SecurePass123!",
            role=User.Role.INVESTOR,
        )
        self.client.force_login(investor)
        wrong_role_response = self.client.get("/api/student/favorites/")
        self.assertEqual(wrong_role_response.status_code, 403)

        self.client.force_login(self.student)
        invalid_id_response = self.put_json({"projectIds": [True]})
        unavailable_project_response = self.put_json({"projectIds": [private_project.pk]})
        invalid_csrf_response = self.put_json(
            {"projectIds": [project.pk]},
            csrf_token="invalid-token",
        )

        self.assertEqual(invalid_id_response.status_code, 400)
        self.assertEqual(unavailable_project_response.status_code, 200)
        self.assertEqual(unavailable_project_response.json()["projectIds"], [])
        self.assertEqual(
            unavailable_project_response.json()["unavailableProjectIds"],
            [private_project.pk],
        )
        self.assertEqual(invalid_csrf_response.status_code, 403)
        self.assertFalse(Favorite.objects.filter(user=self.student).exists())


class AdminProjectApiTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="admin@example.com",
            email="admin@example.com",
            password="Secure!Guinea42",
            role=User.Role.ADMIN,
        )
        self.owner = User.objects.create_user(
            username="founder@example.com",
            email="founder@example.com",
            first_name="Aminata",
            last_name="Bah",
            password="Secure!Guinea42",
            role=User.Role.ENTREPRENEUR,
        )

    def create_project(self, **overrides):
        fields = {
            "owner": self.owner,
            "title": "Projet agricole durable",
            "description": "Un projet détaillé de production agricole durable.",
            "sector": "Agriculture",
            "region": "Kindia",
            "funding_goal": 120_000_000,
            "stage": EntrepreneurProject.Stage.PROTOTYPE,
            "status": EntrepreneurProject.Status.SUBMITTED,
        }
        fields.update(overrides)
        return EntrepreneurProject.objects.create(**fields)

    def test_admin_project_catalog_requires_admin_role(self):
        self.assertEqual(self.client.get("/api/admin/projects/").status_code, 401)

        self.client.force_login(self.owner)
        response = self.client.get("/api/admin/projects/")

        self.assertEqual(response.status_code, 403)

    def test_admin_project_catalog_searches_filters_and_paginates(self):
        matching = self.create_project()
        self.create_project(
            title="Projet énergie",
            sector="Énergie",
            status=EntrepreneurProject.Status.PUBLISHED,
        )
        self.client.force_login(self.admin)

        filtered = self.client.get(
            "/api/admin/projects/?status=SUBMITTED&sector=Agriculture&page=1&pageSize=1"
        )
        searched = self.client.get("/api/admin/projects/?q=Projet%20agricole%20durable")
        payload = filtered.json()

        self.assertEqual(filtered.status_code, 200)
        self.assertEqual(payload["pagination"]["totalResults"], 1)
        self.assertEqual(payload["projects"][0]["id"], matching.pk)
        self.assertEqual(payload["projects"][0]["owner"], "Aminata Bah")
        self.assertEqual(searched.json()["projects"][0]["id"], matching.pk)

    def test_admin_project_catalog_rejects_invalid_filters_and_pagination(self):
        self.client.force_login(self.admin)

        invalid_status = self.client.get("/api/admin/projects/?status=UNKNOWN")
        invalid_sector = self.client.get("/api/admin/projects/?sector=UNKNOWN")
        invalid_page = self.client.get("/api/admin/projects/?page=0")
        invalid_page_size = self.client.get("/api/admin/projects/?pageSize=101")

        self.assertEqual(invalid_status.status_code, 400)
        self.assertEqual(invalid_sector.status_code, 400)
        self.assertEqual(invalid_page.status_code, 400)
        self.assertEqual(invalid_page_size.status_code, 400)
