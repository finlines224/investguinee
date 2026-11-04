from datetime import timedelta
from decimal import Decimal

from django.test import Client, TestCase
from django.utils import timezone

from accounts.models import User

from .models import SubscriptionRecord


class InvestorSubscriptionHistoryApiTests(TestCase):
    def setUp(self):
        self.client = Client()

    def create_user(self, email, role):
        return User.objects.create_user(
            username=email,
            email=email,
            role=role,
            password="Secure!Pass12345",
        )

    def create_record(
        self,
        user,
        *,
        plan_name,
        status,
        started_at,
        expires_at=None,
        amount_paid="125000.00",
    ):
        return SubscriptionRecord.objects.create(
            user=user,
            plan_name=plan_name,
            status=status,
            amount_paid=Decimal(amount_paid),
            currency="GNF",
            started_at=started_at,
            expires_at=expires_at,
        )

    def test_subscription_history_is_private_to_investors(self):
        anonymous_response = self.client.get("/api/investor/subscriptions/")
        self.assertEqual(anonymous_response.status_code, 401)

        student = self.create_user("student@example.com", User.Role.STUDENT)
        self.client.force_login(student)
        wrong_role_response = self.client.get("/api/investor/subscriptions/")
        self.assertEqual(wrong_role_response.status_code, 403)

    def test_investor_sees_only_their_paginated_subscription_history(self):
        investor = self.create_user("investor@example.com", User.Role.INVESTOR)
        other_investor = self.create_user(
            "other-investor@example.com",
            User.Role.INVESTOR,
        )
        now = timezone.now()
        self.create_record(
            investor,
            plan_name="Plan récent",
            status=SubscriptionRecord.Status.ACTIVE,
            started_at=now - timedelta(days=2),
        )
        self.create_record(
            investor,
            plan_name="Plan expiré",
            status=SubscriptionRecord.Status.EXPIRED,
            started_at=now - timedelta(days=40),
            expires_at=now - timedelta(days=10),
            amount_paid="85000.00",
        )
        self.create_record(
            other_investor,
            plan_name="Privé à un autre compte",
            status=SubscriptionRecord.Status.ACTIVE,
            started_at=now,
        )
        self.client.force_login(investor)

        first_page = self.client.get(
            "/api/investor/subscriptions/?page=1&pageSize=1"
        )
        self.assertEqual(first_page.status_code, 200)
        self.assertEqual(
            first_page.json()["summary"],
            {"totalCount": 2, "activeCount": 1},
        )
        self.assertEqual(first_page.json()["pagination"]["totalResults"], 2)
        self.assertEqual(
            first_page.json()["subscriptions"][0]["planName"],
            "Plan récent",
        )

        expired_page = self.client.get(
            "/api/investor/subscriptions/?status=EXPIRED&page=1&pageSize=10"
        )
        self.assertEqual(expired_page.status_code, 200)
        self.assertEqual(
            [item["planName"] for item in expired_page.json()["subscriptions"]],
            ["Plan expiré"],
        )
        self.assertEqual(
            expired_page.json()["subscriptions"][0]["amountPaid"],
            "85000.00",
        )

    def test_subscription_history_rejects_invalid_filters_and_pagination(self):
        investor = self.create_user("investor@example.com", User.Role.INVESTOR)
        self.client.force_login(investor)

        invalid_status = self.client.get(
            "/api/investor/subscriptions/?status=PENDING"
        )
        invalid_page = self.client.get("/api/investor/subscriptions/?page=0")
        invalid_page_size = self.client.get(
            "/api/investor/subscriptions/?pageSize=101"
        )

        self.assertEqual(invalid_status.status_code, 400)
        self.assertEqual(invalid_page.status_code, 400)
        self.assertEqual(invalid_page_size.status_code, 400)
