from django.contrib.auth import get_user_model
from django.http import JsonResponse
from django.views.decorators.http import require_GET

from .models import SubscriptionRecord

User = get_user_model()
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100
MAX_BIGINT = 9_223_372_036_854_775_807


def _parse_integer(value):
    if not value or not value.isdecimal() or len(value) > 19:
        return None
    parsed = int(value)
    return parsed if parsed <= MAX_BIGINT else None


@require_GET
def investor_subscriptions(request):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "Vous devez vous connecter."}, status=401)
    if request.user.role != User.Role.INVESTOR:
        return JsonResponse(
            {"detail": "Cette fonctionnalité est réservée aux investisseurs."},
            status=403,
        )

    status = request.GET.get("status", "all")
    valid_statuses = set(SubscriptionRecord.Status.values)
    if status != "all" and status not in valid_statuses:
        return JsonResponse({"detail": "Le filtre de statut est invalide."}, status=400)

    page = _parse_integer(request.GET.get("page", "1"))
    page_size = _parse_integer(request.GET.get("pageSize", str(DEFAULT_PAGE_SIZE)))
    if page is None or page < 1:
        return JsonResponse({"detail": "Le numéro de page est invalide."}, status=400)
    if page_size is None or not 1 <= page_size <= MAX_PAGE_SIZE:
        return JsonResponse(
            {"detail": "Le nombre de résultats par page est invalide."},
            status=400,
        )

    user_records = SubscriptionRecord.objects.filter(user=request.user)
    summary = {
        "totalCount": user_records.count(),
        "activeCount": user_records.filter(status=SubscriptionRecord.Status.ACTIVE).count(),
    }
    records = user_records
    if status != "all":
        records = records.filter(status=status)

    total_results = records.count()
    total_pages = max(1, (total_results + page_size - 1) // page_size)
    page = min(page, total_pages)
    start = (page - 1) * page_size
    subscriptions = [
        {
            "id": record.pk,
            "planName": record.plan_name,
            "status": record.status,
            "statusLabel": record.get_status_display(),
            "amountPaid": format(record.amount_paid, "f"),
            "currency": record.currency,
            "startedAt": record.started_at.isoformat(),
            "expiresAt": record.expires_at.isoformat() if record.expires_at else None,
        }
        for record in records[start : start + page_size]
    ]

    return JsonResponse(
        {
            "subscriptions": subscriptions,
            "summary": summary,
            "pagination": {
                "page": page,
                "pageSize": page_size,
                "totalResults": total_results,
                "totalPages": total_pages,
            },
        }
    )
