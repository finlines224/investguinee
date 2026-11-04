import json

from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.db.models import Q
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.http import require_GET, require_http_methods

from projects.models import EntrepreneurProject
from notifications.models import Notification
from notifications.services import create_notification, notify_administrators

from .models import ProjectAccessRequest


User = get_user_model()
MAX_BIGINT = 9_223_372_036_854_775_807
MAX_QUERY_LENGTH = 200
MAX_PAGE_SIZE = 100
DEFAULT_PAGE_SIZE = 10
MAX_JUSTIFICATION_LENGTH = 2000
MIN_JUSTIFICATION_LENGTH = 10


def _parse_integer(value):
    if not value or not value.isdecimal() or len(value) > 19:
        return None
    parsed = int(value)
    return parsed if parsed <= MAX_BIGINT else None


def _json_body(request):
    try:
        payload = json.loads(request.body.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        return None
    return payload if isinstance(payload, dict) else None


def _authorized_investor(request):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "Vous devez vous connecter."}, status=401)
    if request.user.role != User.Role.INVESTOR:
        return JsonResponse(
            {"detail": "Cette fonctionnalité est réservée aux investisseurs."},
            status=403,
        )
    return None


def _admin_error(request):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "Vous devez vous connecter."}, status=401)
    if request.user.role != User.Role.ADMIN:
        return JsonResponse(
            {"detail": "Cette fonctionnalité est réservée aux administrateurs."},
            status=403,
        )
    return None


def _pagination(request):
    page = _parse_integer(request.GET.get("page", "1"))
    page_size = _parse_integer(request.GET.get("pageSize", str(DEFAULT_PAGE_SIZE)))
    if page is None or page < 1:
        return None, None, JsonResponse(
            {"detail": "Le numéro de page est invalide."}, status=400
        )
    if page_size is None or not 1 <= page_size <= MAX_PAGE_SIZE:
        return None, None, JsonResponse(
            {"detail": "Le nombre de résultats par page est invalide."}, status=400
        )
    return page, page_size, None


def _pagination_payload(page, page_size, total_results):
    total_pages = max(1, (total_results + page_size - 1) // page_size)
    page = min(page, total_pages)
    return page, total_pages, {
        "page": page,
        "pageSize": page_size,
        "totalResults": total_results,
        "totalPages": total_pages,
    }


def _project_access_request_payload(access_request):
    project = access_request.project
    return {
        "id": access_request.pk,
        "projectId": project.pk,
        "projectTitle": project.title,
        "projectSlug": project.slug or f"projet-{project.pk}",
        "sector": project.sector,
        "region": project.region,
        "investor": (
            access_request.investor.get_full_name()
            or access_request.investor.email
        ),
        "investorEmail": access_request.investor.email,
        "justification": access_request.justification,
        "status": access_request.status,
        "statusLabel": access_request.get_status_display(),
        "reviewerNote": access_request.reviewer_note,
        "reviewedBy": (
            access_request.reviewed_by.get_full_name()
            or access_request.reviewed_by.email
            if access_request.reviewed_by
            else ""
        ),
        "createdAt": access_request.created_at.isoformat(),
        "decidedAt": (
            access_request.decided_at.isoformat()
            if access_request.decided_at
            else None
        ),
    }


@require_GET
def investor_access_request_projects(request):
    error = _authorized_investor(request)
    if error:
        return error

    query = request.GET.get("q", "").strip()
    if len(query) > MAX_QUERY_LENGTH:
        return JsonResponse(
            {"detail": "La recherche ne doit pas dépasser 200 caractères."},
            status=400,
        )
    page, page_size, error = _pagination(request)
    if error:
        return error

    projects = EntrepreneurProject.objects.filter(
        status=EntrepreneurProject.Status.PUBLISHED,
        visibility__in=[
            EntrepreneurProject.Visibility.MEMBERS_ONLY,
            EntrepreneurProject.Visibility.RESTRICTED,
        ],
    ).exclude(owner=request.user)
    if query:
        projects = projects.filter(
            Q(title__icontains=query)
            | Q(sector__icontains=query)
            | Q(region__icontains=query)
        )

    total_results = projects.count()
    page, total_pages, pagination = _pagination_payload(
        page, page_size, total_results
    )
    page_projects = list(
        projects.order_by("-published_at", "-pk")[
            (page - 1) * page_size : page * page_size
        ]
    )
    latest_requests = {}
    if page_projects:
        for access_request in ProjectAccessRequest.objects.filter(
            investor=request.user,
            project_id__in=[project.pk for project in page_projects],
        ).order_by("-created_at", "-pk"):
            latest_requests.setdefault(access_request.project_id, access_request)

    return JsonResponse(
        {
            "projects": [
                {
                    "id": project.pk,
                    "title": project.title,
                    "slug": project.slug or f"projet-{project.pk}",
                    "sector": project.sector,
                    "region": project.region,
                    "fundingGoal": project.funding_goal,
                    "currency": project.currency,
                    "stage": project.stage,
                    "visibility": project.visibility,
                    "request": (
                        {
                            "id": latest_requests[project.pk].pk,
                            "status": latest_requests[project.pk].status,
                            "statusLabel": (
                                latest_requests[project.pk].get_status_display()
                            ),
                        }
                        if project.pk in latest_requests
                        else None
                    ),
                }
                for project in page_projects
            ],
            "pagination": pagination,
        }
    )


@require_http_methods(["GET", "POST"])
@csrf_protect
def investor_access_requests(request):
    error = _authorized_investor(request)
    if error:
        return error

    if request.method == "POST":
        payload = _json_body(request)
        if payload is None or set(payload) != {"projectId", "justification"}:
            return JsonResponse(
                {"detail": "Le contenu de la demande est invalide."}, status=400
            )
        project_id = payload["projectId"]
        if (
            isinstance(project_id, bool)
            or not isinstance(project_id, int)
            or project_id <= 0
        ):
            return JsonResponse(
                {"detail": "Le projet sélectionné est invalide."}, status=400
            )
        justification = payload["justification"]
        if not isinstance(justification, str):
            return JsonResponse(
                {"detail": "La justification est invalide."}, status=400
            )
        justification = justification.strip()
        if not MIN_JUSTIFICATION_LENGTH <= len(justification) <= MAX_JUSTIFICATION_LENGTH:
            return JsonResponse(
                {
                    "detail": (
                        "La justification doit contenir entre 10 et 2000 caractères."
                    )
                },
                status=400,
            )

        project = EntrepreneurProject.objects.filter(
            pk=project_id,
            status=EntrepreneurProject.Status.PUBLISHED,
            visibility__in=[
                EntrepreneurProject.Visibility.MEMBERS_ONLY,
                EntrepreneurProject.Visibility.RESTRICTED,
            ],
        ).exclude(owner=request.user).first()
        if project is None:
            return JsonResponse(
                {
                    "detail": (
                        "Ce projet n’est pas disponible pour une demande d’accès."
                    )
                },
                status=404,
            )
        if ProjectAccessRequest.objects.filter(
            project=project,
            investor=request.user,
            status__in=[
                ProjectAccessRequest.Status.PENDING,
                ProjectAccessRequest.Status.APPROVED,
            ],
        ).exists():
            return JsonResponse(
                {
                    "detail": (
                        "Une demande est déjà en attente ou cet accès est déjà accordé."
                    )
                },
                status=409,
            )
        try:
            with transaction.atomic():
                access_request = ProjectAccessRequest.objects.create(
                    project=project,
                    investor=request.user,
                    justification=justification,
                )
                notify_administrators(
                    kind=Notification.Kind.ACCESS_REQUEST,
                    title="Nouvelle demande d’accès",
                    body=(
                        f"{access_request.investor.get_full_name() or access_request.investor.email} "
                        f"a demandé l’accès au projet « {project.title} »."
                    ),
                    target_url="/espace-administrateur",
                )
        except IntegrityError:
            return JsonResponse(
                {"detail": "Une demande active existe déjà pour ce projet."},
                status=409,
            )
        return JsonResponse(
            {"request": _project_access_request_payload(access_request)},
            status=201,
        )

    status = request.GET.get("status", "all")
    valid_statuses = {choice.value for choice in ProjectAccessRequest.Status}
    if status != "all" and status not in valid_statuses:
        return JsonResponse(
            {"detail": "Le statut sélectionné est invalide."}, status=400
        )
    page, page_size, error = _pagination(request)
    if error:
        return error

    requests = ProjectAccessRequest.objects.filter(investor=request.user).select_related(
        "project", "investor", "reviewed_by"
    )
    if status != "all":
        requests = requests.filter(status=status)
    total_results = requests.count()
    page, total_pages, pagination = _pagination_payload(
        page, page_size, total_results
    )
    page_requests = requests.order_by("-created_at", "-pk")[
        (page - 1) * page_size : page * page_size
    ]
    return JsonResponse(
        {
            "requests": [
                _project_access_request_payload(access_request)
                for access_request in page_requests
            ],
            "statuses": [
                {"status": status_value, "label": status_label}
                for status_value, status_label in ProjectAccessRequest.Status.choices
            ],
            "pagination": pagination,
        }
    )


@require_GET
def admin_access_requests(request):
    error = _admin_error(request)
    if error:
        return error

    query = request.GET.get("q", "").strip()
    status = request.GET.get("status", ProjectAccessRequest.Status.PENDING)
    valid_statuses = {choice.value for choice in ProjectAccessRequest.Status}
    if len(query) > MAX_QUERY_LENGTH:
        return JsonResponse(
            {"detail": "La recherche ne doit pas dépasser 200 caractères."},
            status=400,
        )
    if status != "all" and status not in valid_statuses:
        return JsonResponse(
            {"detail": "Le statut sélectionné est invalide."}, status=400
        )
    page, page_size, error = _pagination(request)
    if error:
        return error

    requests = ProjectAccessRequest.objects.select_related(
        "project", "investor", "reviewed_by"
    )
    if status != "all":
        requests = requests.filter(status=status)
    if query:
        requests = requests.filter(
            Q(project__title__icontains=query)
            | Q(investor__email__icontains=query)
            | Q(investor__first_name__icontains=query)
            | Q(investor__last_name__icontains=query)
            | Q(justification__icontains=query)
        )

    total_results = requests.count()
    page, total_pages, pagination = _pagination_payload(
        page, page_size, total_results
    )
    page_requests = requests.order_by("-created_at", "-pk")[
        (page - 1) * page_size : page * page_size
    ]
    return JsonResponse(
        {
            "requests": [
                _project_access_request_payload(access_request)
                for access_request in page_requests
            ],
            "statuses": [
                {"status": status_value, "label": status_label}
                for status_value, status_label in ProjectAccessRequest.Status.choices
            ],
            "pagination": pagination,
        }
    )


@require_http_methods(["PATCH"])
@csrf_protect
def admin_access_request_decision(request, request_id):
    error = _admin_error(request)
    if error:
        return error

    payload = _json_body(request)
    if payload is None or set(payload) != {"decision", "reviewerNote"}:
        return JsonResponse(
            {"detail": "Le contenu de la décision est invalide."}, status=400
        )
    decision = payload["decision"]
    if not isinstance(decision, str) or decision not in {
        ProjectAccessRequest.Status.APPROVED,
        ProjectAccessRequest.Status.REJECTED,
    }:
        return JsonResponse(
            {"detail": "La décision sélectionnée est invalide."}, status=400
        )
    reviewer_note = payload["reviewerNote"]
    if not isinstance(reviewer_note, str) or len(reviewer_note.strip()) > 2000:
        return JsonResponse({"detail": "La note de décision est invalide."}, status=400)
    reviewer_note = reviewer_note.strip()

    with transaction.atomic():
        access_request = get_object_or_404(
            ProjectAccessRequest.objects.select_for_update().select_related(
                "project", "investor"
            ),
            pk=request_id,
        )
        if access_request.status != ProjectAccessRequest.Status.PENDING:
            return JsonResponse(
                {"detail": "Cette demande a déjà été traitée."}, status=409
            )
        if decision == ProjectAccessRequest.Status.APPROVED and (
            access_request.project.status != EntrepreneurProject.Status.PUBLISHED
            or access_request.project.visibility
            == EntrepreneurProject.Visibility.PUBLIC
        ):
            return JsonResponse(
                {
                    "detail": (
                        "Ce projet n’est plus disponible pour un accès restreint."
                    )
                },
                status=409,
            )
        access_request.status = decision
        access_request.reviewer_note = reviewer_note
        access_request.reviewed_by = request.user
        access_request.decided_at = timezone.now()
        access_request.save(
            update_fields=[
                "status",
                "reviewer_note",
                "reviewed_by",
                "decided_at",
                "updated_at",
            ]
        )
        decision_label = (
            "approuvée"
            if decision == ProjectAccessRequest.Status.APPROVED
            else "refusée"
        )
        create_notification(
            access_request.investor,
            kind=Notification.Kind.ACCESS_REQUEST,
            title="Réponse à votre demande d’accès",
            body=(
                f"Votre demande d’accès au projet « {access_request.project.title} » "
                f"a été {decision_label}."
                + (f" Note : {reviewer_note}" if reviewer_note else "")
            ),
            target_url="/espace-investisseur/requests",
        )
    return JsonResponse(
        {"request": _project_access_request_payload(access_request)}
    )
