from django.test import TestCase

from accounts.models import User
from .models import Organization, OrganizationMember, VerificationStatus


class AdminOrganizationApiTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="admin@example.com",
            email="admin@example.com",
            password="Secure!Guinea42",
            role=User.Role.ADMIN,
        )
        self.owner = User.objects.create_user(
            username="owner@example.com",
            email="owner@example.com",
            first_name="Aminata",
            last_name="Bah",
            password="Secure!Guinea42",
            role=User.Role.ENTREPRENEUR,
        )

    def create_organization(self, **overrides):
        fields = {
            "legal_name": "Alpha Guinée SARL",
            "display_name": "Alpha Guinée",
            "organization_type": "COMPANY",
            "registration_number": "GN-001",
            "region": "Conakry",
            "city": "Kaloum",
            "verification_status": VerificationStatus.SUBMITTED,
            "created_by": self.owner,
        }
        fields.update(overrides)
        return Organization.objects.create(**fields)

    def test_admin_organization_list_requires_admin_role(self):
        self.assertEqual(self.client.get("/api/admin/organizations/").status_code, 401)

        self.client.force_login(self.owner)
        response = self.client.get("/api/admin/organizations/")

        self.assertEqual(response.status_code, 403)

    def test_admin_organization_list_searches_filters_and_counts_members(self):
        organization = self.create_organization()
        other = self.create_organization(
            legal_name="Beta Énergie SARL",
            display_name="Beta Énergie",
            registration_number="GN-002",
            verification_status=VerificationStatus.APPROVED,
        )
        member = User.objects.create_user(
            username="member@example.com",
            email="member@example.com",
            password="Secure!Guinea42",
            role=User.Role.ENTREPRENEUR,
        )
        OrganizationMember.objects.create(
            organization=organization,
            user=member,
            is_primary_contact=True,
        )
        self.client.force_login(self.admin)

        filtered = self.client.get(
            "/api/admin/organizations/?status=SUBMITTED&page=1&pageSize=1"
        )
        searched = self.client.get("/api/admin/organizations/?q=Alpha")
        payload = filtered.json()

        self.assertEqual(filtered.status_code, 200)
        self.assertEqual(payload["pagination"]["totalResults"], 1)
        self.assertEqual(payload["organizations"][0]["id"], organization.pk)
        self.assertEqual(payload["organizations"][0]["memberCount"], 1)
        self.assertEqual(payload["organizations"][0]["createdBy"], "Aminata Bah")
        self.assertEqual(searched.json()["organizations"][0]["id"], organization.pk)
        self.assertNotEqual(organization.pk, other.pk)

    def test_admin_organization_list_rejects_invalid_status_and_pagination(self):
        self.client.force_login(self.admin)

        invalid_status = self.client.get("/api/admin/organizations/?status=UNKNOWN")
        invalid_page = self.client.get("/api/admin/organizations/?page=0")
        invalid_page_size = self.client.get("/api/admin/organizations/?pageSize=101")

        self.assertEqual(invalid_status.status_code, 400)
        self.assertEqual(invalid_page.status_code, 400)
        self.assertEqual(invalid_page_size.status_code, 400)
