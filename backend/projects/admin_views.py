from django.contrib.auth import get_user_model
from django.db.models import Q
from django.http import JsonResponse
from django.views.decorators.http import require_GET

from .models import EntrepreneurProject
from .views import SECTORS

User = get_user_model()
MAX_BIGINT = 9_223_372_036_854_775_807
MAX_QUERY_LENGTH = 200
MAX_PAGE_SIZE = 100


def _parse_integer(value):
    if not value or not value.isdecimal() or len(value) > 19:
        return None
    parsed = int(value)
    return parsed if parsed <= MAX_BIGINT else None


@require_GET
def admin_projects(request):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "Vous devez vous connecter."}, status=401)
    if request.user.role != User.Role.ADMIN:
        return JsonResponse(
            {"detail": "Cette fonctionnalité est réservée aux administrateurs."},
            status=403,
        )

    query = request.GET.get("q", "").strip()
    status = request.GET.get("status", "")
    sector = request.GET.get("sector", "")
    page = _parse_integer(request.GET.get("page", "1"))
    page_size = _parse_integer(request.GET.get("pageSize", "10"))
    valid_statuses = {choice.value for choice in EntrepreneurProject.Status}
    if len(query) > MAX_QUERY_LENGTH:
        return JsonResponse(
            {"detail": "La recherche ne doit pas dépasser 200 caractères."},
            status=400,
        )
    if status and status not in valid_statuses:
        return JsonResponse({"detail": "Le statut sélectionné est invalide."}, status=400)
    if sector and sector not in SECTORS:
        return JsonResponse({"detail": "Le secteur sélectionné est invalide."}, status=400)
    if page is None or page < 1:
        return JsonResponse({"detail": "Le numéro de page est invalide."}, status=400)
    if page_size is None or not 1 <= page_size <= MAX_PAGE_SIZE:
        return JsonResponse(
            {"detail": "Le nombre de résultats par page est invalide."},
            status=400,
        )

    projects = EntrepreneurProject.objects.select_related("owner", "organization")
    if status:
        projects = projects.filter(status=status)
    if sector:
        projects = projects.filter(sector=sector)
    if query:
        projects = projects.filter(
            Q(title__icontains=query)
            | Q(description__icontains=query)
            | Q(sector__icontains=query)
            | Q(region__icontains=query)
            | Q(owner__email__icontains=query)
            | Q(owner__first_name__icontains=query)
            | Q(owner__last_name__icontains=query)
            | Q(organization__display_name__icontains=query)
            | Q(organization__legal_name__icontains=query)
        )

    total_results = projects.count()
    total_pages = max(1, (total_results + page_size - 1) // page_size)
    page = min(page, total_pages)
    page_projects = projects.order_by("-updated_at", "-pk")[
        (page - 1) * page_size : page * page_size
    ]
    return JsonResponse(
        {
            "projects": [
                {
                    "id": project.pk,
                    "title": project.title,
                    "description": project.description,
                    "sector": project.sector,
                    "region": project.region,
                    "city": project.city,
                    "fundingGoal": project.funding_goal,
                    "currency": project.currency,
                    "stage": project.stage,
                    "status": project.status,
                    "statusLabel": project.get_status_display(),
                    "visibility": project.visibility,
                    "owner": project.owner.get_full_name() or project.owner.email,
                    "organization": (
                        (project.organization.display_name or project.organization.legal_name)
                        if project.organization
                        else ""
                    ),
                    "createdAt": project.created_at.isoformat(),
                    "updatedAt": project.updated_at.isoformat(),
                    "publishedAt": (
                        project.published_at.isoformat()
                        if project.published_at
                        else None
                    ),
                }
                for project in page_projects
            ],
            "statuses": [
                {"status": status_value, "label": status_label}
                for status_value, status_label in EntrepreneurProject.Status.choices
            ],
            "sectors": sorted(SECTORS),
            "pagination": {
                "page": page,
                "pageSize": page_size,
                "totalResults": total_results,
                "totalPages": total_pages,
            },
        }
    )
