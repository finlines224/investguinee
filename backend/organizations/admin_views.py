from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django.http import JsonResponse
from django.views.decorators.http import require_GET

from .models import Organization, VerificationStatus

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
def admin_organizations(request):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "Vous devez vous connecter."}, status=401)
    if request.user.role != User.Role.ADMIN:
        return JsonResponse(
            {"detail": "Cette fonctionnalité est réservée aux administrateurs."},
            status=403,
        )

    query = request.GET.get("q", "").strip()
    status = request.GET.get("status", "")
    page = _parse_integer(request.GET.get("page", "1"))
    page_size = _parse_integer(request.GET.get("pageSize", "10"))
    valid_statuses = {choice.value for choice in VerificationStatus}

    if len(query) > MAX_QUERY_LENGTH:
        return JsonResponse(
            {"detail": "La recherche ne doit pas dépasser 200 caractères."},
            status=400,
        )
    if status and status not in valid_statuses:
        return JsonResponse({"detail": "Le statut sélectionné est invalide."}, status=400)
    if page is None or page < 1:
        return JsonResponse({"detail": "Le numéro de page est invalide."}, status=400)
    if page_size is None or not 1 <= page_size <= MAX_PAGE_SIZE:
        return JsonResponse(
            {"detail": "Le nombre de résultats par page est invalide."},
            status=400,
        )

    organizations = Organization.objects.select_related("created_by").annotate(
        member_count=Count("memberships", distinct=True),
    )
    if status:
        organizations = organizations.filter(verification_status=status)
    if query:
        organizations = organizations.filter(
            Q(legal_name__icontains=query)
            | Q(display_name__icontains=query)
            | Q(registration_number__icontains=query)
            | Q(organization_type__icontains=query)
            | Q(region__icontains=query)
            | Q(city__icontains=query)
            | Q(created_by__email__icontains=query)
            | Q(created_by__first_name__icontains=query)
            | Q(created_by__last_name__icontains=query)
        )

    total_results = organizations.count()
    total_pages = max(1, (total_results + page_size - 1) // page_size)
    page = min(page, total_pages)
    page_organizations = organizations.order_by("-created_at", "-pk")[
        (page - 1) * page_size : page * page_size
    ]
    return JsonResponse(
        {
            "organizations": [
                {
                    "id": organization.pk,
                    "name": organization.display_name or organization.legal_name,
                    "legalName": organization.legal_name,
                    "type": organization.organization_type,
                    "registrationNumber": organization.registration_number or "",
                    "region": organization.region,
                    "city": organization.city,
                    "countryCode": organization.country_code,
                    "websiteUrl": organization.website_url,
                    "description": organization.description,
                    "verificationStatus": organization.verification_status,
                    "verificationStatusLabel": organization.get_verification_status_display(),
                    "memberCount": organization.member_count,
                    "createdBy": (
                        organization.created_by.get_full_name()
                        or organization.created_by.email
                    ),
                    "createdAt": organization.created_at.isoformat(),
                    "updatedAt": organization.updated_at.isoformat(),
                }
                for organization in page_organizations
            ],
            "statuses": [
                {"status": status_value, "label": status_label}
                for status_value, status_label in VerificationStatus.choices
            ],
            "pagination": {
                "page": page,
                "pageSize": page_size,
                "totalResults": total_results,
                "totalPages": total_pages,
            },
        }
    )
