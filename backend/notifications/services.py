from django.contrib.auth import get_user_model

from .models import Notification, NotificationBroadcast


User = get_user_model()


def create_notification(recipient, *, kind, title, body, target_url=""):
    return Notification.objects.create(
        recipient=recipient,
        kind=kind,
        title=title,
        body=body,
        target_url=target_url,
    )


def notify_administrators(*, kind, title, body, target_url=""):
    Notification.objects.bulk_create(
        [
            Notification(
                recipient_id=user_id,
                kind=kind,
                title=title,
                body=body,
                target_url=target_url,
            )
            for user_id in User.objects.filter(
                role=User.Role.ADMIN,
                is_active=True,
            ).values_list("pk", flat=True)
        ]
    )


def send_broadcast(*, created_by, title, body, target_url=""):
    broadcast = NotificationBroadcast.objects.create(
        title=title,
        body=body,
        target_url=target_url,
        created_by=created_by,
    )
    Notification.objects.bulk_create(
        [
            Notification(
                recipient_id=user_id,
                kind=Notification.Kind.ANNOUNCEMENT,
                title=title,
                body=body,
                target_url=target_url,
                broadcast=broadcast,
            )
            for user_id in User.objects.filter(is_active=True).values_list(
                "pk", flat=True
            )
        ]
    )
    return broadcast
