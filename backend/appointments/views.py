import json
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.db.models import Q
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.http import require_GET, require_http_methods

from access_requests.models import ProjectAccessRequest
from notifications.models import Notification
from notifications.services import create_notification
from projects.models import EntrepreneurProject

from .models import Appointment


User = get_user_model()
MAX_BIGINT = 9_223_372_036_854_775_807
MAX_QUERY_LENGTH = 200
MAX_PAGE_SIZE = 100
DEFAULT_PAGE_SIZE = 10
MIN_MESSAGE_LENGTH = 10
MAX_MESSAGE_LENGTH = 2000
MEETING_DURATION = timedelta(minutes=30)
MINIMUM_NOTICE = timedelta(hours=1)
MAXIMUM_SCHEDULING_WINDOW = timedelta(days=90)


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


def _authorized(request, role):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "Vous devez vous connecter."}, status=401)
    if request.user.role != role:
        return JsonResponse(
            {"detail": "Cette fonctionnalité n’est pas autorisée pour ce compte."},
            status=403,
        )
    return None


def _admin_error(request):
    return _authorized(request, User.Role.ADMIN)


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
    return page, {
        "page": page,
        "pageSize": page_size,
        "totalResults": total_results,
        "totalPages": total_pages,
    }


def _appointment_payload(appointment):
    return {
        "id": appointment.pk,
        "projectId": appointment.project_id,
        "projectTitle": appointment.project.title,
        "projectSlug": appointment.project.slug or f"projet-{appointment.project_id}",
        "investor": (
            appointment.investor.get_full_name() or appointment.investor.email
        ),
        "investorEmail": appointment.investor.email,
        "entrepreneur": (
            appointment.entrepreneur.get_full_name()
            or appointment.entrepreneur.email
        ),
        "entrepreneurEmail": appointment.entrepreneur.email,
        "scheduledAt": appointment.scheduled_at.isoformat(),
        "message": appointment.message,
        "status": appointment.status,
        "statusLabel": appointment.get_status_display(),
        "responseNote": appointment.response_note,
        "createdAt": appointment.created_at.isoformat(),
        "respondedAt": (
            appointment.responded_at.isoformat()
            if appointment.responded_at
            else None
        ),
        "cancelledAt": (
            appointment.cancelled_at.isoformat()
            if appointment.cancelled_at
            else None
        ),
    }


def _appointment_list(request, appointments):
    status = request.GET.get("status", "all")
    valid_statuses = {choice.value for choice in Appointment.Status}
    if status != "all" and status not in valid_statuses:
        return JsonResponse(
            {"detail": "Le statut sélectionné est invalide."}, status=400
        )

    query = request.GET.get("q", "").strip()
    if len(query) > MAX_QUERY_LENGTH:
        return JsonResponse(
            {"detail": "La recherche ne doit pas dépasser 200 caractères."},
            status=400,
        )
    page, page_size, error = _pagination(request)
    if error:
        return error

    if status != "all":
        appointments = appointments.filter(status=status)
    if query:
        appointments = appointments.filter(
            Q(project__title__icontains=query)
            | Q(investor__email__icontains=query)
            | Q(investor__first_name__icontains=query)
            | Q(investor__last_name__icontains=query)
            | Q(entrepreneur__email__icontains=query)
            | Q(entrepreneur__first_name__icontains=query)
            | Q(entrepreneur__last_name__icontains=query)
            | Q(message__icontains=query)
        )

    total_results = appointments.count()
    page, pagination = _pagination_payload(page, page_size, total_results)
    page_appointments = appointments.order_by("scheduled_at", "-pk")[
        (page - 1) * page_size : page * page_size
    ]
    return JsonResponse(
        {
            "appointments": [
                _appointment_payload(appointment)
                for appointment in page_appointments
            ],
            "statuses": [
                {"status": status_value, "label": status_label}
                for status_value, status_label in Appointment.Status.choices
            ],
            "pagination": pagination,
        }
    )


def _validated_schedule(payload):
    scheduled_at_value = payload.get("scheduledAt")
    if not isinstance(scheduled_at_value, str):
        return None, "Le créneau proposé est invalide."
    scheduled_at = parse_datetime(scheduled_at_value)
    if scheduled_at is None or timezone.is_naive(scheduled_at):
        return None, "Le créneau doit inclure son fuseau horaire."
    if scheduled_at.minute % 30 != 0 or scheduled_at.second or scheduled_at.microsecond:
        return None, "Les rendez-vous sont proposés par créneaux de 30 minutes."

    now = timezone.now()
    if scheduled_at < now + MINIMUM_NOTICE:
        return None, "Le rendez-vous doit être proposé au moins une heure à l’avance."
    if scheduled_at > now + MAXIMUM_SCHEDULING_WINDOW:
        return None, "Le rendez-vous ne peut pas être planifié à plus de 90 jours."
    return scheduled_at, None


def _active_slot_conflict(entrepreneur, scheduled_at, exclude_id=None):
    appointments = Appointment.objects.filter(
        entrepreneur=entrepreneur,
        status__in=[Appointment.Status.PENDING, Appointment.Status.CONFIRMED],
        scheduled_at__gt=scheduled_at - MEETING_DURATION,
        scheduled_at__lt=scheduled_at + MEETING_DURATION,
    )
    if exclude_id is not None:
        appointments = appointments.exclude(pk=exclude_id)
    return appointments.exists()


@require_http_methods(["GET", "POST"])
@csrf_protect
def investor_appointments(request):
    error = _authorized(request, User.Role.INVESTOR)
    if error:
        return error

    if request.method == "GET":
        appointments = Appointment.objects.filter(
            investor=request.user
        ).select_related("project", "investor", "entrepreneur")
        return _appointment_list(request, appointments)

    payload = _json_body(request)
    if payload is None or set(payload) != {"projectId", "scheduledAt", "message"}:
        return JsonResponse(
            {"detail": "Le contenu de la demande de rendez-vous est invalide."},
            status=400,
        )
    project_id = payload["projectId"]
    if (
        isinstance(project_id, bool)
        or not isinstance(project_id, int)
        or project_id <= 0
    ):
        return JsonResponse({"detail": "Le projet sélectionné est invalide."}, status=400)
    message = payload["message"]
    if not isinstance(message, str):
        return JsonResponse({"detail": "Le motif du rendez-vous est invalide."}, status=400)
    message = message.strip()
    if not MIN_MESSAGE_LENGTH <= len(message) <= MAX_MESSAGE_LENGTH:
        return JsonResponse(
            {"detail": "Le motif doit contenir entre 10 et 2000 caractères."},
            status=400,
        )
    scheduled_at, error = _validated_schedule(payload)
    if error:
        return JsonResponse({"detail": error}, status=400)

    project = EntrepreneurProject.objects.filter(
        pk=project_id,
        status=EntrepreneurProject.Status.PUBLISHED,
    ).select_related("owner").first()
    if project is None or project.owner_id == request.user.pk:
        return JsonResponse(
            {"detail": "Ce projet n’est pas disponible pour un rendez-vous."},
            status=404,
        )
    if project.visibility != EntrepreneurProject.Visibility.PUBLIC and not (
        ProjectAccessRequest.objects.filter(
            project=project,
            investor=request.user,
            status=ProjectAccessRequest.Status.APPROVED,
        ).exists()
    ):
        return JsonResponse(
            {"detail": "Un accès approuvé au projet est requis."}, status=403
        )

    try:
        with transaction.atomic():
            User.objects.select_for_update().get(pk=project.owner_id)
            if _active_slot_conflict(project.owner, scheduled_at):
                return JsonResponse(
                    {
                        "detail": (
                            "Ce créneau chevauche un rendez-vous en attente ou confirmé."
                        )
                    },
                    status=409,
                )
            appointment = Appointment.objects.create(
                investor=request.user,
                entrepreneur=project.owner,
                project=project,
                scheduled_at=scheduled_at,
                message=message,
            )
            create_notification(
                project.owner,
                kind=Notification.Kind.APPOINTMENT,
                title="Nouvelle demande de rendez-vous",
                body=(
                    f"{request.user.get_full_name() or request.user.email} "
                    f"a demandé un rendez-vous au sujet de « {project.title} »."
                ),
                target_url="/espace-entrepreneur",
            )
    except IntegrityError:
        return JsonResponse(
            {"detail": "Le rendez-vous n’a pas pu être enregistré."}, status=409
        )
    return JsonResponse(
        {"appointment": _appointment_payload(appointment)}, status=201
    )


@require_http_methods(["PATCH"])
@csrf_protect
def investor_appointment_cancel(request, appointment_id):
    error = _authorized(request, User.Role.INVESTOR)
    if error:
        return error
    payload = _json_body(request)
    if payload is None or set(payload) != {"action"} or payload["action"] != "cancel":
        return JsonResponse({"detail": "L’action demandée est invalide."}, status=400)

    with transaction.atomic():
        appointment = get_object_or_404(
            Appointment.objects.select_for_update().select_related(
                "project", "investor", "entrepreneur"
            ),
            pk=appointment_id,
            investor=request.user,
        )
        if appointment.status != Appointment.Status.PENDING:
            return JsonResponse(
                {"detail": "Seule une demande en attente peut être annulée."},
                status=409,
            )
        appointment.status = Appointment.Status.CANCELLED
        appointment.cancelled_at = timezone.now()
        appointment.save(update_fields=["status", "cancelled_at", "updated_at"])
        create_notification(
            appointment.entrepreneur,
            kind=Notification.Kind.APPOINTMENT,
            title="Demande de rendez-vous annulée",
            body=(
                f"{appointment.investor.get_full_name() or appointment.investor.email} "
                f"a annulé sa demande pour « {appointment.project.title} »."
            ),
            target_url="/espace-entrepreneur",
        )
    return JsonResponse({"appointment": _appointment_payload(appointment)})


@require_GET
def entrepreneur_appointments(request):
    error = _authorized(request, User.Role.ENTREPRENEUR)
    if error:
        return error
    appointments = Appointment.objects.filter(
        entrepreneur=request.user
    ).select_related("project", "investor", "entrepreneur")
    return _appointment_list(request, appointments)


@require_http_methods(["PATCH"])
@csrf_protect
def entrepreneur_appointment_decision(request, appointment_id):
    error = _authorized(request, User.Role.ENTREPRENEUR)
    if error:
        return error
    payload = _json_body(request)
    if payload is None or set(payload) != {"decision", "responseNote"}:
        return JsonResponse(
            {"detail": "Le contenu de la réponse est invalide."}, status=400
        )
    decision = payload["decision"]
    if not isinstance(decision, str) or decision not in {
        Appointment.Status.CONFIRMED,
        Appointment.Status.DECLINED,
    }:
        return JsonResponse({"detail": "La décision est invalide."}, status=400)
    response_note = payload["responseNote"]
    if not isinstance(response_note, str) or len(response_note.strip()) > 2000:
        return JsonResponse({"detail": "La note de réponse est invalide."}, status=400)

    with transaction.atomic():
        User.objects.select_for_update().get(pk=request.user.pk)
        appointment = get_object_or_404(
            Appointment.objects.select_for_update().select_related(
                "project", "investor", "entrepreneur"
            ),
            pk=appointment_id,
            entrepreneur=request.user,
        )
        if appointment.status != Appointment.Status.PENDING:
            return JsonResponse(
                {"detail": "Cette demande a déjà été traitée."}, status=409
            )
        if (
            decision == Appointment.Status.CONFIRMED
            and _active_slot_conflict(
                appointment.entrepreneur,
                appointment.scheduled_at,
                exclude_id=appointment.pk,
            )
        ):
            return JsonResponse(
                {"detail": "Ce créneau n’est plus disponible."}, status=409
            )
        appointment.status = decision
        appointment.response_note = response_note.strip()
        appointment.responded_at = timezone.now()
        appointment.save(
            update_fields=[
                "status",
                "response_note",
                "responded_at",
                "updated_at",
            ]
        )
        decision_label = (
            "confirmé"
            if decision == Appointment.Status.CONFIRMED
            else "refusé"
        )
        create_notification(
            appointment.investor,
            kind=Notification.Kind.APPOINTMENT,
            title="Réponse à votre demande de rendez-vous",
            body=(
                f"Votre rendez-vous pour « {appointment.project.title} » a été "
                f"{decision_label}."
                + (f" Note : {response_note.strip()}" if response_note.strip() else "")
            ),
            target_url="/espace-investisseur/appointments",
        )
    return JsonResponse({"appointment": _appointment_payload(appointment)})


@require_GET
def admin_appointments(request):
    error = _admin_error(request)
    if error:
        return error
    appointments = Appointment.objects.select_related(
        "project", "investor", "entrepreneur"
    )
    return _appointment_list(request, appointments)
