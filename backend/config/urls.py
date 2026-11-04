"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from accounts import views as account_views
from accounts import admin_views as account_admin_views
from access_requests import views as access_request_views
from appointments import views as appointment_views
from messaging import views as messaging_views
from notifications import views as notification_views
from projects import views as project_views
from projects import admin_views as project_admin_views
from organizations import admin_views as organization_admin_views
from subscriptions import views as subscription_views
from trainings import views as training_views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/csrf/', account_views.csrf_token, name='auth-csrf'),
    path('api/auth/session/', account_views.session_view, name='auth-session'),
    path('api/student/profile/', account_views.student_profile, name='student-profile'),
    path('api/investor/profile/', account_views.investor_profile, name='investor-profile'),
    path(
        'api/investor/subscriptions/',
        subscription_views.investor_subscriptions,
        name='investor-subscriptions',
    ),
    path(
        'api/admin/overview/',
        account_admin_views.admin_overview,
        name='admin-overview',
    ),
    path(
        'api/admin/users/',
        account_admin_views.admin_users,
        name='admin-users',
    ),
    path(
        'api/admin/projects/',
        project_admin_views.admin_projects,
        name='admin-projects',
    ),
    path(
        'api/admin/organizations/',
        organization_admin_views.admin_organizations,
        name='admin-organizations',
    ),
    path(
        'api/admin/access-requests/',
        access_request_views.admin_access_requests,
        name='admin-access-requests',
    ),
    path(
        'api/admin/access-requests/<int:request_id>/',
        access_request_views.admin_access_request_decision,
        name='admin-access-request-decision',
    ),
    path(
        'api/investor/access-requests/',
        access_request_views.investor_access_requests,
        name='investor-access-requests',
    ),
    path(
        'api/investor/access-requests/projects/',
        access_request_views.investor_access_request_projects,
        name='investor-access-request-projects',
    ),
    path(
        'api/investor/appointments/',
        appointment_views.investor_appointments,
        name='investor-appointments',
    ),
    path(
        'api/investor/appointments/<int:appointment_id>/',
        appointment_views.investor_appointment_cancel,
        name='investor-appointment-cancel',
    ),
    path(
        'api/entrepreneur/appointments/',
        appointment_views.entrepreneur_appointments,
        name='entrepreneur-appointments',
    ),
    path(
        'api/entrepreneur/appointments/<int:appointment_id>/',
        appointment_views.entrepreneur_appointment_decision,
        name='entrepreneur-appointment-decision',
    ),
    path(
        'api/admin/appointments/',
        appointment_views.admin_appointments,
        name='admin-appointments',
    ),
    path(
        'api/investor/conversations/',
        messaging_views.investor_conversations,
        name='investor-conversations',
    ),
    path(
        'api/investor/conversations/<int:conversation_id>/messages/',
        messaging_views.investor_conversation_messages,
        name='investor-conversation-messages',
    ),
    path(
        'api/entrepreneur/conversations/',
        messaging_views.entrepreneur_conversations,
        name='entrepreneur-conversations',
    ),
    path(
        'api/entrepreneur/conversations/<int:conversation_id>/messages/',
        messaging_views.entrepreneur_conversation_messages,
        name='entrepreneur-conversation-messages',
    ),
    path(
        'api/conversations/<int:conversation_id>/read/',
        messaging_views.mark_conversation_read,
        name='conversation-mark-read',
    ),
    path(
        'api/admin/conversations/',
        messaging_views.admin_conversations,
        name='admin-conversations',
    ),
    path(
        'api/notifications/',
        notification_views.user_notifications,
        name='user-notifications',
    ),
    path(
        'api/notifications/<int:notification_id>/',
        notification_views.user_notification_detail,
        name='user-notification-detail',
    ),
    path(
        'api/admin/notifications/',
        notification_views.admin_notification_broadcasts,
        name='admin-notification-broadcasts',
    ),
    path('api/auth/login/', account_views.login_view, name='auth-login'),
    path('api/auth/register/', account_views.register, name='auth-register'),
    path('api/auth/logout/', account_views.logout_view, name='auth-logout'),
    path('api/auth/password-reset/', account_views.password_reset, name='auth-password-reset'),
    path(
        'api/auth/password-reset/confirm/',
        account_views.password_reset_confirm,
        name='auth-password-reset-confirm',
    ),
    path('api/home/', project_views.homepage_data, name='homepage-data'),
    path('api/projects/', project_views.public_projects, name='public-projects'),
    path('api/projects/<slug:slug>/', project_views.public_project_detail, name='public-project-detail'),
    path('api/student/favorites/', project_views.student_favorites, name='student-favorites'),
    path(
        'api/student/trainings/',
        training_views.student_trainings,
        name='student-trainings',
    ),
    path(
        'api/admin/trainings/',
        training_views.admin_trainings,
        name='admin-trainings',
    ),
    path(
        'api/admin/trainings/<int:resource_id>/',
        training_views.admin_training_update,
        name='admin-training-update',
    ),
    path(
        'api/admin/trainings/create/',
        training_views.admin_training_create,
        name='admin-training-create',
    ),
    path(
        'api/entrepreneur/projects/',
        project_views.entrepreneur_projects,
        name='entrepreneur-projects',
    ),
    path(
        'api/entrepreneur/projects/<int:project_id>/',
        project_views.entrepreneur_project_detail,
        name='entrepreneur-project-detail',
    ),
]
