import json

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Count, Q
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.http import require_http_methods

from .models import Notification, NotificationBroadcast
from .services import send_broadcast


User = get_user_model()
MAX_BIGINT = 9_223_372_036_854_775_807
MAX_QUERY_LENGTH = 200
MAX_PAGE_SIZE = 100
DEFAULT_PAGE_SIZE = 20


def _json_body(request):
    try:
        payload = json.loads(request.body.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        return None
    return payload if isinstance(payload, dict) else None


def _authorized(request, *, admin=False):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "Vous devez vous connecter."}, status=401)
    if admin and request.user.role != User.Role.ADMIN:
        return JsonResponse(
            {"detail": "Cette fonctionnalité est réservée aux administrateurs."},
            status=403,
        )
    return None


def _parse_integer(value):
    if not value or not value.isdecimal() or len(value) > 19:
        return None
    parsed = int(value)
    return parsed if parsed <= MAX_BIGINT else None


def _pagination(request):
    page = _parse_integer(request.GET.get("page", "1"))
    page_size = _parse_integer(
        request.GET.get("pageSize", str(DEFAULT_PAGE_SIZE))
    )
    if page is None or page < 1:
        return None, None, JsonResponse(
            {"detail": "Le numéro de page est invalide."}, status=400
        )
    if page_size is None or not 1 <= page_size <= MAX_PAGE_SIZE:
        return None, None, JsonResponse(
            {"detail": "Le nombre de résultats par page est invalide."},
            status=400,
        )
    return page, page_size, None


def _pagination_payload(page, page_size, total_results):
    total_pages = max(1, (total_results + page_size - 1) // page_size)
    page = min(page, total_pages)
    return page, {
        "page": page,
        "pageSize": page_size,
        "totalResults": total_results,
        "totalPages": total_pages,
    }


def _valid_target_url(value):
    return (
        isinstance(value, str)
        and len(value) <= 300
        and (not value or (value.startswith("/") and not value.startswith("//") and "\\" not in value))
    )


def _notification_payload(notification):
    return {
        "id": notification.pk,
        "kind": notification.kind,
        "kindLabel": notification.get_kind_display(),
        "title": notification.title,
        "body": notification.body,
        "targetUrl": notification.target_url,
        "createdAt": notification.created_at.isoformat(),
        "readAt": notification.read_at.isoformat() if notification.read_at else None,
    }


@csrf_protect
@require_http_methods(["GET", "POST"])
def user_notifications(request):
    error = _authorized(request)
    if error:
        return error

    notifications = Notification.objects.filter(recipient=request.user)
    if request.method == "POST":
        payload = _json_body(request)
        if payload == {"action": "mark_all_read"}:
            now = timezone.now()
            updated = notifications.filter(read_at__isnull=True).update(read_at=now)
            return JsonResponse({"updated": updated})
        return JsonResponse({"detail": "L’action demandée est invalide."}, status=400)

    query = request.GET.get("q", "").strip()
    status = request.GET.get("status", "all")
    if len(query) > MAX_QUERY_LENGTH:
        return JsonResponse(
            {"detail": "La recherche ne doit pas dépasser 200 caractères."},
            status=400,
        )
    if status not in {"all", "unread", "read"}:
        return JsonResponse(
            {"detail": "Le filtre de lecture est invalide."}, status=400
        )
    if status == "unread":
        notifications = notifications.filter(read_at__isnull=True)
    elif status == "read":
        notifications = notifications.filter(read_at__isnull=False)
    if query:
        notifications = notifications.filter(
            Q(title__icontains=query) | Q(body__icontains=query)
        )
    total_results = notifications.count()
    unread_count = Notification.objects.filter(
        recipient=request.user,
        read_at__isnull=True,
    ).count()
    page, page_size, error = _pagination(request)
    if error:
        return error
    page, pagination = _pagination_payload(page, page_size, total_results)
    notifications = notifications.order_by("-created_at", "-pk")[
        (page - 1) * page_size : page * page_size
    ]
    return JsonResponse(
        {
            "notifications": [
                _notification_payload(notification)
                for notification in notifications
            ],
            "unreadCount": unread_count,
            "pagination": pagination,
        }
    )


@csrf_protect
@require_http_methods(["PATCH", "DELETE"])
def user_notification_detail(request, notification_id):
    error = _authorized(request)
    if error:
        return error
    notification = get_object_or_404(
        Notification,
        pk=notification_id,
        recipient=request.user,
    )
    if request.method == "DELETE":
        notification.delete()
        return JsonResponse({"success": True})

    payload = _json_body(request)
    if payload != {"action": "mark_read"}:
        return JsonResponse({"detail": "L’action demandée est invalide."}, status=400)
    if notification.read_at is None:
        notification.read_at = timezone.now()
        notification.save(update_fields=["read_at"])
    return JsonResponse({"notification": _notification_payload(notification)})


@csrf_protect
@require_http_methods(["GET", "POST"])
def admin_notification_broadcasts(request):
    error = _authorized(request, admin=True)
    if error:
        return error

    if request.method == "POST":
        payload = _json_body(request)
        if payload is None or set(payload) != {"title", "body", "targetUrl"}:
            return JsonResponse(
                {"detail": "Le contenu de l’annonce est invalide."}, status=400
            )
        title = payload["title"]
        body = payload["body"]
        target_url = payload["targetUrl"]
        if not isinstance(title, str) or not 1 <= len(title.strip()) <= 160:
            return JsonResponse(
                {"detail": "Le titre doit contenir entre 1 et 160 caractères."},
                status=400,
            )
        if not isinstance(body, str) or not 1 <= len(body.strip()) <= 2000:
            return JsonResponse(
                {"detail": "Le message doit contenir entre 1 et 2 000 caractères."},
                status=400,
            )
        if not _valid_target_url(target_url):
            return JsonResponse(
                {"detail": "Le lien doit être un chemin interne valide."},
                status=400,
            )
        with transaction.atomic():
            broadcast = send_broadcast(
                created_by=request.user,
                title=title.strip(),
                body=body.strip(),
                target_url=target_url,
            )
        return JsonResponse(
            {
                "broadcast": {
                    "id": broadcast.pk,
                    "title": broadcast.title,
                    "body": broadcast.body,
                    "targetUrl": broadcast.target_url,
                    "createdAt": broadcast.created_at.isoformat(),
                    "recipientCount": broadcast.notifications.count(),
                }
            },
            status=201,
        )

    page, page_size, error = _pagination(request)
    if error:
        return error
    query = request.GET.get("q", "").strip()
    if len(query) > MAX_QUERY_LENGTH:
        return JsonResponse(
            {"detail": "La recherche ne doit pas dépasser 200 caractères."},
            status=400,
        )
    broadcasts = NotificationBroadcast.objects.select_related("created_by").annotate(
        recipient_count=Count("notifications", distinct=True)
    )
    if query:
        broadcasts = broadcasts.filter(
            Q(title__icontains=query) | Q(body__icontains=query)
        )
    total_results = broadcasts.count()
    page, pagination = _pagination_payload(page, page_size, total_results)
    broadcasts = broadcasts.order_by("-created_at", "-pk")[
        (page - 1) * page_size : page * page_size
    ]
    return JsonResponse(
        {
            "broadcasts": [
                {
                    "id": broadcast.pk,
                    "title": broadcast.title,
                    "body": broadcast.body,
                    "targetUrl": broadcast.target_url,
                    "createdBy": (
                        broadcast.created_by.get_full_name()
                        or broadcast.created_by.email
                        if broadcast.created_by
                        else "Administrateur supprimé"
                    ),
                    "createdAt": broadcast.created_at.isoformat(),
                    "recipientCount": broadcast.recipient_count,
                }
                for broadcast in broadcasts
            ],
            "pagination": pagination,
        }
    )
