"use client";

import { useEffect, useState } from "react";
import {
  getStudentTrainingCatalog,
  type StudentTrainingResource,
} from "../../lib/student-training-api";
import ProjectIcon from "../projects/ProjectIcon";

const pageSize = 6;
const allCategoriesLabel = "Toutes les ressources";

function resourceIcon(category: string) {
  if (category === "Entrepreneuriat") return "rocket";
  if (category === "Finance") return "handshake";
  return "folder";
}

function getSafeResourceUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function getVisiblePages(page: number, pageCount: number) {
  const firstPage = Math.max(1, Math.min(page - 2, pageCount - 4));
  return Array.from({ length: Math.min(pageCount, 5) }, (_, index) => firstPage + index);
}

export default function StudentTrainingCatalog() {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [resources, setResources] = useState<StudentTrainingResource[]>([]);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError("");
      void getStudentTrainingCatalog(
        {
          query: query.trim(),
          category: selectedCategory,
          page,
          pageSize,
        },
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
          if (controller.signal.aborted) return;
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Impossible de charger les formations.",
          );
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [page, query, retryCount, selectedCategory]);

  const resetFilters = () => {
    setQuery("");
    setSelectedCategory("");
    setPage(1);
  };

  const currentPage = page;
  const visiblePages = getVisiblePages(currentPage, pageCount);
  const resultStart = totalResults === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const resultEnd = Math.min(currentPage * pageSize, totalResults);
  const hasActiveFilters = Boolean(query.trim() || selectedCategory);

  return (
    <section className="student-training-view" aria-labelledby="student-training-heading">
      <div className="student-training-view__heading">
        <span>VOTRE ESPACE ÉTUDIANT</span>
        <h1 id="student-training-heading">Formations et ressources</h1>
        <p>Parcourez les ressources publiées et filtrez-les par thème.</p>
      </div>

      <section
        className="student-resources student-training-view__catalog"
        aria-label="Ressources pédagogiques"
        aria-busy={loading}
      >
        <div className="student-resources__controls">
          <div className="student-resource-search">
            <ProjectIcon name="search" size={18} />
            <input
              aria-label="Rechercher une ressource"
              type="search"
              placeholder="Rechercher une ressource..."
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
            />
            {query && (
              <button
                type="button"
                aria-label="Effacer la recherche"
                onClick={() => {
                  setQuery("");
                  setPage(1);
                }}
              >
                <ProjectIcon name="x" size={16} />
              </button>
            )}
          </div>
          <div className="student-resource-filters" role="group" aria-label="Filtrer les ressources par thème">
            {[allCategoriesLabel, ...categories].map((category) => {
              const value = category === allCategoriesLabel ? "" : category;
              return (
                <button
                  className={
                    selectedCategory === value
                      ? "student-resource-filter student-resource-filter--active"
                      : "student-resource-filter"
                  }
                  type="button"
                  key={category}
                  aria-pressed={selectedCategory === value}
                  onClick={() => {
                    setSelectedCategory(value);
                    setPage(1);
                  }}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>
        <p className="student-resources__count" aria-live="polite">
          {loading && totalResults === 0
            ? "Chargement des ressources…"
            : `${totalResults} ressource${totalResults > 1 ? "s" : ""} publiée${totalResults > 1 ? "s" : ""}`}
        </p>
        {error ? (
          <div className="student-resources__empty" role="alert">
            <ProjectIcon name="refresh" size={23} />
            <h3>Le catalogue est indisponible</h3>
            <p>{error}</p>
            <button type="button" onClick={() => setRetryCount((count) => count + 1)}>
              Réessayer
            </button>
          </div>
        ) : loading && resources.length === 0 ? (
          <p className="student-resources__empty" role="status">Chargement des ressources…</p>
        ) : resources.length > 0 ? (
          <div className="student-resources__grid">
            {resources.map((resource) => {
              const safeUrl = getSafeResourceUrl(resource.url);
              return (
                <article className="student-resource" key={resource.id}>
                  <div className="student-resource__top">
                    <span className="student-resource__icon">
                      <ProjectIcon name={resourceIcon(resource.category)} size={21} />
                    </span>
                    <span className="student-resource__category">{resource.category}</span>
                  </div>
                  <h3>{resource.title}</h3>
                  <p>{resource.description}</p>
                  <div className="student-resource__meta">
                    <span><ProjectIcon name="folder" size={14} />{resource.format}</span>
                    <span><ProjectIcon name="eye" size={14} />{resource.level}</span>
                  </div>
                  {safeUrl ? (
                    <a
                      className="student-resource__availability student-resource__availability--link"
                      href={safeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span aria-hidden="true" /> Ouvrir la ressource
                    </a>
                  ) : (
                    <span className="student-resource__availability">
                      <span aria-hidden="true" /> Ressource publiée
                    </span>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="student-resources__empty" role="status">
            <ProjectIcon name="search" size={23} />
            <h3>
              {hasActiveFilters
                ? "Aucune ressource ne correspond à votre recherche"
                : "Aucune ressource publiée pour le moment"}
            </h3>
            <p>
              {hasActiveFilters
                ? "Essayez un autre mot-clé ou choisissez un autre thème."
                : "Les nouvelles formations et ressources publiées apparaîtront ici."}
            </p>
            {hasActiveFilters && (
              <button type="button" onClick={resetFilters}>
                Réinitialiser la recherche
              </button>
            )}
          </div>
        )}
        {totalResults > 0 && (
          <nav className="student-training-pagination" aria-label="Pagination des ressources">
            <p>
              Affichage de <strong>{resultStart}–{resultEnd}</strong> sur{" "}
              <strong>{totalResults}</strong> ressource{totalResults > 1 ? "s" : ""}
            </p>
            <div className="student-training-pagination__controls">
              <button
                type="button"
                aria-label="Page précédente"
                disabled={currentPage === 1 || loading}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                <ProjectIcon name="arrow" size={16} />
              </button>
              {visiblePages.map((pageNumber) => (
                <button
                  className={pageNumber === currentPage ? "student-training-pagination__page--active" : ""}
                  type="button"
                  aria-label={`Page ${pageNumber}`}
                  aria-current={pageNumber === currentPage ? "page" : undefined}
                  disabled={loading}
                  key={pageNumber}
                  onClick={() => setPage(pageNumber)}
                >
                  {pageNumber}
                </button>
              ))}
              <button
                type="button"
                aria-label="Page suivante"
                disabled={currentPage === pageCount || loading}
                onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
              >
                <ProjectIcon name="arrow" size={16} />
              </button>
            </div>
          </nav>
        )}
        <p className="student-resources__disclaimer">
          L’inscription et le suivi de progression des formations ne sont pas encore disponibles.
        </p>
      </section>
    </section>
  );
}
