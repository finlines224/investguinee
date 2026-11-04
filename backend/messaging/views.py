import json

from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.db.models import Count, OuterRef, Q, Subquery
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.http import require_http_methods

from access_requests.models import ProjectAccessRequest
from notifications.models import Notification
from notifications.services import create_notification
from projects.models import EntrepreneurProject

from .models import Conversation, Message


User = get_user_model()
MAX_BIGINT = 9_223_372_036_854_775_807
MAX_QUERY_LENGTH = 200
MAX_PAGE_SIZE = 100
DEFAULT_PAGE_SIZE = 20
MAX_MESSAGE_LENGTH = 4000


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


def _name(user):
    return user.get_full_name() or user.email


def _conversation_queryset(user, role):
    latest_messages = Message.objects.filter(
        conversation_id=OuterRef("pk")
    ).order_by("-created_at", "-pk")
    conversations = Conversation.objects.select_related(
        "project", "investor", "entrepreneur"
    ).annotate(
        unread_count=Count(
            "messages",
            filter=Q(messages__read_at__isnull=True)
            & ~Q(messages__sender_id=user.pk),
        ),
        message_count=Count("messages", distinct=True),
        last_message_body=Subquery(latest_messages.values("body")[:1]),
        last_message_sender_id=Subquery(
            latest_messages.values("sender_id")[:1]
        ),
        last_message_at=Subquery(
            latest_messages.values("created_at")[:1]
        ),
    )
    if role == User.Role.INVESTOR:
        return conversations.filter(investor=user)
    return conversations.filter(entrepreneur=user)


def _conversation_payload(conversation):
    return {
        "id": conversation.pk,
        "projectId": conversation.project_id,
        "projectTitle": conversation.project.title,
        "investor": _name(conversation.investor),
        "entrepreneur": _name(conversation.entrepreneur),
        "lastMessageBody": conversation.last_message_body or "",
        "lastMessageSenderId": conversation.last_message_sender_id,
        "lastMessageAt": (
            conversation.last_message_at.isoformat()
            if conversation.last_message_at
            else None
        ),
        "unreadCount": conversation.unread_count,
        "createdAt": conversation.created_at.isoformat(),
    }


def _conversation_list(request, user, role):
    query = request.GET.get("q", "").strip()
    if len(query) > MAX_QUERY_LENGTH:
        return JsonResponse(
            {"detail": "La recherche ne doit pas dépasser 200 caractères."},
            status=400,
        )
    page, page_size, error = _pagination(request)
    if error:
        return error

    conversations = _conversation_queryset(user, role)
    if query:
        conversations = conversations.filter(
            Q(project__title__icontains=query)
            | Q(investor__email__icontains=query)
            | Q(investor__first_name__icontains=query)
            | Q(investor__last_name__icontains=query)
            | Q(entrepreneur__email__icontains=query)
            | Q(entrepreneur__first_name__icontains=query)
            | Q(entrepreneur__last_name__icontains=query)
        )
    total_results = conversations.count()
    page, pagination = _pagination_payload(page, page_size, total_results)
    conversations = conversations.order_by("-updated_at", "-pk")[
        (page - 1) * page_size : page * page_size
    ]
    return JsonResponse(
        {
            "conversations": [
                _conversation_payload(conversation)
                for conversation in conversations
            ],
            "pagination": pagination,
        }
    )


def _validated_message(payload, expected_fields):
    if payload is None or set(payload) != expected_fields:
        return None, "Le contenu du message est invalide."
    body = payload.get("body")
    if not isinstance(body, str):
        return None, "Le message est invalide."
    body = body.strip()
    if not body or len(body) > MAX_MESSAGE_LENGTH:
        return None, "Le message doit contenir entre 1 et 4 000 caractères."
    return body, None


def _message_payload(message, user):
    return {
        "id": message.pk,
        "senderId": message.sender_id,
        "sender": _name(message.sender),
        "body": message.body,
        "createdAt": message.created_at.isoformat(),
        "readAt": message.read_at.isoformat() if message.read_at else None,
        "isMine": message.sender_id == user.pk,
    }


def _notify_message_recipient(conversation, sender):
    recipient = (
        conversation.entrepreneur
        if sender.pk == conversation.investor_id
        else conversation.investor
    )
    create_notification(
        recipient,
        kind=Notification.Kind.MESSAGE,
        title="Nouveau message",
        body=(
            f"{_name(sender)} vous a envoyé un message au sujet de "
            f"« {conversation.project.title} »."
        ),
        target_url=(
            "/espace-investisseur/messages"
            if recipient.role == User.Role.INVESTOR
            else "/espace-entrepreneur"
        ),
    )


def _participant_conversation(request, role, conversation_id):
    conversations = Conversation.objects.select_related(
        "project", "investor", "entrepreneur"
    )
    if role == User.Role.INVESTOR:
        conversations = conversations.filter(investor=request.user)
    else:
        conversations = conversations.filter(entrepreneur=request.user)
    return get_object_or_404(conversations, pk=conversation_id)


def _conversation_messages(request, role, conversation_id):
    error = _authorized(request, role)
    if error:
        return error
    conversation = _participant_conversation(request, role, conversation_id)

    if request.method == "POST":
        body, error_message = _validated_message(
            _json_body(request), {"body"}
        )
        if error_message:
            return JsonResponse({"detail": error_message}, status=400)
        with transaction.atomic():
            message = Message.objects.create(
                conversation=conversation,
                sender=request.user,
                body=body,
            )
            conversation.save(update_fields=["updated_at"])
            _notify_message_recipient(conversation, request.user)
        return JsonResponse(
            {"message": _message_payload(message, request.user)},
            status=201,
        )

    page, page_size, error = _pagination(request)
    if error:
        return error
    messages = Message.objects.filter(conversation=conversation).select_related(
        "sender"
    )
    total_results = messages.count()
    page, pagination = _pagination_payload(page, page_size, total_results)
    messages = list(
        messages.order_by("-created_at", "-pk")[
            (page - 1) * page_size : page * page_size
        ]
    )
    messages.reverse()
    return JsonResponse(
        {
            "messages": [
                _message_payload(message, request.user) for message in messages
            ],
            "pagination": pagination,
        }
    )


@csrf_protect
@require_http_methods(["GET", "POST"])
def investor_conversations(request):
    error = _authorized(request, User.Role.INVESTOR)
    if error:
        return error
    if request.method == "GET":
        return _conversation_list(request, request.user, User.Role.INVESTOR)

    payload = _json_body(request)
    if payload is None or set(payload) != {"projectId", "body"}:
        return JsonResponse(
            {"detail": "Le contenu du nouveau message est invalide."},
            status=400,
        )
    project_id = payload["projectId"]
    if (
        isinstance(project_id, bool)
        or not isinstance(project_id, int)
        or project_id <= 0
    ):
        return JsonResponse({"detail": "Le projet sélectionné est invalide."}, status=400)
    body, error_message = _validated_message(payload, {"projectId", "body"})
    if error_message:
        return JsonResponse({"detail": error_message}, status=400)

    project = EntrepreneurProject.objects.filter(
        pk=project_id,
        status=EntrepreneurProject.Status.PUBLISHED,
    ).select_related("owner").first()
    if project is None or project.owner_id == request.user.pk:
        return JsonResponse(
            {"detail": "Ce projet n’est pas disponible pour une conversation."},
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

    lookup = {
        "investor": request.user,
        "entrepreneur": project.owner,
        "project": project,
    }
    try:
        with transaction.atomic():
            conversation, _ = Conversation.objects.get_or_create(**lookup)
    except IntegrityError:
        conversation = Conversation.objects.get(**lookup)
    with transaction.atomic():
        message = Message.objects.create(
            conversation=conversation,
            sender=request.user,
            body=body,
        )
        conversation.save(update_fields=["updated_at"])
        _notify_message_recipient(conversation, request.user)
    conversation = _conversation_queryset(
        request.user, User.Role.INVESTOR
    ).get(pk=conversation.pk)
    return JsonResponse(
        {
            "conversation": _conversation_payload(conversation),
            "message": _message_payload(message, request.user),
        },
        status=201,
    )


@csrf_protect
@require_http_methods(["GET", "POST"])
def entrepreneur_conversations(request):
    error = _authorized(request, User.Role.ENTREPRENEUR)
    if error:
        return error
    if request.method != "GET":
        return JsonResponse({"detail": "Méthode non autorisée."}, status=405)
    return _conversation_list(request, request.user, User.Role.ENTREPRENEUR)


@csrf_protect
@require_http_methods(["GET", "POST"])
def investor_conversation_messages(request, conversation_id):
    return _conversation_messages(
        request, User.Role.INVESTOR, conversation_id
    )


@csrf_protect
@require_http_methods(["GET", "POST"])
def entrepreneur_conversation_messages(request, conversation_id):
    return _conversation_messages(
        request, User.Role.ENTREPRENEUR, conversation_id
    )


@csrf_protect
@require_http_methods(["POST"])
def mark_conversation_read(request, conversation_id):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "Vous devez vous connecter."}, status=401)
    if request.user.role not in {User.Role.INVESTOR, User.Role.ENTREPRENEUR}:
        return JsonResponse(
            {"detail": "Cette fonctionnalité n’est pas autorisée pour ce compte."},
            status=403,
        )
    conversation = _participant_conversation(
        request, request.user.role, conversation_id
    )
    unread_messages = conversation.messages.filter(read_at__isnull=True).exclude(
        sender=request.user
    )
    unread_messages.update(read_at=timezone.now())
    return JsonResponse({"success": True})


@csrf_protect
@require_http_methods(["GET"])
def admin_conversations(request):
    error = _authorized(request, User.Role.ADMIN)
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

    conversations = Conversation.objects.select_related(
        "project", "investor", "entrepreneur"
    ).annotate(
        message_count=Count("messages", distinct=True),
        last_message_at=Subquery(
            Message.objects.filter(conversation_id=OuterRef("pk"))
            .order_by("-created_at", "-pk")
            .values("created_at")[:1]
        ),
    )
    if query:
        conversations = conversations.filter(
            Q(project__title__icontains=query)
            | Q(investor__email__icontains=query)
            | Q(investor__first_name__icontains=query)
            | Q(investor__last_name__icontains=query)
            | Q(entrepreneur__email__icontains=query)
            | Q(entrepreneur__first_name__icontains=query)
            | Q(entrepreneur__last_name__icontains=query)
        )
    total_results = conversations.count()
    page, pagination = _pagination_payload(page, page_size, total_results)
    conversations = conversations.order_by("-updated_at", "-pk")[
        (page - 1) * page_size : page * page_size
    ]
    return JsonResponse(
        {
            "conversations": [
                {
                    "id": conversation.pk,
                    "projectTitle": conversation.project.title,
                    "investor": _name(conversation.investor),
                    "entrepreneur": _name(conversation.entrepreneur),
                    "messageCount": conversation.message_count,
                    "lastMessageAt": (
                        conversation.last_message_at.isoformat()
                        if conversation.last_message_at
                        else None
                    ),
                    "createdAt": conversation.created_at.isoformat(),
                }
                for conversation in conversations
            ],
            "pagination": pagination,
        }
    )
