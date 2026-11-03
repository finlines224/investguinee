from django.conf import settings
from django.db import models


class EntrepreneurProject(models.Model):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Brouillon"
        SUBMITTED = "SUBMITTED", "Soumis pour examen"
        APPROVED = "APPROVED", "Validé"
        REJECTED = "REJECTED", "À compléter"
        IN_REVIEW = "IN_REVIEW", "En cours d’examen"
        PUBLISHED = "PUBLISHED", "Publié"
        SUSPENDED = "SUSPENDED", "Suspendu"
        ARCHIVED = "ARCHIVED", "Archivé"

    class Visibility(models.TextChoices):
        PUBLIC = "PUBLIC", "Public"
        MEMBERS_ONLY = "MEMBERS_ONLY", "Membres uniquement"
        RESTRICTED = "RESTRICTED", "Restreint"

    class Stage(models.TextChoices):
        IDEA = "Idée", "Idée"
        FEASIBILITY = "Étude de faisabilité", "Étude de faisabilité"
        PROTOTYPE = "Prototype", "Prototype"
        DEVELOPMENT = "En développement", "En développement"
        OPERATIONAL = "Opérationnel", "Opérationnel"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="entrepreneur_projects",
    )
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="projects",
    )
    title = models.CharField(max_length=160)
    description = models.TextField(max_length=5000)
    slug = models.SlugField(max_length=220, unique=True, null=True, blank=True)
    summary = models.CharField(max_length=600, blank=True)
    problem_statement = models.TextField(blank=True)
    proposed_solution = models.TextField(blank=True)
    product_description = models.TextField(blank=True)
    target_market = models.TextField(blank=True)
    business_model = models.TextField(blank=True)
    sector = models.CharField(max_length=40)
    region = models.CharField(max_length=40)
    funding_goal = models.PositiveBigIntegerField()
    currency = models.CharField(max_length=3, default="GNF")
    funding_use = models.TextField(blank=True)
    country_code = models.CharField(max_length=2, default="GN")
    city = models.CharField(max_length=120, blank=True)
    stage = models.CharField(max_length=40, choices=Stage.choices)
    status = models.CharField(
        max_length=12,
        choices=Status.choices,
        default=Status.DRAFT,
    )
    categories = models.ManyToManyField(
        "projects.Category",
        through="projects.ProjectCategory",
        related_name="projects",
        blank=True,
    )
    team_members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        through="projects.ProjectTeamMember",
        related_name="project_team_memberships",
        blank=True,
    )
    visibility = models.CharField(
        max_length=20,
        choices=Visibility.choices,
        default=Visibility.PUBLIC,
    )
    moderation_note = models.TextField(blank=True)
    published_at = models.DateTimeField(null=True, blank=True)
    archived_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at", "-pk"]
        indexes = [
            models.Index(fields=["status", "published_at"], name="project_status_pub_idx"),
            models.Index(fields=["owner", "created_at"], name="project_owner_created_idx"),
            models.Index(fields=["stage", "country_code"], name="project_stage_country_idx"),
        ]

    def __str__(self):
        return self.title


class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=120, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["sort_order", "name"]
        verbose_name_plural = "categories"

    def __str__(self):
        return self.name


class ProjectCategory(models.Model):
    project = models.ForeignKey(
        EntrepreneurProject,
        on_delete=models.CASCADE,
        related_name="category_links",
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="project_links",
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["project", "category"],
                name="unique_project_category",
            ),
        ]


class ProjectTeamMember(models.Model):
    project = models.ForeignKey(
        EntrepreneurProject,
        on_delete=models.CASCADE,
        related_name="team_memberships",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="project_memberships",
    )
    team_role = models.CharField(max_length=100)
    display_order = models.PositiveIntegerField(default=0)
    can_manage_project = models.BooleanField(default=False)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["display_order", "pk"]
        constraints = [
            models.UniqueConstraint(
                fields=["project", "user"],
                name="unique_project_team_member",
            ),
        ]


class ProjectVersion(models.Model):
    project = models.ForeignKey(
        EntrepreneurProject,
        on_delete=models.PROTECT,
        related_name="versions",
    )
    version_number = models.PositiveIntegerField()
    title_snapshot = models.CharField(max_length=200)
    summary_snapshot = models.TextField()
    content_snapshot = models.JSONField(default=dict)
    change_summary = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="created_project_versions",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["project_id", "version_number"]
        constraints = [
            models.UniqueConstraint(
                fields=["project", "version_number"],
                name="unique_project_version_number",
            ),
        ]


class Favorite(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="project_favorites",
    )
    project = models.ForeignKey(
        EntrepreneurProject,
        on_delete=models.CASCADE,
        related_name="favorites",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "project"],
                name="unique_user_project_favorite",
            ),
        ]
