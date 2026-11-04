from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django.http import JsonResponse
from django.views.decorators.http import require_GET

from organizations.models import Organization
from projects.models import EntrepreneurProject

User = get_user_model()
MAX_BIGINT = 9_223_372_036_854_775_807
MAX_QUERY_LENGTH = 200
MAX_PAGE_SIZE = 100


def _parse_integer(value):
    if not value or not value.isdecimal() or len(value) > 19:
        return None
    parsed = int(value)
    return parsed if parsed <= MAX_BIGINT else None


def _admin_error(request):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "Vous devez vous connecter."}, status=401)
    if request.user.role != User.Role.ADMIN:
        return JsonResponse(
            {"detail": "Cette fonctionnalité est réservée aux administrateurs."},
            status=403,
        )
    return None


@require_GET
def admin_overview(request):
    error = _admin_error(request)
    if error:
        return error

    role_counts = dict(
        User.objects.order_by()
        .values("role")
        .annotate(count=Count("pk"))
        .values_list("role", "count")
    )
    return JsonResponse(
        {
            "totalUsers": sum(role_counts.values()),
            "publishedProjects": EntrepreneurProject.objects.filter(
                status=EntrepreneurProject.Status.PUBLISHED,
                visibility=EntrepreneurProject.Visibility.PUBLIC,
            ).count(),
            "organizations": Organization.objects.count(),
            "roles": [
                {
                    "role": role,
                    "label": label,
                    "count": role_counts.get(role, 0),
                }
                for role, label in User.Role.choices
            ],
        }
    )


@require_GET
def admin_users(request):
    error = _admin_error(request)
    if error:
        return error

    query = request.GET.get("q", "").strip()
    role = request.GET.get("role", "")
    status = request.GET.get("status", "all")
    page = _parse_integer(request.GET.get("page", "1"))
    page_size = _parse_integer(request.GET.get("pageSize", "10"))
    valid_roles = {choice.value for choice in User.Role}
    if len(query) > MAX_QUERY_LENGTH:
        return JsonResponse(
            {"detail": "La recherche ne doit pas dépasser 200 caractères."},
            status=400,
        )
    if role and role not in valid_roles:
        return JsonResponse({"detail": "Le rôle sélectionné est invalide."}, status=400)
    if status not in {"all", "active", "inactive"}:
        return JsonResponse({"detail": "Le statut sélectionné est invalide."}, status=400)
    if page is None or page < 1:
        return JsonResponse({"detail": "Le numéro de page est invalide."}, status=400)
    if page_size is None or not 1 <= page_size <= MAX_PAGE_SIZE:
        return JsonResponse(
            {"detail": "Le nombre de résultats par page est invalide."},
            status=400,
        )

    users = User.objects.all()
    if role:
        users = users.filter(role=role)
    if status == "active":
        users = users.filter(is_active=True)
    elif status == "inactive":
        users = users.filter(is_active=False)
    if query:
        users = users.filter(
            Q(email__icontains=query)
            | Q(first_name__icontains=query)
            | Q(last_name__icontains=query)
            | Q(role__icontains=query)
        )

    total_results = users.count()
    total_pages = max(1, (total_results + page_size - 1) // page_size)
    page = min(page, total_pages)
    page_users = users.order_by("-created_at", "-pk")[
        (page - 1) * page_size : page * page_size
    ]
    return JsonResponse(
        {
            "users": [
                {
                    "id": user.pk,
                    "fullName": user.get_full_name() or user.email,
                    "email": user.email,
                    "role": user.role,
                    "roleLabel": user.get_role_display(),
                    "isActive": user.is_active,
                    "isVerified": user.is_verified,
                    "joinedAt": user.created_at.isoformat(),
                }
                for user in page_users
            ],
            "roles": [
                {"role": role_value, "label": role_label}
                for role_value, role_label in User.Role.choices
            ],
            "pagination": {
                "page": page,
                "pageSize": page_size,
                "totalResults": total_results,
                "totalPages": total_pages,
            },
        }
    )
