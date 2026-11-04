import json

from django.core.exceptions import ValidationError
from django.db.models import Q
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.http import require_GET, require_http_methods

from accounts.models import User
from .models import TrainingResource


PAGE_SIZE = 6
MAX_PAGE_SIZE = 100
MAX_QUERY_LENGTH = 200
MAX_BIGINT = 9_223_372_036_854_775_807
ADMIN_PAGE_SIZE = 10
ADMIN_CATEGORIES = {choice.value for choice in TrainingResource.Category}
ADMIN_FIELDS = {
    "title",
    "description",
    "category",
    "format",
    "level",
    "url",
    "isPublished",
}


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


def _admin_resource_payload(resource):
    return {
        "id": resource.pk,
        "title": resource.title,
        "description": resource.description,
        "category": resource.category,
        "format": resource.format,
        "level": resource.level,
        "url": resource.url,
        "isPublished": resource.is_published,
        "updatedAt": resource.updated_at.isoformat(),
    }


def _admin_json_body(request):
    try:
        payload = json.loads(request.body.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        return None
    return payload if isinstance(payload, dict) else None


def _validated_admin_fields(payload, *, partial):
    if not isinstance(payload, dict) or not payload:
        return None, "Le contenu envoyé est invalide."
    unknown_fields = set(payload) - ADMIN_FIELDS
    if unknown_fields:
        return None, "Le contenu envoyé contient un champ non reconnu."

    fields = {}
    required = ADMIN_FIELDS - {"url", "isPublished"}
    for field in required:
        if not partial and field not in payload:
            return None, "Tous les champs obligatoires doivent être renseignés."
    if not partial and "isPublished" not in payload:
        fields["is_published"] = False

    mapping = {
        "title": ("title", 180),
        "description": ("description", 5000),
        "category": ("category", 40),
        "format": ("format", 80),
        "level": ("level", 60),
        "url": ("url", 500),
    }
    for key, (field, max_length) in mapping.items():
        if key not in payload:
            continue
        value = payload[key]
        if not isinstance(value, str) or (field != "url" and not value.strip()):
            return None, f"Le champ {key} est invalide."
        value = value.strip()
        if len(value) > max_length:
            return None, f"Le champ {key} dépasse la longueur autorisée."
        if field == "category" and value not in ADMIN_CATEGORIES:
            return None, "La catégorie sélectionnée est invalide."
        if field == "url" and value:
            try:
                TrainingResource._meta.get_field("url").run_validators(value)
            except ValidationError:
                return None, "Le lien de la ressource est invalide."
        fields[field] = value

    if "isPublished" in payload:
        if not isinstance(payload["isPublished"], bool):
            return None, "Le statut de publication est invalide."
        fields["is_published"] = payload["isPublished"]
    return fields, None


@require_GET
def admin_trainings(request):
    error = _admin_error(request)
    if error:
        return error

    query = request.GET.get("q", "").strip()
    status = request.GET.get("status", "all")
    category = request.GET.get("category", "")
    page = _parse_integer(request.GET.get("page", "1"))
    page_size = _parse_integer(request.GET.get("pageSize", str(ADMIN_PAGE_SIZE)))
    if len(query) > MAX_QUERY_LENGTH:
        return JsonResponse(
            {"detail": "La recherche ne doit pas dépasser 200 caractères."},
            status=400,
        )
    if status not in {"all", "published", "draft"}:
        return JsonResponse({"detail": "Le statut sélectionné est invalide."}, status=400)
    if category and category not in ADMIN_CATEGORIES:
        return JsonResponse({"detail": "La catégorie sélectionnée est invalide."}, status=400)
    if page is None or page < 1:
        return JsonResponse({"detail": "Le numéro de page est invalide."}, status=400)
    if page_size is None or not 1 <= page_size <= MAX_PAGE_SIZE:
        return JsonResponse(
            {"detail": "Le nombre de résultats par page est invalide."},
            status=400,
        )

    resources = TrainingResource.objects.all()
    if status == "published":
        resources = resources.filter(is_published=True)
    elif status == "draft":
        resources = resources.filter(is_published=False)
    if category:
        resources = resources.filter(category=category)
    if query:
        resources = resources.filter(
            Q(title__icontains=query)
            | Q(description__icontains=query)
            | Q(category__icontains=query)
            | Q(format__icontains=query)
            | Q(level__icontains=query)
        )

    total_results = resources.count()
    total_pages = max(1, (total_results + page_size - 1) // page_size)
    page = min(page, total_pages)
    page_resources = resources[(page - 1) * page_size : page * page_size]
    return JsonResponse(
        {
            "resources": [_admin_resource_payload(resource) for resource in page_resources],
            "categories": [choice.value for choice in TrainingResource.Category],
            "pagination": {
                "page": page,
                "pageSize": page_size,
                "totalResults": total_results,
                "totalPages": total_pages,
            },
        }
    )


@require_http_methods(["POST"])
@csrf_protect
def admin_training_create(request):
    error = _admin_error(request)
    if error:
        return error
    payload = _admin_json_body(request)
    fields, validation_error = _validated_admin_fields(payload, partial=False)
    if validation_error:
        return JsonResponse({"detail": validation_error}, status=400)
    resource = TrainingResource.objects.create(**fields)
    return JsonResponse({"resource": _admin_resource_payload(resource)}, status=201)


@require_http_methods(["PATCH"])
@csrf_protect
def admin_training_update(request, resource_id):
    error = _admin_error(request)
    if error:
        return error
    resource = TrainingResource.objects.filter(pk=resource_id).first()
    if resource is None:
        return JsonResponse({"detail": "Cette ressource est introuvable."}, status=404)
    payload = _admin_json_body(request)
    fields, validation_error = _validated_admin_fields(payload, partial=True)
    if validation_error:
        return JsonResponse({"detail": validation_error}, status=400)
    for field, value in fields.items():
        setattr(resource, field, value)
    resource.save()
    return JsonResponse({"resource": _admin_resource_payload(resource)})


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
