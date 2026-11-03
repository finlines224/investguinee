from django.db.models import Q
from django.http import JsonResponse
from django.views.decorators.http import require_GET

from accounts.models import User
from .models import TrainingResource


PAGE_SIZE = 6
MAX_PAGE_SIZE = 100
MAX_QUERY_LENGTH = 200
MAX_BIGINT = 9_223_372_036_854_775_807


def _parse_integer(value):
    if not value or not value.isdecimal() or len(value) > 19:
        return None
    parsed = int(value)
    return parsed if parsed <= MAX_BIGINT else None


@require_GET
def student_trainings(request):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "Vous devez vous connecter."}, status=401)
    if request.user.role != User.Role.STUDENT:
        return JsonResponse(
            {"detail": "Cette fonctionnalité est réservée aux étudiants."},
            status=403,
        )

    query = request.GET.get("q", "").strip()
    category = request.GET.get("category", "")
    page = _parse_integer(request.GET.get("page", "1"))
    page_size = _parse_integer(request.GET.get("pageSize", str(PAGE_SIZE)))
    categories = [choice.value for choice in TrainingResource.Category]

    if len(query) > MAX_QUERY_LENGTH:
        return JsonResponse(
            {"detail": "La recherche ne doit pas dépasser 200 caractères."},
            status=400,
        )
    if category and category not in categories:
        return JsonResponse({"detail": "La catégorie sélectionnée est invalide."}, status=400)
    if page is None or page < 1:
        return JsonResponse({"detail": "Le numéro de page est invalide."}, status=400)
    if page_size is None or not 1 <= page_size <= MAX_PAGE_SIZE:
        return JsonResponse(
            {"detail": "Le nombre de résultats par page est invalide."},
            status=400,
        )

    resources = TrainingResource.objects.filter(is_published=True)
    if query:
        resources = resources.filter(
            Q(title__icontains=query)
            | Q(description__icontains=query)
            | Q(category__icontains=query)
            | Q(format__icontains=query)
            | Q(level__icontains=query)
        )
    if category:
        resources = resources.filter(category=category)

    total_results = resources.count()
    total_pages = max(1, (total_results + page_size - 1) // page_size)
    page = min(page, total_pages)
    page_resources = resources[(page - 1) * page_size : page * page_size]

    return JsonResponse(
        {
            "resources": [
                {
                    "id": resource.pk,
                    "title": resource.title,
                    "description": resource.description,
                    "category": resource.category,
                    "format": resource.format,
                    "level": resource.level,
                    "url": resource.url,
                }
                for resource in page_resources
            ],
            "categories": categories,
            "pagination": {
                "page": page,
                "pageSize": page_size,
                "totalResults": total_results,
                "totalPages": total_pages,
            },
        }
    )
