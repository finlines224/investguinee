"use client";

import { useEffect, useState } from "react";
import {
  createAdminTraining,
  getAdminTrainingCatalog,
  updateAdminTraining,
  type AdminTrainingInput,
  type AdminTrainingResource,
} from "../../lib/admin-api";
import { Check, Edit3, Plus, RefreshCw, Search, X } from "lucide-react";

const pageSize = 10;

const emptyTraining: AdminTrainingInput = {
  title: "",
  description: "",
  category: "Entrepreneuriat",
  format: "",
  level: "",
  url: "",
  isPublished: false,
};

function getVisiblePages(page: number, pageCount: number) {
  const firstPage = Math.max(1, Math.min(page - 2, pageCount - 4));
  return Array.from({ length: Math.min(pageCount, 5) }, (_, index) => firstPage + index);
}

function getLocalDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "Date indisponible"
    : new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(parsed);
}

export default function AdminTrainingManagement() {
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "published" | "draft">("all");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [resources, setResources] = useState<AdminTrainingResource[]>([]);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<AdminTrainingInput>(emptyTraining);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError("");
      void getAdminTrainingCatalog(
        { query, status, category, page, pageSize },
        controller.signal,
      )
        .then((catalog) => {
          if (controller.signal.aborted) return;
          setResources(catalog.resources);
          setCategories(catalog.categories);
          setPage(catalog.pagination.page);
          setPageCount(catalog.pagination.totalPages);
          setTotalResults(catalog.pagination.totalResults);
        })
        .catch((requestError: unknown) => {
          if (!controller.signal.aborted) {
            setError(
              requestError instanceof Error
                ? requestError.message
                : "Impossible de charger les formations.",
            );
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 200);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [category, page, query, retryCount, status]);

  const resetForm = () => {
    setEditingId(null);
    setForm({ ...emptyTraining });
  };

  const startEditing = (resource: AdminTrainingResource) => {
    setEditingId(resource.id);
    setForm({
      title: resource.title,
      description: resource.description,
      category: resource.category,
      format: resource.format,
      level: resource.level,
      url: resource.url,
      isPublished: resource.isPublished,
    });
    setNotice("");
    setError("");
  };

  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      if (editingId === null) {
        await createAdminTraining(form);
        setNotice("La ressource a été créée.");
        resetForm();
        setStatus("all");
        setCategory("");
        setPage(1);
      } else {
        await updateAdminTraining(editingId, form);
        setNotice("La ressource a été mise à jour.");
        resetForm();
      }
      setRetryCount((count) => count + 1);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Impossible d’enregistrer la ressource.",
      );
    } finally {
      setSaving(false);
    }
  };

  const togglePublication = async (resource: AdminTrainingResource) => {
    setError("");
    setNotice("");
    try {
      await updateAdminTraining(resource.id, {
        title: resource.title,
        description: resource.description,
        category: resource.category,
        format: resource.format,
        level: resource.level,
        url: resource.url,
        isPublished: !resource.isPublished,
      });
      setNotice(
        resource.isPublished
          ? "La ressource a été dépubliée."
          : "La ressource est maintenant publiée.",
      );
      setRetryCount((count) => count + 1);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Impossible de modifier la publication.",
      );
    }
  };

  const visiblePages = getVisiblePages(page, pageCount);
  const resultStart = totalResults ? (page - 1) * pageSize + 1 : 0;
  const resultEnd = Math.min(page * pageSize, totalResults);

  return (
    <section className="admin-training-management">
      <div className="admin-training-management__heading">
        <div>
          <div className="admin-section-placeholder__breadcrumb">
            <span>Administration</span><span aria-hidden="true">›</span><strong>Formations &amp; Événements</strong>
          </div>
          <h1>Formations &amp; Événements</h1>
          <p>Créez et publiez les ressources visibles dans l’espace étudiant.</p>
        </div>
        {editingId === null && (
          <button
            className="admin-button admin-button--primary"
            type="button"
            onClick={() => {
              setForm({ ...emptyTraining });
              setEditingId(-1);
              setError("");
              setNotice("");
            }}
          >
            <Plus size={16} /> Nouvelle ressource
          </button>
        )}
      </div>

      {notice && <p className="admin-training-message admin-training-message--success" role="status">{notice}</p>}
      {error && (
        <div className="admin-training-message admin-training-message--error" role="alert">
          <span>{error}</span>
          {!loading && (
            <button type="button" onClick={() => setRetryCount((count) => count + 1)}>
              <RefreshCw size={14} /> Actualiser
            </button>
          )}
        </div>
      )}

      {editingId !== null && (
        <form className="admin-training-form" onSubmit={(event) => void submitForm(event)}>
          <div className="admin-training-form__heading">
            <h2>{editingId === -1 ? "Créer une ressource" : "Modifier une ressource"}</h2>
            <button className="admin-icon-button" type="button" aria-label="Fermer le formulaire" onClick={resetForm}>
              <X size={18} />
            </button>
          </div>
          <label>
            Titre
            <input
              required
              maxLength={180}
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            />
          </label>
          <label className="admin-training-form__wide">
            Description
            <textarea
              required
              maxLength={5000}
              rows={4}
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            />
          </label>
          <label>
            Thème
            <select
              value={form.category}
              onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
              required
            >
              {(categories.length ? categories : [form.category]).map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
          <label>
            Format
            <input
              required
              maxLength={80}
              value={form.format}
              onChange={(event) => setForm((current) => ({ ...current, format: event.target.value }))}
            />
          </label>
          <label>
            Niveau
            <input
              required
              maxLength={60}
              value={form.level}
              onChange={(event) => setForm((current) => ({ ...current, level: event.target.value }))}
            />
          </label>
          <label className="admin-training-form__wide">
            Lien externe (facultatif)
            <input
              type="url"
              maxLength={500}
              placeholder="https://..."
              value={form.url}
              onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))}
            />
          </label>
          <label className="admin-training-form__publish">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(event) => setForm((current) => ({ ...current, isPublished: event.target.checked }))}
            />
            Publier cette ressource dans l’espace étudiant
          </label>
          <div className="admin-training-form__actions">
            <button className="admin-button admin-button--quiet" type="button" onClick={resetForm} disabled={saving}>
              Annuler
            </button>
            <button className="admin-button admin-button--primary" type="submit" disabled={saving}>
              {saving ? "Enregistrement…" : editingId === -1 ? "Créer la ressource" : "Enregistrer"}
            </button>
          </div>
        </form>
      )}

      <div className="admin-training-toolbar">
        <label className="admin-training-search">
          <Search size={16} aria-hidden="true" />
          <span className="sr-only">Rechercher une formation</span>
          <input
            type="search"
            placeholder="Rechercher une ressource..."
            value={queryInput}
            onChange={(event) => {
              setQueryInput(event.target.value);
              setQuery(event.target.value.trim());
              setPage(1);
            }}
          />
        </label>
        <label>
          <span className="sr-only">Filtrer par publication</span>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as typeof status);
              setPage(1);
            }}
          >
            <option value="all">Tous les statuts</option>
            <option value="published">Publiées</option>
            <option value="draft">Brouillons</option>
          </select>
        </label>
        <label>
          <span className="sr-only">Filtrer par thème</span>
          <select
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Tous les thèmes</option>
            {categories.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
      </div>

      <p className="admin-training-count" aria-live="polite">
        {loading && totalResults === 0
          ? "Chargement des ressources…"
          : `${totalResults} ressource${totalResults > 1 ? "s" : ""}`}
      </p>
      {error ? null : loading && resources.length === 0 ? (
        <p className="admin-training-empty" role="status">Chargement des ressources…</p>
      ) : resources.length ? (
        <div className="admin-training-list" aria-busy={loading}>
          {resources.map((resource) => (
            <article className="admin-training-row" key={resource.id}>
              <div className="admin-training-row__content">
                <div className="admin-training-row__meta">
                  <span>{resource.category}</span>
                  <span className={resource.isPublished ? "is-published" : "is-draft"}>
                    {resource.isPublished ? "Publiée" : "Brouillon"}
                  </span>
                </div>
                <h2>{resource.title}</h2>
                <p>{resource.description}</p>
                <small>{resource.format} · {resource.level} · Modifiée le {getLocalDate(resource.updatedAt)}</small>
              </div>
              <div className="admin-training-row__actions">
                <button type="button" onClick={() => startEditing(resource)}>
                  <Edit3 size={15} /> Modifier
                </button>
                <button
                  type="button"
                  onClick={() => void togglePublication(resource)}
                  disabled={loading}
                >
                  {resource.isPublished ? <X size={15} /> : <Check size={15} />}
                  {resource.isPublished ? "Dépublier" : "Publier"}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="admin-training-empty" role="status">
          <h2>Aucune ressource trouvée</h2>
          <p>Modifiez les filtres ou créez une nouvelle ressource.</p>
        </div>
      )}

      {totalResults > 0 && (
        <nav className="admin-training-pagination" aria-label="Pagination des formations">
          <p>Affichage de <strong>{resultStart}–{resultEnd}</strong> sur <strong>{totalResults}</strong></p>
          <div>
            <button type="button" disabled={page === 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))}>Précédent</button>
            {visiblePages.map((pageNumber) => (
              <button
                key={pageNumber}
                className={pageNumber === page ? "is-current" : ""}
                type="button"
                aria-current={pageNumber === page ? "page" : undefined}
                disabled={loading}
                onClick={() => setPage(pageNumber)}
              >
                {pageNumber}
              </button>
            ))}
            <button type="button" disabled={page === pageCount || loading} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Suivant</button>
          </div>
        </nav>
      )}
    </section>
  );
}
