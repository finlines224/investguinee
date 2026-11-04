import json
import smtplib
from hashlib import sha256

from django.conf import settings
from django.contrib.auth import authenticate, get_user_model, login, logout
from django.contrib.auth.forms import PasswordResetForm
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.http import JsonResponse
from django.utils import timezone
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_http_methods, require_POST

User = get_user_model()
LOGIN_ATTEMPT_LIMIT = 10
RESET_ATTEMPT_LIMIT = 5


def _json_body(request):
    try:
        payload = json.loads(request.body.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        return None
    return payload if isinstance(payload, dict) else None


def _rate_limit_exceeded(request, action, limit, timeout):
    client_ip = request.META.get("REMOTE_ADDR", "unknown")
    key_digest = sha256(f"{action}:{client_ip}".encode()).hexdigest()
    cache_key = f"auth-rate-limit:{key_digest}"
    cache.add(cache_key, 0, timeout=timeout)
    try:
        count = cache.incr(cache_key)
    except ValueError:
        cache.add(cache_key, 1, timeout=timeout)
        count = 1
    return count > limit


def _rate_limited_response(retry_after):
    response = JsonResponse(
        {"detail": "Trop de demandes. Veuillez patienter avant de réessayer."},
        status=429,
    )
    response["Retry-After"] = str(retry_after)
    return response


@require_GET
@ensure_csrf_cookie
def csrf_token(request):
    from django.middleware.csrf import get_token

    return JsonResponse({"csrfToken": get_token(request)})


def _session_user_payload(user):
    return {
        "id": user.pk,
        "firstName": user.first_name,
        "lastName": user.last_name,
        "fullName": user.get_full_name() or user.email,
        "email": user.email,
        "role": user.role,
        "isVerified": user.is_verified,
    }


@require_GET
def session_view(request):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "Vous devez vous connecter."}, status=401)
    return JsonResponse({"user": _session_user_payload(request.user)})


@require_http_methods(["GET", "PATCH"])
@csrf_protect
def student_profile(request):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "Vous devez vous connecter."}, status=401)
    if request.user.role != User.Role.STUDENT:
        return JsonResponse(
            {"detail": "Cette fonctionnalité est réservée aux étudiants."},
            status=403,
        )

    profile_data = request.user.profile_data
    if not isinstance(profile_data, dict):
        return JsonResponse(
            {"detail": "Les informations du profil sont temporairement indisponibles."},
            status=500,
        )

    if request.method == "GET":
        return JsonResponse(
            {
                "institution": profile_data.get("institution", ""),
                "studyField": profile_data.get("study_field", ""),
            }
        )

    payload = _json_body(request)
    if payload is None:
        return JsonResponse(
            {"detail": "La requête doit contenir un objet JSON valide."},
            status=400,
        )

    institution = payload.get("institution")
    study_field = payload.get("studyField")
    if (
        not isinstance(institution, str)
        or not isinstance(study_field, str)
        or len(institution.strip()) > 150
        or len(study_field.strip()) > 150
    ):
        return JsonResponse(
            {"detail": "Vérifiez les informations de votre profil."},
            status=400,
        )

    profile_data["institution"] = institution.strip()
    profile_data["study_field"] = study_field.strip()
    request.user.profile_data = profile_data
    request.user.save(update_fields=["profile_data", "updated_at"])
    return JsonResponse(
        {
            "institution": profile_data["institution"],
            "studyField": profile_data["study_field"],
        }
    )


@require_http_methods(["GET", "PATCH"])
@csrf_protect
def investor_profile(request):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "Vous devez vous connecter."}, status=401)
    if request.user.role != User.Role.INVESTOR:
        return JsonResponse(
            {"detail": "Cette fonctionnalité est réservée aux investisseurs."},
            status=403,
        )

    profile_data = request.user.profile_data
    if not isinstance(profile_data, dict):
        return JsonResponse(
            {"detail": "Les informations du profil sont temporairement indisponibles."},
            status=500,
        )

    if request.method == "PATCH":
        payload = _json_body(request)
        if payload is None:
            return JsonResponse(
                {"detail": "La requête doit contenir un objet JSON valide."},
                status=400,
            )

        first_name = payload.get("firstName")
        last_name = payload.get("lastName")
        phone_number = payload.get("phoneNumber")
        profile_type = payload.get("profileType")
        sector = payload.get("sector")
        if (
            set(payload)
            != {"firstName", "lastName", "phoneNumber", "profileType", "sector"}
            or not isinstance(first_name, str)
            or not first_name.strip()
            or len(first_name.strip()) > 150
            or not isinstance(last_name, str)
            or len(last_name.strip()) > 150
            or not isinstance(phone_number, str)
            or not phone_number.strip()
            or len(phone_number.strip()) > 30
            or not isinstance(profile_type, str)
            or not profile_type.strip()
            or len(profile_type.strip()) > 150
            or not isinstance(sector, str)
            or len(sector.strip()) > 150
        ):
            return JsonResponse(
                {"detail": "Vérifiez les informations de votre profil."},
                status=400,
            )

        request.user.first_name = first_name.strip()
        request.user.last_name = last_name.strip()
        request.user.phone_number = phone_number.strip()
        profile_data["profile_type"] = profile_type.strip()
        profile_data["sector"] = sector.strip()
        request.user.profile_data = profile_data
        request.user.save(
            update_fields=[
                "first_name",
                "last_name",
                "phone_number",
                "profile_data",
                "updated_at",
            ]
        )

    return JsonResponse(
        {
            "firstName": request.user.first_name,
            "lastName": request.user.last_name,
            "fullName": request.user.get_full_name() or request.user.email,
            "email": request.user.email,
            "phoneNumber": request.user.phone_number,
            "profileType": profile_data.get("profile_type", ""),
            "sector": profile_data.get("sector", ""),
            "isVerified": request.user.is_verified,
        }
    )


@require_POST
@csrf_protect
def login_view(request):
    if _rate_limit_exceeded(request, "login", LOGIN_ATTEMPT_LIMIT, 15 * 60):
        return _rate_limited_response(15 * 60)

    payload = _json_body(request)
    if payload is None:
        return JsonResponse({"detail": "La requête doit contenir un objet JSON valide."}, status=400)

    email = payload.get("email")
    password = payload.get("password")
    if not isinstance(email, str) or not isinstance(password, str):
        return JsonResponse({"detail": "Renseignez votre adresse email et votre mot de passe."}, status=400)

    email = email.strip().lower()
    if not email or not password:
        return JsonResponse({"detail": "Renseignez votre adresse email et votre mot de passe."}, status=400)

    existing_user = User.objects.filter(email__iexact=email).only("username").first()
    username = existing_user.get_username() if existing_user else email
    user = authenticate(request, username=username, password=password)
    if user is None:
        return JsonResponse({"detail": "Adresse email ou mot de passe incorrect."}, status=400)

    login(request, user)
    remember_me = payload.get("remember_me") is True
    request.session.set_expiry(60 * 60 * 24 * 14 if remember_me else 0)
    return JsonResponse({
        "detail": "Connexion réussie.",
        "user": _session_user_payload(user),
    })


@require_POST
@csrf_protect
def register(request):
    payload = _json_body(request)
    if payload is None:
        return JsonResponse({"detail": "La requête doit contenir un objet JSON valide."}, status=400)

    full_name = payload.get("full_name")
    email = payload.get("email")
    phone_number = payload.get("phone_number", "")
    password = payload.get("password")
    role = payload.get("role")
    if not all(isinstance(value, str) for value in (full_name, email, phone_number, password, role)):
        return JsonResponse({"detail": "Certains champs obligatoires sont manquants."}, status=400)

    full_name = full_name.strip()
    email = email.strip().lower()
    phone_number = phone_number.strip()
    if not full_name or len(full_name) > 150:
        return JsonResponse({"detail": "Saisissez un nom complet valide."}, status=400)
    if not email or len(email) > 150:
        return JsonResponse({"detail": "Saisissez une adresse email valide."}, status=400)
    if not phone_number or len(phone_number) > 30:
        return JsonResponse({"detail": "Saisissez un numéro de téléphone valide."}, status=400)
    if role not in {
        User.Role.ENTREPRENEUR,
        User.Role.INVESTOR,
        User.Role.STUDENT,
    }:
        return JsonResponse({"detail": "Choisissez un type de compte valide."}, status=400)
    if payload.get("terms_accepted") is not True:
        return JsonResponse({"detail": "L’acceptation des conditions est obligatoire."}, status=400)

    first_name, _, last_name = full_name.partition(" ")
    user = User(
        username=email,
        email=email,
        first_name=first_name,
        last_name=last_name,
        phone_number=phone_number,
        role=role,
    )
    try:
        validate_password(password, user)
    except ValidationError as error:
        return JsonResponse(
            {
                "detail": "Le mot de passe ne respecte pas les exigences de sécurité.",
                "errors": {"password": error.messages},
            },
            status=400,
        )

    profile_fields = {
        User.Role.ENTREPRENEUR: ("project_name", "sector"),
        User.Role.INVESTOR: ("profile_type", "sector"),
        User.Role.STUDENT: ("institution", "study_field"),
    }[role]
    profile_data = {}
    for field in profile_fields:
        value = payload.get(field)
        if value is not None:
            if not isinstance(value, str) or len(value) > 150:
                return JsonResponse({"detail": "Une information de profil est invalide."}, status=400)
            if value:
                profile_data[field] = value

    user.profile_data = profile_data
    user.terms_accepted_at = timezone.now()
    user.marketing_consent = payload.get("marketing_consent") is True

    user.set_password(password)
    try:
        with transaction.atomic():
            if User.objects.filter(email__iexact=email).exists():
                return JsonResponse(
                    {"detail": "Un compte existe déjà pour cette adresse email."},
                    status=400,
                )
            user.save()
    except IntegrityError:
        return JsonResponse(
            {"detail": "Un compte existe déjà pour cette adresse email."},
            status=400,
        )

    return JsonResponse({"detail": "Votre compte a été créé."}, status=201)


@require_POST
@csrf_protect
def password_reset(request):
    if _rate_limit_exceeded(request, "password-reset", RESET_ATTEMPT_LIMIT, 60 * 60):
        return _rate_limited_response(60 * 60)

    payload = _json_body(request)
    email = payload.get("email") if payload else None
    if not isinstance(email, str) or not email.strip():
        return JsonResponse({"detail": "Saisissez une adresse email valide."}, status=400)

    reset_form = PasswordResetForm({"email": email.strip().lower()})
    if not reset_form.is_valid():
        return JsonResponse({"detail": "Saisissez une adresse email valide."}, status=400)

    try:
        reset_form.save(
            request=request,
            use_https=request.is_secure(),
            email_template_name="accounts/password_reset_email.html",
            subject_template_name="accounts/password_reset_subject.txt",
            extra_email_context={
                "frontend_url": settings.FRONTEND_BASE_URL.rstrip("/"),
            },
        )
    except (OSError, smtplib.SMTPException):
        return JsonResponse(
            {"detail": "Le service email est indisponible. Veuillez réessayer plus tard."},
            status=503,
        )

    return JsonResponse(
        {
            "detail": (
                "Si un compte correspond à cette adresse, les instructions de "
                "réinitialisation seront envoyées."
            )
        }
    )


@require_POST
@csrf_protect
def password_reset_confirm(request):
    payload = _json_body(request)
    if payload is None:
        return JsonResponse({"detail": "La requête doit contenir un objet JSON valide."}, status=400)

    uid = payload.get("uid")
    token = payload.get("token")
    new_password = payload.get("new_password")
    if not all(isinstance(value, str) and value for value in (uid, token, new_password)):
        return JsonResponse({"detail": "Le lien ou le nouveau mot de passe est invalide."}, status=400)

    try:
        user_id = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=user_id)
    except (ValueError, TypeError, OverflowError, User.DoesNotExist):
        return JsonResponse({"detail": "Ce lien est invalide ou a expiré. Demandez-en un nouveau."}, status=400)

    if not default_token_generator.check_token(user, token):
        return JsonResponse({"detail": "Ce lien est invalide ou a expiré. Demandez-en un nouveau."}, status=400)

    try:
        validate_password(new_password, user)
    except ValidationError:
        return JsonResponse(
            {"detail": "Choisissez un mot de passe conforme aux exigences de sécurité."},
            status=400,
        )

    user.set_password(new_password)
    user.save(update_fields=["password", "updated_at"])
    return JsonResponse({"detail": "Votre mot de passe a été modifié."})


@require_POST
@csrf_protect
def logout_view(request):
    logout(request)
    return JsonResponse({"detail": "Déconnexion réussie."})
