import json

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Count, Q
from django.db.models.functions import Coalesce
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.http import require_GET, require_http_methods

from access_requests.models import ProjectAccessRequest
from .models import EntrepreneurProject, Favorite

SECTORS = {
    "Agriculture",
    "Technologie",
    "Énergie",
    "Santé",
    "Éducation",
    "Commerce",
    "Environnement",
    "Industrie",
    "Autres",
}
REGIONS = {
    "Boké",
    "Conakry",
    "Faranah",
    "Kankan",
    "Kindia",
    "Labé",
    "Mamou",
    "N'Zérékoré",
}
User = get_user_model()


@require_GET
def homepage_data(request):
    public_projects = EntrepreneurProject.objects.filter(
        status=EntrepreneurProject.Status.PUBLISHED,
        visibility=EntrepreneurProject.Visibility.PUBLIC,
    ).select_related("owner", "organization")
    active_users = User.objects.filter(is_active=True).exclude(role=User.Role.ADMIN)

    recent_projects = [
        {
            "id": project.pk,
            "slug": project.slug or f"projet-{project.pk}",
            "title": project.title,
            "sector": project.sector,
            "region": project.region,
            "location": project.city or project.region,
            "fundingGoal": project.funding_goal,
            "publishedAt": (project.published_at or project.created_at).date().isoformat(),
        }
        for project in public_projects.order_by("-published_at", "-pk")[:3]
    ]
    sectors = public_projects.order_by().values("sector").annotate(
        project_count=Count("pk")
    ).order_by("sector")

    return JsonResponse(
        {
            "stats": {
                "members": active_users.count(),
                "publishedProjects": public_projects.count(),
                "investors": active_users.filter(role=User.Role.INVESTOR).count(),
                "entrepreneurs": active_users.filter(role=User.Role.ENTREPRENEUR).count(),
            },
            "projects": recent_projects,
            "sectors": list(sectors),
        }
    )


def _project_payload(project):
    return {
        "id": project.pk,
        "title": project.title,
        "description": project.description,
        "sector": project.sector,
        "region": project.region,
        "fundingGoal": project.funding_goal,
        "stage": project.stage,
        "status": project.status,
        "statusLabel": project.get_status_display(),
        "createdAt": project.created_at.isoformat(),
        "updatedAt": project.updated_at.isoformat(),
    }


def _public_projects_queryset():
    return EntrepreneurProject.objects.filter(
        status=EntrepreneurProject.Status.PUBLISHED,
        visibility=EntrepreneurProject.Visibility.PUBLIC,
    ).select_related("owner", "organization")


def _public_project_payload(project):
    sector = project.sector
    owner_name = "Porteur de projet"
    if project.organization:
        owner_name = project.organization.display_name or project.organization.legal_name
    elif project.owner.get_full_name():
        owner_name = project.owner.get_full_name()

    return {
        "id": project.pk,
        "slug": project.slug or f"projet-{project.pk}",
        "title": project.title,
        "description": project.description,
        "summary": project.summary or project.description,
        "sector": sector,
        "sectors": [sector],
        "region": project.region,
        "location": project.city or project.region,
        "fundingGoal": project.funding_goal,
        "stage": project.stage,
        "status": "Publié",
        "publishedAt": (project.published_at or project.created_at).date().isoformat(),
        "owner": owner_name,
    }


@require_GET
def public_projects(request):
    projects = _public_projects_queryset()
    query = request.GET.get("q", "").strip()
    sectors_filter = request.GET.getlist("sector")
    region_filter = request.GET.get("region", "")
    stage_filter = request.GET.get("stage", "")
    sort = request.GET.get("sort", "newest")
    page_value = request.GET.get("page")
    page_size_value = request.GET.get("pageSize", "3")
    min_amount_value = request.GET.get("minAmount")
    max_amount_value = request.GET.get("maxAmount")

    if len(query) > 200:
        return JsonResponse({"detail": "La recherche ne doit pas dépasser 200 caractères."}, status=400)
    if any(sector not in SECTORS for sector in sectors_filter):
        return JsonResponse({"detail": "Un secteur sélectionné est invalide."}, status=400)
    if region_filter and region_filter not in REGIONS:
        return JsonResponse({"detail": "La région sélectionnée est invalide."}, status=400)
    if stage_filter and stage_filter not in EntrepreneurProject.Stage.values:
        return JsonResponse({"detail": "Le stade de développement sélectionné est invalide."}, status=400)
    if sort not in {"newest", "oldest", "amount-asc", "amount-desc"}:
        return JsonResponse({"detail": "Le tri demandé est invalide."}, status=400)

    def parse_integer(value):
        if value is None:
            return None
        if not value.isdecimal() or len(value) > 19:
            return None
        parsed = int(value)
        if parsed > 9_223_372_036_854_775_807:
            return None
        return parsed

    page = parse_integer(page_value) if page_value is not None else 1
    page_size = parse_integer(page_size_value)
    min_amount = parse_integer(min_amount_value)
    max_amount = parse_integer(max_amount_value)
    if page is None or page < 1:
        return JsonResponse({"detail": "Le numéro de page est invalide."}, status=400)
    if page_size is None or not 1 <= page_size <= 100:
        return JsonResponse({"detail": "Le nombre de résultats par page est invalide."}, status=400)
    if min_amount_value is not None and (min_amount is None or min_amount < 0):
        return JsonResponse({"detail": "Le montant minimum est invalide."}, status=400)
    if max_amount_value is not None and (max_amount is None or max_amount < 0):
        return JsonResponse({"detail": "Le montant maximum est invalide."}, status=400)
    if min_amount is not None and max_amount is not None and max_amount <= min_amount:
        return JsonResponse({"detail": "La plage de montants est invalide."}, status=400)

    active_users = User.objects.filter(is_active=True).exclude(role=User.Role.ADMIN)
    sectors = projects.order_by().values("sector").annotate(
        project_count=Count("pk")
    ).order_by("sector")
    regions = projects.order_by().values_list("region", flat=True).distinct().order_by("region")
    stages = projects.order_by().values_list("stage", flat=True).distinct().order_by("stage")

    if query:
        projects = projects.filter(
            Q(title__icontains=query)
            | Q(description__icontains=query)
            | Q(summary__icontains=query)
            | Q(sector__icontains=query)
            | Q(region__icontains=query)
            | Q(city__icontains=query)
            | Q(owner__first_name__icontains=query)
            | Q(owner__last_name__icontains=query)
            | Q(organization__display_name__icontains=query)
            | Q(organization__legal_name__icontains=query)
        ).distinct()
    if sectors_filter:
        projects = projects.filter(sector__in=sectors_filter)
    if region_filter:
        projects = projects.filter(region=region_filter)
    if stage_filter:
        projects = projects.filter(stage=stage_filter)
    if min_amount is not None:
        projects = projects.filter(funding_goal__gte=min_amount)
    if max_amount is not None:
        projects = projects.filter(funding_goal__lt=max_amount)

    has_catalog_query = bool(
        page_value is not None
        or query
        or sectors_filter
        or region_filter
        or stage_filter
        or min_amount is not None
        or max_amount is not None
        or "sort" in request.GET
    )
    if has_catalog_query:
        projects = projects.annotate(publication_date=Coalesce("published_at", "created_at"))
        if sort == "oldest":
            projects = projects.order_by("publication_date", "pk")
        elif sort == "amount-asc":
            projects = projects.order_by("funding_goal", "-publication_date", "-pk")
        elif sort == "amount-desc":
            projects = projects.order_by("-funding_goal", "-publication_date", "-pk")
        else:
            projects = projects.order_by("-publication_date", "-pk")

    if page_value is not None:
        total_results = projects.count()
        total_pages = max(1, (total_results + page_size - 1) // page_size)
        page = min(page, total_pages)
        page_projects = projects[(page - 1) * page_size : page * page_size]
    else:
        page_projects = projects

    payload = {
        "projects": [_public_project_payload(project) for project in page_projects],
        "stats": {
            "publishedProjects": _public_projects_queryset().count(),
            "investors": active_users.filter(role=User.Role.INVESTOR).count(),
            "entrepreneurs": active_users.filter(role=User.Role.ENTREPRENEUR).count(),
        },
        "sectors": list(sectors),
        "regions": list(regions),
        "stages": list(stages),
    }
    if page_value is not None:
        payload["pagination"] = {
            "page": page,
            "pageSize": page_size,
            "totalResults": total_results,
            "totalPages": total_pages,
        }
    return JsonResponse(payload)


@require_GET
def public_project_detail(request, slug):
    projects = EntrepreneurProject.objects.filter(
        status=EntrepreneurProject.Status.PUBLISHED,
    ).select_related("owner", "organization")
    project = projects.filter(slug=slug).first()
    if project is None and slug.startswith("projet-"):
        project_id = slug.removeprefix("projet-")
        if project_id.isdecimal():
            project = projects.filter(pk=project_id, slug__isnull=True).first()
            if project is None:
                project = projects.filter(pk=project_id, slug="").first()
    if project is None:
        return JsonResponse({"detail": "Ce projet est introuvable."}, status=404)
    if project.visibility != EntrepreneurProject.Visibility.PUBLIC:
        if (
            not request.user.is_authenticated
            or request.user.role != User.Role.INVESTOR
            or not ProjectAccessRequest.objects.filter(
                project=project,
                investor=request.user,
                status=ProjectAccessRequest.Status.APPROVED,
            ).exists()
        ):
            return JsonResponse({"detail": "Ce projet est introuvable."}, status=404)
    return JsonResponse({"project": _public_project_payload(project)})


def _json_body(request):
    try:
        payload = json.loads(request.body.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        return None
    return payload if isinstance(payload, dict) else None


def _authorized_entrepreneur(request):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "Vous devez vous connecter."}, status=401)
    if request.user.role != User.Role.ENTREPRENEUR:
        return JsonResponse(
            {"detail": "Cette fonctionnalité est réservée aux entrepreneurs."},
            status=403,
        )
    return None


@require_http_methods(["GET", "PUT"])
@csrf_protect
def student_favorites(request):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "Vous devez vous connecter."}, status=401)
    if request.user.role != User.Role.STUDENT:
        return JsonResponse(
            {"detail": "Cette fonctionnalité est réservée aux étudiants."},
            status=403,
        )

    if request.method == "GET":
        favorite_ids = Favorite.objects.filter(
            user=request.user,
            project__status=EntrepreneurProject.Status.PUBLISHED,
            project__visibility=EntrepreneurProject.Visibility.PUBLIC,
        ).values_list("project_id", flat=True)
        return JsonResponse({"projectIds": list(favorite_ids)})

    payload = _json_body(request)
    project_ids = payload.get("projectIds") if payload is not None else None
    if (
        not isinstance(project_ids, list)
        or any(
            isinstance(project_id, bool)
            or not isinstance(project_id, int)
            or project_id <= 0
            for project_id in project_ids
        )
    ):
        return JsonResponse(
            {"detail": "La liste des projets favoris est invalide."},
            status=400,
        )

    unique_project_ids = list(dict.fromkeys(project_ids))
    available_project_ids = set(
        _public_projects_queryset()
        .filter(pk__in=unique_project_ids)
        .values_list("pk", flat=True)
    )
    unavailable_project_ids = [
        project_id
        for project_id in unique_project_ids
        if project_id not in available_project_ids
    ]
    valid_project_ids = [
        project_id
        for project_id in unique_project_ids
        if project_id in available_project_ids
    ]

    with transaction.atomic():
        favorites = Favorite.objects.filter(user=request.user)
        if valid_project_ids:
            favorites.exclude(project_id__in=valid_project_ids).delete()
        else:
            favorites.delete()

        existing_ids = set(
            Favorite.objects.filter(
                user=request.user,
                project_id__in=valid_project_ids,
            ).values_list("project_id", flat=True)
        )
        Favorite.objects.bulk_create(
            [
                Favorite(user=request.user, project_id=project_id)
                for project_id in valid_project_ids
                if project_id not in existing_ids
            ]
        )

    favorite_ids = Favorite.objects.filter(
        user=request.user,
        project__status=EntrepreneurProject.Status.PUBLISHED,
        project__visibility=EntrepreneurProject.Visibility.PUBLIC,
    ).values_list("project_id", flat=True)
    return JsonResponse(
        {
            "projectIds": list(favorite_ids),
            "unavailableProjectIds": unavailable_project_ids,
        }
    )


def _validated_project_fields(payload):
    title = payload.get("title")
    description = payload.get("description")
    sector = payload.get("sector")
    region = payload.get("region")
    funding_goal = payload.get("fundingGoal")
    stage = payload.get("stage")

    if not isinstance(title, str) or not title.strip() or len(title.strip()) > 160:
        return None, "Le titre est obligatoire et ne doit pas dépasser 160 caractères."
    if (
        not isinstance(description, str)
        or len(description.strip()) < 30
        or len(description.strip()) > 5000
    ):
        return None, "La description doit contenir entre 30 et 5 000 caractères."
    if not isinstance(sector, str) or sector not in SECTORS:
        return None, "Sélectionnez un secteur valide."
    if not isinstance(region, str) or region not in REGIONS:
        return None, "Sélectionnez une région valide."
    if (
        isinstance(funding_goal, bool)
        or not isinstance(funding_goal, int)
        or funding_goal <= 0
        or funding_goal > 999_999_999_999_999
    ):
        return None, "Saisissez un objectif de financement en GNF valide."
    if stage not in EntrepreneurProject.Stage.values:
        return None, "Sélectionnez un stade d’avancement valide."

    return {
        "title": title.strip(),
        "description": description.strip(),
        "sector": sector,
        "region": region,
        "funding_goal": funding_goal,
        "stage": stage,
    }, None


@require_http_methods(["GET", "POST"])
@csrf_protect
def entrepreneur_projects(request):
    authorization_error = _authorized_entrepreneur(request)
    if authorization_error:
        return authorization_error

    if request.method == "GET":
        projects = EntrepreneurProject.objects.filter(owner=request.user)
        return JsonResponse({"projects": [_project_payload(project) for project in projects]})

    payload = _json_body(request)
    if payload is None:
        return JsonResponse({"detail": "La requête doit contenir un objet JSON valide."}, status=400)

    fields, error = _validated_project_fields(payload)
    if error:
        return JsonResponse({"detail": error}, status=400)

    action = payload.get("action", "save")
    if not isinstance(action, str) or action not in {"save", "submit"}:
        return JsonResponse({"detail": "Action de projet invalide."}, status=400)

    status = (
        EntrepreneurProject.Status.SUBMITTED
        if action == "submit"
        else EntrepreneurProject.Status.DRAFT
    )
    project = EntrepreneurProject.objects.create(
        owner=request.user,
        status=status,
        **fields,
    )
    return JsonResponse({"project": _project_payload(project)}, status=201)


@require_http_methods(["PATCH"])
@csrf_protect
def entrepreneur_project_detail(request, project_id):
    authorization_error = _authorized_entrepreneur(request)
    if authorization_error:
        return authorization_error

    project = get_object_or_404(
        EntrepreneurProject,
        pk=project_id,
        owner=request.user,
    )
    if project.status not in {
        EntrepreneurProject.Status.DRAFT,
        EntrepreneurProject.Status.REJECTED,
    }:
        return JsonResponse(
            {"detail": "Ce projet n’est plus modifiable après sa soumission."},
            status=409,
        )

    payload = _json_body(request)
    if payload is None:
        return JsonResponse({"detail": "La requête doit contenir un objet JSON valide."}, status=400)

    fields, error = _validated_project_fields(payload)
    if error:
        return JsonResponse({"detail": error}, status=400)

    action = payload.get("action", "save")
    if not isinstance(action, str) or action not in {"save", "submit"}:
        return JsonResponse({"detail": "Action de projet invalide."}, status=400)

    project.status = EntrepreneurProject.Status.DRAFT
    if action == "submit":
        project.status = EntrepreneurProject.Status.SUBMITTED

    for field, value in fields.items():
        setattr(project, field, value)
    project.save()
    return JsonResponse({"project": _project_payload(project)})
